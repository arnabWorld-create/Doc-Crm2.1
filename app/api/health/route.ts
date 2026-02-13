import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const isProduction = process.env.NODE_ENV === 'production';

export async function GET() {
  try {
    await prisma.$connect();

    // Production: minimal response (no env or sensitive info)
    if (isProduction) {
      return NextResponse.json({
        status: 'ok',
        database: 'connected',
      });
    }

    // Development: include non-sensitive debug info
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      userCount,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (isProduction) {
      return NextResponse.json(
        { status: 'error', database: 'disconnected' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: message,
        nodeEnv: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  }
}
