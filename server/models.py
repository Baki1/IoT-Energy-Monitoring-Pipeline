from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class EnergyLog(Base):
    __tablename__ = "energy_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.now)  # Kayıt zamanı
    voltage = Column(Float)       # Voltaj (V)
    current = Column(Float)       # Akım (A)
    power = Column(Float)         # Güç (W)
    energy_kwh = Column(Float)    # Tüketim (kWh)
    device_id = Column(String)    # Hangi cihaz? (örn: "ESP32_01")