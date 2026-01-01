import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);

    // Correctly initialize state only once
    const [receivedTasks, setReceivedTasks] = useState([]);
    const [sentTasks, setSentTasks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [timeString, setTimeString] = useState('');
    const notificationRef = useRef(null);

    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const options = {
                timeZone: 'Asia/Colombo',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            setTimeString(now.toLocaleString('en-US', options));
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchTasks = async (isPolling = false) => {
        try {
            // Add timestamp to prevent caching
            const timestamp = Date.now();
            const [recRes, sentRes] = await Promise.all([
                api.get(`/tasks?type=received&_t=${timestamp}`), // Explicitly ask for received
                api.get(`/tasks?type=sent&_t=${timestamp}`)
            ]);

            setReceivedTasks(recRes.data);
            setSentTasks(sentRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTasks(false);
        const interval = setInterval(() => {
            fetchTasks(true);
        }, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const filterTasks = (tasks, isSent) => {
        let filtered = tasks;

        // Status Filter
        if (filter !== 'All') {
            filtered = filtered.filter(t => t.status === filter);
        }

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t => {
                const targetName = isSent ? (t.receiver_name || '') : (t.sender_name || '');
                return targetName.toLowerCase().includes(query);
            });
        }

        return filtered;
    };

    const getCounts = (tasks) => {
        return {
            'All': tasks.length,
            'To-Do': tasks.filter(t => t.status === 'To-Do').length,
            'In Progress': tasks.filter(t => t.status === 'In Progress').length,
            'Completed': tasks.filter(t => t.status === 'Completed').length
        };
    };

    const counts = getCounts(receivedTasks);

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '50px' }}>
            {/* Header */}
            <div className="glass-panel" style={{ borderRadius: 0, padding: '20px', marginBottom: '30px', borderLeft: 'none', borderRight: 'none', borderTop: 'none', position: 'relative', zIndex: 100 }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <h1 className="text-gradient" style={{ fontSize: '1.8rem', margin: 0 }}>TaskMaster</h1>
                            <img src="/logo.png" alt="Fadna Logo" style={{ height: '40px' }} />
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginTop: '5px' }}>
                            {timeString}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>

                        {/* Notification Bell */}
                        <div style={{ position: 'relative' }} ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer', position: 'relative', padding: '5px' }}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '0',
                                        right: '0',
                                        background: '#e74c3c',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '16px',
                                        height: '16px',
                                        fontSize: '0.7rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div style={{
                                    position: 'absolute',
                                    top: '120%',
                                    right: 0,
                                    width: '320px',
                                    background: 'rgba(15, 23, 42, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    zIndex: 9999,
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 1 }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Notifications</span>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                style={{ background: 'transparent', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>No notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n._id}
                                                    onClick={() => markAsRead(n._id)}
                                                    style={{
                                                        padding: '15px',
                                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                        background: n.isRead ? 'transparent' : 'rgba(52, 152, 219, 0.1)',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(45, 160, 236, 0.1)'}
                                                >
                                                    <div style={{ fontSize: '0.9rem', marginBottom: '5px' }}>{n.message}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                                        {new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <span>Welcome, {user?.name}</span>
                        {user?.role === 'admin' && <button className="btn btn-secondary" onClick={() => navigate('/admin')}>Admin Panel</button>}
                        <button className="btn btn-secondary" onClick={logout}>Logout</button>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <div className="glass-panel" style={{ display: 'flex', padding: '5px' }}>
                        {['All', 'To-Do', 'In Progress', 'Completed'].map(status => (
                            <button
                                key={status}
                                style={{
                                    background: filter === status ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    border: 'none', padding: '8px 16px', borderRadius: '8px', color: 'white', cursor: 'pointer'
                                }}
                                onClick={() => setFilter(status)}
                            >
                                {status} <span style={{ opacity: 0.6, fontSize: '0.8em', marginLeft: '5px' }}>({counts[status] || 0})</span>
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Search Input */}
                        <input
                            type="text"
                            placeholder="Filter by Employee..."
                            className="glass-input"
                            style={{ padding: '8px 12px', width: '200px' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Task</button>
                    </div>
                </div>

                {/* Two Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    {/* Left: Received */}
                    <div>
                        <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Received Tasks</h3>
                        {filterTasks(receivedTasks, false).map(task => (
                            <TaskCard key={task.id} task={task} isSent={false} onUpdate={fetchTasks} />
                        ))}
                        {filterTasks(receivedTasks, false).length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)' }}>No tasks found.</p>}
                    </div>

                    {/* Right: Sent */}
                    <div>
                        <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Sent Tasks</h3>
                        {filterTasks(sentTasks, true).map(task => (
                            <TaskCard key={task.id} task={task} isSent={true} onUpdate={fetchTasks} />
                        ))}
                        {filterTasks(sentTasks, true).length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)' }}>No sent tasks.</p>}
                    </div>
                </div>
            </div>

            {showModal && (
                <CreateTaskModal
                    onClose={() => setShowModal(false)}
                    onTaskCreated={() => { setShowModal(false); fetchTasks(true); }}
                />
            )}
        </div>
    );
};

export default Dashboard;
