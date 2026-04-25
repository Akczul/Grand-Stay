-- =============================================================
--  GRAND-STAY — Base de Datos Institucional
--  Sistema de Gestión Hotelera de Lujo
--  Versión: 1.0.0  |  Motor: MySQL / MariaDB (HeidiSQL)
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- =============================================================
-- CREAR Y SELECCIONAR BASE DE DATOS
-- =============================================================
DROP DATABASE IF EXISTS grandstay_db;
CREATE DATABASE grandstay_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE grandstay_db;


-- =============================================================
-- MÓDULO 1: ACCESO Y USUARIOS
-- =============================================================

-- 1.1 Tabla de roles del sistema
CREATE TABLE roles (
  id_rol        TINYINT      UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(40)  NOT NULL,
  descripcion   TEXT,
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id_rol),
  UNIQUE KEY uq_rol_nombre (nombre)
) ENGINE=InnoDB COMMENT='Roles del sistema (Recepcionista, Administrador, etc.)';

-- Datos semilla de roles
INSERT INTO roles (nombre, descripcion) VALUES
  ('Administrador',   'Acceso total al sistema'),
  ('Recepcionista',   'Gestión de reservas, check-in y check-out'),
  ('PersonalLimpieza','Gestión de habitaciones e insumos de limpieza'),
  ('ServicioTecnico', 'Reportes de mantenimiento y órdenes técnicas'),
  ('Huesped',         'Acceso al portal de reservas en línea');

-- 1.2 Tabla abstracta de usuarios (generalización)
CREATE TABLE usuarios (
  id_usuario    BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  id_rol        TINYINT      UNSIGNED NOT NULL,
  nombre        VARCHAR(80)  NOT NULL,
  apellido      VARCHAR(80)  NOT NULL,
  email         VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  ultimo_acceso DATETIME,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_email (email),
  KEY idx_rol (id_rol),
  CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
) ENGINE=InnoDB COMMENT='Tabla base de todos los actores del sistema (UML: <<abstract>> Usuario)';

