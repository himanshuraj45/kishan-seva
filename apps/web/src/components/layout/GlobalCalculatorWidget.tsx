'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calculator } from 'lucide-react';

export default function GlobalCalculatorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [calcInput, setCalcInput] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcInput('');
    } else if (val === '=') {
      try {
        const sanitized = calcInput.replace(/[^-()\d/*+.]/g, '');
        // eslint-disable-next-line no-new-func
        const result = new Function(`return ${sanitized}`)();
        setCalcInput(String(result));
      } catch (e) {
        setCalcInput('Error');
        setTimeout(() => setCalcInput(''), 1500);
      }
    } else {
      setCalcInput((prev) => prev + val);
    }
  };

  const calcButtons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    'C', '0', '=', '+'
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors relative"
        title="Calculator"
      >
        <Calculator size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Calculator size={16} className="text-[#65a30d]" /> 
              Calculator
            </h3>
          </div>
          
          <div className="p-4">
            <div className="bg-slate-100 rounded-lg p-3 mb-4 text-right text-2xl font-mono text-slate-800 min-h-[60px] flex items-center justify-end overflow-x-auto border border-slate-200 shadow-inner">
              {calcInput || '0'}
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {calcButtons.map((btn) => {
                const isOp = ['/', '*', '-', '+', '='].includes(btn);
                const isClear = btn === 'C';
                
                return (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => handleCalcClick(btn)}
                    className={`py-3 text-lg font-semibold rounded-lg shadow-sm transition-transform active:scale-95 ${
                      isOp 
                        ? 'bg-[#65a30d] text-white hover:bg-[#4d7c0f]' 
                        : isClear 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {btn}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

