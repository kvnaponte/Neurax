import { z } from 'zod'

export const RegisterSchema = z.object({
  nombre: z.string().min(2).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, '1 mayúscula requerida')
    .regex(/[0-9]/, '1 número requerido'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const VerifySecretSchema = z.object({
  answer: z.string().trim(),
})

export const RecoverVerifySchema = z.object({
  userId: z.string().uuid(),
  answer1: z.string().trim(),
  answer2: z.string().trim(),
})

export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, '1 mayúscula requerida')
    .regex(/[0-9]/, '1 número requerido'),
})
