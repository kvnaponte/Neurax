"""
Endpoints para gestión de usuarios
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.models.user import Usuario
from app.schemas.user import UsuarioCreate, UsuarioResponse
from app.config import Nivel, obtener_nivel_desde_xp
from app.services.streak_manager import calcular_racha
from app.auth import hash_password

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])


def obtener_usuario_activo(usuario_id: int, db: Session) -> Usuario:
    """Obtiene un usuario activo o lanza excepción"""
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.active == True
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return usuario


@router.post("", response_model=UsuarioResponse)
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """Crea un nuevo usuario en el sistema"""
    # Verificar si el email ya existe
    existente = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if existente:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    nuevo = Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        hashed_password=hash_password(usuario.password),
        xp_total=0,
        nivel=1,
        creado_en=datetime.now(),
        active=True
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return UsuarioResponse(
        id=nuevo.id,
        nombre=nuevo.nombre,
        email=nuevo.email,
        xp_total=nuevo.xp_total,
        nivel=Nivel(nuevo.nivel),
        racha_dias=0,
        última_actividad=nuevo.última_actividad
    )


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """Obtiene la información de un usuario"""
    usuario = obtener_usuario_activo(usuario_id, db)

    return UsuarioResponse(
        id=usuario.id,
        nombre=usuario.nombre,
        email=usuario.email,
        xp_total=usuario.xp_total,
        nivel=Nivel(usuario.nivel),
        racha_dias=calcular_racha(usuario_id, db),
        última_actividad=usuario.última_actividad
    )


@router.patch("/{usuario_id}/desactivar")
def desactivar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """Desactiva un usuario (soft delete)"""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not usuario.active:
        raise HTTPException(status_code=400, detail="Usuario ya está inactivo")

    usuario.active = False
    usuario.fecha_eliminacion = datetime.now()

    db.commit()
    db.refresh(usuario)

    return {"mensaje": "Usuario desactivado"}