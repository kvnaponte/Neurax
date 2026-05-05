"""
Modelo de Usuario para SQLAlchemy
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Usuario(Base):
    """Modelo de usuario del sistema"""
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    active = Column(Boolean, default=True)
    xp_total = Column(Integer, default=0)
    nivel = Column(Integer, default=1)
    creado_en = Column(DateTime, default=datetime.now)
    última_actividad = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    actividades = relationship(
        "Actividad",
        back_populates="usuario",
        cascade="all, delete-orphan"
    )
    hitos = relationship(
        "Hito",
        back_populates="usuario",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Usuario(id={self.id}, nombre={self.nombre}, email={self.email})>"