// ============================================================
// AuthContext - Manejo global de JWT y estado de autenticación
// Guarda token en localStorage y lo envía en cada petición
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Al montar, verificar si hay token guardado y obtener perfil
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await api.get('/api/auth/profile');
          setUser(res.data);
        } catch {
          // Token inválido o expirado
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token: newToken, usuario } = res.data;

    localStorage.setItem('token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(usuario);

    return usuario;
  };

  const register = async (nombre, email, password, rol) => {
    const res = await api.post('/api/auth/register', { nombre, email, password, rol });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  // Verificar si el usuario tiene uno de los roles indicados
  const hasRole = (...roles) => {
    return user && roles.includes(user.rol);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    hasRole,
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
