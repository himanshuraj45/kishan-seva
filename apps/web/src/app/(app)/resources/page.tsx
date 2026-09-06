'use client';

import React, { useState } from 'react';
import { RentalsTab } from './RentalsTab';
import { StorageTab } from './StorageTab';
import { FertiliserTab } from './FertiliserTab';
import { Tractor, Warehouse, ShoppingBag } from 'lucide-react';

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<'rentals' | 'storage' | 'fertiliser'>('fertiliser');

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f0f4f0]">
      {/* Fixed Header with Tabs */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm z-10 pt-4">
        <div className="px-6 mb-4">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Farm Resources</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Rent equipment or find cold storage near your location.
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-6 px-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('rentals')}
            className={`flex items-center gap-2 pb-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'rentals'
                ? 'border-green-500 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Tractor size={16} />
            Equipment Rentals
          </button>
          
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 pb-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'storage'
                ? 'border-sky-500 text-sky-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Warehouse size={16} />
            Cold Storage Finder
          </button>
          
          <button
            onClick={() => setActiveTab('fertiliser')}
            className={`flex items-center gap-2 pb-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'fertiliser'
                ? 'border-indigo-500 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ShoppingBag size={16} />
            Fertiliser Store
          </button>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'rentals' && <RentalsTab />}
        {activeTab === 'storage' && <StorageTab />}
        {activeTab === 'fertiliser' && <FertiliserTab />}
      </div>
    </div>
  );
}
