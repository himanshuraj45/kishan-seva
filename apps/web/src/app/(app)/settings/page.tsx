"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User, Settings, Shield, Bell, Phone, Mail, MapPin, Briefcase, Camera, LogOut, ChevronRight, Moon, Globe, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";

export default function SettingsProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const supabase = createClient();
  const { user, isLoaded } = useUser();
  const [userId, setUserId] = useState<string | null>(null);
  
  // Profile State
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    email: "",
    farmLocation: "",
    farmSize: "",
    primaryCrops: ""
  });
  
  // Settings State
  const [settings, setSettings] = useState({
    notifications: true,
    smsAlerts: true,
    darkMode: false,
    language: "English"
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!isLoaded) return;
      if (!user) return;
      
      setUserId(user.id);
      
      const savedAvatar = localStorage.getItem(`ks_avatar_${user.id}`);
      if (savedAvatar) setAvatar(savedAvatar);

      const localProfile = localStorage.getItem(`ks_profile_${user.id}`);
      if (localProfile) {
        setProfile(JSON.parse(localProfile));
      } else {
        setProfile(prev => ({ ...prev, name: user.fullName || '', email: user.primaryEmailAddress?.emailAddress || '' }));
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      if (data && data.name) {
        setProfile({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || user.primaryEmailAddress?.emailAddress || '',
          farmLocation: data.farm_location || '',
          farmSize: data.farm_size || '',
          primaryCrops: data.primary_crops || ''
        });
      }

      const savedSettings = localStorage.getItem('ks_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    }
    loadData();
  }, [isLoaded, user, supabase]);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsSaving(true);
    
    // Fallback local persistence just in case Supabase RLS blocks unauthenticated writes
    localStorage.setItem(`ks_profile_${userId}`, JSON.stringify(profile));
    
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        farm_location: profile.farmLocation,
        farm_size: profile.farmSize,
        primary_crops: profile.primaryCrops
      });
    } catch (e) {
      console.error('Supabase profile save error (fallback saved):', e);
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    localStorage.setItem('ks_settings', JSON.stringify(settings));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        localStorage.setItem(`ks_avatar_${userId}`, base64String);
        window.dispatchEvent(new Event('avatar-updated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account</h1>
        {saveSuccess && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-medium animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            Saved successfully
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl max-w-sm">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'profile' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'settings' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 space-y-6">
                
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-3xl font-bold border-4 border-white shadow-md uppercase overflow-hidden">
                      {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : (profile.name ? profile.name.charAt(0) : '?')}
                    </div>
                    <label className="absolute bottom-0 right-0 p-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{profile.name || 'Set your name'}</h2>
                    <p className="text-sm text-slate-500 font-medium">{profile.farmLocation || 'Location not set'}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      <Shield className="w-3.5 h-3.5" />
                      Verified Farmer
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={e => setProfile({...profile, name: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={profile.phone}
                        onChange={e => setProfile({...profile, phone: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="email" 
                        value={profile.email}
                        readOnly
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-500 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Farm Location</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={profile.farmLocation}
                        onChange={e => setProfile({...profile, farmLocation: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Farm Size</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={profile.farmSize}
                        onChange={e => setProfile({...profile, farmSize: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Crops</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={profile.primaryCrops}
                        onChange={e => setProfile({...profile, primaryCrops: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-70 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                    ) : 'Save Profile'}
                  </button>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              
              {/* App Preferences */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900">App Preferences</h3>
                </div>
                <div className="p-2">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Language</div>
                        <div className="text-xs font-medium text-slate-500">App display language</div>
                      </div>
                    </div>
                    <select 
                      value={settings.language}
                      onChange={e => setSettings({...settings, language: e.target.value})}
                      className="text-sm font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>English</option>
                      <option>हिंदी (Hindi)</option>
                      <option>मराठी (Marathi)</option>
                      <option>తెలుగు (Telugu)</option>
                    </select>
                  </div>


                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                </div>
                <div className="p-2">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Push Notifications</div>
                        <div className="text-xs font-medium text-slate-500">Advisories and alerts</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.notifications} onChange={e => setSettings({...settings, notifications: e.target.checked})} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">SMS Alerts</div>
                        <div className="text-xs font-medium text-slate-500">Critical weather warnings</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.smsAlerts} onChange={e => setSettings({...settings, smsAlerts: e.target.checked})} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-70 flex items-center gap-2"
                >
                  {isSaving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : 'Save Settings'}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Links</h3>
            <div className="space-y-1">
              <Link href="/privacy" className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors">
                <span>Privacy Policy</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/terms" className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors">
                <span>Terms of Service</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link href="/help" className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors">
                <span>Help & Support</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-sm font-bold transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}
