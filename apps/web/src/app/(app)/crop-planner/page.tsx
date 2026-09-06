'use client';

import React, { useState, useEffect } from 'react';
import { Sprout, Search, Info, Leaf, Calculator, FlaskConical, Download, Check, AlertCircle } from 'lucide-react';

// ==========================================
// 1. DATA & CONSTANTS (Combined)
// ==========================================

const PAGE_BG = { background: '#f0f4f0', minHeight: '100vh', paddingBottom: 100 };

const ALL_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli', 'Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const ALL_CROPS = [
  'Wheat', 'Rice (Paddy)', 'Maize', 'Jowar (Sorghum)', 'Bajra (Pearl Millet)', 'Ragi (Finger Millet)', 'Barley',
  'Chickpea (Chana)', 'Pigeon Pea (Arhar/Tur)', 'Lentil (Masoor)', 'Mung Bean (Moong)', 'Black Gram (Urad)', 'Kidney Bean (Rajma)',
  'Groundnut', 'Mustard', 'Soybean', 'Sunflower', 'Sesame (Til)', 'Linseed', 'Castor',
  'Cotton', 'Sugarcane', 'Jute', 'Tobacco',
  'Tomato', 'Onion', 'Potato', 'Brinjal (Eggplant)', 'Cabbage', 'Cauliflower', 'Peas', 'Okra (Bhindi)', 'Bitter Gourd', 'Bottle Gourd', 'Pumpkin', 'Chilli', 'Capsicum', 'Spinach', 'Fenugreek (Methi)',
  'Mango', 'Banana', 'Papaya', 'Guava', 'Pomegranate', 'Grape', 'Orange', 'Lemon', 'Apple', 'Pineapple', 'Watermelon',
  'Turmeric', 'Ginger', 'Garlic', 'Coriander', 'Cumin', 'Cardamom', 'Pepper', 'Coconut', 'Arecanut',
];

const IRRIGATION_TYPES = [
  'Rainfed (No Irrigation)', 'Canal Irrigation', 'Borewell / Tubewell', 'Drip Irrigation', 'Sprinkler Irrigation',
  'Tank / Pond Irrigation', 'River Lift Irrigation', 'Check Dam / Farm Pond', 'Flood Irrigation', 'Micro-irrigation',
];

interface SeedVariety {
  id: string;
  crop: string;
  variety: string;
  yieldQPerAcre: string;
  durationDays: string;
  traits: string[];
  costPerAcre: number;
  source: string;
  season: string;
  suitableIrrigation: string[];
  notSuitableStates?: string[];
  suitableStates?: string[];
}

