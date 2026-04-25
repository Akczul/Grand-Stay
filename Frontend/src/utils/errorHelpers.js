// ============================================================
// errorHelpers - Utilidades para manejo de errores de API (RNF-F03)
// 4xx → mensaje específico  |  5xx → mensaje genérico
// ============================================================

/**
 * Extrae un mensaje de error legible para el usuario desde un error de Axios.
 */
export const getErrorMessage = (err) => {
  if (!err.response) {
    return 'Error de conexión. Verifique su red e intente nuevamente.';
  }
  const status = err.response.status;
  if (status >= 500) {
    return 'Error del servidor, intente nuevamente.';
  }
  if (status === 401) return 'Sesión no válida. Por favor inicie sesión nuevamente.';
  if (status === 403) return 'No tiene permisos para realizar esta acción.';
  if (status === 404) return 'El recurso solicitado no fue encontrado.';
  // 4xx → use the API's specific error message
  return (
    err.response.data?.error ||
    err.response.data?.message ||
    err.response.data?.detalle ||
    'Error en la operación. Verifique los datos ingresados.'
  );
};
