const fs = require('fs');
const path = require('path');

const walletServiceFile = path.resolve(__dirname, '../../store-api.loka.media/src/services/walletService.js');
let code = fs.readFileSync(walletServiceFile, 'utf8');

// 1. Update getOrCreateWallet to support forUpdate
const oldGetOrCreate = `  async getOrCreateWallet(creatorId, client = null) {
    const dbClient = client || pool;
    
    // Check if wallet exists
    const result = await dbClient.query(
      'SELECT * FROM wallets WHERE creator_id = $1',
      [creatorId]
    );`;

const newGetOrCreate = `  async getOrCreateWallet(creatorId, client = null, forUpdate = false) {
    const dbClient = client || pool;
    
    // Check if wallet exists (with row-level lock if forUpdate is specified)
    const query = forUpdate
      ? 'SELECT * FROM wallets WHERE creator_id = $1 FOR UPDATE'
      : 'SELECT * FROM wallets WHERE creator_id = $1';

    const result = await dbClient.query(query, [creatorId]);`;

// Regex replacement to handle CRLF / LF line endings
const getOrCreateRegex = /async getOrCreateWallet\(creatorId, client = null\) \{[\s\S]*?const result = await dbClient\.query\(\r?\n\s*'SELECT \* FROM wallets WHERE creator_id = \$1',\r?\n\s*\[creatorId\]\r?\n\s*\);/;

if (getOrCreateRegex.test(code)) {
  code = code.replace(getOrCreateRegex, newGetOrCreate);
  console.log('✅ Patched getOrCreateWallet with forUpdate row locking');
} else {
  console.warn('⚠️ getOrCreateWallet regex did not match; checking if already patched');
}

// 2. Update requestWithdrawal to lock row and enforce available_balance >= amount
const oldRequestWithdrawal = `      const wallet = await this.getOrCreateWallet(creatorId, client);
      const available = parseFloat(wallet.available_balance);
      
      if (available < parsedAmount) {
        throw new Error(\`Insufficient funds. Available balance: $\${available.toFixed(2)}\`);
      }`;

const newRequestWithdrawal = `      // Lock wallet row exclusively to prevent race conditions on concurrent withdrawals (C13)
      const wallet = await this.getOrCreateWallet(creatorId, client, true);
      const available = parseFloat(wallet.available_balance);
      
      if (available < parsedAmount) {
        throw new Error(\`Insufficient funds. Available balance: $\${available.toFixed(2)}\`);
      }`;

const requestRegex = /const wallet = await this\.getOrCreateWallet\(creatorId, client\);\r?\n\s*const available = parseFloat\(wallet\.available_balance\);\r?\n\s*if \(available < parsedAmount\) \{[\s\S]*?throw new Error\(`Insufficient funds\. Available balance: \$\$\{available\.toFixed\(2\)\}`\);\r?\n\s*\}/;

if (requestRegex.test(code)) {
  code = code.replace(requestRegex, newRequestWithdrawal);
  console.log('✅ Patched requestWithdrawal with row-level locking call');
}

const oldDeduct = `      // Deduct from available balance
      const updatedWalletResult = await client.query(\`
        UPDATE wallets
        SET available_balance = available_balance - $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      \`, [parsedAmount, wallet.id]);`;

const newDeduct = `      // Deduct from available balance with atomic balance constraint (C13)
      const updatedWalletResult = await client.query(\`
        UPDATE wallets
        SET available_balance = available_balance - $1, updated_at = NOW()
        WHERE id = $2 AND available_balance >= $1
        RETURNING *
      \`, [parsedAmount, wallet.id]);

      if (updatedWalletResult.rows.length === 0) {
        throw new Error('Insufficient funds to complete withdrawal reservation.');
      }`;

const deductRegex = /\/\/\s*Deduct from available balance\r?\n\s*const updatedWalletResult = await client\.query\(`\r?\n\s*UPDATE wallets\r?\n\s*SET available_balance = available_balance - \$1, updated_at = NOW\(\)\r?\n\s*WHERE id = \$2\r?\n\s*RETURNING \*\r?\n\s*`, \[parsedAmount, wallet\.id\]\);/;

if (deductRegex.test(code)) {
  code = code.replace(deductRegex, newDeduct);
  console.log('✅ Patched atomic deduction constraint in requestWithdrawal');
}

fs.writeFileSync(walletServiceFile, code, 'utf8');
console.log('Finished updating walletService.js');
