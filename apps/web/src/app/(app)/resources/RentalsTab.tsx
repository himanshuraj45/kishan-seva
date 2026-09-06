'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  Calendar, 
  Clock, 
  IndianRupee,
  Tractor,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';

// --- MOCK DATA ---
const CATEGORIES = ['All', 'Tractors', 'Harvesters', 'Implements', 'Drones'];

const MOCK_EQUIPMENT = [
  {
    id: 'eq1',
    name: 'New Holland T7 (Blue)',
    category: 'Tractors',
    owner: 'Ramesh Singh',
    distance: 2.4, // km
    rating: 4.9,
    reviews: 31,
    pricePerHour: 600,
    imageUrl: '/equipment/tractor_blue.jpg',
    description: 'Modern blue New Holland tractor in excellent condition. High horsepower, AC cabin. Includes driver.'
  },
  {
    id: 'eq2',
    name: 'John Deere S760 Combine',
    category: 'Harvesters',
    owner: 'Kisan Co-op Society',
    distance: 5.1,
    rating: 4.8,
    reviews: 56,
    pricePerHour: 1800,
    imageUrl: '/equipment/combine_harvester.jpg',
    description: 'Large green combine harvester. Extremely fast field clearing for wheat and soybeans.'
  },
  {
    id: 'eq3',
    name: 'Kuhn Heavy-Duty Rotavator',
    category: 'Implements',
    owner: 'Amit Patel',
    distance: 1.5,
    rating: 4.6,
    reviews: 18,
    pricePerHour: 150,
    imageUrl: '/equipment/rotavator.jpg',
    description: 'Heavy duty red rotavator. Excellent for breaking up hard soil. Tractor not included.'
  },
  {
    id: 'eq4',
    name: 'DJI Agras Spray Drone',
    category: 'Drones',
    owner: 'AgriTech Solutions',
    distance: 8.0,
    rating: 5.0,
    reviews: 42,
    pricePerHour: 1400,
    imageUrl: '/images/rentals/drone.jpg',
    description: 'Automated pesticide spraying drone. Includes licensed operator.'
  },
  {
    id: 'eq5',
    name: 'Swaraj 744 FE',
    category: 'Tractors',
    owner: 'Vikram Yadav',
    distance: 12.5,
    rating: 4.5,
    reviews: 12,
    pricePerHour: 450,
    imageUrl: '/images/rentals/swaraj_tractor.jpg',
    description: 'Reliable 48 HP tractor. Bare equipment rental (no driver).'
  },
  {
    id: 'eq6',
    name: 'Class Dominator Harvester',
    category: 'Harvesters',
    owner: 'Suresh Kumar',
    distance: 22.0,
    rating: 4.7,
    reviews: 84,
    pricePerHour: 1600,
    imageUrl: '/equipment/combine_harvester.jpg',
    description: 'Multi-crop combine harvester. High efficiency.'
  },
  {
    id: 'eq7',
    name: 'Mahindra 575 DI',
    category: 'Tractors',
    owner: 'Prakash Rao',
    distance: 3.2,
    rating: 4.3,
    reviews: 15,
    pricePerHour: 400,
    imageUrl: '/images/rentals/mahindra_tractor.jpg',
    description: 'Solid 45 HP workhorse for general farm duties.'
  },
  {
    id: 'eq8',
    name: 'Seed Drill (11 Tine)',
    category: 'Implements',
    owner: 'Balram Singh',
    distance: 4.5,
    rating: 4.4,
    reviews: 9,
    pricePerHour: 100,
    imageUrl: '/images/rentals/seed_drill.jpg',
    description: 'Automatic seed drill implement. Perfect for precise sowing.'
  },
  {
    id: 'eq9',
    name: 'Eicher 380 Tractor',
    category: 'Tractors',
    owner: 'Laxman Choudhary',
    distance: 6.8,
    rating: 4.6,
    reviews: 22,
    pricePerHour: 350,
    imageUrl: '/images/rentals/eicher_tractor.jpg',
    description: 'Compact 40 HP tractor, highly fuel efficient.'
  },
  {
    id: 'eq10',
    name: 'Potato Planter',
    category: 'Implements',
    owner: 'Ravi Verma',
    distance: 14.1,
    rating: 4.8,
    reviews: 6,
    pricePerHour: 180,
    imageUrl: '/images/rentals/potato_planter.jpg',
    description: 'Two-row automatic potato planter implement.'
  }
];