-- 1.3 Recepcionista (extiende Usuario)
CREATE TABLE recepcionistas (
  id_recepcionista BIGINT      UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario       BIGINT      UNSIGNED NOT NULL,
  codigo_empleado  VARCHAR(20) NOT NULL,
  turno            ENUM('manana','tarde','noche','rotativo') NOT NULL DEFAULT 'rotativo',
  telefono_ext     VARCHAR(10),
  fecha_ingreso    DATE        NOT NULL,
  PRIMARY KEY (id_recepcionista),
  UNIQUE KEY uq_codigo_empleado (codigo_empleado),
  UNIQUE KEY uq_rec_usuario (id_usuario),
  CONSTRAINT fk_rec_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Especialización de Usuario: Recepcionista';

-- 1.4 Administrador (extiende Usuario)
CREATE TABLE administradores (
  id_admin      BIGINT      UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario    BIGINT      UNSIGNED NOT NULL,
  nivel_acceso  TINYINT     UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=básico 2=avanzado 3=superadmin',
  departamento  VARCHAR(60),
  fecha_ingreso DATE        NOT NULL,
  PRIMARY KEY (id_admin),
  UNIQUE KEY uq_adm_usuario (id_usuario),
  CONSTRAINT fk_adm_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Especialización de Usuario: Administrador';

-- 1.5 Especialidades técnicas
CREATE TABLE especialidades (
  id_especialidad TINYINT     UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(80) NOT NULL,
  descripcion     TEXT,
  activo          BOOLEAN     NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id_especialidad),
  UNIQUE KEY uq_esp_nombre (nombre)
) ENGINE=InnoDB COMMENT='Especialidades del personal técnico';

INSERT INTO especialidades (nombre) VALUES
  ('Electricidad'),('Plomería'),('Climatización HVAC'),('Carpintería'),('Informática / AV'),('Mantenimiento general');

-- 1.6 Personal de limpieza (extiende Usuario)
CREATE TABLE personal_limpieza (
  id_personal      BIGINT      UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario       BIGINT      UNSIGNED NOT NULL,
  turno_asignado   ENUM('manana','tarde','noche') NOT NULL DEFAULT 'manana',
  zona_asignada    VARCHAR(80),
  piso_asignado    TINYINT     UNSIGNED,
  fecha_ingreso    DATE        NOT NULL,
  PRIMARY KEY (id_personal),
  UNIQUE KEY uq_lim_usuario (id_usuario),
  CONSTRAINT fk_lim_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Especialización de Usuario: PersonalLimpieza';

-- 1.7 Servicio técnico (extiende Usuario)
CREATE TABLE servicio_tecnico (
  id_tecnico        BIGINT      UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario        BIGINT      UNSIGNED NOT NULL,
  id_especialidad   TINYINT     UNSIGNED NOT NULL,
  nivel_certificacion VARCHAR(40),
  turno             ENUM('manana','tarde','noche','rotativo') NOT NULL DEFAULT 'rotativo',
  fecha_ingreso     DATE        NOT NULL,
  PRIMARY KEY (id_tecnico),
  UNIQUE KEY uq_tec_usuario (id_usuario),
  KEY idx_tec_esp (id_especialidad),
  CONSTRAINT fk_tec_usuario FOREIGN KEY (id_usuario)     REFERENCES usuarios(id_usuario)      ON DELETE CASCADE,
  CONSTRAINT fk_tec_esp     FOREIGN KEY (id_especialidad) REFERENCES especialidades(id_especialidad)
) ENGINE=InnoDB COMMENT='Especialización de Usuario: ServicioTécnico';


-- =============================================================
-- MÓDULO 2: HUÉSPEDES
-- =============================================================

CREATE TABLE huespedes (
  id_huesped            BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario            BIGINT       UNSIGNED,
  nombres               VARCHAR(80)  NOT NULL,
  apellidos             VARCHAR(80)  NOT NULL,
  tipo_documento        ENUM('CC','CE','Pasaporte','TI','Otro') NOT NULL DEFAULT 'CC',
  num_documento         VARCHAR(30)  NOT NULL,
  nacionalidad          VARCHAR(60)  NOT NULL DEFAULT 'Colombia',
  fecha_nacimiento      DATE,
  genero                ENUM('M','F','Otro','Prefiero_no_decir'),
  telefono              VARCHAR(20),
  email                 VARCHAR(120) NOT NULL,
  ciudad                VARCHAR(80),
  pais                  VARCHAR(60)  NOT NULL DEFAULT 'Colombia',
  vip                   BOOLEAN      NOT NULL DEFAULT FALSE,
  nivel_fidelidad       ENUM('Bronce','Plata','Oro','Platino') NOT NULL DEFAULT 'Bronce',
  puntos_fidelidad      INT          UNSIGNED NOT NULL DEFAULT 0,
  preferencias          TEXT         COMMENT 'JSON con preferencias: cama, piso, amenidades',
  consentimiento_datos  BOOLEAN      NOT NULL DEFAULT FALSE,
  fecha_registro        DATE         NOT NULL DEFAULT (CURDATE()),
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_huesped),
  UNIQUE KEY uq_huesped_doc (tipo_documento, num_documento),
  KEY idx_huesped_email (email),
  KEY idx_huesped_usuario (id_usuario),
  CONSTRAINT fk_huesped_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Datos del huésped (puede tener cuenta de usuario o ser registrado manualmente)';


-- =============================================================
-- MÓDULO 3: HABITACIONES Y TARIFAS
-- =============================================================

-- 3.1 Tipo de habitación
CREATE TABLE tipos_habitacion (
  id_tipo              TINYINT     UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre               VARCHAR(60) NOT NULL,
  descripcion          TEXT,
  capacidad_max        TINYINT     UNSIGNED NOT NULL DEFAULT 2,
  area_m2              DECIMAL(6,2),
  vista                ENUM('ciudad','mar','jardin','patio_interno','montaña','sin_vista'),
  camas_sencillas      TINYINT     UNSIGNED NOT NULL DEFAULT 0,
  camas_dobles         TINYINT     UNSIGNED NOT NULL DEFAULT 1,
  amenidades           JSON        COMMENT 'Lista de amenidades incluidas',
  imagen_url           VARCHAR(255),
  activo               BOOLEAN     NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id_tipo),
  UNIQUE KEY uq_tipo_nombre (nombre)
) ENGINE=InnoDB COMMENT='Catálogo de tipos de habitación (Estándar, Deluxe, Suite, Presidencial...)';

INSERT INTO tipos_habitacion (nombre, descripcion, capacidad_max, area_m2, vista, camas_sencillas, camas_dobles) VALUES
  ('Estándar',       'Habitación cómoda para estadías cortas',        2, 28.00, 'ciudad',    0, 1),
  ('Deluxe',         'Amplia habitación con vistas premium',           2, 38.00, 'mar',       0, 1),
  ('Suite Junior',   'Sala de estar separada y baño de lujo',          3, 55.00, 'mar',       0, 1),
  ('Suite Senior',   'Suite completa con jacuzzi y terraza',           4, 80.00, 'mar',       0, 2),
  ('Suite Presidencial','Máximo lujo con mayordomía 24h',              6,150.00, 'mar',       2, 2);

-- 3.2 Habitaciones
CREATE TABLE habitaciones (
  id_habitacion         BIGINT      UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tipo               TINYINT     UNSIGNED NOT NULL,
  numero_habitacion     VARCHAR(6)  NOT NULL,
  piso                  TINYINT     UNSIGNED NOT NULL,
  estado                ENUM('disponible','ocupada','mantenimiento','limpieza','bloqueada') NOT NULL DEFAULT 'disponible',
  descripcion_adicional TEXT,
  ultima_limpieza       DATETIME,
  ultima_revision_tec   DATETIME,
  observaciones         TEXT,
  activo                BOOLEAN     NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id_habitacion),
  UNIQUE KEY uq_num_hab (numero_habitacion),
  KEY idx_hab_tipo (id_tipo),
  KEY idx_hab_estado (estado),
  CONSTRAINT fk_hab_tipo FOREIGN KEY (id_tipo) REFERENCES tipos_habitacion(id_tipo)
) ENGINE=InnoDB COMMENT='Inventario físico de habitaciones';

