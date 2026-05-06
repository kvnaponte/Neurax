"""
Esquemas Pydantic para Actividad y Hito
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.config import TipoActividad, HitoTipo


# ============================================================================
# ACTIVIDADES
# ============================================================================

class ActividadBase(BaseModel):
    """Esquema base para actividad"""
    tipo: TipoActividad
    duracion_minutos: int


class ActividadRequest(ActividadBase):
    """Esquema para registrar una actividad"""
    timestamp: Optional[datetime] = None
    descripcion: Optional[str] = None
    # Campos específicos por área
    area: Optional[str] = None  # economica, fisico, rutinarias
    cuerpo_trabajado: Optional[str] = None  # Para área físico
    repeticiones: Optional[int] = None  # Para ejercicios
    monto: Optional[int] = None  # Para ingresos/egresos
    destino: Optional[str] = None  # Para planificación financiera


class ActividadResponse(ActividadBase):
    """Esquema de respuesta para actividad"""
    id: int
    usuario_id: int
    timestamp: datetime
    xp_generado: int
    descripcion: Optional[str] = None
    area: Optional[str] = None
    cuerpo_trabajado: Optional[str] = None
    repeticiones: Optional[int] = None
    monto: Optional[int] = None
    destino: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# HITOS
# ============================================================================

class HitoBase(BaseModel):
    """Esquema base para hito"""
    tipo: HitoTipo
    valor_xp: int


class HitoRequest(HitoBase):
    """Esquema para registrar un hito"""
    descripcion: Optional[str] = None
    timestamp: Optional[datetime] = None


class HitoResponse(HitoBase):
    """Esquema de respuesta para hito"""
    id: int
    usuario_id: int
    descripcion: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True