'use client'

import React, { useState } from 'react'
import { Landmark, Search, Filter, ShieldCheck, FileText, Banknote, Tractor, ArrowRight, ExternalLink, Leaf, Droplets, Sun, Sprout, TrendingUp, Zap, Truck, BadgeIndianRupee } from 'lucide-react'

// Types
type SchemeCategory = 'All' | 'Financial Support' | 'Insurance' | 'Equipment' | 'Organic'

interface Scheme {
  id: string
  title: string
  category: SchemeCategory
  amount: string
  description: string
  eligibility: string[]
  icon: React.ReactNode
  color: string
  url: string
}

// Mock Database of Indian Agricultural Schemes
const SCHEMES_DB: Scheme[] = [
  {
    id: 'pmkisan',
    title: 'PM-KISAN Samman Nidhi',
    category: 'Financial Support',
    amount: '₹6,000 / year',
    description: 'Direct income support for all landholding farmer families across the country to supplement their financial needs for procuring various inputs.',
    eligibility: ['Small and marginal farmers', 'Own cultivable land', 'Aadhaar linked bank account'],
    icon: <Banknote size={28} />,
    color: '#1d4ed8', // blue-700
    url: 'https://pmkisan.gov.in/'
  },
  {
    id: 'pmfby',
    title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'Insurance',
    amount: 'Full coverage',
    description: 'Provides insurance coverage and financial support to farmers in the event of failure of any of the notified crops as a result of natural calamities, pests & diseases.',
    eligibility: ['All farmers growing notified crops', '2% premium for Kharif crops', '1.5% premium for Rabi crops'],
    icon: <ShieldCheck size={28} />,
    color: '#be185d', // pink-700
    url: 'https://pmfby.gov.in/'
  },
  {
    id: 'kcc',
    title: 'Kisan Credit Card (KCC)',
    category: 'Financial Support',
    amount: 'Up to ₹3,00,000',
    description: 'Provides timely credit to farmers to meet their short-term credit requirements for cultivation of crops, post-harvest expenses, and working capital.',
    eligibility: ['Individual/Joint borrowers', 'Tenant farmers, oral lessees', 'Self Help Groups (SHGs)'],
    icon: <FileText size={28} />,
    color: '#0f766e', // teal-700
    url: 'https://www.jansamarth.in/'
  },
  {
    id: 'pkvy',
    title: 'Paramparagat Krishi Vikas Yojana',
    category: 'Organic',
    amount: '₹50,000 / hectare',
    description: 'Promotes organic farming through a cluster approach and PGS certification. Financial assistance is provided for 3 years.',
    eligibility: ['Must form a cluster of 20 hectares', 'Willing to adopt organic practices', 'Registered with state nodal agency'],
    icon: <Leaf size={28} />,
    color: '#15803d', // green-700
    url: 'https://pgsindia-ncof.gov.in/'
  },
  {
    id: 'smam',
    title: 'Sub-Mission on Agricultural Mechanization',
    category: 'Equipment',
    amount: '40-80% Subsidy',
    description: 'Provides subsidies on the purchase of agricultural machinery and equipment like tractors, power tillers, and custom hiring centers.',
    eligibility: ['SC/ST, small & marginal farmers get higher subsidy', 'Valid land holding certificate', 'Quotation from approved vendor'],
    icon: <Tractor size={28} />,
    color: '#b45309', // amber-700
    url: 'https://agrimachinery.nic.in/'
  },
  {
    id: 'pmksy',
    title: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)',
    category: 'Equipment',
    amount: 'Varies by component',
    description: 'Aims to enhance physical access of water on farm and expand cultivable area under assured irrigation, improve on-farm water use efficiency, introduce sustainable water conservation practices.',
    eligibility: ['All farmers', 'Priority to small & marginal farmers', 'Must have cultivable land'],
    icon: <Droplets size={28} />,
    color: '#0284c7', // sky-600
    url: 'https://pmksy.gov.in/'
  },
  {
    id: 'enam',
    title: 'National Agriculture Market (e-NAM)',
    category: 'Financial Support',
    amount: 'Free Platform',
    description: 'A pan-India electronic trading portal which networks the existing APMC mandis to create a unified national market for agricultural commodities.',
    eligibility: ['Farmers registered in APMC', 'Valid ID and bank details', 'Quality testing of produce'],
    icon: <TrendingUp size={28} />,
    color: '#6366f1', // indigo-500
    url: 'https://enam.gov.in/'
  },
  {
    id: 'shc',
    title: 'Soil Health Card Scheme',
    category: 'Organic',
    amount: 'Free Testing',
    description: 'Promotes soil test based nutrient management. Issues soil health cards to farmers with recommendations on appropriate dosage of nutrients and fertilizers.',
    eligibility: ['All farmers across India', 'Soil sample collected by local admin'],
    icon: <Sprout size={28} />,
    color: '#d97706', // amber-600
    url: 'https://soilhealth.dac.gov.in/'
  },
  {
    id: 'pmkusum',
    title: 'PM-KUSUM Scheme',
    category: 'Equipment',
    amount: 'Up to 60% Subsidy',
    description: 'Ensures energy security for farmers in India, along with honoring India\'s commitment to increase the share of installed capacity of electric power from non-fossil-fuel sources.',
    eligibility: ['Individual farmers/groups/cooperatives', 'Land available for solar pump installation', 'Valid bank account'],
    icon: <Sun size={28} />,
    color: '#eab308', // yellow-500
    url: 'https://pmkusum.mnre.gov.in/'
  },
  {
    id: 'aif',
    title: 'Agriculture Infrastructure Fund (AIF)',
    category: 'Financial Support',
    amount: 'Up to ₹2 Crore loan',
    description: 'Financing facility for investment in viable projects for post-harvest management Infrastructure and community farming assets through interest subvention and financial support.',
    eligibility: ['Primary Agricultural Credit Societies (PACS)', 'Farmer Producer Organizations (FPOs)', 'Agri-entrepreneurs and Startups'],
    icon: <Landmark size={28} />,
    color: '#059669', // emerald-600
    url: 'https://agriinfra.dac.gov.in/'
  },
  {
    id: 'pmaasha',
    title: 'PM-AASHA',
    category: 'Financial Support',
    amount: 'MSP Guarantee',
    description: 'Pradhan Mantri Annadata Aay SanraksHan Abhiyan guarantees remunerative prices for the produce to farmers.',
    eligibility: ['Registered farmers', 'Cultivating pulses, oilseeds, and copra', 'Producing fair average quality (FAQ) grade'],
    icon: <BadgeIndianRupee size={28} />,
    color: '#7e22ce', // purple-700
    url: 'https://agricoop.nic.in/'
  },
  {
    id: 'midh',
    title: 'Mission for Integrated Dev. of Horticulture (MIDH)',
    category: 'Financial Support',
    amount: 'Varies by component',
    description: 'Holistic growth of the horticulture sector encompassing fruits, vegetables, root & tuber crops, mushrooms, spices, flowers, aromatic plants, coconut, cashew, cocoa and bamboo.',
    eligibility: ['Farmers growing horticultural crops', 'FPOs, Cooperatives', 'Agri-entrepreneurs'],
    icon: <Truck size={28} />,
    color: '#14b8a6', // teal-500
    url: 'https://midh.gov.in/'
  }
]