-- 3.3 Tarifas
CREATE TABLE tarifas (
  id_tarifa      BIGINT          UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tipo        TINYINT         UNSIGNED NOT NULL,
  nombre         VARCHAR(80)     NOT NULL,
  precio_noche   DECIMAL(12,2)   NOT NULL,
  temporada      ENUM('baja','media','alta','especial') NOT NULL DEFAULT 'media',
  fecha_inicio   DATE            NOT NULL,
  fecha_fin      DATE            NOT NULL,
  activa         BOOLEAN         NOT NULL DEFAULT TRUE,
  created_by     BIGINT          UNSIGNED COMMENT 'id del administrador que creó la tarifa',
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_tarifa),
  KEY idx_tar_tipo (id_tipo),
  KEY idx_tar_fechas (fecha_inicio, fecha_fin),
  CONSTRAINT fk_tar_tipo FOREIGN KEY (id_tipo) REFERENCES tipos_habitacion(id_tipo),
  CONSTRAINT chk_tar_fechas CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT chk_tar_precio CHECK (precio_noche > 0)
) ENGINE=InnoDB COMMENT='Tarifas vigentes por tipo de habitación y temporada';


-- =============================================================
-- MÓDULO 4: RESERVAS Y PAGOS
-- =============================================================

-- 4.1 Reservas
CREATE TABLE reservas (
  id_reserva            BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo_confirmacion   VARCHAR(16)  NOT NULL,
  id_huesped            BIGINT       UNSIGNED NOT NULL,
  id_recepcionista      BIGINT       UNSIGNED COMMENT 'NULL si se creó online',
  id_tipo_habitacion    TINYINT      UNSIGNED NOT NULL,
  id_habitacion         BIGINT       UNSIGNED COMMENT 'NULL hasta asignación definitiva',
  fecha_entrada         DATE         NOT NULL,
  fecha_salida          DATE         NOT NULL,
  num_adultos           TINYINT      UNSIGNED NOT NULL DEFAULT 1,
  num_ninos             TINYINT      UNSIGNED NOT NULL DEFAULT 0,
  estado                ENUM('pendiente','confirmada','cancelada','no_show','completada') NOT NULL DEFAULT 'pendiente',
  canal_reserva         ENUM('web','telefono','presencial','agencia','OTA') NOT NULL DEFAULT 'presencial',
  monto_pagado          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observaciones         TEXT,
  politica_cancelacion  ENUM('flexible','moderada','estricta') NOT NULL DEFAULT 'moderada',
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_reserva),
  UNIQUE KEY uq_codigo_conf (codigo_confirmacion),
  KEY idx_res_huesped (id_huesped),
  KEY idx_res_hab (id_habitacion),
  KEY idx_res_fechas (fecha_entrada, fecha_salida),
  KEY idx_res_estado (estado),
  CONSTRAINT fk_res_huesped     FOREIGN KEY (id_huesped)         REFERENCES huespedes(id_huesped),
  CONSTRAINT fk_res_recep       FOREIGN KEY (id_recepcionista)   REFERENCES recepcionistas(id_recepcionista) ON DELETE SET NULL,
  CONSTRAINT fk_res_tipo        FOREIGN KEY (id_tipo_habitacion) REFERENCES tipos_habitacion(id_tipo),
  CONSTRAINT fk_res_habitacion  FOREIGN KEY (id_habitacion)      REFERENCES habitaciones(id_habitacion) ON DELETE SET NULL,
  CONSTRAINT chk_res_fechas     CHECK (fecha_salida > fecha_entrada),
  CONSTRAINT chk_res_personas   CHECK (num_adultos >= 1)
) ENGINE=InnoDB COMMENT='Reservas de habitaciones';

