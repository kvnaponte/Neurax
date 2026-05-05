"""
Gestor de rachas y streaks del sistema
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.activity import Actividad


def calcular_racha(usuario_id: int, db: Session) -> int:
    """
    Calcula la racha actual de días consecutivos con actividades.

    Args:
        usuario_id: ID del usuario
        db: Sesión de base de datos

    Returns:
        Número de días consecutivos con actividades
    """
    actividades = db.query(Actividad).filter(
        Actividad.usuario_id == usuario_id
    ).order_by(Actividad.timestamp.desc()).all()

    if not actividades:
        return 0

    racha = 0
    hoy = datetime.now().date()

    for act in actividades:
        dias_transcurridos = (hoy - act.timestamp.date()).days
        if dias_transcurridos == racha:
            racha += 1
        elif dias_transcurridos > racha:
            # Hay un gap, se rompe la racha
            break

    return racha


def verificar_racha_perfecta(usuario_id: int, db: Session, dias: int = 7) -> bool:
    """
    Verifica si el usuario ha mantenido una racha perfecta durante N días.

    Args:
        usuario_id: ID del usuario
        db: Sesión de base de datos
        dias: Número de días a verificar (default: 7)

    Returns:
        True si tiene racha perfecta, False en caso contrario
    """
    racha_actual = calcular_racha(usuario_id, db)
    return racha_actual >= dias


def obtener_dias_sin_actividad(usuario_id: int, db: Session) -> int:
    """
    Obtiene el número de días desde la última actividad del usuario.

    Args:
        usuario_id: ID del usuario
        db: Sesión de base de datos

    Returns:
        Número de días sin actividad, 0 si hay actividad hoy
    """
    ultima = db.query(Actividad).filter(
        Actividad.usuario_id == usuario_id
    ).order_by(Actividad.timestamp.desc()).first()

    if not ultima:
        return -1  # Nunca ha tenido actividad

    hoy = datetime.now().date()
    dias_sin_actividad = (hoy - ultima.timestamp.date()).days

    return max(0, dias_sin_actividad)