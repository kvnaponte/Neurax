from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
from sqlalchemy.orm import Session
from database import init_db, get_db, Usuario, Actividad, Hito, HitoTipo, TipoActividad

app = FastAPI(
    title="Sistema Imbatible",
    description="RPG de la vida real para optimizar comportamiento y productividad",
    version="1.0.0"
)

init_db()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# ENUMS
# ============================================================================

class Nivel(int, Enum):
    SUPERVIVIENTE_1 = 1
    SUPERVIVIENTE_2 = 2
    EJECUTOR_3 = 3
    EJECUTOR_4 = 4
    IMBATIBLE_5 = 5
    IMBATIBLE_6 = 6

# ============================================================================
# MODELOS
# ============================================================================

class HitoRequest(BaseModel):
    tipo: HitoTipo
    valor_xp: int
    descripcion: Optional[str] = None
    timestamp: Optional[datetime] = None

class HitoResponse(BaseModel):
    id: int
    usuario_id: int
    tipo: HitoTipo
    valor_xp: int
    descripcion: Optional[str]
    timestamp: datetime

class ActividadRequest(BaseModel):
    tipo: TipoActividad
    duracion_minutos: int
    timestamp: Optional[datetime] = None
    descripcion: Optional[str] = None

class ActividadResponse(BaseModel):
    id: int
    usuario_id: int
    tipo: TipoActividad
    duracion_minutos: int
    timestamp: datetime
    xp_generado: int

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str
    xp_total: int
    nivel: Nivel
    racha_dias: int
    última_actividad: Optional[datetime]

class UsuarioCreate(BaseModel):
    nombre: str
    email: str

# ============================================================================
# CONFIG
# ============================================================================

ACTIVIDAD_XP = {
    TipoActividad.SUEÑO: lambda mins: 20 if mins >= 345 else 10,
    TipoActividad.EJERCICIO: lambda mins: 15 if mins >= 60 else 5,
    TipoActividad.ESTUDIO: lambda mins: 25 if mins >= 50 else 10,
    TipoActividad.TRABAJO: lambda mins: 10,
    TipoActividad.TRANSPORTE: lambda mins: 5,
    TipoActividad.MUSICA: lambda mins: 20,
}

NIVELES_XP = {
    1: 0,
    2: 100,
    3: 250,
    4: 450,
    5: 700,
    6: 1000,
}

DESCRIPCIONES_NIVEL = {
    1: "Superviviente",
    2: "Superviviente",
    3: "Ejecutor",
    4: "Ejecutor",
    5: "Imbatible",
    6: "Imbatible",
}

# ============================================================================
# HELPERS
# ============================================================================

def obtener_usuario_activo(usuario_id: int, db: Session):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.active == True
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no disponible")

    return usuario


def calcular_nivel(xp_total: int) -> Nivel:
    for nivel in range(6, 0, -1):
        if xp_total >= NIVELES_XP[nivel]:
            return Nivel(nivel)
    return Nivel.SUPERVIVIENTE_1


def calcular_xp(tipo: TipoActividad, duracion: int):
    return ACTIVIDAD_XP.get(tipo, lambda x: 0)(duracion)


def obtener_racha(usuario_id: int, db: Session):
    actividades = db.query(Actividad).filter(
        Actividad.usuario_id == usuario_id
    ).order_by(Actividad.timestamp.desc()).all()

    if not actividades:
        return 0

    racha = 0
    hoy = datetime.now().date()

    for act in actividades:
        if (hoy - act.timestamp.date()).days == racha:
            racha += 1
        else:
            break

    return racha

# ============================================================================
# USUARIOS
# ============================================================================

@app.post("/api/usuarios", response_model=UsuarioResponse)
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    nuevo = Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
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


@app.get("/api/usuarios/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = obtener_usuario_activo(usuario_id, db)

    return UsuarioResponse(
        id=usuario.id,
        nombre=usuario.nombre,
        email=usuario.email,
        xp_total=usuario.xp_total,
        nivel=Nivel(usuario.nivel),
        racha_dias=obtener_racha(usuario_id, db),
        última_actividad=usuario.última_actividad
    )


@app.patch("/api/usuarios/{usuario_id}/desactivar")
def toggle_usuario_activo(usuario_id: int, active: bool = False, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if usuario.active == active:
        raise HTTPException(status_code=400, detail=f"Usuario ya está {'activo' if active else 'inactivo'}")

    usuario.active = active
    if not active:
        usuario.fecha_eliminacion = datetime.now()

    db.commit()
    db.refresh(usuario)

    return {"mensaje": f"Usuario {'activado' if active else 'desactivado'}"}

# ============================================================================
# ACTIVIDADES
# ============================================================================

@app.post("/api/usuarios/{usuario_id}/actividades", response_model=ActividadResponse)
def registrar_actividad(usuario_id: int, actividad: ActividadRequest, db: Session = Depends(get_db)):
    usuario = obtener_usuario_activo(usuario_id, db)

    xp = calcular_xp(actividad.tipo, actividad.duracion_minutos)
    timestamp = actividad.timestamp or datetime.now()

    nueva = Actividad(
        usuario_id=usuario_id,
        tipo=actividad.tipo,
        duracion_minutos=actividad.duracion_minutos,
        timestamp=timestamp,
        xp_generado=xp,
        descripcion=actividad.descripcion
    )

    db.add(nueva)

    usuario.xp_total += xp
    usuario.nivel = calcular_nivel(usuario.xp_total)
    usuario.última_actividad = timestamp

    db.commit()
    db.refresh(nueva)

    return ActividadResponse(
        id=nueva.id,
        usuario_id=nueva.usuario_id,
        tipo=nueva.tipo,
        duracion_minutos=nueva.duracion_minutos,
        timestamp=nueva.timestamp,
        xp_generado=nueva.xp_generado
    )


@app.get("/api/usuarios/{usuario_id}/actividades")
def obtener_actividades(usuario_id: int, dias: int = 7, db: Session = Depends(get_db)):
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

@app.post("/api/usuarios/{usuario_id}/hitos", response_model=HitoResponse)
def registrar_hito(usuario_id: int, hito: HitoRequest, db: Session = Depends(get_db)):
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

    usuario.xp_total += hito.valor_xp
    usuario.nivel = calcular_nivel(usuario.xp_total)

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


@app.get("/api/usuarios/{usuario_id}/hitos")
def obtener_hitos(usuario_id: int, db: Session = Depends(get_db)):
    obtener_usuario_activo(usuario_id, db)

    return db.query(Hito).filter(
        Hito.usuario_id == usuario_id
    ).all()

# ============================================================================
# ESTADÍSTICAS
# ============================================================================

@app.get("/api/usuarios/{usuario_id}/estadisticas")
def estadisticas(usuario_id: int, db: Session = Depends(get_db)):
    usuario = obtener_usuario_activo(usuario_id, db)

    return {
        "xp_total": usuario.xp_total,
        "nivel": calcular_nivel(usuario.xp_total).name,
        "racha": obtener_racha(usuario_id, db)
    }

# ============================================================================
# SALUD
# ============================================================================

@app.get("/")
def root():
    return {"mensaje": "Sistema Imbatible activo"}

@app.get("/health")
def health():
    return {"status": "ok"}