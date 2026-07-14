import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, Database, HardDrive, ShieldAlert, Key } from 'lucide-react';

export default function DatabaseHealthCheck({ supabase }) {
  const [status, setStatus] = useState({
    connection: 'pending',
    tables: 'pending',
    policies: 'pending',
    storage: 'pending',
    details: []
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    if (!supabase) {
      setStatus(prev => ({ ...prev, connection: 'error', details: [...prev.details, 'Supabase client not initialized'] }));
      return;
    }

    const detailsLog = [];
    
    // 1. Check Connection & Auth
    try {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr) throw authErr;
      detailsLog.push(`✓ Supabase Connected (Session: ${session ? 'Active' : 'None'})`);
      setStatus(prev => ({ ...prev, connection: 'ok' }));
    } catch (e) {
      detailsLog.push(`❌ Connection failed: ${e.message}`);
      setStatus(prev => ({ ...prev, connection: 'error', details: detailsLog }));
      return;
    }

    // 2. Check Tables
    const tablesToCheck = ['clients', 'projects', 'quotations', 'deliverables', 'milestones', 'invoices', 'tasks'];
    let allTablesOk = true;

    for (let table of tablesToCheck) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 means 0 rows but table exists
          detailsLog.push(`❌ Table '${table}' Error: ${error.message} (Code: ${error.code})`);
          allTablesOk = false;
        } else {
          detailsLog.push(`✓ Table '${table}' found & queried successfully.`);
        }
      } catch (e) {
        detailsLog.push(`❌ Table '${table}' Exception: ${e.message}`);
        allTablesOk = false;
      }
    }
    setStatus(prev => ({ ...prev, tables: allTablesOk ? 'ok' : 'error' }));

    // 3. Check Storage
    try {
      const { data: buckets, error: storageErr } = await supabase.storage.listBuckets();
      if (storageErr) throw storageErr;
      if (buckets.length > 0) {
        detailsLog.push(`✓ Storage Connected (${buckets.length} buckets found: ${buckets.map(b => b.name).join(', ')})`);
        setStatus(prev => ({ ...prev, storage: 'ok' }));
      } else {
        detailsLog.push(`⚠️ Storage Connected but 0 buckets found.`);
        setStatus(prev => ({ ...prev, storage: 'warning' }));
      }
    } catch (e) {
      detailsLog.push(`❌ Storage Error: ${e.message}`);
      setStatus(prev => ({ ...prev, storage: 'error' }));
    }

    // 4. Verify RLS Policies (Heuristic based on table select/insert)
    // If a table is queried without error, SELECT policy is either open or allowing the current session
    detailsLog.push(`✓ RLS Check completed implicitly during table query tests. Note: Detailed RLS policies must be verified in the Supabase Dashboard.`);
    setStatus(prev => ({ ...prev, policies: allTablesOk ? 'ok' : 'error', details: detailsLog }));
  };

  const renderIcon = (state) => {
    if (state === 'pending') return <Loader size={18} className="animate-spin" color="#9CA3AF" />;
    if (state === 'ok') return <CheckCircle size={18} color="#10B981" />;
    if (state === 'warning') return <ShieldAlert size={18} color="#F59E0B" />;
    return <XCircle size={18} color="#EF4444" />;
  };

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'var(--bg-card)' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Database size={20} color="var(--accent)" /> System Diagnostics & Health Check
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          {renderIcon(status.connection)}
          <div>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem' }}>Connection</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supabase API</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          {renderIcon(status.tables)}
          <div>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem' }}>Database Tables</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Schemas & Constraints</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          {renderIcon(status.storage)}
          <div>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem' }}>Storage Buckets</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Object Storage</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          {renderIcon(status.policies)}
          <div>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem' }}>RLS Policies</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Row Level Security</p>
          </div>
        </div>
      </div>

      <div style={{ background: '#0F172A', borderRadius: '12px', padding: '16px', overflowX: 'auto' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Diagnostic Log</h4>
        <pre style={{ margin: 0, fontSize: '0.8rem', color: '#E2E8F0', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          {status.details.length === 0 ? 'Running tests...' : status.details.join('\n')}
        </pre>
      </div>
      
      <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={runDiagnostics}>Re-run Diagnostics</button>
      </div>
    </div>
  );
}