-- 4.2 Token de pago (pasarela externa)
CREATE TABLE tokens_pago (
  id_token          BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  id_reserva        BIGINT       UNSIGNED NOT NULL,
  token             VARCHAR(255) NOT NULL,
  proveedor         VARCHAR(60)  NOT NULL COMMENT 'Wompi, PayU, Stripe, etc.',
  monto_autorizado  DECIMAL(12,2) NOT NULL,
  moneda            CHAR(3)      NOT NULL DEFAULT 'COP',
  fecha_creacion    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion  DATETIME,
  vigente           BOOLEAN      NOT NULL DEFAULT TRUE,
  referencia_ext    VARCHAR(120) COMMENT 'ID de transacción en el proveedor',
  PRIMARY KEY (id_token),
  KEY idx_tok_reserva (id_reserva),
  CONSTRAINT fk_tok_reserva FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva)
) ENGINE=InnoDB COMMENT='Tokens de pago de pasarelas externas';


-- =============================================================
-- MÓDULO 5: CICLO DE ESTADÍA
-- =============================================================

-- 5.1 Check-In
CREATE TABLE checkin (
  id_checkin             BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  id_reserva             BIGINT       UNSIGNED NOT NULL,
  id_recepcionista       BIGINT       UNSIGNED NOT NULL,
  id_habitacion          BIGINT       UNSIGNED NOT NULL,
  fecha_hora             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  codigo_acceso          VARCHAR(20)  COMMENT 'Código para llave magnética/app',
  documento_verificado   BOOLEAN      NOT NULL DEFAULT FALSE,
  deposito_garantia      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  metodo_deposito        ENUM('efectivo','tarjeta','transferencia'),
  observaciones          TEXT,
  PRIMARY KEY (id_checkin),
  UNIQUE KEY uq_checkin_reserva (id_reserva),
  KEY idx_ci_habitacion (id_habitacion),
  KEY idx_ci_fecha (fecha_hora),
  CONSTRAINT fk_ci_reserva    FOREIGN KEY (id_reserva)       REFERENCES reservas(id_reserva),
  CONSTRAINT fk_ci_recep      FOREIGN KEY (id_recepcionista) REFERENCES recepcionistas(id_recepcionista),
  CONSTRAINT fk_ci_habitacion FOREIGN KEY (id_habitacion)    REFERENCES habitaciones(id_habitacion)
) ENGINE=InnoDB COMMENT='Registro de entrada (check-in) del huésped';

-- 5.2 Check-Out
CREATE TABLE checkout (
  id_checkout          BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  id_checkin           BIGINT       UNSIGNED NOT NULL,
  id_recepcionista     BIGINT       UNSIGNED NOT NULL,
  fecha_hora           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_cobrado        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  estado_habitacion    ENUM('bueno','danos_menores','danos_graves','pendiente_revision') NOT NULL DEFAULT 'bueno',
  deposito_devuelto    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cargos_adicionales   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  observaciones        TEXT,
  PRIMARY KEY (id_checkout),
  UNIQUE KEY uq_checkout_checkin (id_checkin),
  KEY idx_co_fecha (fecha_hora),
  CONSTRAINT fk_co_checkin FOREIGN KEY (id_checkin)       REFERENCES checkin(id_checkin),
  CONSTRAINT fk_co_recep   FOREIGN KEY (id_recepcionista) REFERENCES recepcionistas(id_recepcionista)
) ENGINE=InnoDB COMMENT='Registro de salida (check-out) del huésped';


