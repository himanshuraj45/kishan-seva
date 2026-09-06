"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Camera, Zap, CheckCircle, Leaf,
  TrendingUp, CloudSun, Brain, MessageSquare, Star, ThumbsUp, ThumbsDown,
  Home, Activity, Plus, Mic, Image as ImageIcon,
  ChevronRight, Loader2, Globe, BarChart2, Droplets, AlertTriangle, BookOpen, PhoneCall, X,
  Square, Volume2, VolumeX
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────
type MessageSender = 'user' | 'agent';
type MessageType = 'text' | 'diagnosis' | 'price' | 'weather';

interface Message {
  id: string;
  sender: MessageSender;
  type: MessageType;
  text: string;
  agentLabel?: string;
  agentIcon?: React.ReactNode;
  data?: any;
}

// ── Agent definitions ─────────────────────────────────────────────────────────
const AGENTS = [
  { id: 'diagnosis', name: 'Diagnosis Agent',     icon: <Activity size={15} />,     color: '#22c55e' },
  { id: 'weather',   name: 'Weather Agent',        icon: <CloudSun size={15} />,     color: '#22c55e' },
  { id: 'market',    name: 'Market Agent',          icon: <TrendingUp size={15} />,   color: '#22c55e' },
  { id: 'soil',      name: 'Soil Health Agent',     icon: <Leaf size={15} />,         color: '#22c55e' },
  { id: 'outbreak',  name: 'Outbreak Monitor',      icon: <AlertTriangle size={15} />,color: '#22c55e' },
  { id: 'kb',        name: 'Knowledge Base',        icon: <BookOpen size={15} />,     color: '#22c55e' },
  { id: 'sms',       name: 'SMS/IVR Agent',         icon: <PhoneCall size={15} />,    color: '#22c55e' },
];

const QUICK_ACTIONS = [
  { label: 'Diagnose my crop',       icon: <ImageIcon size={14}/>,    query: 'My tomato leaves have brown spots' },
  { label: 'Check mandi prices',     icon: <BarChart2 size={14}/>,    query: 'Best price for onion near Pune' },
  { label: 'Irrigation schedule',    icon: <Droplets size={14}/>,     query: 'How much water for wheat today?' },
  { label: 'Soil fertilizer plan',   icon: <Leaf size={14}/>,         query: 'Fertilizer plan for nitrogen deficient soil' },
];

const LANGUAGES = [
  { label: 'EN',   code: 'en' },
  { label: 'हिं',  code: 'hi' },
  { label: 'বাং',  code: 'bn' },
  { label: 'தமி', code: 'ta' },
  { label: 'తెలు', code: 'te' },
];

