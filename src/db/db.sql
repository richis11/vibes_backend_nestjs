-- ______________________SQL PARA CREAR LA DB DE "VIBES"_________________
--  TABLA USUARIOS
CREATE TABLE railway.users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    estado ENUM('activo', 'suspendido', 'eliminado') NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
) ENGINE = InnoDB;

-- CREATE TABLE users (
--     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--     email VARCHAR(255) NOT NULL UNIQUE,
--     password_hash VARCHAR(255) NOT NULL,
--     is_admin BOOLEAN NOT NULL DEFAULT FALSE,
--     stripe_customer_id VARCHAR(255) UNIQUE;
-- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
-- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- ) ENGINE = InnoDB;
-- TABLA PERSONAS
CREATE TABLE railway.personas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    cedula VARCHAR(30),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento date DEFAULT NULL,
    telefono VARCHAR(30),
    direccion VARCHAR(255),
    foto_url VARCHAR(500),
    estado ENUM('activo', 'eliminado') NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_persona_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- CREATE TABLE personas (
--     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--     user_id BIGINT UNSIGNED NOT NULL UNIQUE,
--     nombre VARCHAR(150) NOT NULL,
--     telefono VARCHAR(30),
--     foto_url VARCHAR(500),
--     direccion VARCHAR(255),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     CONSTRAINT fk_persona_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- ) ENGINE = InnoDB;
-- TABLA HOSTS
CREATE TABLE railway.hosts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    persona_id BIGINT UNSIGNED NOT NULL UNIQUE,
    verificado BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    estado ENUM('activo', 'suspendido', 'eliminado') NOT NULL DEFAULT 'activo',
    stripe_account_id VARCHAR(255) UNIQUE,
    stripe_onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_host_persona FOREIGN KEY (persona_id) REFERENCES personas(id)
);

-- CREATE TABLE hosts (
--     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--     persona_id BIGINT UNSIGNED NOT NULL UNIQUE,
--     stripe_account_id VARCHAR(255) UNIQUE,
--     stripe_onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
--     verificado BOOLEAN NOT NULL DEFAULT FALSE,
--     rating DECIMAL(3, 2) DEFAULT 0.00,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     CONSTRAINT fk_host_persona FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
-- ) ENGINE = InnoDB;
-- TABLA CASAS
CREATE TABLE railway.casas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    host_id BIGINT UNSIGNED NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    direccion VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    disponibilidad VARCHAR(30) DEFAULT 'disponible',
    estado ENUM(
        'activa',
        'inactiva',
        'suspendida',
        'eliminada'
    ) NOT NULL DEFAULT 'activa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_casa_host FOREIGN KEY (host_id) REFERENCES hosts(id)
);

-- CREATE TABLE casas (
--     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--     host_id BIGINT UNSIGNED NOT NULL,
--     nombre VARCHAR(255) NOT NULL,
--     descripcion TEXT,
--     direccion VARCHAR(255) NOT NULL,
--     precio DECIMAL(10, 2) NOT NULL,
--     estado VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     CONSTRAINT fk_casa_host FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE CASCADE
-- ) ENGINE = InnoDB;
ALTER TABLE
    casas
ADD
    FULLTEXT casas_search_idx (nombre, descripcion, direccion);

-- TABLA IMAGENES CASAS
CREATE TABLE railway.casa_imagenes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    casa_id BIGINT UNSIGNED NOT NULL,
    url VARCHAR(500) NOT NULL,
    orden INT DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    estado ENUM('activa', 'eliminada') NOT NULL DEFAULT 'activa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_imagen_casa FOREIGN KEY (casa_id) REFERENCES casas(id)
);

-- TABLA RESERVAS
CREATE TABLE railway.reservas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    casa_id BIGINT UNSIGNED NOT NULL,
    guest_id BIGINT UNSIGNED NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    noches INT NOT NULL,
    precio_por_noche DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    comision_plataforma DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(10) NOT NULL DEFAULT 'MXN',
    estado ENUM(
        'pendiente_pago',
        'pagada',
        'confirmada',
        'cancelada',
        'completada',
        'reembolsada'
    ) NOT NULL DEFAULT 'pendiente_pago',
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_transfer_id VARCHAR(255),
    cancelada_por ENUM('guest', 'host', 'system'),
    motivo_cancelacion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_reserva_casa FOREIGN KEY (casa_id) REFERENCES casas(id),
    CONSTRAINT fk_reserva_guest FOREIGN KEY (guest_id) REFERENCES personas(id)
);

-- CREATE TABLE reservas (
--     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--     casa_id BIGINT UNSIGNED NOT NULL,
--     guest_id BIGINT UNSIGNED NOT NULL,
--     -- persona que reserva
--     fecha_inicio DATE NOT NULL,
--     fecha_fin DATE NOT NULL,
--     noches INT NOT NULL,
--     precio_por_noche DECIMAL(10, 2) NOT NULL,
--     subtotal DECIMAL(10, 2) NOT NULL,
--     comision_plataforma DECIMAL(10, 2) NOT NULL,
--     total DECIMAL(10, 2) NOT NULL,
--     moneda VARCHAR(10) NOT NULL DEFAULT 'MXN',
--     estado ENUM(
--         'pendiente_pago',
--         'pagada',
--         'confirmada',
--         'cancelada',
--         'completada',
--         'reembolsada'
--     ) NOT NULL DEFAULT 'pendiente_pago',
--     stripe_payment_intent_id VARCHAR(255) UNIQUE,
--     stripe_transfer_id VARCHAR(255),
--     cancelada_por VARCHAR(20),
--     -- 'guest' | 'host' | 'system'
--     motivo_cancelacion VARCHAR(255),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     CONSTRAINT fk_reserva_casa FOREIGN KEY (casa_id) REFERENCES casas(id) ON DELETE CASCADE,
--     CONSTRAINT fk_reserva_guest FOREIGN KEY (guest_id) REFERENCES personas(id) ON DELETE CASCADE
-- );
-- INDICES - crear MySQL índice en FK  ser explícito:
-- INDICE USERS -si aun no es UNIQUE    
CREATE UNIQUE INDEX idx_users_email ON users(email);


-- INDICE PERSONA
CREATE INDEX idx_personas_user_id ON personas(user_id);

-- INDICE HOSTS
CREATE INDEX idx_hosts_persona_id ON hosts(persona_id);

-- INDICE CASAS
CREATE INDEX idx_casas_host_id ON casas(host_id);

CREATE INDEX idx_casas_estado ON casas(estado);

--INDICE CASAS IMAGENES
CREATE INDEX idx_casa_imagenes_casa_id ON casa_imagenes(casa_id);

--INDICES RESERVAS
CREATE INDEX idx_reservas_casa_id ON reservas(casa_id);

CREATE INDEX idx_reservas_guest_id ON reservas(guest_id);

CREATE INDEX idx_reservas_fechas ON reservas(casa_id, fecha_inicio, fecha_fin);

CREATE INDEX idx_reservas_estado ON reservas(estado);

-- ____________________________________________________________________