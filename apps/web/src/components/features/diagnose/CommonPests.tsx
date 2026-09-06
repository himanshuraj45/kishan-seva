import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight, X, AlertTriangle, ShieldCheck, Stethoscope } from 'lucide-react'
import Image from 'next/image'

const PESTS = [
  { 
    img: '/images/diagnose/pest_aphids.jpg', 
    name: 'Aphids', 
    desc: 'Small insects that suck sap, causing leaf curling and yellowing.',
    symptoms: 'Curled, stunted, or yellowing leaves. Presence of sticky honeydew or black sooty mold on leaves.',
    treatment: 'Use neem oil or insecticidal soap. For severe infestations, use systemic insecticides like Imidacloprid.',
    prevention: 'Encourage natural predators like ladybugs. Avoid excessive nitrogen fertilizer.'
  },
  { 
    img: '/images/diagnose/pest_stem_borer.jpg', 
    name: 'Stem Borer', 
    desc: 'Larvae that bore into stems, weakening the plant.',
    symptoms: 'Dead heart (drying of central shoot), entry holes on stems with frass (excreta) visible.',
    treatment: 'Apply systemic granules like Cartap hydrochloride or spray Chlorantraniliprole during early stages.',
    prevention: 'Deep summer ploughing, crop rotation, and timely planting. Remove and destroy stubble after harvest.'
  },
  { 
    img: '/images/diagnose/pest_powdery_mildew.jpg', 
    name: 'Powdery Mildew', 
    desc: 'White powdery spots on leaves and stems reducing yield.',
    symptoms: 'White to gray powdery fungal growth on leaves, stems, and sometimes fruit. Leaves may twist or turn yellow.',
    treatment: 'Apply sulfur-based fungicides or systemic fungicides like Tebuconazole or Azoxystrobin.',
    prevention: 'Ensure good air circulation, avoid overhead watering, and use resistant varieties if available.'
  },
  { 
    img: '/images/diagnose/pest_whitefly.jpg', 
    name: 'Whitefly', 
    desc: 'Tiny white flies that weaken plants by feeding and spreading virus.',
    symptoms: 'Clouds of tiny white flies when plants are disturbed. Sticky honeydew on leaves and transmission of leaf curl viruses.',
    treatment: 'Use yellow sticky traps. Spray botanical insecticides or synthetic options like Acetamiprid or Diafenthiuron.',
    prevention: 'Weed control in and around fields, use reflective mulches to repel them.'
  },
  { 
    img: '/images/diagnose/pest_armyworm.jpg', 
    name: 'Armyworm', 
    desc: 'Defoliating larvae attacking leaves and fruits rapidly.',
    symptoms: 'Skeletonized leaves, large irregular holes in foliage, and frass on leaves or in leaf whorls.',
    treatment: 'Apply biological control like Bacillus thuringiensis (Bt) or chemicals like Spinetoram or Emamectin benzoate.',
    prevention: 'Regular scouting, deep ploughing to expose pupae to birds, and installing pheromone traps.'
  },
  { 
    img: '/images/diagnose/pest_spider_mites.jpg', 
    name: 'Spider Mites', 
    desc: 'Microscopic mites that suck plant sap, stunting growth and webbing leaves.',
    symptoms: 'Tiny yellow or white speckles on leaves. Fine silk webbing underneath leaves or on stems. Leaves may eventually turn bronze or brown and drop off.',
    treatment: 'Spray horticultural oils or insecticidal soaps. Use specialized miticides like Abamectin for severe cases.',
    prevention: 'Maintain high humidity as mites thrive in dry conditions. Introduce predatory mites (Phytoseiulus persimilis) to control populations naturally.'
  },
  { 
    img: '/images/diagnose/pest_late_blight.jpg', 
    name: 'Late Blight', 
    desc: 'Devastating disease causing dark lesions on leaves, stems, and fruits.',
    symptoms: 'Large, dark, water-soaked spots on leaves. In humid conditions, a white fuzzy mold appears on the undersides of the spots. Fruits develop greasy brown blotches.',
    treatment: 'Apply fungicides containing Chlorothalonil or Copper as soon as symptoms appear. Infected plants must be removed and destroyed immediately.',
    prevention: 'Plant resistant varieties. Ensure adequate spacing for airflow, and water at the base of plants to keep foliage dry.'
  },
  { 
    img: '/images/diagnose/pest_leaf_miner.jpg', 
    name: 'Leaf Miner', 
    desc: 'Insects whose larvae tunnel inside leaves, reducing photosynthesis.',
    symptoms: 'Distinctive white or silvery twisting, serpentine trails (mines) across the surface of the leaves. Heavy infestations cause leaves to dry out and fall.',
    treatment: 'Use systemic insecticides like Spinosad or Cyromazine since contact sprays cannot reach the larvae inside the leaf.',
    prevention: 'Use row covers to prevent adult flies from laying eggs. Release parasitic wasps (Diglyphus isaea) for biological control.'
  },
]

