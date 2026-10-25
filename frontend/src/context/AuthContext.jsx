import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const refreshUser = async () => {
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const data = await api.auth.me();
            setUser(data.user);
        }
        catch {
            logout();
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        refreshUser();
    }, [token]);
    const login = (newToken, newUser) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
    };
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };
    return (<AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>);
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
