import React from 'react';
import api from '../api';
import EditTaskModal from './EditTaskModal';
import NotificationToast from './NotificationToast';

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
    const [showEditModal, setShowEditModal] = React.useState(false);

    // Sync local state when props change (e.g. from polling)
    React.useEffect(() => {
        console.log(`[DEBUG] TaskCard Syncing ${task.title} (Status: ${task.status})`);
        const sub = Array.isArray(task.subtasks) ? task.subtasks : (task.subtasks ? JSON.parse(task.subtasks) : []);
        console.log('[DEBUG] Incoming Subtasks from Props:', sub);

        setLocalStatus(task.status);
        setLocalSubtasks(sub);
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
        const updatedSubtasks = localSubtasks.map(st => {
            if (st.id === subtaskId || st._id === subtaskId) {
                const isCompleted = newStatus === 'Completed';
                return {
                    ...st,
                    status: newStatus,
                    completed_at: isCompleted ? new Date().toISOString() : null,
                };
            }
            return st;
        });
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
        const newSubtask = { id: Date.now(), title: newSubtaskTitle, status: 'To-Do', due_date: null, completed_at: null };

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

    const [showToast, setShowToast] = React.useState(false);

    const handleEditSuccess = () => {
        console.log('[DEBUG] Edit Success Handler Triggered');
        setShowEditModal(false); // Close Modal immediately
        setShowToast(true);      // Show Toast
        onUpdate();              // Refresh Data
    };

    return (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '15px', position: 'relative' }}>
            {showToast && (
                <NotificationToast
                    message="Successfully updated"
                    onClose={() => setShowToast(false)}
                />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{task.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                    {/* Edit & Cancel Buttons for Sender */}
                    {isSent && task.status !== 'Completed' && task.status !== 'Canceled' && (
                        <>
                            <button
                                onClick={() => setShowEditModal(true)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #3498db',
                                    color: '#3498db',
                                    padding: '3px 8px',
                                    borderRadius: '15px',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem'
                                }}
                            >
                                Edit
                            </button>
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
                        </>
                    )}

                    {showEditModal && (
                        <EditTaskModal
                            task={task}
                            onClose={() => { console.log('[DEBUG] Closing Edit Modal'); setShowEditModal(false); }}
                            onUpdate={handleEditSuccess}
                        />
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
                    {localSubtasks.map((st, index) => {
                        console.log(`[DEBUG] Rendering subtask ${index}:`, st);
                        return (
                            <li key={st.id || st._id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '5px 10px', marginBottom: '5px', borderRadius: '5px' }}>
                                <span style={{ fontSize: '0.9rem', textDecoration: st.status === 'Completed' ? 'line-through' : 'none', color: st.status === 'Completed' ? 'rgba(255,255,255,0.5)' : 'white' }}>
                                    {st.title}
                                    {st.due_date && <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>
                                        📅 {new Date(st.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>}
                                    {st.status === 'Completed' && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--success-color)', marginLeft: '8px', fontWeight: 'bold' }}>
                                            ✓ {st.completed_at ? new Date(st.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Just now'}
                                        </span>
                                    )}
                                </span>
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
                        );
                    })}
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

            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '10px' }}>
                <div style={{ marginBottom: '5px' }}>
                    {isSent ? (
                        <span>To: <span style={{ color: '#3498db', fontWeight: 'bold', background: 'rgba(52, 152, 219, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{task.receiver_name}</span></span>
                    ) : (
                        <span>From: <span style={{ color: '#e67e22', fontWeight: 'bold', background: 'rgba(230, 126, 34, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{task.sender_name}</span></span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <span>Created: {new Date(task.created_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>

                    {task.due_date && (
                        <span style={{ color: '#f1c40f', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            📅 Due: {new Date(task.due_date).toLocaleDateString('en-US', { timeZone: 'Asia/Colombo', year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                    )}

                    {task.completed_at && <span style={{ color: 'var(--success-color)' }}>Completed: {new Date(task.completed_at).toLocaleString('en-US', { timeZone: 'Asia/Colombo', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
