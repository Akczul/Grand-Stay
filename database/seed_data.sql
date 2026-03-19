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
('204', 'Doble', 1200.00, 2, 'En Mantenimiento', '["WiFi","TV","Minibar"]', 2, 'Habitación en reparación');

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

-- =============================================
-- 4. CONSUMOS DE PRUEBA (consumptions service - grand_stay_consumptions)
-- =============================================
USE grand_stay_consumptions;

INSERT INTO consumos (reservaId, concepto, tipo, descripcion, monto, cantidad, fecha, estado) VALUES
(1, 'Desayuno buffet', 'restaurante', 'Buffet americano para 1 persona', 35.00, 1, '2026-03-10', 'Confirmado'),
(1, 'Minibar agua', 'minibar', 'Botella de agua mineral 600ml', 4.50, 2, '2026-03-10', 'Confirmado'),
(2, 'Masaje relajante', 'spa', 'Sesión de 45 minutos', 60.00, 1, '2026-03-11', 'Pendiente'),
(2, 'Lavado express', 'lavanderia', 'Servicio express de 24 horas', 18.00, 1, '2026-03-11', 'Pendiente'),
(3, 'Cena a la habitación', 'restaurante', 'Menú ejecutivo', 42.00, 1, '2026-03-12', 'Confirmado'),
(3, 'Snack minibar', 'minibar', 'Papas y chocolate', 9.00, 1, '2026-03-12', 'Cancelado'),
(4, 'Late checkout', 'otros', 'Recargo por salida tardía', 25.00, 1, '2026-03-13', 'Confirmado'),
(5, 'Desayuno continental', 'restaurante', 'Incluye fruta y café', 28.00, 1, '2026-03-14', 'Pendiente');

-- ============================================================
-- 5. SERVICIO DE FACTURACIÓN (grand_stay_billing)
-- ============================================================
CREATE DATABASE IF NOT EXISTS grand_stay_billing 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE grand_stay_billing;

INSERT INTO facturas (numeroFactura, reservaId, usuarioId, fechaEmision, fechaVencimiento, subtotal, impuestos, descuentos, total, estado, tipoDocumento) VALUES
('FAC-2026-0001', 1, 4, '2026-03-10 10:00:00', '2026-03-17', 1674.00, 318.06, 0.00, 1992.06, 'Pagada', 'Factura'),
('FAC-2026-0002', 2, 4, '2026-03-11 11:30:00', '2026-03-18', 2478.00, 470.82, 0.00, 2948.82, 'Pendiente', 'Factura'),
('FAC-2026-0003', 3, 4, '2026-03-12 09:15:00', '2026-03-19', 7551.00, 1434.69, 100.00, 8885.69, 'Parcial', 'Factura'),
('FAC-2026-0004', 4, 4, '2026-03-13 14:00:00', '2026-03-20', 825.00, 156.75, 0.00, 981.75, 'Pendiente', 'Factura'),
('FAC-2026-0005', 5, 4, '2026-03-14 16:45:00', '2026-03-21', 5028.00, 955.32, 0.00, 5983.32, 'Pendiente', 'Factura');

-- =============================================
-- INSERTAR DETALLES DE FACTURA
-- =============================================
INSERT INTO detalles_factura (facturaId, concepto, descripcion, cantidad, precioUnitario, subtotal, tipo, consumoId) VALUES
-- Factura 1
(1, 'Habitación 101 - 2 noches', 'Habitación Sencilla', 2, 800.00, 1600.00, 'habitacion', NULL),
(1, 'Desayuno buffet', 'Buffet americano para 1 persona', 1, 35.00, 35.00, 'consumo', 1),
(1, 'Minibar agua', 'Botella de agua mineral 600ml', 2, 4.50, 9.00, 'consumo', 2),
(1, 'IVA 19%', 'Impuesto al Valor Agregado', 1, 318.06, 318.06, 'impuesto', NULL),

-- Factura 2
(2, 'Habitación 103 - 2 noches', 'Habitación Doble', 2, 1200.00, 2400.00, 'habitacion', NULL),
(2, 'Masaje relajante', 'Sesión de 45 minutos', 1, 60.00, 60.00, 'servicio', 3),
(2, 'Lavado express', 'Servicio express de 24 horas', 1, 18.00, 18.00, 'servicio', 4),
(2, 'IVA 19%', 'Impuesto al Valor Agregado', 1, 470.82, 470.82, 'impuesto', NULL),

-- Factura 3
(3, 'Habitación 202 - 3 noches', 'Suite con sala de estar', 3, 2500.00, 7500.00, 'habitacion', NULL),
(3, 'Cena a la habitación', 'Menú ejecutivo', 1, 42.00, 42.00, 'consumo', 5),
(3, 'Snack minibar', 'Papas y chocolate', 1, 9.00, 9.00, 'consumo', 6),
(3, 'IVA 19%', 'Impuesto al Valor Agregado', 1, 1434.69, 1434.69, 'impuesto', NULL),
(3, 'Descuento especial', 'Promoción temporada baja', 1, -100.00, -100.00, 'descuento', NULL),

-- Factura 4
(4, 'Habitación 102 - 1 noche', 'Habitación Sencilla', 1, 800.00, 800.00, 'habitacion', NULL),
(4, 'Late checkout', 'Recargo por salida tardía', 1, 25.00, 25.00, 'servicio', 7),
(4, 'IVA 19%', 'Impuesto al Valor Agregado', 1, 156.75, 156.75, 'impuesto', NULL),

-- Factura 5
(5, 'Habitación 203 - 2 noches', 'Suite con vista al mar', 2, 2500.00, 5000.00, 'habitacion', NULL),
(5, 'Desayuno continental', 'Incluye fruta y café', 1, 28.00, 28.00, 'consumo', 8),
(5, 'IVA 19%', 'Impuesto al Valor Agregado', 1, 955.32, 955.32, 'impuesto', NULL);

-- =============================================
-- INSERTAR PAGOS
-- =============================================
INSERT INTO pagos (facturaId, monto, fechaPago, metodoPago, estado, referencia, comprobante) VALUES
(1, 1992.06, '2026-03-10 10:15:00', 'Tarjeta Crédito', 'Completado', 'TXN-20260310-001', 'comprobante_001.pdf'),
(3, 4000.00, '2026-03-12 09:30:00', 'Transferencia', 'Completado', 'TRANS-20260312-003', 'comprobante_003.pdf');

-- =============================================
-- INSERTAR REEMBOLSOS
-- =============================================
INSERT INTO reembolsos (facturaId, pagoId, monto, motivo, estado, notas) VALUES
(1, 1, 50.00, 'Cancelación parcial de servicio', 'Procesado', 'Reembolso por cancelación de minibar');