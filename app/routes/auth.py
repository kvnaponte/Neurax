"""
Endpoints de autenticación (login y registro)
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models.user import Usuario
from app.schemas.user import LoginRequest, TokenResponse, UsuarioCreate, UsuarioResponse
from app.auth import hash_password, verify_password, create_access_token
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, Nivel, obtener_nivel_desde_xp
from app.services.streak_manager import calcular_racha
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Login con email y contraseña. Retorna un JWT.
    """
    usuario = db.query(Usuario).filter(Usuario.email == credentials.email).first()

    if not usuario or not verify_password(credentials.password, usuario.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos"
        )

    if not usuario.active:
        raise HTTPException(
            status_code=403,
            detail="Usuario desactivado"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(usuario.id)},
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        usuario_id=usuario.id
    )


@router.post("/register", response_model=TokenResponse)
def register(usuario_data: UsuarioCreate, db: Session = Depends(get_db)):
    """
    Registro de nuevo usuario. Crea el usuario y retorna un JWT.
    """
    existente = db.query(Usuario).filter(Usuario.email == usuario_data.email).first()
    if existente:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    nuevo_usuario = Usuario(
        nombre=usuario_data.nombre,
        email=usuario_data.email,
        hashed_password=hash_password(usuario_data.password),
        xp_total=0,
        nivel=1,
        creado_en=datetime.now(),
        active=True
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(nuevo_usuario.id)},
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        usuario_id=nuevo_usuario.id
    )
