import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from './api.js';

const blankTask = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' };
const statusNames = { todo: 'To do', 'in-progress': 'In progress', completed: 'Completed' };

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await apiRequest(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) });
      onAuthenticated(result);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }
  return <main className="auth-layout"><section className="auth-story"><a className="brand" href="#home"><span className="brand-mark">✓</span> TaskFlow</a><div><span className="eyebrow">MAKE SPACE FOR WHAT MATTERS</span><h1>Good work starts with a clear mind.</h1><p>Bring your day into focus, one task at a time.</p></div><span className="story-foot">A little progress adds up.</span></section><section className="auth-panel"><div className="auth-form"><span className="eyebrow">YOUR PERSONAL WORKSPACE</span><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="muted">{mode === 'login' ? 'Sign in to pick up where you left off.' : 'Start organizing your day with TaskFlow.'}</p><form onSubmit={submit}>
    {mode === 'register' && <label>Full name<input autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength="2" maxLength="80" /></label>}
    <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
    <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength="8" /></label>
    {error && <p className="error" role="alert">{error}</p>}<button className="button primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button>
    </form><p className="switch-copy">{mode === 'login' ? 'New to TaskFlow?' : 'Already have an account?'} <button className="link-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p></div></section></main>;
}

function TaskEditor({ task, onSave, onCancel, busy }) {
  const [form, setForm] = useState(task || blankTask);
  const [error, setError] = useState('');
  async function submit(event) { event.preventDefault(); setError(''); try { await onSave({ ...form, dueDate: form.dueDate || null }); } catch (e) { setError(e.message); } }
  return <form className="editor" onSubmit={submit}><div className="editor-title"><div><span className="eyebrow">TASK DETAILS</span><h2>{task ? 'Edit task' : 'A new task'}</h2></div><button type="button" className="icon-button" onClick={onCancel} aria-label="Close">×</button></div>
    <label>Task name<input autoFocus required maxLength="120" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to get done?" /></label>
    <label>Notes <span className="optional">(optional)</span><textarea rows="3" maxLength="2000" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add a few details…" /></label>
    <div className="form-row"><label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label></div>
    <label>Due date <span className="optional">(optional)</span><input type="date" value={form.dueDate ? String(form.dueDate).slice(0, 10) : ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
    {error && <p className="error" role="alert">{error}</p>}<div className="editor-actions"><button className="button secondary" type="button" onClick={onCancel}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : task ? 'Save changes' : 'Add task'}</button></div></form>;
}

function TaskCard({ task, onEdit, onDelete, onToggle }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString()) && task.status !== 'completed';
  return <article className={`task-card ${task.status === 'completed' ? 'is-complete' : ''}`}><button className={`check ${task.status === 'completed' ? 'checked' : ''}`} onClick={() => onToggle(task)} aria-label={task.status === 'completed' ? 'Mark as to do' : 'Mark as completed'}>{task.status === 'completed' ? '✓' : ''}</button><div className="task-copy"><div className="task-title"><h3>{task.title}</h3><span className={`priority ${task.priority}`}>{task.priority}</span></div>{task.description && <p className="description">{task.description}</p>}<div className="task-meta"><span className={`status ${task.status}`}>{statusNames[task.status]}</span>{task.dueDate && <span className={overdue ? 'due overdue' : 'due'}>{overdue ? 'Overdue · ' : 'Due · '}{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}</div></div><div className="task-actions"><button className="icon-button" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}>✎</button><button className="icon-button delete" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>⌫</button></div></article>;
}

