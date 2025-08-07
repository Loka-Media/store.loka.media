import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;
    const { is_active } = await req.json();

    // In a real application, you would update the product status in your database
    // For now, we'll just log the change
    console.log(`Updating product ${productId} status to ${is_active}`);

    // Simulate a successful update
    return NextResponse.json({ message: 'Product status updated successfully' });
  } catch (error) {
    console.error('Error updating product status:', error);
    return NextResponse.json(
      { message: 'Error updating product status' },
      { status: 500 }
    );
  }
}
