import DigitalTwin from './DigitalTwin';
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Telsizimizi ekledik
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { Activity, AlertTriangle, Leaf, DollarSign } from 'lucide-react';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verileri Çekme Fonksiyonu
    const veriCek = async () => {
      try {
        console.log("Veri isteği gönderiliyor...");
        // Python sunucuna istek atıyoruz
        const response = await axios.get('http://127.0.0.1:8000/api/veri');
        
        console.log("Veri geldi:", response.data);
        setData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Hata oluştu:", err);
        setError("Sunucuya bağlanılamadı! Lütfen Python terminalini kontrol et.");
        setLoading(false);
      }
    };

    veriCek();
  }, []);

  // 1. Durum: Yükleniyor
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <h1 className="text-2xl animate-pulse">Veriler Mutfaktan Geliyor...</h1>
    </div>
  );

  // 2. Durum: Hata Var
  if (error) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-500">
      <div className="text-center">
        <AlertTriangle size={48} className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold">{error}</h1>
        <p className="text-slate-400 mt-2">Python sunucusu (uvicorn) çalışıyor mu?</p>
      </div>
    </div>
  );

  // 3. Durum: Başarılı (Dashboard)
  // Hesaplamalar
  const totalKwh = data.reduce((acc, curr) => acc + (curr.tuketim || 0), 0);
  const carbonFootprint = (totalKwh * 0.45).toFixed(1);
  const avgConsumption = (totalKwh / data.length).toFixed(1);
  const anomalyCount = data.filter(d => d.tuketim > 500).length;

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white font-sans">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">TÜBİTAK Enerji Yönetim Sistemi</h1>
          <p className="text-slate-400">Canlı Veri Akışı ve Anomali Takibi</p>
        </div>
        <div className="bg-green-900 text-green-300 px-4 py-2 rounded-full text-sm font-bold border border-green-700">
          Sistem Online
        </div>
      </header>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Toplam Tüketim" value={`${totalKwh} kWh`} icon={<Activity />} color="text-blue-400" />
        <StatCard title="Karbon Salınımı" value={`${carbonFootprint} kg CO₂`} icon={<Leaf />} color="text-yellow-400" />
        <StatCard title="Ortalama (saat)" value={`${avgConsumption} kWh`} icon={<DollarSign />} color="text-slate-200" />
        <StatCard title="Anomali Sayısı" value={anomalyCount} icon={<AlertTriangle />} color="text-red-500" highlight={anomalyCount > 0} />
      </div>
      {/* Dijital İkiz Bölümü */}
        <div className="mb-8">
          <DigitalTwin />
         </div>
      {/* Ana Grafik */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl relative overflow-hidden">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
           Enerji Tüketimi (kWh)
        </h2>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTuketim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 12}} />
              <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="tuketim" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTuketim)" 
                animationDuration={2000}
              />
              {/* Anomali Eşik Çizgisi */}
              <Line type="monotone" dataKey={() => 500} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Kart Bileşeni
const StatCard = ({ title, value, icon, color, highlight }) => (
  <div className={`bg-slate-800 p-6 rounded-xl border ${highlight ? 'border-red-500 bg-red-900/10' : 'border-slate-700'} hover:border-blue-500 transition-all shadow-lg group`}>
    <div className="flex items-center justify-between mb-4">
      <span className="text-slate-400 text-sm font-medium group-hover:text-white transition-colors">{title}</span>
      <span className={`${color} bg-slate-700/50 p-2 rounded-lg`}>{icon}</span>
    </div>
    <div className={`text-3xl font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</div>
  </div>
);

export default App;
