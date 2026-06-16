// Se ejecuta antes de que los test files importen sus módulos
process.env.DATABASE_URL ??= 'postgresql://neurax:neurax_dev_pass@localhost:5434/neurax_dev'
process.env.REDIS_URL ??= 'redis://localhost:6381'
process.env.JWT_SECRET ??= 'test-jwt-secret-neurax-min-32-chars!!'
