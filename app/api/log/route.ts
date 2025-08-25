import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    console.error('Client-side error logged:', errorData);
    // In a real production app, you would send this to a dedicated logging service
    // or store it in a database.
    return NextResponse.json({ message: 'Error logged successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to log error:', error);
    return NextResponse.json({ message: 'Failed to log error' }, { status: 500 });
  }
}
