import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BANK_DETAILS_FILE = path.join(process.cwd(), 'src/config/creator_bank_details_cache.json');

function loadBankDetailsStore(): Record<string, any> {
  try {
    if (fs.existsSync(BANK_DETAILS_FILE)) {
      const data = fs.readFileSync(BANK_DETAILS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading bank details store:', e);
  }
  return {};
}

function saveBankDetailsStore(store: Record<string, any>) {
  try {
    const dir = path.dirname(BANK_DETAILS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BANK_DETAILS_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving bank details store:', e);
  }
}

// GET /api/creator/payout/bank-details
export async function GET() {
  try {
    const store = loadBankDetailsStore();
    const defaultData = store['default'] || null;

    if (!defaultData) {
      return NextResponse.json({ error: 'No bank details found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: defaultData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bank details' },
      { status: 500 }
    );
  }
}

// POST /api/creator/payout/bank-details
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = loadBankDetailsStore();

    const bankDetails = {
      ...body,
      id: Date.now(),
      created_at: new Date().toISOString(),
      verified_at: new Date().toISOString(),
    };

    store['default'] = bankDetails;
    saveBankDetailsStore(store);

    return NextResponse.json({
      success: true,
      message: 'Bank details saved successfully',
      data: bankDetails,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save bank details' },
      { status: 500 }
    );
  }
}

// DELETE /api/creator/payout/bank-details
export async function DELETE() {
  try {
    const store = loadBankDetailsStore();
    delete store['default'];
    saveBankDetailsStore(store);

    return NextResponse.json({
      success: true,
      message: 'Bank details removed successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to remove bank details' },
      { status: 500 }
    );
  }
}
