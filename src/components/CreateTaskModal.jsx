import React, { useState, useEffect } from 'react';
import api from '../api';

const CreateTaskModal = ({ onClose, onTaskCreated }) => {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        receiver_id: '',
        title: '',
        description: '',
        due_date: ''
    });
    const [subtasks, setSubtasks] = useState([]);
    const [currentSubtask, setCurrentSubtask] = useState('');

    useEffect(() => {
        // Fetch potential assignees
        api.get('/users').then(res => setUsers(res.data));
    }, []);

    const addSubtask = () => {
        if (!currentSubtask.trim()) return;
        setSubtasks([...subtasks, { id: Date.now(), title: currentSubtask, status: 'To-Do' }]);
        setCurrentSubtask('');
    };

    const removeSubtask = (index) => {
        const newSubtasks = [...subtasks];
        newSubtasks.splice(index, 1);
        setSubtasks(newSubtasks);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', { ...formData, subtasks });
            onTaskCreated();
        } catch (error) {
            console.error('Failed to create task', error);
            alert('Error creating task');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="glass-panel" style={{ width: '500px', padding: '30px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                <h2 style={{ marginBottom: '20px' }}>Assign New Task</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Assign To</label>
                        <select
                            className="glass-input"
                            value={formData.receiver_id}
                            onChange={(e) => setFormData({ ...formData, receiver_id: e.target.value })}
                            required
                        >
                            <option value="" style={{ color: 'black' }}>Select Employee</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.name} ({u.username})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <input className="glass-input" placeholder="Task Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <textarea className="glass-input" placeholder="Description" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    {/* Subtasks Section */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Subtasks</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                                className="glass-input"
                                placeholder="Add subtask..."
                                value={currentSubtask}
                                onChange={e => setCurrentSubtask(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                            />
                            <button type="button" onClick={addSubtask} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>+ Add</button>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {subtasks.map((st, index) => (
                                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.1)', padding: '5px 10px', marginBottom: '5px', borderRadius: '5px' }}>
                                    <span>{st.title}</span>
                                    <span onClick={() => removeSubtask(index)} style={{ cursor: 'pointer', color: '#e74c3c' }}>&times;</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label>Due Date</label>
                        <input type="date" className="glass-input" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send Task</button>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;