function Dashboard({ user, token, onLogout }) {
  const [tasks, setTasks] = useState([]); const [loading, setLoading] = useState(true); const [pageError, setPageError] = useState('');
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all'); const [editor, setEditor] = useState(undefined); const [saving, setSaving] = useState(false);
  async function loadTasks() { try { const result = await apiRequest('/tasks', { token }); setTasks(result.tasks); setPageError(''); } catch (e) { setPageError(e.message); if (e.message === 'Authentication is required.') onLogout(); } finally { setLoading(false); } }
  useEffect(() => { loadTasks(); }, [token]);
  const counts = useMemo(() => ({ all: tasks.length, active: tasks.filter((t) => t.status !== 'completed').length, done: tasks.filter((t) => t.status === 'completed').length, high: tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length }), [tasks]);
  const visible = useMemo(() => tasks.filter((t) => (filter === 'all' || t.status === filter) && `${t.title} ${t.description}`.toLowerCase().includes(query.trim().toLowerCase())), [tasks, filter, query]);
  async function saveTask(values) { setSaving(true); try { const editing = Boolean(editor); await apiRequest(editing ? `/tasks/${editor._id}` : '/tasks', { token, method: editing ? 'PATCH' : 'POST', body: JSON.stringify(values) }); setEditor(undefined); await loadTasks(); } finally { setSaving(false); } }
  async function toggleTask(task) { try { await apiRequest(`/tasks/${task._id}`, { token, method: 'PATCH', body: JSON.stringify({ status: task.status === 'completed' ? 'todo' : 'completed' }) }); await loadTasks(); } catch (e) { setPageError(e.message); } }
  async function deleteTask(task) { if (!window.confirm(`Delete “${task.title}”?`)) return; try { await apiRequest(`/tasks/${task._id}`, { token, method: 'DELETE' }); await loadTasks(); } catch (e) { setPageError(e.message); } }
  const stats = [['All tasks', counts.all, 'in your workspace', 'lavender'], ['In progress', counts.active, 'ready for your focus', 'blue'], ['Completed', counts.done, 'nice work so far', 'green'], ['High priority', counts.high, 'needs attention', 'peach']];
  return <div className="dashboard-shell"><header className="topbar"><a href="#top" className="brand"><span className="brand-mark">✓</span> TaskFlow</a><div className="topbar-user"><span>{user.name}</span><button className="avatar" onClick={onLogout} aria-label="Sign out">{user.name?.slice(0, 1).toUpperCase() || 'U'}</button><button className="link-button" onClick={onLogout}>Sign out</button></div></header>
    <main className="dashboard" id="top"><section className="welcome-row"><div><span className="eyebrow">YOUR SPACE</span><h1>Let’s make today count<span className="accent">.</span></h1><p className="muted">A little focus goes a long way, {user.name?.split(' ')[0] || 'friend'}.</p></div><button className="button primary" onClick={() => setEditor(null)}>＋ New task</button></section>
      <section className="stats-grid" aria-label="Task statistics">{stats.map(([label, value, caption, color]) => <article className="stat-card" key={label}><span className={`stat-icon ${color}`}>{label === 'Completed' ? '✓' : label === 'In progress' ? '◷' : label === 'High priority' ? '↗' : '▤'}</span><span className="stat-label">{label}</span><strong>{value}</strong><span className="stat-caption">{caption}</span></article>)}</section>
      <section className="tasks-section"><div className="tasks-heading"><div><span className="eyebrow">THE GAME PLAN</span><h2>Your tasks <span className="task-count">{visible.length}</span></h2></div><label className="search-box"><span>⌕</span><input aria-label="Search tasks" placeholder="Search tasks" value={query} onChange={(e) => setQuery(e.target.value)} /></label></div>
        <div className="task-toolbar"><div className="filters" role="tablist" aria-label="Filter tasks">{[['all', 'All tasks'], ['todo', 'To do'], ['in-progress', 'In progress'], ['completed', 'Completed']].map(([value, label]) => <button key={value} role="tab" aria-selected={filter === value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><button className="button secondary add-small" onClick={() => setEditor(null)}>＋ Add task</button></div>
        {pageError && <div className="notice" role="alert">{pageError}<button onClick={() => setPageError('')} aria-label="Dismiss">×</button></div>}
        <div className="task-list">{loading ? <div className="empty-state">Loading your tasks…</div> : visible.length ? visible.map((task) => <TaskCard key={task._id} task={task} onEdit={setEditor} onDelete={deleteTask} onToggle={toggleTask} />) : <div className="empty-state"><span className="empty-icon">✦</span><h3>{query ? 'No matching tasks' : filter === 'all' ? 'A fresh start' : `Nothing ${statusNames[filter]?.toLowerCase()} yet`}</h3><p>{query ? 'Try another search term.' : 'Add a task to give your day some direction.'}</p>{filter === 'all' && !query && <button className="button primary" onClick={() => setEditor(null)}>Create your first task</button>}</div>}</div>
      </section><footer className="dashboard-footer">One thing at a time. You’ve got this.</footer>
    </main>
    {editor !== undefined && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditor(undefined); }}><section className="modal" role="dialog" aria-modal="true" aria-label={editor ? 'Edit task' : 'Create task'}><TaskEditor key={editor?._id || 'new'} task={editor ? { ...editor, dueDate: editor.dueDate ? String(editor.dueDate).slice(0, 10) : '' } : null} onSave={saveTask} onCancel={() => setEditor(undefined)} busy={saving} /></section></div>}
  </div>;
}

export default function App() {
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem('taskflow-session')) || null; } catch { return null; } });
  function authenticate(result) { const next = { token: result.token, user: result.user }; localStorage.setItem('taskflow-session', JSON.stringify(next)); setSession(next); }
  function logout() { localStorage.removeItem('taskflow-session'); setSession(null); }
  return session?.token ? <Dashboard token={session.token} user={session.user} onLogout={logout} /> : <AuthScreen onAuthenticated={authenticate} />;
}