-- =============================================================
-- MÓDULO 6: FACTURACIÓN
-- =============================================================

-- 6.1 Factura
CREATE TABLE facturas (
  id_factura         BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  id_checkin         BIGINT       UNSIGNED NOT NULL,
  id_checkout        BIGINT       UNSIGNED,
  numero_factura     VARCHAR(20)  NOT NULL,
  fecha_emision      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  impuesto_pct       DECIMAL(5,2)  NOT NULL DEFAULT 19.00 COMMENT 'IVA Colombia 19%',
  impuestos          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  descuentos         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total              DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  metodo_pago        ENUM('efectivo','tarjeta_credito','tarjeta_debito','transferencia','credito_hotel','mixto') NOT NULL,
  moneda             CHAR(3)       NOT NULL DEFAULT 'COP',
  estado_pago        ENUM('pendiente','pagada','parcial','anulada') NOT NULL DEFAULT 'pendiente',
  email_enviado      BOOLEAN       NOT NULL DEFAULT FALSE,
  notas              TEXT,
  created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_factura),
  UNIQUE KEY uq_numero_factura (numero_factura),
  KEY idx_fac_checkin  (id_checkin),
  KEY idx_fac_checkout (id_checkout),
  KEY idx_fac_estado   (estado_pago),
  CONSTRAINT fk_fac_checkin  FOREIGN KEY (id_checkin)  REFERENCES checkin(id_checkin),
  CONSTRAINT fk_fac_checkout FOREIGN KEY (id_checkout) REFERENCES checkout(id_checkout) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Facturas generadas al final de la estadía';

-- 6.2 Ítems de factura
CREATE TABLE items_factura (
  id_item           BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  id_factura        BIGINT       UNSIGNED NOT NULL,
  concepto          VARCHAR(200) NOT NULL,
  categoria         ENUM('alojamiento','servicio_adicional','consumo_minibar','cargo_danio','descuento','otro') NOT NULL DEFAULT 'alojamiento',
  cantidad          DECIMAL(8,2)  NOT NULL DEFAULT 1,
  precio_unitario   DECIMAL(12,2) NOT NULL,
  subtotal          DECIMAL(12,2) NOT NULL,
  fecha             DATE          NOT NULL DEFAULT (CURDATE()),
  PRIMARY KEY (id_item),
  KEY idx_item_factura (id_factura),
  CONSTRAINT fk_item_factura FOREIGN KEY (id_factura) REFERENCES facturas(id_factura) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Líneas de detalle de cada factura';


-- =============================================================
-- MÓDULO 7: SERVICIOS ADICIONALES
-- =============================================================

-- 7.1 Catálogo de servicios adicionales
CREATE TABLE servicios_adicionales (
  id_servicio      BIGINT        UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre           VARCHAR(100)  NOT NULL,
  descripcion      TEXT,
  categoria        ENUM('spa','restaurante','transporte','lavanderia','room_service','entretenimiento','tour','otro') NOT NULL,
  precio           DECIMAL(10,2) NOT NULL,
  duracion_minutos SMALLINT      UNSIGNED COMMENT 'Duración estimada en minutos',
  requiere_reserva BOOLEAN       NOT NULL DEFAULT FALSE,
  disponible       BOOLEAN       NOT NULL DEFAULT TRUE,
  activo           BOOLEAN       NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id_servicio),
  KEY idx_serv_cat (categoria),
  CONSTRAINT chk_serv_precio CHECK (precio >= 0)
) ENGINE=InnoDB COMMENT='Catálogo de servicios adicionales del hotel';

