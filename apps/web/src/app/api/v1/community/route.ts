import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: allPosts, error: pError } = await supabase
      .from('posts')
      .select('*')
      .order('createdat', { ascending: false });

    if (pError) throw pError;

    const { data: allReplies, error: rError } = await supabase
      .from('replies')
      .select('*')
      .order('createdat', { ascending: true });

    if (rError) throw rError;

    const structuredPosts = (allPosts || []).map(post => {
      const postReplies = (allReplies || [])
        .filter(r => r.postid === post.id)
        .map(r => ({
          id: r.id,
          authorName: r.authorname,
          authorType: r.authortype,
          content: r.content,
          likes: r.likes,
          timestamp: new Date(r.createdat).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric' })
        }));

      let parsedTags = [];
      try {
        parsedTags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;
      } catch (e) {
        parsedTags = [post.tags];
      }

      return {
        id: post.id,
        authorName: post.authorname,
        authorLocation: post.authorlocation,
        avatarColor: post.avatarcolor,
        content: post.content,
        likes: post.likes,
        tags: parsedTags,
        timestamp: new Date(post.createdat).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric' }),
        replies: postReplies
      };
    });

    return NextResponse.json({ success: true, posts: structuredPosts });
  } catch (error: any) {
    console.error("Community GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, postId, content, isQuestion } = body;

    if (action === 'create_post') {
      const id = `p${Date.now()}`;
      const tags = isQuestion ? ['Question'] : ['General'];
      
      const { error } = await supabase
        .from('posts')
        .insert([{
          id,
          authorname: 'You (Farmer)',
          authorlocation: 'Your Farm',
          avatarcolor: 'bg-indigo-600',
          content,
          tags: JSON.stringify(tags)
        }]);
      
      if (error) throw error;
      return NextResponse.json({ success: true, postId: id, message: 'Post created' });
    }

    if (action === 'like') {
       const type = body.type; 
       const targetId = body.targetId;
       const table = type === 'post' ? 'posts' : 'replies';
       
       // Supabase doesn't have an atomic increment via RPC out of the box unless we define one.
       // We'll fetch the current likes and update. (For production, an RPC function `increment_likes` is better).
       const { data: currentData, error: fetchErr } = await supabase
         .from(table)
         .select('likes')
         .eq('id', targetId)
         .single();
         
       if (fetchErr) throw fetchErr;
       
       const { error: updateErr } = await supabase
         .from(table)
         .update({ likes: (currentData?.likes || 0) + 1 })
         .eq('id', targetId);

       if (updateErr) throw updateErr;
       
       return NextResponse.json({ success: true, message: 'Liked' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error("Community POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