const SEED_DB: SeedVariety[] = [
  // Wheat
  { id: 'w1', crop: 'Wheat', variety: 'HD-3086 (Pusa Wheat)', yieldQPerAcre: '20-24', durationDays: '150-155', traits: ['High Yield', 'Rust Resistant', 'Good Bread Quality'], costPerAcre: 1800, source: 'ICAR-IARI', season: 'Rabi', suitableIrrigation: ['canal', 'borewell', 'tubewell', 'drip', 'sprinkler', 'flood', 'irrigation'] },
  { id: 'w2', crop: 'Wheat', variety: 'DBW-187 (Karunā)', yieldQPerAcre: '22-26', durationDays: '143-150', traits: ['Very High Yield', 'Lodging Resistant', 'Short Duration'], costPerAcre: 2000, source: 'ICAR-IIWR', season: 'Rabi', suitableIrrigation: ['canal', 'borewell', 'tubewell', 'drip', 'sprinkler', 'flood', 'irrigation'] },
  { id: 'w3', crop: 'Wheat', variety: 'GW-496 (Gujarat)', yieldQPerAcre: '18-22', durationDays: '110-115', traits: ['Early Maturity', 'Heat Tolerant', 'Drought Tolerant'], costPerAcre: 1500, source: 'Gujarat AU', season: 'Rabi', suitableIrrigation: ['rainfed', 'canal', 'borewell', 'tubewell', 'river', 'tank'] },
  { id: 'w4', crop: 'Wheat', variety: 'HD-2781 (Shreshtha)', yieldQPerAcre: '18-20', durationDays: '145-150', traits: ['Rust Resistant', 'Good for Peninsular India'], costPerAcre: 1600, source: 'ICAR-IARI', season: 'Rabi', suitableIrrigation: ['rainfed', 'canal', 'borewell'], suitableStates: ['Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Madhya Pradesh', 'Chhattisgarh'] },
  { id: 'w5', crop: 'Wheat', variety: 'K-307 (Malviya)', yieldQPerAcre: '16-20', durationDays: '130-140', traits: ['Rainfed Adapted', 'Drought Tolerant', 'Late Sowing'], costPerAcre: 1400, source: 'BHU Varanasi', season: 'Rabi', suitableIrrigation: ['rainfed', 'canal', 'tank', 'check dam'], suitableStates: ['Uttar Pradesh', 'Bihar', 'Jharkhand', 'West Bengal'] },
  { id: 'w6', crop: 'Wheat', variety: 'PBW-752 (Punjab)', yieldQPerAcre: '22-24', durationDays: '155-160', traits: ['High Yield', 'Late Sown', 'Pest Resistant'], costPerAcre: 1900, source: 'PAU Ludhiana', season: 'Rabi', suitableIrrigation: ['canal', 'borewell', 'tubewell', 'flood', 'sprinkler'], suitableStates: ['Punjab', 'Haryana', 'Delhi', 'Chandigarh'] },

  // Rice
  { id: 'r1', crop: 'Rice (Paddy)', variety: 'Swarna (MTU-7029)', yieldQPerAcre: '25-30', durationDays: '145-150', traits: ['Water Logging Tolerant', 'High Yield', 'Popular Variety'], costPerAcre: 1200, source: 'AICIP', season: 'Kharif', suitableIrrigation: ['canal', 'flood', 'river', 'borewell', 'tank', 'rain'] },
  { id: 'r2', crop: 'Rice (Paddy)', variety: 'Pusa Basmati 1121', yieldQPerAcre: '16-20', durationDays: '135-145', traits: ['Long Grain', 'Premium Aroma', 'Export Quality'], costPerAcre: 2500, source: 'ICAR-IARI', season: 'Kharif', suitableIrrigation: ['canal', 'borewell', 'drip', 'sprinkler', 'flood'] },
  { id: 'r3', crop: 'Rice (Paddy)', variety: 'DRR Dhan-44', yieldQPerAcre: '28-32', durationDays: '125-130', traits: ['Early Maturity', 'High Yield', 'Drought Tolerant'], costPerAcre: 1400, source: 'ICAR-IIRR', season: 'Kharif', suitableIrrigation: ['rainfed', 'canal', 'tank', 'river'] },
  { id: 'r4', crop: 'Rice (Paddy)', variety: 'Sahbhagi Dhan', yieldQPerAcre: '12-18', durationDays: '105-115', traits: ['Drought Tolerant', 'Rainfed Suitable', 'Low Input'], costPerAcre: 1000, source: 'ICAR-IIRR', season: 'Kharif', suitableIrrigation: ['rainfed', 'tank', 'check dam', 'rain'] },
  { id: 'r5', crop: 'Rice (Paddy)', variety: 'BPT-5204 (Samba Mahsuri)', yieldQPerAcre: '20-24', durationDays: '155-165', traits: ['Excellent Cooking Quality', 'Soft Texture', 'Popular South India'], costPerAcre: 1800, source: 'ANGRAU', season: 'Kharif', suitableIrrigation: ['canal', 'river', 'borewell', 'tank', 'flood'] },
  { id: 'r6', crop: 'Rice (Paddy)', variety: 'PR-126 (Punjab)', yieldQPerAcre: '22-26', durationDays: '123-128', traits: ['Short Duration', 'Water Saving', 'Direct Seeding'], costPerAcre: 1500, source: 'PAU Ludhiana', season: 'Kharif', suitableIrrigation: ['canal', 'borewell', 'drip', 'sprinkler', 'micro'] },

  // Maize
  { id: 'm1', crop: 'Maize', variety: 'DHM-117 (Rakshak)', yieldQPerAcre: '28-35', durationDays: '95-100', traits: ['High Yield', 'Lodging Resistant', 'Downy Mildew Resistant'], costPerAcre: 2200, source: 'ICAR-IIMR', season: 'Kharif', suitableIrrigation: ['canal', 'borewell', 'drip', 'sprinkler', 'rain', 'river'] },
  { id: 'm2', crop: 'Maize', variety: 'Vivek QPM-9', yieldQPerAcre: '20-26', durationDays: '85-90', traits: ['High Protein', 'Early Maturing', 'Hilly Areas'], costPerAcre: 2000, source: 'VPKAS Almora', season: 'Kharif', suitableIrrigation: ['rainfed', 'rain', 'canal', 'sprinkler'] },
  { id: 'm3', crop: 'Maize', variety: 'HQPM-1', yieldQPerAcre: '24-30', durationDays: '90-95', traits: ['Quality Protein', 'High Lysine', 'Good for Poultry Feed'], costPerAcre: 2400, source: 'ICAR', season: 'Kharif', suitableIrrigation: ['drip', 'sprinkler', 'canal', 'borewell', 'flood'] },

  // Cotton
  { id: 'c1', crop: 'Cotton', variety: 'Bunny Bt (BGII)', yieldQPerAcre: '10-14', durationDays: '160-175', traits: ['Bollworm Resistant', 'High Yield', 'Good Fibre Quality'], costPerAcre: 3500, source: 'Nuziveedu Seeds', season: 'Kharif', suitableIrrigation: ['canal', 'drip', 'borewell', 'flood', 'micro'] },
  { id: 'c2', crop: 'Cotton', variety: 'RCH-2 BGII', yieldQPerAcre: '9-13', durationDays: '155-165', traits: ['Early Maturity', 'Medium Staple', 'Widely Adapted'], costPerAcre: 3200, source: 'Rasi Seeds', season: 'Kharif', suitableIrrigation: ['rainfed', 'canal', 'borewell', 'flood'] },
  { id: 'c3', crop: 'Cotton', variety: 'LD-230 (Desi)', yieldQPerAcre: '6-9', durationDays: '170-185', traits: ['Drought Tolerant', 'Desi Variety', 'No BT Fee'], costPerAcre: 1200, source: 'Punjab AU', season: 'Kharif', suitableIrrigation: ['rainfed', 'canal', 'tank', 'check dam'] },

  // Soybean
  { id: 'sb1', crop: 'Soybean', variety: 'JS-335', yieldQPerAcre: '10-14', durationDays: '95-100', traits: ['High Yield', 'Lodging Resistant', 'Widely Adapted'], costPerAcre: 2200, source: 'JNKVV', season: 'Kharif', suitableIrrigation: ['rainfed', 'canal', 'borewell', 'sprinkler', 'rain'] },
  { id: 'sb2', crop: 'Soybean', variety: 'NRC-7', yieldQPerAcre: '10-12', durationDays: '90-95', traits: ['Early Maturing', 'Drought Tolerant', 'MYMV Resistant'], costPerAcre: 2000, source: 'ICAR-IISR', season: 'Kharif', suitableIrrigation: ['rainfed', 'drip', 'sprinkler', 'rain'] },

  // Groundnut
  { id: 'gn1', crop: 'Groundnut', variety: 'GG-20', yieldQPerAcre: '12-15', durationDays: '110-115', traits: ['High Oil Content', 'Medium Bold', 'Drought Tolerant'], costPerAcre: 3800, source: 'Gujarat AU', season: 'Kharif', suitableIrrigation: ['rainfed', 'canal', 'borewell', 'drip', 'sprinkler'] },
  { id: 'gn2', crop: 'Groundnut', variety: 'TAG-24', yieldQPerAcre: '10-13', durationDays: '105-110', traits: ['Early Maturity', 'Rainfed Suitable', 'Drought Tolerant'], costPerAcre: 3200, source: 'TNAU', season: 'Kharif', suitableIrrigation: ['rainfed', 'canal', 'tank', 'rain'] },

  // Mustard
  { id: 'mu1', crop: 'Mustard', variety: 'Pusa Bold (T-59)', yieldQPerAcre: '8-10', durationDays: '115-125', traits: ['High Oil', 'Widely Adapted', 'Aphid Tolerant'], costPerAcre: 1600, source: 'ICAR-IARI', season: 'Rabi', suitableIrrigation: ['rainfed', 'canal', 'borewell', 'flood', 'sprinkler'] },
  { id: 'mu2', crop: 'Mustard', variety: 'NRCHB-506', yieldQPerAcre: '9-12', durationDays: '120-130', traits: ['Very High Yield', 'High Erucic Free', 'Alternaria Resistant'], costPerAcre: 1800, source: 'NRRI Bharatpur', season: 'Rabi', suitableIrrigation: ['canal', 'borewell', 'drip', 'sprinkler', 'flood'] },

  // Chickpea
  { id: 'cp1', crop: 'Chickpea (Chana)', variety: 'JG-14 (Jawaharlal)', yieldQPerAcre: '6-9', durationDays: '95-100', traits: ['Early Maturity', 'Wilt Resistant', 'Rainfed Suitable'], costPerAcre: 2800, source: 'JNKVV', season: 'Rabi', suitableIrrigation: ['rainfed', 'canal', 'borewell', 'rain', 'check dam'] },
  { id: 'cp2', crop: 'Chickpea (Chana)', variety: 'Pusa 372', yieldQPerAcre: '7-10', durationDays: '105-115', traits: ['High Yield', 'Drought Tolerant', 'Good Seed Size'], costPerAcre: 2600, source: 'ICAR-IARI', season: 'Rabi', suitableIrrigation: ['rainfed', 'canal', 'borewell', 'flood', 'river'] },

  // Tomato
  { id: 't1', crop: 'Tomato', variety: 'Arka Vikas', yieldQPerAcre: '140-160', durationDays: '110-120', traits: ['Drought Tolerant', 'Good Shelf Life', 'High Lycopene'], costPerAcre: 4500, source: 'ICAR-IIHR', season: 'Kharif/Rabi', suitableIrrigation: ['drip', 'sprinkler', 'canal', 'borewell', 'micro'] },
  { id: 't2', crop: 'Tomato', variety: 'Pusa Ruby', yieldQPerAcre: '120-140', durationDays: '100-110', traits: ['Round Fruit', 'Good for Processing', 'Widely Adapted'], costPerAcre: 4000, source: 'ICAR-IARI', season: 'Kharif/Rabi', suitableIrrigation: ['drip', 'sprinkler', 'canal', 'borewell', 'river'] },
  { id: 't3', crop: 'Tomato', variety: 'Heemsohna (H-86)', yieldQPerAcre: '100-120', durationDays: '90-100', traits: ['Cold Tolerant', 'Hilly Areas', 'Firm Fruit'], costPerAcre: 5000, source: 'PAU Ludhiana', season: 'Summer', suitableIrrigation: ['drip', 'sprinkler', 'canal', 'borewell'] },

  // Onion
  { id: 'on1', crop: 'Onion', variety: 'Agrifound Dark Red', yieldQPerAcre: '100-120', durationDays: '110-120', traits: ['Dark Red Bulb', 'Good Storage', 'High Yield'], costPerAcre: 6000, source: 'NHRDF', season: 'Rabi', suitableIrrigation: ['drip', 'sprinkler', 'canal', 'borewell', 'flood'] },
  { id: 'on2', crop: 'Onion', variety: 'Nasik Red (N-2-4-1)', yieldQPerAcre: '90-110', durationDays: '115-125', traits: ['Export Quality', 'Pungent', 'Long Storage'], costPerAcre: 5500, source: 'DOGR Nasik', season: 'Rabi', suitableIrrigation: ['drip', 'sprinkler', 'canal', 'borewell', 'river'] },

  // Potato
  { id: 'po1', crop: 'Potato', variety: 'Kufri Jyoti', yieldQPerAcre: '60-80', durationDays: '80-90', traits: ['High Yield', 'Late Blight Tolerant', 'Good Table Quality'], costPerAcre: 12000, source: 'ICAR-CPRI', season: 'Rabi', suitableIrrigation: ['drip', 'sprinkler', 'canal', 'borewell', 'flood', 'river'] },
  { id: 'po2', crop: 'Potato', variety: 'Kufri Bahar', yieldQPerAcre: '70-90', durationDays: '90-100', traits: ['High Yield', 'Chips Quality', 'Early Maturity'], costPerAcre: 13000, source: 'ICAR-CPRI', season: 'Rabi', suitableIrrigation: ['drip', 'sprinkler', 'canal', 'borewell', 'micro'] },

  // Sugarcane
  { id: 'sc1', crop: 'Sugarcane', variety: 'Co-238', yieldQPerAcre: '350-400', durationDays: '360-365', traits: ['High Sugar Recovery', 'Drought Tolerant', 'Widely Adapted'], costPerAcre: 8000, source: 'ICAR-IISR', season: 'Annual', suitableIrrigation: ['canal', 'drip', 'flood', 'borewell', 'river', 'micro'] },
  { id: 'sc2', crop: 'Sugarcane', variety: 'CoJ-64 (Punjab)', yieldQPerAcre: '320-380', durationDays: '360-365', traits: ['Cold Tolerant', 'High Yield', 'Early Season'], costPerAcre: 7500, source: 'PAU Ludhiana', season: 'Annual', suitableIrrigation: ['canal', 'flood', 'drip', 'borewell', 'river'] },
];

