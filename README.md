# NEURAX

Life-RPG app — monorepo pnpm con backend Fastify, mobile React Native/Expo y web Next.js 14.

## Requisitos

- [Docker](https://docs.docker.com/get-docker/) y Docker Compose
- [pnpm](https://pnpm.io/installation) >= 9

## Desarrollo local

### Instalar dependencias

```bash
pnpm install
```

### Servicios de base de datos (PostgreSQL + Redis)

```bash
# Iniciar servicios en background
docker compose up -d

# Ver estado de los servicios
docker compose ps

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (limpieza completa)
docker compose down -v
```

### Credenciales de desarrollo

| Servicio   | Host      | Puerto | Usuario  | Contraseña      | Base de datos |
|------------|-----------|--------|----------|-----------------|---------------|
| PostgreSQL | localhost | 5434   | neurax   | neurax_dev_pass | neurax_dev    |
| Redis      | localhost | 6381   | —        | —               | —             |

### Verificar conexión

```bash
# PostgreSQL
psql -h localhost -p 5434 -U neurax -d neurax_dev

# Redis
redis-cli ping  # debe responder PONG
```

### Scripts del monorepo

```bash
pnpm build      # build de todos los workspaces
pnpm typecheck  # typecheck de todos los workspaces
```
