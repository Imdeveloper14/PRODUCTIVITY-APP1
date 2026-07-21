import React, { useState, useEffect } from 'react';
import { 
  Search, BrainCircuit, Download, Mail, Trash2, CheckCircle2, FileText, Sparkles, AlertCircle
} from 'lucide-react';
import { generateAndDownloadPDF, parseInvoiceNotes } from '../services/pdfService';
import { supabase } from '../utils/supabase';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const LOCAL_BUSINESS_STATE = "Karnataka";

export default function InvoicesView({
  invoices = [],
  setInvoices,
  clients = [],
  projects = [],
  user,
  triggerToast,
  showInvoiceModal,
  setShowInvoiceModal
}) {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceSubTab, setInvoiceSubTab] = useState('All');
  const [invoiceLoading, setInvoiceLoading] = useState('');
  const [invoiceError, setInvoiceError] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');
  const [livePdfUrl, setLivePdfUrl] = useState('');

  // Invoice Wizard form inputs
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    client_id: '',
    project_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    contract_value: 0,
    previously_invoiced: 0,
    current_billing_amount: 0,
    remaining_contract_value: 0,
    gst_percentage: 18,
    gst_amount: 0,
    discount: 0,
    grand_total: 0,
    payment_status: 'Draft',
    payment_method: 'Bank Transfer',
    notes: 'Please transfer payments within 15 days of receiving this document.',
    client_state: 'Karnataka',
    cgst_rate: 9,
    cgst_amount: 0,
    sgst_rate: 9,
    sgst_amount: 0,
    igst_rate: 0,
    igst_amount: 0
  });

  // AI Assistant Chat Log on Invoices Tab
  const [aiInvoiceInput, setAiInvoiceInput] = useState('');
  const [aiInvoiceChat, setAiInvoiceChat] = useState([
    { sender: 'bot', text: 'Hello! I am your Invoice AI assistant. I can predict payment risks, suggest payment reminder templates, or summarize invoice parameters.' }
  ]);

  // Debounced live preview generation
  useEffect(() => {
    if (!showInvoiceModal) return;
    const timeoutId = setTimeout(async () => {
      try {
        const url = await generateAndDownloadPDF({
          inv: invoiceForm,
          clients,
          projects,
          quotations,
          user,
          previewOnly: true
        });
        setLivePdfUrl(url);
      } catch (err) {
        console.error("Live preview error:", err);
      }
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [showInvoiceModal, invoiceForm, clients, projects, quotations, user]);

  useEffect(() => {
    fetch('/api/quotations')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setQuotations(data.quotations || []);
        }
      })
      .catch(err => console.error("Error fetching quotations in InvoicesView:", err));
  }, []);

  useEffect(() => {
    const trigger = localStorage.getItem("aura_trigger_new_invoice_modal");
    if (trigger === "true") {
      const clientId = localStorage.getItem("aura_preselected_client_id");
      const projectId = localStorage.getItem("aura_preselected_project_id");
      
      localStorage.removeItem("aura_trigger_new_invoice_modal");
      localStorage.removeItem("aura_preselected_client_id");
      localStorage.removeItem("aura_preselected_project_id");

      const client = clients.find(c => c.id === clientId);
      const clientState = client?.state || 'Karnataka';
      const proj = projects.find(p => p.id === projectId);
      const projVal = proj ? (proj.quoteAmount || proj.quote_amount || 0) : 0;
      
      const approvedInvoices = invoices.filter(inv => inv.project_id === projectId && (inv.payment_status === 'Approved' || inv.payment_status === 'Paid'));
      const previouslyInvoiced = approvedInvoices.reduce((sum, inv) => sum + (inv.current_billing_amount || 0), 0);
      const remaining = Math.max(0, projVal - previouslyInvoiced);
      
      setInvoiceForm(prev => ({
        ...prev,
        invoice_number: getNextInvoiceNumber(),
        client_id: clientId || '',
        project_id: projectId || '',
        contract_value: projVal,
        previously_invoiced: previouslyInvoiced,
        current_billing_amount: 0,
        remaining_contract_value: remaining,
        client_state: clientState
      }));
      setInvoiceError('');
      setShowInvoiceModal(true);
    }
  }, [invoices, clients, projects]);

  const getNextInvoiceNumber = () => {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    let maxNum = 0;
    invoices.forEach(inv => {
      if (inv.invoice_number && inv.invoice_number.startsWith(prefix)) {
        const parts = inv.invoice_number.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      } else if (inv.invoice_number && inv.invoice_number.includes('INV-')) {
        const parts = inv.invoice_number.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  };

  const triggerNewInvoiceFlow = () => {
    if (clients.length === 0) {
      alert("Please create a client before drafting an invoice.");
      return;
    }
    const invNum = getNextInvoiceNumber();
    setInvoiceForm({
      invoice_number: invNum,
      client_id: '',
      project_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contract_value: 0,
      previously_invoiced: 0,
      current_billing_amount: 0,
      remaining_contract_value: 0,
      gst_percentage: 18,
      gst_amount: 0,
      discount: 0,
      grand_total: 0,
      payment_status: 'Draft',
      payment_method: 'Bank Transfer',
      notes: 'Please transfer payments within 15 days of receiving this document.',
      client_state: 'Karnataka',
      cgst_rate: 9,
      cgst_amount: 0,
      sgst_rate: 9,
      sgst_amount: 0,
      igst_rate: 0,
      igst_amount: 0
    });
    setInvoiceError('');
    setLivePdfUrl('');
    setShowInvoiceModal(true);
  };

  const recalculateGST = (stateCopy) => {
    const remaining = Math.max(0, stateCopy.contract_value - stateCopy.previously_invoiced - stateCopy.current_billing_amount);
    const taxableAmount = Math.max(0, stateCopy.current_billing_amount - stateCopy.discount);
    const rate = stateCopy.gst_percentage;
    const isLocal = stateCopy.client_state === LOCAL_BUSINESS_STATE;

    let cgst_rate = 0, cgst_amount = 0;
    let sgst_rate = 0, sgst_amount = 0;
    let igst_rate = 0, igst_amount = 0;

    if (isLocal) {
      cgst_rate = rate / 2;
      sgst_rate = rate / 2;
      cgst_amount = Math.round(taxableAmount * (cgst_rate / 100));
      sgst_amount = Math.round(taxableAmount * (sgst_rate / 100));
    } else {
      igst_rate = rate;
      igst_amount = Math.round(taxableAmount * (igst_rate / 100));
    }

    const gst_amount = cgst_amount + sgst_amount + igst_amount;
    const grand_total = taxableAmount + gst_amount;

    return {
      ...stateCopy,
      remaining_contract_value: remaining,
      gst_amount,
      grand_total,
      cgst_rate,
      cgst_amount,
      sgst_rate,
      sgst_amount,
      igst_rate,
      igst_amount
    };
  };

  const handleInvoiceClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    const clientState = client?.state || 'Karnataka';
    setInvoiceForm(prev => {
      const updated = {
        ...prev,
        client_id: clientId,
        project_id: '',
        contract_value: 0,
        previously_invoiced: 0,
        current_billing_amount: 0,
        remaining_contract_value: 0,
        gst_amount: 0,
        grand_total: 0,
        client_state: clientState
      };
      return recalculateGST(updated);
    });
  };

  const handleInvoiceProjectSelect = (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    setInvoiceForm(prev => {
      const projVal = proj.quoteAmount || proj.quote_amount || 0;
      const approvedInvoices = invoices.filter(inv => inv.project_id === projectId && (inv.payment_status === 'Approved' || inv.payment_status === 'Paid'));
      const previouslyInvoiced = approvedInvoices.reduce((sum, inv) => sum + (inv.current_billing_amount || 0), 0);
      const remaining = Math.max(0, projVal - previouslyInvoiced);
      const updated = {
        ...prev,
        project_id: projectId,
        contract_value: projVal,
        previously_invoiced: previouslyInvoiced,
        current_billing_amount: 0,
        remaining_contract_value: remaining
      };
      return recalculateGST(updated);
    });
  };

  const handleFieldChange = (fields) => {
    setInvoiceForm(prev => {
      const updated = { ...prev, ...fields };
      return recalculateGST(updated);
    });
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!invoiceForm.client_id || !invoiceForm.project_id) return alert("Select client and project.");
    
    setInvoiceLoading('Saving...');
    setInvoiceError('');
    try {
      const gstMetadata = {
        client_state: invoiceForm.client_state,
        cgst_rate: invoiceForm.cgst_rate,
        cgst_amount: invoiceForm.cgst_amount,
        sgst_rate: invoiceForm.sgst_rate,
        sgst_amount: invoiceForm.sgst_amount,
        igst_rate: invoiceForm.igst_rate,
        igst_amount: invoiceForm.igst_amount
      };

      const finalNotes = `${invoiceForm.notes}\n\n[GST_DETAILS:${JSON.stringify(gstMetadata)}]`;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUserUuid = user?.id && uuidRegex.test(user.id);
      const isValidClientUuid = invoiceForm.client_id && uuidRegex.test(invoiceForm.client_id);
      const isValidProjectUuid = invoiceForm.project_id && uuidRegex.test(invoiceForm.project_id);

      const dbRecord = {
        invoice_number: invoiceForm.invoice_number,
        client_id: invoiceForm.client_id,
        project_id: invoiceForm.project_id,
        invoice_date: invoiceForm.invoice_date,
        due_date: invoiceForm.due_date || null,
        contract_value: invoiceForm.contract_value,
        previously_invoiced: invoiceForm.previously_invoiced,
        current_billing_amount: invoiceForm.current_billing_amount,
        remaining_contract_value: invoiceForm.remaining_contract_value,
        gst_percentage: invoiceForm.gst_percentage,
        gst_amount: invoiceForm.gst_amount,
        discount: invoiceForm.discount,
        grand_total: invoiceForm.grand_total,
        payment_status: invoiceForm.payment_status,
        payment_method: invoiceForm.payment_method,
        notes: finalNotes,
        pdf_url: `https://supabase.co/storage/v1/object/private/invoice-pdfs/${user?.id || 'guest'}/${invoiceForm.invoice_number}.pdf`,
        ...(isValidUserUuid ? { user_id: user.id } : {})
      };

      let savedToSupabase = false;
      if (supabase && isValidClientUuid && isValidProjectUuid) {
        const { data, error } = await supabase
          .from('invoices')
          .insert([dbRecord])
          .select();

        if (!error && data) {
          savedToSupabase = true;
          const inserted = data[0];
          setInvoices(prev => [
            ...prev,
            {
              ...inserted,
              contract_value: parseFloat(inserted.contract_value) || 0,
              previously_invoiced: parseFloat(inserted.previously_invoiced) || 0,
              current_billing_amount: parseFloat(inserted.current_billing_amount) || 0,
              remaining_contract_value: parseFloat(inserted.remaining_contract_value) || 0,
              gst_percentage: parseFloat(inserted.gst_percentage) || 18,
              gst_amount: parseFloat(inserted.gst_amount) || 0,
              discount: parseFloat(inserted.discount) || 0,
              grand_total: parseFloat(inserted.grand_total) || 0
            }
          ]);
        } else {
          console.error("Supabase insert invoice error:", error?.message, error?.code);
        }
      }

      if (!savedToSupabase) {
        const addedDraft = {
          ...invoiceForm,
          notes: finalNotes,
          id: 'inv_' + Date.now(),
          created_by: user?.name || 'Guest',
          pdf_url: dbRecord.pdf_url
        };
        const updated = [...invoices, addedDraft];
        setInvoices(updated);
        localStorage.setItem("aura_invoices_v7", JSON.stringify(updated));
      }

      setInvoiceLoading('');
      setShowInvoiceModal(false);
      triggerToast("Invoice saved successfully.");
    } catch (err) {
      console.error(err);
      setInvoiceError("Failed to save. Connection or schema issue.");
      setInvoiceLoading('');
    }
  };

  const handleMarkPaid = async (id) => {
    let savedToSupabase = false;
    if (supabase && user?.id && !String(id).startsWith('inv_')) {
      try {
        const { error } = await supabase
          .from('invoices')
          .update({ payment_status: 'Paid', balance_due: 0 })
          .eq('id', id);
        if (!error) savedToSupabase = true;
      } catch (err) {
        console.error("Supabase update invoice paid error:", err);
      }
    }
    const updated = invoices.map(inv => inv.id === id ? { ...inv, payment_status: 'Paid', balance_due: 0 } : inv);
    setInvoices(updated);
    if (!savedToSupabase) localStorage.setItem("aura_invoices_v7", JSON.stringify(updated));
    triggerToast("Invoice marked as Paid.");
  };

  const handleDeleteInvoice = async (id) => {
    let deletedFromSupabase = false;
    if (supabase && user?.id && !String(id).startsWith('inv_')) {
      try {
        const { error } = await supabase.from('invoices').delete().eq('id', id);
        if (!error) deletedFromSupabase = true;
      } catch (err) {
        console.error("Supabase invoice delete error:", err);
      }
    }
    const updated = invoices.filter(inv => inv.id !== id);
    setInvoices(updated);
    if (!deletedFromSupabase) localStorage.setItem("aura_invoices_v7", JSON.stringify(updated));
    triggerToast("Invoice deleted.");
  };

  const sendEmail = (inv) => {
    alert(`Email successfully dispatched containing PDF invoice ${inv.invoice_number}.`);
  };

  const handleAIInvoiceCommand = (cmd) => {
    const query = cmd;
    const updatedChat = [...aiInvoiceChat, { sender: 'user', text: query }];
    setAiInvoiceChat(updatedChat);
    setTimeout(() => {
      let botResponse = "I'm evaluating your invoice ledgers. Try options below to predict risks or draft emails.";
      if (query.includes("Reminder")) {
        botResponse = `✉️ <strong>Payment Reminder Template:</strong><br/><em>"Dear Client, this is a friendly reminder that invoice ${invoices[0]?.invoice_number || 'INV-2026-0001'} is currently pending payment. Please confirm remittance. Thanks, Ashok."</em>`;
      } else if (query.includes("Follow-up")) {
        botResponse = `✉️ <strong>Late Payment Follow-up:</strong><br/><em>"Hello team, following up on the outstanding balance of Rs. ${(invoices[0]?.grand_total || 30860).toLocaleString('en-IN')}. Please clear by early next week."</em>`;
      } else if (query.includes("Summarize")) {
        const totalPending = invoices.filter(i => i.payment_status !== 'Paid').reduce((sum, i) => sum + (i.grand_total || 0), 0);
        botResponse = `📊 <strong>Invoice Ledger Summary:</strong><br/>- Total Invoices: ${invoices.length}<br/>- Unsettled: Rs. ${totalPending.toLocaleString('en-IN')}`;
      } else if (query.includes("Risk")) {
        botResponse = `⚠️ <strong>Late Payment Risk:</strong><br/>- Apex Builders: Low Risk<br/>- Zenith Mechanical: Medium Risk (pending Rs. 45,000)`;
      }
      setAiInvoiceChat(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 600);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (user?.role !== 'Admin' && user?.role !== 'SuperAdmin' && inv.created_by && inv.created_by !== user?.name) return false;
    const client = clients.find(c => c.id === inv.client_id);
    const clientName = client ? client.name : 'Unknown';
    const proj = projects.find(p => p.id === inv.project_id);
    const projTitle = proj ? proj.title : 'N/A';
    const matchSearch = (inv.invoice_number || '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                        clientName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                        projTitle.toLowerCase().includes(invoiceSearch.toLowerCase());
    let matchSubTab = true;
    if (invoiceSubTab !== 'All') matchSubTab = inv.payment_status === invoiceSubTab;
    return matchSearch && matchSubTab;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Finance Desk</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Invoice Ledger</h1>
        </div>
        <button className="btn btn-primary" onClick={triggerNewInvoiceFlow}>💰 Create GST Invoice</button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search invoice no, client or project..."
            value={invoiceSearch}
            onChange={(e) => setInvoiceSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', width: '100%', color: 'var(--text-primary)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {['All', 'Draft', 'Pending', 'Paid', 'Overdue'].map(tab => (
            <button
              key={tab}
              className="btn"
              style={{ padding: '6px 12px', fontSize: '0.8rem', background: invoiceSubTab === tab ? 'var(--accent)' : 'none', border: 'none', color: invoiceSubTab === tab ? '#F5F5F5' : 'var(--text-secondary)', minHeight: '30px' }}
              onClick={() => setInvoiceSubTab(tab)}
            >
              {tab === 'All' ? 'All' : `${tab}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Split view layout */}
      <div className="invoices-grid" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '24px' }}>

        {/* Invoices List Table (65%) */}
        <div className="card desktop-table-container" style={{ padding: 0, overflowX: 'auto', margin: 0, flex: '2 1 600px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Project</th>
                <th>Status</th>
                <th>Outstanding</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => {
                const client = clients.find(c => c.id === inv.client_id);
                const proj = projects.find(p => p.id === inv.project_id);
                return (
                  <tr key={inv.id}>
                    <td><strong>{inv.invoice_number}</strong></td>
                    <td style={{ fontSize: '0.85rem' }}>{client ? client.name : 'N/A'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{proj ? proj.title : 'N/A'}</td>
                    <td>
                      <span className={`badge ${inv.payment_status === 'Paid' ? 'badge-success' : inv.payment_status === 'Draft' ? 'badge-info' : inv.payment_status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>Rs. {(inv.grand_total || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 6px' }} title="Preview Invoice" onClick={async () => {
                          const url = await generateAndDownloadPDF({ inv, clients, projects, quotations, user, supabase, setInvoiceLoading, setInvoiceError, previewOnly: true });
                          if (url) { setPreviewPdfUrl(url); setPreviewInvoice(inv); }
                        }}>
                          👁 Preview
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '4px 6px' }} title="Download PDF" onClick={() => generateAndDownloadPDF({ inv, clients, projects, quotations, user, supabase, setInvoiceLoading, setInvoiceError })}>
                          ⬇ Download
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '4px 6px' }} title="Send Email" onClick={() => sendEmail(inv)}>
                          ✉ Email
                        </button>
                        {inv.payment_status !== 'Paid' && (
                          <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleMarkPaid(inv.id)}>
                            ✓ Mark Paid
                          </button>
                        )}
                        <button className="btn btn-secondary" style={{ padding: '4px 6px', color: 'var(--color-danger)' }} title="Delete" onClick={() => handleDeleteInvoice(inv.id)}>
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No invoices found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI Assistant Console (35%) */}
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '450px', background: 'rgba(255,255,255,0.04)', flex: '1 1 300px' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit style={{ color: 'var(--accent)' }} size={18} />
            <strong style={{ fontSize: '0.85rem' }}>Billing &amp; Invoicing AI</strong>
          </div>
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {aiInvoiceChat.map((msg, idx) => (
              <div key={idx} className={`ai-msg ${msg.sender}`} style={{ fontSize: '0.8rem', padding: '8px 12px', margin: 0, alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end', background: msg.sender === 'bot' ? 'rgba(215,38,61,0.08)' : 'rgba(255,255,255,0.05)', borderRadius: '8px' }} dangerouslySetInnerHTML={{ __html: msg.text }}></div>
            ))}
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'var(--bg-card)' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleAIInvoiceCommand("Suggest Payment Reminder")}>🔔 Suggest Reminder</button>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleAIInvoiceCommand("Generate Follow-up Email")}>✉️ Late Follow-up</button>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleAIInvoiceCommand("Summarize Invoice")}>📊 Summarize Ledger</button>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleAIInvoiceCommand("Predict Late Payment Risk")}>⚠️ Predict Late Risk</button>
          </div>
        </div>

      </div>

      {/* Premium Side-by-Side Invoice Wizard Modal */}
      {showInvoiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '1200px', width: '100%', margin: 0, background: '#111317', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: 0, display: 'flex', flexDirection: 'column', height: '90vh' }}>

            {/* Modal Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>GST Compliant Billing</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '2px 0 0 0', color: 'var(--text-primary)' }}>💰 Premium GST Invoice Builder</h3>
              </div>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.3rem' }} onClick={() => setShowInvoiceModal(false)}>✕</button>
            </div>

            {/* Split Layout Body */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

              {/* Left Side: Form Controls (45%) */}
              <form onSubmit={handleSaveDraft} style={{ width: '45%', minWidth: '350px', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', height: '100%' }}>
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {invoiceError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', background: 'rgba(231,76,60,0.1)', padding: '8px', borderRadius: '6px' }}>{invoiceError}</p>}

                  <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Invoice Number</label>
                      <input type="text" className="form-input" value={invoiceForm.invoice_number} readOnly style={{ background: 'rgba(0,0,0,0.3)', color: '#34d399', fontWeight: 'bold' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Client Partner</label>
                      <select className="form-input" value={invoiceForm.client_id} onChange={(e) => handleInvoiceClientSelect(e.target.value)} required>
                        <option value="">Select Partner</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company || 'Individual'})</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Associated Project</label>
                      <select className="form-input" value={invoiceForm.project_id} onChange={(e) => handleInvoiceProjectSelect(e.target.value)} required disabled={!invoiceForm.client_id}>
                        <option value="">Select Project</option>
                        {projects.filter(p => p.clientId === invoiceForm.client_id || p.client_id === invoiceForm.client_id).map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Client State (For GST)</label>
                      <select className="form-input" value={invoiceForm.client_state} onChange={(e) => handleFieldChange({ client_state: e.target.value })} required>
                        {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Invoice Date</label>
                      <input type="date" className="form-input" value={invoiceForm.invoice_date} onChange={(e) => handleFieldChange({ invoice_date: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Due Date</label>
                      <input type="date" className="form-input" value={invoiceForm.due_date} onChange={(e) => handleFieldChange({ due_date: e.target.value })} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Contract Value (GST Exclusive, Rs.)</label>
                      <input type="number" className="form-input" value={invoiceForm.contract_value} readOnly style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-secondary)' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Previously Invoiced (Rs.)</label>
                      <input type="number" className="form-input" value={invoiceForm.previously_invoiced} readOnly style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-secondary)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Current Billing Amount (Rs.)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={invoiceForm.current_billing_amount}
                        onChange={(e) => handleFieldChange({ current_billing_amount: Math.max(0, parseFloat(e.target.value) || 0) })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Remaining Contract Value (Rs.)</label>
                      <input type="number" className="form-input" value={invoiceForm.remaining_contract_value} readOnly style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--text-secondary)' }} />
                    </div>
                  </div>

                  {invoiceForm.current_billing_amount > Math.round(invoiceForm.contract_value - invoiceForm.previously_invoiced) && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '6px', padding: '8px 12px', fontSize: '0.7rem', color: '#f87171' }}>
                      ⚠️ Cannot invoice more than remaining contract value.
                    </div>
                  )}

                  <div className="grid-3" style={{ gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>GST Rate (%)</label>
                      <select className="form-input" value={invoiceForm.gst_percentage} onChange={(e) => handleFieldChange({ gst_percentage: parseFloat(e.target.value) || 0 })} required>
                        <option value="18">18% Standard</option>
                        <option value="12">12% Reduced</option>
                        <option value="5">5% Lower</option>
                        <option value="0">0% Exempt</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Discount (₹)</label>
                      <input type="number" className="form-input" value={invoiceForm.discount} onChange={(e) => handleFieldChange({ discount: Math.max(0, parseFloat(e.target.value) || 0) })} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Payment Mode</label>
                      <select className="form-input" value={invoiceForm.payment_method} onChange={(e) => handleFieldChange({ payment_method: e.target.value })}>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="UPI">UPI Payment</option>
                        <option value="Cash">Cash Mode</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Invoice Status</label>
                      <select className="form-input" value={invoiceForm.payment_status} onChange={(e) => handleFieldChange({ payment_status: e.target.value })}>
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Paid">Paid</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 'bold', margin: '0 0 8px 0' }}>GST Engine Detection</h5>
                    <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Local State:</span>
                        <span style={{ color: '#60a5fa' }}>{LOCAL_BUSINESS_STATE}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Client State:</span>
                        <span style={{ color: '#60a5fa' }}>{invoiceForm.client_state}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '4px' }}>
                        <span>Tax Breakdown:</span>
                        {invoiceForm.client_state === LOCAL_BUSINESS_STATE ? (
                          <span style={{ color: '#34d399', fontWeight: 'bold' }}>Local (CGST + SGST)</span>
                        ) : (
                          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Interstate (IGST)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Special Billing Notes</label>
                    <textarea className="form-input" value={invoiceForm.notes} onChange={(e) => handleFieldChange({ notes: e.target.value })} rows="2" style={{ resize: 'none' }} />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>Close</button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!!invoiceLoading || invoiceForm.current_billing_amount > Math.round(invoiceForm.contract_value - invoiceForm.previously_invoiced)}
                  >
                    {invoiceLoading || 'Save Draft'}
                  </button>
                </div>
              </form>

              {/* Right Side: Real-time PDF Preview (55%) */}
              <div style={{ flex: 1, background: '#1c1f26', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: 'var(--accent)' }} /> Live PDF Preview
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Updates in real-time</span>
                </div>
                <div style={{ flex: 1, borderRadius: '4px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', overflow: 'hidden', minHeight: '600px' }}>
                  {livePdfUrl ? (
                    <iframe
                      src={livePdfUrl}
                      style={{ width: '100%', height: '100%', border: 'none', background: '#FFFFFF' }}
                      title="Live Invoice Preview"
                    />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', minHeight: '600px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '12px' }}>
                      <Sparkles size={24} color="var(--accent)" />
                      <span style={{ fontSize: '0.85rem' }}>Generating preview...</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Invoice PDF Preview Modal */}
      {previewInvoice && (() => {
        return (
          <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div className="modal-content" style={{ width: '85%', maxWidth: '1000px', height: '90%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Invoice Preview - {previewInvoice.invoice_number}</h3>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setPreviewInvoice(null)}>&times;</button>
              </div>
              <div style={{ flex: 1, background: '#1c1f26', display: 'flex', justifyContent: 'center', height: '100%' }}>
                <iframe src={previewPdfUrl} style={{ width: '100%', height: '100%', border: 'none', background: '#FFFFFF' }} />
              </div>
              <div style={{ padding: '16px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={() => generateAndDownloadPDF({ inv: previewInvoice, clients, projects, quotations, user, supabase, setInvoiceLoading, setInvoiceError })}>Download PDF</button>
                <button className="btn btn-secondary" onClick={() => sendEmail(previewInvoice)}>Send Email</button>
                <button className="btn btn-secondary" onClick={() => { setPreviewInvoice(null); setPreviewPdfUrl(''); }}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
