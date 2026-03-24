from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Veritabanı Bağlantı Adresi
# Şablon: postgresql://KULLANICI:ŞİFRE@ADRES/VERİTABANI_ADI
URL_DATABASE = "postgresql+psycopg2://postgres:1234@localhost/tubitak_enerji_db"

engine = create_engine(URL_DATABASE)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()