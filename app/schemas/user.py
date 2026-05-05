"""
Esquemas Pydantic para Usuario
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.config import Nivel


class UsuarioBase(BaseModel):
    """Esquema base para usuario"""
    nombre: str
    email: str


class UsuarioCreate(UsuarioBase):
    """Esquema para crear un usuario"""
    password: str


class LoginRequest(BaseModel):
    """Esquema para solicitud de login"""
    email: str
    password: str


class UsuarioUpdate(BaseModel):
    """Esquema para actualizar un usuario"""
    nombre: Optional[str] = None
    email: Optional[str] = None


class UsuarioResponse(UsuarioBase):
    """Esquema de respuesta para usuario"""
    id: int
    xp_total: int
    nivel: Nivel
    racha_dias: int
    última_actividad: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Esquema para respuesta de login con token"""
    access_token: str
    token_type: str
    usuario_id: int