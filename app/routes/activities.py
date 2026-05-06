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
from app.services.activity_validator import (
    obtener_area_actividad,
    validar_secuencia_ejercicios,
    validar_actividad_sabado,
    calcular_xp_con_bonus,
    validar_limite_xp_diario
)
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
    """Registra una nueva actividad para el usuario con validaciones por área"""
    usuario = obtener_usuario_activo(usuario_id, db)

    # Determinar área de la actividad
    area = actividad.area or obtener_area_actividad(actividad.tipo)
    
    # Validaciones específicas para área físico
    if area == "fisico":
        # Validar secuencia de ejercicios si se especifica cuerpo trabajado
        if actividad.cuerpo_trabajado:
            valido, mensaje = validar_secuencia_ejercicios(
                usuario_id, 
                actividad.cuerpo_trabajado, 
                db
            )
            if not valido:
                raise HTTPException(status_code=400, detail=mensaje)
        
        # Validar regla del sábado
        timestamp = actividad.timestamp or datetime.now()
        valido, mensaje = validar_actividad_sabado(actividad.tipo, timestamp)
        if not valido:
            raise HTTPException(status_code=400, detail=mensaje)
    
    # Calcular XP base
    xp_base = calcular_xp_actividad(actividad.tipo, actividad.duracion_minutos)
    
    # Calcular racha actual
    racha_dias = calcular_racha(usuario_id, db)
    
    # Calcular XP con bonus (racha y horario óptimo)
    timestamp = actividad.timestamp or datetime.now()
    xp_final = calcular_xp_con_bonus(
        xp_base, 
        actividad.tipo, 
        timestamp, 
        racha_dias, 
        area
    )
    
    # Validar límite diario de XP por área
    valido, mensaje = validar_limite_xp_diario(usuario_id, xp_final, area, db)
    if not valido:
        # Permitir registro pero sin XP si excede límite
        xp_final = 0
    
    # Crear actividad
    nueva = Actividad(
        usuario_id=usuario_id,
        tipo=actividad.tipo,
        duracion_minutos=actividad.duracion_minutos,
        timestamp=timestamp,
        xp_generado=xp_final,
        descripcion=actividad.descripcion,
        area=area,
        cuerpo_trabajado=actividad.cuerpo_trabajado,
        repeticiones=actividad.repeticiones,
        monto=actividad.monto,
        destino=actividad.destino
    )
    
    db.add(nueva)
    
    # Actualizar usuario solo si hay XP
    if xp_final > 0:
        usuario.xp_total += xp_final
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
        xp_generado=nueva.xp_generado,
        descripcion=nueva.descripcion,
        area=nueva.area,
        cuerpo_trabajado=nueva.cuerpo_trabajado,
        repeticiones=nueva.repeticiones,
        monto=nueva.monto,
        destino=nueva.destino
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