-- 7.2 Consumo de servicios por estadía
CREATE TABLE consumo_servicios (
  id_consumo_servicio BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  id_reserva          BIGINT       UNSIGNED NOT NULL,
  id_habitacion       BIGINT       UNSIGNED NOT NULL,
  id_servicio         BIGINT       UNSIGNED NOT NULL,
  cantidad            DECIMAL(6,2) NOT NULL DEFAULT 1,
  precio_aplicado     DECIMAL(12,2) NOT NULL,
  subtotal            DECIMAL(12,2) NOT NULL,
  fecha               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado              ENUM('solicitado','en_proceso','completado','cancelado') NOT NULL DEFAULT 'solicitado',
  id_factura          BIGINT       UNSIGNED COMMENT 'Se asigna al generar la factura',
  notas               TEXT,
  PRIMARY KEY (id_consumo_servicio),
  KEY idx_cs_reserva   (id_reserva),
  KEY idx_cs_habitacion(id_habitacion),
  KEY idx_cs_servicio  (id_servicio),
  CONSTRAINT fk_cs_reserva    FOREIGN KEY (id_reserva)   REFERENCES reservas(id_reserva),
  CONSTRAINT fk_cs_habitacion FOREIGN KEY (id_habitacion) REFERENCES habitaciones(id_habitacion),
  CONSTRAINT fk_cs_servicio   FOREIGN KEY (id_servicio)   REFERENCES servicios_adicionales(id_servicio),
  CONSTRAINT fk_cs_factura    FOREIGN KEY (id_factura)    REFERENCES facturas(id_factura) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Registro de servicios consumidos durante la estadía';


-- =============================================================
-- MÓDULO 8: INVENTARIO (INSUMOS)
-- =============================================================

-- 8.1 Insumos de limpieza
CREATE TABLE insumos_limpieza (
  id_insumo         BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre            VARCHAR(100) NOT NULL,
  descripcion       TEXT,
  categoria         ENUM('quimico','herramienta','textil','papel','otro') NOT NULL DEFAULT 'quimico',
  unidad_medida     VARCHAR(20)  NOT NULL DEFAULT 'unidad',
  stock_actual      DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_minimo      DECIMAL(10,2) NOT NULL DEFAULT 5,
  proveedor         VARCHAR(100),
  ficha_seguridad_url VARCHAR(255),
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_insumo),
  KEY idx_ins_stock (stock_actual, stock_minimo),
  CONSTRAINT chk_ins_stock CHECK (stock_actual >= 0)
) ENGINE=InnoDB COMMENT='Inventario de insumos de limpieza y mantenimiento';

-- 8.2 Consumo de insumos de limpieza por habitación
CREATE TABLE consumo_insumos (
  id_consumo_insumo BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  id_personal       BIGINT       UNSIGNED NOT NULL,
  id_insumo         BIGINT       UNSIGNED NOT NULL,
  id_habitacion     BIGINT       UNSIGNED NOT NULL,
  tipo_tarea        ENUM('limpieza_rutina','limpieza_profunda','cambio_ropa','mantenimiento','checkin_prep') NOT NULL DEFAULT 'limpieza_rutina',
  cantidad          DECIMAL(8,2) NOT NULL,
  fecha             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  observaciones     TEXT,
  PRIMARY KEY (id_consumo_insumo),
  KEY idx_ci_personal   (id_personal),
  KEY idx_ci_insumo     (id_insumo),
  KEY idx_ci_habitacion (id_habitacion),
  CONSTRAINT fk_cins_personal   FOREIGN KEY (id_personal)   REFERENCES personal_limpieza(id_personal),
  CONSTRAINT fk_cins_insumo     FOREIGN KEY (id_insumo)     REFERENCES insumos_limpieza(id_insumo),
  CONSTRAINT fk_cins_habitacion FOREIGN KEY (id_habitacion) REFERENCES habitaciones(id_habitacion),
  CONSTRAINT chk_cins_cantidad  CHECK (cantidad > 0)
) ENGINE=InnoDB COMMENT='Registro de insumos utilizados en cada habitación';


-- =============================================================
-- MÓDULO 9: COMUNICACIONES Y NOTIFICACIONES
-- =============================================================

