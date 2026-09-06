'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, MessageSquare, Heart, Share2, Image as ImageIcon, 
  Send, Sparkles, ShieldCheck,
  Play, Pause, Volume2, VolumeX, Radio, Wifi, WifiOff, ExternalLink, RefreshCw, Signal, Newspaper
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// RADIO DATA & LOGIC
// ==========================================

const STATIONS = [
  { id: 'radio-city', name: 'Radio City Hindi', tagline: 'Top Hindi Hits & Updates', frequency: '91.1 FM', language: 'Hindi', streamUrl: 'https://drive.uber.radio/uber/bollywood2010s/icecast.audio', fallbackUrl: 'https://drive.uber.radio/uber/bollywood2010s/icecast.audio', imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600&auto=format&fit=crop', color: '#1e5631', badgeColor: '#16a34a', category: 'Music & News', isLive: true },
  { id: 'udaan', name: 'Radio Udaan', tagline: 'Community & Rural Development', frequency: 'Online', language: 'Hindi', streamUrl: 'https://azuracast.vibesounds.in:8010/radio.mp3', fallbackUrl: 'https://azuracast.vibesounds.in:8010/radio.mp3', imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop', color: '#1e3a5f', badgeColor: '#2563eb', category: 'Rural Development', isLive: true },
  { id: 'punjabi', name: 'Punjabi Folk Radio', tagline: 'Regional Hits & Farming Updates', frequency: 'Online', language: 'Punjabi', streamUrl: 'https://bolpunjabi-ekamsoftware.radioca.st/stream', fallbackUrl: 'https://bolpunjabi-ekamsoftware.radioca.st/stream', imageUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=600&auto=format&fit=crop', color: '#5b21b6', badgeColor: '#7c3aed', category: 'Regional', isLive: true },
  { id: 'tamil', name: '90s Tamil Melodies', tagline: 'Classic Tunes & Local Info', frequency: 'Online', language: 'Tamil', streamUrl: 'https://tamilpanpalai.radioca.st/ind', fallbackUrl: 'https://tamilpanpalai.radioca.st/ind', imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=600&auto=format&fit=crop', color: '#7c2d12', badgeColor: '#ea580c', category: 'Regional', isLive: true },
  { id: 'malayalam', name: 'Malayalam Rural', tagline: 'Kerala Updates & Music', frequency: 'Online', language: 'Malayalam', streamUrl: 'https://stream.zeno.fm/9x1sw687nf9uv', fallbackUrl: 'https://stream.zeno.fm/9x1sw687nf9uv', imageUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=600&auto=format&fit=crop', color: '#9f1239', badgeColor: '#e11d48', category: 'Regional', isLive: true },
  { id: 'bhakti', name: 'Bhakti Radio', tagline: 'Devotional & Peace', frequency: 'Online', language: 'Hindi', streamUrl: 'https://stream.zeno.fm/0zkr7x8ztm0uv', fallbackUrl: 'https://stream.zeno.fm/0zkr7x8ztm0uv', imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=600&auto=format&fit=crop', color: '#365314', badgeColor: '#65a30d', category: 'Devotional', isLive: true },
];

type StationStatus = 'idle' | 'loading' | 'playing' | 'error';

// ==========================================
// KISAN SABHA DATA & LOGIC
// ==========================================

interface Reply {
  id: string;
  authorName: string;
  authorType: 'farmer' | 'expert' | 'ai';
  content: string;
  timestamp: string;
  likes: number;
}

interface Post {
  id: string;
  authorName: string;
  authorLocation: string;
  avatarColor: string;
  content: string;
  timestamp: string;
  likes: number;
  tags: string[];
  replies: Reply[];
  isAITyping?: boolean;
}

export default function CommunityHub() {
  const [activeTab, setActiveTab] = useState<'sabha' | 'radio' | 'news'>('sabha');

  // --- Sabha State ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- News State ---
  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    if (activeTab === 'news' && news.length === 0) {
      setLoadingNews(true);
      fetch('/api/v1/news')
        .then(r => r.json())
        .then(d => { if (d.success) setNews(d.articles); })
        .catch(console.error)
        .finally(() => setLoadingNews(false));
    }
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/v1/community');
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPosts();
    const poll = setInterval(fetchPosts, 15000); 
    return () => clearInterval(poll);
  }, []);

  const handlePost = async () => {
    if (!newPostContent.trim()) return;
    setIsSubmitting(true);
    const isQuestion = newPostContent.includes('?');
    try {
      const res = await fetch('/api/v1/community', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_post', content: newPostContent, isQuestion })
      });
      const data = await res.json();
      if (data.success) {
        setNewPostContent('');
        await fetchPosts();
        if (isQuestion) triggerAIExpertResponse(data.postId, newPostContent);
      }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const triggerAIExpertResponse = async (postId: string, question: string) => {
    setPosts(current => current.map(p => p.id === postId ? { ...p, isAITyping: true } : p));
    const thinkingTime = Math.random() * 2000 + 2000;
    setTimeout(async () => {
      try {
        await fetch('/api/v1/community/ai-reply', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, question })
        });
        await fetchPosts();
      } catch (err) { console.error(err); }
    }, thinkingTime);
  };

  const handleLike = async (id: string, type: 'post' | 'reply') => {
    if (type === 'post') setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    try {
      await fetch('/api/v1/community', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', targetId: id, type })
      });
    } catch (err) { console.error(err); }
  };

  // --- Radio State ---
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, StationStatus>>({});
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) { 
        audioRef.current.oncanplay = null;
        audioRef.current.onerror = null;
        audioRef.current.pause(); 
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
    };
  }, []);

  const setStatus = (id: string, status: StationStatus) => setStatusMap(prev => ({ ...prev, [id]: status }));

  const playStation = (station: typeof STATIONS[0]) => {
    if (audioRef.current) { 
      audioRef.current.oncanplay = null;
      audioRef.current.onerror = null;
      audioRef.current.pause(); 
      audioRef.current.src = ''; 
      audioRef.current.load();
    }
    if (activeId === station.id) { 
      setActiveId(null); 
      setStatus(station.id, 'idle');
      return; 
    }
    setActiveId(station.id);
    setStatus(station.id, 'loading');

    const audio = new Audio();
    audio.volume = muted ? 0 : volume / 100;
    audio.preload = 'none';
    audio.oncanplay = () => {
      setStatus(station.id, 'playing');
      audio.play().catch(() => setStatus(station.id, 'error'));
    };
    audio.onerror = () => {
      if (audio.src !== station.fallbackUrl) { audio.src = station.fallbackUrl; audio.load(); }
      else { setStatus(station.id, 'error'); setActiveId(null); }
    };
    audio.src = station.streamUrl;
    audio.load();
    audioRef.current = audio;
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val / 100;
    if (val > 0) setMuted(false);
  };

  const toggleMute = () => {
    setMuted(m => {
      if (audioRef.current) audioRef.current.volume = m ? volume / 100 : 0;
      return !m;
    });
  };

  const activeStation = STATIONS.find(s => s.id === activeId);

  return (
    <div style={{ backgroundColor: 'var(--color-parchment)', minHeight: '100vh', fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}>
      
      {/* Header & Tabs */}
      <div style={{ background: '#fff', padding: '28px 24px 0', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2d6a27', marginBottom: 4 }}>
            <Users size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Connect & Learn
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.03em' }}>
            Community Hub
          </h1>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }}>
            <button 
              onClick={() => setActiveTab('sabha')} 
              style={{ padding: '10px 20px', borderRadius: 24, fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, background: activeTab === 'sabha' ? '#2d6a27' : '#f3f4f6', color: activeTab === 'sabha' ? '#fff' : '#4b5563' }}
            >
              <MessageSquare size={18} /> Kisan Sabha
            </button>
            <button 
              onClick={() => setActiveTab('radio')} 
              style={{ padding: '10px 20px', borderRadius: 24, fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, background: activeTab === 'radio' ? '#2d6a27' : '#f3f4f6', color: activeTab === 'radio' ? '#fff' : '#4b5563' }}
            >
              <Radio size={18} /> Krishi Radio
            </button>
            <button 
              onClick={() => setActiveTab('news')} 
              style={{ padding: '10px 20px', borderRadius: 24, fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, background: activeTab === 'news' ? '#2d6a27' : '#f3f4f6', color: activeTab === 'news' ? '#fff' : '#4b5563' }}
            >
              <Newspaper size={18} /> Krishi News
            </button>
          </div>
        </div>
      </div>

      <main style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ========================================================= */}
        {/* TAB 1: KISAN SABHA */}
        {/* ========================================================= */}
        {activeTab === 'sabha' && (
          <div className="fade-in flex flex-col gap-6">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4"><Users size={200} /></div>
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">The Digital Village Square</h1>
                <p className="text-emerald-100 max-w-lg text-lg">Share stories, ask questions, and get verified answers from the AI Expert and fellow farmers.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-lg">Y</div>
                <div className="flex-1">
                  <textarea placeholder="What's happening on your farm? Ask a question with '?' to trigger the AI Expert..." value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none h-28 transition-all" />
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><ImageIcon className="w-5 h-5" /></button>
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full"><Sparkles className="w-3.5 h-3.5" /> AI Expert Active</div>
                    </div>
                    <button onClick={handlePost} disabled={isSubmitting || !newPostContent.trim()} className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${isSubmitting || !newPostContent.trim() ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow'}`}>
                      {isSubmitting ? <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Post Update</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <AnimatePresence>
                {loading && <div className="flex flex-col items-center justify-center text-slate-500 py-12"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div><p>Loading community feed...</p></div>}
              
                {!loading && posts.map((post) => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-5 md:p-6 pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                          <div className={`w-12 h-12 rounded-full ${post.avatarColor} flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-lg`}>{post.authorName.charAt(0)}</div>
                          <div>
                            <div className="flex items-center gap-1.5"><h3 className="font-bold text-slate-900">{post.authorName}</h3>{post.authorName.includes('You') && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">You</span>}</div>
                            <div className="text-sm text-slate-500 font-medium">{post.authorLocation} • {post.timestamp}</div>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      {post.tags.length > 0 && <div className="flex gap-2 mt-4">{post.tags.map(tag => <span key={tag} className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">#{tag}</span>)}</div>}
                    </div>

                    <div className="px-6 py-3 border-y border-slate-100 bg-slate-50 flex items-center gap-6">
                      <button onClick={() => handleLike(post.id, 'post')} className="flex items-center gap-1.5 text-slate-500 hover:text-rose-500 font-medium transition-colors group"><Heart className="w-5 h-5 group-hover:fill-rose-500 transition-colors" /> <span>{post.likes}</span></button>
                      <button className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-medium transition-colors"><MessageSquare className="w-5 h-5" /> <span>{post.replies.length}</span></button>
                      <button className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 font-medium transition-colors ml-auto"><Share2 className="w-5 h-5" /></button>
                    </div>

                    {(post.replies.length > 0 || post.isAITyping) && (
                      <div className="p-4 md:p-6 bg-slate-50/50 flex flex-col gap-4">
                        {post.replies.map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-sm ${reply.authorType === 'ai' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-400'}`}>
                              {reply.authorType === 'ai' ? <Sparkles className="w-4 h-4" /> : reply.authorName.charAt(0)}
                            </div>
                            <div className={`flex-1 rounded-2xl p-4 ${reply.authorType === 'ai' ? 'bg-indigo-50 border border-indigo-100/50 rounded-tl-none shadow-sm' : 'bg-white border border-slate-200 rounded-tl-none shadow-sm'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5"><span className={`font-bold text-sm ${reply.authorType === 'ai' ? 'text-indigo-900' : 'text-slate-900'}`}>{reply.authorName}</span>{reply.authorType === 'ai' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />}</div>
                                <span className="text-xs text-slate-400 font-medium">{reply.timestamp}</span>
                              </div>
                              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${reply.authorType === 'ai' ? 'text-indigo-800' : 'text-slate-700'}`}>{reply.content}</p>
                            </div>
                          </div>
                        ))}
                        {post.isAITyping && (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm text-white bg-gradient-to-br from-indigo-500 to-purple-600"><Sparkles className="w-4 h-4" /></div>
                            <div className="bg-indigo-50 border border-indigo-100/50 rounded-2xl rounded-tl-none shadow-sm p-4 w-32 flex items-center gap-1">
                              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RADIO */}
        {/* ========================================================= */}
        {activeTab === 'radio' && (
          <div className="fade-in">
            {activeStation && (
              <div style={{ position: 'sticky', top: 0, zIndex: 50, background: activeStation.color, color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', borderRadius: 16, marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}><img src={activeStation.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeStation.name}</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {statusMap[activeStation.id] === 'loading' ? <><RefreshCw size={12} className="animate-spin" /> Connecting…</> : statusMap[activeStation.id] === 'playing' ? <><Signal size={12} /> LIVE — {activeStation.language}</> : <><WifiOff size={12} /> Connection failed</>}
                  </div>
                </div>
                <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.9 }}>{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
                <input type="range" min={0} max={100} value={muted ? 0 : volume} onChange={e => handleVolumeChange(Number(e.target.value))} style={{ width: 80, accentColor: '#fff', cursor: 'pointer' }} className="hidden sm:block" />
                <button onClick={() => playStation(activeStation)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', flexShrink: 0 }}><Pause size={20} fill="currentColor" /></button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {STATIONS.map(station => {
                const status = statusMap[station.id] ?? 'idle';
                const isActive = activeId === station.id;
                return (
                  <div key={station.id} style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: isActive ? `0 8px 32px -8px ${station.color}80` : '0 2px 12px rgba(0,0,0,0.06)', border: isActive ? `2px solid ${station.badgeColor}` : '2px solid transparent', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', cursor: 'pointer' }} onClick={() => status !== 'loading' && playStation(station)}>
                    <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                      <img src={station.imageUrl} alt={station.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: isActive ? 'scale(1.05)' : 'scale(1)' }} />
                      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${station.color}cc 0%, transparent 50%)` }} />
                      <div style={{ position: 'absolute', top: 12, left: 12, background: isActive && status === 'playing' ? '#ef4444' : 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, transition: 'background 0.3s' }}>
                        {isActive && status === 'playing' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1s infinite' }} />}
                        {isActive && status === 'playing' ? 'ON AIR' : 'LIVE'}
                      </div>
                      <div style={{ position: 'absolute', top: 12, right: 12, background: station.badgeColor, color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{station.category}</div>
                      <div style={{ position: 'absolute', bottom: 12, right: 12, width: 44, height: 44, borderRadius: '50%', background: isActive ? station.badgeColor : 'rgba(255,255,255,0.9)', color: isActive ? '#fff' : station.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}>
                        {status === 'loading' && isActive ? <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> : isActive && status === 'playing' ? <Pause size={20} fill="currentColor" /> : status === 'error' && isActive ? <WifiOff size={18} /> : <Play size={20} fill="currentColor" style={{ marginLeft: 3 }} />}
                      </div>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{station.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>{station.tagline}</p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}><Wifi size={12} /> {station.frequency}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af' }}>🌐 {station.language}</span>
                      </div>
                      {status === 'error' && isActive && (
                        <button onClick={(e) => { e.stopPropagation(); setStatus(station.id, 'idle'); setTimeout(() => playStation(station), 100); }} style={{ marginTop: 12, width: '100%', padding: '8px 0', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <RefreshCw size={14} /> Stream unavailable — Tap to retry
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, color: '#6b7280', fontSize: '0.82rem', marginTop: 32 }}>
              <Radio size={16} style={{ color: '#2d6a27', flexShrink: 0 }} />
              <span>All streams are provided by public community and rural broadcast infrastructure.</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: KRISHI NEWS */}
        {/* ========================================================= */}
        {activeTab === 'news' && (
          <div className="fade-in flex flex-col gap-5">
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4"><Newspaper size={200} /></div>
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">Live Agriculture News</h1>
                <p className="text-blue-100 max-w-lg text-lg">Stay updated with the latest real-time agricultural news, market trends, and government policies across India.</p>
              </div>
            </div>

            <AnimatePresence>
              {loadingNews && (
                <div className="flex flex-col items-center justify-center text-slate-500 py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Fetching latest updates...</p>
                </div>
              )}

              {!loadingNews && news.map((article, idx) => (
                <motion.a 
                  key={article.id || idx}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow p-5 md:p-6 block text-decoration-none group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles size={14} /> Top Story
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-700 transition-colors mb-3 leading-snug">
                        {article.title}
                      </h3>
                      <div className="text-sm text-slate-500 font-medium">
                        {article.date}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors text-slate-400">
                      <ExternalLink size={18} />
                    </div>
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}} />
    </div>
  );
}
