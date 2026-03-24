import { useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';

// Simüle edilmiş enerji verisi - PROJECT_GUIDE.md formatı: { timestamp, tüketim_kwh, maliyet, cihaz_id, karbon_salınımı }
const CO2_KG_PER_KWH = 0.45;

function generateSimulatedData() {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const date = new Date(now);
    date.setHours(date.getHours() - (23 - i), 0, 0, 0);
    const base = 200 + Math.sin(i / 3) * 150;
    const spike = i === 14 ? 380 : i === 18 ? 520 : 0; // 500+ kWh anomali örneği
    const tüketim_kwh = Math.round(base + spike + (Math.random() - 0.3) * 80);
    const maliyet = (tüketim_kwh * 2.5).toFixed(2);
    const karbon_salınımı = (tüketim_kwh * CO2_KG_PER_KWH).toFixed(2);
    return {
      timestamp: date.toISOString().slice(0, 16).replace('T', ' '),
      tüketim_kwh: Math.max(0, tüketim_kwh),
      maliyet: parseFloat(maliyet),
      cihaz_id: `DEV-${1000 + (i % 5)}`,
      karbon_salınımı: parseFloat(karbon_salınımı),
    };
  });
}

// kWh birim fiyatı (₺) - aylık tasarruf hesabı için
const TL_PER_KWH = 2.5;

