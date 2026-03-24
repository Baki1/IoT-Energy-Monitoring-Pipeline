# ⚡ IoT Tabanlı Enerji İzleme ve Veri İşleme Sistemi

Bu proje, endüstriyel veya evsel enerji tüketim verilerinin IoT cihazları aracılığıyla toplanması, anlamlı bilgiye (kWh, Karbon Emisyonu) dönüştürülmesi ve ilişkisel bir zaman serisi veritabanında saklanmasını amaçlayan **Full-Stack** bir veri akış (data pipeline) sistemidir. [cite: 400]

Proje, TÜBİTAK kapsamında geliştirilmekte olup şu an **Prototip ve Simülasyon** aşamasındadır. [cite_start]Henüz fiziksel cihazlar (ESP32 vb.) bağlanmamıştır. [cite: 405, 406]

# 🚀 Simülasyon Senaryosu 
Fiziksel donanım entegrasyonu tamamlanana kadar sistemin veri bütünlüğü sanal sensörlerle test edilmektedir: 

Oluşturulan bir Python scripti (data_generator.py), donanımı taklit ederek saniyede bir rastgele voltaj ve akım değerleri üretir. 

FastAPI (server/main.py) bu verileri alır, veri doğrulama (validation) işlemlerinden geçirir, anlık güç ve emisyon hesaplamalarını yapar. 

İşlenen veriler PostgreSQL veritabanına kaydedilir ve React tarafındaki arayüze anlık olarak yansıtılır.

## 🛠️ Kullanılan Teknolojiler

Sistem modern ve yüksek performanslı araçlar kullanılarak modüler (istemci-sunucu) bir yapıda inşa edilmiştir:

* **Frontend (İstemci):** React.js, Vite, Tailwind CSS, Recharts (Görselleştirme) [cite: 432, 433]
* **Backend (Sunucu):** Python, FastAPI, Pydantic, SQLAlchemy [cite: 440, 474]
* **Veritabanı:** PostgreSQL + TimescaleDB (Zaman Serisi Verileri için) [cite: 425]
* **IoT & Haberleşme:** ESP32 / Raspberry Pi, MQTT Protokolü (Mosquitto Broker) [cite: 406, 407, 437]

## 📂 Proje Mimarisi ve Klasör Yapısı

Proje "İzole Bağımlılıklar" (Separation of Concerns) prensibine göre iki ana modüle ayrılmıştır:

```text
IoT-Energy-Monitoring-Pipeline/
├── client/                 # İstemci tarafı (Kullanıcı Arayüzü)
│   ├── src/                # React bileşenleri (Dashboard, DigitalTwin vb.)
│   ├── package.json        # Node.js bağımlılıkları
│   └── tailwind.config.js  # Stil konfigürasyonları
│
└── server/                 # Sunucu tarafı (API ve Veritabanı İşlemleri)
    ├── main.py             # FastAPI ana giriş noktası (Endpoints)
    ├── models.py           # Veritabanı tablo şemaları
    ├── database.py         # PostgreSQL bağlantı ayarları
    └── requirements.txt    # Python kütüphaneleri

