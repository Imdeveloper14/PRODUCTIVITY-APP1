import React, { useState, useEffect } from 'react';
import DatabaseHealthCheck from './DatabaseHealthCheck';

export default function AdminView({
  user,
  adminUsers = [],
  adminLogs = [],
  adminLoading = false,
  handleUpdateUserStatus,
  fetchAdminUsers,
  fetchAdminLogs,
  triggerToast,
  supabase
}) {
  const [adminActiveSubTab, setAdminActiveSubTab] = useState('Pending'); // 'Pending' | 'Approved' | 'Rejected' | 'Disabled' | 'AuditLogs' | 'Diagnostics'
  const [viewingUserDetails, setViewingUserDetails] = useState(null);
  
  // Admin approval form modal states
  const [approvingUser, setApprovingUser] = useState(null);
  const [approveRole, setApproveRole] = useState('Employee');
  const [approveDept, setApproveDept] = useState('Naval Architecture');
  const [approveDesignation, setApproveDesignation] = useState('Design Engineer');
  const [approveEmpId, setApproveEmpId] = useState('');
  const [approveIsManualId, setApproveIsManualId] = useState(false);
  const [approveManager, setApproveManager] = useState('');

  // Auto trigger fetching on tab activation
  useEffect(() => {
    fetchAdminUsers();
    fetchAdminLogs();
  }, [adminActiveSubTab]);

  const handleStartUserApproval = (targetUser) => {
    const nextNum = adminUsers.length + 1;
    const autoId = 'AURA-' + String(nextNum).padStart(4, '0');
    
    setApprovingUser(targetUser);
    setApproveRole('Employee');
    setApproveDept('Naval Architecture');
    setApproveDesignation('Design Engineer');
    setApproveEmpId(autoId);
    setApproveIsManualId(false);
    setApproveManager('');
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approvingUser) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: approvingUser.id,
          newStatus: 'Approved',
          newRole: approveRole,
          department: approveDept,
          designation: approveDesignation,
          employee_id: approveEmpId,
          reporting_manager: approveManager
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Account for ${approvingUser.first_name} has been approved and activated!`);
        setApprovingUser(null);
        fetchAdminUsers();
        fetchAdminLogs();
      } else {
        alert(`Failed to approve user: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error approving user.");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ background: 'rgba(255,255,255,0.04)', marginBottom: '24px', margin: 0 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>🛡️ Administrative Controls</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', margin: 0 }}>
          Manage user access approvals, roles, status changes, and track system security audit logs.
        </p>
      </div>

      {/* Admin Management Sub-Tabs */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px', marginTop: '24px', margin: 0 }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
          {['Pending', 'Approved', 'Rejected', 'Disabled', 'AuditLogs', 'Diagnostics'].map((subTab) => {
            const filteredCount = adminUsers.filter(u => u.status === subTab).length;
            let label = `${subTab} (${filteredCount})`;
            if (subTab === 'AuditLogs') label = '📋 Audit Logs';
            if (subTab === 'Diagnostics') label = '⚙️ System Diagnostics';
            return (
              <button
                key={subTab}
                className="btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: adminActiveSubTab === subTab ? 'var(--accent)' : 'transparent',
                  color: adminActiveSubTab === subTab ? 'white' : 'var(--text-secondary)',
                  fontWeight: adminActiveSubTab === subTab ? '600' : 'normal',
                  cursor: 'pointer'
                }}
                onClick={() => setAdminActiveSubTab(subTab)}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Main Panel Content */}
        <div style={{ marginTop: '20px' }}>
          {adminLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>Loading administrative data...</p>
          ) : adminActiveSubTab === 'Diagnostics' ? (
            <DatabaseHealthCheck supabase={supabase} />
          ) : adminActiveSubTab === 'AuditLogs' ? (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>System Security & Event History</h3>
              
              {/* Desktop View Table */}
              <div className="desktop-table-container" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Timestamp</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Event Type</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Target User</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Actor</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit events logged.</td>
                      </tr>
                    ) : (
                      adminLogs.map((log) => {
                        let badgeColor = 'var(--text-secondary)';
                        let badgeBg = 'rgba(255,255,255,0.06)';
                        if (log.event_type.includes('success')) {
                          badgeColor = '#166534';
                          badgeBg = '#DCFCE7';
                        } else if (log.event_type.includes('failed') || log.event_type.includes('rejected')) {
                          badgeColor = '#991B1B';
                          badgeBg = '#FEE2E2';
                        } else if (log.event_type.includes('approved')) {
                          badgeColor = '#155E75';
                          badgeBg = '#ECFEFF';
                        }

                        return (
                          <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', color: badgeColor, background: badgeBg }}>
                                {log.event_type}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', fontWeight: '500', color: 'var(--text-primary)' }}>
                              {log.email} {log.username !== 'unknown' && `(${log.username})`}
                            </td>
                            <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{log.actor}</td>
                            <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{log.details}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>{adminActiveSubTab} Access Accounts</h3>
              
              {/* Desktop View Table */}
              <div className="desktop-table-container" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>User Details</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Department</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Designation</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Registered</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.filter(u => u.status === adminActiveSubTab).length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No users found in this category.
                        </td>
                      </tr>
                    ) : (
                      adminUsers.filter(u => u.status === adminActiveSubTab).map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.first_name} {item.last_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{item.username} • {item.email}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {item.mobile_number} {item.employee_id && `• Emp ID: ${item.employee_id}`}</div>
                            
                            {/* Role Select Dropdown */}
                            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role:</span>
                              <select 
                                value={item.role || 'Employee'} 
                                onChange={(e) => handleUpdateUserStatus(item.id, item.status, e.target.value)}
                                style={{ padding: '2px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                              >
                                <option value="Employee">Employee</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin</option>
                                <option value="SuperAdmin">SuperAdmin</option>
                              </select>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', color: 'var(--text-primary)' }}>{item.department}</td>
                          <td style={{ padding: '12px 8px', color: 'var(--text-primary)' }}>{item.designation}</td>
                          <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            {adminActiveSubTab === 'Pending' && (
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button
                                  className="btn btn-primary"
                                  style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                                  onClick={() => handleStartUserApproval(item)}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn"
                                  style={{ background: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                                  onClick={() => handleUpdateUserStatus(item.id, 'Rejected')}
                                >
                                  Reject
                                </button>
                                <button
                                  className="btn"
                                  style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                                  onClick={() => setViewingUserDetails(item)}
                                >
                                  View Details
                                </button>
                              </div>
                            )}
                            {adminActiveSubTab === 'Approved' && (
                              <button
                                className="btn"
                                style={{ background: '#F59E0B', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={() => handleUpdateUserStatus(item.id, 'Disabled')}
                              >
                                Disable
                              </button>
                            )}
                            {(adminActiveSubTab === 'Rejected' || adminActiveSubTab === 'Disabled') && (
                              <button
                                className="btn btn-primary"
                                style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={() => handleStartUserApproval(item)}
                              >
                                Re-Enable & Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Approval Dialog Modal */}
      {approvingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '24px', width: '100%', maxWidth: '540px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ background: '#D32F45', padding: '24px', color: 'white' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>🛡️ Admin User Approval</h2>
              <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px', margin: 0 }}>
                Configure organizational role, department, and ID for {approvingUser.first_name} {approvingUser.last_name}
              </p>
            </div>

            <form onSubmit={handleApproveSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Employee Name</label>
                  <input
                    type="text"
                    disabled
                    value={`${approvingUser.first_name} ${approvingUser.last_name}`}
                    style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email</label>
                  <input
                    type="text"
                    disabled
                    value={approvingUser.email}
                    style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Role *</label>
                <select
                  value={approveRole}
                  onChange={(e) => setApproveRole(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  required
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Department *</label>
                  <select
                    value={approveDept}
                    onChange={(e) => setApproveDept(e.target.value)}
                    style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    required
                  >
                    {[
                      "Naval Architecture", "Marine Engineering", "Mechanical Engineering", 
                      "Structural Engineering", "Piping Engineering", "Electrical Engineering", 
                      "BIM / CAD", "Project Management", "Administration", "HR", "Finance", "IT"
                    ].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Designation *</label>
                  <select
                    value={approveDesignation}
                    onChange={(e) => setApproveDesignation(e.target.value)}
                    style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    required
                  >
                    {[
                      "Trainee", "Junior Engineer", "Design Engineer", "Senior Engineer", 
                      "Lead Engineer", "Project Engineer", "Project Manager", "Department Head", "Administrator"
                    ].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Employee ID *</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={approveIsManualId}
                      onChange={(e) => {
                        setApproveIsManualId(e.target.checked);
                        if (!e.target.checked) {
                          const nextNum = adminUsers.length + 1;
                          setApproveEmpId('AURA-' + String(nextNum).padStart(4, '0'));
                        }
                      }}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    Manual override
                  </label>
                </div>
                <input
                  type="text"
                  value={approveEmpId}
                  onChange={(e) => setApproveEmpId(e.target.value)}
                  disabled={!approveIsManualId}
                  style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: approveIsManualId ? 'white' : '#F8FAFC', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '600' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Reporting Manager</label>
                <select
                  value={approveManager}
                  onChange={(e) => setApproveManager(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                >
                  <option value="">None / Select Reporting Manager</option>
                  {adminUsers
                    .filter(u => u.role === 'Manager' || u.role === 'Admin' || u.role === 'SuperAdmin')
                    .map(u => (
                      <option key={u.id} value={`${u.first_name} ${u.last_name}`}>
                        {u.first_name} {u.last_name} ({u.role})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Employment Status</label>
                <input
                  type="text"
                  value="Active"
                  disabled
                  style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setApprovingUser(null)}
                  style={{ flex: 1, height: '44px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, height: '44px', border: 'none', borderRadius: '10px', background: '#D32F45', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(211, 47, 69, 0.3)' }}
                >
                  Approve User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Dialog Modal */}
      {viewingUserDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Registration Profile Details</h3>
              <button 
                onClick={() => setViewingUserDetails(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Full Name', value: `${viewingUserDetails.first_name} ${viewingUserDetails.last_name}` },
                { label: 'Username', value: `@${viewingUserDetails.username}` },
                { label: 'Email Address', value: viewingUserDetails.email },
                { label: 'Role / Level', value: viewingUserDetails.role || 'Employee', highlight: true },
                { label: 'Request Status', value: viewingUserDetails.status, statusBadge: true },
                { label: 'Registration Date', value: new Date(viewingUserDetails.created_at).toLocaleString() },
                { label: 'Department', value: viewingUserDetails.department || 'Not Assigned' },
                { label: 'Designation', value: viewingUserDetails.designation || 'Not Assigned' },
                { label: 'Employee ID', value: viewingUserDetails.employee_id || 'Not Assigned' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{item.label}</span>
                  {item.statusBadge ? (
                    <span style={{ fontWeight: '700', color: item.value === 'Approved' ? '#10B981' : item.value === 'Pending' ? '#F59E0B' : '#EF4444' }}>
                      {item.value}
                    </span>
                  ) : (
                    <span style={{ fontWeight: item.highlight ? '700' : '500', color: item.highlight ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={() => setViewingUserDetails(null)}
              style={{ width: '100%', height: '42px', marginTop: '20px', border: 'none', borderRadius: '8px', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer' }}
            >Close Details</button>
          </div>
        </div>
      )}
    </div>
  );
}
