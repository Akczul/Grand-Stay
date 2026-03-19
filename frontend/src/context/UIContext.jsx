// ============================================================
// UIContext - Estado global de UI: toasts, carga global
// Toasts auto-desaparecen en 5 segundos (RNF-F03)
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext(null);

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI debe usarse dentro de UIProvider');
  return ctx;
};

let nextId = 1;

export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Helpers for common toast types
  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info:    (msg) => addToast(msg, 'info'),
  };

  return (
    <UIContext.Provider value={{ toasts, addToast, removeToast, toast, globalLoading, setGlobalLoading }}>
      {children}
    </UIContext.Provider>
  );
};
