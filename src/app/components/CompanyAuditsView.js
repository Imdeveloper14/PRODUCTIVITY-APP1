import React, { useState } from 'react';

export default function CompanyAuditsView({ triggerToast }) {
  const [checklist, setChecklist] = useState([
    { id: 'c1', standard: 'ISO 9001:2015 Quality Management', item: 'Verify CAD design validation procedures and safety sign-offs', status: 'Compliant' },
    { id: 'c2', standard: 'ISO 27001:2022 Information Security', item: 'Check Supabase RLS policies and JWT encryption keys validation', status: 'Auditing' },
    { id: 'c3', standard: 'ISO 14001:2015 Environmental Security', item: 'Ensure office backup server energy efficiency configurations', status: 'Non-Compliant' }
  ]);

  const [actions, setActions] = useState([
    { id: 'a1', desc: 'Perform penetration test on Supabase endpoints', due: '2026-07-20', officer: 'IT Admin', status: 'Pending' },
    { id: 'a2', desc: 'Re-align project files directory structure and RLS', due: '2026-07-15', officer: 'Lead PM', status: 'In Progress' }
  ]);

  const handleUpdateChecklistStatus = (itemId, newStatus) => {
    setChecklist(prev => prev.map(item => item.id === itemId ? { ...item, status: newStatus } : item));
    triggerToast("Audit checklist status updated.");
  };

  const handleMarkActionResolved = (actionId) => {
    setActions(prev => prev.map(act => act.id === actionId ? { ...act, status: 'Resolved' } : act));
    triggerToast("Audit action parameter marked as resolved.");
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Compliance Operations</span>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>ISO Compliance & Quality Auditing</h1>
      </div>

      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>ISO COMPLIANCE RATE</span>
            <span style={{ color: '#10B981', fontWeight: '700' }}>✓ SECURE</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>85% Compliant</span>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PENDING AUDIT EVENTS</span>
            <span style={{ color: 'var(--color-warning)', fontWeight: '700' }}>⚠️ REVIEW</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>
            {checklist.filter(c => c.status === 'Auditing').length} Items
          </span>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>NON-COMPLIANCE ISSUES</span>
            <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>🚨 ALERT</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>
            {checklist.filter(c => c.status === 'Non-Compliant').length} Critical
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Audit checklist board */}
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '750', marginBottom: '16px', color: 'var(--text-primary)' }}>📋 Compliance Checklist</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {checklist.map(item => (
              <div key={item.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: '700' }}>{item.standard}</span>
                  <select 
                    value={item.status} 
                    onChange={(e) => handleUpdateChecklistStatus(item.id, e.target.value)}
                    style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.7rem', padding: '2px 4px', borderRadius: '4px' }}
                  >
                    <option value="Compliant">Compliant</option>
                    <option value="Auditing">Auditing</option>
                    <option value="Non-Compliant">Non-Compliant</option>
                  </select>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.item}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions Table */}
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '750', marginBottom: '16px', color: 'var(--text-primary)' }}>🛡️ Pending Action Parameters</h3>
          <div className="desktop-table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Action Description</th>
                  <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Due Date</th>
                  <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Officer</th>
                  <th style={{ padding: '8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <tr key={act.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px', color: 'var(--text-primary)' }}>{act.desc}</td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{act.due}</td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{act.officer}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      {act.status !== 'Resolved' ? (
                        <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem', minHeight: 'auto' }} onClick={() => handleMarkActionResolved(act.id)}>Resolve</button>
                      ) : (
                        <span style={{ color: '#10B981', fontWeight: '600' }}>Resolved ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
