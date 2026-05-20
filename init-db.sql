-- 1. Tabla de Roles (Restricciones del sistema)
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
    password_hash VARCHAR(255) NOT NULL, -- Almacenado con hash (Bcrypt)
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

-- -------------------------------------------------------------
-- Funciones y Triggers Automatizados
-- -------------------------------------------------------------

-- 1. Registro Automático de Auditoría Crítica
CREATE OR REPLACE FUNCTION tg_registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO AUDITORIA (id_usuario, accion, tabla_afectada, descripcion)
    VALUES (
        COALESCE(NEW.id_usuario, 1), 
        TG_OP, 
        TG_TABLE_NAME, 
        'Se realizó un ' || TG_OP || ' en la fila de FACTURAS con ID: ' || NEW.id_factura || ', Número: ' || NEW.numero_factura
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditoria_facturas
AFTER INSERT OR UPDATE ON FACTURAS
FOR EACH ROW EXECUTE FUNCTION tg_registrar_auditoria();

-- 2. Sincronización Automatizada de Créditos en Clientes
CREATE OR REPLACE FUNCTION tg_actualizar_cartera_cliente()
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

CREATE TRIGGER trg_factura_a_credito
AFTER INSERT ON FACTURAS
FOR EACH ROW EXECUTE FUNCTION tg_actualizar_cartera_cliente();

CREATE TRIGGER trg_abono_cartera
AFTER INSERT ON PAGOS
FOR EACH ROW EXECUTE FUNCTION tg_actualizar_cartera_cliente();

-- -------------------------------------------------------------
-- Datos Semilla (Seed Data)
-- -------------------------------------------------------------

-- Roles del sistema
INSERT INTO ROLES (id_rol, nombre_rol, descripcion) VALUES
(1, 'Administrador', 'Control total del sistema: gestión de usuarios, clientes, catálogo y reportes.'),
(2, 'Cajero', 'Registro de ventas, adición de productos, y recaudos/abonos a cartera.');

-- Usuarios iniciales
-- Contraseña de admin: admin123
-- Contraseña de cajero: cajero123
INSERT INTO USUARIOS (id_usuario, nombre, apellido, username, password_hash, id_rol, activo) VALUES
(1, 'Administrador', 'Eco Fruver', 'admin', '$2b$10$iL/CEefJW/Zr1Ml8XwEjWu6LTG0iWcqAVDPz78HgvaAXBYb3GiRx6', 1, TRUE),
(2, 'Cajero', 'Eco Fruver', 'cajero', '$2b$10$nDYs82HjYbjZEztfM4X5C.Z64pcHDZNLCKI0a700x.GbAZnTbZ2xi', 2, TRUE);

-- Clientes semilla
INSERT INTO CLIENTES (nombre, apellido, identificacion, tipo_identificacion, telefono, email, direccion, limite_credito, credito_utilizado) VALUES
('Cliente', 'General', '1000000000', 'CC', '0000000', 'general@ecofruver.com', 'Eco Fruver Principal', 0.00, 0.00),
('Juan', 'Pérez', '123456789', 'CC', '3001234567', 'juan.perez@email.com', 'Calle 10 # 4-50', 50000.00, 0.00),
('María', 'Gómez', '987654321', 'CC', '3109876543', 'maria.gomez@email.com', 'Carrera 15 # 20-30', 120000.00, 0.00),
('Verdulería', 'El Triunfo', '900123456-7', 'NIT', '6054210000', 'contacto@eltriunfo.com', 'Av. Libertador # 32-15', 300000.00, 0.00);

-- Catálogo de productos semilla
INSERT INTO PRODUCTOS (descripcion, precio_unitario, unidad_medida) VALUES
('Tomate Chonto Seleccionado', 2800.00, 'KG'),
('Cebolla Cabezona Blanca', 3200.00, 'KG'),
('Manzana Verde Importada', 1800.00, 'UNIDAD'),
('Papa Pastusa Lavada', 2200.00, 'KG'),
('Limón Tahití Jugoso', 4500.00, 'KG'),
('Plátano Verde del Campo', 900.00, 'UNIDAD'),
('Zanahoria Fresca', 1900.00, 'KG'),
('Aguacate Hass Maduro', 3500.00, 'UNIDAD');
