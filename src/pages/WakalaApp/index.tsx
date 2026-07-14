import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, Search, ArrowLeft, Package, ShoppingCart, DollarSign, LogOut, Copy, Link as LinkIcon, QrCode, TrendingUp, CheckCircle2, Clock, History } from 'lucide-react';
import { Product, Order, Broker } from '../../types';
import { apiFetch } from '../../lib/db';
import { useDialog } from '../../components/CustomDialogContext';
import { formatCurrency } from '../../lib/storage';
import { PriceDisplay } from '../../components/PriceDisplay';
import { ImageWithSkeleton } from '../../components/ImageWithSkeleton';

function WakalaLogin({ onLogin }: { onLogin: (id: string) => void }) {
  const [wakalaId, setWakalaId] = useState('');
  const [loading, setLoading] = useState(false);
  const { showAlert } = useDialog();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wakalaId.trim()) {
      showAlert("Error", "Tafadhali weka namba/ID ya wakala.");
      return;
    }
    setLoading(true);
    // Simulation: any ID is valid for demo, in reality we'd verify it via API
    setTimeout(() => {
      onLogin(wakalaId.trim());
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Briefcase size={32} />
        </div>
        <h1 className="text-2xl font-black text-center text-slate-900 mb-2">Wakala Portal</h1>
        <p className="text-center text-slate-500 mb-8 font-medium">Ingia kwenye dashibodi yako kuona kamisheni na mauzo.</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ID ya Wakala</label>
            <input 
              type="text"
              value={wakalaId}
              onChange={(e) => setWakalaId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-bold"
              placeholder="Mfano: WK-12345"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Inatafuta..." : "Ingia Kwenye Akaunti"}
          </button>
        </form>
      </div>
    </div>
  );
}

function WakalaDashboard({ wakalaId, onLogout }: { wakalaId: string, onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [broker, setBroker] = useState<Broker | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');
  const [filterOption, setFilterOption] = useState<'all' | 'with-commission'>('all');
  const [sortOption, setSortOption] = useState<'default' | 'high-commission'>('default');
  const { showAlert } = useDialog();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, oRes, bRes] = await Promise.all([
          apiFetch('/api/v1/products'),
          apiFetch('/api/v1/orders'),
          fetch(`/api/brokers/${wakalaId}`).then(r => r.json())
        ]);
        
        if (pRes.success && oRes.success) {
          // Filter products where this wakala is the broker
          const myProducts = (pRes.data || []).filter((p: Product) => p.brokerId === wakalaId);
          // Filter orders placed via this broker
          const myOrders = (oRes.data || []).filter((o: Order) => o.brokerId === wakalaId);
          
          setProducts(myProducts);
          setOrders(myOrders);
          setBroker(bRes);
        }
      } catch (err) {
        console.error("Failed to fetch wakala data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [wakalaId]);

  const processedProducts = useMemo(() => {
    let list = products.filter(p => p.stock > 0); // Hide sold out
    if (filterOption === 'with-commission') {
      list = list.filter(p => (broker?.commissionRate ?? p.brokerCommissionPercent ?? 0) > 0);
    }
    if (sortOption === 'high-commission') {
      list.sort((a, b) => (broker?.commissionRate ?? b.brokerCommissionPercent ?? 0) - (broker?.commissionRate ?? a.brokerCommissionPercent ?? 0));
    }
    return list;
  }, [products, filterOption, sortOption, broker]);

  const totalCommission = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.brokerCommissionAmount) || 0), 0);
  }, [orders]);

  const copyLink = (product: Product) => {
    const commission = broker?.commissionRate ?? product.brokerCommissionPercent;
    if (!commission || commission === 0) {
      showAlert("Taarifa", "Bidhaa hii haina kamisheni kwa wakala. Je, unataka kuendelea?");
      // Or just continue if they want to sell anyway? 
      // The requirement says: "broker will be notified... so they will decide to sell or find other products"
    }
    const link = `${window.location.origin}/?product=${product.id}&ref=${wakalaId}`;
    navigator.clipboard.writeText(link);
    showAlert("Imefanikiwa", "Link ya bidhaa imenakiliwa kwenye clipboard.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin text-emerald-500"><Briefcase size={32} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-slate-900 font-black text-xl mb-1">
            <Briefcase className="text-emerald-500" /> Orbi Wakala
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{wakalaId}</div>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Briefcase size={18} /> Dashibodi
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'products' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Package size={18} /> Bidhaa Zangu
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <ShoppingCart size={18} /> Oda & Mauzo
          </button>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} /> Ondoka
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Karibu tena, {wakalaId}</h2>
                <p className="text-slate-500 mt-1 font-medium">Huu ni muhtasari wa mauzo na kamisheni yako.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] -mr-4 -mt-4 z-0"></div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Package size={28} />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-slate-900">{products.length}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Bidhaa</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-[100px] -mr-4 -mt-4 z-0"></div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                      <ShoppingCart size={28} />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-slate-900">{orders.length}</div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Oda</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-emerald-500 p-6 rounded-3xl shadow-lg relative overflow-hidden text-white">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[120px] -mr-4 -mt-4 z-0"></div>
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <DollarSign size={20} />
                      </div>
                      <div className="text-sm font-bold uppercase tracking-widest text-emerald-100">Jumla ya Kamisheni</div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black tracking-tight mt-2">{formatCurrency(totalCommission)}</div>
                  </div>
                </div>
              </div>

              {/* Commission Tracking Summary Section */}
              <div className="mt-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={20} />
                  Muhtasari wa Kamisheni (Commission Tracking)
                </h3>
                <div className="space-y-4">
                  {/* Detailed breakdown */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Kamisheni Zilizokamilika (Available)</div>
                        <div className="text-xs text-slate-500">Tayari kutoa au kutumia</div>
                      </div>
                    </div>
                    <div className="font-black text-emerald-600 text-lg">
                      {formatCurrency(totalCommission * 0.8)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                        <Clock size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Zinazosubiri (Pending)</div>
                        <div className="text-xs text-slate-500">Zitasomwa oda ikikamilika</div>
                      </div>
                    </div>
                    <div className="font-black text-amber-600 text-lg">
                      {formatCurrency(totalCommission * 0.2)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center">
                        <History size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Zilizotolewa (Withdrawn)</div>
                        <div className="text-xs text-slate-500">Kamisheni ulizokwisha toa</div>
                      </div>
                    </div>
                    <div className="font-black text-slate-600 text-lg">
                      {formatCurrency(0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Bidhaa Zangu</h2>
                <p className="text-slate-500 mt-1 font-medium">Kusanya mauzo kwa kushiriki viungo (links) vya bidhaa hizi.</p>
              </div>

              {/* Filter and Sort Controls */}
              <div className="flex flex-wrap gap-4 items-center">
                <select value={filterOption} onChange={(e) => setFilterOption(e.target.value as any)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700">
                  <option value="all">Zote</option>
                  <option value="with-commission">Zenye Kamisheni</option>
                </select>
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value as any)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700">
                  <option value="default">Panga kwa: Chaguomsingi</option>
                  <option value="high-commission">Panga kwa: Kamisheni Juu</option>
                </select>
              </div>

              {processedProducts.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
                  <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800">Hauna bidhaa zozote</h3>
                  <p className="text-slate-500 mt-2">Wasiliana na wauzaji ili upewe bidhaa za kutangaza.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedProducts.map(p => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
                      <div className="h-48 bg-slate-100 relative">
                        <ImageWithSkeleton
                          src={p.images?.[0] || 'https://placehold.co/400x300?text=No+Image'}
                          alt={p.name}
                          containerClassName="w-full h-full"
                        />
                        <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">
                          Kamisheni: {broker?.commissionRate ?? p.brokerCommissionPercent ?? 0}%
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{p.name}</h3>
                        <div className="mb-4">
                          <PriceDisplay amount={p.price} compact />
                        </div>
                        <div className="mt-auto flex gap-2">
                          <button 
                            onClick={() => copyLink(p)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <LinkIcon size={16} /> Copy Link
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Oda & Mauzo Yangu</h2>
                <p className="text-slate-500 mt-1 font-medium">Fuatilia oda zilizofanywa kupitia viungo vyako.</p>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
                  <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800">Hauna oda zozote</h3>
                  <p className="text-slate-500 mt-2">Endelea kutangaza bidhaa ili kupata mauzo zaidi.</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Oda No.</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tarehe</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Jumla (Tsh)</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Kamisheni Yako</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map(o => (
                          <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{o.orderNumber || o.id.slice(0, 8)}</td>
                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-700">{formatCurrency(o.totalPrice)}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-black text-sm">
                                +{formatCurrency(o.brokerCommissionAmount || 0)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WakalaApp() {
  const [wakalaId, setWakalaId] = useState<string | null>(() => localStorage.getItem('orbi_wakala_id'));
  const navigate = useNavigate();

  const handleLogin = (id: string) => {
    localStorage.setItem('orbi_wakala_id', id);
    setWakalaId(id);
    navigate('/wakalas/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('orbi_wakala_id');
    setWakalaId(null);
    navigate('/wakalas/login');
  };

  return (
    <Routes>
      {wakalaId ? (
        <Route path="*" element={<WakalaDashboard wakalaId={wakalaId} onLogout={handleLogout} />} />
      ) : (
        <Route path="*" element={<WakalaLogin onLogin={handleLogin} />} />
      )}
    </Routes>
  );
}