CREATE TABLE notificaciones (
  id_notificacion   BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  id_reserva        BIGINT       UNSIGNED,
  id_huesped        BIGINT       UNSIGNED,
  id_usuario_dest   BIGINT       UNSIGNED COMMENT 'Usuario interno si aplica',
  tipo              ENUM('email','sms','push','whatsapp','interna') NOT NULL DEFAULT 'email',
  evento            ENUM('confirmacion_reserva','recordatorio_checkin','checkout_completado','factura','alerta_stock','mantenimiento','bienvenida','otro') NOT NULL,
  destinatario      VARCHAR(120) NOT NULL,
  asunto            VARCHAR(200),
  cuerpo            TEXT         NOT NULL,
  estado            ENUM('pendiente','enviada','fallida','leida') NOT NULL DEFAULT 'pendiente',
  intentos          TINYINT      UNSIGNED NOT NULL DEFAULT 0,
  fecha_envio       DATETIME,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_notificacion),
  KEY idx_notif_reserva (id_reserva),
  KEY idx_notif_huesped (id_huesped),
  KEY idx_notif_estado  (estado),
  CONSTRAINT fk_notif_reserva FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva) ON DELETE SET NULL,
  CONSTRAINT fk_notif_huesped FOREIGN KEY (id_huesped) REFERENCES huespedes(id_huesped) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Notificaciones enviadas a huéspedes y personal';


-- =============================================================
-- MÓDULO 10: REPORTES Y AUDITORÍA
-- =============================================================

-- 10.1 Reportes generados
CREATE TABLE reportes (
  id_reporte      BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  generado_por    BIGINT       UNSIGNED NOT NULL,
  tipo_reporte    ENUM('ocupacion','financiero','mantenimiento','limpieza','inventario','auditoria','personalizado') NOT NULL,
  titulo          VARCHAR(200) NOT NULL,
  periodo_inicio  DATE         NOT NULL,
  periodo_fin     DATE         NOT NULL,
  parametros      JSON         COMMENT 'Filtros y opciones usados para generar el reporte',
  ruta_archivo    VARCHAR(255),
  formato         ENUM('PDF','XLSX','CSV','HTML') NOT NULL DEFAULT 'PDF',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_reporte),
  KEY idx_rep_usuario (generado_por),
  KEY idx_rep_tipo    (tipo_reporte),
  CONSTRAINT fk_rep_usuario FOREIGN KEY (generado_por) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB COMMENT='Reportes institucionales generados por administradores';

-- 10.2 Log de auditoría (append-only, no UPDATE ni DELETE)
CREATE TABLE log_auditoria (
  id_log            BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario        BIGINT       UNSIGNED,
  tabla_afectada    VARCHAR(60)  NOT NULL,
  accion            ENUM('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT') NOT NULL,
  id_registro       BIGINT       UNSIGNED COMMENT 'PK del registro afectado',
  datos_anteriores  JSON,
  datos_nuevos      JSON,
  ip_origen         VARCHAR(45)  COMMENT 'IPv4 o IPv6',
  user_agent        VARCHAR(255),
  fecha_hora        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_log),
  KEY idx_log_usuario  (id_usuario),
  KEY idx_log_tabla    (tabla_afectada),
  KEY idx_log_fecha    (fecha_hora),
  CONSTRAINT fk_log_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Trazabilidad completa de operaciones del sistema (append-only)';


-- =============================================================
-- VISTAS ÚTILES
-- =============================================================

-- Vista: Disponibilidad de habitaciones
CREATE OR REPLACE VIEW v_disponibilidad AS
  SELECT
    h.id_habitacion,
    h.numero_habitacion,
    h.piso,
    h.estado,
    t.nombre      AS tipo,
    t.capacidad_max,
    ta.precio_noche,
    ta.temporada
  FROM habitaciones h
  JOIN tipos_habitacion t  ON h.id_tipo = t.id_tipo
  LEFT JOIN tarifas ta ON ta.id_tipo = t.id_tipo
    AND ta.activa = TRUE
    AND CURDATE() BETWEEN ta.fecha_inicio AND ta.fecha_fin
  WHERE h.activo = TRUE AND h.estado = 'disponible';

-- Vista: Reservas activas con datos del huésped
CREATE OR REPLACE VIEW v_reservas_activas AS
  SELECT
    r.id_reserva,
    r.codigo_confirmacion,
    CONCAT(h.nombres,' ',h.apellidos) AS huesped,
    h.email,
    h.telefono,
    t.nombre            AS tipo_habitacion,
    hab.numero_habitacion,
    r.fecha_entrada,
    r.fecha_salida,
    DATEDIFF(r.fecha_salida, r.fecha_entrada) AS num_noches,
    r.estado,
    r.canal_reserva
  FROM reservas r
  JOIN huespedes h          ON r.id_huesped = h.id_huesped
  JOIN tipos_habitacion t   ON r.id_tipo_habitacion = t.id_tipo
  LEFT JOIN habitaciones hab ON r.id_habitacion = hab.id_habitacion
  WHERE r.estado IN ('confirmada','pendiente');