const SUGGESTIONS = [
  'My tomato leaves have brown spots 🍅',
  'Best price for onion near Pune 📈',
  'How much water for wheat today? 💧',
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function AgentChatPage() {
  const [messages, setMessages]                   = useState<Message[]>([]);
  const [inputText, setInputText]                 = useState('');
  const [selectedLang, setSelectedLang]           = useState('en');
  const [isThinking, setIsThinking]               = useState(false);
  const [activeThinkingAgents, setActiveAgents]   = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebar]     = useState(false);
  const [isListening, setIsListening]             = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
  };

  // ── Voice Integration ─────────────────────────────────────────────────────────
  const addSystemMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'agent',
      type: 'text',
      text,
      agentLabel: 'KisanSeva AI',
      agentIcon: <Mic size={13}/>,
    }]);
  };

  const startListening = async () => {
    if (isListening && recognitionRef.current) {
      if (recognitionRef.current.state === 'recording') {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsThinking(true);
        stream.getTracks().forEach(track => track.stop());

        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) throw new Error('Transcription failed');
          
          const data = await response.json();
          if (data.text && data.text.trim().length > 0) {
             setInputText(data.text);
             handleSend(data.text);
          } else {
             addSystemMessage('🎙️ No speech detected. Please try speaking closer to the microphone.');
          }
        } catch (error) {
          console.error('[Voice] Transcription error:', error);
          addSystemMessage('🎙️ Error transcribing audio. Check your GROQ_API_KEY in Vercel.');
        } finally {
          setIsThinking(false);
        }
      };

      recognitionRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
      
      // Auto-stop after 8 seconds
      setTimeout(() => {
        if (recognitionRef.current && recognitionRef.current.state === 'recording') {
          recognitionRef.current.stop();
        }
      }, 8000);

    } catch (err: any) {
      console.error('[Voice] Mic error:', err);
      addSystemMessage('🎙️ Microphone blocked. Please allow microphone access in your browser settings.');
    }
  };

  const speakResponse = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Clean text for TTS
    const cleanText = text.replace(/[#*`_~]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim();
    if (!cleanText) return;

    const langMap: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN' };
    const targetLang = langMap[langCode] || 'en-IN';

    // Chunk text by punctuation to prevent browser TTS character limits (Chrome cuts off at ~250 chars)
    const chunks = cleanText.replace(/([.!?।\n])/g, "$1|").split("|").map(c => c.trim()).filter(c => c.length > 0);
    
    let voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(targetLang) || v.lang.startsWith(langCode));

    chunks.forEach(chunk => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = targetLang;
      utterance.rate = 0.9;
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    });
  };

  // ── API Call ────────────────────────────────────────────────────────────────
  const callAgentAPI = async (query: string) => {
    try {
      const resp = await fetch('/api/v1/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language: selectedLang, user_id: 'demo-farmer-001', context: {} }),
      });
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.error('[AgentChat] API error:', err);
      return null;
    }
  };

  // ── Intent Detection ────────────────────────────────────────────────────────
    const detectIntent = (q: string) => {
    const lower = q.toLowerCase();
    if (/tomato|brown|spot|disease|blight|leaf|fungi|rot/.test(lower)) {
      return { routedAgents: ['Diagnosis Agent', 'Knowledge Base'], type: 'diagnosis' as MessageType, agentLabel: 'Diagnosis Agent', agentIcon: <Activity size={13}/>, data: null };
    }
    if (/price|mandi|onion|bhav|market|sell|rate/.test(lower)) {
      return { routedAgents: ['Market Agent'], type: 'price' as MessageType, agentLabel: 'Market Agent', agentIcon: <TrendingUp size={13}/>, data: null };
    }
    if (/water|irrigation|wheat|paani|sinchayee|moisture/.test(lower)) {
      return { routedAgents: ['Weather Agent', 'Soil Health Agent'], type: 'weather' as MessageType, agentLabel: 'Weather + Soil Agent', agentIcon: <CloudSun size={13}/>, data: null };
    }
    return { routedAgents: ['Knowledge Base', 'Master Orchestrator'], type: 'text' as MessageType, agentLabel: 'KisanSeva AI', agentIcon: <Brain size={13}/>, data: null };
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || isThinking) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', type: 'text', text }]);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const intent = detectIntent(text);
    setActiveAgents(intent.routedAgents);
    setIsThinking(true);

    const apiResult = await callAgentAPI(text);
    setIsThinking(false);
    setActiveAgents([]);

    const responseText = apiResult?.result?.text || 'I am sorry, but I am unable to connect to the server right now. Please try again.';

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      sender: 'agent',
      type: intent.type,
      text: responseText,
      agentLabel: intent.agentLabel,
      agentIcon: intent.agentIcon,
      data: intent.data,
    }]);

    // Read the response out loud in vernacular language
    speakResponse(responseText, selectedLang);
  };

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className="flex flex-col w-full h-full bg-[#1a1f1e] text-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Leaf className="text-green-400" size={15}/>
            </div>
            <h1 className="text-sm font-bold tracking-tight text-white">AI Advisory System</h1>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500 pl-9">7 Specialized Agents</p>
        </div>
        <button onClick={() => setMobileSidebar(false)} className="lg:hidden p-1 text-gray-400 hover:text-white">
          <X size={18}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-6">
        {/* System Status */}
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mb-3">System Status</p>
          <div className="space-y-1">
            {AGENTS.map(agent => (
              <div key={agent.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group cursor-default">
                <div className="flex items-center gap-2.5 text-gray-300 group-hover:text-white transition-colors">
                  <span className="text-gray-500 group-hover:text-green-400 transition-colors">{agent.icon}</span>
                  <span className="text-xs font-medium">{agent.name}</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"/>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mb-3">Quick Actions</p>
          <div className="space-y-1.5">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => { handleSend(action.query); setMobileSidebar(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-medium text-gray-400 hover:text-white hover:bg-white/8 transition-all group border border-transparent hover:border-white/10"
              >
                <span className="text-gray-600 group-hover:text-green-400 transition-colors">{action.icon}</span>
                {action.label}
                <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"/>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mb-3">Language</p>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                  selectedLang === lang.code
                    ? 'bg-green-500 text-white shadow-lg shadow-green-900/50'
                    : 'bg-white/8 text-gray-400 hover:text-white hover:bg-white/12 border border-white/10'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0"/>
          <span className="text-[10px] font-semibold text-green-400 uppercase tracking-widest">All Systems Online</span>
        </div>
      </div>
    </aside>
  );

  // ── Main Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 min-h-0 w-full overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebar(false)}/>
          <div className="relative w-72 h-full z-10">
            <Sidebar/>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 flex-shrink-0">
        <Sidebar/>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#f6f8f5] overflow-hidden">

        {/* Top Bar */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 shadow-sm z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileSidebar(true)}
              className="lg:hidden flex flex-col gap-1 p-1.5"
            >
              <span className="w-4 h-0.5 bg-gray-600 rounded"/>
              <span className="w-4 h-0.5 bg-gray-600 rounded"/>
              <span className="w-4 h-0.5 bg-gray-600 rounded"/>
            </button>

            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-green-100 shrink-0">
              <img src="/chatbot-avatar.jpg" alt="KisanSeva AI" className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.display='none'}}/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">KisanSeva AI</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                  <span className="text-[9px] font-bold text-green-700 uppercase tracking-wider">Online</span>
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">Multi-Agent System · 7 Agents Active</p>
            </div>
          </div>

          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Plus size={14}/>
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-6">

            {messages.length === 0 ? (
              /* Welcome State */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center shadow-lg overflow-hidden">
                    <img src="/chatbot-avatar.jpg" alt="KisanSeva" className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.display='none'}}/>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Namaste! I'm your KisanSeva AI</h2>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">Powered by 7 specialist agricultural agents working together for you</p>
                </div>

                {/* Suggestion Pills */}
                <div className="w-full max-w-md space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">ASK ME ANYTHING</p>
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="w-full p-4 bg-white rounded-2xl text-left border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all flex items-center justify-between group"
                    >
                      <span className="text-sm font-medium text-gray-700">{s}</span>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-green-500 transition-colors shrink-0 ml-2"/>
                    </button>
                  ))}
                </div>

                {/* Upload Photo */}
                <div className="flex flex-col items-center gap-3 pt-4 border-t border-gray-100 w-full max-w-md">
                  <p className="text-xs text-gray-400">Or upload a crop photo for instant diagnosis</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 shadow-md hover:shadow-lg transition-all"
                  >
                    <Camera size={16}/>
                    Upload Photo
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment"/>
                </div>
              </div>
            ) : (
              /* Message List */
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {/* Agent Avatar */}
                    {msg.sender === 'agent' && (
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-1">
                        <img src="/chatbot-avatar.jpg" alt="AI" className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.display='none'}}/>
                      </div>
                    )}

                    <div className={`max-w-[82%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Agent label */}
                      {msg.sender === 'agent' && msg.agentLabel && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-600 px-1 w-full">
                          {msg.agentIcon}
                          <span>{msg.agentLabel}</span>
                          <button 
                            onClick={() => speakResponse(msg.text, selectedLang)} 
                            className="ml-auto p-1 rounded-md text-green-600 hover:bg-green-100 transition-colors"
                            title="Read Aloud"
                          >
                            <Volume2 size={12} />
                          </button>
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gray-900 text-white rounded-tr-sm shadow-md'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                        {/* ── Diagnosis Card ── */}
                        {msg.type === 'diagnosis' && msg.data && (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 overflow-hidden">
                            <div className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600">Detected Issue</span>
                                  <h3 className="text-base font-bold text-gray-900 mt-0.5">{msg.data.disease}</h3>
                                  <p className="text-xs text-gray-500">Crop: {msg.data.crop}</p>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0 ml-2">
                                  {msg.data.severity}
                                </span>
                              </div>
                              {/* Confidence bar */}
                              <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span className="text-gray-500 font-medium">Confidence</span>
                                  <span className="text-green-700 font-bold">{msg.data.confidence}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${msg.data.confidence}%` }}/>
                                </div>
                              </div>
                              {/* Treatment */}
                              <div>
                                <h4 className="text-xs font-bold text-gray-800 mb-2">Immediate Treatment:</h4>
                                <ol className="list-decimal list-inside text-xs text-gray-700 space-y-1.5 ml-1">
                                  {msg.data.treatment.map((step: string, idx: number) => (
                                    <li key={idx} className="leading-snug">{step}</li>
                                  ))}
                                </ol>
                              </div>
                              {/* Organic */}
                              <div className="flex gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
                                <Leaf className="text-green-600 shrink-0 mt-0.5" size={14}/>
                                <div>
                                  <span className="text-xs font-bold text-green-800 block mb-0.5">Organic Alternative</span>
                                  <span className="text-xs text-green-700">{msg.data.organic}</span>
                                </div>
                              </div>
                            </div>
                            {/* Feedback */}
                            <div className="bg-white/80 border-t border-amber-100 px-4 py-2.5 flex items-center justify-between">
                              <span className="text-[10px] text-gray-400 font-medium">Was this helpful?</span>
                              <div className="flex gap-2">
                                <button className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-700 border border-gray-200 transition-colors">
                                  <ThumbsUp size={10}/> Yes
                                </button>
                                <button className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 border border-gray-200 transition-colors">
                                  <ThumbsDown size={10}/> No
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── Price Card ── */}
                        {msg.type === 'price' && msg.data && (
                          <div className="mt-3 rounded-xl border border-emerald-200 overflow-hidden bg-white">
                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 flex items-center justify-between border-b border-emerald-100">
                              <div>
                                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-0.5">
                                  <Star size={10} className="fill-emerald-500 text-emerald-500"/>
                                  Best Price Alert
                                </div>
                                <p className="text-sm font-bold text-gray-900">{msg.data.bestMarket}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-emerald-700">{msg.data.bestPrice}</p>
                                <p className="text-[10px] text-gray-500">per {msg.data.unit}</p>
                              </div>
                            </div>
                            <div>
                              {msg.data.mandis.map((mandi: any, idx: number) => (
                                <div key={idx} className={`flex items-center justify-between px-4 py-3 text-xs border-b last:border-0 border-gray-50 ${idx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
                                  <span className="font-medium text-gray-700">{mandi.name}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-900">{mandi.price}</span>
                                    <span className={`font-semibold ${mandi.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                                      {mandi.trend === 'up' ? '▲' : '▼'} {mandi.delta}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="p-3 flex justify-center bg-gray-50/50">
                              <button className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                                Set Price Alert →
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── Weather Card ── */}
                        {msg.type === 'weather' && msg.data && (
                          <div className="mt-3 rounded-xl border border-blue-100 overflow-hidden bg-white">
                            <div className="p-4 border-b border-blue-50">
                              <p className="text-xs text-gray-600 mb-3">{msg.data.summary}</p>
                              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                                <Zap size={14} className="text-blue-500"/>
                                <span className="text-xs font-bold text-blue-800">{msg.data.recommendation}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50/50">
                              {msg.data.forecast.map((f: any, idx: number) => (
                                <div key={idx} className="py-3 flex flex-col items-center gap-1">
                                  <span className="text-[10px] font-medium text-gray-500">{f.day}</span>
                                  <span className="text-lg">{f.icon}</span>
                                  <span className="text-xs font-bold text-gray-900">{f.temp}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Thinking State */}
                {isThinking && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-1">
                      <Loader2 size={16} className="text-green-500 animate-spin"/>
                    </div>
                    <div className="max-w-[82%] space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Processing...</div>
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-200 animate-bounce" style={{ animationDelay: '0ms' }}/>
                          <span className="w-2 h-2 rounded-full bg-gray-200 animate-bounce" style={{ animationDelay: '150ms' }}/>
                          <span className="w-2 h-2 rounded-full bg-gray-200 animate-bounce" style={{ animationDelay: '300ms' }}/>
                          <span className="text-xs text-gray-400 font-medium ml-1">Routing to agents</span>
                        </div>
                        {activeThinkingAgents.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {activeThinkingAgents.map((agent, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
                                <CheckCircle size={9}/> {agent}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef}/>
              </>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all shadow-sm">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-green-600 transition-colors shrink-0 mb-0.5"
                title="Upload photo"
              >
                <Camera size={20}/>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment"/>

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder="Type or click mic to speak..."
                className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 leading-relaxed py-2 ml-1"
                rows={1}
                style={{ maxHeight: '128px' }}
              />

              <div className="shrink-0 flex items-center gap-2 mb-0.5">
                <button 
                  onClick={startListening}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-red-200 scale-105' 
                      : 'bg-[#e5f5e0] hover:bg-[#c7e9c0] text-[#2ca25f]'
                  }`}
                  title="Tap to speak"
                >
                  {isListening ? <Square size={16} className="fill-current"/> : <Mic size={18}/>}
                </button>
                
                <button
                  id="send-message-btn"
                  onClick={() => handleSend()}
                  disabled={(!inputText.trim() && !isThinking) || isListening}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm shrink-0 ${
                    inputText.trim() && !isThinking
                      ? 'bg-slate-700 hover:bg-slate-800 text-white'
                      : isThinking
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-slate-400 text-white opacity-80 cursor-not-allowed'
                  }`}
                >
                  {isThinking ? <Loader2 size={18} className="animate-spin"/> : <Send size={16} className="ml-0.5"/>}
                </button>
              </div>
            </div>

            <p className="text-center mt-2 text-[10px] font-medium text-gray-300 tracking-wide">
              Responses in English · हिंदी · বাংলা · தமிழ் · తెలుగు
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