export function RentalsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [maxDistance, setMaxDistance] = useState<number>(15);
  
  // Booking Modal State
  const [selectedEq, setSelectedEq] = useState<any>(null);
  const [bookingHours, setBookingHours] = useState<number>(4);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Filter logic
  const filteredEquipment = useMemo(() => {
    return MOCK_EQUIPMENT.filter(eq => {
      const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            eq.owner.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || eq.category === activeCategory;
      const matchesDistance = eq.distance <= maxDistance;
      
      return matchesSearch && matchesCategory && matchesDistance;
    });
  }, [searchQuery, activeCategory, maxDistance]);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate) return alert('Please select a date');
    // Simulate booking API call
    setTimeout(() => {
      setIsSuccess(true);
    }, 600);
  };

  const closeBooking = () => {
    setSelectedEq(null);
    setIsSuccess(false);
    setBookingHours(4);
    setBookingDate('');
  };

  return (
    <div style={{ backgroundColor: 'var(--color-parchment)', minHeight: '100%', fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}>
      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header & Search */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', margin: '0 0 8px 0', fontSize: '1.75rem', color: 'var(--color-saddle)' }}>Equipment Rentals</h1>
              <p style={{ margin: 0, color: 'var(--color-bark)', fontSize: '0.95rem' }}>Find and rent tractors and harvesters from farmers near you.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-saddle)' }} />
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Search equipment or owner..." 
                  style={{ width: '100%', paddingLeft: '36px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--color-bone)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: activeCategory === cat ? '#65a30d' : 'var(--color-bone)',
                    backgroundColor: activeCategory === cat ? '#65a30d' : '#fff',
                    color: activeCategory === cat ? '#fff' : 'var(--color-saddle)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
              <Filter size={18} color="var(--color-bark)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--color-bark)', fontWeight: 500 }}>Max Distance: {maxDistance}km</span>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={maxDistance} 
                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                style={{ accentColor: '#65a30d' }}
              />
            </div>
          </div>
        </div>

        {/* Equipment Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {filteredEquipment.length > 0 ? filteredEquipment.map(eq => (
            <div key={eq.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                <img src={eq.imageUrl} alt={eq.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-saddle)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={14} fill="#eab308" color="#eab308" /> {eq.rating} ({eq.reviews})
                </div>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-saddle)', fontWeight: 700 }}>{eq.name}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--color-bark)', marginBottom: '12px' }}>
                  <MapPin size={14} /> {eq.distance} km away • {eq.owner}
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--color-ink)', lineHeight: 1.5, flex: 1 }}>
                  {eq.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-bone)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-bark)', fontWeight: 500, textTransform: 'uppercase' }}>Rent</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#65a30d', display: 'flex', alignItems: 'center' }}>
                      ₹{eq.pricePerHour}<span style={{ fontSize: '0.875rem', color: 'var(--color-bark)', fontWeight: 500 }}>/hr</span>
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedEq(eq)}
                    style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: '#65a30d', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4d7c0f'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#65a30d'}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '16px', border: '1px dashed var(--color-bone)' }}>
              <Tractor size={48} color="var(--color-bone)" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-saddle)', margin: '0 0 8px 0' }}>No equipment found</h3>
              <p style={{ color: 'var(--color-bark)', margin: 0 }}>Try expanding your search distance or changing the category.</p>
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {selectedEq && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', backgroundColor: '#fff', overflow: 'hidden', animation: 'scaleIn 0.2s ease-out' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-bone)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-honey-amber)', color: 'var(--color-saddle)' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{isSuccess ? 'Booking Confirmed' : 'Request Booking'}</h3>
              <button onClick={closeBooking} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-saddle)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {isSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle2 size={64} color="var(--color-success)" style={{ margin: '0 auto 16px auto' }} />
                  <h4 style={{ fontSize: '1.25rem', margin: '0 0 8px 0', color: 'var(--color-saddle)' }}>Booking Requested!</h4>
                  <p style={{ color: 'var(--color-bark)', margin: '0 0 24px 0' }}>
                    {selectedEq.owner} will review your request for {bookingDate}. You will receive an SMS confirmation shortly.
                  </p>
                  <button onClick={closeBooking} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#65a30d', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Done</button>
                </div>
              ) : (
                <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img src={selectedEq.imageUrl} alt={selectedEq.name} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.125rem', color: 'var(--color-saddle)' }}>{selectedEq.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-bark)' }}>Owner: {selectedEq.owner}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-saddle)', marginBottom: '8px' }}>Date</label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-bark)' }} />
                        <input 
                          type="date" 
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="input" 
                          style={{ width: '100%', paddingLeft: '36px' }} 
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-saddle)', marginBottom: '8px' }}>Duration (Hours)</label>
                      <div style={{ position: 'relative' }}>
                        <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-bark)' }} />
                        <input 
                          type="number" 
                          min="1" 
                          max="24"
                          value={bookingHours}
                          onChange={(e) => setBookingHours(parseInt(e.target.value))}
                          className="input" 
                          style={{ width: '100%', paddingLeft: '36px' }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-parchment)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-bone)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--color-bark)' }}>
                      <span>Rate (₹{selectedEq.pricePerHour}/hr × {bookingHours || 0} hrs)</span>
                      <span>₹{(selectedEq.pricePerHour * (bookingHours || 0)).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--color-bark)' }}>
                      <span>Platform Fee (0%)</span>
                      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>FREE</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-bone)', paddingTop: '12px', fontWeight: 700, color: 'var(--color-saddle)', fontSize: '1.125rem' }}>
                      <span>Total Estimated Cost</span>
                      <span>₹{(selectedEq.pricePerHour * (bookingHours || 0)).toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button type="button" onClick={closeBooking} style={{ flex: 1, backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ flex: 2, backgroundColor: '#65a30d', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Confirm Request</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

