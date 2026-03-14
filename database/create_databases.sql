-- ============================================================
-- Grand-Stay - Script de creación de bases de datos MySQL
-- Ejecutar como usuario root o con permisos de creación de DB
-- TypeORM se encarga de crear las tablas automáticamente
-- con synchronize: true en desarrollo
-- ============================================================

-- Base de datos para Auth Service
CREATE DATABASE IF NOT EXISTS grand_stay_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Base de datos para Rooms Service
CREATE DATABASE IF NOT EXISTS grand_stay_rooms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Base de datos para Reservations Service
CREATE DATABASE IF NOT EXISTS grand_stay_reservations
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Base de datos para Consumptions Service
CREATE DATABASE IF NOT EXISTS grand_stay_consumptions
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Base de datos para Billing Service
CREATE DATABASE IF NOT EXISTS grand_stay_billing
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Base de datos para Cleaning Service
CREATE DATABASE IF NOT EXISTS grand_stay_cleaning
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- Verificar que las bases de datos fueron creadas
-- ============================================================
SHOW DATABASES LIKE 'grand_stay_%';
