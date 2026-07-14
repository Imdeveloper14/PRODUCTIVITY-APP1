import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function DailyWorkStatusView({ user, triggerToast }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours_worked: 8,
    details: '',
    issues: '',
    next_plans: ''
  });

  // Manager comment input state
  const [managerComments, setManagerComments] = useState({});

  const fetchRecords = async () => {
    setLoading(true);
    let fetched = false;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('daily_work_status')
          .select('*')
          .order('date', { ascending: false });
        if (!error && data) {
          setRecords(data);
          fetched = true;
        }
      } catch (err) {
        console.error("Supabase fetch daily_work_status error:", err);
      }
    }
    if (!fetched) {
      const saved = localStorage.getItem('aura_timesheets_v7');
      if (saved) {
        setRecords(JSON.parse(saved));
      } else {
        setRecords([
          { id: 'ts1', date: '2026-06-26', hours_worked: 8, details: 'Created Revit 3D structural model assembly', issues: 'Laptop lag with large Revit models', next_plans: 'Complete warehouse trusses revision', manager_comments: 'Excellent work, Ashok. Try using the server station for heavy assemblies.' },
          { id: 'ts2', date: '2026-06-25', hours_worked: 7.5, details: 'Fitted mechanical tooling parts in SolidWorks', issues: 'Tolerances mismatch', next_plans: 'Site sync meeting with Zenith Mechanical', manager_comments: '' }
        ]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.details) return alert("Please fill in the work details.");

    const record = {
      date: form.date,
      hours_worked: parseFloat(form.hours_worked) || 8,
      details: form.details,
      issues: form.issues,
      next_plans: form.next_plans,
      user_id: user?.id || null,
      username: user?.username || 'guest',
      full_name: user?.name || 'Guest User',
      manager_comments: ''
    };

    let saved = false;
    if (supabase && user?.id) {
      try {
        const { data, error } = await supabase
          .from('daily_work_status')
          .insert([record])
          .select();
        if (!error && data) {
          setRecords(prev => [data[0], ...prev]);
          saved = true;
        } else {
          console.error("Supabase daily_work_status save error:", error);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!saved) {
      const added = { ...record, id: 'ts_' + Date.now() };
      const updated = [added, ...records];
      setRecords(updated);
      localStorage.setItem('aura_timesheets_v7', JSON.stringify(updated));
    }

    triggerToast("Timesheet record saved successfully.");
    setForm({
      date: new Date().toISOString().split('T')[0],
      hours_worked: 8,
      details: '',
      issues: '',
      next_plans: ''
    });
  };

  const handleAddComment = async (recordId) => {
    const comment = managerComments[recordId];
    if (!comment) return;

    let saved = false;
    if (supabase && !String(recordId).startsWith('ts_')) {
      try {
        const { error } = await supabase
          .from('daily_work_status')
          .update({ manager_comments: comment })
          .eq('id', recordId);
        if (!error) saved = true;
      } catch (err) {
        console.error(err);
      }
    }

    const updated = records.map(r => r.id === recordId ? { ...r, manager_comments: comment } : r);
    setRecords(updated);
    if (!saved) {
      localStorage.setItem('aura_timesheets_v7', JSON.stringify(updated));
    }
    
    setManagerComments(prev => ({ ...prev, [recordId]: '' }));
    triggerToast("Manager comment added.");
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Timesheet Tracker</span>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>Daily Work Status</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Form to submit daily work status */}
        <div className="card" style={{ margin: 0, height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '750', marginBottom: '18px', color: 'var(--text-primary)' }}>📝 Submit Work Status</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Hours Worked</label>
                <input type="number" step="0.5" className="form-input" value={form.hours_worked} onChange={(e) => setForm({ ...form, hours_worked: parseFloat(e.target.value) || 8 })} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Details of Work Done *</label>
              <textarea className="form-input" rows="3" placeholder="Describe projects and tasks worked on..." value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Issues / Blockers Encountered</label>
              <textarea className="form-input" rows="2" placeholder="List any design errors, hardware lag, client revision delays..." value={form.issues} onChange={(e) => setForm({ ...form, issues: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Plans for Tomorrow</label>
              <textarea className="form-input" rows="2" placeholder="Tasks intended for tomorrow..." value={form.next_plans} onChange={(e) => setForm({ ...form, next_plans: e.target.value })} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', height: '40px', justifyContent: 'center' }}>
              Submit Work Status
            </button>
          </form>
        </div>

        {/* History of Work Statuses */}
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '750', marginBottom: '4px', color: 'var(--text-primary)' }}>📋 Log History</h3>
          
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading status logs...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
              {records.map(r => (
                <div key={r.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent)' }}>{r.date}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                      {r.hours_worked} hours • {r.full_name || r.username || 'Employee'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><strong>Tasks:</strong> {r.details}</div>
                    {r.issues && <div><strong>Blockers:</strong> <span style={{ color: 'var(--color-danger)' }}>{r.issues}</span></div>}
                    {r.next_plans && <div><strong>Next Plans:</strong> {r.next_plans}</div>}
                  </div>

                  {r.manager_comments ? (
                    <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid #10B981', borderRadius: '0 6px 6px 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <strong>Manager Comment:</strong> {r.manager_comments}
                    </div>
                  ) : (
                    (user?.role === 'Manager' || user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          placeholder="Add comment..." 
                          className="form-input" 
                          style={{ fontSize: '0.75rem', height: '32px', padding: '4px 8px' }}
                          value={managerComments[r.id] || ''}
                          onChange={(e) => setManagerComments({ ...managerComments, [r.id]: e.target.value })}
                        />
                        <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', minHeight: 'auto' }} onClick={() => handleAddComment(r.id)}>Reply</button>
                      </div>
                    )
                  )}
                </div>
              ))}
              {records.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No work status reports submitted yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
