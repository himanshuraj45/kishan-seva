/**
 * @file src/app/(app)/AppLayoutClient.tsx
 * @description Client-side shell for every authenticated app page.
 *
 * Renders the desktop sidebar, top header bar (notifications, language selector,
 * calculator), mobile bottom nav, mobile drawer, and the floating AI chat widget.
 * Fetches and polls live notifications from `/api/v1/notifications` every 5 minutes.
 */
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  LayoutDashboard,
  Search, 
  TrendingUp, 
  Calendar, 
  Settings, 
  Bell, 
  Menu,
  X,
  UserCircle,
  Landmark,
  Bot,
  Tractor,
  QrCode,
  FlaskConical,
  ChevronRight,
  Map,
  Wallet,
  Wifi,
  Users,
  LogOut,
  AlertTriangle,
  Droplets,
  CheckCheck,
  Trash2,
  CloudOff,
  Warehouse,
  Radio,
  Sprout,
  BookOpen,
  FolderLock,
  Calculator,
  FileText
} from 'lucide-react';

const DEFAULT_NOTIFICATIONS = [
  { id: '1', icon: 'alert', title: 'High Disease Risk: Tomato', body: 'Apply preventive fungicide in Plot 2A before evening.', time: '2 hours ago', read: false },
  { id: '2', icon: 'water', title: 'Irrigation Due', body: 'Plot 1C (Rice) needs 12mm of water today.', time: '5 hours ago', read: false },
  { id: '3', icon: 'market', title: 'Mandi Price Alert', body: 'Wheat prices are up by ₹50/q in Bhopal Mandi.', time: 'Yesterday', read: false },
];

type Notif = { id: string; icon: string; title: string; body: string; time: string; read: boolean };

import GoogleTranslateWidget from '@/components/layout/GoogleTranslateWidget';
import GlobalCalculatorWidget from '@/components/layout/GlobalCalculatorWidget';
import BackgroundSyncManager from '@/components/layout/BackgroundSyncManager';
import { UserButton } from '@clerk/nextjs';
import ChatWidget from '@/components/chat/ChatWidget';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'My Dashboard',
  '/diagnose': 'Crop Diagnose',
  '/soil-health': 'Soil Health',
  '/market': 'Market Prices',
  '/schedule': 'My Plots',
  '/schemes': 'Govt. Schemes',
  '/iot': 'IoT Sensors',
  '/agent': 'AI Agent',
  '/topography': 'Farm Topography',
  '/finance': 'Agri-Credit & Lending',
  '/settings': 'Settings',
  '/community': 'Community Hub',
  '/documents': 'Document Locker',
  '/crop-planner': 'Crop Advisory & Planner',
  '/disease-library': 'Disease Library',
  '/resources': 'Farm Resources',
};

const APP_LINKS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Plots', href: '/schedule', icon: Calendar },
  { name: 'Disease Library', href: '/disease-library', icon: BookOpen },
  { name: 'Crop Diagnose', href: '/diagnose', icon: Search },
  { name: 'Soil Health', href: '/soil-health', icon: FlaskConical },
  { name: 'Farm Map', href: '/topography', icon: Map },
  { name: 'Market', href: '/market', icon: TrendingUp },
  { name: 'Crop Planner', href: '/crop-planner', icon: Sprout },
  { name: 'Agri Financial Services', href: '/finance', icon: Wallet },
  { name: 'Farm Resources', href: '/resources', icon: Tractor },
  { name: 'Traceability', href: '/blockchain', icon: QrCode },
  { name: 'Schemes', href: '/schemes', icon: FileText },
  { name: 'Docs Locker', href: '/documents', icon: FolderLock },
  { name: 'Community Hub', href: '/community', icon: Users },
  { name: 'AI Agent', href: '/agent', icon: Bot },
];

/** Props accepted by the root application layout shell. */
interface AppLayoutClientProps {
  children: React.ReactNode;
  /** Authenticated farmer profile hydrated from Clerk + Supabase on the server. */
  profile: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    farm_location?: string;
  };
}

