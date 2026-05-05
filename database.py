from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from enum import Enum

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://kevin_admin:admin12345@localhost:5432/sistema_imbatible_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class HitoTipo(str, Enum):
    ENERGIA = "energia"
    DISCIPLINA = "disciplina"
    ENFOQUE = "enfoque"
    PENALIZACION = "penalizacion"

class TipoActividad(str, Enum):
    SUEÑO = "sueño"
    EJERCICIO = "ejercicio"
    ESTUDIO = "estudio"
    TRABAJO = "trabajo"
    TRANSPORTE = "transporte"
    MUSICA = "musica"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    active = Column(Boolean, default=True)
    xp_total = Column(Integer, default=0)
    nivel = Column(Integer, default=1)
    creado_en = Column(DateTime, default=datetime.now)
    última_actividad = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    actividades = relationship("Actividad", back_populates="usuario", cascade="all, delete-orphan")
    hitos = relationship("Hito", back_populates="usuario", cascade="all, delete-orphan")

class Actividad(Base):
    __tablename__ = "actividades"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(SQLEnum(TipoActividad), nullable=False)
    duracion_minutos = Column(Integer, nullable=False)
    xp_generado = Column(Integer, default=0)
    descripcion = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.now)

    usuario = relationship("Usuario", back_populates="actividades")

class Hito(Base):
    __tablename__ = "hitos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(SQLEnum(HitoTipo), nullable=False)
    valor_xp = Column(Integer, nullable=False)
    descripcion = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.now)

    usuario = relationship("Usuario", back_populates="hitos")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
