import React from 'react';
import { 
  BrainCircuit, IndianRupee, AlertCircle, CheckCircle2, Clock, FolderKanban, Sparkles, Plus, Calendar, FileText
} from 'lucide-react';

export default function DashboardView({
  user,
  tasks = [],
  projects = [],
  invoices = [],
  meetings = [],
  birthdays = [],
  personalTasks = [],
  habits = [],
  hasPermission,
  setShowTaskModal,
  triggerNewInvoiceFlow,
  setShowClientModal,
  setActiveTab,
  triggerToast
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Handlers for quick navigation or triggers
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const highPriorityPendingTasksCount = tasks.filter(t => t.priority === 'High' && !t.completed).length;

  const totalRevenue = invoices.reduce((sum, i) => sum + i.grand_total, 0);
  const pendingPayments = invoices.filter(i => i.payment_status === 'Pending').reduce((sum, i) => sum + i.grand_total, 0);
  const paidToday = invoices.filter(i => i.payment_status === 'Paid').reduce((sum, i) => sum + i.grand_total, 0);
  const overdueCount = invoices.filter(i => i.payment_status === 'Overdue').length;

  // Personal tracker calculations
  const todayPersonalTasks = personalTasks.filter(pt => pt.due_date === todayStr);
  const pendingPersonalTasks = personalTasks.filter(pt => pt.status !== 'Done');
  const highestStreak = habits.reduce((max, h) => Math.max(max, h.streak_count || 0), 0);

  return (
    <div>
      {/* Header card with welcome message & Quick Actions */}
      <div className="card" style={{ background: 'var(--bg-sidebar)', marginBottom: '24px', padding: '24px', borderLeft: '4px solid var(--accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ minWidth: '200px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>AURA ERP OS</span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>👋 Welcome back,</h1>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>{user?.name || 'User'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>Engineering workspace dashboard overview</p>
          </div>
          
          {/* Quick Actions Toolbar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%', maxWidth: '500px' }}>
            <button className="btn btn-primary" style={{ flex: '1 1 120px', justifyContent: 'center', height: '40px', cursor: 'pointer', borderRadius: '8px' }} onClick={() => setShowTaskModal(true)}>
              ＋ Add Task
            </button>
            {hasPermission(user?.role, 'canViewInvoices') && (
              <button className="btn btn-secondary" style={{ flex: '1 1 120px', justifyContent: 'center', height: '40px', cursor: 'pointer', borderRadius: '8px' }} onClick={triggerNewInvoiceFlow}>
                💰 Invoice
              </button>
            )}
            {hasPermission(user?.role, 'canManageUsers') && (
              <button className="btn btn-secondary" style={{ flex: '1 1 120px', justifyContent: 'center', height: '40px', cursor: 'pointer', borderRadius: '8px' }} onClick={() => setShowClientModal(true)}>
                👤 New Client
              </button>
            )}
            <button className="btn btn-secondary" style={{ flex: '1 1 120px', justifyContent: 'center', height: '40px', cursor: 'pointer', borderRadius: '8px' }} onClick={() => { setActiveTab(user?.role === 'Employee' ? 'personal-tracker' : 'projects') }}>
              {user?.role === 'Employee' ? '🎯 Tracker' : '📄 Projects'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ fontSize: '0.85rem' }}>
            <strong>Today's Focus:</strong>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
              <span>✔ {completedTasksCount} Tasks Completed</span>
              <span>⏳ {pendingTasksCount} Pending</span>
              <span>🔥 {highPriorityPendingTasksCount} High Priority</span>
            </div>
          </div>
          <div style={{ background: 'rgba(215, 38, 61, 0.08)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(215, 38, 61, 0.25)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <BrainCircuit size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>AI prediction: Finish current drawings before 4 PM.</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {/* Financial KPIs - Only visible to Admins/SuperAdmins */}
        {hasPermission(user?.role, 'canViewRevenue') && (
          <>
            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL REVENUE</span>
                <IndianRupee size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
            </div>

            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PENDING PAYMENTS</span>
                <AlertCircle size={16} style={{ color: 'var(--color-danger)' }} />
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>₹{pendingPayments.toLocaleString('en-IN')}</span>
            </div>

            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PAID TODAY</span>
                <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>₹{paidToday.toLocaleString('en-IN')}</span>
            </div>

            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>OVERDUE INVOICES</span>
                <Clock size={16} style={{ color: 'var(--color-warning)' }} />
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{overdueCount}</span>
            </div>
          </>
        )}

        {/* Employee Productivity Widgets */}
        {user?.role === 'Employee' && (
          <>
            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>MY OPEN TASKS</span>
                <Clock size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{pendingTasksCount}</span>
            </div>
            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>COMPLETED TASKS</span>
                <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{completedTasksCount}</span>
            </div>
            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>MY ACTIVE PROJECTS</span>
                <FolderKanban size={16} style={{ color: 'var(--color-info)' }} />
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{projects.filter(p => p.status === 'In Progress').length}</span>
            </div>
          </>
        )}

        {/* Manager Operations Widgets */}
        {user?.role === 'Manager' && (
          <>
            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TEAM TASKS</span>
                <Clock size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{tasks.length}</span>
            </div>
            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>ACTIVE TEAM PROJECTS</span>
                <FolderKanban size={16} style={{ color: 'var(--color-info)' }} />
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{projects.filter(p => p.status === 'In Progress').length}</span>
            </div>
          </>
        )}

        {/* Shared General Stats */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{user?.role === 'Employee' ? 'MY PRODUCTIVITY' : 'TEAM PRODUCTIVITY'}</span>
            <CheckCircle2 size={16} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>92%</span>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>WORK STREAK</span>
            <Sparkles size={16} style={{ color: 'var(--color-warning)' }} />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>14 Days</span>
        </div>
      </div>

      {/* Personal Tracker KPI metrics (Employee view) */}
      {user?.role === 'Employee' && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)' }}>💖 Personal Tracker Summary</h3>
          <div className="grid-3">
            <div className="card" style={{ margin: 0, borderLeft: '4px solid #EC4899' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TODAY'S PERSONAL TASKS</span>
                <span style={{ fontSize: '1.2rem' }}>📝</span>
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{todayPersonalTasks.length}</span>
            </div>

            <div className="card" style={{ margin: 0, borderLeft: '4px solid #3B82F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PENDING PERSONAL WORK</span>
                <span style={{ fontSize: '1.2rem' }}>⏳</span>
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{pendingPersonalTasks.length}</span>
            </div>

            <div className="card" style={{ margin: 0, borderLeft: '4px solid #10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>HABITS STREAK RECORD</span>
                <span style={{ fontSize: '1.2rem' }}>🔥</span>
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{highestStreak} Days</span>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Projects List (Left) & Today's Schedule (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Project progress list */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>📁 Active Engineering Projects</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', minHeight: 'auto' }} onClick={() => setActiveTab('projects')}>View All</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {projects.slice(0, 4).map(p => (
              <div key={p.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.title}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{p.progress}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${p.progress}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Deadline: {p.deadline}</span>
                  <span>Type: {p.cadType}</span>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>No active projects.</p>
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>📅 Today's Schedule & Meetings</h3>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', minHeight: 'auto' }} onClick={() => setActiveTab('planner')}>Go to Planner</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Meetings list */}
            {meetings.filter(m => m.date === todayStr).map(m => (
              <div key={m.id} style={{ background: 'rgba(215, 38, 61, 0.06)', borderLeft: '3px solid var(--accent)', padding: '10px 12px', borderRadius: '0 8px 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>🤝 {m.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Notes: {m.notes || 'None'}</div>
                </div>
                <div className="mono-num" style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent)' }}>{m.time}</div>
              </div>
            ))}

            {/* Birthdays list */}
            {birthdays.filter(b => b.date === todayStr).map(b => (
              <div key={b.id} style={{ background: 'rgba(16, 185, 129, 0.06)', borderLeft: '3px solid #10B981', padding: '10px 12px', borderRadius: '0 8px 8px 0' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>🎂 Birthday: {b.name}</div>
              </div>
            ))}

            {/* Tasks list */}
            {tasks.slice(0, 4).map(t => (
              <div key={t.id} style={{ background: 'rgba(255,255,255,0.02)', borderLeft: t.completed ? '3px solid #10B981' : '3px solid var(--border-color)', padding: '10px 12px', borderRadius: '0 8px 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {t.title}
                  </span>
                </div>
                <span className={`badge ${t.completed ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                  {t.completed ? 'Completed' : 'Pending'}
                </span>
              </div>
            ))}

            {meetings.filter(m => m.date === todayStr).length === 0 && tasks.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>Your schedule is clear for today!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
