1. Información General del DocumentoProyecto: Sistema de Gestión de Facturas y Cartera en Negocios de Barrio (Ej: Verdulerías).  Institución: Universidad del Magdalena.  Facultad: Facultad de Ingeniería.  Programa: Ingeniería de Sistemas.  Curso: Seminario III - Grupo 1.  Autores: Wilmar Arias Uribe y Meikell Montoya Jiménez.  Docente: Luis del Cristo Garrido Barrios.  Fecha de Creación/Modificación: 4 de marzo de 2026.  2. Introducción y Alcance del SistemaEl presente documento consolida la especificación de requerimientos y el diseño técnico de una solución de software orientada a optimizar la gestión comercial de negocios minoristas independientes. A diferencia de los sistemas POS (Point of Sale) genéricos tradicionales, este software aborda dos problemáticas críticas y recurrentes de la economía de barrio:  Venta Fraccionada y Pesaje (Gramaje): La venta de mercancías perecederas cuyo valor de línea de factura no se calcula por unidades enteras, sino por su peso exacto (gramos).Gestión de Cartera Informal ("Fiados"): El control riguroso de créditos de confianza otorgados a clientes recurrentes, estableciendo límites máximos de endeudamiento y bloqueos automáticos en caso de morosidad extrema.  El sistema delimita estrictamente sus responsabilidades operativas internas mediante roles (Administrador y Cajero) , manteniendo una frontera clara con procesos externos correspondientes a los hábitos del consumidor final.  3. Arquitectura del Sistema y Patrón de DiseñoPara maximizar la mantenibilidad, escalabilidad y velocidad de transferencia de datos, se descarta el uso de una arquitectura monolítica con renderizado en el servidor (MVC tradicional). En su lugar, se adopta un enfoque moderno basado en API RESTful y un entorno de desarrollo unificado en JavaScript.3.1. División ArquitectónicaFrontend (Capa de Presentación): Desarrollado en React y JavaScript. Se comporta como una aplicación de página única (SPA), ejecutándose completamente en el navegador del usuario cliente. Se comunica de forma asíncrona con el backend mediante peticiones HTTP estructuradas (fetch / Axios).Backend (Capa de Lógica de Negocio y Control): Desarrollado en Node.js empleando el framework Express. Actúa como el proveedor de servicios API, procesando solicitudes, aplicando validaciones lógicas de negocio, gestionando la autenticación mediante tokens y exponiendo respuestas estrictamente en formato JSON.Capa de Persistencia (Base de Datos): Gestionada en PostgreSQL, un motor relacional que garantiza estricto cumplimiento ACID, vital para la precisión de transacciones financieras y cálculos monetarios exactos.3.2. Estrategia de Repositorio (Monorepo)Para agilizar la integración y el despliegue del proyecto, se implementa una estructura de Monorepo. Esto permite centralizar el código en una única raíz del proyecto estructurada de la siguiente manera:Plaintext/sistema-facturacion-barrio
│
├── /backend
│   ├── /src
│   │   ├── /controllers  # Controladores de la API (Lógica de control)
│   │   ├── /models       # Modelos e interfaces de acceso a datos (Sequelize/Prisma)
│   │   ├── /routes       # Enrutadores de endpoints (Rutas expuestas)
│   │   └── /middleware   # Filtros de seguridad (Validación de Roles y JWT)
│   └── package.json
│
├── /frontend
│   ├── /src
│   │   ├── /components   # Componentes reutilizables de UI
│   │   ├── /views        # Vistas de la aplicación (Login, Ventas, Cartera)
│   │   └── /services     # Módulos de conexión con la API de Backend
│   └── package.json
│
└── README.md
4. Arquitectura de Procesos de Negocio (BPMN)El flujo operacional del sistema se organiza dentro del Pool principal denominado Gestión General del Sistema , segmentado jerárquicamente a través de carriles (lanes) de responsabilidades:  +--------------------------------------------------------------------------------------------------+
| GESTIÓN GENERAL DEL SISTEMA                                                                      |
+--------------------------------------------------------------------------------------------------+
| LANE: Administrador                                                                              |
|  [Inicio] -> [Inicio de Sesión] -> [Gestionar Clientes (Subproceso)] -> [Actualizar Info] -> [Fin]|
+--------------------------------------------------------------------------------------------------+
| LANE: Cajeros (y Administrador con permisos heredados)                                           |
|  [Inicio] -> [Inicio de Sesión] -> [Registrar Envío y Generar Factura] -> [Actualizar Info] -> [Fin]
|                                 -> [Registrar Cobro de Deuda] ---------> [Actualizar Info] -> [Fin]
+--------------------------------------------------------------------------------------------------+
4.1. Detalle del Subproceso: Gestionar ClientesPerteneciente en exclusividad al carril del Administrador. Su objetivo principal es asegurar la integridad del maestro de clientes del negocio.  Flujo Secuencial Interno:Evento de Inicio: Se dispara cuando el administrador accede al panel de control de clientes.  Registrar Cliente: Captura los datos demográficos y de identificación del nuevo cliente.  Consultar Historial de Cliente: Muestra de forma cronológica todas las transacciones históricas asociadas.  Confirmar Facturas: Valida la vigencia y el estado de los saldos que posee el cliente.  Actualizar Información: Impacta de forma directa el depósito central de datos (Clientes).  Evento de Fin: Cierre exitoso del ciclo de gestión.  4.2. Detalle del Subproceso: Registrar Envío y Generar FacturaEjecutado indistintamente por el Cajero o el Administrador. Es el núcleo transaccional diario del comercio.  Flujo Secuencial Interno:Evento de Inicio: Apertura de una nueva ventana de ventas en el terminal de punto de venta.  Seleccionar Cliente: Vincula obligatoriamente la venta a un cliente de la base de datos (o cliente general preconfigurado).  Agregar Productos y Cantidades: Permite la búsqueda e inserción manual de los artículos seleccionados. El sistema consulta en tiempo real el depósito de Productos y precios.  Calcular Total de la Factura: Computa subtotales, impuestos aplicables y consolida el valor final de cobro.  Definir Tipo de Pago: El operador selecciona de forma explícita si la transacción se liquida de Contado o se traslada a Crédito.  Generar Factura: Almacena de manera persistente los datos de la transacción en el depósito de Facturas.  Evento de Fin: Emisión del comprobante de venta y fin del proceso.  4.3. Detalle del Subproceso: Registrar Cobro de DeudaHabilitado para cajeros y administradores con el propósito de mitigar la morosidad y recibir abonos de los clientes.  Flujo Secuencial Interno:Evento de Inicio: Acceso al módulo de cartera y cuentas por cobrar.  Consultar Deudas Pendientes: Filtrado por identificación de cliente para aislar sus obligaciones financieras.  Mostrar Facturas en Estado Pendiente: El sistema despliega un listado visual de las facturas con saldos activos.  Registrar Tipo de Pago: El operador digita el valor recibido indicando si corresponde a un Abono Parcial o a la Cancelación Total de la deuda.  Actualizar Estado de Factura: Modifica de forma inmediata los registros del depósito de Facturas.  Evento de Fin: Generación del recibo de abono y cierre formal del proceso.  5. Matriz Completa de Requerimientos del Sistema5.1. Requerimientos Funcionales (RF)Seguridad y AccesoRF-01: El sistema debe permitir el inicio de sesión únicamente mediante la validación de credenciales (usuario y contraseña) almacenadas de forma cifrada.   RF-02: El sistema debe permitir la creación y administración de roles específicos, limitados exclusivamente a: Administrador y Cajero.   RF-03: El sistema debe restringir el acceso a las funcionalidades del software de acuerdo con los permisos asociados al rol del usuario activo (RBAC).   RF-04: El sistema debe garantizar un proceso de cierre de sesión seguro que invalide el token o sesión activa del usuario.   RF-AD-01: El sistema debe registrar en una pista de auditoría interna la fecha, hora y usuario que realiza cualquier movimiento crítico (INSERT, UPDATE, DELETE) en el sistema.   Administración de ClientesRF-05: El sistema debe permitir que el perfil Administrador y Cajero haga el registro de nuevos clientes, capturando nombre, identificación, tipo de identificación y datos de contacto.   RF-06: El sistema debe permitir la consulta de la información básica de cualquier cliente registrado mediante filtros de búsqueda específicos (NIT, Cédula de Ciudadanía o Nombre).   RF-07: El sistema debe permitir visualizar el historial completo de facturas (pagas y pendientes) asociadas a un cliente específico.   RF-08: El sistema debe permitir la actualización o modificación de los datos de contacto e identificación de los clientes existentes.   RF-09: El sistema debe garantizar la persistencia e integridad de la información en el depósito de datos central de clientes tras cada creación o edición.   RF-C-01: [INTEGRADO] El sistema debe permitir asignar un Límite de Crédito (Cupo Máximo) individualizado a cada cliente al momento de su registro o edición de perfil.Proceso de Facturación y VentasRF-10: El sistema debe permitir la selección de un cliente previamente registrado para iniciar el proceso de venta.   RF-10.1 (Regla de Negocio Crítica): El sistema debe verificar el estado de cuenta del cliente; si este presenta mora superior al límite establecido o si el monto de la venta actual supera su Límite de Crédito disponible, el sistema debe bloquear automáticamente la opción de realizar una nueva venta a crédito.   RF-11: El sistema debe permitir la adición de múltiples productos y la especificación de sus cantidades dentro de la misma factura.   RF-12: El sistema debe realizar la consulta automática del precio unitario vigente de cada producto seleccionado desde el depósito de datos.   RF-13: El sistema debe realizar el cálculo automático del valor total de la factura, incluyendo impuestos si aplicase.   RF-14: El sistema debe permitir definir si la modalidad de pago de la factura es de Contado o a Crédito.   RF-15: El sistema debe asignar un identificador único y consecutivo a cada factura generada para garantizar su control correlativo.   RF-16: El sistema debe almacenar el registro de la factura generada en el depósito de datos histórico de ventas.   RF-17: El sistema debe emitir y permitir la visualización de un comprobante de factura (físico o digital) para el cliente.   RF-V-01: [INTEGRADO] El sistema debe permitir la configuración de productos aptos para la venta fraccionada por peso (Gramaje) en el catálogo.RF-V-02: [INTEGRADO] Para productos vendidos por peso, el sistema debe permitir ingresar valores fraccionarios en la cantidad y calcular el subtotal multiplicando la cantidad de kilogramos por el precio unitario vigente. (Ejemplo: 500g equivalen a 0.500 unidades en cantidad).Control de Deudas y CarteraRF-18: El sistema debe permitir la consulta filtrada de todas las facturas que presenten saldos pendientes por cliente.   RF-19: El sistema debe mostrar visualmente el estado de cada factura, clasificándola de forma taxativa en: Pendiente, Parcialmente Pagada o Pagada.   RF-20: El sistema debe permitir el registro manual de pagos, aceptando tanto abonos parciales como la cancelación total de la deuda.   RF-21: El sistema debe realizar el recálculo automático del saldo pendiente del cliente inmediatamente después de registrar un abono.   RF-22: El sistema debe actualizar el estado de la factura de forma automática (ej. de "Pendiente" a "Pagada") según los pagos recibidos.   RF-23: El sistema debe mantener y permitir la consulta del historial de pagos realizados cronológicamente para cada factura, guardando snapshots de los saldos anteriores y posteriores.   Informes y ReportesRF-REP-01: El sistema debe permitir generar reportes de ventas y recaudos filtrando la información por rangos de fechas específicos (Fecha Inicio - Fecha Fin).   RF-REP-02: El sistema debe permitir la generación de un reporte de "Clientes en Mora", detallando montos adeudados y días de retraso acumulados.   Catálogo de ProductosRF-24: El sistema debe permitir el registro de productos en el catálogo, incluyendo descripción, unidad de medida y precio unitario de venta.   RF-25: El sistema debe permitir la actualización de precios de los productos, reflejando el cambio de forma inmediata en el módulo de ventas sin alterar las facturas históricas emitidas con anterioridad.   RF-26: El sistema debe permitir la consulta y generación de un listado de todos los productos disponibles en el inventario/depósito de datos.   5.2. Requerimientos No Funcionales (RNF)Rendimiento y ConcurrenciaRNF-01: El sistema debe garantizar la operatividad sin degradación con un volumen de hasta 50 usuarios concurrentes en el entorno local/red del negocio.   RNF-02: Las consultas a la base de datos (clientes/facturas) deben devolver resultados en un tiempo máximo de respuesta de 5 segundos.   RNF-03: El procesamiento lógico de cálculos de facturación debe completarse en menos de 2 segundos.   Seguridad y Protección de DatosRNF-04: El sistema debe implementar protocolos de autenticación segura y almacenamiento de claves mediante algoritmos de hash criptográficos unidireccionales de alto rendimiento (Bcrypt o Argon2).   RNF-05: Se debe garantizar el principio de privilegio mínimo mediante el control de acceso basado en roles (RBAC) gestionado a través de Middlewares en el backend.   RNF-06: Los datos en reposo (base de datos física) deben contar con mecanismos de protección contra accesos directos no autorizados mediante políticas de seguridad a nivel de motor.   Confiabilidad e IntegridadRNF-08: El sistema debe implementar restricciones de integridad a nivel de esquema de base de datos para evitar en absoluto la duplicidad de números de factura.   RNF-10: Se deben programar backups automatizados de la base de datos para asegurar la recuperación íntegra ante desastres de hardware.   UsabilidadRNF-11: El diseño de la interfaz gráfica del usuario debe ser altamente intuitivo, estructurado de forma que permita completar el flujo total de venta en un máximo de 5 pasos para agilizar la atención en horas pico.   6. Modelo de Datos Optimizado (Esquema PostgreSQL)A continuación, se detalla el esquema relacional corregido y optimizado. Se han incorporado tipos de datos precisos para cálculos contables (DECIMAL), soporte para el peso fraccionado en gramos y el control nativo del cupo de crédito.SQL-- 1. Tabla de Roles (Restricciones del sistema)
CREATE TABLE ROLES (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE, -- 'Administrador' | 'Cajero'
    descripcion TEXT
);

