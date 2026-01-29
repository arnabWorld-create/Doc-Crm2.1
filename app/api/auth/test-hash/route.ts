import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get password from query parameter or use default
    const password = request.nextUrl.searchParams.get('password') || 'compass1234';
    const hash = await hashPassword(password);
    
    // Test verification
    const isValid = await verifyPassword(password, hash);
    
    return NextResponse.json({
      success: true,
      testPassword: password,
      hash,
      verificationResult: isValid,
      message: 'Hash test successful'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
