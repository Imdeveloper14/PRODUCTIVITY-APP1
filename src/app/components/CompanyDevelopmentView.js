import React, { useState } from 'react';

export default function CompanyDevelopmentView({ triggerToast }) {
  const [acquisitions, setAcquisitions] = useState([
    { id: 'a1', partner: 'Gulf Engineering CAD Corp', region: 'GCC Region', status: 'Due Diligence', valuation: '₹4.5Cr' },
    { id: 'a2', partner: 'Mumbai Marine Modeling Studio', region: 'India West', status: 'Initial Meeting', valuation: '₹1.8Cr' }
  ]);

  const [marketing, setMarketing] = useState([
    { id: 'm1', campaign: 'Google Ads Search - Revit Architectural Solutions', spend: '₹45,000', leads: 32, conversions: 5 },
    { id: 'm2', campaign: 'LinkedIn InMail - Marine CAD Outsourcing Dubai', spend: '₹60,000', leads: 18, conversions: 3 }
  ]);

  const [investments, setInvestments] = useState([
    { item: 'Purchase 12x RTX 4090 Design Server Stations', budget: '₹36,00,000', approval: 'Approved' },
    { item: 'Autodesk AEC Collection Network License Renewal', budget: '₹18,50,000', approval: 'Pending' }
  ]);

  const handleUpdateCampaign = (campaignId) => {
    triggerToast("Campaign conversions recalculated.");
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Strategic Growth</span>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>Company Development & Acquisition</h1>
      </div>

      {/* Hiring & Acquisitions KPIs */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>HIRING TUNNEL STATUS</span>
            <span style={{ color: '#10B981', fontWeight: '700' }}>✓ ACTIVE</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>12 Hired / 145 Applied</span>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>STRATEGIC CAPEX ALLOCATION</span>
            <span style={{ color: 'var(--accent)', fontWeight: '700' }}>🔥 BUDGET</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>₹54.5 Lakhs</span>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>ACQUISITIONS IN PIPELINE</span>
            <span style={{ color: 'var(--accent-purple)', fontWeight: '700' }}>📈 MERGERS</span>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>2 Leads Active</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Acquisitions and Investments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Business Acquisitions Target */}
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '750', marginBottom: '16px', color: 'var(--text-primary)' }}>🏢 Business Acquisition Parameters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {acquisitions.map(acq => (
                <div key={acq.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--accent)', borderRadius: '0 6px 6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{acq.partner}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Region: {acq.region} • Valuation: {acq.valuation}</div>
                  </div>
                  <span className="badge" style={{ background: 'rgba(215, 38, 61, 0.1)', color: 'var(--accent)', fontSize: '0.7rem' }}>{acq.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure investments */}
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '750', marginBottom: '16px', color: 'var(--text-primary)' }}>💻 Strategic Infrastructure Capex</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {investments.map((inv, idx) => (
                <div key={idx} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--border-color)', borderRadius: '0 6px 6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '10px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{inv.item}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Allocated budget: {inv.budget}</div>
                  </div>
                  <span className={`badge ${inv.approval === 'Approved' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>{inv.approval}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Marketing campaign tracker */}
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '750', marginBottom: '16px', color: 'var(--text-primary)' }}>📊 Marketing Campaigns Conversion Tracker</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {marketing.map(camp => (
              <div key={camp.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{camp.campaign}</strong>
                  <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: 'auto' }} onClick={() => handleUpdateCampaign(camp.id)}>Sync</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', fontSize: '0.8rem', background: 'rgba(0,0,0,0.15)', padding: '6px', borderRadius: '4px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Spend</div>
                    <div style={{ fontWeight: '700' }}>{camp.spend}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Leads</div>
                    <div style={{ fontWeight: '700' }}>{camp.leads}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Clients</div>
                    <div style={{ fontWeight: '700', color: 'var(--accent)' }}>{camp.conversions}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
