# EcoRun Sevilla — Documentación de la API

> **Versión:** 2.0.0
> **Base URL (local):** `http://localhost:8080`
> **Proyecto:** GS DAW 2025–2026
> **Base de datos:** MySQL 8.0 (`ecorun_sevilla`)

---

## Índice

1. [Resumen general](#1-resumen-general)
2. [Autenticación](#2-autenticación)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Endpoints — Health & Info](#4-endpoints--health--info)
5. [Endpoints — Auth](#5-endpoints--auth)
6. [Endpoints — Runs](#6-endpoints--runs)
7. [Endpoints — Challenges](#7-endpoints--challenges)
8. [Códigos de error estándar](#8-códigos-de-error-estándar)
9. [Tests automatizados (Jest + Supertest)](#9-tests-automatizados-jest--supertest)
10. [Guía rápida: ejecutar tests en Postman](#10-guía-rápida-ejecutar-tests-en-postman)
11. [Notas técnicas y pendientes](#11-notas-técnicas-y-pendientes)

---

## 1. Resumen general

EcoRun Sevilla es una API REST para una aplicación de running urbano. Permite a los usuarios registrarse, registrar sus carreras, consultar estadísticas y participar en retos (challenges) por la ciudad de Sevilla.

### Stack técnico

| Componente | Tecnología |
|---|---|
| Runtime | Node.js |
| Framework | Express.js 5.2 |
| Base de datos | MySQL 8.0 (Docker) |
| Autenticación | JWT (24h) |
| Hashing | bcrypt (10 rondas) |
| Validación | express-validator |
| Tests | Jest 29 + Supertest |
| Puerto por defecto | 8080 |

### Módulos de la API

| Módulo | Prefijo | Auth requerida |
|---|---|---|
| Health & Info | `/`, `/health` | No |
| Auth | `/api/auth` | No |
| Runs | `/api/runs` | Sí (todas) |
| Challenges | `/api/challenges` | Parcial |

---

## 2. Autenticación

La API usa **JWT (JSON Web Tokens)** con esquema **Bearer**.

### Obtener un token

Registrarse o hacer login devuelve un token JWT válido durante **24 horas**.

```
POST /api/auth/register
POST /api/auth/login
```

### Usar el token

Incluir el token en el header `Authorization` de cada petición protegida:

```
Authorization: Bearer <token>
```

### Payload del JWT

```json
{
  "userId": 1,
  "iat": 1711400000,
  "exp": 1711486400
}
```

### Errores de autenticación

| Situación | Código | Mensaje |
|---|---|---|
| Sin header Authorization | 401 | `Token requerido` |
| Token inválido o expirado | 401 | `Token inválido` |

---

## 3. Variables de entorno

Copiar `.env.example` como `.env` y rellenar los valores:

```bash
cp .env.example .env
```

```env
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=ecorun_sevilla
DB_PORT=3306

JWT_SECRET=cambia_esto_por_un_secreto_seguro
```

> **Importante:** El archivo `.env` está en `.gitignore` y nunca debe subirse al repositorio.

### Arrancar la base de datos (Docker)

```bash
docker start mysql-ecorun
```

### Arrancar el servidor

```bash
npm run dev     # desarrollo (nodemon, recarga automática)
npm start       # producción
```

---

## 4. Endpoints — Health & Info

### GET /

Información general de la API.

**Auth:** No requerida

**Respuesta 200:**
```json
{
  "name": "EcoRun Sevilla API",
  "version": "2.0.0",
  "status": "production-ready",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth",
    "runs": "/api/runs",
    "challenges": "/api/challenges"
  }
}
```

---

### GET /health

Comprueba el estado del servidor y la conexión a la base de datos.

**Auth:** No requerida

**Respuesta 200 — OK:**
```json
{
  "status": "OK",
  "timestamp": "2026-03-26T10:00:00.000Z",
  "env": "development"
}
```

**Respuesta 503 — DB caída:**
```json
{
  "status": "DB_ERROR",
  "error": "Connection refused"
}
```

---

## 5. Endpoints — Auth

### POST /api/auth/register

Registra un nuevo usuario en el sistema.

**Auth:** No requerida

**Body (application/json):**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| username | string | Sí | No vacío |
| email | string | Sí | Email válido |
| password | string | Sí | Mínimo 6 caracteres |

**Ejemplo:**
```json
{
  "username": "alexnechita",
  "email": "alex@ecorun.com",
  "password": "Test123"
}
```

**Respuesta 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "alexnechita",
    "email": "alex@ecorun.com"
  }
}
```

**Respuesta 400 — Usuario duplicado:**
```json
{ "error": "Usuario ya existe" }
```

**Respuesta 400 — Validación fallida:**
```json
{
  "errors": [
    { "msg": "Valid email required", "path": "email" }
  ]
}
```

---

### POST /api/auth/login

Inicia sesión con email (o username) y contraseña.

**Auth:** No requerida

**Body:**

| Campo | Tipo | Notas |
|---|---|---|
| email | string | Acepta también username |
| password | string | |

**Ejemplo:**
```json
{
  "email": "alex@ecorun.com",
  "password": "Test123"
}
```

**Respuesta 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "alexnechita",
    "email": "alex@ecorun.com"
  }
}
```

**Respuesta 401:**
```json
{ "error": "Credenciales inválidas" }
```

---

## 6. Endpoints — Runs

> **Todas las rutas de este módulo requieren autenticación.**
> Header: `Authorization: Bearer <token>`

### POST /api/runs

Registra una nueva carrera.

**Body:**

| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| user_id | integer | Sí | > 0 |
| run_name | string | Sí | Max 100 caracteres |
| distance_km | float | Sí | > 0 |
| duration_minutes | integer | Sí | > 0 |
| start_time | string | Sí | ISO 8601 |
| end_time | string | Sí | ISO 8601 |
| run_date | string | Sí | ISO 8601 |
| description | string | No | Texto libre |
| points_earned | integer | No | Auto: `distance_km × 10` |

**Ejemplo:**
```json
{
  "user_id": 1,
  "run_name": "Vuelta al Parque de María Luisa",
  "distance_km": 5,
  "duration_minutes": 30,
  "start_time": "2026-03-26T08:00:00.000Z",
  "end_time": "2026-03-26T08:30:00.000Z",
  "run_date": "2026-03-26"
}
```

**Respuesta 201:**
```json
{
  "success": true,
  "message": "Run creado exitosamente",
  "data": {
    "id": 1,
    "user_id": 1,
    "run_name": "Vuelta al Parque de María Luisa",
    "distance_km": 5,
    "duration_minutes": 30,
    "points_earned": 50,
    "run_date": "2026-03-26T00:00:00.000Z",
    "created_at": "2026-03-26T10:00:00.000Z"
  }
}
```

---

### GET /api/runs/user/:userId

Devuelve todas las carreras de un usuario, ordenadas por fecha descendente.

**Respuesta 200:**
```json
{
  "success": true,
  "data": [ { "id": 1, "run_name": "...", "distance_km": 5, ... } ]
}
```

---

### GET /api/runs/:id

Devuelve una carrera por ID.

**Respuesta 200:**
```json
{
  "success": true,
  "data": { "id": 1, "run_name": "...", ... }
}
```

**Respuesta 404:**
```json
{ "success": false, "message": "Run no encontrado" }
```

---

### PUT /api/runs/:id

Actualiza campos de una carrera. Solo es necesario enviar los campos a modificar.

**Ejemplo:**
```json
{ "run_name": "Nombre actualizado", "distance_km": 8.5 }
```

**Respuesta 200:**
```json
{
  "success": true,
  "message": "Run actualizado exitosamente",
  "data": { "id": 1, "run_name": "Nombre actualizado", "distance_km": 8.5, ... }
}
```

---

### DELETE /api/runs/:id

Elimina una carrera por ID.

**Respuesta 200:**
```json
{ "success": true, "message": "Run eliminado correctamente" }
```

**Respuesta 404:**
```json
{ "success": false, "message": "Run no encontrado" }
```

---

## 7. Endpoints — Challenges

### GET /api/challenges

Devuelve todos los challenges activos, ordenados por dificultad y fecha de fin.

**Auth:** No requerida

**Respuesta 200:**
```json
[
  {
    "id": 3,
    "name": "Circuito Guadalquivir 5K",
    "description": "...",
    "goal_type": "distance",
    "goal_value": 5,
    "reward_points": 100,
    "difficulty": "easy",
    "category": "running",
    "start_date": "2026-03-01",
    "end_date": "2026-04-30",
    "active": 1
  }
]
```

---

### GET /api/challenges/:id

Devuelve un challenge por ID.

**Auth:** No requerida

**Respuesta 200:** objeto con todos los campos del challenge.

**Respuesta 404:**
```json
{ "error": "Challenge no encontrado" }
```

---

### POST /api/challenges/:id/join

Une al usuario autenticado a un challenge.

**Auth:** Requerida — el `user_id` se extrae del token, no del body.

**Body:** vacío `{}`

**Respuesta 201:**
```json
{
  "id": 1,
  "challenge_id": "3",
  "status": "in_progress",
  "progress": 0,
  "message": "Te has unido al challenge exitosamente"
}
```

**Respuesta 404:**
```json
{ "error": "Challenge no encontrado o inactivo" }
```

---

### GET /api/challenges/user/:userId

Devuelve los challenges del usuario autenticado con su progreso.

**Auth:** Requerida — los datos devueltos corresponden siempre al usuario del token, independientemente del `:userId` en la URL.

**Respuesta 200:**
```json
[
  {
    "id": 1,
    "progress": 5.5,
    "status": "in_progress",
    "joined_at": "2026-03-26T10:00:00.000Z",
    "challenge_id": 3,
    "name": "Circuito Guadalquivir 5K",
    "goal_type": "distance",
    "goal_value": 5,
    "reward_points": 100,
    "difficulty": "easy"
  }
]
```

---

### PUT /api/challenges/user/:userChallengeId/progress

Actualiza el progreso del usuario en un challenge.

**Auth:** Requerida

**Body:**

| Campo | Tipo | Validación |
|---|---|---|
| progress | float | >= 0 |

**Ejemplo:**
```json
{ "progress": 5.5 }
```

**Respuesta 200:**
```json
{ "message": "Progreso actualizado", "progress": 5.5 }
```

**Respuesta 404:**
```json
{ "error": "Challenge de usuario no encontrado" }
```

---

## 8. Códigos de error estándar

| Código | Significado | Cuándo ocurre |
|---|---|---|
| 200 | OK | Petición exitosa |
| 201 | Created | Recurso creado |
| 400 | Bad Request | Validación fallida, datos incorrectos, duplicado |
| 401 | Unauthorized | Token ausente, inválido o expirado |
| 404 | Not Found | Recurso no existe |
| 500 | Internal Server Error | Error inesperado del servidor |
| 503 | Service Unavailable | Base de datos no disponible |

### Formato de respuesta de error

```json
{ "success": false, "message": "Descripción del error" }
```

O en rutas inline:
```json
{ "error": "Descripción del error" }
```

---

## 9. Tests automatizados (Jest + Supertest)

El proyecto incluye una suite de tests automatizados que **no requieren base de datos activa** — la capa de datos está mockeada.

### Estructura

```
tests/
├── setup.js              # Variables de entorno para el entorno de test
├── health.test.js        # 3 tests  — GET / y GET /health
├── auth.test.js          # 11 tests — POST /register y POST /login
├── runs.test.js          # 18 tests — CRUD completo de carreras
└── challenges.test.js    # 20 tests — CRUD completo de challenges
```

**Total: 52 tests**

### Comandos

```bash
# Ejecutar todos los tests
npm test

# Modo watch (re-ejecuta al guardar archivos)
npm run test:watch

# Con informe de cobertura
npm run test:coverage
```

### Qué cubre cada suite

**health.test.js**
- GET / devuelve info de la API
- GET /health devuelve OK con DB activa
- GET /health devuelve 503 con DB caída
- Rutas desconocidas devuelven 404

**auth.test.js**
- Registro exitoso → devuelve token y usuario
- No expone `password_hash` en la respuesta
- Registro con email/password inválidos → 400
- Registro de usuario duplicado → 400
- Login exitoso → devuelve token
- Login con contraseña incorrecta → 401
- Login con usuario inexistente → 401

**runs.test.js**
- Crear carrera con datos correctos → 201
- Crear sin token → 401
- Crear con token inválido → 401
- Validaciones de campos (user_id, distance_km, fechas) → 400
- Listar carreras del usuario
- Obtener carrera por ID → 200
- Obtener carrera inexistente → 404
- ID no numérico → 400
- Actualizar carrera → 200
- Actualizar carrera inexistente → 404
- Eliminar carrera → 200
- Eliminar carrera inexistente → 404

**challenges.test.js**
- Listar challenges activos (sin auth)
- Obtener challenge por ID → 200 y 404
- ID inválido → 400
- Unirse a challenge con auth → 201
- Unirse sin token → 401
- Unirse a challenge inexistente → 404
- Mis challenges con auth → 200
- Mis challenges sin token → 401
- Actualizar progreso → 200
- Progreso negativo → 400
- Progress ausente → 400
- UserChallenge inexistente → 404
- Sin token → 401

---

## 10. Guía rápida: ejecutar tests en Postman

### Paso 1 — Importar archivos

1. Abrir Postman
2. Clic en **Import**
3. Seleccionar ambos archivos de la raíz del proyecto:
   - `postman_collection.json`
   - `postman_environment.json`

### Paso 2 — Seleccionar entorno

En la esquina superior derecha de Postman, seleccionar **"EcoRun Sevilla - Local"**.

### Paso 3 — Arrancar el servidor

```bash
docker start mysql-ecorun
npm run dev
```

Verificar: `http://localhost:8080/health` debe devolver `{ "status": "OK" }`.

### Paso 4 — Ejecutar

**Manualmente (recomendado para depurar):** ejecutar las requests en este orden:
1. `Auth > Registro de usuario` → guarda `auth_token` y `user_id` automáticamente
2. `Runs > Crear carrera` → guarda `run_id`
3. `Challenges > Listar challenges activos` → guarda `challenge_id`
4. Resto en cualquier orden

**Collection Runner (todos de una vez):**
1. Clic derecho en la colección → **Run collection**
2. Verificar que el entorno está seleccionado
3. Clic en **Run EcoRun Sevilla API**

### Variables que se auto-configuran

| Variable | Se configura en |
|---|---|
| `auth_token` | Auth > Registro o Login |
| `user_id` | Auth > Registro o Login |
| `run_id` | Runs > Crear carrera |
| `challenge_id` | Challenges > Listar challenges activos |
| `user_challenge_id` | Challenges > Unirse a un challenge |

---

## 11. Notas técnicas y pendientes

### Tabla `posts` sin implementar

La base de datos contiene una tabla `posts` (campos: `id`, `run_id`, `user_id`, `published_at`) sin rutas en la API. Funcionalidad pendiente de implementar.

### Cálculo automático de puntos

Al crear una carrera, si no se envía `points_earned`, se calcula automáticamente:

```
points_earned = distance_km × 10
```

### Challenges activos en base de datos

| ID | Nombre | Dificultad |
|---|---|---|
| 3 | Circuito Guadalquivir 5K | easy |
| 4 | Reto Triana 10K | medium |
| 5 | Santa Cruz Histórico | medium |
| 6 | Alameda Nocturno | hard |
| 7 | Maratón Sevilla Training | hard |

### Rutas públicas vs. protegidas — resumen

| Ruta | Método | Auth |
|---|---|---|
| `GET /api/challenges` | GET | No |
| `GET /api/challenges/:id` | GET | No |
| `POST /api/challenges/:id/join` | POST | **Sí** |
| `GET /api/challenges/user/:userId` | GET | **Sí** |
| `PUT /api/challenges/user/:id/progress` | PUT | **Sí** |
| Todas las rutas `/api/runs/*` | Todas | **Sí** |
