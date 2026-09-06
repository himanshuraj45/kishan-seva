import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get('farmerId') || 'NK-001';

    const { data: myLoans, error } = await supabase
      .from('loans')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ loans: myLoans || [] });
  } catch (error: any) {
    console.error("Loans GET Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch loans' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, purpose, score, farmerId = 'NK-001' } = body;

    if (!amount || !purpose || score === undefined) {
      return NextResponse.json({ error: 'Amount, purpose, and score are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('loans')
      .insert([{ 
        farmer_id: farmerId, 
        amount, 
        purpose, 
        score, 
        status: 'APPROVED' 
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Loan approved & disbursed successfully' });
  } catch (error: any) {
    console.error("Loans POST Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to disburse loan' }, { status: 500 });
  }
}
