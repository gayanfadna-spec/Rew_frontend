import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [userData, setUserData] = useState({ username: '', password: '', name: '', role: 'employee' });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setUserData({ ...userData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await register(userData.username, userData.password, userData.name, userData.role);
        if (res.success) {
            navigate('/login');
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
                <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '30px', fontSize: '2rem' }}>Create Account</h2>
                {error && <div style={{ color: '#ff6b6b', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <input name="name" type="text" className="glass-input" placeholder="Full Name" onChange={handleChange} required />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <input name="username" type="text" className="glass-input" placeholder="Username" onChange={handleChange} required />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <input name="password" type="password" className="glass-input" placeholder="Password" onChange={handleChange} required />
                    </div>
                    {/* Role selection removed - Defaults to Employee */}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign Up</button>
                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                        Already have an account? <Link to="/login" style={{ color: '#f75591' }}>Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