interface CommonPestsProps {
  pestIndex: number
  setPestIndex: (val: number | ((prev: number) => number)) => void
}

export default function CommonPests({ pestIndex, setPestIndex }: CommonPestsProps) {
  const [selectedPest, setSelectedPest] = useState<typeof PESTS[0] | null>(null)
  const VISIBLE = 3
  const maxIndex = PESTS.length - VISIBLE

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Common Pests & Diseases</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setPestIndex((i: number) => Math.max(0, i - 1))} 
              disabled={pestIndex === 0}
              className={`w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center transition-all ${
                pestIndex === 0 ? 'bg-slate-50 opacity-50 cursor-not-allowed' : 'bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm cursor-pointer'
              }`}
            >
              <ChevronLeft size={18} className={pestIndex === 0 ? 'text-slate-400' : 'text-slate-700'} />
            </button>
            <button 
              onClick={() => setPestIndex((i: number) => Math.min(maxIndex, i + 1))} 
              disabled={pestIndex >= maxIndex}
              className={`w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center transition-all ${
                pestIndex >= maxIndex ? 'bg-slate-50 opacity-50 cursor-not-allowed' : 'bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm cursor-pointer'
              }`}
            >
              <ChevronRight size={18} className={pestIndex >= maxIndex ? 'text-slate-400' : 'text-slate-700'} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PESTS.slice(pestIndex, pestIndex + VISIBLE).map((pest, i) => (
            <div 
              key={i} 
              className="group bg-white rounded-2xl border border-slate-200/60 p-5 flex flex-col hover:shadow-xl hover:shadow-[#2A854B]/5 hover:border-[#2A854B]/20 transition-all duration-300"
            >
              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-100 mb-4 shrink-0">
                <Image 
                  src={pest.img} 
                  alt={pest.name} 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5">{pest.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{pest.desc}</p>
                </div>
                <button 
                  onClick={() => setSelectedPest(pest)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#2A854B] hover:text-[#1e6136] transition-colors w-fit group/btn"
                >
                  Learn More
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Overlay */}
      {selectedPest && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setSelectedPest(null)} 
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header Image */}
            <div className="relative w-full h-48 sm:h-56 bg-slate-100">
              <Image 
                src={selectedPest.img} 
                alt={selectedPest.name} 
                fill
                className="object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              <button 
                onClick={() => setSelectedPest(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
              <h2 className="absolute bottom-4 left-6 text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {selectedPest.name}
              </h2>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 sm:p-8 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                  <AlertTriangle size={16} className="text-amber-500" /> Symptoms
                </h4>
                <p className="text-slate-600 text-[15px] leading-relaxed">
                  {selectedPest.symptoms}
                </p>
              </div>
              
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                  <Stethoscope size={16} className="text-blue-500" /> Treatment
                </h4>
                <p className="text-slate-600 text-[15px] leading-relaxed">
                  {selectedPest.treatment}
                </p>
              </div>
              
              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                  <ShieldCheck size={16} className="text-[#2A854B]" /> Prevention
                </h4>
                <p className="text-slate-600 text-[15px] leading-relaxed bg-[#f3f9f5] p-4 rounded-xl border border-[#2A854B]/10">
                  {selectedPest.prevention}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

