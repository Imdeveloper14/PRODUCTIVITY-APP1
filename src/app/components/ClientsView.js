import React, { useState } from 'react';
import { 
  Users, Search, ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function ClientsView({
  clients = [],
  setClients,
  user,
  triggerToast,
  showClientModal,
  setShowClientModal,
  triggerNewProjectFlow
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 6;

  // New Client modal state
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', company: '', notes: '' });
  const [uploadedAgreementFiles, setUploadedAgreementFiles] = useState([]);
  const [fileValidationError, setFileValidationError] = useState('');

  // Handle local file validation and uploads
  const handleAgreementFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setFileValidationError('');
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    const maxSizeBytes = 10 * 1024 * 1024;
    let validFiles = [];
    for (let file of files) {
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
        setFileValidationError(`File format not supported: ${file.name}.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setFileValidationError(`File is too large: ${file.name}.`);
        return;
      }
      validFiles.push(file.name);
    }
    setUploadedAgreementFiles(validFiles);
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClient.name) return;

    let savedToSupabase = false;
    if (supabase) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        const record = {
          name: newClient.name,
          phone: newClient.phone || '',
          email: newClient.email || '',
          company: newClient.company || '',
          notes: newClient.notes || '',
          project_history: 'None yet',
          user_id: authUser?.id || user?.id || null
        };

        const { data, error } = await supabase
          .from('clients')
          .insert([record])
          .select();
        
        if (!error && data) {
          savedToSupabase = true;
          const inserted = data[0];
          setClients(prev => [...prev, { ...inserted, agreement_documents: uploadedAgreementFiles }]);
          triggerToast('Client successfully created in database.');
        } else {
          console.error('Supabase client insert error details:', error);
          triggerToast(`Database error: ${error?.message || 'Check connection'}`);
        }
      } catch (err) {
        console.error('Supabase client insertion exception:', err);
        triggerToast('Failed to insert client due to an issue.');
      }
    }

    if (!savedToSupabase) {
      const added = { ...newClient, id: 'c_' + Date.now(), projectHistory: 'None yet', agreement_documents: uploadedAgreementFiles };
      const updated = [...clients, added];
      setClients(updated);
      localStorage.setItem('aura_clients_v7', JSON.stringify(updated));
      triggerToast('Client saved locally.');
    }

    setNewClient({ name: '', phone: '', email: '', company: '', notes: '' });
    setUploadedAgreementFiles([]);
    setShowClientModal(false);
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(searchLower) ||
      (c.company && c.company.toLowerCase().includes(searchLower)) ||
      (c.email && c.email.toLowerCase().includes(searchLower))
    );
  });

  // Pagination calculations
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage) || 1;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Corporate Directory</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>Client Database</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.8rem', borderRadius: '8px' }} onClick={() => setShowClientModal(true)}>➕ Add Client</button>
          <button className="btn btn-primary" style={{ fontSize: '0.8rem', borderRadius: '8px' }} onClick={triggerNewProjectFlow}>📁 New Project</button>
        </div>
      </div>

      {/* Search system */}
      <div className="card" style={{ background: 'var(--bg-sidebar)', padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', flex: 1 }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search partners by name, company, email..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', width: '100%', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '12px', marginTop: '24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>👥</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>No Clients Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>Create client profiles to associate with active CAD models.</p>
        </div>
      ) : (
        <>
          <div className="grid-3" style={{ marginTop: '24px' }}>
            {currentClients.map(c => (
              <div key={c.id} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', minHeight: '160px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '750', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{c.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '600', display: 'block', marginBottom: '12px' }}>{c.company || 'Individual Freelancer'}</span>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ opacity: 0.7 }}>📞</span>
                      <span>{c.phone || 'No phone number'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ opacity: 0.7 }}>✉</span>
                      <span style={{ wordBreak: 'break-all' }}>{c.email || 'No email'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registered Client</span>
                  <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: '26px' }} onClick={() => triggerToast(`Contacting ${c.name}...`)}>Contact</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', minWidth: 'auto' }} 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', minWidth: 'auto' }} 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Two Column Add Client Modal */}
      {showClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '640px', width: '100%', margin: 0, maxHeight: '90vh', overflowY: 'auto', background: '#171A21', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>New Partner Profile</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)', fontFamily: 'Poppins' }}>➕ Create Client Profile</h3>
              </div>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
                onClick={() => { setShowClientModal(false); setUploadedAgreementFiles([]); setFileValidationError(''); }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Two-column inputs grid */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏢 Company Information
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Client Name *</label>
                      <input type="text" placeholder="e.g. Ashok Kumar" className="form-input" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }} value={newClient.name} onChange={(e) => setNewClient({...newClient, name: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Company / Organization</label>
                      <input type="text" placeholder="e.g. Structural Design Ltd." className="form-input" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }} value={newClient.company} onChange={(e) => setNewClient({...newClient, company: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📞 Contact Channels
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Email Address</label>
                      <input type="email" placeholder="client@company.com" className="form-input" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }} value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Phone / Mobile</label>
                      <input type="tel" placeholder="+91 99999 88888" className="form-input" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }} value={newClient.phone} onChange={(e) => setNewClient({...newClient, phone: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📄 Specifications & Contracts
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Notes & Instructions</label>
                      <textarea className="form-input" placeholder="Custom templates, Revit standards..." rows="2" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', resize: 'vertical' }} value={newClient.notes} onChange={(e) => setNewClient({...newClient, notes: e.target.value})}></textarea>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Agreement Documents</label>
                      <input 
                        type="file" 
                        multiple 
                        className="form-input" 
                        style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }} 
                        onChange={handleAgreementFilesChange}
                      />
                      {fileValidationError && (
                        <p style={{ color: 'var(--color-danger)', fontSize: '0.7rem', marginTop: '4px' }}>⚠️ {fileValidationError}</p>
                      )}
                      {uploadedAgreementFiles.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Selected Files:</span>
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '0.7rem', color: 'var(--accent)' }}>
                            {uploadedAgreementFiles.map((fn, idx) => <li key={idx}>{fn}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" style={{ minHeight: '38px' }} onClick={() => { setShowClientModal(false); setUploadedAgreementFiles([]); setNewClient({ name: '', phone: '', email: '', company: '', notes: '' }); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ minHeight: '38px' }}>Create Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