-- 2. Tabla de Usuarios del Sistema
CREATE TABLE USUARIOS (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Almacenado con hash (Bcrypt / Argon2)
    id_rol INT NOT NULL REFERENCES ROLES(id_rol),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Clientes con soporte para gestión de crédito (Cartera)
CREATE TABLE CLIENTES (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    identificacion VARCHAR(20) NOT NULL UNIQUE, -- Búsqueda por NIT o Cédula
    tipo_identificacion VARCHAR(10) NOT NULL, -- 'CC' | 'NIT' | 'CE'
    telefono VARCHAR(20),
    email VARCHAR(150),
    direccion TEXT,
    limite_credito DECIMAL(12,2) NOT NULL DEFAULT 0.00,   -- Cupo total prestable
    credito_utilizado DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Saldo actual adeudado
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Tabla de Catálogo de Productos con soporte para gramaje
CREATE TABLE PRODUCTOS (
    id_producto SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL, -- Precio vigente actual por unidad base
    unidad_medida VARCHAR(10) NOT NULL DEFAULT 'UNIDAD', -- 'KG' | 'UNIDAD' | 'GRAMO'
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. Tabla Cabecera de Facturas
CREATE TABLE FACTURAS (
    id_factura SERIAL PRIMARY KEY,
    numero_factura VARCHAR(20) NOT NULL UNIQUE, -- Consecutivo único e inmutable
    id_cliente INT NOT NULL REFERENCES CLIENTES(id_cliente),
    id_usuario INT NOT NULL REFERENCES USUARIOS(id_usuario),
    fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
    tipo_pago VARCHAR(10) NOT NULL, -- 'Contado' | 'Credito'
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    impuesto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    saldo_pendiente DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Se reduce con cada pago
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' -- 'Pendiente' | 'Parcialmente_Pagada' | 'Pagada'
);

-- 6. Tabla Detalle de Factura con soporte de cantidad en Decimal
CREATE TABLE DETALLE_FACTURA (
    id_detalle SERIAL PRIMARY KEY,
    id_factura INT NOT NULL REFERENCES FACTURAS(id_factura) ON DELETE CASCADE,
    id_producto INT NOT NULL REFERENCES PRODUCTOS(id_producto),
    -- DECIMAL(10,3) permite registrar hasta 3 decimales exactos, ideal para gramos (ej: 0.455 KG)
    cantidad DECIMAL(10,3) NOT NULL, 
    precio_unitario_venta DECIMAL(12,2) NOT NULL, -- Snapshot congelado del precio al momento de vender
    subtotal_linea DECIMAL(12,2) NOT NULL -- Calculado automáticamente: (cantidad * precio_unitario_venta)
);

-- 7. Historial de Pagos y Abonos a Cartera
CREATE TABLE PAGOS (
    id_pago SERIAL PRIMARY KEY,
    id_factura INT NOT NULL REFERENCES FACTURAS(id_factura),
    id_usuario INT NOT NULL REFERENCES USUARIOS(id_usuario),
    fecha_pago TIMESTAMP NOT NULL DEFAULT NOW(),
    monto DECIMAL(12,2) NOT NULL, -- Valor real del abono
    saldo_anterior DECIMAL(12,2) NOT NULL, -- Registro de control previo al pago
    saldo_posterior DECIMAL(12,2) NOT NULL, -- Registro de control posterior al pago
    observacion TEXT
);

-- 8. Tabla de Pistas de Auditoría Interna (Inmutable)
CREATE TABLE AUDITORIA (
    id_auditoria SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES USUARIOS(id_usuario),
    fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
    accion VARCHAR(100) NOT NULL, -- 'INSERT', 'UPDATE', 'LOGIN', 'LOGOUT'
    tabla_afectada VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL
);
7. Automatización y Seguridad Avanzada en PostgreSQLPara dar pleno cumplimiento a los requerimientos de auditoría interna (RF-AD-01) y mantener sincronizados los saldos de crédito de los clientes de forma segura e inmutable, se implementan funciones disparadoras (Triggers) directamente en el motor de la base de datos.7.1. Registro Automático de Auditoría CríticaEsta función intercepta cualquier operación de escritura en las tablas de negocio esenciales y graba el rastro en la tabla AUDITORIA sin intervención de la API de Node.js.SQLCREATE OR REPLACE FUNCTION tg_registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO AUDITORIA (id_usuario, accion, tabla_afectada, descripcion)
    VALUES (
        -- Se asume un valor de usuario enviado por el contexto de la sesión de la BD o por defecto el operador del sistema
        COALESCE(NEW.id_usuario, 1), 
        TG_OP, 
        TG_TABLE_NAME, 
        'Se realizó un ' || TG_OP || ' en la fila con ID: ' || NEW.id_factura
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditoria_facturas
AFTER INSERT OR UPDATE ON FACTURAS
FOR EACH ROW EXECUTE FUNCTION tg_registrar_auditoria();
7.2. Sincronización Automatizada de Créditos en ClientesGarantiza que cada vez que una factura sea registrada bajo la modalidad a Credito, el saldo de credito_utilizado aumente en el perfil del cliente, y que cada vez que se efectúe un abono en la tabla PAGOS, dicho saldo disminuya de forma exacta.SQLCREATE OR REPLACE FUNCTION tg_actualizar_cartera_cliente()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se crea una nueva factura a crédito, aumentamos la deuda del cliente
    IF (TG_TABLE_NAME = 'facturas' AND NEW.tipo_pago = 'Credito') THEN
        UPDATE CLIENTES 
        SET credito_utilizado = credito_utilizado + NEW.total
        WHERE id_cliente = NEW.id_cliente;
    
    -- Si se registra un pago, disminuimos la deuda del cliente
    ELSIF (TG_TABLE_NAME = 'pagos') THEN
        UPDATE CLIENTES 
        SET credito_utilizado = credito_utilizado - NEW.monto
        WHERE id_cliente = (SELECT id_cliente FROM FACTURAS WHERE id_factura = NEW.id_factura);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vinculación de triggers a las tablas correspondientes
CREATE TRIGGER trg_factura_a_credito
AFTER INSERT ON FACTURAS
FOR EACH ROW EXECUTE FUNCTION tg_actualizar_cartera_cliente();

CREATE TRIGGER trg_abono_cartera
AFTER INSERT ON PAGOS
FOR EACH ROW EXECUTE FUNCTION tg_actualizar_cartera_cliente();