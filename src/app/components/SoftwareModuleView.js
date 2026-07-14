import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function SoftwareModuleView({ triggerToast }) {
  const [tasks, setTasks] = useState([
    { id: 's1', title: 'Implement Three.js model viewer webgl component', status: 'In Progress', estimated: 12, actual: 8, repo: 'github.com/aura/webgl-viewer' },
    { id: 's2', title: 'DB schema migration for user departments & designations', status: 'QA', estimated: 4, actual: 5, repo: 'github.com/aura/db-service' },
    { id: 's3', title: 'Integrate Supabase Auth token verification middleware', status: 'To Do', estimated: 6, actual: 0, repo: '' },
    { id: 's4', title: 'Create jsPDF autotable invoice styling script', status: 'Completed', estimated: 8, actual: 7.5, repo: 'github.com/aura/pdf-service' }
  ]);

  const [repoLink, setRepoLink] = useState('');
  const [selectedTask, setSelectedTask] = useState('s1');

  const handleLinkRepo = (e) => {
    e.preventDefault();
    if (!repoLink) return;
    setTasks(prev => prev.map(t => t.id === selectedTask ? { ...t, repo: repoLink } : t));
    triggerToast("Repository linked to development ticket successfully.");
    setRepoLink('');
  };

  const handleUpdateStatus = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    triggerToast(`Ticket status changed to ${newStatus}.`);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Engineering Sprint</span>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>Software Module Development Console</h1>
      </div>

      {/* KPI stats */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL SPRINT ESTIMATE</span>
            <span>⏳ hours</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>
            {tasks.reduce((sum, t) => sum + t.estimated, 0)} Hours
          </span>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>ACTUAL HOURS SPENT</span>
            <span style={{ color: 'var(--accent)', fontWeight: '700' }}>🔥 BURNDOWN</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>
            {tasks.reduce((sum, t) => sum + t.actual, 0)} Hours
          </span>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>COMPLETED TICKETS</span>
            <span style={{ color: '#10B981', fontWeight: '700' }}>✓ SUCCESS</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>
            {tasks.filter(t => t.status === 'Completed').length} / {tasks.length} Done
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Kanban development board */}
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '750', color: 'var(--text-primary)', margin: 0 }}>📋 Sprint Priorities Board</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.map(t => (
              <div key={t.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px' }}>{t.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Est: <strong>{t.estimated}h</strong> / Act: <strong>{t.actual}h</strong>
                  </div>
                  
                  {/* Ticket actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select 
                      value={t.status} 
                      onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                      style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.7rem', padding: '2px 4px', borderRadius: '4px' }}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="QA">QA</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                {t.repo && (
                  <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--accent)', background: 'rgba(215, 38, 61, 0.05)', padding: '4px 8px', borderRadius: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    🔗 Repo: {t.repo}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Code Link Integrations Form */}
        <div className="card" style={{ margin: 0, height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '750', marginBottom: '14px', color: 'var(--text-primary)' }}>🛠️ Code Integration Hub</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Link specific GitHub repositories, branches, or PRs directly to active development tickets.
          </p>

          <form onSubmit={handleLinkRepo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Select Sprint Ticket</label>
              <select className="form-input" value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title.slice(0, 45)}...</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Repository / Pull Request Link</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="github.com/org/repo/pull/1" 
                value={repoLink} 
                onChange={(e) => setRepoLink(e.target.value)} 
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', height: '36px' }}>
              Link Repository URL
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
