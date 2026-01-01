import React from 'react';
import api from '../api';

const TaskCard = ({ task, isSent, onUpdate }) => {
    // Status Flow: To-Do -> In Progress -> Completed
    const nextStatus = {
        'To-Do': 'In Progress',
        'In Progress': 'Completed',
        'Completed': 'To-Do'
    };

    // Optimistic UI State
    const [localStatus, setLocalStatus] = React.useState(task.status);
    const [localSubtasks, setLocalSubtasks] = React.useState(
        Array.isArray(task.subtasks) ? task.subtasks : (task.subtasks ? JSON.parse(task.subtasks) : [])
    );
    const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');

    // Sync local state when props change (e.g. from polling)
    React.useEffect(() => {
        setLocalStatus(task.status);
        setLocalSubtasks(Array.isArray(task.subtasks) ? task.subtasks : (task.subtasks ? JSON.parse(task.subtasks) : []));
    }, [task]);

    const handleStatusClick = async () => {
        // Only Receiver can update status (progress)
        if (isSent) return;

        const newStatus = nextStatus[localStatus];
        if (!newStatus) return;

        // Optimistic Update
        const prevStatus = localStatus;
        setLocalStatus(newStatus);

        try {
            await api.put(`/tasks/${task.id}`, { status: newStatus });
            onUpdate(); // Background sync
        } catch (err) {
            console.error('Failed to update status', err);
            setLocalStatus(prevStatus); // Revert
        }
    };

    const handleSubtaskStatusChange = async (subtaskId, currentStatus) => {
        if (isSent) return; // Sender cannot change subtask status

        const nextSubtaskStatus = {
            'To-Do': 'In Progress',
            'In Progress': 'Completed',
            'Completed': 'To-Do'
        };
        const newStatus = nextSubtaskStatus[currentStatus];

        // Optimistic Update
        const prevSubtasks = [...localSubtasks];
        const updatedSubtasks = localSubtasks.map(st =>
            (st.id === subtaskId || st._id === subtaskId) ? { ...st, status: newStatus } : st
        );
        setLocalSubtasks(updatedSubtasks);

        try {
            await api.put(`/tasks/${task.id}`, { subtasks: updatedSubtasks });
            onUpdate();
        } catch (err) {
            console.error('Failed to update subtask', err);
            setLocalSubtasks(prevSubtasks); // Revert
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;
        const newSubtask = { id: Date.now(), title: newSubtaskTitle, status: 'To-Do' };

        // Optimistic Update
        const prevSubtasks = [...localSubtasks];
        const updatedSubtasks = [...localSubtasks, newSubtask];
        setLocalSubtasks(updatedSubtasks);
        setNewSubtaskTitle('');

        try {
            await api.put(`/tasks/${task.id}`, { subtasks: updatedSubtasks });
            onUpdate();
        } catch (err) {
            console.error('Failed to add subtask', err);
            setLocalSubtasks(prevSubtasks); // Revert
        }
    };

    const handleCancel = async (e) => {
        e.stopPropagation(); // Prevent triggering other clicks if necessary
        if (!window.confirm("Are you sure you want to cancel this task?")) return;

        try {
            await api.put(`/tasks/${task.id}`, { status: 'Canceled' });
            onUpdate();
        } catch (err) {
            console.error('Failed to cancel task', err);
            alert('Failed to cancel task');
        }
    };

    const statusColors = {
        'To-Do': 'var(--warning-color)',
        'In Progress': '#3498db',
        'Completed': 'var(--success-color)',
        'Canceled': '#e74c3c' // Red color for Canceled
    };

    return (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '15px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{task.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                    {/* Cancel Button for Sender */}
                    {isSent && task.status !== 'Completed' && task.status !== 'Canceled' && (
                        <button
                            onClick={handleCancel}
                            style={{
                                background: 'transparent',
                                border: '1px solid #e74c3c',
                                color: '#e74c3c',
                                padding: '3px 8px',
                                borderRadius: '15px',
                                cursor: 'pointer',
                                fontSize: '0.7rem'
                            }}
                        >
                            Cancel Task
                        </button>
                    )}

                    <div
                        onClick={handleStatusClick}
                        style={{
                            padding: '5px 10px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            background: statusColors[localStatus] || 'grey',
                            cursor: isSent ? 'default' : 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        {localStatus}
                    </div>
                </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>{task.description}</p>

            {/* Subtasks Display */}
            <div style={{ marginTop: '15px', marginBottom: '10px' }}>
                <h5 style={{ marginBottom: '10px', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>Subtasks</h5>
                {localSubtasks.length === 0 && <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }}>No subtasks</p>}
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {localSubtasks.map(st => (
                        <li key={st.id || st._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '5px 10px', marginBottom: '5px', borderRadius: '5px' }}>
                            <span style={{ fontSize: '0.9rem', textDecoration: st.status === 'Completed' ? 'line-through' : 'none', color: st.status === 'Completed' ? 'rgba(255,255,255,0.5)' : 'white' }}>{st.title}</span>
                            <span
                                onClick={() => handleSubtaskStatusChange(st.id || st._id, st.status)}
                                style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    background: statusColors[st.status] || 'grey',
                                    cursor: isSent ? 'default' : 'pointer',
                                    userSelect: 'none'
                                }}
                            >
                                {st.status}
                            </span>
                        </li>
                    ))}
                </ul>

                {/* Add Subtask for Receiver */}
                {!isSent && task.status !== 'Completed' && task.status !== 'Canceled' && (
                    <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                        <input
                            placeholder="Add subtask..."
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(); }}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                padding: '5px 10px',
                                borderRadius: '5px',
                                flex: 1,
                                fontSize: '0.8rem'
                            }}
                        />
                        <button
                            onClick={handleAddSubtask}
                            style={{
                                background: 'var(--primary-color)',
                                border: 'none',
                                color: 'white',
                                padding: '5px 10px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            +
                        </button>
                    </div>
                )}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                {isSent ? `To: ${task.receiver_name}` : `From: ${task.sender_name}`}
                <span style={{ marginLeft: '10px' }}>Created: {new Date(task.created_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                {task.due_date && <span style={{ marginLeft: '10px' }}>Due: {new Date(task.due_date).toLocaleDateString('en-US', { timeZone: 'Asia/Colombo', year: 'numeric', month: 'short', day: 'numeric' })}</span>}
                {task.completed_at && <div style={{ color: 'var(--success-color)', marginTop: '5px' }}>Completed: {new Date(task.completed_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
            </div>
        </div>
    );
};

export default TaskCard;
