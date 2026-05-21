# 🌿 Eco Fruver — Documentación Técnica del Proyecto

> Sistema de facturación, gestión de crédito y cartera para una verdulería de barrio.
> Desarrollado como proyecto de Seminario — Universidad del Magdalena.

---

## 📋 Tabla de Contenidos

- [[#Descripción General]]
- [[#Tecnologías Utilizadas]]
- [[#Arquitectura del Sistema]]
- [[#Estructura de Carpetas]]
- [[#Base de Datos]]
  - [[#Tablas]]
  - [[#Triggers y Funciones Automatizadas]]
  - [[#Datos Semilla (Seed Data)]]
- [[#Backend]]
  - [[#server.js]]
  - [[#app.js]]
  - [[#config/db.js]]
  - [[#Modelos (models/)]]
  - [[#Controladores (controllers/)]]
  - [[#Rutas (routes/)]]
  - [[#Middleware (middleware/)]]
- [[#Frontend]]
  - [[#App.jsx]]
  - [[#Vistas (views/)]]
  - [[#Componentes (components/)]]
  - [[#Servicios (services/)]]
- [[#Roles y Permisos (RBAC)]]
- [[#Flujo de Autenticación]]
- [[#Docker]]
- [[#Cómo Levantar el Proyecto]]
- [[#Credenciales de Acceso por Defecto]]
- [[#Endpoints de la API]]

---

## 📌 Descripción General

**Eco Fruver** es un sistema web de punto de venta (POS) diseñado para gestionar las operaciones diarias de una verdulería. Permite registrar ventas, administrar clientes, controlar el crédito de los compradores frecuentes (cartera/fiado), y generar reportes internos.

El sistema implementa un esquema de roles (**Administrador** y **Cajero**) con permisos diferenciados, autenticación mediante **JWT**, y un motor de base de datos relacional (**PostgreSQL**) con lógica de negocio embebida en triggers.

---

## 🛠️ Tecnologías Utilizadas

### Backend
| Librería / Tecnología | Versión | Uso |
|---|---|---|
| Node.js | LTS | Entorno de ejecución |
| Express | ^4.19.2 | Framework de API REST |
| Sequelize | ^6.37.3 | ORM para PostgreSQL |
| PostgreSQL | 15 (Alpine) | Motor de base de datos |
| bcryptjs | ^2.4.3 | Hash de contraseñas |
| jsonwebtoken | ^9.0.2 | Autenticación JWT |
| dotenv | ^16.4.5 | Variables de entorno |
| cors | ^2.8.5 | Control de origen cruzado |
| nodemon | ^3.1.0 | Recarga automática en desarrollo |

### Frontend
| Librería / Tecnología | Versión | Uso |
|---|---|---|
| React | ^19.2.6 | Librería de UI |
| Vite | ^8.0.12 | Bundler y servidor de desarrollo |
| React Router DOM | ^7.15.1 | Enrutamiento del lado del cliente |
| Axios | ^1.16.1 | Cliente HTTP |
| Lucide React | ^1.16.0 | Iconos SVG |

### Infraestructura
| Tecnología | Uso |
|---|---|
| Docker + Docker Compose | Contenedor de la base de datos PostgreSQL |

---

## 🏗️ Arquitectura del Sistema

El proyecto sigue una arquitectura **cliente-servidor de 3 capas**:

```
┌─────────────────────────────────┐
│         FRONTEND (React)        │  Puerto: 5173 (Vite dev)
│   Views → Components → Services │
└────────────────┬────────────────┘
                 │  HTTP + JWT (Axios)
                 ▼
┌─────────────────────────────────┐
│       BACKEND (Node/Express)    │  Puerto: 5000
│  Routes → Middleware → Controllers → Models │
└────────────────┬────────────────┘
                 │  Sequelize ORM
                 ▼
┌─────────────────────────────────┐
│    BASE DE DATOS (PostgreSQL)   │  Puerto: 5432 (Docker)
│  Tablas + Triggers + Funciones  │
└─────────────────────────────────┘
```

---

## 📁 Estructura de Carpetas

```
Seminario proyecto/
├── 📄 docker-compose.yml          ← Orquestación del contenedor PostgreSQL
├── 📄 init-db.sql                 ← Script SQL de inicialización completa de la BD
├── 📄 .gitignore
│
├── 📂 backend/
│   ├── 📄 package.json
│   ├── 📄 .env                    ← Variables de entorno (no versionado)
│   └── 📂 src/
│       ├── 📄 server.js           ← Punto de entrada, conexión BD + inicio servidor
│       ├── 📄 app.js              ← Configuración Express, middlewares y rutas
│       ├── 📂 config/
│       │   └── 📄 db.js           ← Configuración Sequelize / Pool de conexiones
│       ├── 📂 models/
│       │   ├── 📄 index.js        ← Asociaciones entre modelos
│       │   ├── 📄 Role.js
│       │   ├── 📄 User.js
│       │   ├── 📄 Client.js
│       │   ├── 📄 Product.js
│       │   ├── 📄 Invoice.js
│       │   ├── 📄 InvoiceDetail.js
│       │   ├── 📄 Payment.js
│       │   └── 📄 Audit.js
│       ├── 📂 controllers/
│       │   ├── 📄 authController.js
│       │   ├── 📄 clientController.js
│       │   ├── 📄 invoiceController.js
│       │   ├── 📄 paymentController.js
│       │   ├── 📄 productController.js
│       │   └── 📄 reportController.js
│       ├── 📂 routes/
│       │   ├── 📄 authRoutes.js
│       │   ├── 📄 clientRoutes.js
│       │   ├── 📄 invoiceRoutes.js
│       │   ├── 📄 paymentRoutes.js
│       │   ├── 📄 productRoutes.js
│       │   └── 📄 reportRoutes.js
│       └── 📂 middleware/
│           └── 📄 authMiddleware.js
│
└── 📂 frontend/
    ├── 📄 package.json
    ├── 📄 index.html
    ├── 📄 vite.config.js
    └── 📂 src/
        ├── 📄 main.jsx            ← Punto de entrada React
        ├── 📄 App.jsx             ← Componente raíz + enrutador
        ├── 📄 App.css
        ├── 📄 index.css           ← Sistema de diseño global (variables CSS)
        ├── 📂 views/
        │   ├── 📄 Login.jsx
        │   ├── 📄 Dashboard.jsx
        │   ├── 📄 Clients.jsx
        │   ├── 📄 Products.jsx
        │   ├── 📄 Sales.jsx       ← Caja POS
        │   ├── 📄 Cartera.jsx     ← Gestión de crédito / cobros
        │   └── 📄 Reports.jsx
        ├── 📂 components/
        │   ├── 📄 Sidebar.jsx
        │   ├── 📄 Modal.jsx
        │   └── 📄 StatCard.jsx
        └── 📂 services/
            ├── 📄 api.js          ← Instancia Axios + interceptores JWT
            ├── 📄 authService.js
            ├── 📄 clientService.js
            ├── 📄 invoiceService.js
            ├── 📄 paymentService.js
            ├── 📄 productService.js
            └── 📄 reportService.js
```

---

## 🗄️ Base de Datos

La base de datos se llama `facturacion_barrio` y corre en **PostgreSQL 15** dentro de un contenedor Docker. Su estructura completa está definida en `init-db.sql` y se inicializa automáticamente al levantar el contenedor por primera vez.

### Tablas

#### `ROLES`
Define los perfiles de acceso del sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `id_rol` | SERIAL PK | Identificador único del rol |
| `nombre_rol` | VARCHAR(50) UNIQUE | `'Administrador'` o `'Cajero'` |
| `descripcion` | TEXT | Descripción del rol |

---

#### `USUARIOS`
Almacena los usuarios del sistema con contraseña hasheada.

| Campo | Tipo | Descripción |
|---|---|---|
| `id_usuario` | SERIAL PK | Identificador único |
| `nombre` | VARCHAR(100) | Nombre del usuario |
| `apellido` | VARCHAR(100) | Apellido del usuario |
| `username` | VARCHAR(50) UNIQUE | Nombre de usuario para login |
| `password_hash` | VARCHAR(255) | Contraseña cifrada con Bcrypt |
| `id_rol` | INT FK → ROLES | Rol asignado |
| `activo` | BOOLEAN | Estado del usuario (default: TRUE) |
| `fecha_creacion` | TIMESTAMP | Fecha y hora de creación |

---

#### `CLIENTES`
Gestiona los clientes con soporte para crédito (cartera/fiado).

| Campo | Tipo | Descripción |
|---|---|---|
| `id_cliente` | SERIAL PK | Identificador único |
| `nombre` | VARCHAR(100) | Nombre del cliente |
| `apellido` | VARCHAR(100) | Apellido del cliente |
| `identificacion` | VARCHAR(20) UNIQUE | Número de documento (CC/NIT/CE) |
| `tipo_identificacion` | VARCHAR(10) | `'CC'`, `'NIT'` o `'CE'` |
| `telefono` | VARCHAR(20) | Teléfono de contacto |
| `email` | VARCHAR(150) | Correo electrónico |
| `direccion` | TEXT | Dirección del cliente |
| `limite_credito` | DECIMAL(12,2) | Cupo máximo prestable |
| `credito_utilizado` | DECIMAL(12,2) | Deuda actual del cliente |
| `fecha_registro` | DATE | Fecha de registro |
| `activo` | BOOLEAN | Estado del cliente |

---

#### `PRODUCTOS`
Catálogo de productos con soporte para distintas unidades de medida.

| Campo | Tipo | Descripción |
|---|---|---|
| `id_producto` | SERIAL PK | Identificador único |
| `descripcion` | TEXT | Nombre/descripción del producto |
| `precio_unitario` | DECIMAL(12,2) | Precio vigente por unidad base |
| `unidad_medida` | VARCHAR(10) | `'KG'`, `'UNIDAD'` o `'GRAMO'` |
| `activo` | BOOLEAN | Estado del producto |
| `fecha_actualizacion` | TIMESTAMP | Última actualización de precio |

---

#### `FACTURAS`
Cabecera de cada venta registrada en el sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `id_factura` | SERIAL PK | Identificador único |
| `numero_factura` | VARCHAR(20) UNIQUE | Consecutivo único (ej: `FAC-000001`) |
| `id_cliente` | INT FK → CLIENTES | Cliente que compró |
| `id_usuario` | INT FK → USUARIOS | Cajero/Admin que registró la venta |
| `fecha_emision` | TIMESTAMP | Fecha y hora de la venta |
| `tipo_pago` | VARCHAR(10) | `'Contado'` o `'Credito'` |
| `subtotal` | DECIMAL(12,2) | Suma de líneas de productos |
| `impuesto` | DECIMAL(12,2) | Impuesto aplicado (actualmente 0%) |
| `total` | DECIMAL(12,2) | Total final de la factura |
| `saldo_pendiente` | DECIMAL(12,2) | Saldo que queda por pagar |
| `estado` | VARCHAR(20) | `'Pendiente'`, `'Parcialmente_Pagada'` o `'Pagada'` |

---

#### `DETALLE_FACTURA`
Líneas de productos de cada factura. Se elimina en cascada si se borra la factura.

| Campo | Tipo | Descripción |
|---|---|---|
| `id_detalle` | SERIAL PK | Identificador único |
| `id_factura` | INT FK → FACTURAS | Factura a la que pertenece |
| `id_producto` | INT FK → PRODUCTOS | Producto vendido |
| `cantidad` | DECIMAL(10,3) | Cantidad (admite decimales para KG, ej: 0.455) |
| `precio_unitario_venta` | DECIMAL(12,2) | Snapshot del precio al momento de la venta |
| `subtotal_linea` | DECIMAL(12,2) | `cantidad × precio_unitario_venta` |

---

#### `PAGOS`
Registro de abonos y pagos a facturas de crédito.

| Campo | Tipo | Descripción |
|---|---|---|
| `id_pago` | SERIAL PK | Identificador único |
| `id_factura` | INT FK → FACTURAS | Factura que se está abonando |
| `id_usuario` | INT FK → USUARIOS | Usuario que recibió el pago |
| `fecha_pago` | TIMESTAMP | Fecha y hora del abono |
| `monto` | DECIMAL(12,2) | Valor del abono |
| `saldo_anterior` | DECIMAL(12,2) | Saldo de la factura antes del abono |
| `saldo_posterior` | DECIMAL(12,2) | Saldo de la factura después del abono |
| `observacion` | TEXT | Nota opcional |

---

#### `AUDITORIA`
Pista de auditoría interna e inmutable. Se llena automáticamente por triggers de PostgreSQL y por el backend.

| Campo | Tipo | Descripción |
|---|---|---|
| `id_auditoria` | SERIAL PK | Identificador único |
| `id_usuario` | INT FK → USUARIOS | Usuario que realizó la acción |
| `fecha_hora` | TIMESTAMP | Marca de tiempo exacta |
| `accion` | VARCHAR(100) | `'INSERT'`, `'UPDATE'`, `'LOGIN'`, `'LOGOUT'` |
| `tabla_afectada` | VARCHAR(100) | Nombre de la tabla afectada |
| `descripcion` | TEXT | Descripción detallada del evento |

---

### Triggers y Funciones Automatizadas

#### `tg_registrar_auditoria()` / Trigger `trg_auditoria_facturas`
Se dispara automáticamente **después de cada INSERT o UPDATE en la tabla `FACTURAS`**. Registra el evento en `AUDITORIA` de forma inmutable sin intervención del backend.

#### `tg_actualizar_cartera_cliente()` / Triggers `trg_factura_a_credito` y `trg_abono_cartera`
Mantiene sincronizado el campo `credito_utilizado` de la tabla `CLIENTES`:
- Al crear una factura a **Crédito** → suma el total al `credito_utilizado` del cliente.
- Al registrar un **Pago** → resta el monto del `credito_utilizado` del cliente.

---

### Datos Semilla (Seed Data)

Al inicializar la base de datos se insertan automáticamente:

**Roles:**
| id_rol | nombre_rol | Descripción |
|---|---|---|
| 1 | Administrador | Control total del sistema |
| 2 | Cajero | Registro de ventas y cobros |

**Usuarios:**
| username | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | Administrador |
| `cajero` | `cajero123` | Cajero |

**Clientes de ejemplo:** Cliente General, Juan Pérez, María Gómez, Verdulería El Triunfo.

**Productos de ejemplo:** Tomate Chonto, Cebolla Cabezona, Manzana Verde, Papa Pastusa, Limón Tahití, Plátano Verde, Zanahoria Fresca, Aguacate Hass.

---

## ⚙️ Backend

El backend es una **API REST** construida con **Node.js + Express**, siguiendo el patrón **MVC** (Modelo - Vista - Controlador).

### `server.js`
Punto de entrada de la aplicación. Su responsabilidad es:
1. Autenticar la conexión con PostgreSQL usando `sequelize.authenticate()`.
2. Iniciar el servidor Express en el puerto definido por la variable de entorno `PORT` (por defecto **5000**).

> **Nota:** No se llama a `sequelize.sync()` porque las tablas, triggers y datos semilla ya fueron creados de forma exacta por `init-db.sql` al levantar Docker.

---

### `app.js`
Configura la aplicación Express:
- Activa **CORS** para permitir peticiones del frontend.
- Habilita el parseo de cuerpos **JSON**.
- Registra el endpoint de salud: `GET /api/health`.
- Monta todos los enrutadores bajo el prefijo `/api/`.
- Incluye manejadores globales para errores 500 y rutas 404.

---

### `config/db.js`
Crea y exporta la instancia de **Sequelize** configurada con:
- Las credenciales leídas desde variables de entorno (`.env`).
- `logging: false` para mantener la consola limpia.
- `freezeTableName: true` para evitar que Sequelize pluralice los nombres de tablas.
- Un **pool de conexiones** con máximo 10 conexiones activas.

---

### Modelos (`models/`)

Cada archivo define un modelo Sequelize que mapea a una tabla de la base de datos.

| Archivo | Modelo | Tabla en BD |
|---|---|---|
| `Role.js` | `Role` | `roles` |
| `User.js` | `User` | `usuarios` |
| `Client.js` | `Client` | `clientes` |
| `Product.js` | `Product` | `productos` |
| `Invoice.js` | `Invoice` | `facturas` |
| `InvoiceDetail.js` | `InvoiceDetail` | `detalle_factura` |
| `Payment.js` | `Payment` | `pagos` |
| `Audit.js` | `Audit` | `auditoria` |

#### `models/index.js` — Asociaciones entre Modelos

Define todas las relaciones del ORM:

```
Role      ──── hasMany ────▶ User
User      ──── hasMany ────▶ Invoice
User      ──── hasMany ────▶ Payment
User      ──── hasMany ────▶ Audit
Client    ──── hasMany ────▶ Invoice
Invoice   ──── hasMany ────▶ InvoiceDetail (CASCADE DELETE)
Invoice   ──── hasMany ────▶ Payment
Product   ──── hasMany ────▶ InvoiceDetail
```

---

### Controladores (`controllers/`)

#### `authController.js`
| Función exportada | Descripción |
|---|---|
| `login` | Verifica credenciales con Bcrypt, genera token JWT de 24h y registra el evento en `AUDITORIA`. |
| `logout` | Registra el cierre de sesión en `AUDITORIA` (la invalidación real del token ocurre en el cliente). |
| `getProfile` | Devuelve los datos del usuario autenticado desde `req.user`. |
| `registerUser` | Crea un nuevo usuario hasheando su contraseña. **Solo para Administrador.** |
| `listUsers` | Lista todos los usuarios con su rol asociado. **Solo para Administrador.** |

#### `invoiceController.js`
| Función exportada | Descripción |
|---|---|
| `createInvoice` | Registra una nueva venta usando una **transacción SQL atómica**. Valida cliente activo, productos activos, cupo de crédito disponible y mora extrema (+30 días). Genera el consecutivo `FAC-XXXXXX`. |
| `getInvoices` | Consulta el listado de facturas con filtros por `tipo_pago`, `estado` y búsqueda por `numero_factura`. |
| `getInvoiceById` | Retorna una factura específica con sus detalles y productos anidados. |

#### `clientController.js`
| Función exportada | Descripción |
|---|---|
| `createClient` | Registra un nuevo cliente en el sistema. |
| `getClients` | Lista todos los clientes con soporte para búsqueda por nombre o identificación. |
| `getClientById` | Obtiene un cliente específico. |
| `updateClient` | Actualiza datos de un cliente (nombre, teléfono, límite de crédito, etc.). |
| `getClientHistory` | Retorna el historial de facturas y pagos de un cliente. |

#### `productController.js`
| Función exportada | Descripción |
|---|---|
| `getProducts` | Lista el catálogo de productos activos. |
| `getProductById` | Obtiene un producto específico. |
| `createProduct` | Crea un nuevo producto. **Solo Administrador.** |
| `updateProduct` | Actualiza un producto (precio, descripción, estado). **Solo Administrador.** |

#### `paymentController.js`
| Función exportada | Descripción |
|---|---|
| `registerPayment` | Registra un abono a una factura de crédito. Actualiza `saldo_pendiente` y `estado` de la factura. El trigger `trg_abono_cartera` ajusta automáticamente el `credito_utilizado` del cliente. |
| `getPendingInvoicesByClient` | Retorna las facturas de crédito pendientes de un cliente específico. |
| `getPaymentHistory` | Retorna el historial completo de pagos con filtro opcional por cliente. |

#### `reportController.js`
| Función exportada | Descripción |
|---|---|
| `getSalesReport` | Genera un reporte de ventas y recaudos por rango de fechas. **Solo Administrador.** |
| `getAuditLogs` | Retorna el log de auditoría completo. **Solo Administrador.** |
| `getDebtorsReport` | Lista clientes en mora (con deuda pendiente). Accesible también para Cajero. |

---

### Rutas (`routes/`)

Todos los endpoints requieren autenticación JWT (`auth`) salvo el login.

| Método | Ruta | Controlador | Roles |
|---|---|---|---|
| POST | `/api/auth/login` | `authController.login` | Público |
| POST | `/api/auth/logout` | `authController.logout` | Autenticado |
| GET | `/api/auth/profile` | `authController.getProfile` | Autenticado |
| POST | `/api/auth/register` | `authController.registerUser` | Administrador |
| GET | `/api/auth/users` | `authController.listUsers` | Administrador |
| GET | `/api/clients` | `clientController.getClients` | Admin, Cajero |
| POST | `/api/clients` | `clientController.createClient` | Admin, Cajero |
| GET | `/api/clients/:id` | `clientController.getClientById` | Admin, Cajero |
| PUT | `/api/clients/:id` | `clientController.updateClient` | Admin, Cajero |
| GET | `/api/clients/:id/history` | `clientController.getClientHistory` | Admin, Cajero |
| GET | `/api/products` | `productController.getProducts` | Admin, Cajero |
| GET | `/api/products/:id` | `productController.getProductById` | Admin, Cajero |
| POST | `/api/products` | `productController.createProduct` | Administrador |
| PUT | `/api/products/:id` | `productController.updateProduct` | Administrador |
| GET | `/api/invoices` | `invoiceController.getInvoices` | Admin, Cajero |
| POST | `/api/invoices` | `invoiceController.createInvoice` | Admin, Cajero |
| GET | `/api/invoices/:id` | `invoiceController.getInvoiceById` | Admin, Cajero |
| POST | `/api/payments` | `paymentController.registerPayment` | Admin, Cajero |
| GET | `/api/payments/client/:clientId` | `paymentController.getPendingInvoicesByClient` | Admin, Cajero |
| GET | `/api/payments/history` | `paymentController.getPaymentHistory` | Admin, Cajero |
| GET | `/api/reports/sales` | `reportController.getSalesReport` | Administrador |
| GET | `/api/reports/audit` | `reportController.getAuditLogs` | Administrador |
| GET | `/api/reports/debtors` | `reportController.getDebtorsReport` | Admin, Cajero |
| GET | `/api/health` | _(inline)_ | Público |

---

### Middleware (`middleware/`)

#### `authMiddleware.js`

Exporta dos funciones:

- **`auth`**: Extrae el token `Bearer` del header `Authorization`, lo verifica con `jwt.verify()` y busca el usuario activo en la base de datos. Si todo es válido, adjunta el usuario a `req.user` y llama a `next()`.

- **`authorize(...rolesPermitidos)`**: Función de orden superior que retorna un middleware de autorización. Compara `req.user.rol.nombre_rol` contra la lista de roles permitidos. Implementa **RBAC** (Control de Acceso Basado en Roles).

---

## 🖥️ Frontend

Aplicación de página única (SPA) construida con **React 19** y **Vite**.

### `App.jsx`
Componente raíz que gestiona:
- El estado global de sesión (`user`) leyendo `localStorage` (`eco_fruver_user`).
- El tema visual (`theme`) claro/oscuro, persistido en `localStorage` (`eco_fruver_theme`).
- El enrutador principal con `BrowserRouter`. Si no hay usuario autenticado, redirige todo tráfico a `/login`.

**Rutas definidas:**

| Ruta | Componente | Descripción |
|---|---|---|
| `/login` | `Login` | Pantalla de inicio de sesión |
| `/` | `Dashboard` | Panel principal con estadísticas |
| `/clients` | `Clients` | Gestión de clientes |
| `/products` | `Products` | Catálogo de productos |
| `/sales` | `Sales` | Caja POS (registro de ventas) |
| `/cartera` | `Cartera` | Gestión de crédito y cobros |
| `/reports` | `Reports` | Reportes del sistema |

---

### Vistas (`views/`)

#### `Login.jsx`
Formulario de autenticación. Llama a `authService.login()` y al recibir respuesta exitosa guarda el token y los datos de usuario en `localStorage`, luego actualiza el estado global en `App.jsx`.

#### `Dashboard.jsx`
Panel principal del sistema. Muestra estadísticas generales (ventas del día, clientes con deuda, facturas pendientes) usando el componente `StatCard`.

#### `Clients.jsx`
Vista completa de gestión de clientes:
- Listado con búsqueda en tiempo real.
- Formulario para crear y editar clientes (dentro de un `Modal`).
- Visualización del historial de compras y pagos de cada cliente.
- Gestión del límite de crédito.

#### `Products.jsx`
Catálogo de productos:
- Listado con búsqueda.
- Formulario para crear y editar productos (visible solo para Administrador).
- Control de unidad de medida (`KG`, `UNIDAD`).

#### `Sales.jsx`
Módulo de Caja POS:
- Búsqueda de clientes para asignar a la venta.
- Selección de productos del catálogo con cantidades.
- Selección del tipo de pago (`Contado` o `Crédito`).
- Envío de la venta al backend para su registro.

#### `Cartera.jsx`
Gestión de crédito y cobros:
- Lista de facturas pendientes por cliente.
- Registro de abonos parciales o pagos totales.
- Visualización del cupo de crédito disponible.

#### `Reports.jsx`
Módulo de reportes (solo Administrador):
- Reporte de ventas por rango de fechas.
- Reporte de clientes en mora.
- Log de auditoría interna.

---

### Componentes (`components/`)

#### `Sidebar.jsx`
Barra de navegación lateral persistente. Contiene:
- Logo e identidad de marca **Eco Fruver** (con ícono `Apple` de Lucide React).
- Menú de navegación con `NavLink` (resalta la ruta activa).
- Enlace a **Productos** visible solo para usuarios con rol **Administrador**.
- Botón de toggle de tema **Claro/Oscuro** (íconos `Sun` y `Moon`).
- Tarjeta del usuario conectado con su nombre, rol y botón de **Cerrar Sesión**.

#### `Modal.jsx`
Componente reutilizable para mostrar formularios en ventanas emergentes (overlay).

#### `StatCard.jsx`
Tarjeta de estadística para el `Dashboard`. Recibe props de título, valor e ícono.

---

### Servicios (`services/`)

#### `api.js`
Crea una instancia de **Axios** con la `baseURL` apuntando a `http://localhost:5000/api`. Implementa dos interceptores:
- **Interceptor de peticiones:** Inyecta automáticamente el token JWT desde `localStorage` en el header `Authorization: Bearer <token>`.
- **Interceptor de respuestas:** Si el servidor responde con **401 (No autorizado)**, limpia el `localStorage` y redirige al usuario a `/login` de forma automática.

#### `authService.js`
Funciones: `login(username, password)`, `logout()`.

#### `clientService.js`
Funciones: `getClients()`, `getClientById(id)`, `createClient(data)`, `updateClient(id, data)`, `getClientHistory(id)`.

#### `invoiceService.js`
Funciones: `createInvoice(data)`, `getInvoices(filters)`, `getInvoiceById(id)`.

#### `paymentService.js`
Funciones: `registerPayment(data)`, `getPendingInvoicesByClient(clientId)`.

#### `productService.js`
Funciones: `getProducts()`, `createProduct(data)`, `updateProduct(id, data)`.

#### `reportService.js`
Funciones: `getSalesReport(params)`, `getAuditLogs()`, `getDebtorsReport()`.

---

## 🔐 Roles y Permisos (RBAC)

| Funcionalidad | Administrador | Cajero |
|---|:---:|:---:|
| Iniciar / Cerrar sesión | ✅ | ✅ |
| Ver Dashboard | ✅ | ✅ |
| Registrar venta (POS) | ✅ | ✅ |
| Gestionar clientes (CRUD) | ✅ | ✅ |
| Ver historial de clientes | ✅ | ✅ |
| Ver catálogo de productos | ✅ | ✅ |
| Crear / editar productos | ✅ | ❌ |
| Ver facturas | ✅ | ✅ |
| Registrar pagos / abonos | ✅ | ✅ |
| Ver clientes en mora | ✅ | ✅ |
| Gestionar usuarios | ✅ | ❌ |
| Ver reporte de ventas | ✅ | ❌ |
| Ver log de auditoría | ✅ | ❌ |

---

## 🔑 Flujo de Autenticación

```
1. Usuario ingresa username + password en Login.jsx
        ↓
2. authService.login() → POST /api/auth/login
        ↓
3. authController.login() valida credenciales con bcrypt
        ↓
4. Genera JWT (payload: id_usuario, username, role) con expiración de 24h
        ↓
5. Registra evento "LOGIN" en tabla AUDITORIA
        ↓
6. Frontend guarda token en localStorage ("eco_fruver_token")
   y datos de usuario en localStorage ("eco_fruver_user")
        ↓
7. api.js inyecta el token en todas las peticiones siguientes
        ↓
8. authMiddleware.auth() verifica el token en cada endpoint protegido
        ↓
9. authMiddleware.authorize() verifica el rol para endpoints restringidos
```

---

## 🐳 Docker

El archivo `docker-compose.yml` levanta el contenedor de PostgreSQL:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: eco_fruver_db
    restart: always
    environment:
      POSTGRES_DB: facturacion_barrio
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: adminpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
```

El script `init-db.sql` se monta en `docker-entrypoint-initdb.d/` para que PostgreSQL lo ejecute automáticamente la primera vez que se crea el volumen.

---

## 🚀 Cómo Levantar el Proyecto

### Requisitos previos
- **Docker Desktop** instalado y corriendo
- **Node.js** (versión LTS recomendada)
- **npm**

### Paso 1 — Levantar la Base de Datos

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Esto descarga la imagen de PostgreSQL 15, crea la base de datos `facturacion_barrio`, ejecuta `init-db.sql` (tablas, triggers, datos semilla) y levanta el servicio en el puerto **5432**.

### Paso 2 — Configurar y Levantar el Backend

El archivo `backend/.env` debe contener:

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

El servidor queda disponible en `http://localhost:5000`.

### Paso 3 — Levantar el Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

---

## 🔑 Credenciales de Acceso por Defecto

| Rol | Username | Contraseña |
|---|---|---|
| Administrador | `admin` | `admin123` |
| Cajero | `cajero` | `cajero123` |

> ⚠️ **Cambiar las contraseñas en producción.**

---

## 🌐 Endpoints de la API

**URL Base:** `http://localhost:5000/api`

### Salud
```
GET /health
```

### Autenticación (`/auth`)
```
POST   /auth/login        → Iniciar sesión (público)
POST   /auth/logout       → Cerrar sesión
GET    /auth/profile      → Perfil del usuario actual
POST   /auth/register     → Crear usuario [Admin]
GET    /auth/users        → Listar usuarios [Admin]
```

### Clientes (`/clients`)
```
GET    /clients           → Listar clientes
POST   /clients           → Crear cliente
GET    /clients/:id       → Ver cliente
PUT    /clients/:id       → Editar cliente
GET    /clients/:id/history → Historial del cliente
```

### Productos (`/products`)
```
GET    /products          → Listar productos
GET    /products/:id      → Ver producto
POST   /products          → Crear producto [Admin]
PUT    /products/:id      → Editar producto [Admin]
```

### Facturas (`/invoices`)
```
GET    /invoices          → Listar facturas
POST   /invoices          → Registrar venta
GET    /invoices/:id      → Ver factura con detalles
```

### Pagos (`/payments`)
```
POST   /payments                    → Registrar abono
GET    /payments/client/:clientId   → Facturas pendientes de un cliente
GET    /payments/history            → Historial de pagos
```

### Reportes (`/reports`)
```
GET    /reports/sales     → Reporte de ventas [Admin]
GET    /reports/audit     → Log de auditoría [Admin]
GET    /reports/debtors   → Clientes en mora
```

---

*Documentación generada el 21 de mayo de 2026 — Proyecto Seminario, Universidad del Magdalena.*