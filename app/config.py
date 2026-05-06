"""
Centralized configuration for Sistema Imbatible
"""
import os
from datetime import timedelta
from enum import Enum
from typing import Callable, Dict


# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

DATABASE_URL = "postgresql://kevin_admin:admin12345@localhost:5432/sistema_imbatible_db"
SESSION_EXPIRE_MINUTES = 30


# ============================================================================
# JWT AUTHENTICATION
# ============================================================================

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


# ============================================================================
# LEVEL SYSTEM
# ============================================================================

class Nivel(int, Enum):
    """Available levels in the RPG system"""
    SUPERVIVIENTE_1 = 1
    SUPERVIVIENTE_2 = 2
    EJECUTOR_3 = 3
    EJECUTOR_4 = 4
    IMBATIBLE_5 = 5
    IMBATIBLE_6 = 6


# XP required to reach each level
NIVELES_XP: Dict[int, int] = {
    1: 0,      # Superviviente 1: Start
    2: 100,    # Superviviente 2: 100 XP
    3: 250,    # Ejecutor 3: 250 XP
    4: 450,    # Ejecutor 4: 450 XP
    5: 700,    # Imbatible 5: 700 XP
    6: 1000,   # Imbatible 6: 1000 XP (max)
}

# Descriptive names for each level
DESCRIPCIONES_NIVEL: Dict[int, str] = {
    1: "Superviviente",
    2: "Superviviente",
    3: "Ejecutor",
    4: "Ejecutor",
    5: "Imbatible",
    6: "Imbatible",
}


# ============================================================================
# ACTIVITY AND XP SYSTEM
# ============================================================================

class TipoActividad(str, Enum):
    """Types of trackable activities"""
    # Área Económica
    INGRESO = "ingreso"
    EGRESO = "egreso"
    PLANIFICACION_FINANCIERA = "planificacion_financiera"
    
    # Área Físico
    EJERCICIO_FUERZA = "ejercicio_fuerza"
    EJERCICIO_CARDIO = "ejercicio_cardio"
    BARRAS = "barras"
    TROTE = "trote"
    
    # Área Rutinarias
    SUEÑO = "sueño"
    ESTUDIO = "estudio"
    TRABAJO = "trabajo"
    TRANSPORTE = "transporte"
    MUSICA = "musica"


class HitoTipo(str, Enum):
    """Types of special milestones"""
    ENERGIA = "energia"
    DISCIPLINA = "disciplina"
    ENFOQUE = "enfoque"
    PENALIZACION = "penalizacion"


# XP generation rules per activity
# Área Económica: XP por gestión financiera
# Área Físico: XP por ejercicios específicos con reglas especiales
# Área Rutinarias: XP por hábitos diarios

ACTIVIDAD_XP: Dict[TipoActividad, Callable[[int], int]] = {
    # Área Económica - XP basado en registro y planificación
    TipoActividad.INGRESO: lambda mins: 15,  # Registrar ingreso genera XP fijo
    TipoActividad.EGRESO: lambda mins: 10,  # Registrar egreso genera XP fijo
    TipoActividad.PLANIFICACION_FINANCIERA: lambda mins: 25 if mins >= 30 else 15,
    
    # Área Físico - XP diferenciado por tipo de ejercicio
    TipoActividad.EJERCICIO_FUERZA: lambda mins: 20 if mins >= 45 else 12,
    TipoActividad.EJERCICIO_CARDIO: lambda mins: 18 if mins >= 30 else 10,
    TipoActividad.BARRAS: lambda mins: 25 if mins >= 20 else 15,  # Sábado especial
    TipoActividad.TROTE: lambda mins: 20 if mins >= 30 else 12,  # Sábado especial
    
    # Área Rutinarias - XP por hábitos diarios
    TipoActividad.SUEÑO: lambda mins: 20 if mins >= 345 else 10,  # 5.75h mínimo
    TipoActividad.ESTUDIO: lambda mins: 25 if mins >= 50 else 10,
    TipoActividad.TRABAJO: lambda mins: 10,
    TipoActividad.TRANSPORTE: lambda mins: 5,
    TipoActividad.MUSICA: lambda mins: 20,
}

