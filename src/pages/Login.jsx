import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(username, password);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.error);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh' }}>
            <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <img src="/logo.png" alt="Fadna Logo" style={{ height: '60px' }} />
                </div>
                <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '30px', fontSize: '2rem' }}>Welcome Back</h2>
                {error && <div style={{ color: '#ff6b6b', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '30px' }}>
                        <input
                            type="password"
                            className="glass-input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                        Don't have an account? <Link to="/register" style={{ color: '#f75591' }}>Sign up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
