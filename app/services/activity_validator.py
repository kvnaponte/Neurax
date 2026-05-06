"""
Validador de reglas para actividades por área
"""
from datetime import datetime, timedelta
from typing import List, Tuple, Optional, Dict
from sqlalchemy.orm import Session

from app.models.activity import Actividad
from app.config import TipoActividad, REGLAS_EJERCICIO


def obtener_area_actividad(tipo: TipoActividad) -> str:
    """Determina el área de una actividad según su tipo"""
    areas_economica = [
        TipoActividad.INGRESO,
        TipoActividad.EGRESO,
        TipoActividad.PLANIFICACION_FINANCIERA
    ]
    
    areas_fisico = [
        TipoActividad.EJERCICIO_FUERZA,
        TipoActividad.EJERCICIO_CARDIO,
        TipoActividad.BARRAS,
        TipoActividad.TROTE
    ]
    
    if tipo in areas_economica:
        return "economica"
    elif tipo in areas_fisico:
        return "fisico"
    else:
        return "rutinarias"


def validar_secuencia_ejercicios(
    usuario_id: int,
    cuerpo_trabajado: str,
    db: Session
) -> Tuple[bool, str]:
    """
    Valida si se puede realizar un ejercicio según las secuencias prohibidas.
    
    Args:
        usuario_id: ID del usuario
        cuerpo_trabajado: Parte del cuerpo a trabajar (ej: tricep, espalda)
        db: Sesión de base de datos
    
    Returns:
        Tuple[bool, str]: (Es válido, Mensaje de error o éxito)
    """
    # Obtener última actividad física del usuario
    ultima_actividad = db.query(Actividad).filter(
        Actividad.usuario_id == usuario_id,
        Actividad.area == "fisico",
        Actividad.cuerpo_trabajado.isnot(None)
    ).order_by(Actividad.timestamp.desc()).first()
    
    if not ultima_actividad:
        return True, "Secuencia válida"
    
    ultimo_cuerpo = ultima_actividad.cuerpo_trabajado.lower()
    nuevo_cuerpo = cuerpo_trabajado.lower()
    
    # Verificar secuencias prohibidas
    for secuencia_prohibida in REGLAS_EJERCICIO["secuencias_prohibidas"]:
        if ultimo_cuerpo == secuencia_prohibida[0] and nuevo_cuerpo == secuencia_prohibida[1]:
            return False, f"No se puede trabajar {nuevo_cuerpo} después de {ultimo_cuerpo}"
    
    # Verificar tiempo de descanso muscular
    if ultimo_cuerpo in REGLAS_EJERCICIO["descanso_muscular"]:
        horas_requeridas = REGLAS_EJERCICIO["descanso_muscular"][ultimo_cuerpo]
        tiempo_transcurrido = datetime.now() - ultima_actividad.timestamp
        
        if tiempo_transcurrido < timedelta(hours=horas_requeridas):
            return False, f"Se requieren {horas_requeridas}h de descanso para {ultimo_cuerpo}"
    
    return True, "Secuencia válida"


def validar_actividad_sabado(
    tipo: TipoActividad,
    timestamp: Optional[datetime] = None
) -> Tuple[bool, str]:
    """
    Valida si una actividad es apropiada para sábado.
    
    Args:
        tipo: Tipo de actividad
        timestamp: Fecha de la actividad (default: ahora)
    
    Returns:
        Tuple[bool, str]: (Es válido, Mensaje)
    """
    fecha = timestamp or datetime.now()
    
    # Verificar si es sábado (weekday() == 5)
    if fecha.weekday() != 5:
        return True, "No es sábado, no aplica regla especial"
    
    # En sábado solo se permiten trote y barras
    if tipo in REGLAS_EJERCICIO["sabado"]:
        return True, "Actividad apropiada para sábado"
    else:
        return False, "Los sábados solo se permiten trote y barras"


def calcular_xp_con_bonus(
    xp_base: int,
    tipo: TipoActividad,
    timestamp: Optional[datetime],
    racha_dias: int,
    area: str
) -> int:
    """
    Calcula XP final aplicando bonus por racha y horario óptimo.
    
    Args:
        xp_base: XP base de la actividad
        tipo: Tipo de actividad
        timestamp: Fecha/hora de la actividad
        racha_dias: Días consecutivos de racha
        area: Área de la actividad
    
    Returns:
        int: XP final con bonus aplicados
    """
    from app.config import BONUS_RACHA, HORARIO_OPTIMO
    
    xp_final = xp_base
    fecha = timestamp or datetime.now()
    
    # Aplicar bonus por racha
    bonus_racha = 1.0
    for dias_requeridos, multiplier in sorted(BONUS_RACHA.items()):
        if racha_dias >= dias_requeridos:
            bonus_racha = multiplier
    
    xp_final *= bonus_racha
    
    # Aplicar bonus por horario óptimo
    if tipo in [TipoActividad.EJERCICIO_FUERZA, TipoActividad.EJERCICIO_CARDIO, 
                TipoActividad.BARRAS, TipoActividad.TROTE]:
        horario = HORARIO_OPTIMO.get("ejercicio")
        if horario and horario["hora_inicio"] <= fecha.hour < horario["hora_fin"]:
            xp_final *= horario["bonus"]
    elif tipo == TipoActividad.ESTUDIO:
        horario = HORARIO_OPTIMO.get("estudio")
        if horario and horario["hora_inicio"] <= fecha.hour < horario["hora_fin"]:
            xp_final *= horario["bonus"]
    
    return int(xp_final)


def validar_limite_xp_diario(
    usuario_id: int,
    xp_a_agregar: int,
    area: str,
    db: Session
) -> Tuple[bool, str]:
    """
    Valida si se puede agregar XP sin exceder el límite diario del área.
    
    Args:
        usuario_id: ID del usuario
        xp_a_agregar: XP que se quiere agregar
        area: Área de la actividad
        db: Sesión de base de datos
    
    Returns:
        Tuple[bool, str]: (Es válido, Mensaje)
    """
    from app.config import LIMITE_XP_DIARIO
    
    limite = LIMITE_XP_DIARIO.get(area, 100)
    
    # Calcular XP ganado hoy en esta área
    hoy = datetime.now().date()
    actividades_hoy = db.query(Actividad).filter(
        Actividad.usuario_id == usuario_id,
        Actividad.area == area,
        Actividad.timestamp >= datetime.combine(hoy, datetime.min.time())
    ).all()
    
    xp_hoy = sum(act.xp_generado for act in actividades_hoy)
    
    if xp_hoy + xp_a_agregar > limite:
        return False, f"Límite diario de {limite} XP para área {area} alcanzado"
    
    return True, f"XP dentro del límite ({xp_hoy + xp_a_agregar}/{limite})"