# Reglas específicas para actividades físicas
REGLAS_EJERCICIO = {
    # Después de tríceps no puede haber espalda
    "secuencias_prohibidas": [
        ("tricep", "espalda"),
    ],
    # Actividades del sábado
    "sabado": [TipoActividad.TROTE, TipoActividad.BARRAS],
    # Descanso requerido entre grupos musculares (en horas)
    "descanso_muscular": {
        "pecho": 48,
        "espalda": 48,
        "piernas": 72,
        "hombros": 48,
        "brazos": 36,
    }
}


# ============================================================================
# STREAK CONFIGURATION
# ============================================================================

RACHA_WINDOW_HOURS = 24
RACHA_BONUS_THRESHOLD = 7


# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================

APP_TITLE = "Sistema Imbatible"
APP_DESCRIPTION = "RPG de la vida real para optimizar comportamiento y productividad"
APP_VERSION = "1.0.0"

CORS_ORIGINS = ["*"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["*"]
CORS_ALLOW_HEADERS = ["*"]


# ============================================================================
# LIMITS AND VALIDATIONS
# ============================================================================

MAX_DURACION_ACTIVIDAD_MINUTES = 1440
MIN_DURACION_ACTIVIDAD_MINUTES = 1
MAX_XP_HITO = 100
MAX_DIAS_HISTORIAL = 365

# Límites de XP por área (diario)
LIMITE_XP_DIARIO = {
    "economica": 50,      # Máximo XP diario por actividades económicas
    "fisico": 80,         # Máximo XP diario por actividades físicas
    "rutinarias": 100,    # Máximo XP diario por rutinas
}

# Bonus especiales
BONUS_RACHA = {
    3: 1.1,   # 3 días: 10% bonus
    7: 1.25,  # 7 días: 25% bonus
    14: 1.5,  # 14 días: 50% bonus
    30: 2.0,  # 30 días: 100% bonus
}

# Bonus por horario óptimo (ejercicio mañana temprano)
HORARIO_OPTIMO = {
    "ejercicio": {"hora_inicio": 6, "hora_fin": 9, "bonus": 1.15},
    "estudio": {"hora_inicio": 5, "hora_fin": 8, "bonus": 1.1},
}


# ============================================================================
# SYSTEM MESSAGES
# ============================================================================

MENSAJE_USUARIO_NO_ENCONTRADO = "Usuario no disponible"
MENSAJE_USUARIO_NO_ACTIVO = "Usuario no está activo"


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def obtener_nivel_desde_xp(xp_total: int) -> Nivel:
    """
    Calculate current level based on total accumulated XP.

    Args:
        xp_total: Total accumulated XP

    Returns:
        Corresponding level from NIVELES_XP table
    """
    for nivel in range(6, 0, -1):
        if xp_total >= NIVELES_XP[nivel]:
            return Nivel(nivel)
    return Nivel.SUPERVIVIENTE_1


def calcular_xp_actividad(tipo: TipoActividad, duracion_minutos: int) -> int:
    """
    Calculate XP generated by a specific activity.

    Args:
        tipo: Type of activity performed
        duracion_minutos: Duration in minutes

    Returns:
        Amount of XP generated
    """
    funcion_xp = ACTIVIDAD_XP.get(tipo, lambda x: 0)
    return funcion_xp(duracion_minutos)


def validar_duracion_actividad(duracion_minutos: int) -> bool:
    """
    Validate that activity duration is within allowed limits.

    Args:
        duracion_minutos: Duration to validate

    Returns:
        True if valid, False otherwise
    """
    return MIN_DURACION_ACTIVIDAD_MINUTES <= duracion_minutos <= MAX_DURACION_ACTIVIDAD_MINUTES