function scoreVariety(seed: SeedVariety, irrigation: string): number {
  const irr = irrigation.toLowerCase();
  let score = 0;
  for (const key of seed.suitableIrrigation) {
    if (irr.includes(key) || key.includes(irr.split(' ')[0])) score += 2;
  }
  return score;
}

function getSeedRecommendations(crop: string, state: string, irrigation: string): SeedVariety[] {
  const matches = SEED_DB
    .filter(s => s.crop === crop)
    .filter(s => {
      if (s.suitableStates && s.suitableStates.length > 0) return s.suitableStates.includes(state);
      if (s.notSuitableStates && s.notSuitableStates.includes(state)) return false;
      return true;
    })
    .map(s => ({ ...s, _score: scoreVariety(s, irrigation) }))
    .sort((a, b) => (b as any)._score - (a as any)._score);
  return matches.length > 0 ? matches : SEED_DB.filter(s => s.crop === crop);
}

const TRAIT_COLORS: Record<string, string> = {
  'High Yield': '#166534', 'Very High Yield': '#14532d', 'Drought Tolerant': '#92400e',
  'Rainfed': '#78350f', 'Rainfed Suitable': '#78350f', 'Rust Resistant': '#1e3a5f',
  'Wilt Resistant': '#1e3a5f', 'Early Maturity': '#5b21b6', 'Export Quality': '#9f1239', 'High Oil': '#b45309',
};
function traitColor(t: string) { return TRAIT_COLORS[t] ?? '#1d4ed8'; }