export default function AppLayoutClient({ children, profile }: AppLayoutClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([
    {
      id: 'notif-sys-upgrade-v2',
      icon: 'check',
      title: 'KisanSeva System Upgraded! 🚀',
      body: 'We just rolled out the new "Indestructible" AI Cascade! App now uses Gemini 3.6 Flash (Thinking Mode) with a dedicated ML Backend on Render. 100% uptime guaranteed for all your diagnoses.',
      time: 'Just now',
      read: false
    }
  ]);

  useEffect(() => {
    const loadNotifs = async () => {
      const saved = localStorage.getItem('ks_notifications');
      if (saved) {
        setNotifs(JSON.parse(saved));
      }
      
      // Fetch fresh notifications from the server
      try {
        const res = await fetch('/api/v1/notifications');
        if (res.ok) {
          const data = await res.json();
          if (data.notifications && data.notifications.length > 0) {
            // Merge with existing to keep read status if IDs match, otherwise use new
            setNotifs(prev => {
              const prevMap = new globalThis.Map<string, Notif>(prev.map(n => [n.id, n]));
              const merged = data.notifications.map((n: Notif) => {
                if (prevMap.has(n.id)) return prevMap.get(n.id)!;
                return n;
              });
              
              // Only update localStorage if there are new unread notifications
              const hasNew = merged.some((n: Notif) => !n.read && !prevMap.has(n.id));
              if (hasNew) localStorage.setItem('ks_notifications', JSON.stringify(merged));
              
              return merged;
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch real notifications:', err);
      }
    };
    
    loadNotifs();
    
    // Poll for new notifications every 5 minutes
    const interval = setInterval(loadNotifs, 5 * 60 * 1000);
    window.addEventListener('storage', loadNotifs);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadNotifs);
    };
  }, []);

  const saveNotifs = (updated: Notif[]) => {
    setNotifs(updated);
    localStorage.setItem('ks_notifications', JSON.stringify(updated));
  };

  const markRead = (id: string) => saveNotifs(notifs.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: string) => saveNotifs(notifs.filter(n => n.id !== id));
  const markAllRead = () => saveNotifs(notifs.map(n => ({ ...n, read: true })));

  const unreadCount = notifs.filter(n => !n.read).length;
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const updateAvatar = () => {
      if (profile?.id) {
         setAvatar(localStorage.getItem(`ks_avatar_${profile.id}`));
      }
    };
    updateAvatar();
    window.addEventListener('avatar-updated', updateAvatar);
    return () => window.removeEventListener('avatar-updated', updateAvatar);
  }, [profile?.id]);

  const pageTitle = PAGE_TITLES[pathname] || 'KisanSeva';
  
  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex h-screen overflow-hidden text-slate-900 font-sans" style={{ backgroundColor: '#f0f4f0' }}>
      <BackgroundSyncManager />
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 shrink-0" style={{ background: 'linear-gradient(180deg, #1a2e1a 0%, #1e3a1e 60%, #162816 100%)', boxShadow: '4px 0 24px rgba(0,0,0,0.18)' }}>
        
        {/* Brand */}
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ background: 'rgba(101,163,13,0.25)', borderRadius: '10px', padding: '6px', border: '1px solid rgba(101,163,13,0.35)' }}>
            <img src="/icon.jpg" alt="KisanSeva" style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover', display: 'block' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff', letterSpacing: '-0.3px' }}>KisanSeva</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Smart Farm Platform</div>
          </div>
        </div>

        {/* Live status pill */}
        <div style={{ margin: '8px 16px', backgroundColor: 'rgba(101,163,13,0.15)', border: '1px solid rgba(101,163,13,0.3)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#84cc16', display: 'inline-block', boxShadow: '0 0 6px #84cc16', animation: 'none' }} />
          <span style={{ fontSize: '0.75rem', color: '#86efac', fontWeight: 600 }}>All Systems Online</span>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          .sidebar-nav-scroll::-webkit-scrollbar { display: none; }
          .sidebar-nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
        <nav className="sidebar-nav-scroll" style={{ flex: 1, padding: '2px 12px 6px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {APP_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px',
                  borderRadius: '8px', textDecoration: 'none', transition: 'all 0.15s ease', fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'rgba(101,163,13,0.22)' : 'transparent',
                  color: isActive ? '#a3e635' : 'rgba(255,255,255,0.55)',
                  borderLeft: isActive ? '3px solid #84cc16' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; } }}
              >
                <Icon size={16} style={{ color: isActive ? '#84cc16' : 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{link.name}</span>
                {isActive && <ChevronRight size={14} style={{ color: '#84cc16', opacity: 0.7 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user card */}
        <div style={{ margin: '0 12px 6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Link
            href="/settings"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.15s', backgroundColor: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <Settings size={15} style={{ flexShrink: 0 }} />
            Settings
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ flexShrink: 0 }}>
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>Verified Farmer</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP HEADER */}
        <header style={{ position: 'relative', height: '60px', backgroundColor: '#fff', borderBottom: '1px solid #e9eef0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 50000, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="md:hidden" style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <img src="/icon.jpg" alt="KisanSeva" className="w-7 h-7 rounded-md object-cover" />
              <span className="font-extrabold text-lg text-[#1a2e1a]">KisanSeva</span>
            </div>
            {/* Desktop breadcrumb */}
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>KisanSeva</span>
              <ChevronRight size={14} style={{ color: '#cbd5e1' }} />
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{pageTitle}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GoogleTranslateWidget className="hidden sm:inline-block mt-1" />
            <GlobalCalculatorWidget />
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ position: 'relative', padding: '8px', background: showNotifications ? '#f1f5f9' : 'none', border: 'none', cursor: 'pointer', borderRadius: '8px', color: '#64748b', transition: 'background 0.15s' }} 
                onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')} 
                onMouseLeave={e => { if(!showNotifications) e.currentTarget.style.background = 'none' }}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '4px', right: '4px', minWidth: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '999px', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', padding: '0 3px' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  {/* Click outside to close */}
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowNotifications(false)} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: '-20px', width: '340px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', zIndex: 100, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Notifications</span>
                        {notifs.length > 0 && <span style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#64748b', borderRadius: '999px', padding: '1px 7px', fontWeight: 600 }}>{notifs.length}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {notifs.length > 0 && (
                          <>
                            <button onClick={markAllRead} title="Mark all as read" style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                              <CheckCheck size={14} /> All read
                            </button>
                            <button onClick={() => saveNotifs([])} title="Clear all" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                              <Trash2 size={14} /> Clear
                            </button>
                          </>
                        )}
                        <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}><X size={16} /></button>
                      </div>
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {notifs.length === 0 && (
                        <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8' }}>
                          <Bell size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>All caught up!</div>
                        </div>
                      )}
                      {notifs.map((n, idx) => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          style={{ padding: '14px 16px', borderBottom: idx < notifs.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: n.read ? '#fff' : '#f0fdf4', cursor: 'pointer', transition: 'background 0.15s', position: 'relative' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = n.read ? '#fff' : '#f0fdf4')}
                        >
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: n.icon === 'alert' ? '#fef2f2' : n.icon === 'water' ? '#eff6ff' : '#f0fdf4', color: n.icon === 'alert' ? '#ef4444' : n.icon === 'water' ? '#3b82f6' : '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {n.icon === 'alert' ? <AlertTriangle size={17} /> : n.icon === 'water' ? <Droplets size={17} /> : <TrendingUp size={17} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: n.read ? 500 : 700, fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {n.title}
                              {!n.read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0, display: 'inline-block' }} />}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>{n.body}</div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px' }}>{n.time}</div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                            title="Dismiss"
                            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px', borderRadius: '4px', flexShrink: 0, marginTop: '-2px' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {notifs.length > 0 && (
                      <button
                        onClick={() => { saveNotifs([]); }}
                        style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, color: '#ef4444', background: '#fff', border: 'none', borderTop: '1px solid #e2e8f0', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                      >
                        Clear all notifications
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-center pt-1">
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-[34px] h-[34px]" } }} />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className={`flex-1 flex flex-col min-h-0 overflow-y-auto relative ${pathname === '/agent' ? 'scrollbar-hide pb-0' : 'pb-20 md:pb-0'}`} style={{ backgroundColor: '#f0f4f0' }}>
          <div className="w-full flex-1 min-h-0 max-w-7xl mx-auto flex flex-col">
            {children}
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAV — only show 5 key tabs */}
      {pathname !== '/agent' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40">
          <div className="flex justify-around items-center h-16">
          {APP_LINKS.slice(0, 5).map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%', textDecoration: 'none', gap: '3px', color: isActive ? '#4d7c0f' : '#94a3b8', transition: 'color 0.15s' }}
              >
                <Icon size={21} style={{ color: isActive ? '#65a30d' : '#94a3b8' }} />
                <span style={{ fontSize: '9px', fontWeight: isActive ? 700 : 500 }}>{link.name}</span>
                {isActive && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#65a30d', position: 'absolute', bottom: '6px' }} />}
              </Link>
            );
          })}
        </div>
      </nav>
      )}

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 flex" style={{ zIndex: 60000 }}>
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-slate-800 text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 flex items-center gap-3 border-b border-slate-100">
              <img src="/icon.jpg" alt="KisanSeva Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
              <span className="font-bold text-xl tracking-tight text-slate-800">KisanSeva</span>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
              {APP_LINKS.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-[#65a30d]/10 text-[#4d7c0f] font-semibold' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <Icon size={22} className={isActive ? 'text-[#65a30d]' : 'text-slate-400'} />
                    <span className="text-base">{link.name}</span>
                  </Link>
                );
              })}
              
              <div className="pt-4 mt-4 border-t border-slate-100">
                <Link 
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium transition-all"
                >
                  <Settings size={22} className="text-slate-400" />
                  <span className="text-base">Settings</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* FLOATING CHATBOT (Hide on full-screen agent page) */}
      {pathname !== '/agent' && <ChatWidget />}
    </div>
  );
}
