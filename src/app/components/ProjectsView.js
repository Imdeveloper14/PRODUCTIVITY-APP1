import React, { useState } from 'react';
import { 
  FolderKanban, Search, Eye, Edit3, CheckCircle2, ArrowUpDown
} from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function ProjectsView({
  projects = [],
  setProjects,
  clients = [],
  user,
  projectSearch,
  setProjectSearch,
  projectFilterStatus,
  setProjectFilterStatus,
  projectSortOrder,
  setProjectSortOrder,
  triggerToast
}) {
  const [viewType, setViewType] = useState('grid'); // 'grid' | 'kanban'
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const statuses = ['Not Started', 'In Progress', 'QC Pending', 'QC Passed', 'Revision Required', 'Delivered', 'Completed', 'On Hold'];

  // Handle local submit of the Edit Project modal
  const handleUpdateProjectStatus = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    const pct = parseInt(editingProject.progress) || 0;
    if (pct < 0 || pct > 100) {
      alert("Completion percentage must be between 0 and 100.");
      return;
    }

    const qcPassedSelected = editingProject.qc_status === 'QC Passed' || editingProject.status === 'QC Passed';
    if (qcPassedSelected && pct !== 100) {
      alert("QC Passed cannot be selected unless completion is 100%.");
      return;
    }

    const deliveredSelected = editingProject.delivery_status === 'Delivered' || editingProject.status === 'Delivered';
    if (deliveredSelected && editingProject.qc_status !== 'QC Passed') {
      alert("Delivered cannot be selected unless project has QC Passed status.");
      return;
    }

    const completedSelected = editingProject.status === 'Completed';
    if (completedSelected && editingProject.delivery_status !== 'Delivered' && editingProject.qc_status !== 'QC Passed') {
      alert("Completed cannot be selected unless Delivered or QC Passed.");
      return;
    }

    const updateFields = {
      status: editingProject.status,
      progress: pct,
      qc_status: editingProject.qc_status || 'Not Checked',
      revision_count: parseInt(editingProject.revision_count) || 0,
      delivery_status: editingProject.delivery_status || 'Not Delivered',
      updated_at: new Date().toISOString()
    };

    let savedToSupabase = false;
    if (supabase && user?.id && !String(editingProject.id).startsWith('p_')) {
      try {
        const { error } = await supabase
          .from('projects')
          .update({
            status: updateFields.status,
            progress: updateFields.progress,
            qc_status: updateFields.qc_status,
            revision_count: updateFields.revision_count,
            delivery_status: updateFields.delivery_status,
            updated_at: updateFields.updated_at
          })
          .eq('id', editingProject.id);

        if (!error) {
          savedToSupabase = true;
        } else {
          console.error("Supabase project update error:", error);
        }
      } catch (err) {
        console.error("Supabase project update execution error:", err);
      }
    }

    const updated = projects.map(p => {
      if (p.id === editingProject.id) {
        return {
          ...p,
          ...updateFields,
          balanceAmount: p.quoteAmount - p.paidAmount
        };
      }
      return p;
    });

    setProjects(updated);
    if (!savedToSupabase) {
      localStorage.setItem("aura_projects_v7", JSON.stringify(updated));
    }
    setShowEditModal(false);
    setEditingProject(null);
    triggerToast("Project status updated successfully.");
  };

  // Filter & Sort Logic
  const filtered = projects.filter(p => {
    const client = clients.find(c => c.id === p.clientId);
    const clientName = client ? client.name.toLowerCase() : '';
    const clientCompany = client ? client.company.toLowerCase() : '';
    const titleMatch = p.title.toLowerCase().includes(projectSearch.toLowerCase());
    const clientMatch = clientName.includes(projectSearch.toLowerCase()) || clientCompany.includes(projectSearch.toLowerCase());
    const searchMatch = titleMatch || clientMatch;
    const statusMatch = projectFilterStatus === 'All' || p.status === projectFilterStatus;
    return searchMatch && statusMatch;
  });

  if (projectSortOrder === 'Deadline') {
    filtered.sort((a, b) => new Date(a.deadline || '') - new Date(b.deadline || ''));
  } else if (projectSortOrder === 'Progress') {
    filtered.sort((a, b) => b.progress - a.progress);
  }

  const handleEditClick = (p) => {
    setEditingProject({ ...p });
    setShowEditModal(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Engineering Deliverables</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>Active Projects</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button 
            className="btn" 
            style={{ padding: '6px 12px', fontSize: '0.8rem', background: viewType === 'grid' ? 'var(--accent)' : 'none', border: 'none', color: '#F5F5F5', minHeight: '30px' }}
            onClick={() => setViewType('grid')}
          >
            Grid Table
          </button>
          <button 
            className="btn" 
            style={{ padding: '6px 12px', fontSize: '0.8rem', background: viewType === 'kanban' ? 'var(--accent)' : 'none', border: 'none', color: '#F5F5F5', minHeight: '30px' }}
            onClick={() => setViewType('kanban')}
          >
            Kanban Board
          </button>
        </div>
      </div>

      {/* Project Filters Toolbar */}
      <div className="card" style={{ background: 'var(--bg-sidebar)', padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', borderLeft: '3px solid var(--accent)', margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search projects by title or client..." 
            value={projectSearch} 
            onChange={(e) => setProjectSearch(e.target.value)} 
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', width: '100%', color: 'var(--text-primary)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select 
            className="btn btn-secondary" 
            style={{ fontSize: '0.85rem', padding: '6px 12px', border: '1px solid var(--border-color)' }}
            value={projectFilterStatus} 
            onChange={(e) => setProjectFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Sort Filter */}
          <select 
            className="btn btn-secondary" 
            style={{ fontSize: '0.85rem', padding: '6px 12px', border: '1px solid var(--border-color)' }}
            value={projectSortOrder} 
            onChange={(e) => setProjectSortOrder(e.target.value)}
          >
            <option value="None">No Sorting</option>
            <option value="Deadline">Sort by Deadline</option>
            <option value="Progress">Sort by Progress</option>
          </select>
        </div>
      </div>

      {viewType === 'grid' ? (
        /* Database Grid Table View */
        filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No projects found matching the criteria.
          </div>
        ) : (
          <div className="card desktop-table-container" style={{ padding: 0, overflowX: 'auto', marginTop: '24px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Client Partner</th>
                  <th>CAD Architecture</th>
                  <th>Progress Tracker</th>
                  <th>Deadline</th>
                  <th style={{ textAlign: 'right' }}>Budget Amount</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const client = clients.find(c => c.id === p.clientId);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>📁</span>
                          <strong>{p.title}</strong>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{client ? client.name : 'Unknown Client'}</td>
                      <td>
                        <span className="mono-num" style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                          {p.cadType || 'AutoCAD 2D'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="mono-num" style={{ fontSize: '0.75rem', fontWeight: '600', width: '32px' }}>{p.progress}%</span>
                          <div style={{ flex: 1, minWidth: '80px', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${p.progress}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{p.deadline || 'No Date'}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }} className="mono-num">₹{(p.quoteAmount || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${p.status === 'Completed' || p.status === 'Delivered' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                          {p.status || 'In Progress'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleEditClick(p)}>
                          <Edit3 size={12} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Kanban Board View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '24px' }}>
          {['In Progress', 'QC Pending', 'QC Passed', 'Revision Required', 'Delivered', 'Completed', 'On Hold'].map(colStatus => {
            const colProjects = filtered.filter(p => p.status === colStatus);
            return (
              <div key={colStatus} className="card" style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', margin: 0, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: '750', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{colStatus}</span>
                  <span className="badge" style={{ background: 'var(--border-color)', color: 'var(--text-secondary)' }}>{colProjects.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
                  {colProjects.map(p => {
                    const client = clients.find(c => c.id === p.clientId);
                    return (
                      <div key={p.id} className="card" style={{ margin: 0, padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{client ? client.name : 'Unknown'}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: '600' }}>{p.cadType}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{p.progress}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
                          <div style={{ width: `${p.progress}%`, height: '100%', background: 'var(--accent)' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '0.7rem', minHeight: 'auto' }} onClick={() => handleEditClick(p)}>Edit</button>
                        </div>
                      </div>
                    );
                  })}
                  {colProjects.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '40px', fontStyle: 'italic' }}>Empty Column</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>📁 Edit Project Status</h3>
            <form onSubmit={handleUpdateProjectStatus}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input type="text" className="form-input" value={editingProject.title} readOnly style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input" 
                    value={editingProject.status || 'In Progress'} 
                    onChange={(e) => setEditingProject({...editingProject, status: e.target.value})}
                    required
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">QC Status</label>
                  <select 
                    className="form-input" 
                    value={editingProject.qc_status || 'Not Checked'} 
                    onChange={(e) => setEditingProject({...editingProject, qc_status: e.target.value})}
                  >
                    <option value="Not Checked">Not Checked</option>
                    <option value="QC Pending">QC Pending</option>
                    <option value="QC Passed">QC Passed</option>
                    <option value="QC Failed">QC Failed</option>
                    <option value="Revision Required">Revision Required</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Revision Count</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input" 
                    value={editingProject.revision_count || 0} 
                    onChange={(e) => setEditingProject({...editingProject, revision_count: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Status</label>
                  <select 
                    className="form-input" 
                    value={editingProject.delivery_status || 'Not Delivered'} 
                    onChange={(e) => setEditingProject({...editingProject, delivery_status: e.target.value})}
                  >
                    <option value="Not Delivered">Not Delivered</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Progress / Completion Percentage ({editingProject.progress}%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5" 
                    style={{ flex: 1 }}
                    value={editingProject.progress} 
                    onChange={(e) => setEditingProject({...editingProject, progress: parseInt(e.target.value) || 0})} 
                  />
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="form-input"
                    style={{ width: '80px' }}
                    value={editingProject.progress} 
                    onChange={(e) => setEditingProject({...editingProject, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))})} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowEditModal(false); setEditingProject(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
