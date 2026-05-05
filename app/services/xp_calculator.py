"""
Calculadora de XP y niveles del sistema
"""
from app.config import Nivel, NIVELES_XP, TipoActividad, ACTIVIDAD_XP


def obtener_nivel(xp_total: int) -> Nivel:
    """
    Calcula el nivel actual basado en la XP total acumulada.

    Args:
        xp_total: Cantidad total de XP acumulada

    Returns:
        El nivel correspondiente según la tabla NIVELES_XP
    """
    for nivel in range(6, 0, -1):
        if xp_total >= NIVELES_XP[nivel]:
            return Nivel(nivel)
    return Nivel.SUPERVIVIENTE_1


def calcular_xp(tipo: TipoActividad, duracion_minutos: int) -> int:
    """
    Calcula la XP generada por una actividad específica.

    Args:
        tipo: Tipo de actividad realizada
        duracion_minutos: Duración de la actividad en minutos

    Returns:
        Cantidad de XP generada
    """
    funcion_xp = ACTIVIDAD_XP.get(tipo, lambda x: 0)
    return funcion_xp(duracion_minutos)


def validar_duracion_actividad(duracion_minutos: int,
                                min_duracion: int = 1,
                                max_duracion: int = 1440) -> bool:
    """
    Valida que la duración de una actividad esté dentro de los límites permitidos.

    Args:
        duracion_minutos: Duración a validar
        min_duracion: Duración mínima permitida (default: 1 minuto)
        max_duracion: Duración máxima permitida (default: 1440 minutos = 24 horas)

    Returns:
        True si es válida, False en caso contrario
    """
    return min_duracion <= duracion_minutos <= max_duracion