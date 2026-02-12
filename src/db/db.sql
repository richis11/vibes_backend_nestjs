-- ______________________SQL PARA CREAR LA DB DE "VIBES"_________________
--  TABLA USUARIOS
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,

    stripe_customer_id VARCHAR(255) UNIQUE;

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- TABLA PERSONAS
CREATE TABLE personas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    foto_url VARCHAR(500),
    direccion VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_persona_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- TABLA HOSTS
CREATE TABLE hosts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    persona_id BIGINT UNSIGNED NOT NULL UNIQUE,

    stripe_account_id VARCHAR(255) UNIQUE,
    stripe_onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,

    verificado BOOLEAN NOT NULL DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_host_persona
        FOREIGN KEY (persona_id)
        REFERENCES personas(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- TABLA CASAS
CREATE TABLE casas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    host_id BIGINT UNSIGNED NOT NULL,

    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    direccion VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    estado VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_casa_host
        FOREIGN KEY (host_id)
        REFERENCES hosts(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE casas
ADD FULLTEXT casas_search_idx (nombre, descripcion, direccion);


-- TABLA PAGOS HOSTS (en caso de pagar directamente con cuenta bancaria)
-- CREATE TABLE host_payment_accounts (
--     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--     host_id BIGINT UNSIGNED NOT NULL,

--     banco VARCHAR(150) NOT NULL,
--     tipo_cuenta ENUM('ahorros','corriente') NOT NULL,
--     numero_cuenta VARCHAR(100) NOT NULL,
--     titular VARCHAR(150) NOT NULL,

--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

--     CONSTRAINT fk_payment_host
--         FOREIGN KEY (host_id)
--         REFERENCES hosts(id)
--         ON DELETE CASCADE
-- ) ENGINE=InnoDB;


-- crear MySQL índice en FK  ser explícito:
CREATE INDEX idx_personas_user_id ON personas(user_id);
CREATE INDEX idx_hosts_persona_id ON hosts(persona_id);