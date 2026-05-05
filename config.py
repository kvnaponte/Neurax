--- config.py (原始)


+++ config.py (修改后)
"""
Configuración centralizada del Sistema Imbatible

Este módulo contiene todas las constantes, configuraciones y parámetros
del sistema RPG de productividad.
"""

from datetime import timedelta
from enum import Enum
from typing import Callable, Dict


# ============================================================================
# CONFIGURACIÓN DE BASE DE DATOS
# ============================================================================

DATABASE_URL = "postgresql://kevin_admin:admin12345@localhost:5432/sistema_imbatible_db"

# Tiempo de expiración de sesiones (si se implementa autenticación en el futuro)
SESSION_EXPIRE_MINUTES = 30


# ============================================================================
# SISTEMA DE NIVELES
# ============================================================================

class Nivel(int, Enum):
    """Niveles disponibles en el sistema RPG"""
    SUPERVIVIENTE_1 = 1
    SUPERVIVIENTE_2 = 2
    EJECUTOR_3 = 3
    EJECUTOR_4 = 4
    IMBATIBLE_5 = 5
    IMBATIBLE_6 = 6


# XP requerida para alcanzar cada nivel
NIVELES_XP: Dict[int, int] = {
    1: 0,      # Superviviente 1: Inicio
    2: 100,    # Superviviente 2: 100 XP
    3: 250,    # Ejecutor 3: 250 XP
    4: 450,    # Ejecutor 4: 450 XP
    5: 700,    # Imbatible 5: 700 XP
    6: 1000,   # Imbatible 6: 1000 XP (máximo)
}

# Nombres descriptivos de cada nivel
DESCRIPCIONES_NIVEL: Dict[int, str] = {
    1: "Superviviente",
    2: "Superviviente",
    3: "Ejecutor",
    4: "Ejecutor",
    5: "Imbatible",
    6: "Imbatible",
}


# ============================================================================
# SISTEMA DE ACTIVIDADES Y XP
# ============================================================================

class TipoActividad(str, Enum):
    """Tipos de actividades rastreables"""
    SUEÑO = "sueño"
    EJERCICIO = "ejercicio"
    ESTUDIO = "estudio"
    TRABAJO = "trabajo"
    TRANSPORTE = "transporte"
    MUSICA = "musica"


class HitoTipo(str, Enum):
    """Tipos de hitos especiales"""
    ENERGIA = "energia"
    DISCIPLINA = "disciplina"
    ENFOQUE = "enfoque"
    PENALIZACION = "penalizacion"


# Reglas de generación de XP por actividad
# Cada función recibe la duración en minutos y retorna la XP generada
ACTIVIDAD_XP: Dict[TipoActividad, Callable[[int], int]] = {
    TipoActividad.SUEÑO: lambda mins: 20 if mins >= 345 else 10,      # ≥5h45min = 20 XP, sino 10 XP
    TipoActividad.EJERCICIO: lambda mins: 15 if mins >= 60 else 5,    # ≥60min = 15 XP, sino 5 XP
    TipoActividad.ESTUDIO: lambda mins: 25 if mins >= 50 else 10,     # ≥50min = 25 XP, sino 10 XP
    TipoActividad.TRABAJO: lambda mins: 10,                            # Siempre 10 XP
    TipoActividad.TRANSPORTE: lambda mins: 5,                          # Siempre 5 XP
    TipoActividad.MUSICA: lambda mins: 20,                             # Siempre 20 XP
}


# ============================================================================
# CONFIGURACIÓN DE RACHAS
# ============================================================================

# Ventana de tiempo para considerar una actividad como "del día actual"
RACHA_WINDOW_HOURS = 24

# Número mínimo de días consecutivos para bonificaciones especiales
RACHA_BONUS_THRESHOLD = 7


# ============================================================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ============================================================================

APP_TITLE = "Sistema Imbatible"
APP_DESCRIPTION = "RPG de la vida real para optimizar comportamiento y productividad"
APP_VERSION = "1.0.0"

# CORS - Orígenes permitidos (en producción debe restringirse)
CORS_ORIGINS = ["*"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["*"]
CORS_ALLOW_HEADERS = ["*"]


# ============================================================================
# LÍMITES Y VALIDACIONES
# ============================================================================

# Duración máxima permitida para una actividad (en minutos)
MAX_DURACION_ACTIVIDAD_MINUTES = 1440  # 24 horas

# Duración mínima permitida para una actividad (en minutos)
MIN_DURACION_ACTIVIDAD_MINUTES = 1

# XP máximo que se puede obtener de un solo hito
MAX_XP_HITO = 100

# Número máximo de días que se pueden consultar en el historial
MAX_DIAS_HISTORIAL = 365


# ============================================================================
# MENSAJES DEL SISTEMA
# ============================================================================

MENSAJE_USUARIO_NO_ENCONTRADO = "Usuario no disponible"
MENSAJE_USUARIO_NO_ACTIVO = "Usuario no está activo"
MENSAJE_USUARIO_YA_ACTIVO = "Usuario ya está activo"
MENSAJE_USUARIO_YA_INACTIVO = "Usuario ya está inactivo"
MENSAJE_USUARIO_ACTIVADO = "Usuario activado"
MENSAJE_USUARIO_DESACTIVADO = "Usuario desactivado"


# ============================================================================
# FUNCIONES AUXILIARES DE CONFIGURACIÓN
# ============================================================================

def obtener_nivel_desde_xp(xp_total: int) -> Nivel:
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


def calcular_xp_actividad(tipo: TipoActividad, duracion_minutos: int) -> int:
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


def validar_duracion_actividad(duracion_minutos: int) -> bool:
    """
    Valida que la duración de una actividad esté dentro de los límites permitidos.

    Args:
        duracion_minutos: Duración a validar

    Returns:
        True si es válida, False en caso contrario
    """
    return MIN_DURACION_ACTIVIDAD_MINUTES <= duracion_minutos <= MAX_DURACION_ACTIVIDAD_MINUTES