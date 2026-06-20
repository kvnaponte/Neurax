import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { leonidas_ejercicios_catalogo } from '../schema'
import type * as schema from '../schema'

type DB = PostgresJsDatabase<typeof schema>

const ejercicios = [
  // Pecho (6)
  { id: 'ee000001-0000-0000-0000-000000000001', nombre: 'Press de Banca con Barra', grupo_muscular: 'Pecho' },
  { id: 'ee000001-0000-0000-0000-000000000002', nombre: 'Press Inclinado con Mancuernas', grupo_muscular: 'Pecho' },
  { id: 'ee000001-0000-0000-0000-000000000003', nombre: 'Aperturas con Mancuernas', grupo_muscular: 'Pecho' },
  { id: 'ee000001-0000-0000-0000-000000000004', nombre: 'Fondos en Paralelas', grupo_muscular: 'Pecho' },
  { id: 'ee000001-0000-0000-0000-000000000005', nombre: 'Press Declinado', grupo_muscular: 'Pecho' },
  { id: 'ee000001-0000-0000-0000-000000000006', nombre: 'Crossover en Polea', grupo_muscular: 'Pecho' },

  // Espalda (6)
  { id: 'ee000002-0000-0000-0000-000000000001', nombre: 'Peso Muerto Convencional', grupo_muscular: 'Espalda' },
  { id: 'ee000002-0000-0000-0000-000000000002', nombre: 'Jalón al Pecho', grupo_muscular: 'Espalda' },
  { id: 'ee000002-0000-0000-0000-000000000003', nombre: 'Remo con Barra', grupo_muscular: 'Espalda' },
  { id: 'ee000002-0000-0000-0000-000000000004', nombre: 'Remo con Mancuerna', grupo_muscular: 'Espalda' },
  { id: 'ee000002-0000-0000-0000-000000000005', nombre: 'Pullover con Mancuerna', grupo_muscular: 'Espalda' },
  { id: 'ee000002-0000-0000-0000-000000000006', nombre: 'Face Pull', grupo_muscular: 'Espalda' },

  // Hombros (5)
  { id: 'ee000003-0000-0000-0000-000000000001', nombre: 'Press Militar con Barra', grupo_muscular: 'Hombros' },
  { id: 'ee000003-0000-0000-0000-000000000002', nombre: 'Elevaciones Laterales', grupo_muscular: 'Hombros' },
  { id: 'ee000003-0000-0000-0000-000000000003', nombre: 'Elevaciones Frontales', grupo_muscular: 'Hombros' },
  { id: 'ee000003-0000-0000-0000-000000000004', nombre: 'Press Arnold', grupo_muscular: 'Hombros' },
  { id: 'ee000003-0000-0000-0000-000000000005', nombre: 'Remo al Mentón', grupo_muscular: 'Hombros' },

  // Bíceps (5)
  { id: 'ee000004-0000-0000-0000-000000000001', nombre: 'Curl con Barra', grupo_muscular: 'Bíceps' },
  { id: 'ee000004-0000-0000-0000-000000000002', nombre: 'Curl con Mancuernas', grupo_muscular: 'Bíceps' },
  { id: 'ee000004-0000-0000-0000-000000000003', nombre: 'Curl Martillo', grupo_muscular: 'Bíceps' },
  { id: 'ee000004-0000-0000-0000-000000000004', nombre: 'Curl en Banco Scott', grupo_muscular: 'Bíceps' },
  { id: 'ee000004-0000-0000-0000-000000000005', nombre: 'Curl Concentrado', grupo_muscular: 'Bíceps' },

  // Tríceps (5)
  { id: 'ee000005-0000-0000-0000-000000000001', nombre: 'Press Francés', grupo_muscular: 'Tríceps' },
  { id: 'ee000005-0000-0000-0000-000000000002', nombre: 'Extensión Tríceps en Polea', grupo_muscular: 'Tríceps' },
  { id: 'ee000005-0000-0000-0000-000000000003', nombre: 'Fondos en Banco', grupo_muscular: 'Tríceps' },
  { id: 'ee000005-0000-0000-0000-000000000004', nombre: 'Extensión Tríceps sobre la Cabeza', grupo_muscular: 'Tríceps' },
  { id: 'ee000005-0000-0000-0000-000000000005', nombre: 'Patada de Tríceps con Mancuerna', grupo_muscular: 'Tríceps' },

  // Cuádriceps (5)
  { id: 'ee000006-0000-0000-0000-000000000001', nombre: 'Sentadilla con Barra', grupo_muscular: 'Cuádriceps' },
  { id: 'ee000006-0000-0000-0000-000000000002', nombre: 'Prensa de Piernas', grupo_muscular: 'Cuádriceps' },
  { id: 'ee000006-0000-0000-0000-000000000003', nombre: 'Extensiones de Cuádriceps', grupo_muscular: 'Cuádriceps' },
  { id: 'ee000006-0000-0000-0000-000000000004', nombre: 'Zancadas', grupo_muscular: 'Cuádriceps' },
  { id: 'ee000006-0000-0000-0000-000000000005', nombre: 'Sentadilla Hack', grupo_muscular: 'Cuádriceps' },

  // Femorales/Glúteos (5)
  { id: 'ee000007-0000-0000-0000-000000000001', nombre: 'Peso Muerto Rumano', grupo_muscular: 'Femorales/Glúteos' },
  { id: 'ee000007-0000-0000-0000-000000000002', nombre: 'Curl Femoral en Máquina', grupo_muscular: 'Femorales/Glúteos' },
  { id: 'ee000007-0000-0000-0000-000000000003', nombre: 'Hip Thrust', grupo_muscular: 'Femorales/Glúteos' },
  { id: 'ee000007-0000-0000-0000-000000000004', nombre: 'Patadas de Glúteo en Polea', grupo_muscular: 'Femorales/Glúteos' },
  { id: 'ee000007-0000-0000-0000-000000000005', nombre: 'Buenos Días', grupo_muscular: 'Femorales/Glúteos' },

  // Core (5)
  { id: 'ee000008-0000-0000-0000-000000000001', nombre: 'Plancha', grupo_muscular: 'Core' },
  { id: 'ee000008-0000-0000-0000-000000000002', nombre: 'Crunch Abdominal', grupo_muscular: 'Core' },
  { id: 'ee000008-0000-0000-0000-000000000003', nombre: 'Elevación de Piernas Colgado', grupo_muscular: 'Core' },
  { id: 'ee000008-0000-0000-0000-000000000004', nombre: 'Rueda Abdominal', grupo_muscular: 'Core' },
  { id: 'ee000008-0000-0000-0000-000000000005', nombre: 'Giro Ruso', grupo_muscular: 'Core' },

  // Cardio (6)
  { id: 'ee000009-0000-0000-0000-000000000001', nombre: 'Correr', grupo_muscular: 'Cardio' },
  { id: 'ee000009-0000-0000-0000-000000000002', nombre: 'Saltar la Cuerda', grupo_muscular: 'Cardio' },
  { id: 'ee000009-0000-0000-0000-000000000003', nombre: 'Bicicleta Estática', grupo_muscular: 'Cardio' },
  { id: 'ee000009-0000-0000-0000-000000000004', nombre: 'Elíptica', grupo_muscular: 'Cardio' },
  { id: 'ee000009-0000-0000-0000-000000000005', nombre: 'Remo Ergómetro', grupo_muscular: 'Cardio' },
  { id: 'ee000009-0000-0000-0000-000000000006', nombre: 'Burpees', grupo_muscular: 'Cardio' },

  // Barras (6)
  { id: 'ee000010-0000-0000-0000-000000000001', nombre: 'Dominadas', grupo_muscular: 'Barras' },
  { id: 'ee000010-0000-0000-0000-000000000002', nombre: 'Dominadas Agarre Supino', grupo_muscular: 'Barras' },
  { id: 'ee000010-0000-0000-0000-000000000003', nombre: 'Muscle Up', grupo_muscular: 'Barras' },
  { id: 'ee000010-0000-0000-0000-000000000004', nombre: 'L-Sit en Barras', grupo_muscular: 'Barras' },
  { id: 'ee000010-0000-0000-0000-000000000005', nombre: 'Archer Pull-Up', grupo_muscular: 'Barras' },
  { id: 'ee000010-0000-0000-0000-000000000006', nombre: 'Toes to Bar', grupo_muscular: 'Barras' },
]

export async function seedLeonidasCatalogo(db: DB) {
  await db.insert(leonidas_ejercicios_catalogo).values(ejercicios).onConflictDoNothing()
  console.log(`  ✓ leonidas_ejercicios_catalogo: ${ejercicios.length} registros`)
}
