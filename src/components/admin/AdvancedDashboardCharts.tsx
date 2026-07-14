import React, { useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Order, SellerProfile } from '../../types';

export function AdvancedDashboardCharts({ orders, sellers, isSw }: { orders: Order[], sellers: SellerProfile[], isSw: boolean }) {
  // 1. Sales Trends over the last 30 days
  const salesTrends = useMemo(() => {
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return {
        dateStr: d.toISOString().split('T')[0],
        display: `${d.getDate()}/${d.getMonth()+1}`,
        sales: 0
      };
    });
    
    orders.forEach(o => {
      const d = new Date(o.date).toISOString().split('T')[0];
      const dayData = last30Days.find(day => day.dateStr === d);
      if (dayData) {
        dayData.sales += Number(o.total) || 0;
      }
    });
    return last30Days;
  }, [orders]);

  // 2. Top 5 Performing Wakalas/Sellers
  const topSellers = useMemo(() => {
    const stats: Record<string, number> = {};
    orders.forEach(o => {
      const id = o.brokerId || 'unknown';
      if (id) {
        stats[id] = (stats[id] || 0) + (Number(o.total) || 0);
      }
    });
    return Object.entries(stats)
      .map(([id, total]) => ({ id, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(stat => {
        const seller = sellers.find(s => s.id === stat.id);
        return {
          name: seller?.storeName || seller?.name || stat.id.substring(0, 8),
          sales: stat.total
        };
      });
  }, [orders, sellers]);

  // 3. Order Fulfillment Status Distribution
  const fulfillmentStats = useMemo(() => {
    const stats = {
      Pending: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0
    };
    orders.forEach(o => {
      if (o.status === 'pending') stats.Pending++;
      else if (o.status === 'processing' || o.status === 'accepted') stats.Processing++;
      else if (o.status === 'shipped') stats.Shipped++;
      else if (o.status === 'delivered') stats.Delivered++;
      else if (o.status === 'cancelled') stats.Cancelled++;
      else stats.Pending++; // default
    });
    return [
      { name: isSw ? 'Inasubiri' : 'Pending', value: stats.Pending, color: '#f59e0b' },
      { name: isSw ? 'Inaandaliwa' : 'Processing', value: stats.Processing, color: '#3b82f6' },
      { name: isSw ? 'Imesafirishwa' : 'Shipped', value: stats.Shipped, color: '#8b5cf6' },
      { name: isSw ? 'Imefika' : 'Delivered', value: stats.Delivered, color: '#10b981' },
      { name: isSw ? 'Imeghairiwa' : 'Cancelled', value: stats.Cancelled, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [orders, isSw]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* Sales Trends Chart */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">{isSw ? "Mwenendo wa Mauzo (Siku 30 Zilizopita)" : "Sales Trends (Last 30 Days)"}</h3>
        <div className="h-[250px] w-full" style={{ minHeight: 250, minWidth: 50 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={50}>
            <LineChart data={salesTrends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="display" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
              <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS' }).format(value)} />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fulfillment Status Chart */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">{isSw ? "Mgawanyo wa Hali ya Oda" : "Order Fulfillment Status"}</h3>
        <div className="h-[250px] w-full flex items-center justify-center" style={{ minHeight: 250, minWidth: 50 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={50}>
            <PieChart>
              <Pie
                data={fulfillmentStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {fulfillmentStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Sellers Chart */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
        <h3 className="text-sm font-bold text-slate-800 mb-4">{isSw ? "Wauzaji/Mawakala Wanaoongoza" : "Top Performing Sellers/Wakalas"}</h3>
        <div className="h-[250px] w-full" style={{ minHeight: 250, minWidth: 50 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={50}>
            <BarChart data={topSellers} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
              <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS' }).format(value)} />
              <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
