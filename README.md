# 🏠 Vibes — Backend API

API REST para la plataforma **Vibes**, un sistema de alquiler de propiedades corto plazo construido con **NestJS**, **Drizzle ORM** y **MySQL**.

---

## 📦 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS 11 |
| ORM | Drizzle ORM |
| Base de datos | MySQL 8 |
| Autenticación | JWT (jsonwebtoken + @nestjs/jwt) |
| Almacenamiento de imágenes | Cloudinary |
| Búsqueda semántica | Pinecone + OpenAI Embeddings |
| Subida de archivos | Multer (memoria) |
| Deployment | Railway |

---

## 🗂️ Estructura del Proyecto

```
src/
├── app/                    # Controlador raíz (health check)
├── auth/                   # Guard JWT + decorador @Public
├── casas/                  # CRUD de propiedades
├── casa_imagenes/          # Gestión de imágenes por Cloudinary
├── hosts/                  # CRUD de anfitriones
├── personas/               # CRUD de perfiles de usuario
├── reservas/               # CRUD de reservas
├── users/                  # CRUD de usuarios (credenciales)
├── login/                  # Autenticación y generación de JWT
├── register/               # Registro atómico (user + persona)
├── pinecone/               # Sincronización vectorial con Pinecone
├── db/
│   ├── connection.ts       # Pool MySQL + instancia Drizzle
│   ├── schema_users.ts
│   ├── schema_personas.ts
│   ├── schema_hosts.ts
│   ├── schema_casas.ts
│   ├── schema_casa_imagenes.ts
│   └── schema_reservas.ts
└── config/
    └── cloudinary.config.ts
```

---

## 🚀 Instalación y Ejecución

### Requisitos

- Node.js >= 18
- MySQL 8 en ejecución
- Cuenta en Cloudinary
- Cuenta en Pinecone + OpenAI API Key

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd backend-app-vibes
npm install
```

### 2. Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=vibes

# JWT
JWT_SECRET=tu_secreto_seguro

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Pinecone
PINECONE_API_KEY=tu_pinecone_key
PINECONE_HOST=tu_pinecone_host

# OpenAI
OPENAI_API_KEY=tu_openai_key
```

### 3. Ejecutar la base de datos

Ejecutar el script SQL ubicado en `src/db/db.sql` en tu instancia MySQL para crear las tablas y los índices necesarios.

### 4. Iniciar el servidor

```bash
# Desarrollo (con hot-reload)
npm run start:dev

# Producción
npm run start:prod
```

El servidor escucha en **http://localhost:3000**

---

## 🔐 Autenticación

La API utiliza **JWT Bearer Tokens**. Las rutas protegidas requieren el header:

```
Authorization: Bearer <token>
```

Las rutas públicas están marcadas con el decorador `@Public()` y no requieren token.

### Endpoints públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/login` | Iniciar sesión, devuelve JWT |
| `POST` | `/register` | Registro de nuevo usuario + persona |
| `GET` | `/casas` | Listar todas las casas |
| `GET` | `/casas/:id` | Detalle de una casa |
| `GET` | `/casas/buscar?q=` | Búsqueda full-text en casas |

---

## 📡 Endpoints

### Auth

| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| `POST` | `/login` | `{ email, password }` | Devuelve `access_token` + datos del usuario |
| `POST` | `/register` | `{ email, password, nombres, apellidos, fecha_nacimiento }` | Crea user + persona en transacción atómica |

### Users

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/users` | Listar todos los usuarios |
| `GET` | `/users/:id` | Usuario por ID |
| `GET` | `/users/usersDisponibles` | Usuarios sin perfil de persona asignado |
| `GET` | `/users/buscar?q=` | Buscar usuarios por email |
| `POST` | `/users` | Crear usuario |
| `PUT` | `/users/:id` | Actualizar usuario |
| `DELETE` | `/users/:id` | Eliminar usuario |

### Personas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/personas` | Listar personas |
| `GET` | `/personas/:id` | Persona por ID |
| `GET` | `/personas/personasDisponibles` | Personas sin host asignado |
| `GET` | `/personas/buscar?q=` | Buscar por nombre o cédula |
| `POST` | `/personas` | Crear persona |
| `POST` | `/personas/:id/foto` | Subir foto de perfil (multipart) |
| `PUT` | `/personas/:id` | Actualizar persona |
| `DELETE` | `/personas/:id` | Eliminar persona |

