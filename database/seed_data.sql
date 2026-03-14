-- ============================================================
-- Grand-Stay - Datos iniciales de prueba (Seeds)
-- Ejecutar DESPUÉS de que los servicios hayan creado las tablas
-- ============================================================

-- =============================================
-- 1. USUARIOS DE PRUEBA (auth service - grand_stay_auth)
-- =============================================
-- Contraseña para todos: "password123" (hash bcrypt)
USE grand_stay_auth;

INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Admin Principal', 'admin@grandstay.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi', 'Administrador'),
('María Recepción', 'recepcion@grandstay.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi', 'Recepcionista'),
('Carlos Limpieza', 'limpieza@grandstay.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi', 'Limpieza'),
('Juan Huésped', 'huesped@grandstay.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi', 'Huesped');

-- =============================================
-- 2. HABITACIONES (rooms service - grand_stay_rooms)
-- =============================================
USE grand_stay_rooms;

INSERT INTO habitaciones (numero, tipo, tarifa_base, capacidad, estado, servicios_incluidos, piso, descripcion) VALUES
('101', 'Sencilla', 800.00, 1, 'Disponible', '["WiFi","TV","Aire Acondicionado"]', 1, 'Habitación sencilla con vista al jardín'),
('102', 'Sencilla', 800.00, 1, 'Disponible', '["WiFi","TV","Aire Acondicionado"]', 1, 'Habitación sencilla estándar'),
('103', 'Doble', 1200.00, 2, 'Disponible', '["WiFi","TV","Aire Acondicionado","Minibar"]', 1, 'Habitación doble con dos camas'),
('201', 'Doble', 1200.00, 2, 'Disponible', '["WiFi","TV","Aire Acondicionado","Minibar"]', 2, 'Habitación doble matrimonial'),
('202', 'Suite', 2500.00, 3, 'Disponible', '["WiFi","TV","Aire Acondicionado","Minibar","Jacuzzi","Room Service"]', 2, 'Suite con sala de estar'),
('203', 'Suite', 2500.00, 3, 'Disponible', '["WiFi","TV","Aire Acondicionado","Minibar","Jacuzzi","Room Service"]', 2, 'Suite con vista al mar'),
('301', 'Presidencial', 5000.00, 4, 'Disponible', '["WiFi","TV","Aire Acondicionado","Minibar","Jacuzzi","Room Service","Butler","Terraza Privada"]', 3, 'Suite Presidencial - máximo lujo'),
('104', 'Sencilla', 800.00, 1, 'Sucia', '["WiFi","TV"]', 1, 'Habitación sencilla básica'),
('204', 'Doble', 1200.00, 2, 'Mantenimiento', '["WiFi","TV","Minibar"]', 2, 'Habitación en reparación');

-- =============================================
-- 3. INSUMOS DE LIMPIEZA (cleaning service - grand_stay_cleaning)
-- =============================================
USE grand_stay_cleaning;

INSERT INTO insumos (nombre, cantidad, unidad, stockMinimo, categoria) VALUES
('Jabón líquido', 50, 'litros', 10, 'baño'),
('Shampoo', 100, 'unidades', 20, 'amenidades'),
('Toallas de mano', 200, 'unidades', 50, 'baño'),
('Sábanas individuales', 80, 'unidades', 20, 'ropa de cama'),
('Sábanas matrimoniales', 60, 'unidades', 15, 'ropa de cama'),
('Desinfectante multiusos', 30, 'litros', 10, 'limpieza'),
('Papel higiénico', 150, 'rollos', 50, 'baño'),
('Bolsas de basura', 200, 'unidades', 50, 'limpieza'),
('Aromatizante', 25, 'litros', 5, 'limpieza'),
('Cloro', 3, 'litros', 10, 'limpieza');