type CalcResult = {
  id: string;
  date: string;
  crop: string;
  area: number;
  fertilizers: { name: string; kgPerAcre: number; totalKg: number; cost: number }[];
  pesticides: { name: string; dosage: string; coverage: string }[];
  totalCost: number;
};

const NPK_RECOMMENDATIONS: Record<string, { N: number, P: number, K: number, pest: any[] }> = {
  'Wheat': { N: 60, P: 30, K: 20, pest: [{ name: 'Mancozeb 75% WP', dosage: '2.5g/L', coverage: 'Rust prevention' }] },
  'Rice (Paddy)': { N: 50, P: 25, K: 25, pest: [{ name: 'Tricyclazole 75% WP', dosage: '0.6g/L', coverage: 'Blast control' }] },
  'Maize': { N: 60, P: 30, K: 20, pest: [{ name: 'Emamectin Benzoate', dosage: '0.4g/L', coverage: 'Fall Armyworm' }] },
  'Sugarcane': { N: 120, P: 40, K: 40, pest: [{ name: 'Chlorantraniliprole', dosage: '0.3ml/L', coverage: 'Borer control' }] },
  'Cotton': { N: 60, P: 30, K: 30, pest: [{ name: 'Imidacloprid 17.8% SL', dosage: '0.5ml/L', coverage: 'Sucking pests' }] },
  'Tomato': { N: 60, P: 40, K: 40, pest: [{ name: 'Chlorothalonil 75% WP', dosage: '2g/L', coverage: 'Early blight' }] },
  'Potato': { N: 70, P: 40, K: 60, pest: [{ name: 'Mancozeb 75% WP', dosage: '2.5g/L', coverage: 'Late blight' }] },
  'Onion': { N: 40, P: 20, K: 20, pest: [{ name: 'Profenofos', dosage: '1.5ml/L', coverage: 'Thrips control' }] },
  'Soybean': { N: 15, P: 30, K: 15, pest: [{ name: 'Quinalphos', dosage: '2ml/L', coverage: 'Stem fly' }] },
  'Chickpea (Chana)': { N: 10, P: 20, K: 10, pest: [{ name: 'Indoxacarb', dosage: '0.5ml/L', coverage: 'Pod borer' }] },
  'Groundnut': { N: 15, P: 25, K: 20, pest: [{ name: 'Chlorpyrifos', dosage: '2ml/L', coverage: 'White grub' }] },
  'Mustard': { N: 30, P: 20, K: 15, pest: [{ name: 'Dimethoate', dosage: '2ml/L', coverage: 'Aphids' }] },
};