-- Vista: Ocupación por fecha
CREATE OR REPLACE VIEW v_ocupacion_hoy AS
  SELECT
    COUNT(*) AS total_checkins_hoy,
    SUM(f.total) AS ingresos_hoy
  FROM checkin ci
  JOIN facturas f ON f.id_checkin = ci.id_checkin
  WHERE DATE(ci.fecha_hora) = CURDATE()
    AND f.estado_pago IN ('pagada','parcial');

-- Vista: Stock crítico de insumos
CREATE OR REPLACE VIEW v_stock_critico AS
  SELECT
    id_insumo,
    nombre,
    categoria,
    unidad_medida,
    stock_actual,
    stock_minimo,
    (stock_minimo - stock_actual) AS faltante
  FROM insumos_limpieza
  WHERE stock_actual <= stock_minimo
    AND activo = TRUE
  ORDER BY faltante DESC;


-- =============================================================
-- TRIGGERS ESENCIALES
-- =============================================================

DELIMITER $$

-- Trigger: Actualizar estado de habitación al hacer check-in
CREATE TRIGGER trg_checkin_after_insert
AFTER INSERT ON checkin
FOR EACH ROW
BEGIN
  UPDATE habitaciones SET estado = 'ocupada' WHERE id_habitacion = NEW.id_habitacion;
END$$

-- Trigger: Actualizar estado de habitación al hacer check-out
CREATE TRIGGER trg_checkout_after_insert
AFTER INSERT ON checkout
FOR EACH ROW
BEGIN
  UPDATE habitaciones
  SET estado = IF(NEW.estado_habitacion IN ('danos_menores','danos_graves'), 'mantenimiento', 'limpieza')
  WHERE id_habitacion = (SELECT id_habitacion FROM checkin WHERE id_checkin = NEW.id_checkin);
END$$

-- Trigger: Reducir stock al registrar consumo de insumo
CREATE TRIGGER trg_consumo_insumo_after_insert
AFTER INSERT ON consumo_insumos
FOR EACH ROW
BEGIN
  UPDATE insumos_limpieza
  SET stock_actual = stock_actual - NEW.cantidad
  WHERE id_insumo = NEW.id_insumo;
END$$

-- Trigger: Calcular subtotal automáticamente en items_factura
CREATE TRIGGER trg_item_factura_before_insert
BEFORE INSERT ON items_factura
FOR EACH ROW
BEGIN
  SET NEW.subtotal = ROUND(NEW.cantidad * NEW.precio_unitario, 2);
END$$

-- Trigger: Actualizar totales de factura al insertar ítem
CREATE TRIGGER trg_item_factura_after_insert
AFTER INSERT ON items_factura
FOR EACH ROW
BEGIN
  UPDATE facturas
  SET subtotal   = (SELECT COALESCE(SUM(subtotal),0) FROM items_factura WHERE id_factura = NEW.id_factura),
      impuestos  = ROUND(subtotal * impuesto_pct / 100, 2),
      total      = subtotal + impuestos - descuentos
  WHERE id_factura = NEW.id_factura;
END$$

DELIMITER ;


-- =============================================================
-- ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =============================================================

-- Búsqueda por período en reservas
CREATE INDEX idx_reservas_periodo ON reservas (fecha_entrada, fecha_salida, estado);

-- Búsqueda de facturas por fecha
CREATE INDEX idx_facturas_fecha ON facturas (fecha_emision, estado_pago);

-- Log de auditoría por tabla y acción
CREATE INDEX idx_log_tabla_accion ON log_auditoria (tabla_afectada, accion, fecha_hora);


SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- RESUMEN DEL ESQUEMA
-- =============================================================
-- Tablas:    23
-- Vistas:     4
-- Triggers:   5
-- Módulos:   10
-- Motor:  InnoDB (soporte FK y transacciones)
-- Charset: utf8mb4 (soporte emojis y caracteres especiales)
-- =============================================================
-- Para HeidiSQL: Archivo > Abrir > Seleccionar este .sql
-- Luego presionar F5 o el botón "Ejecutar"
-- =============================================================
