import React, { useState } from 'react';
import { Search, ShoppingCart, Leaf, Filter, Star, Plus, Check, Minus, X, CreditCard, Truck, ShieldCheck, ChevronRight, MapPin } from 'lucide-react';

const FERTILISERS = [
  { id: 'f1', name: 'IFFCO Neem Coated Urea', category: 'Nitrogenous', composition: '46% N', price: 266, weight: '45 kg', rating: 4.8, type: 'Chemical', color: '#0ea5e9', brand: 'IFFCO', image: 'https://images.unsplash.com/photo-1628183204959-1e16104bc684?w=400&q=80' },
  { id: 'f2', name: 'Coromandel Gromor DAP', category: 'Phosphatic', composition: '18% N, 46% P', price: 1350, weight: '50 kg', rating: 4.9, type: 'Chemical', color: '#6366f1', brand: 'Coromandel', image: 'https://images.unsplash.com/photo-1590494578198-e4b2d5cb3fb3?w=400&q=80' },
  { id: 'f3', name: 'IPL Muriate of Potash (MOP)', category: 'Potassic', composition: '60% K', price: 1700, weight: '50 kg', rating: 4.7, type: 'Chemical', color: '#ec4899', brand: 'IPL', image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80' },
  { id: 'f4', name: 'Mahadhan NPK 12:32:16', category: 'Complex', composition: '12% N, 32% P, 16% K', price: 1470, weight: '50 kg', rating: 4.8, type: 'Chemical', color: '#a855f7', brand: 'Mahadhan', image: 'https://images.unsplash.com/photo-1628183204959-1e16104bc684?w=400&q=80' },
  { id: 'f5', name: 'IFFCO NPK 10:26:26', category: 'Complex', composition: '10% N, 26% P, 26% K', price: 1440, weight: '50 kg', rating: 4.7, type: 'Chemical', color: '#8b5cf6', brand: 'IFFCO', image: 'https://images.unsplash.com/photo-1590494578198-e4b2d5cb3fb3?w=400&q=80' },
  { id: 'f6', name: 'Rama Single Super Phosphate', category: 'Phosphatic', composition: '16% P, 11% S', price: 450, weight: '50 kg', rating: 4.5, type: 'Chemical', color: '#3b82f6', brand: 'Rama', image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80' },
  { id: 'f7', name: 'Aries Zinc Sulphate 21%', category: 'Micro-nutrient', composition: '21% Zn, 10% S', price: 850, weight: '10 kg', rating: 4.6, type: 'Chemical', color: '#f97316', brand: 'Aries', image: 'https://images.unsplash.com/photo-1628183204959-1e16104bc684?w=400&q=80' },
  { id: 'f8', name: 'NatureSurge Vermicompost', category: 'Organic', composition: 'Organic Carbon', price: 350, weight: '50 kg', rating: 4.9, type: 'Organic', color: '#22c55e', brand: 'NatureSurge', image: 'https://images.unsplash.com/photo-1590494578198-e4b2d5cb3fb3?w=400&q=80' },
  { id: 'f9', name: 'YaraLiva Calcium Nitrate', category: 'Micro-nutrient', composition: '15.5% N, 18.8% Ca', price: 1200, weight: '25 kg', rating: 4.8, type: 'Chemical', color: '#eab308', brand: 'Yara', image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80' },
  { id: 'f10', name: 'Kisan Bio Mycorrhiza', category: 'Organic', composition: 'VAM Fungi', price: 600, weight: '4 kg', rating: 4.8, type: 'Organic', color: '#14b8a6', brand: 'Kisan Bio', image: 'https://images.unsplash.com/photo-1628183204959-1e16104bc684?w=400&q=80' },
];

const CATEGORIES = ['All', 'Nitrogenous', 'Phosphatic', 'Potassic', 'Complex', 'Micro-nutrient', 'Organic'];

export function FertiliserTab() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);

  const filtered = FERTILISERS.filter(f => 
    (activeCategory === 'All' || f.category === activeCategory) &&
    (f.name.toLowerCase().includes(search.toLowerCase()) || f.brand.toLowerCase().includes(search.toLowerCase()) || f.composition.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (id: string) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id: string) => setCart(prev => {
    const newCart = { ...prev };
    if (newCart[id] > 1) newCart[id] -= 1;
    else delete newCart[id];
    return newCart;
  });

  const cartTotalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = FERTILISERS.find(f => f.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const handleCheckout = () => {
    if (checkoutStep === 0) setCheckoutStep(1);
    else if (checkoutStep === 1) {
      // Send email via mailto
      const orderDetails = Object.entries(cart).map(([id, qty]) => {
        const item = FERTILISERS.find(f => f.id === id);
        return `${qty}x ${item?.name} (${item?.weight}) - ₹${(item?.price || 0) * qty}`;
      }).join('\\n');
      
      const total = cartTotalAmount - Math.floor(cartTotalAmount * 0.15);
      const orderId = `KS-${Math.floor(Math.random()*1000000)}`;
      
      const mailtoLink = `mailto:luffyfocusmode@gmail.com?subject=New Fertiliser Order: ${orderId}&body=${encodeURIComponent(`Hello,

I would like to place an order for the following fertilisers:

${orderDetails}

Total Amount (after subsidy): ₹${total}

Delivery Address:
Farm Plot 2A, Village Raipur, Ludhiana, Punjab 141001

Please confirm my order.

Thank you.`)}`;
      
      window.location.href = mailtoLink;

      setCheckoutStep(2);
      setTimeout(() => {
        setCart({});
        setIsCartOpen(false);
        setCheckoutStep(0);
      }, 3000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50" style={{ scrollBehavior: 'smooth' }}>
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 py-10 px-6 sm:px-10 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <Leaf size={240} className="-mr-10 -mt-10" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-3xl font-black mb-2 tracking-tight">KisanSeva Agrimart</h2>
          <p className="text-emerald-100 max-w-xl text-sm leading-relaxed mb-6 font-medium">
            100% Original Fertilizers. Direct from Manufacturers. Subsidised rates for verified farmers. Free delivery to your farm within 48 hours.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-white border border-white/10">
              <ShieldCheck size={16} className="text-emerald-300" /> Government Approved
            </div>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-white border border-white/10">
              <Truck size={16} className="text-emerald-300" /> Free Farm Delivery
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
        
        {/* Search & Cart Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-stretch md:items-center sticky top-0 z-20 bg-gray-50/90 backdrop-blur py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-gray-200/50 shadow-sm">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search by brand, name or composition (e.g., IFFCO, Urea, NPK...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white font-medium text-gray-900 placeholder-gray-400"
            />
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-800 px-6 py-3.5 rounded-xl font-black shadow-sm hover:border-emerald-500 hover:text-emerald-700 transition-all group"
          >
            <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
            Cart
            {cartTotalItems > 0 && (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
                <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">{cartTotalItems} items</span>
                <span className="text-emerald-700">₹{cartTotalAmount}</span>
              </div>
            )}
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex overflow-x-auto gap-2.5 pb-4 mb-6 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm transition-all border ${
                activeCategory === cat 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-500 hover:text-emerald-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(f => {
            const inCart = cart[f.id] || 0;
            return (
              <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
                
                {/* Image Section */}
                <div className="h-48 relative overflow-hidden bg-gray-100 flex items-center justify-center">
                  {/* Decorative backdrop */}
                  <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${f.color} 0%, transparent 100%)` }} />
                  
                  {/* Tags */}
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${f.type === 'Organic' ? 'bg-green-500/90 text-white' : 'bg-white/90 text-gray-700 shadow-sm'}`}>
                      {f.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded text-xs font-black text-gray-800 shadow-sm">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {f.rating}
                  </div>
                  
                  {/* Visual Product Representation (Bag) */}
                  <div className="relative z-10 w-28 h-36 rounded-xl shadow-lg flex flex-col items-center justify-center border-2 border-white/20 transform group-hover:scale-105 transition-transform duration-500" style={{ background: `linear-gradient(135deg, ${f.color} 0%, ${f.color}dd 100%)` }}>
                    <div className="absolute top-0 w-full h-4 bg-white/20 border-b border-white/30 border-dashed" />
                    <div className="absolute bottom-2 right-2 text-white/50 text-[10px] font-black uppercase">{f.brand}</div>
                    <Leaf size={32} className="text-white drop-shadow-md mb-2" />
                    <span className="text-white font-black text-lg tracking-tight drop-shadow-md">{f.weight}</span>
                  </div>
                </div>
                
                {/* Details Section */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{f.brand} • {f.category}</div>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 leading-snug mb-3 group-hover:text-emerald-700 transition-colors">{f.name}</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-xs font-bold border border-gray-200">
                      {f.composition}
                    </span>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Subsidised Price</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900">₹{f.price}</span>
                        <span className="text-xs font-bold text-gray-500">/ bag</span>
                      </div>
                    </div>
                    
                    {inCart > 0 ? (
                      <div className="flex items-center gap-1 bg-emerald-50 p-1 rounded-lg border border-emerald-200">
                        <button onClick={() => removeFromCart(f.id)} className="w-8 h-8 rounded bg-white flex items-center justify-center text-emerald-700 font-bold shadow-sm hover:bg-emerald-100 transition-colors">
                          <Minus size={16} />
                        </button>
                        <span className="font-black text-emerald-800 w-8 text-center">{inCart}</span>
                        <button onClick={() => addToCart(f.id)} className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm hover:bg-emerald-700 transition-colors">
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart(f.id)}
                        className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-black text-sm hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <ShoppingCart size={16} /> Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filtered.length === 0 && (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-200 mt-6">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Search className="text-gray-300" size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No fertilisers found</h3>
            <p className="text-gray-500 font-medium">Try searching for a different brand or composition.</p>
            <button onClick={() => {setSearch(''); setActiveCategory('All')}} className="mt-6 text-emerald-600 font-bold hover:underline">
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Cart Sidebar Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Cart Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <ShoppingCart className="text-emerald-600" /> 
                Your Cart
                {cartTotalItems > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full ml-2">{cartTotalItems} items</span>}
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {cartTotalItems === 0 && checkoutStep === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
                    <ShoppingCart size={40} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 text-sm font-medium mb-8">Add fertilizers to your cart to see them here.</p>
                  <button onClick={() => setIsCartOpen(false)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black shadow-sm">
                    Continue Shopping
                  </button>
                </div>
              ) : checkoutStep === 2 ? (
                <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                    <Check size={48} strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Order Confirmed!</h3>
                  <p className="text-gray-500 text-sm font-medium mb-8 max-w-xs">Your fertilizers will be delivered to your registered farm address within 48 hours.</p>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-sm text-gray-600 font-bold mb-8">
                    Order ID: #KS-{Math.floor(Math.random()*1000000)}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(cart).map(([id, qty]) => {
                    const item = FERTILISERS.find(f => f.id === id)!;
                    return (
                      <div key={id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
                        <div className="w-16 h-20 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)` }}>
                          <span className="text-white font-black text-xs">{item.weight}</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase">{item.brand}</div>
                          <h4 className="font-black text-gray-900 text-sm leading-tight mb-2">{item.name}</h4>
                          <div className="flex justify-between items-center">
                            <div className="font-black text-emerald-700">₹{item.price * qty}</div>
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md">
                              <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded bg-white flex items-center justify-center text-gray-600 font-bold shadow-sm">
                                <Minus size={14} />
                              </button>
                              <span className="font-black text-gray-800 w-6 text-center text-xs">{qty}</span>
                              <button onClick={() => addToCart(item.id)} className="w-6 h-6 rounded bg-white flex items-center justify-center text-gray-600 font-bold shadow-sm">
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {checkoutStep === 1 && (
                    <div className="bg-white p-5 rounded-xl border border-emerald-200 mt-6 animate-in slide-in-from-bottom-4">
                      <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2"><MapPin size={18} className="text-emerald-600"/> Delivery Address</h4>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                        <p className="font-bold text-gray-800 text-sm">Farm Plot 2A</p>
                        <p className="text-xs text-gray-500 mt-1">Village Raipur, Ludhiana, Punjab 141001</p>
                      </div>
                      <h4 className="font-black text-gray-900 mb-3 flex items-center gap-2"><CreditCard size={18} className="text-emerald-600"/> Payment Method</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 border border-emerald-500 bg-emerald-50 rounded-lg cursor-pointer">
                          <input type="radio" name="payment" defaultChecked className="text-emerald-600 focus:ring-emerald-500" />
                          <span className="font-bold text-sm text-gray-800">Cash on Delivery (COD)</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input type="radio" name="payment" className="text-emerald-600 focus:ring-emerald-500" />
                          <span className="font-bold text-sm text-gray-800">Kisan Credit Card (KCC)</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input type="radio" name="payment" className="text-emerald-600 focus:ring-emerald-500" />
                          <span className="font-bold text-sm text-gray-800">UPI / Net Banking</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cartTotalItems > 0 && checkoutStep !== 2 && (
              <div className="border-t border-gray-200 bg-white p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm text-gray-500 font-medium">
                    <span>Subtotal</span>
                    <span>₹{cartTotalAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 font-medium">
                    <span>Delivery Fee</span>
                    <span className="text-emerald-600 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 font-medium">
                    <span>Govt. Subsidy Applied</span>
                    <span className="text-emerald-600 font-bold">-₹{Math.floor(cartTotalAmount * 0.15)}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-end">
                    <span className="font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-black text-emerald-700">₹{cartTotalAmount - Math.floor(cartTotalAmount * 0.15)}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-lg shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2"
                >
                  {checkoutStep === 0 ? 'Proceed to Checkout' : 'Confirm Order'} 
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
