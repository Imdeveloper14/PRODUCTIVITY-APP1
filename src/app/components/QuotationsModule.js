import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, Calculator, Plus, Trash2, Edit3, Download, Eye, FileText, 
  CheckCircle2, AlertCircle, Send, Save, Check, X, ArrowUp, ArrowDown,
  Copy, Layers, RefreshCw, Sparkles, Bold, Italic, List, ListOrdered, FileDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function QuotationsModuleInner({ user, triggerToast }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedQuote, setSelectedQuote] = useState(null);
  
  // Editor UI View Toggle
  const [showEditor, setShowEditor] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  
  // Card 1: Client & Project State
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [currency, setCurrency] = useState('INR');
  
  // Card 2: Deliverables State (Manual list builder)
  const [deliverables, setDeliverables] = useState([]);
  const [scopeSearch, setScopeSearch] = useState('');
  const [scopeSortAsc, setScopeSortAsc] = useState(true);

  // Card 3: Commercial Terms State
  const [commercialConditions, setCommercialConditions] = useState(
    "1. Validity: 30 Days from date of offer.\n2. Payment Terms: 20% Advance, 50% on design submittal, 30% upon approval.\n3. Revisions: Maximum 2 cycles included."
  );

  // Card 4: Pricing Settings (confidential coefficients)
  const [hourlyRate, setHourlyRate] = useState(1400);
  const [softwareCost, setSoftwareCost] = useState(50000);
  const [contingencyPercent, setContingencyPercent] = useState(10);
  const [gstPercent, setGstPercent] = useState(18);

  // Inline editing state for deliverables
  const [editingRowIdx, setEditingRowIdx] = useState(null);
  const [editDocName, setEditDocName] = useState('');
  const [editHours, setEditHours] = useState(0);
  const [editRemarks, setEditRemarks] = useState('');

  // Autosave status indicator
  const [autosaveTime, setAutosaveTime] = useState('');

  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
  const isManager = user?.role === 'Manager';
  const isEmployee = user?.role === 'Employee';

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Autosave triggers every 30 seconds
  useEffect(() => {
    if (!showEditor) return;
    
    const interval = setInterval(() => {
      triggerAutosave();
    }, 30000);

    return () => clearInterval(interval);
  }, [showEditor, clientName, projectName, projectLocation, contactPerson, currency, deliverables, commercialConditions, hourlyRate, softwareCost, contingencyPercent, gstPercent]);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quotations');
      const data = await res.json();
      if (data.success) {
        setQuotations(data.quotations);
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed to load quotations.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingQuote(null);
    setClientName('');
    setContactPerson('');
    setProjectName('');
    setProjectLocation('');
    setCurrency('INR');
    setDeliverables([
      { included: true, deliverable: "General Arrangement Drawing", estimated_hours: 12, remarks: "" },
      { included: true, deliverable: "Structural Scantling Report", estimated_hours: 30, remarks: "DNV Rules" },
      { included: true, deliverable: "Stability Booklet", estimated_hours: 18, remarks: "Intact Stability" }
    ]);
    setCommercialConditions("1. Validity: 30 Days from date of offer.\n2. Payment Terms: 20% Advance, 50% on design submittal, 30% upon approval.\n3. Revisions: Maximum 2 cycles included.");
    setHourlyRate(1400);
    setSoftwareCost(50000);
    setContingencyPercent(10);
    setGstPercent(18);
    setAutosaveTime('');
    setEditingRowIdx(null);
    setShowEditor(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuote(q);
    setClientName(q.client_name);
    setContactPerson(q.contact_person || '');
    setProjectName(q.project_name);
    setProjectLocation(q.project_location || '');
    setCurrency(q.currency || 'INR');
    setCommercialConditions(q.commercial_conditions || '');
    
    if (q.items && q.items.length > 0) {
      setDeliverables(q.items.map(item => ({
        included: !!item.included,
        deliverable: item.deliverable,
        estimated_hours: item.estimated_hours,
        remarks: item.remarks || ''
      })));
    } else {
      setDeliverables([]);
    }

    if (q.costing) {
      setHourlyRate(q.costing.hourly_rate || 1400);
      setSoftwareCost(q.costing.software_cost || 50000);
      setContingencyPercent(q.costing.contingency && q.costing.engineering_fee ? Math.round((q.costing.contingency / (q.costing.engineering_fee + q.costing.software_cost)) * 100) : 10);
      setGstPercent(q.costing.gst && q.costing.subtotal ? Math.round((q.costing.gst / q.costing.subtotal) * 100) : 18);
    }
    
    setAutosaveTime('');
    setEditingRowIdx(null);
    setShowEditor(true);
  };

  const saveQuotationData = async (isAutosave = false) => {
    if (!clientName || !projectName) return false;

    const payload = {
      client_name: clientName,
      contact_person: contactPerson,
      project_name: projectName,
      project_location: projectLocation,
      currency,
      deliverables: deliverables.map(d => ({ ...d, category: "Engineering" })), // Default category
      commercial_conditions: commercialConditions,
      custom_hourly_rate: hourlyRate,
      custom_software_cost: softwareCost,
      custom_contingency_percent: contingencyPercent
    };

    try {
      const url = editingQuote ? `/api/quotations/${editingQuote.id}` : '/api/quotations';
      const method = editingQuote ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (!editingQuote && data.quotationId) {
          setEditingQuote({ id: data.quotationId, status: 'Draft' });
        }
        if (isAutosave) {
          setAutosaveTime(new Date().toLocaleTimeString());
        }
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const triggerAutosave = async () => {
    const success = await saveQuotationData(true);
    if (success) {
      fetchQuotations();
    }
  };

  const handleManualSave = async () => {
    const success = await saveQuotationData(false);
    if (success) {
      triggerToast("Quotation saved successfully.");
      setShowEditor(false);
      fetchQuotations();
    } else {
      alert("Failed to save quotation. Fill in Client Name and Project Name.");
    }
  };

  // Calculations
  const totalHours = deliverables.reduce((sum, item) => sum + (item.included ? Number(item.estimated_hours || 0) : 0), 0);
  const calculatedFee = totalHours * hourlyRate;
  const calculatedContingency = (calculatedFee + softwareCost) * (contingencyPercent / 100);
  const calculatedSubtotal = calculatedFee + softwareCost + calculatedContingency;
  const calculatedGst = calculatedSubtotal * (gstPercent / 100);
  const calculatedGrandTotal = calculatedSubtotal + calculatedGst;

  // Deliverables modification helpers
  const addDeliverableRow = () => {
    const newRow = { included: true, deliverable: "New Deliverable Document", estimated_hours: 10, remarks: "" };
    setDeliverables(prev => [...prev, newRow]);
    setEditingRowIdx(deliverables.length);
    setEditDocName(newRow.deliverable);
    setEditHours(newRow.estimated_hours);
    setEditRemarks(newRow.remarks);
  };

  const startEditRow = (idx) => {
    const row = deliverables[idx];
    setEditingRowIdx(idx);
    setEditDocName(row.deliverable);
    setEditHours(row.estimated_hours);
    setEditRemarks(row.remarks);
  };

  const saveEditRow = (idx) => {
    setDeliverables(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        deliverable: editDocName,
        estimated_hours: Number(editHours) || 0,
        remarks: editRemarks
      };
      return copy;
    });
    setEditingRowIdx(null);
  };

  const duplicateRow = (idx) => {
    const row = deliverables[idx];
    setDeliverables(prev => {
      const copy = [...prev];
      copy.splice(idx + 1, 0, { ...row, deliverable: `${row.deliverable} (Copy)` });
      return copy;
    });
  };

  const deleteRow = (idx) => {
    setDeliverables(prev => prev.filter((_, i) => i !== idx));
    if (editingRowIdx === idx) setEditingRowIdx(null);
  };

  const moveRow = (idx, direction) => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === deliverables.length - 1) return;
    
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    setDeliverables(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
    if (editingRowIdx === idx) setEditingRowIdx(targetIdx);
  };

  const sortDeliverables = () => {
    setDeliverables(prev => [...prev].sort((a, b) => {
      return scopeSortAsc 
        ? a.deliverable.localeCompare(b.deliverable)
        : b.deliverable.localeCompare(a.deliverable);
    }));
    setScopeSortAsc(!scopeSortAsc);
  };

  // Rich text toggle helpers
  const appendConditionText = (tag) => {
    if (tag === 'bold') setCommercialConditions(prev => prev + " **Bold Text** ");
    if (tag === 'italic') setCommercialConditions(prev => prev + " *Italic Text* ");
    if (tag === 'bullet') setCommercialConditions(prev => prev + "\n- Bullet point");
    if (tag === 'numbered') setCommercialConditions(prev => prev + "\n1. Numbered list item");
  };

  // Generate and export document PDF
  const exportToPdf = (qData, previewOnly = false) => {
    setPdfGenerating(true);
    try {
      const q = qData.quotation;
      const items = qData.items || [];
      const costing = qData.costing || {};

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = [108, 77, 255]; // Purple branding
      const textDark = [30, 41, 59];

      // Banner/Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 38, 'F');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("ENGINEERING CONSULTANCY OFFER", 15, 24);

      doc.setFontSize(9.5);
      doc.setFont("Helvetica", "normal");
      doc.text("PRIMELISOMETRICS CONSULTANCY", 145, 16);
      doc.text("www.primelisometrics.com", 145, 22);

      // Client & Project Information
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text("PROJECT & CLIENT INFORMATION", 15, 52);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Quotation Number: ${q.quotation_number}`, 15, 61);
      doc.text(`Date of Issue: ${new Date(q.created_at || Date.now()).toLocaleDateString()}`, 15, 67);
      doc.text(`Client Name: ${q.client_name}`, 15, 73);
      doc.text(`Contact Person: ${q.contact_person || 'N/A'}`, 15, 79);
      doc.text(`Project Name: ${q.project_name}`, 15, 85);
      doc.text(`Location: ${q.project_location || 'N/A'}`, 15, 91);

      // Deliverables scope table
      doc.setFont("Helvetica", "bold");
      doc.text("SCOPE OF DELIVERABLES", 15, 103);

      const tableRows = items.filter(item => item.included).map((item, idx) => [
        idx + 1,
        item.deliverable,
        `${item.estimated_hours} hrs`,
        item.remarks || ""
      ]);

      autoTable(doc, {
        startY: 107,
        head: [['#', 'Document Name', 'Est. Hours', 'Remarks']],
        body: tableRows,
        headStyles: { fillColor: primaryColor },
        theme: 'grid',
        styles: { fontSize: 8 }
      });

      // Commercial Summary
      const finalY = doc.previousAutoTable.finalY + 12;
      doc.setFont("Helvetica", "bold");
      doc.text("COMMERCIAL CONDITIONS & CHARGES", 15, finalY);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      
      let currentY = finalY + 8;
      doc.text(`Total Engineering Hours: ${costing.engineering_hours || 0} Hours`, 15, currentY);
      currentY += 6;

      const userIsAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
      if (userIsAdmin) {
        doc.text(`Engineering Rate: ${q.currency} ${costing.hourly_rate || 1400} / Hour`, 15, currentY);
        currentY += 6;
        doc.text(`Software Costs: ${q.currency} ${(costing.software_cost || 0).toLocaleString()}`, 15, currentY);
        currentY += 6;
        doc.text(`GST Component: ${q.currency} ${(costing.gst || 0).toLocaleString()}`, 15, currentY);
        currentY += 8;
      }

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Grand Total Fee: ${q.currency} ${Math.round(costing.grand_total || 0).toLocaleString()}`, 15, currentY);

      // Signature section
      currentY += 15;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text("___________________________", 15, currentY);
      doc.text("___________________________", 130, currentY);
      currentY += 5;
      doc.text("Prepared by Engineering Team", 15, currentY);
      doc.text("Approved for Client Submittal", 130, currentY);

      // Page numbers & terms on pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(160, 160, 160);
        doc.text(`Page ${i} of ${totalPages}`, 180, 287);
        doc.text("Confidential Engineering Quotation Offer", 15, 287);
      }

      if (previewOnly) {
        window.open(doc.output('bloburl'), '_blank');
      } else {
        doc.save(`Quotation_${q.quotation_number}.pdf`);
      }
      triggerToast(previewOnly ? "Preview offer generated." : "Downloaded client PDF.");
    } catch (e) {
      console.error(e);
      alert("Failed to compile document PDF. Check formatting guidelines.");
    } finally {
      setPdfGenerating(false);
    }
  };

  const exportToExcel = (qData) => {
    try {
      const q = qData.quotation;
      const items = qData.items || [];
      const costing = qData.costing || {};
      
      const wb = XLSX.utils.book_new();
      
      const inputsData = [
        ["Quotation Information"],
        ["Quote Number", q.quotation_number],
        ["Client Name", q.client_name],
        ["Project Name", q.project_name],
        ["Project Location", q.project_location],
        [],
        ["Scope Hours Summary", costing.engineering_hours],
        ["Grand Total Summary", costing.grand_total]
      ];
      const wsInputs = XLSX.utils.aoa_to_sheet(inputsData);
      XLSX.utils.book_append_sheet(wb, wsInputs, "Summary");

      const itemsData = [
        ["Document Scope Deliverable", "Est. Hours", "Remarks"]
      ];
      items.forEach(it => {
        itemsData.push([it.deliverable, it.estimated_hours, it.remarks || ""]);
      });
      const wsItems = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(wb, wsItems, "Deliverables");

      XLSX.writeFile(wb, `Quotation_${q.quotation_number}.xlsx`);
      triggerToast("Excel file generated.");
    } catch(e) {
      console.error(e);
    }
  };

  const filteredDeliverables = deliverables.filter(d => 
    d.deliverable.toLowerCase().includes(scopeSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* List Page View */}
      {!showEditor && (
        <>
          <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <FileSpreadsheet style={{ color: '#6C4DFF' }} /> Quotation Engineering System
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                Build scopes manually, configure cost breakdowns, and export print-ready PDF engineering proposals.
              </p>
            </div>
            {(isAdmin || isEmployee) && (
              <button 
                className="btn btn-primary" 
                style={{ background: 'linear-gradient(135deg, #6C4DFF 0%, #8B5CF6 100%)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(108, 77, 255, 0.25)' }}
                onClick={handleOpenNew}
              >
                <Plus size={18} /> Create New Offer
              </button>
            )}
          </div>

          {/* List Tab Filters */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            {['All', 'Draft', 'Under Review', 'Approved', 'Sent', 'Archived'].map((tab) => (
              <button
                key={tab}
                className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  border: 'none', 
                  padding: '8px 18px', 
                  fontSize: '0.8rem', 
                  borderRadius: '8px', 
                  fontWeight: activeTab === tab ? '700' : '500', 
                  cursor: 'pointer',
                  background: activeTab === tab ? '#6C4DFF' : 'transparent',
                  color: activeTab === tab ? 'white' : 'var(--text-primary)'
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab}s
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Quotation #</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Project Name</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client Name</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Engineering Scope</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Grand Total</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</td>
                    </tr>
                  ) : (quotations.filter(q => activeTab === 'All' || q.status === activeTab)).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No quotations found in this category.</td>
                    </tr>
                  ) : (
                    quotations.filter(q => activeTab === 'All' || q.status === activeTab).map((q) => (
                      <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)', background: 'white' }}>
                        <td style={{ padding: '16px 20px', fontWeight: '700', color: 'var(--text-primary)' }}>{q.quotation_number}</td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>{q.project_name}</td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>{q.client_name}</td>
                        <td style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>{q.costing?.engineering_hours || 0} hrs</td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            fontSize: '0.7rem', 
                            fontWeight: '700', 
                            borderRadius: '4px',
                            background: q.status === 'Approved' ? '#D1FAE5' : q.status === 'Under Review' ? '#FEF3C7' : q.status === 'Sent' ? '#DBEAFE' : '#E2E8F0',
                            color: q.status === 'Approved' ? '#065F46' : q.status === 'Under Review' ? '#92400E' : q.status === 'Sent' ? '#1E40AF' : '#374151'
                          }}>
                            {q.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: '700', color: '#6C4DFF' }}>
                          {q.currency || 'INR'} {q.costing?.grand_total ? Math.round(q.costing.grand_total).toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', minWidth: 'auto' }}
                              onClick={() => viewDetails(q)}
                            >
                              <Eye size={14} /> View
                            </button>
                            {(isAdmin || (isEmployee && q.status === 'Draft')) && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem', minWidth: 'auto' }}
                                onClick={() => handleOpenEdit(q)}
                              >
                                <Edit3 size={14} /> Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* DOCUMENT CENTRIC WIZARD PAGE */}
      {showEditor && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', paddingBottom: '90px' }}>
          
          {/* Header & Autosave status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'white', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '850', color: 'var(--text-primary)', margin: 0 }}>
                {editingQuote ? `Offer Ref: ${editingQuote.quotation_number}` : 'New Engineering Consultancy Offer'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>
                {autosaveTime ? `✓ Saved just now at ${autosaveTime}` : 'Form edits will auto-save silently.'}
              </span>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => { if(confirm("Discard all offer changes?")) setShowEditor(false); }}
              style={{ borderRadius: '8px' }}
            >
              Cancel Offer
            </button>
          </div>

          {/* CARD 1: Client & Project Details */}
          <div className="card" style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '16px', color: '#6C4DFF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Card 1: Client & Project Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Client Company *</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="Client Company Name" style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Contact Person Name</label>
                <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Lead Contact Representative" style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Project Name Description *</label>
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} required placeholder="Official Project Name" style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Project Installation Location</label>
                <input type="text" value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)} placeholder="Project Site Location" style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Currency ISO</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', background: 'white' }}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CARD 2: Scope Manual Builder */}
          <div className="card" style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#6C4DFF', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Card 2: Scope of Deliverable Documents</h3>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={addDeliverableRow}
                style={{ background: '#6C4DFF', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                <Plus size={14} /> Add Deliverable Row
              </button>
            </div>

            {/* Inline Search / Sorting */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Search document name..." 
                value={scopeSearch} 
                onChange={(e) => setScopeSearch(e.target.value)}
                style={{ flex: 1, height: '38px', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }}
              />
              <button type="button" className="btn btn-secondary" onClick={sortDeliverables} style={{ padding: '8px 14px', borderRadius: '8px' }}>
                Sort Alphabetically
              </button>
            </div>

            {/* Scrollable Deliverables List */}
            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1px solid #E2E8F0' }}>
                  <tr>
                    <th style={{ padding: '12px', width: '60px', textAlign: 'center' }}>Inc</th>
                    <th style={{ padding: '12px' }}>Document / Deliverable Name</th>
                    <th style={{ padding: '12px', width: '130px' }}>Est. Hours</th>
                    <th style={{ padding: '12px' }}>Scope Remarks</th>
                    <th style={{ padding: '12px', width: '180px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliverables.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: item.included ? 'white' : '#F8FAFC' }}>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={item.included} 
                          onChange={(e) => {
                            const copy = [...deliverables];
                            copy[idx].included = e.target.checked;
                            setDeliverables(copy);
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        {editingRowIdx === idx ? (
                          <input type="text" value={editDocName} onChange={(e) => setEditDocName(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                        ) : (
                          <span style={{ fontWeight: '600' }}>{item.deliverable}</span>
                        )}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {editingRowIdx === idx ? (
                          <input type="number" value={editHours} onChange={(e) => setEditHours(Number(e.target.value) || 0)} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                        ) : (
                          <span>{item.estimated_hours} hrs</span>
                        )}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {editingRowIdx === idx ? (
                          <input type="text" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                        ) : (
                          <span style={{ color: '#64748B' }}>{item.remarks || '-'}</span>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {editingRowIdx === idx ? (
                            <button type="button" onClick={() => saveEditRow(idx)} style={{ background: '#10B981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><Check size={14} /></button>
                          ) : (
                            <button type="button" onClick={() => startEditRow(idx)} style={{ background: '#CBD5E1', color: '#1E293B', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}><Edit3 size={14} /></button>
                          )}
                          <button type="button" onClick={() => moveRow(idx, 'up')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ArrowUp size={14} /></button>
                          <button type="button" onClick={() => moveRow(idx, 'down')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ArrowDown size={14} /></button>
                          <button type="button" onClick={() => duplicateRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Copy size={14} /></button>
                          <button type="button" onClick={() => deleteRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD 3: Commercial Terms Editor */}
          <div className="card" style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#6C4DFF', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Card 3: Commercial Conditions & Terms</h3>
            <div style={{ display: 'flex', gap: '6px', background: '#F8FAFC', padding: '6px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
              <button type="button" onClick={() => appendConditionText('bold')} style={{ padding: '6px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}><Bold size={14} /></button>
              <button type="button" onClick={() => appendConditionText('italic')} style={{ padding: '6px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}><Italic size={14} /></button>
              <button type="button" onClick={() => appendConditionText('bullet')} style={{ padding: '6px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}><List size={14} /></button>
              <button type="button" onClick={() => appendConditionText('numbered')} style={{ padding: '6px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer' }}><ListOrdered size={14} /></button>
            </div>
            <textarea
              value={commercialConditions}
              onChange={(e) => setCommercialConditions(e.target.value)}
              disabled={!isAdmin}
              rows="6"
              style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace' }}
              placeholder="Commercial terms text..."
            ></textarea>
          </div>

          {/* CARD 4: Pricing Summary Summary */}
          <div className="card" style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '16px', color: '#6C4DFF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Card 4: Cost Pricing Summary</h3>
            
            {isAdmin && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Hourly Rate ({currency})</label>
                  <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Software Licensing Cost</label>
                  <input type="number" value={softwareCost} onChange={(e) => setSoftwareCost(Number(e.target.value))} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Contingency %</label>
                  <input type="number" value={contingencyPercent} onChange={(e) => setContingencyPercent(Number(e.target.value))} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>GST %</label>
                  <input type="number" value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value))} style={{ width: '100%', height: '40px', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Engineering Hours</span>
                <strong style={{ fontSize: '1.25rem', color: '#1E293B' }}>{totalHours} hrs</strong>
              </div>
              {isAdmin && (
                <>
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Engineering Fee</span>
                    <strong style={{ fontSize: '1.25rem', color: '#1E293B' }}>{currency} {Math.round(calculatedFee).toLocaleString()}</strong>
                  </div>
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Software Cost</span>
                    <strong style={{ fontSize: '1.25rem', color: '#1E293B' }}>{currency} {Math.round(softwareCost).toLocaleString()}</strong>
                  </div>
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>GST ({gstPercent}%)</span>
                    <strong style={{ fontSize: '1.25rem', color: '#1E293B' }}>{currency} {Math.round(calculatedGst).toLocaleString()}</strong>
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: '24px', background: 'rgba(108, 77, 255, 0.08)', borderRadius: '16px', border: '1.5px solid #6C4DFF', textAlign: 'center', marginTop: '20px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6C4DFF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grand Total Estimate Summary</span>
              <h2 style={{ fontSize: '2rem', fontWeight: '850', color: '#6C4DFF', margin: '8px 0 0 0' }}>
                {currency} {Math.round(calculatedGrandTotal).toLocaleString()}
              </h2>
            </div>
          </div>

          {/* STICKY BOTTOM TOOLBAR */}
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '850px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid #CBD5E1',
            borderRadius: '16px',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            zIndex: 999
          }}>
            <button 
              type="button" 
              onClick={() => { if(confirm("Discard all edits?")) setShowEditor(false); }}
              className="btn btn-secondary"
            >
              Cancel
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                onClick={handleManualSave}
                style={{ background: '#6C4DFF', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '750', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={16} /> Save Draft
              </button>
              
              <button 
                type="button" 
                onClick={() => exportToPdf({ quotation: { client_name: clientName, project_name: projectName, quotation_number: editingQuote?.quotation_number || 'PMC-TEMP', currency, created_at: new Date().toISOString(), commercial_conditions: commercialConditions, project_location: projectLocation, contact_person: contactPerson }, items: deliverables, costing: { engineering_hours: totalHours, engineering_fee: calculatedFee, software_cost: softwareCost, contingency: calculatedContingency, subtotal: calculatedSubtotal, gst: calculatedGst, grand_total: calculatedGrandTotal, hourly_rate: hourlyRate } }, true)}
                className="btn btn-secondary"
                disabled={pdfGenerating}
              >
                {pdfGenerating ? "Generating..." : "Preview PDF"}
              </button>

              {isAdmin && editingQuote && editingQuote.status === 'Approved' && (
                <button 
                  type="button" 
                  onClick={() => exportToPdf({ quotation: editingQuote, items: deliverables, costing: { engineering_hours: totalHours, engineering_fee: calculatedFee, software_cost: softwareCost, contingency: calculatedContingency, subtotal: calculatedSubtotal, gst: calculatedGst, grand_total: calculatedGrandTotal, hourly_rate: hourlyRate } }, false)}
                  style={{ background: '#10B981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '750', cursor: 'pointer' }}
                >
                  Generate Final Quotation
                </button>
              )}

              {isEmployee && editingQuote && editingQuote.status === 'Draft' && (
                <button 
                  type="button" 
                  onClick={() => handleUpdateStatus(editingQuote.id, 'Under Review')}
                  style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '750', cursor: 'pointer' }}
                >
                  Submit for Approval
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      {selectedQuote && selectedQuote.quotation && selectedQuote.costing && selectedQuote.items && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', background: 'white', borderRadius: '16px', padding: '24px', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', color: '#1E293B' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1E293B', margin: 0 }}>
                  Quotation: {selectedQuote.quotation?.quotation_number || 'N/A'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Created by @{selectedQuote.quotation?.created_by || 'unknown'}</span>
              </div>
              <button onClick={() => setSelectedQuote(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#64748B', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                <div><strong>Client Name:</strong> <p style={{ margin: '4px 0 0 0', color: '#64748B' }}>{selectedQuote.quotation?.client_name || 'N/A'}</p></div>
                <div><strong>Project Name:</strong> <p style={{ margin: '4px 0 0 0', color: '#64748B' }}>{selectedQuote.quotation?.project_name || 'N/A'}</p></div>
                <div><strong>Location:</strong> <p style={{ margin: '4px 0 0 0', color: '#64748B' }}>{selectedQuote.quotation?.project_location || 'N/A'}</p></div>
                <div><strong>Status:</strong> 
                  <p style={{ margin: '4px 0 0 0' }}>
                    <span style={{ 
                      padding: '3px 6px', 
                      fontSize: '0.7rem', 
                      fontWeight: '700', 
                      borderRadius: '4px',
                      background: selectedQuote.quotation?.status === 'Approved' ? '#D1FAE5' : selectedQuote.quotation?.status === 'Under Review' ? '#FEF3C7' : '#E2E8F0',
                      color: selectedQuote.quotation?.status === 'Approved' ? '#065F46' : selectedQuote.quotation?.status === 'Under Review' ? '#92400E' : '#374151'
                    }}>{selectedQuote.quotation?.status || 'Draft'}</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px', color: '#6C4DFF' }}>Scope of Deliverables</h4>
                <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                    <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0 }}>
                      <tr style={{ borderBottom: '1px solid #CBD5E1' }}>
                        <th style={{ padding: '8px' }}>Document Name</th>
                        <th style={{ padding: '8px' }}>Estimated Hours</th>
                        <th style={{ padding: '8px' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(selectedQuote.items) && selectedQuote.items.filter(item => item && item.included).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '6px 8px', fontWeight: '650' }}>{item.deliverable || ''}</td>
                          <td style={{ padding: '6px 8px' }}>{item.estimated_hours || 0} hrs</td>
                          <td style={{ padding: '6px 8px', color: '#64748B' }}>{item.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px', color: '#6C4DFF' }}>Offer Pricing Summary</h4>
                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                  {isAdmin && (
                    <>
                      <div>
                        <span style={{ color: '#64748B', display: 'block' }}>Hourly Rate</span>
                        <strong>{selectedQuote.quotation?.currency || 'INR'} {(selectedQuote.costing?.hourly_rate || 0).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block' }}>Software Cost</span>
                        <strong>{selectedQuote.quotation?.currency || 'INR'} {(selectedQuote.costing?.software_cost || 0).toLocaleString()}</strong>
                      </div>
                    </>
                  )}
                  <div>
                    <span style={{ color: '#64748B', display: 'block' }}>Engineering Hours</span>
                    <strong>{selectedQuote.costing?.engineering_hours || 0} hrs</strong>
                  </div>
                  <div>
                    <span style={{ color: '#6C4DFF', display: 'block', fontWeight: 'bold' }}>Grand Total</span>
                    <strong style={{ fontSize: '1.05rem', color: '#6C4DFF' }}>{selectedQuote.quotation?.currency || 'INR'} {Math.round(selectedQuote.costing?.grand_total || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={() => exportToPdf(selectedQuote, false)} style={{ background: '#10B981', border: 'none', color: 'white', fontSize: '0.8rem', padding: '8px 14px', borderRadius: '6px' }} disabled={pdfGenerating}>
                    {pdfGenerating ? "Generating..." : "Download PDF Offer"}
                  </button>
                  <button className="btn btn-secondary" onClick={() => exportToPdf(selectedQuote, true)} style={{ fontSize: '0.8rem', padding: '8px 14px', borderRadius: '6px' }} disabled={pdfGenerating}>
                    <Eye size={14} style={{ marginRight: '4px' }} /> Preview PDF
                  </button>
                  <button className="btn btn-secondary" onClick={() => exportToExcel(selectedQuote)} style={{ fontSize: '0.8rem', padding: '8px 14px', borderRadius: '6px' }}>
                    <FileDown size={14} style={{ marginRight: '4px' }} /> Export Excel
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {isEmployee && selectedQuote.quotation?.status === 'Draft' && (
                    <button className="btn btn-primary" onClick={() => handleUpdateStatus(selectedQuote.quotation.id, 'Under Review')} style={{ background: '#6C4DFF', color: 'white', border: 'none' }}>
                      Submit for Approval
                    </button>
                  )}

                  {isManager && selectedQuote.quotation?.status === 'Under Review' && (
                    <button className="btn" onClick={() => handleUpdateStatus(selectedQuote.quotation.id, 'Draft', 'Manager Suggestion: Deliverable hours need adjustment.')} style={{ background: '#F59E0B', color: 'white', border: 'none' }}>
                      Request Edits
                    </button>
                  )}

                  {isAdmin && (
                    <>
                      {selectedQuote.quotation?.status === 'Under Review' && (
                        <button className="btn btn-primary" onClick={() => handleUpdateStatus(selectedQuote.quotation.id, 'Approved')} style={{ background: '#10B981', color: 'white', border: 'none' }}>
                          Approve Quotation
                        </button>
                      )}
                      {selectedQuote.quotation?.status === 'Approved' && (
                        <button className="btn btn-primary" onClick={() => handleUpdateStatus(selectedQuote.quotation.id, 'Sent')} style={{ background: '#3B82F6', color: 'white', border: 'none' }}>
                          Mark as Sent
                        </button>
                      )}
                      <button className="btn" onClick={() => handleDeleteQuotation(selectedQuote.quotation.id)} style={{ background: '#EF4444', color: 'white', border: 'none' }}>
                        Delete Request
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

class QuotationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Quotation Module Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', background: '#FFF5F5', border: '1.5px solid #FEF2F2', borderRadius: '12px', color: '#991B1B' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>Something went wrong</h3>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>The Quotation Management Module encountered a runtime exception. Please reload or contact support.</p>
          {this.props.isAdmin && (
            <pre style={{ fontSize: '0.75rem', marginTop: '12px', background: '#FEE2E2', padding: '10px', borderRadius: '6px', overflowX: 'auto' }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function QuotationsModule(props) {
  return (
    <QuotationErrorBoundary isAdmin={props.user?.role === 'Admin' || props.user?.role === 'SuperAdmin'}>
      <QuotationsModuleInner {...props} />
    </QuotationErrorBoundary>
  );
}
