import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore auth from localStorage on page load
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            // Set axios default header so all requests use token automatically
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(JSON.parse(userData));
        }

        setLoading(false);
    }, []);

    // Login function
    const login = async (username, password) => {
        try {
            const res = await api.post('/auth/login', { username, password });
            const { token, user } = res.data;

            // Save to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Update axios default header
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);

            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Login failed' };
        }
    };

    // Register function
    const register = async (username, password, name) => {
        try {
            await api.post('/auth/register', { username, password, name });
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Registration failed' };
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
