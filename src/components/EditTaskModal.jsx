import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import api from '../api';

const EditTaskModal = ({ task, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
    });

    // Ensure subtasks are an array
    const initialSubtasks = Array.isArray(task.subtasks)
        ? task.subtasks
        : (task.subtasks ? JSON.parse(task.subtasks) : []);

    const [subtasks, setSubtasks] = useState(initialSubtasks);
    const [newSubtask, setNewSubtask] = useState({ title: '', due_date: '' });

    const handleSubtaskChange = (index, field, value) => {
        const updatedSubtasks = [...subtasks];
        updatedSubtasks[index] = { ...updatedSubtasks[index], [field]: value };
        setSubtasks(updatedSubtasks);
    };

    const addSubtask = () => {
        if (!newSubtask.title.trim()) return;
        setSubtasks([...subtasks, {
            id: Date.now(), // Temp ID for key
            title: newSubtask.title,
            due_date: newSubtask.due_date || null,
            status: 'To-Do'
        }]);
        setNewSubtask({ title: '', due_date: '' });
    };

    const removeSubtask = (index) => {
        const updatedSubtasks = [...subtasks];
        updatedSubtasks.splice(index, 1);
        setSubtasks(updatedSubtasks);
    };

    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);
        try {
            const targetId = task.id || task._id;
            console.log(`[DEBUG] Updating task ${targetId}:`, { ...formData, subtasks });
            await api.put(`/tasks/${targetId}`, { ...formData, subtasks });

            console.log('[DEBUG] Update successful. Calling onUpdate (parent handler).');
            onUpdate(); // Parent handles toast and data refresh
            onClose();  // Explicitly close modal as well to ensure UI response
        } catch (error) {
            console.error('Failed to update task', error);
            setError('Failed to update task. Please try again.');
            setIsSaving(false);
        }
    };

    return ReactDOM.createPortal(
        <div
            onClick={onClose}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="glass-panel"
                style={{ width: '600px', padding: '30px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                <h2 style={{ marginBottom: '20px' }}>Edit Task</h2>
                {error && (
                    <div style={{ background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c', color: '#e74c3c', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Title</label>
                        <input
                            className="glass-input"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Description</label>
                        <textarea
                            className="glass-input"
                            rows="3"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Due Date</label>
                        <input
                            type="date"
                            className="glass-input"
                            value={formData.due_date}
                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                            required
                        />
                    </div>

                    {/* Subtasks Section */}
                    <div style={{ marginBottom: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.1rem' }}>Subtasks</label>

                        {/* Existing Subtasks List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                            {subtasks.map((st, index) => (
                                <div key={st.id || index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        className="glass-input"
                                        style={{ flex: 2 }}
                                        value={st.title}
                                        onChange={(e) => handleSubtaskChange(index, 'title', e.target.value)}
                                        placeholder="Subtask title"
                                    />
                                    <input
                                        type="date"
                                        className="glass-input"
                                        style={{ flex: 1 }}
                                        value={st.due_date ? new Date(st.due_date).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleSubtaskChange(index, 'due_date', e.target.value)}
                                    />
                                    <button type="button" onClick={() => removeSubtask(index)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                                </div>
                            ))}
                        </div>

                        {/* Add New Subtask */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                            <input
                                className="glass-input"
                                style={{ flex: 2 }}
                                placeholder="New subtask title..."
                                value={newSubtask.title}
                                onChange={e => setNewSubtask({ ...newSubtask, title: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                            />
                            <input
                                type="date"
                                className="glass-input"
                                style={{ flex: 1 }}
                                value={newSubtask.due_date}
                                onChange={e => setNewSubtask({ ...newSubtask, due_date: e.target.value })}
                            />
                            <button type="button" onClick={addSubtask} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>+ Add</button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSaving}>
                        {isSaving ? 'Updating...' : 'Update Task'}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default EditTaskModal;
