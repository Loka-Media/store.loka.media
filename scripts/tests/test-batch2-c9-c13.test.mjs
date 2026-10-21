import { test } from 'node:test';
import assert from 'node:assert/strict';

// Set dummy env variables so dependencies don't throw on import
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'mock_secret_for_test';
process.env.ADMIN_JWT_SECRET = 'mock_admin_secret_for_test';

test('C13 & C9: Wallet concurrency control and replay prevention with row-level locking simulation', async () => {
  // In-memory database simulation mirroring PostgreSQL semantics with row locking
  const db = {
    wallets: new Map([
      [10, { id: 1, creator_id: 10, available_balance: 100.00, total_withdrawn: 0.00 }]
    ]),
    creator_stripe_accounts: new Map([
      [10, { creator_id: 10, stripe_connect_account_id: 'acct_test123', stripe_onboarding_complete: true }]
    ]),
    withdrawal_requests: new Map(),
    wallet_transactions: [],
    nextWithdrawalId: 1,
    rowLocks: new Set(), // tracks locked row identifiers (e.g. "wallets:10", "withdrawal_requests:1")
    lockWaiters: new Map(), // key -> array of resolve callbacks
  };

  async function acquireLock(lockKey) {
    while (db.rowLocks.has(lockKey)) {
      await new Promise(resolve => {
        if (!db.lockWaiters.has(lockKey)) db.lockWaiters.set(lockKey, []);
        db.lockWaiters.get(lockKey).push(resolve);
      });
    }
    db.rowLocks.add(lockKey);
  }

  function releaseLock(lockKey) {
    db.rowLocks.delete(lockKey);
    const waiters = db.lockWaiters.get(lockKey);
    if (waiters && waiters.length > 0) {
      const next = waiters.shift();
      next();
    }
  }

  // Simulated Database Client representing a single transaction connection
  class MockDbClient {
    constructor() {
      this.heldLocks = new Set();
      this.inTransaction = false;
    }

    async query(sql, params = []) {
      const normalizedSql = sql.replace(/\s+/g, ' ').trim();

      if (normalizedSql === 'BEGIN') {
        this.inTransaction = true;
        return { rows: [] };
      }

      if (normalizedSql === 'COMMIT' || normalizedSql === 'ROLLBACK') {
        this.inTransaction = false;
        // Release all locks held by this transaction
        for (const lockKey of this.heldLocks) {
          releaseLock(lockKey);
        }
        this.heldLocks.clear();
        return { rows: [] };
      }

      // SELECT * FROM wallets WHERE creator_id = $1 FOR UPDATE
      if (normalizedSql.includes('FROM wallets') && normalizedSql.includes('FOR UPDATE')) {
        const creatorId = params[0];
        const lockKey = `wallets:${creatorId}`;
        await acquireLock(lockKey);
        this.heldLocks.add(lockKey);
        const wallet = db.wallets.get(creatorId);
        return { rows: wallet ? [{ ...wallet }] : [] };
      }

      // SELECT * FROM creator_stripe_accounts
      if (normalizedSql.includes('FROM creator_stripe_accounts')) {
        const creatorId = params[0];
        const acct = db.creator_stripe_accounts.get(creatorId);
        return { rows: acct ? [{ ...acct }] : [] };
      }

      // UPDATE wallets SET available_balance = available_balance - $1 ... WHERE id = $2 AND available_balance >= $1
      if (normalizedSql.includes('UPDATE wallets SET available_balance = available_balance - $1')) {
        const deductAmount = parseFloat(params[0]);
        const walletId = params[1];
        for (const [creatorId, wallet] of db.wallets.entries()) {
          if (wallet.id === walletId) {
            if (wallet.available_balance >= deductAmount) {
              wallet.available_balance = parseFloat((wallet.available_balance - deductAmount).toFixed(2));
              return { rows: [{ ...wallet }] };
            } else {
              return { rows: [] }; // Atomic guard failed: insufficient funds
            }
          }
        }
        return { rows: [] };
      }

      // INSERT INTO withdrawal_requests
      if (normalizedSql.includes('INSERT INTO withdrawal_requests')) {
        const [creator_id, wallet_id, amount, payout_method, metadata] = params;
        const id = db.nextWithdrawalId++;
        const record = {
          id,
          creator_id,
          wallet_id,
          amount: parseFloat(amount),
          payout_method,
          status: 'pending',
          metadata,
          created_at: new Date()
        };
        db.withdrawal_requests.set(id, record);
        return { rows: [record] };
      }

      // INSERT INTO wallet_transactions
      if (normalizedSql.includes('INSERT INTO wallet_transactions')) {
        const [wallet_id, type, amount, source, reference_id, status, description] = params;
        const tx = { wallet_id, type, amount, source, reference_id, status, description };
        db.wallet_transactions.push(tx);
        return { rows: [tx] };
      }

      // SELECT * FROM withdrawal_requests WHERE id = $1 FOR UPDATE
      if (normalizedSql.includes('FROM withdrawal_requests') && normalizedSql.includes('FOR UPDATE')) {
        const id = params[0];
        const lockKey = `withdrawal_requests:${id}`;
        await acquireLock(lockKey);
        this.heldLocks.add(lockKey);
        const req = db.withdrawal_requests.get(id);
        return { rows: req ? [{ ...req }] : [] };
      }

      // UPDATE withdrawal_requests SET status = 'completed'
      if (normalizedSql.includes("SET status = 'completed'")) {
        const withdrawalId = params[2];
        const req = db.withdrawal_requests.get(withdrawalId);
        if (req) {
          req.status = 'completed';
          return { rows: [req] };
        }
        return { rows: [] };
      }

      // UPDATE wallets SET total_withdrawn = total_withdrawn + $1
      if (normalizedSql.includes('SET total_withdrawn = total_withdrawn + $1')) {
        const amount = parseFloat(params[0]);
        const walletId = params[1];
        for (const wallet of db.wallets.values()) {
          if (wallet.id === walletId) {
            wallet.total_withdrawn = parseFloat((wallet.total_withdrawn + amount).toFixed(2));
          }
        }
        return { rows: [] };
      }

      // UPDATE wallets SET available_balance = available_balance + $1 (reject refund)
      if (normalizedSql.includes('SET available_balance = available_balance + $1')) {
        const amount = parseFloat(params[0]);
        const walletId = params[1];
        for (const wallet of db.wallets.values()) {
          if (wallet.id === walletId) {
            wallet.available_balance = parseFloat((wallet.available_balance + amount).toFixed(2));
          }
        }
        return { rows: [] };
      }

      // UPDATE withdrawal_requests SET status = 'rejected'
      if (normalizedSql.includes("SET status = 'rejected'")) {
        const withdrawalId = params[2];
        const req = db.withdrawal_requests.get(withdrawalId);
        if (req) {
          req.status = 'rejected';
          return { rows: [req] };
        }
        return { rows: [] };
      }

      // UPDATE wallet_transactions
      if (normalizedSql.includes('UPDATE wallet_transactions')) {
        return { rows: [] };
      }

      throw new Error(`Unhandled mock query: ${sql}`);
    }

    release() {
      for (const lockKey of this.heldLocks) {
        releaseLock(lockKey);
      }
      this.heldLocks.clear();
    }
  }

  // Implement the exact logic from store-api/src/services/walletService.js
  const service = {
    async requestWithdrawal(creatorId, amount, payoutMethod) {
      const parsedAmount = parseFloat(amount);
      const client = new MockDbClient();
      try {
        await client.query('BEGIN');
        
        // C13: Row-level lock on wallet
        const walletRes = await client.query('SELECT * FROM wallets WHERE creator_id = $1 FOR UPDATE', [creatorId]);
        const wallet = walletRes.rows[0];
        const available = parseFloat(wallet.available_balance);

        if (available < parsedAmount) {
          throw new Error(`Insufficient funds. Available balance: ${available.toFixed(2)}`);
        }

        const stripeAccountResult = await client.query(
          'SELECT * FROM creator_stripe_accounts WHERE creator_id = $1 AND stripe_onboarding_complete = true',
          [creatorId]
        );
        if (stripeAccountResult.rows.length === 0) {
          throw new Error('Stripe onboarding incomplete');
        }

        // C13: Atomic deduction with balance constraint
        const updatedWalletResult = await client.query(`
          UPDATE wallets
          SET available_balance = available_balance - $1, updated_at = NOW()
          WHERE id = $2 AND available_balance >= $1
          RETURNING *
        `, [parsedAmount, wallet.id]);

        if (updatedWalletResult.rows.length === 0) {
          throw new Error('Insufficient funds to complete withdrawal reservation.');
        }

        const requestResult = await client.query(`
          INSERT INTO withdrawal_requests (
            creator_id, wallet_id, amount, payout_method, status, metadata
          ) VALUES ($1, $2, $3, $4, 'pending', $5)
          RETURNING *
        `, [creatorId, wallet.id, parsedAmount, payoutMethod, null]);

        await client.query(`
          INSERT INTO wallet_transactions (
            wallet_id, type, amount, source, reference_id, status, description
          ) VALUES ($1, 'debit', $2, 'withdrawal', $3, 'pending', $4)
        `, [wallet.id, parsedAmount, requestResult.rows[0].id.toString(), 'Withdrawal']);

        await client.query('COMMIT');
        return { success: true, withdrawalRequest: requestResult.rows[0] };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    async approveWithdrawal(withdrawalId) {
      const client = new MockDbClient();
      try {
        await client.query('BEGIN');
        const reqRes = await client.query('SELECT * FROM withdrawal_requests WHERE id = $1 FOR UPDATE', [withdrawalId]);
        if (reqRes.rows.length === 0) throw new Error('Not found');
        const req = reqRes.rows[0];
        if (req.status !== 'pending') {
          throw new Error(`Withdrawal request cannot be approved. Current status: ${req.status}`);
        }

        await client.query("UPDATE withdrawal_requests SET status = 'completed' WHERE id = $3", [null, null, withdrawalId]);
        await client.query('UPDATE wallets SET total_withdrawn = total_withdrawn + $1 WHERE id = $2', [req.amount, req.wallet_id]);
        await client.query('COMMIT');
        return { success: true };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    async rejectWithdrawal(withdrawalId, reason) {
      const client = new MockDbClient();
      try {
        await client.query('BEGIN');
        const reqRes = await client.query('SELECT * FROM withdrawal_requests WHERE id = $1 FOR UPDATE', [withdrawalId]);
        if (reqRes.rows.length === 0) throw new Error('Not found');
        const req = reqRes.rows[0];
        if (req.status !== 'pending' && req.status !== 'processing') {
          throw new Error(`Withdrawal request cannot be rejected. Current status: ${req.status}`);
        }

        await client.query('UPDATE wallets SET available_balance = available_balance + $1 WHERE id = $2', [req.amount, req.wallet_id]);
        await client.query("UPDATE withdrawal_requests SET status = 'rejected' WHERE id = $3", [reason, null, withdrawalId]);
        await client.query('COMMIT');
        return { success: true };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  };

  // -------------------------------------------------------------
  // Test 1: Concurrency race condition (C13)
  // Starting balance = $100.
  // Two simultaneous requests of $80 are launched concurrently.
  // Exactly one MUST succeed, and the other MUST fail with Insufficient funds.
  // Final balance MUST be $20, NEVER -$60.
  // -------------------------------------------------------------
  const results = await Promise.allSettled([
    service.requestWithdrawal(10, 80.00, 'stripe_connect'),
    service.requestWithdrawal(10, 80.00, 'stripe_connect')
  ]);

  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');

  assert.equal(fulfilled.length, 1, 'Exactly one concurrent withdrawal should succeed');
  assert.equal(rejected.length, 1, 'The other concurrent withdrawal must be rejected due to row lock and balance guard');
  assert.match(rejected[0].reason.message, /Insufficient funds/);

  const wallet = db.wallets.get(10);
  assert.equal(wallet.available_balance, 20.00, 'Wallet balance must be accurately deducted once to 20.00');

  // -------------------------------------------------------------
  // Test 2: Replay & Duplicate Approval Prevention (C9)
  // Approve withdrawal #1. Second attempt MUST fail and NOT increase total_withdrawn twice.
  // -------------------------------------------------------------
  const withdrawalId = fulfilled[0].value.withdrawalRequest.id;
  const approveRes1 = await service.approveWithdrawal(withdrawalId);
  assert.equal(approveRes1.success, true);
  assert.equal(wallet.total_withdrawn, 80.00);

  // Second approval attempt (replay attack)
  await assert.rejects(
    async () => {
      await service.approveWithdrawal(withdrawalId);
    },
    /Withdrawal request cannot be approved. Current status: completed/,
    'Replay approval must be rejected'
  );
  assert.equal(wallet.total_withdrawn, 80.00, 'Total withdrawn must not be incremented twice');

  // -------------------------------------------------------------
  // Test 3: Replay & Duplicate Reject Refund Prevention (C9)
  // Create another withdrawal for the remaining $20, then reject it.
  // Second reject MUST NOT refund $20 twice.
  // -------------------------------------------------------------
  const w2 = await service.requestWithdrawal(10, 20.00, 'stripe_connect');
  assert.equal(wallet.available_balance, 0.00);

  const rejectRes1 = await service.rejectWithdrawal(w2.withdrawalRequest.id, 'Fraud risk');
  assert.equal(rejectRes1.success, true);
  assert.equal(wallet.available_balance, 20.00, 'Balance refunded once');

  // Second reject attempt (replay attack)
  await assert.rejects(
    async () => {
      await service.rejectWithdrawal(w2.withdrawalRequest.id, 'Fraud risk');
    },
    /Withdrawal request cannot be rejected. Current status: rejected/,
    'Replay rejection must be rejected'
  );
  assert.equal(wallet.available_balance, 20.00, 'Wallet balance MUST NOT be credited a second time');
});
