"""
Endpoints para estadísticas del usuario
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Usuario
from app.config import obtener_nivel_desde_xp
from app.services.streak_manager import calcular_racha
from app.auth import get_current_user

router = APIRouter(prefix="/api/usuarios/{usuario_id}", tags=["Estadísticas"])


def obtener_usuario_activo(usuario_id: int, db: Session) -> Usuario:
    """Obtiene un usuario activo o lanza excepción"""
    from fastapi import HTTPException

    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.active == True
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return usuario


@router.get("/estadisticas")
def estadisticas(
    usuario_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene las estadísticas consolidadas del usuario"""
    usuario = obtener_usuario_activo(usuario_id, db)

    nivel = obtener_nivel_desde_xp(usuario.xp_total)

    return {
        "xp_total": usuario.xp_total,
        "nivel": nivel.name,
        "nivel_numero": nivel.value,
        "racha": calcular_racha(usuario_id, db),
        "ultima_actividad": usuario.última_actividad
    }