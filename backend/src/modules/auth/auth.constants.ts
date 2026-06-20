export const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
}

export const SYSTEM_SECRET = {
  question: 'No es la batalla de la lata, es la del formato',
  answer: 'no es 2019 es 2024',
}

export const RECOVERY_QUESTIONS = [
  {
    question: 'Aunque pierda está gente se va llena de orgullo',
    answer: 'esa es la diferencia entre mi pais y el tuyo',
  },
  {
    question: 'Tu no eres un lobo',
    answer: 'eres un hijo de perra',
  },
] as const

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000
export const SECRET_BLOCK_TTL_SECONDS = 900
export const SECRET_MAX_ATTEMPTS = 3
