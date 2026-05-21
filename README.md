<div align="center">

# 🌿 Eco Fruver
### Sistema de Facturación y Gestión de Crédito

[![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

*Proyecto de Seminario — Universidad del Magdalena*

</div>

---

## 📖 Descripción

**Eco Fruver** es un sistema web de punto de venta (POS) diseñado para gestionar las operaciones diarias de una verdulería de barrio. Permite registrar ventas en efectivo o a crédito, administrar el catálogo de productos, gestionar clientes y su cartera de deudas, y generar reportes internos con pista de auditoría completa.

### ✨ Características principales

- 🛒 **Caja POS** — Registro de ventas contado o crédito (fiado)
- 👥 **Gestión de clientes** — Con soporte para límite de crédito y cartera
- 📦 **Catálogo de productos** — Con unidades de medida (KG, UNIDAD, GRAMO)
- 💰 **Control de cartera** — Abonos parciales y seguimiento de deudas
- 📊 **Reportes** — Ventas, clientes en mora y log de auditoría
- 🔐 **Seguridad** — Autenticación JWT + RBAC (Administrador / Cajero)
- 📝 **Auditoría inmutable** — Triggers de PostgreSQL registran cada operación crítica

---

## 🏗️ Arquitectura

```
┌─────────────────────────┐
│    Frontend (React)     │  :5173
│  Vite · React Router   │
│  Axios · Lucide Icons   │
└──────────┬──────────────┘
           │  REST API + JWT
           ▼
┌─────────────────────────┐
│  Backend (Node/Express) │  :5000
│  Sequelize ORM · bcrypt │
│  jsonwebtoken · dotenv  │
└──────────┬──────────────┘
           │  Sequelize
           ▼
┌─────────────────────────┐
│  PostgreSQL 15 (Docker) │  :5432
│  Triggers · Funciones   │
│  BD: facturacion_barrio │
└─────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 19, Vite 8, React Router DOM 7, Axios, Lucide React |
| **Backend** | Node.js, Express 4, Sequelize 6, bcryptjs, jsonwebtoken |
| **Base de Datos** | PostgreSQL 15 (Alpine via Docker) |
| **Infraestructura** | Docker Compose |

---

## 📁 Estructura del Proyecto

```
Seminario proyecto/
├── docker-compose.yml         # Contenedor PostgreSQL
├── init-db.sql                # Esquema completo de BD + seed data
├── backend/
│   ├── package.json
│   ├── .env                   # Variables de entorno (no versionado)
│   └── src/
│       ├── server.js          # Punto de entrada
│       ├── app.js             # Express + rutas
│       ├── config/db.js       # Sequelize / Pool
│       ├── models/            # Role, User, Client, Product, Invoice...
│       ├── controllers/       # authController, invoiceController...
│       ├── routes/            # authRoutes, clientRoutes...
│       └── middleware/        # authMiddleware (JWT + RBAC)
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx            # Router principal + gestión de sesión
        ├── views/             # Login, Dashboard, Clients, Products...
        ├── components/        # Sidebar, Modal, StatCard
        └── services/          # api.js (Axios), authService, clientService...
```

---

## 🚀 Puesta en Marcha

### Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución
- [Node.js](https://nodejs.org/) versión LTS

### 1. Clonar el repositorio

```bash
git clone https://github.com/meikell007/Sistema-facturacion-verduleria.git
cd Sistema-facturacion-verduleria
```

### 2. Levantar la base de datos

```bash
docker-compose up -d
```

Esto levanta PostgreSQL en el puerto **5432**, crea la base de datos `facturacion_barrio` y ejecuta automáticamente `init-db.sql` (tablas, triggers y datos de prueba).

### 3. Configurar y levantar el Backend

Crea el archivo `backend/.env` con el siguiente contenido:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=facturacion_barrio
DB_USER=admin
DB_PASS=adminpassword
JWT_SECRET=eco_fruver_secret_key_2026_unimagdalena
JWT_EXPIRES_IN=24h
PORT=5000
```

```bash
cd backend
npm install
npm run dev
```

El servidor API queda disponible en **http://localhost:5000**

### 4. Levantar el Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en **http://localhost:5173**

---

## 🔑 Credenciales de Acceso

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `admin123` |
| Cajero | `cajero` | `cajero123` |

> ⚠️ Cambiar las contraseñas antes de cualquier despliegue en producción.

---

## 🌐 Endpoints Principales de la API

**URL Base:** `http://localhost:5000/api`

| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| GET | `/health` | Estado del servidor | Público |
| POST | `/auth/login` | Iniciar sesión | Público |
| POST | `/auth/register` | Crear usuario | Admin |
| GET | `/clients` | Listar clientes | Admin, Cajero |
| POST | `/clients` | Crear cliente | Admin, Cajero |
| GET | `/products` | Listar productos | Admin, Cajero |
| POST | `/products` | Crear producto | Admin |
| POST | `/invoices` | Registrar venta | Admin, Cajero |
| GET | `/invoices` | Listar facturas | Admin, Cajero |
| POST | `/payments` | Registrar abono | Admin, Cajero |
| GET | `/reports/sales` | Reporte de ventas | Admin |
| GET | `/reports/debtors` | Clientes en mora | Admin, Cajero |
| GET | `/reports/audit` | Log de auditoría | Admin |

---

## 🔐 Sistema de Roles (RBAC)

| Módulo | Administrador | Cajero |
|---|:---:|:---:|
| Dashboard y estadísticas | ✅ | ✅ |
| Caja POS (ventas) | ✅ | ✅ |
| Gestión de clientes | ✅ | ✅ |
| Ver catálogo de productos | ✅ | ✅ |
| Crear / editar productos | ✅ | ❌ |
| Registrar cobros / abonos | ✅ | ✅ |
| Ver clientes en mora | ✅ | ✅ |
| Gestionar usuarios del sistema | ✅ | ❌ |
| Reportes de ventas | ✅ | ❌ |
| Log de auditoría | ✅ | ❌ |

---

## 🗄️ Modelo de Base de Datos

```
ROLES ──────────── USUARIOS
                      │
          ┌───────────┼───────────┐
          │           │           │
       FACTURAS    PAGOS      AUDITORIA
          │
    ┌─────┴──────┐
    │            │
DETALLE_FACTURA PAGOS
    │
PRODUCTOS

CLIENTES ──── FACTURAS
```

**Triggers automáticos de PostgreSQL:**
- `trg_auditoria_facturas` → Registra cada INSERT/UPDATE en FACTURAS
- `trg_factura_a_credito` → Suma la deuda al cliente al crear factura a crédito
- `trg_abono_cartera` → Descuenta la deuda del cliente al registrar un pago

---

## 📄 Documentación Completa

Consulta el archivo [`documentacion.md`](./documentacion.md) para la documentación técnica detallada del proyecto, compatible con [Obsidian](https://obsidian.md/).

---

## 👤 Autor

Desarrollado como proyecto de Seminario en la **Universidad del Magdalena**.

---

<div align="center">

*Hecho con 💚 para Eco Fruver*

</div>
