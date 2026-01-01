import React, { useState, useEffect } from 'react';
import api from '../api';

import TaskCard from '../components/TaskCard';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [verifyUsername, setVerifyUsername] = useState('');
    const [verifyPassword, setVerifyPassword] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        if (selectedUser) {
            fetchUserTasks(selectedUser);
        } else {
            setTasks([]);
        }
    }, [selectedUser]);

    const fetchUserTasks = async (userId) => {
        setLoadingTasks(true);
        try {
            const res = await api.get('/tasks?type=all');
            const allTasks = res.data;
            // Filter for the selected user
            const userTasks = allTasks.filter(t => t.sender_id == userId || t.receiver_id == userId);
            setTasks(userTasks);
        } catch (err) {
            console.error("Failed to fetch tasks", err);
        }
        setLoadingTasks(false);
    };

    useEffect(() => {
        api.get('/users').then(res => setUsers(res.data));
    }, []);



    const handleExport = async () => {
        try {
            const res = await api.get('/tasks?type=all');
            let data = res.data;

            // Filter out tasks involving deleted users (both sender and receiver must be active)
            const activeUserIds = new Set(users.map(u => u.id));
            data = data.filter(t => activeUserIds.has(t.sender_id) && activeUserIds.has(t.receiver_id));

            // Filter if user is selected
            if (selectedUser) {
                data = data.filter(t => t.sender_id == selectedUser || t.receiver_id == selectedUser);
            }

            // Convert to CSV
            const headers = ['ID', 'Title', 'Description', 'Status', 'Sender', 'Receiver', 'Created At', 'Completed At', 'Subtasks'];
            const csvContent = [
                headers.join(','),
                ...data.map(t => {
                    // Parse and format subtasks
                    let subtasksStr = '';
                    try {
                        const sub = Array.isArray(t.subtasks) ? t.subtasks : JSON.parse(t.subtasks || '[]');
                        subtasksStr = sub.map(s => `${s.title} (${s.isCompleted ? 'Done' : 'Pending'})`).join(' | ');
                    } catch (e) {
                        subtasksStr = '';
                    }

                    return [
                        t.id,
                        `"${(t.title || '').replace(/"/g, '""')}"`,
                        `"${(t.description || '').replace(/"/g, '""')}"`,
                        t.status,
                        `"${(t.sender_name || 'Unknown').replace(/"/g, '""')}"`,
                        `"${(t.receiver_name || 'Unknown').replace(/"/g, '""')}"`,
                        t.created_at,
                        t.completed_at || '',
                        `"${subtasksStr.replace(/"/g, '""')}"`
                    ].join(',');
                })
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tasks_report_${selectedUser ? `user_${selectedUser}_` : ''}${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (err) {
            console.error('Export failed', err);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) return;

        try {
            await api.delete(`/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
            if (selectedUser == userId) setSelectedUser('');
            alert('User deleted successfully');
        } catch (err) {
            console.error('Failed to delete user', err);
            alert(err.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleDeleteAllTasks = async () => {
        try {
            await api.post('/tasks/delete-all', { username: verifyUsername, password: verifyPassword });
            alert('All tasks have been deleted successfully.');
            setTasks([]);
            setShowDeleteModal(false);
            setVerifyUsername('');
            setVerifyPassword('');
        } catch (err) {
            console.error('Failed to delete all tasks', err);
            alert(err.response?.data?.error || 'Failed to delete all tasks');
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '50px' }}>
            <div className="glass-panel" style={{ padding: '20px', marginTop: '30px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h1 className="text-gradient" style={{ margin: 0 }}>Admin Dashboard</h1>
                    <button className="btn" style={{ background: '#e74c3c', color: 'white', padding: '8px 15px', fontSize: '0.9rem' }} onClick={() => setShowDeleteModal(true)}>Delete All Tasks</button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
                    <button className="btn btn-primary" onClick={handleExport}>Export CSV</button>
                </div>
            </div>

            {/* Manage Users Section */}
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px' }}>Manage Employees</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '10px' }}>Role</th>
                                <th style={{ textAlign: 'right', padding: '10px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <td style={{ padding: '10px' }}>{u.name}</td>
                                    <td style={{ padding: '10px' }}>{u.role}</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDeleteUser(u.id, u.name)}
                                            style={{
                                                background: '#e74c3c',
                                                border: 'none',
                                                color: 'white',
                                                padding: '5px 10px',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                opacity: u.role === 'admin' ? 0.5 : 1
                                            }}
                                            disabled={u.role === 'admin'} // Disable simple delete for admins to be safe, or just self
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Employee Tasks Section */}
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px' }}>Employee Tasks</h3>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ marginRight: '10px' }}>Select Employee:</label>
                    <select
                        className="glass-input"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        style={{ maxWidth: '300px' }}
                    >
                        <option value="" style={{ color: 'black' }}>-- Select Employee --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.name} ({u.role})</option>
                        ))}
                    </select>
                </div>

                {selectedUser && (
                    <div>
                        {loadingTasks ? <p>Loading tasks...</p> : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                <div>
                                    <h4 style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Received Tasks</h4>
                                    {tasks.filter(t => t.receiver_id == selectedUser).map(t => (
                                        <TaskCard key={t.id} task={t} isSent={false} onUpdate={() => fetchUserTasks(selectedUser)} />
                                    ))}
                                    {tasks.filter(t => t.receiver_id == selectedUser).length === 0 && <p style={{ opacity: 0.5 }}>No received tasks.</p>}
                                </div>
                                <div>
                                    <h4 style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Sent Tasks</h4>
                                    {tasks.filter(t => t.sender_id == selectedUser).map(t => (
                                        <TaskCard key={t.id} task={t} isSent={true} onUpdate={() => fetchUserTasks(selectedUser)} />
                                    ))}
                                    {tasks.filter(t => t.sender_id == selectedUser).length === 0 && <p style={{ opacity: 0.5 }}>No sent tasks.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>


            {/* Delete Verification Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ width: '400px', padding: '30px', position: 'relative', border: '1px solid #e74c3c' }}>
                        <button onClick={() => setShowDeleteModal(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        <h2 style={{ marginBottom: '20px', color: '#e74c3c' }}>⚠ DANGER ZONE</h2>
                        <p style={{ marginBottom: '20px' }}>This will permanently delete <strong>ALL TASKS</strong> in the entire system. This action cannot be undone.</p>
                        <p style={{ marginBottom: '20px' }}>Please enter your Admin credentials to confirm.</p>

                        <div style={{ marginBottom: '15px' }}>
                            <input
                                className="glass-input"
                                placeholder="Admin Username"
                                value={verifyUsername}
                                onChange={e => setVerifyUsername(e.target.value)}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <input
                                type="password"
                                className="glass-input"
                                placeholder="Admin Password"
                                value={verifyPassword}
                                onChange={e => setVerifyPassword(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button
                                className="btn"
                                style={{ flex: 1, background: '#e74c3c', color: 'white', border: 'none' }}
                                onClick={handleDeleteAllTasks}
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Admin;
