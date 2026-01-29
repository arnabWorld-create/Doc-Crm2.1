import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnostic check starting...');

    // Test 1: Database connection via Supabase
    console.log('Test 1: Checking Supabase connection...');
    const { data: result, error: connError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (connError) {
      console.error('❌ Supabase connection failed:', connError);
      throw connError;
    }
    console.log('✅ Supabase connected');

    // Test 2: Count users
    console.log('Test 2: Counting users...');
    const { count: userCount, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count failed:', countError);
      throw countError;
    }
    console.log('✅ User count:', userCount);

    // Test 3: List all users
    console.log('Test 3: Listing all users...');
    const { data: users, error: listError } = await supabase
      .from('users')
      .select('id, email, name, isActive');
    
    if (listError) {
      console.error('❌ List failed:', listError);
      throw listError;
    }
    console.log('✅ Users:', users);

    // Test 4: Check demo user specifically
    console.log('Test 4: Checking demo user...');
    const { data: demoUser, error: demoError } = await supabase
      .from('users')
      .select('id, email, name, password, isActive')
      .eq('email', 'demo@doxcia.com')
      .single();
    
    if (demoError) {
      console.error('❌ Demo user check failed:', demoError);
      throw demoError;
    }
    console.log('✅ Demo user:', demoUser);

    return NextResponse.json({
      success: true,
      tests: {
        supabaseConnected: true,
        userCount,
        users,
        demoUser,
      },
    });
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
      { status: 500 }
    );
  }
}
