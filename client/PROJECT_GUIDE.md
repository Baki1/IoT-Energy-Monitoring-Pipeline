TÜBİTAK Enerji Yönetim Sistemi - Teknik Şartname
Hedef: IoT cihazlarından gelen verileri analiz eden, anomali tespiti yapan ve karbon ayak izi hesaplayan bir dashboard.
Teknik Kurallar:
Framework: React.js + Tailwind CSS.
Grafikler: Recharts kütüphanesi kullanılacak.
Güvenlik: API anahtarları asla koda direkt yazılmayacak, .env dosyasından okunacak.
- .env dosyası proje kökünde olmalı; .gitignore ile commit edilmemeli.
- Örnek yapı için .env.example kullanılır; gerçek değerler .env içine yazılır.
- Kodda sadece src/config/env.js üzerinden (import.meta.env.VITE_*) okunur.
Veri Yapısı: Enerji verileri şu formatta simüle edilecek: { timestamp, tüketim_kwh, maliyet, cihaz_id, karbon_salınımı }.
Öncelikli Özellikler:
 Anomali Tespiti: Tüketim ortalamanın %30 üzerine çıkarsa grafik üzerinde kırmızı işaretle.
 Karbon Ayak İzi: Her 1 kWh için 0.45 kg $CO_2$ salınımı baz alınarak hesaplama yap.npm run dev