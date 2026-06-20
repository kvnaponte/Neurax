import { describe, it, expect } from 'vitest'
import {
  calcularBonusRacha,
  calcularNivel,
  calcularXPFinal,
  esHorarioOptimo,
  calcularXPConPenalizacionCronos,
} from '../../../shared/xp.utils'

function utcDate(hour: number): Date {
  const d = new Date('2024-01-15T00:00:00Z')
  d.setUTCHours(hour, 0, 0, 0)
  return d
}

describe('calcularBonusRacha', () => {
  it('0 días → 1.0', () => expect(calcularBonusRacha(0)).toBe(1.0))
  it('45 días → 1.495', () => expect(calcularBonusRacha(45)).toBeCloseTo(1.495))
  it('90 días → 1.99', () => expect(calcularBonusRacha(90)).toBeCloseTo(1.99))
  it('91 días → 2.0 (cap)', () => expect(calcularBonusRacha(91)).toBe(2.0))
  it('200 días → 2.0 (cap)', () => expect(calcularBonusRacha(200)).toBe(2.0))
})

describe('calcularNivel', () => {
  it('0 XP → nivel 1',      () => expect(calcularNivel(0)).toBe(1))
  it('27000 XP → nivel 1',  () => expect(calcularNivel(27000)).toBe(1))
  it('27001 XP → nivel 2',  () => expect(calcularNivel(27001)).toBe(2))
  it('70000 XP → nivel 2',  () => expect(calcularNivel(70000)).toBe(2))
  it('70001 XP → nivel 3',  () => expect(calcularNivel(70001)).toBe(3))
  it('140000 XP → nivel 3', () => expect(calcularNivel(140000)).toBe(3))
  it('140001 XP → nivel 4', () => expect(calcularNivel(140001)).toBe(4))
  it('250000 XP → nivel 4', () => expect(calcularNivel(250000)).toBe(4))
  it('250001 XP → nivel 5', () => expect(calcularNivel(250001)).toBe(5))
  it('420000 XP → nivel 5', () => expect(calcularNivel(420000)).toBe(5))
  it('420001 XP → nivel 6', () => expect(calcularNivel(420001)).toBe(6))
  it('999999 XP → nivel 6', () => expect(calcularNivel(999999)).toBe(6))
})

describe('calcularXPFinal', () => {
  it('floor de la multiplicación', () => {
    expect(calcularXPFinal(100, 1.5, 1.2)).toBe(180)
  })
  it('redondea hacia abajo', () => {
    expect(calcularXPFinal(100, 1.011, 1.2)).toBe(121)
  })
  it('sin bonuses → xpBase', () => {
    expect(calcularXPFinal(200, 1.0, 1.0)).toBe(200)
  })
})

describe('esHorarioOptimo', () => {
  describe('ejercicios (06:00–10:00)', () => {
    it('07:00 → true',  () => expect(esHorarioOptimo('ejercicios', utcDate(7))).toBe(true))
    it('06:00 → true',  () => expect(esHorarioOptimo('ejercicios', utcDate(6))).toBe(true))
    it('09:59 → true',  () => expect(esHorarioOptimo('ejercicios', utcDate(9))).toBe(true))
    it('10:00 → false', () => expect(esHorarioOptimo('ejercicios', utcDate(10))).toBe(false))
    it('12:00 → false', () => expect(esHorarioOptimo('ejercicios', utcDate(12))).toBe(false))
  })

  describe('estudio (08:00–14:00)', () => {
    it('10:00 → true',  () => expect(esHorarioOptimo('estudio', utcDate(10))).toBe(true))
    it('07:00 → false', () => expect(esHorarioOptimo('estudio', utcDate(7))).toBe(false))
    it('14:00 → false', () => expect(esHorarioOptimo('estudio', utcDate(14))).toBe(false))
  })

  describe('sol_matutino / meditacion (antes 09:00)', () => {
    it('08:00 → true',  () => expect(esHorarioOptimo('sol_matutino', utcDate(8))).toBe(true))
    it('00:00 → true',  () => expect(esHorarioOptimo('meditacion', utcDate(0))).toBe(true))
    it('09:00 → false', () => expect(esHorarioOptimo('sol_matutino', utcDate(9))).toBe(false))
  })

  describe('sueno (21:00–07:00)', () => {
    it('23:00 → true',  () => expect(esHorarioOptimo('sueno', utcDate(23))).toBe(true))
    it('00:00 → true',  () => expect(esHorarioOptimo('sueno', utcDate(0))).toBe(true))
    it('06:00 → true',  () => expect(esHorarioOptimo('sueno', utcDate(6))).toBe(true))
    it('07:00 → false', () => expect(esHorarioOptimo('sueno', utcDate(7))).toBe(false))
    it('12:00 → false', () => expect(esHorarioOptimo('sueno', utcDate(12))).toBe(false))
  })

  it('tipo desconocido → false', () => expect(esHorarioOptimo('otro', utcDate(10))).toBe(false))
})

describe('calcularXPConPenalizacionCronos', () => {
  it('puntual → sin cambio',            () => expect(calcularXPConPenalizacionCronos(100, true)).toBe(100))
  it('no puntual → 85%',               () => expect(calcularXPConPenalizacionCronos(100, false)).toBe(85))
  it('no puntual → floor de 85%',      () => expect(calcularXPConPenalizacionCronos(99, false)).toBe(84))
})
