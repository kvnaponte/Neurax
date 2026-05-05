"""
Endpoints para gestión de actividades y hitos
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from app.database import get_db
from app.models.user import Usuario
from app.models.activity import Actividad, Hito, TipoActividad, HitoTipo
from app.schemas.activity import (
    ActividadRequest,
    ActividadResponse,
    HitoRequest,
    HitoResponse
)
from app.config import calcular_xp_actividad, obtener_nivel_desde_xp
from app.services.streak_manager import calcular_racha
from app.auth import get_current_user

router = APIRouter(prefix="/api/usuarios/{usuario_id}", tags=["Actividades"])


def obtener_usuario_activo(usuario_id: int, db: Session) -> Usuario:
    """Obtiene un usuario activo o lanza excepción"""
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.active == True
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return usuario


# ============================================================================
# ACTIVIDADES
# ============================================================================

@router.post("/actividades", response_model=ActividadResponse)
def registrar_actividad(
    usuario_id: int,
    actividad: ActividadRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Registra una nueva actividad para el usuario"""
    usuario = obtener_usuario_activo(usuario_id, db)

    # Calcular XP generada
    xp = calcular_xp_actividad(actividad.tipo, actividad.duracion_minutos)
    timestamp = actividad.timestamp or datetime.now()

    nueva = Actividad(
        usuario_id=usuario_id,
        tipo=actividad.tipo,
        duracion_minutos=actividad.duracion_minutos,
        timestamp=timestamp,
        xp_generado=xp,
        descripcion=actividad.descripcion
    )

    db.add(nueva)

    # Actualizar usuario
    usuario.xp_total += xp
    usuario.nivel = obtener_nivel_desde_xp(usuario.xp_total).value
    usuario.última_actividad = timestamp

    db.commit()
    db.refresh(nueva)

    return ActividadResponse(
        id=nueva.id,
        usuario_id=nueva.usuario_id,
        tipo=nueva.tipo,
        duracion_minutos=nueva.duracion_minutos,
        timestamp=nueva.timestamp,
        xp_generado=nueva.xp_generado
    )


@router.get("/actividades", response_model=List[ActividadResponse])
def obtener_actividades(
    usuario_id: int,
    dias: int = Query(default=7, le=365),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene el historial de actividades del usuario"""
    obtener_usuario_activo(usuario_id, db)

    limite = datetime.now() - timedelta(days=dias)

    actividades = db.query(Actividad).filter(
        Actividad.usuario_id == usuario_id,
        Actividad.timestamp >= limite
    ).order_by(Actividad.timestamp.desc()).all()

    return actividades


# ============================================================================
# HITOS
# ============================================================================

@router.post("/hitos", response_model=HitoResponse)
def registrar_hito(
    usuario_id: int,
    hito: HitoRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Registra un hito especial para el usuario"""
    usuario = obtener_usuario_activo(usuario_id, db)

    timestamp = hito.timestamp or datetime.now()

    nuevo = Hito(
        usuario_id=usuario_id,
        tipo=hito.tipo,
        valor_xp=hito.valor_xp,
        timestamp=timestamp,
        descripcion=hito.descripcion
    )

    db.add(nuevo)

    # Actualizar usuario
    usuario.xp_total += hito.valor_xp
    usuario.nivel = obtener_nivel_desde_xp(usuario.xp_total).value

    db.commit()
    db.refresh(nuevo)

    return HitoResponse(
        id=nuevo.id,
        usuario_id=nuevo.usuario_id,
        tipo=nuevo.tipo,
        valor_xp=nuevo.valor_xp,
        descripcion=nuevo.descripcion,
        timestamp=nuevo.timestamp
    )


@router.get("/hitos", response_model=List[HitoResponse])
def obtener_hitos(
    usuario_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene todos los hitos del usuario"""
    obtener_usuario_activo(usuario_id, db)

    return db.query(Hito).filter(
        Hito.usuario_id == usuario_id
    ).all()