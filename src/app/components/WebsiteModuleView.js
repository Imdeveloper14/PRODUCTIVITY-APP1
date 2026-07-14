import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function WebsiteModuleView({ triggerToast }) {
  const [bugs, setBugs] = useState([
    { id: 'b1', page: '/projects', issue: 'Broken BIM model loading in safari browser', priority: 'High', status: 'Open' },
    { id: 'b2', page: '/contact', issue: 'Form submit button overlaps footer on responsive mobile screen', priority: 'Medium', status: 'Open' },
    { id: 'b3', page: '/index', issue: 'Hero page video load speed optimization needed', priority: 'Low', status: 'Resolved' }
  ]);

  const [pages, setPages] = useState([
    { path: '/', indexed: 'Indexed', score: 98, lastCrawled: '2026-06-25' },
    { path: '/projects', indexed: 'Indexed', score: 92, lastCrawled: '2026-06-26' },
    { path: '/invoices', indexed: 'Not Indexed', score: 85, lastCrawled: 'N/A' },
    { path: '/quotations', indexed: 'Indexed', score: 90, lastCrawled: '2026-06-24' }
  ]);

  // Image compression mock states
  const [compressionRatio, setCompressionRatio] = useState(50);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleResolveBug = (bugId) => {
    setBugs(prev => prev.map(b => b.id === bugId ? { ...b, status: 'Resolved' } : b));
    triggerToast("Web bug marked as resolved.");
  };

  const handleMockCompression = () => {
    setIsCompressing(true);
    setTimeout(() => {
      setIsCompressing(false);
      triggerToast(`Images compressed by ${compressionRatio}% (Saved 4.2 MB total).`);
    }, 1200);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Portal Analytics</span>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>Website SEO & Portal Audit</h1>
      </div>

      {/* SEO scorecards grid */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>DESKTOP SEO SCORE</span>
            <span style={{ color: '#10B981', fontWeight: '700' }}>🟢 EXCELLENT</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>96/100</span>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>MOBILE PERFORMANCE</span>
            <span style={{ color: '#F59E0B', fontWeight: '700' }}>🟡 IMPROVABLE</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>82/100</span>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL INDEXED PAGES</span>
            <span style={{ color: '#10B981', fontWeight: '700' }}>✓ ACTIVE</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>14 / 15 Pages</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Page Indexing list */}
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '750', marginBottom: '16px', color: 'var(--text-primary)' }}>📄 Page Indexing Registry</h3>
          <div className="desktop-table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Route Path</th>
                  <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '8px', color: 'var(--text-secondary)', textAlign: 'center' }}>SEO Score</th>
                  <th style={{ padding: '8px', color: 'var(--text-secondary)' }}>Last Crawled</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>{p.path}</td>
                    <td style={{ padding: '8px' }}>
                      <span className={`badge ${p.indexed === 'Indexed' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>{p.indexed}</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: '700' }}>{p.score}%</td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{p.lastCrawled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bug tracker & Image compression side by side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Web Bug Tracker */}
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '750', marginBottom: '16px', color: 'var(--text-primary)' }}>🐛 Website Bugs Tracker</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bugs.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderLeft: b.status === 'Resolved' ? '3px solid #10B981' : '3px solid var(--accent)', borderRadius: '0 6px 6px 0' }}>
                  <div style={{ flex: 1, marginRight: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>{b.page}</span>
                      <span className={`badge ${b.priority === 'High' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>{b.priority}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{b.issue}</p>
                  </div>
                  {b.status === 'Open' ? (
                    <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem', minHeight: 'auto' }} onClick={() => handleResolveBug(b.id)}>Resolve</button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600' }}>Resolved ✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Image Compression Tool */}
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '750', marginBottom: '12px', color: 'var(--text-primary)' }}>🖼️ Image Compression Assistant</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Compress model blueprints & diagrams to ensure fast landing page load speeds.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>Quality Level: {compressionRatio}%</span>
                <span>Optimized Lossless</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="90" 
                value={compressionRatio} 
                onChange={(e) => setCompressionRatio(parseInt(e.target.value))} 
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <button 
                className="btn btn-primary" 
                style={{ justifyContent: 'center', height: '36px' }} 
                onClick={handleMockCompression}
                disabled={isCompressing}
              >
                {isCompressing ? 'Compressing Blueprint Images...' : 'Run Compression'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