// Saat aralığı etiketleri (Türkçe)
function getPeriodLabel(startHour, endHour) {
  if (startHour >= 0 && endHour <= 6) return `Gece ${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;
  if (startHour >= 6 && endHour <= 12) return `Sabah ${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;
  if (startHour >= 12 && endHour <= 18) return `Öğleden sonra ${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;
  if (startHour >= 18 && endHour <= 24) return `Akşam ${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;
  return `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;
}

/** AI tabanlı optimizasyon önerileri: ortalamanın üzerinde tüketen saat dilimlerini bulup tasarruf önerir */
function useOptimizationSuggestions(data, overallAverage) {
  return useMemo(() => {
    if (!data?.length || overallAverage <= 0) return [];

    const WINDOW_HOURS = 2;
    const REDUCTION_PERCENT = 15;
    const suggestions = [];

    for (let startHour = 0; startHour < 24; startHour += WINDOW_HOURS) {
      const endHour = Math.min(startHour + WINDOW_HOURS, 24);
      const windowData = data.filter((d) => {
        const h = parseInt(d.timestamp.slice(11, 13), 10);
        return h >= startHour && h < endHour;
      });
      if (windowData.length === 0) continue;

      const periodKwh = windowData.reduce((s, d) => s + d.tüketim_kwh, 0);
      const periodAvg = periodKwh / windowData.length;

      if (periodAvg <= overallAverage) continue;

      const excessRatio = (periodAvg - overallAverage) / overallAverage;
      const monthlySavingsTL = Math.round(
        periodKwh * (REDUCTION_PERCENT / 100) * TL_PER_KWH * 30
      );
      if (monthlySavingsTL < 10) continue;

      suggestions.push({
        startHour,
        endHour,
        periodLabel: getPeriodLabel(startHour, endHour),
        periodAvg: Math.round(periodAvg * 10) / 10,
        overallAvg: overallAverage,
        reductionPercent: REDUCTION_PERCENT,
        monthlySavingsTL,
        excessPercent: Math.round(excessRatio * 100),
      });
    }

    return suggestions
      .sort((a, b) => b.monthlySavingsTL - a.monthlySavingsTL)
      .slice(0, 3);
  }, [data, overallAverage]);
}

// Anomali tespiti: 500 kWh üzeri + ortalamanın %30 üzeri (PROJECT_GUIDE.md)
function useAnomalyDetection(data) {
  return useMemo(() => {
    if (!data?.length) return { anomalies: [], average: 0, threshold: 0, hasHighConsumption: false };

    const average = data.reduce((sum, d) => sum + d.tüketim_kwh, 0) / data.length;
    const threshold30 = average * 1.3;

    const anomalies = data
      .map((d, index) => ({
        ...d,
        index,
        isOver500: d.tüketim_kwh > 500,
        isOver30Percent: d.tüketim_kwh > threshold30,
      }))
      .filter((d) => d.isOver500 || d.isOver30Percent);

    const hasHighConsumption = data.some((d) => d.tüketim_kwh > 500);

    return {
      anomalies,
      average: Math.round(average * 10) / 10,
      threshold: Math.round(threshold30 * 10) / 10,
      hasHighConsumption,
    };
  }, [data]);
}

function CustomDot(props) {
  const { cx, cy, payload } = props;
  if (!payload?.isAnomaly) return null;
  return (
    <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#fca5a5" strokeWidth={2} />
  );
}

export default function Dashboard({ data: dataProp }) {
  const data = useMemo(() => {
    if (dataProp?.length) return dataProp;
    return generateSimulatedData();
  }, [dataProp]);
  const chartData = useMemo(() => {
    const avg = data.reduce((s, d) => s + d.tüketim_kwh, 0) / data.length;
    const threshold = avg * 1.3;
    return data.map((d) => ({
      ...d,
      name: d.timestamp.slice(11, 16),
      isAnomaly: d.tüketim_kwh > 500 || d.tüketim_kwh > threshold,
    }));
  }, [data]);

  const { anomalies, average, threshold, hasHighConsumption } = useAnomalyDetection(data);
  const optimizationSuggestions = useOptimizationSuggestions(data, average);

  const totalKwh = data.reduce((s, d) => s + d.tüketim_kwh, 0);
  const totalCo2 = (totalKwh * CO2_KG_PER_KWH).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            TÜBİTAK Enerji Yönetim Sistemi
          </h1>
          <p className="mt-1 text-sm text-slate-400">Enerji tüketimi ve karbon ayak izi dashboard</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 500 kWh üzeri anomali uyarısı */}
        {hasHighConsumption && (
          <div
            className="mb-6 rounded-lg border border-red-500/50 bg-red-950/40 px-4 py-3 text-red-200"
            role="alert"
          >
            <p className="font-medium">Anomali uyarısı</p>
            <p className="mt-1 text-sm">
              Tüketim 500 kWh üzerinde olan saatler tespit edildi. Grafikte kırmızı işaretlerle
              gösterilmektedir. Ortalama: {average} kWh — %30 üst sınır: {threshold} kWh.
            </p>
            {anomalies.filter((a) => a.isOver500).length > 0 && (
              <p className="mt-2 text-sm">
                500 kWh üzeri kayıt sayısı: {anomalies.filter((a) => a.isOver500).length}
              </p>
            )}
          </div>
        )}

        {/* Özet kartlar */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-lg">
            <p className="text-sm font-medium text-slate-400">Toplam Tüketim</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{totalKwh} kWh</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-lg">
            <p className="text-sm font-medium text-slate-400">Karbon Salınımı</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{totalCo2} kg CO₂</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-lg">
            <p className="text-sm font-medium text-slate-400">Ortalama (saat)</p>
            <p className="mt-1 text-2xl font-bold text-slate-200">{average} kWh</p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-lg">
            <p className="text-sm font-medium text-slate-400">Anomali sayısı</p>
            <p className="mt-1 text-2xl font-bold text-red-400">{anomalies.length}</p>
          </div>
        </div>

        {/* Enerji tüketimi grafiği - anomali noktaları kırmızı */}
        <section className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-lg sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Enerji Tüketimi (kWh)</h2>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                  label={{
                    value: 'kWh',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value, name) => [
                    `${value} kWh`,
                    name === 'tüketim_kwh' ? 'Tüketim' : name,
                  ]}
                  labelFormatter={(label, payload) => {
                    const p = payload?.[0]?.payload;
                    if (!p) return label;
                    const anomaly = p.isAnomaly ? ' (Anomali)' : '';
                    return `${p.timestamp}${anomaly}`;
                  }}
                />
                <ReferenceLine
                  y={500}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: '500 kWh', fill: '#f87171', position: 'right' }}
                />
                <ReferenceLine
                  y={threshold}
                  stroke="#f59e0b"
                  strokeDasharray="2 2"
                  label={{ value: '%30 üst', fill: '#fbbf24', position: 'right' }}
                />
                <Legend
                  wrapperStyle={{ color: '#94a3b8' }}
                  formatter={() => 'Tüketim (kWh)'}
                />
                <Area
                  type="monotone"
                  dataKey="tüketim_kwh"
                  fill="url(#lineGrad)"
                  fillOpacity={0.2}
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="tüketim_kwh"
                  stroke="url(#lineGrad)"
                  strokeWidth={2}
                  dot={(props) => <CustomDot {...props} payload={props.payload} />}
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#059669' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Kırmızı kesikli çizgi: 500 kWh. Sarı kesikli: Ortalamanın %30 üstü. Kırmızı noktalar:
            anomali.
          </p>
        </section>

        {/* Enerji Optimizasyon Önerisi - AI tabanlı panel */}
        <section className="mt-8 rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-lg sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Enerji Optimizasyon Önerisi</h2>
              <p className="text-xs text-slate-400">Tüketim verilerinize göre akıllı tasarruf önerileri</p>
            </div>
          </div>

          {optimizationSuggestions.length === 0 ? (
            <div className="rounded-lg border border-slate-600/50 bg-slate-800/40 px-4 py-3 text-slate-400">
              Tüketim verileriniz genel ortalamaya yakın. Belirgin bir optimizasyon aralığı tespit edilmedi.
            </div>
          ) : (
            <ul className="space-y-4">
              {optimizationSuggestions.map((s, i) => (
                <li
                  key={`${s.startHour}-${s.endHour}`}
                  className="flex gap-4 rounded-lg border border-slate-600/50 bg-slate-800/40 p-4 text-left transition hover:border-emerald-500/30"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-200">
                      {s.periodLabel} saatleri arasındaki tüketiminiz ortalamanın üzerinde
                      {s.excessPercent > 0 && ` (%${s.excessPercent} daha yüksek).`}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Bu saatlerdeki cihaz kullanımını %{s.reductionPercent} azaltarak aylık{' '}
                      <span className="font-semibold text-emerald-400">{s.monthlySavingsTL} ₺</span>{' '}
                      tasarruf edebilirsiniz.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Dilim ortalaması: {s.periodAvg} kWh — Genel ortalama: {s.overallAvg} kWh
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