export default function SchemesPage() {
  const [activeCategory, setActiveCategory] = useState<SchemeCategory>('All')
  const [landSize, setLandSize] = useState<string>('any')
  const [cropCategory, setCropCategory] = useState<string>('any')
  const [isChecking, setIsChecking] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Filter logic
  const filteredSchemes = SCHEMES_DB.filter(scheme => {
    // Tab filter
    if (activeCategory !== 'All' && scheme.category !== activeCategory) return false

    // Form filters (only applied if user hit "Check My Schemes")
    if (showResults) {
      if (scheme.id === 'pmkisan' && (landSize === 'medium' || landSize === 'large')) {
        return false // PM-KISAN targets small/marginal
      }
      if (scheme.id === 'smam' && landSize === 'marginal') {
        return false // Very small land unlikely for heavy mechanization
      }
      if (scheme.id === 'pkvy' && cropCategory === 'cash') {
        return false // PKVY usually prioritizes food/horticulture
      }
    }

    return true
  })

  // Eligibility Checker Fake Logic
  const handleCheckEligibility = () => {
    setIsChecking(true)
    setShowResults(false)
    setTimeout(() => {
      setIsChecking(false)
      setShowResults(true)
    }, 1200)
  }

  const categories: SchemeCategory[] = ['All', 'Financial Support', 'Insurance', 'Equipment', 'Organic']

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: '#111827' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Government Schemes & Subsidies 🏛️
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#4b5563', margin: 0 }}>
          Discover and apply for agricultural welfare programs tailored to your profile.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, paddingBottom: 64 }}>
        
        {/* ELIGIBILITY CHECKER (HERO WIDGET) */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', borderRadius: 20, padding: 32, color: '#fff', boxShadow: '0 10px 25px -5px rgba(30,58,138,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <Search size={28} color="#93c5fd" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Instant Eligibility Checker</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#bfdbfe', marginBottom: 8 }}>Land Holding Size</label>
              <select 
                value={landSize} 
                onChange={e => setLandSize(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontSize: '1rem', appearance: 'none', cursor: 'pointer' }}
              >
                <option value="any" style={{ color: '#000' }}>Select land size...</option>
                <option value="marginal" style={{ color: '#000' }}>Marginal (Up to 1 Hectare)</option>
                <option value="small" style={{ color: '#000' }}>Small (1 to 2 Hectares)</option>
                <option value="medium" style={{ color: '#000' }}>Medium (2 to 10 Hectares)</option>
                <option value="large" style={{ color: '#000' }}>Large (More than 10 Hectares)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#bfdbfe', marginBottom: 8 }}>Primary Crop Type</label>
              <select 
                value={cropCategory} 
                onChange={e => setCropCategory(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontSize: '1rem', appearance: 'none', cursor: 'pointer' }}
              >
                <option value="any" style={{ color: '#000' }}>Select primary crop...</option>
                <option value="food" style={{ color: '#000' }}>Food Grains (Wheat, Rice)</option>
                <option value="horticulture" style={{ color: '#000' }}>Horticulture (Fruits, Veg)</option>
                <option value="cash" style={{ color: '#000' }}>Cash Crops (Cotton, Sugarcane)</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={handleCheckEligibility}
                disabled={isChecking}
                style={{ width: '100%', padding: '12px 24px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}
              >
                {isChecking ? 'Checking...' : 'Check My Schemes'} {isChecking ? null : <ArrowRight size={18} />}
              </button>
            </div>
          </div>

          {/* Results Banner */}
          {showResults && (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.2)', animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Great news! You are highly eligible for 3 major schemes.</div>
                <div style={{ fontSize: '0.9rem', color: '#e0e7ff', marginTop: 2 }}>Based on your {landSize === 'small' || landSize === 'marginal' ? landSize : 'land'} profile, we recommend PM-KISAN, PMFBY, and KCC.</div>
              </div>
              <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            </div>
          )}
        </div>

        {/* TABS & BROWSE SECTION */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Browse Schemes</h2>
            
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 99,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: activeCategory === cat ? '#166534' : '#e5e7eb',
                    color: activeCategory === cat ? '#fff' : '#4b5563',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* SCHEME CARDS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
            {filteredSchemes.map((scheme, i) => (
              <div key={scheme.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', animation: `fadeIn 0.4s ease-out ${i * 0.1}s both` }}>
                
                {/* Card Header */}
                <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: `${scheme.color}15`, color: scheme.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {scheme.icon}
                    </div>
                    <span style={{ background: '#f3f4f6', color: '#4b5563', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {scheme.category}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.3 }}>{scheme.title}</h3>
                  <div style={{ color: scheme.color, fontWeight: 800, fontSize: '1.1rem' }}>{scheme.amount}</div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '20px 24px', flex: 1 }}>
                  <p style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 20px' }}>
                    {scheme.description}
                  </p>
                  
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Filter size={16} /> Key Eligibility
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {scheme.eligibility.map((req, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.85rem', color: '#475569' }}>
                          <span style={{ color: '#166534', marginTop: 2 }}>✓</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Footer */}
                <div style={{ padding: '16px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                  <a href={scheme.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                    <button style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#166534', color: '#fff', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}>
                      Apply on Portal <ExternalLink size={16} />
                    </button>
                  </a>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