const FALLBACK_NPK = { N: 40, P: 20, K: 20, pest: [{ name: 'Neem Oil 10000ppm', dosage: '3ml/L', coverage: 'General pest deterrent' }] };

const PRICES = {
  'Urea': 5.92,
  'DAP': 27.00,
  'MOP': 34.00,
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function CropPlannerPage() {
  const [activeTab, setActiveTab] = useState<'seeds' | 'fertilizer'>('seeds');

  // Seed State
  const [state, setState] = useState('');
  const [seedCrop, setSeedCrop] = useState('');
  const [irrigation, setIrrigation] = useState('');
  const [seedResults, setSeedResults] = useState<SeedVariety[]>([]);
  const [seedSearched, setSeedSearched] = useState(false);

  // Fertilizer State
  const [fertForm, setFertForm] = useState({ crop: 'Wheat', area: 1, soil: 'Loamy', stage: 'Sowing' });
  const [fertResult, setFertResult] = useState<CalcResult | null>(null);

  const handleSeedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !seedCrop || !irrigation) return;
    setSeedResults(getSeedRecommendations(seedCrop, state, irrigation));
    setSeedSearched(true);
  };

  const handleFertilizerCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const data = NPK_RECOMMENDATIONS[fertForm.crop] || FALLBACK_NPK;
    
    const dapNeeded = Math.ceil(data.P / 0.46);
    const nFromDap = dapNeeded * 0.18;
    const remainingN = Math.max(0, data.N - nFromDap);
    const ureaNeeded = Math.ceil(remainingN / 0.46);
    const mopNeeded = Math.ceil(data.K / 0.60);

    const fertilizers = [
      { name: 'Urea (46% N)', kgPerAcre: ureaNeeded, totalKg: ureaNeeded * fertForm.area, cost: ureaNeeded * fertForm.area * PRICES.Urea },
      { name: 'DAP (18% N, 46% P)', kgPerAcre: dapNeeded, totalKg: dapNeeded * fertForm.area, cost: dapNeeded * fertForm.area * PRICES.DAP },
      { name: 'MOP (60% K)', kgPerAcre: mopNeeded, totalKg: mopNeeded * fertForm.area, cost: mopNeeded * fertForm.area * PRICES.MOP },
    ].filter(f => f.kgPerAcre > 0);
    
    const totalCost = fertilizers.reduce((sum, f) => sum + f.cost, 0);

    setFertResult({
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-IN'),
      crop: fertForm.crop,
      area: fertForm.area,
      fertilizers,
      pesticides: data.pest,
      totalCost
    });
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1px solid #d1d5db', fontSize: '0.95rem',
    outline: 'none', background: '#fff', color: '#111827', appearance: 'auto'
  };

  return (
    <div style={PAGE_BG}>
      
      {/* Header & Tabs */}
      <div style={{ background: '#fff', padding: '28px 24px 0', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2d6a27', marginBottom: 4 }}>
            <Sprout size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Crop Advisory & Planning
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.03em' }}>
            Smart Crop Planner
          </h1>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }}>
            <button 
              onClick={() => setActiveTab('seeds')} 
              style={{ padding: '10px 20px', borderRadius: 24, fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, background: activeTab === 'seeds' ? '#2d6a27' : '#f3f4f6', color: activeTab === 'seeds' ? '#fff' : '#4b5563' }}
            >
              <Sprout size={18} /> Seed Matcher
            </button>
            <button 
              onClick={() => setActiveTab('fertilizer')} 
              style={{ padding: '10px 20px', borderRadius: 24, fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, background: activeTab === 'fertilizer' ? '#2d6a27' : '#f3f4f6', color: activeTab === 'fertilizer' ? '#fff' : '#4b5563' }}
            >
              <Calculator size={18} /> Fertilizer Calculator
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>

        {/* ========================================================= */}
        {/* TAB 1: SEEDS */}
        {/* ========================================================= */}
        {activeTab === 'seeds' && (
          <div className="fade-in">
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px', marginBottom: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <form onSubmit={handleSeedSearch}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>State / UT</label>
                    <select value={state} onChange={e => setState(e.target.value)} style={selectStyle} required>
                      <option value="">Select State…</option>
                      {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Crop Type</label>
                    <select value={seedCrop} onChange={e => setSeedCrop(e.target.value)} style={selectStyle} required>
                      <option value="">Select Crop…</option>
                      {ALL_CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Irrigation Source</label>
                    <select value={irrigation} onChange={e => setIrrigation(e.target.value)} style={selectStyle} required>
                      <option value="">Select Irrigation…</option>
                      {IRRIGATION_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={!state || !seedCrop || !irrigation} style={{ width: '100%', padding: '14px', background: (!state || !seedCrop || !irrigation) ? '#9ca3af' : '#2d6a27', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: (!state || !seedCrop || !irrigation) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s' }}>
                  <Search size={20} /> Find Best Seed Varieties
                </button>
              </form>
            </div>

            {seedSearched ? (
              <>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', marginBottom: 16 }}>
                  {seedResults.length > 0 ? `${seedResults.length} varieties recommended for ${seedCrop} in ${state}` : `No specific varieties found for ${seedCrop} yet`}
                </h2>

                {seedResults.length === 0 && (
                  <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
                    <Sprout size={48} style={{ color: '#d1d5db', margin: '0 auto 16px', display: 'block' }} />
                    <p style={{ color: '#6b7280' }}>Please consult your local <strong>KVK</strong> for certified sources.</p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {seedResults.map((seed, idx) => (
                    <div key={seed.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: `2px solid ${idx === 0 ? '#16a34a' : '#e5e7eb'}`, boxShadow: idx === 0 ? '0 4px 20px rgba(22,163,74,0.15)' : '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
                      {idx === 0 && (
                        <div style={{ background: '#16a34a', color: '#fff', padding: '5px 14px', fontSize: '0.72rem', fontWeight: 800, position: 'absolute', top: 0, right: 0, borderBottomLeftRadius: 12, letterSpacing: '0.05em' }}>BEST MATCH</div>
                      )}
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                          <div style={{ width: 48, height: 48, background: idx === 0 ? '#dcfce7' : '#f3f4f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx === 0 ? '#166534' : '#6b7280', flexShrink: 0 }}><Sprout size={24} /></div>
                          <div>
                            <h3 style={{ margin: '0 0 3px', fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>{seed.variety}</h3>
                            <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{seed.source} · {seed.season}</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                          <div style={{ background: '#f9fafb', padding: '10px 12px', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Expected Yield</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>{seed.yieldQPerAcre} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#6b7280' }}>q/acre</span></div>
                          </div>
                          <div style={{ background: '#f9fafb', padding: '10px 12px', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Duration</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>{seed.durationDays} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#6b7280' }}>days</span></div>
                          </div>
                        </div>
                        <div style={{ marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {seed.traits.map(t => (
                            <span key={t} style={{ display: 'inline-block', background: traitColor(t) + '18', color: traitColor(t), padding: '3px 9px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>{t}</span>
                          ))}
                        </div>
                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>ESTIMATED SEED COST</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>₹{seed.costPerAcre.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#6b7280' }}>/acre</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ background: '#fff', borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Sprout size={36} style={{ color: '#2d6a27' }} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', marginBottom: 10 }}>Select Your Crop & Location</h2>
                <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>Choose your state, crop type, and irrigation source above to match the best government-recommended seed varieties.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: FERTILIZER */}
        {/* ========================================================= */}
        {activeTab === 'fertilizer' && (
          <div className="fade-in" style={{ display: 'grid', gap: 24, gridTemplateColumns: fertResult ? '1fr 1.5fr' : '1fr', alignItems: 'start' }}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, color: '#111827' }}>Parameters</h2>
              <form onSubmit={handleFertilizerCalculate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Crop Type</label>
                  <select value={fertForm.crop} onChange={e => setFertForm({...fertForm, crop: e.target.value})} style={selectStyle}>
                    {ALL_CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Field Area (Acres)</label>
                  <input type="number" step="0.1" min="0.1" value={fertForm.area} onChange={e => setFertForm({...fertForm, area: parseFloat(e.target.value) || 1})} style={selectStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Soil Type</label>
                  <select value={fertForm.soil} onChange={e => setFertForm({...fertForm, soil: e.target.value})} style={selectStyle}>
                    <option>Sandy</option><option>Loamy</option><option>Clay</option><option>Black Cotton Soil</option><option>Red Soil</option><option>Laterite</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 6 }}>Growth Stage</label>
                  <select value={fertForm.stage} onChange={e => setFertForm({...fertForm, stage: e.target.value})} style={selectStyle}>
                    <option>Basal Dose (Sowing)</option><option>Top Dressing 1 (Vegetative)</option><option>Top Dressing 2 (Flowering)</option><option>Fruiting</option>
                  </select>
                </div>
                <button type="submit" style={{ width: '100%', padding: '14px', background: '#2d6a27', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', marginTop: 12, transition: 'background 0.2s' }}>
                  Calculate Dosage
                </button>
              </form>
            </div>

            {fertResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ background: '#f0fdf4', padding: '16px 20px', borderBottom: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FlaskConical size={22} color="#16a34a" />
                    <h3 style={{ margin: 0, color: '#166534', fontWeight: 800, fontSize: '1.15rem' }}>Optimal Fertilizer Requirement</h3>
                  </div>
                  <div style={{ padding: 24 }}>
                    <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px dashed #d1d5db' }}>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>For {fertResult.area} Acre(s) of {fertResult.crop}</div>
                    </div>
                    {fertResult.fertilizers.map((f, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#111827', fontSize: '1.05rem' }}>{f.name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>{f.kgPerAcre} kg / acre</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, color: '#111827', fontSize: '1.15rem' }}>{f.totalKg.toFixed(1)} kg <span style={{fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af'}}>Total</span></div>
                          <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700 }}>₹{Math.round(f.cost).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ background: '#f9fafb', padding: '16px 20px', borderRadius: 12, marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e7eb' }}>
                      <span style={{ fontWeight: 700, color: '#4b5563', fontSize: '0.9rem' }}>Total Govt. Subsidized Cost:</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>₹{Math.round(fertResult.totalCost).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: '#111827' }}><Leaf size={18} color="#2d6a27"/> Crop Protection</h3>
                    {fertResult.pesticides.map((p, i) => (
                      <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < fertResult.pesticides.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <div style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Dosage: <span style={{color: '#374151', fontWeight: 700}}>{p.dosage}</span></div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{p.coverage}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: '#111827' }}><Leaf size={18} color="#84cc16"/> Organic Alternatives</h3>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>Neem Cake / Extract</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Dosage: <span style={{color: '#374151', fontWeight: 700}}>100 kg / acre</span></div>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Natural pest deterrent</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', padding: '64px 32px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 72, height: 72, background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><Calculator size={36} color="#9ca3af" /></div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: '0 0 12px' }}>Calculate Exact Inputs</h3>
                <p style={{ color: '#6b7280', margin: '0 auto', maxWidth: 400, lineHeight: 1.6, fontSize: '0.95rem' }}>Select your crop type and field area on the left to generate scientific fertilizer dosages.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