### Hosts

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/hosts` | Listar hosts activos |
| `GET` | `/hosts/:id` | Host por ID |
| `GET` | `/hosts/buscar?q=` | Buscar hosts |
| `POST` | `/hosts` | Crear host |
| `PUT` | `/hosts/:id` | Actualizar host |
| `DELETE` | `/hosts/:id` | Eliminar host |

### Casas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/casas` | Listar casas (público) |
| `GET` | `/casas/:id` | Detalle de casa (público) |
| `GET` | `/casas/host/:hostId` | Casas por anfitrión |
| `GET` | `/casas/buscar?q=` | Búsqueda full-text MySQL (público) |
| `POST` | `/casas` | Crear casa (sincroniza con Pinecone) |
| `POST` | `/casas/sincronizar-pinecone` | Sincronizar todas las casas con Pinecone |
| `PUT` | `/casas/:id` | Actualizar casa (sincroniza con Pinecone) |
| `DELETE` | `/casas/:id` | Eliminar casa (elimina de Pinecone) |

### Imágenes de Casas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/casa-imagenes/:casaId` | Imágenes activas de una casa |
| `POST` | `/casa-imagenes/upload/:casaId` | Subir imagen (multipart, max 5MB) |
| `PATCH` | `/casa-imagenes/:casaId/principal/:imagenId` | Marcar imagen como principal |
| `DELETE` | `/casa-imagenes/:imagenId` | Eliminar imagen (Cloudinary + DB) |

### Reservas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/reservas` | Listar todas las reservas |
| `GET` | `/reservas/:id` | Reserva por ID |
| `GET` | `/reservas/guest/:guestId` | Reservas de un huésped |
| `GET` | `/reservas/host/:hostId` | Reservas recibidas por un host |
| `GET` | `/reservas/buscar?q=` | Buscar reservas |
| `POST` | `/reservas` | Crear reserva |
| `PUT` | `/reservas/:id` | Actualizar reserva (ej. cambiar estado) |
| `DELETE` | `/reservas/:id` | Eliminar reserva |

---

## 🗃️ Modelo de Datos

```
users ──< personas ──< hosts ──< casas ──< casa_imagenes
                  └──────────────────< reservas >──────┘
```

| Tabla | Descripción |
|-------|-------------|
| `users` | Credenciales de acceso (email + password_hash) |
| `personas` | Perfil personal vinculado a un user (1:1) |
| `hosts` | Perfil de anfitrión vinculado a una persona (1:1) |
| `casas` | Propiedades publicadas por un host |
| `casa_imagenes` | Imágenes de Cloudinary asociadas a una casa |
| `reservas` | Reservas entre una casa y un guest (persona) |

---

## 🔍 Búsqueda Semántica con Pinecone

Cuando se crea o actualiza una casa, el backend:

1. Construye un texto descriptivo con nombre, descripción, dirección, precio y disponibilidad.
2. Genera un embedding vectorial usando **OpenAI** (`text-embedding-3-small`).
3. Hace upsert del vector en el índice `casas` de **Pinecone**.

Esto permite al chatbot del frontend realizar búsquedas semánticas (ej. *"casas baratas cerca del mar"*) con resultados relevantes.

Para sincronizar manualmente todas las casas existentes:

```
POST /casas/sincronizar-pinecone
```

---

## 🖼️ Gestión de Imágenes

Las imágenes se suben en **memoria** (sin disco) usando Multer y se almacenan directamente en **Cloudinary** bajo la carpeta `vibes/casas/:casaId`. Se guarda el `public_id` de Cloudinary en la base de datos para poder eliminarlas correctamente.

- Tamaño máximo: **5MB** por imagen
- Solo se aceptan archivos `image/*`
- La primera imagen subida se marca automáticamente como **principal**

---

