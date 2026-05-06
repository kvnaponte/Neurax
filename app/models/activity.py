"""
Modelos de Actividad y Hito para SQLAlchemy
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.config import TipoActividad, HitoTipo


class Actividad(Base):
    """Modelo de actividad realizada por el usuario"""
    __tablename__ = "actividades"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(SQLEnum(TipoActividad), nullable=False)
    duracion_minutos = Column(Integer, nullable=False)
    xp_generado = Column(Integer, default=0)
    descripcion = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.now)
    
    # Campos específicos para áreas
    area = Column(String, nullable=True)  # economica, fisico, rutinarias
    cuerpo_trabajado = Column(String, nullable=True)  # Para área físico: tricep, espalda, etc.
    repeticiones = Column(Integer, nullable=True)  # Para ejercicios
    monto = Column(Integer, nullable=True)  # Para ingresos/egresos
    destino = Column(String, nullable=True)  # Para planificación financiera
    
    usuario = relationship("Usuario", back_populates="actividades")

    def __repr__(self):
        return f"<Actividad(id={self.id}, tipo={self.tipo}, xp={self.xp_generado})>"


class Hito(Base):
    """Modelo de hito especial alcanzado por el usuario"""
    __tablename__ = "hitos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(SQLEnum(HitoTipo), nullable=False)
    valor_xp = Column(Integer, nullable=False)
    descripcion = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.now)

    usuario = relationship("Usuario", back_populates="hitos")

    def __repr__(self):
        return f"<Hito(id={self.id}, tipo={self.tipo}, xp={self.valor_xp})>"