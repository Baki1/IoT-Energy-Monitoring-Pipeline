from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, database
import random
from datetime import datetime, timedelta

# 1. Tabloları Oluştur (Yoksa)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# CORS Ayarları (React için)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Veritabanı Oturumu Al
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def ana_sayfa():
    return {"mesaj": "TÜBİTAK Veritabanı Sistemi Aktif!"}

# --- React'in Kullandığı Veri Çekme Fonksiyonu (GÜNCELLENDİ) ---
@app.get("/api/veri")
def veri_getir(db: Session = Depends(get_db)):
    # .order_by(models.EnergyLog.timestamp) EKLEDİK: Grafiğin çizgileri düzgün çıksın
    kayitlar = db.query(models.EnergyLog).order_by(models.EnergyLog.timestamp).all()
    
    formatted_data = []
    for k in kayitlar:
        formatted_data.append({
            "time": k.timestamp.strftime("%H:00"),
            # Grafik için Power (Watt) kullanıyoruz (Gerçek zamanlı izleme hissi verir)
            "tuketim": round(k.power, 1), 
            "maliyet": round(k.energy_kwh * 2.15, 2), # Türkiye elektrik birim fiyatı tahmini
            "voltaj": round(k.voltage, 1)
        })
    return formatted_data

# --- Simülasyon Verisini Daha Gerçekçi Yapalım ---
@app.post("/api/simulasyon-baslat")
def simulasyon_verisi_ekle(db: Session = Depends(get_db)):
    db.query(models.EnergyLog).delete() # Eskileri temizle
    
    simdi = datetime.now()
    for i in range(24):
        # Zamanı geçmişten günümüze doğru oluşturuyoruz
        zaman = simdi - timedelta(hours=23-i)
        
        # Gece saatlerinde tüketim düşük, gündüz yüksek olsun (Gerçekçi veri)
        saat = zaman.hour
        base_power = 150 if (saat < 7 or saat > 23) else 450
        
        yeni_kayit = models.EnergyLog(
            timestamp=zaman,
            voltage=random.uniform(225, 235), # Voltaj dalgalanması az olur
            current=random.uniform(0.5, 4.0),
            power=base_power + random.uniform(0, 300), # Saatlik değişim
            energy_kwh=random.uniform(0.2, 0.6),
            device_id="ESP32_Demo"
        )
        db.add(yeni_kayit)
    
    db.commit()
    return {"mesaj": "Gerçekçi 24 saatlik veri hazır!"}