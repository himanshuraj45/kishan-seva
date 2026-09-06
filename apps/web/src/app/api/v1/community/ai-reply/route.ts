import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { postId, question } = body;

    if (!postId || !question) {
      return NextResponse.json({ success: false, error: 'Missing postId or question' }, { status: 400 });
    }

    // AI Logic Simulation
    let responseContent = 'Based on agricultural best practices, this requires careful monitoring. I recommend getting a soil test to confirm nutrient levels. Additionally, keep an eye on local weather forecasts, as sudden temperature drops can cause similar symptoms.';
    
    if (question.toLowerCase().includes('pest') || question.toLowerCase().includes('insect') || question.toLowerCase().includes('bug')) {
      responseContent = 'For pest issues, first identify the insect. If it is aphids or whiteflies, a Neem oil spray (10,000 PPM) at 3ml/liter of water is highly effective and safe for organic farming. If the infestation is severe, consult your local KVK for chemical intervention.';
    } else if (question.toLowerCase().includes('water') || question.toLowerCase().includes('irrigation')) {
      responseContent = 'Optimizing irrigation is key. Try adopting alternate furrow irrigation or using soil moisture sensors. Over-watering can lead to root rot and fungal diseases. Ensure your field has proper drainage before the monsoon hits.';
    } else if (question.toLowerCase().includes('price') || question.toLowerCase().includes('sell')) {
      responseContent = 'Market prices fluctuate based on arrivals. You can check the "Direct B2B Contracts" section on the Market page to secure a pre-agreed premium price for your harvest, bypassing mandi volatility altogether.';
    }

    const replyId = `r${Date.now()}`;
    
    const { error } = await supabase
      .from('replies')
      .insert([{
        id: replyId,
        postid: postId,
        authorname: 'KisanSeva AI Expert',
        authortype: 'ai',
        content: responseContent
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'AI Reply added to database' });
  } catch (error: any) {
    console.error("AI Reply POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
