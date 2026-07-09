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
    "1. Offer Validity\nThis quotation shall remain valid for 30 calendar days from the date of issue.\n\n" +
    "2. Scope of Work\nOnly the deliverables specifically listed in this quotation are included. Any additional work shall be treated as a variation order and quoted separately.\n\n" +
    "3. Revision Policy\nThe quotation includes a maximum of two review/revision cycles. Further revisions requested by the Client will be charged separately.\n\n" +
    "4. Client Responsibilities\nThe Client shall provide all required input data, drawings, specifications, approvals, and comments in a timely manner.\n\n" +
    "5. Delivery Schedule\nProject schedule shall commence only after receipt of advance payment and all required project inputs.\n\n" +
    "6. Taxes\nGST and all applicable statutory taxes shall be charged as per prevailing Government regulations unless otherwise stated.\n\n" +
    "7. Intellectual Property\nAll engineering documents remain the intellectual property of Primelisometrics Consultancy until full payment has been received.\n\n" +
    "8. Confidentiality\nAll information exchanged during the project shall remain confidential and shall not be disclosed to any third party without written consent.\n\n" +
    "9. Suspension of Work\nWork may be suspended if scheduled milestone payments are delayed beyond the agreed payment period.\n\n" +
    "10. Liability\nPrimelisometrics Consultancy's liability shall be limited to the total value of this quotation.\n\n" +
    "11. Force Majeure\nNeither party shall be liable for delays caused by circumstances beyond reasonable control.\n\n" +
    "12. Acceptance\nAcceptance of this quotation constitutes acceptance of all commercial terms and conditions stated herein."
  );

  // Card 4: Pricing Settings (confidential coefficients)
  const [hourlyRate, setHourlyRate] = useState(1400);
  const [softwareCost, setSoftwareCost] = useState(50000);
  const [contingencyPercent, setContingencyPercent] = useState(10);
  const [gstPercent, setGstPercent] = useState(18);

  // Editable Payment Schedule Milestones (4 milestones)
  const [milestone1Name, setMilestone1Name] = useState('Advance Payment');
  const [milestone1Percent, setMilestone1Percent] = useState(25);
  const [milestone1Desc, setMilestone1Desc] = useState('Payable upon acceptance of quotation and Purchase Order / Work Order. Engineering activities commence only after receipt of advance payment.');
  
  const [milestone2Name, setMilestone2Name] = useState('Concept & Preliminary Engineering Submission');
  const [milestone2Percent, setMilestone2Percent] = useState(25);
  const [milestone2Desc, setMilestone2Desc] = useState('Payable upon submission of initial engineering package, concept drawings, calculations, or preliminary deliverables.');

  const [milestone3Name, setMilestone3Name] = useState('Detailed Engineering Submission');
  const [milestone3Percent, setMilestone3Percent] = useState(30);
  const [milestone3Desc, setMilestone3Desc] = useState('Payable upon submission of detailed engineering package and client review.');

  const [milestone4Name, setMilestone4Name] = useState('Final Deliverables & Project Close-Out');
  const [milestone4Percent, setMilestone4Percent] = useState(20);
  const [milestone4Desc, setMilestone4Desc] = useState('Payable before release of final editable files, native CAD models, calculations, and engineering documents.');

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

  const viewDetails = async (quote) => {
    try {
      const res = await fetch(`/api/quotations/${quote.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedQuote(data);
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed to load details.");
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

  // Preload logo helper
  const preloadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  // Generate and export document PDF
  const exportToPdf = async (qData, previewOnly = false) => {
    setPdfGenerating(true);
    const isDebug = process.env.NEXT_PUBLIC_PDF_DEBUG === 'true';
    if (isDebug) {
      console.log("[PDF Debug] Building premium corporate engineering quotation PDF...");
    }
    
    try {
      const q = qData?.quotation || {};
      const items = qData?.items || [];
      const costing = qData?.costing || {};

      // Inputs Validation
      const validationErrors = [];
      if (!q.client_name) validationErrors.push("Client Name");
      if (!q.project_name) validationErrors.push("Project Name");
      if (!items.some(item => item && item.included)) validationErrors.push("At least one included deliverable document");
      if (typeof costing.grand_total !== 'number' || isNaN(costing.grand_total) || costing.grand_total <= 0) {
        validationErrors.push("Valid Grand Total Professional Fee");
      }

      if (validationErrors.length > 0) {
        alert("Cannot generate PDF.\n\nMissing / Invalid details:\n" + validationErrors.map(e => `• ${e}`).join("\n"));
        setPdfGenerating(false);
        return;
      }

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Load original logo asset
      const logoImg = await preloadImage('/logo.png');

      // Branding Colors
      const primaryColor = [86, 61, 255];     // #563DFF Gradient Start
      const secondaryColor = [122, 92, 255];  // #7A5CFF Gradient End
      const textDarkNavy = [15, 23, 42];      // #0F172A Dark Navy
      const textMutedGrey = [100, 116, 139];   // #64748B Muted Grey

      // Helper to draw horizontal gradient banner (140 px = 37 mm)
      const drawGradientBanner = (x, y, w, h) => {
        for (let i = 0; i < w; i++) {
          const ratio = i / w;
          const r = Math.round(primaryColor[0] * (1 - ratio) + secondaryColor[0] * ratio);
          const g = Math.round(primaryColor[1] * (1 - ratio) + secondaryColor[1] * ratio);
          const b = Math.round(primaryColor[2] * (1 - ratio) + secondaryColor[2] * ratio);
          doc.setFillColor(r, g, b);
          doc.rect(x + i, y, 1, h, 'F');
        }
      };

      // Helper to draw section title layout with accent left border
      const drawSectionHeader = (title, y) => {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(15, y, 2.5, 6, 'F');
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(title.toUpperCase(), 20, y + 4.5);
      };

      // ==========================================
      // PAGE 1: COVER SHEET & CLIENT INFORMATION
      // ==========================================
      if (isDebug) console.log("[PDF Debug] Page 1: Drawing premium cover sheet...");
      
      // Top Header Gradient Banner Band (Height: 37 mm / ~140 px)
      drawGradientBanner(0, 0, 210, 37);

      // Embedded original logo or fallback vector symbol (centered vertically in 37mm banner)
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 12, 9.5, 18, 18);
      } else {
        doc.setFillColor(255, 255, 255);
        doc.circle(21, 18.5, 9, 'F');
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("P", 18.5, 23);
      }

      // Center Title: ENGINEERING CONSULTANCY OFFER
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text("ENGINEERING CONSULTANCY OFFER", 105, 20.5, { align: 'center', maxWidth: 115 });

      // Right Address Header
      doc.setFontSize(8.5);
      doc.setFont("Helvetica", "normal");
      doc.text("Primelisometrics Consultancy", 198, 16, { align: 'right' });
      doc.text("www.primelisometrics.com", 198, 21, { align: 'right' });

      // 40 px Space (approx 11 mm)
      // Four Information Cards Grid starting at Y = 48
      const issueDateStr = new Date(q.created_at || Date.now()).toLocaleDateString();
      const infoStripCards = [
        { label: "QUOTATION REFERENCE", val: q.quotation_number || 'PMC-TEMP', x: 15, w: 42 },
        { label: "ISSUE DATE", val: issueDateStr, x: 60, w: 42 },
        { label: "VALIDITY", val: "30 Days", x: 105, w: 42 },
        { label: "CURRENCY", val: q.currency || 'INR', x: 150, w: 45 }
      ];

      infoStripCards.forEach(c => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.35);
        doc.roundedRect(c.x, 48, c.w, 15, 2, 2, 'FD');

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(textMutedGrey[0], textMutedGrey[1], textMutedGrey[2]);
        doc.text(c.label, c.x + 4, 53);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(textDarkNavy[0], textDarkNavy[1], textDarkNavy[2]);
        doc.text(c.val, c.x + 4, 59);
      });

      // Client & Project specifications card
      drawSectionHeader("PROJECT INFORMATION", 75);

      // Card wrapper outline
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.35);
      doc.roundedRect(15, 83, 180, 52, 2, 2, 'FD');

      doc.setFontSize(9.5);
      doc.setTextColor(textDarkNavy[0], textDarkNavy[1], textDarkNavy[2]);

      let gridY = 91;
      const writeGridRow = (l1, v1, l2, v2) => {
        doc.setFont("Helvetica", "bold");
        doc.text(l1, 20, gridY);
        doc.setFont("Helvetica", "normal");
        doc.text(v1 || 'N/A', 55, gridY);

        if (l2) {
          doc.setFont("Helvetica", "bold");
          doc.text(l2, 110, gridY);
          doc.setFont("Helvetica", "normal");
          doc.text(v2 || 'N/A', 145, gridY);
        }
        gridY += 9;
      };

      writeGridRow("Client Company:", q.client_name, "Project Name:", q.project_name);
      writeGridRow("Contact Person:", q.contact_person, "Project Location:", q.project_location);
      writeGridRow("Capacity details:", q.plant_capacity, "Pricing Currency:", q.currency);

      // Brief intro box
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 142, 180, 42, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("EXECUTIVE SUMMARY", 22, 152);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textDarkNavy[0], textDarkNavy[1], textDarkNavy[2]);
      doc.text(`This document details a structured engineering offer for the development of design deliverables. Primelisometrics Consultancy will perform the engineering scope comprising ${items.filter(i=>i.included).length} manual deliverables, estimated at ${costing.engineering_hours || 0} engineering workflow hours.`, 22, 160, { maxWidth: 165 });

      // ==========================================
      // PAGE 2: COMMERCIAL SUMMARY & PAYMENTS
      // ==========================================
      if (isDebug) console.log("[PDF Debug] Page 2: Generating pricing summary page...");
      doc.addPage();
      
      drawSectionHeader("COMMERCIAL SUMMARY", 30);

      // Highlighted Purple Card for Grand Total
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.roundedRect(15, 40, 180, 24, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text("TOTAL CONTRACT VALUE (LUMP SUM)", 25, 49);
      doc.setFontSize(15);
      doc.text(`${q.currency || 'INR'} ${Math.round(costing.grand_total || 0).toLocaleString()}`, 25, 57);

      // Detailed Commercial Pricing parameters
      doc.setTextColor(textDarkNavy[0], textDarkNavy[1], textDarkNavy[2]);
      doc.setFontSize(9.5);
      gridY = 80;

      const writeSummaryRow = (label, val) => {
        doc.setFont("Helvetica", "bold");
        doc.text(label, 15, gridY);
        doc.setFont("Helvetica", "normal");
        doc.text(val, 195, gridY, { align: 'right' });
        gridY += 9;
      };

      writeSummaryRow("Total Scope Engineering Hours:", `${costing.engineering_hours || 0} hrs`);
      writeSummaryRow("Software Tools & Licenses:", `${q.currency || 'INR'} ${(costing.software_cost || 0).toLocaleString()}`);
      writeSummaryRow("GST Component charges:", `${q.currency || 'INR'} ${(costing.gst || 0).toLocaleString()}`);
      writeSummaryRow("Contingency Allocation:", `${q.currency || 'INR'} ${(costing.contingency || 0).toLocaleString()}`);

      // Payment schedule section
      gridY += 8;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("PAYMENT MILESTONES SCHEDULE", 15, gridY);
      gridY += 4;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(15, gridY, 195, gridY);
      gridY += 8;

      const scheduleData = [
        [milestone1Name, `${milestone1Percent}%`, `${q.currency || 'INR'} ${Math.round((costing.grand_total * milestone1Percent) / 100).toLocaleString()}`],
        [milestone2Name, `${milestone2Percent}%`, `${q.currency || 'INR'} ${Math.round((costing.grand_total * milestone2Percent) / 100).toLocaleString()}`],
        [milestone3Name, `${milestone3Percent}%`, `${q.currency || 'INR'} ${Math.round((costing.grand_total * milestone3Percent) / 100).toLocaleString()}`],
        [milestone4Name, `${milestone4Percent}%`, `${q.currency || 'INR'} ${Math.round((costing.grand_total * milestone4Percent) / 100).toLocaleString()}`],
      ];

      autoTable(doc, {
        startY: gridY,
        head: [['Milestone Stage Description', 'Percentage', 'Calculated Milestone Fee']],
        body: scheduleData,
        headStyles: { fillColor: primaryColor },
        theme: 'grid',
        styles: { fontSize: 8.5 }
      });

      // ==========================================
      // PAGE 3: DELIVERABLES TABLE
      // ==========================================
      if (isDebug) console.log("[PDF Debug] Page 3: Adding deliverables table...");
      doc.addPage();
      
      drawSectionHeader("SCOPE OF DELIVERABLES", 30);

      const tableRows = items.filter(item => item && item.included).map((item, idx) => [
        idx + 1,
        item.deliverable || 'Unnamed Document',
        `${item.estimated_hours || 0} hrs`,
        item.remarks || ""
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['S.No', 'Document Name / Scope Description', 'Estimated Hours', 'Remarks']],
        body: tableRows,
        headStyles: { fillColor: primaryColor },
        theme: 'striped',
        styles: { fontSize: 8 }
      });

      // ==========================================
      // PAGE 4: COMMERCIAL CONDITIONS
      // ==========================================
      if (isDebug) console.log("[PDF Debug] Page 4: Generating terms page...");
      doc.addPage();
      
      drawSectionHeader("COMMERCIAL CONDITIONS & TERMS", 30);

      // 4-Milestone Payment Schedule Table on Page 4
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("MILESTONE PAYMENT SCHEDULE", 15, 41);

      const termsScheduleData = [
        [milestone1Name, milestone1Desc, `${milestone1Percent}%`, `${q.currency || 'INR'} ${Math.round((costing.grand_total * milestone1Percent) / 100).toLocaleString()}`],
        [milestone2Name, milestone2Desc, `${milestone2Percent}%`, `${q.currency || 'INR'} ${Math.round((costing.grand_total * milestone2Percent) / 100).toLocaleString()}`],
        [milestone3Name, milestone3Desc, `${milestone3Percent}%`, `${q.currency || 'INR'} ${Math.round((costing.grand_total * milestone3Percent) / 100).toLocaleString()}`],
        [milestone4Name, milestone4Desc, `${milestone4Percent}%`, `${q.currency || 'INR'} ${Math.round((costing.grand_total * milestone4Percent) / 100).toLocaleString()}`],
      ];

      autoTable(doc, {
        startY: 45,
        head: [['Milestone Stage', 'Description / Trigger Event', 'Payment %', 'Milestone Fee']],
        body: termsScheduleData,
        headStyles: { fillColor: primaryColor },
        theme: 'grid',
        styles: { fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 90 },
          2: { cellWidth: 18 },
          3: { cellWidth: 37 }
        }
      });

      let nextY = doc.lastAutoTable.finalY + 8;
      
      // Payment Notes
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(textDarkNavy[0], textDarkNavy[1], textDarkNavy[2]);
      doc.text("Payment Schedule Notes:", 15, nextY);
      nextY += 5;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("• Payments shall be made within 7 days of invoice date.", 18, nextY);
      nextY += 4.5;
      doc.text("• Final editable engineering files shall be released only after receipt of full payment.", 18, nextY);
      nextY += 4.5;
      doc.text("• Delays in payment may result in corresponding delays in project delivery.", 18, nextY);
      nextY += 4.5;
      doc.text("• Bank transfer charges shall be borne by the Client.", 18, nextY);

      nextY += 8;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(15, nextY, 195, nextY);
      
      // Standard conditions
      nextY += 8;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("STANDARD CONTRACTUAL CONDITIONS", 15, nextY);
      
      nextY += 5;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(textDarkNavy[0], textDarkNavy[1], textDarkNavy[2]);
      const conditionsLines = doc.splitTextToSize(commercialConditions || 'None.', 180);

      let termsY = nextY;
      conditionsLines.forEach(line => {
        if (termsY > 265) {
          doc.addPage();
          termsY = 35;
          drawSectionHeader("COMMERCIAL CONDITIONS & TERMS (CONT.)", 20);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(textDarkNavy[0], textDarkNavy[1], textDarkNavy[2]);
        }
        doc.text(line, 15, termsY);
        termsY += 4.5;
      });

      // ==========================================
      // FINAL PAGE: SIGNATURE BLOCKS
      // ==========================================
      if (isDebug) console.log("[PDF Debug] Final Page: Generating signatures page...");
      doc.addPage();

      drawSectionHeader("OFFER ACCEPTANCE & SIGNATURES", 30);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(textDarkNavy[0], textDarkNavy[1], textDarkNavy[2]);
      doc.text("By signing below, the parties agree to the terms, conditions, scope of deliverables, and payment schedule milestones outlined within this offer proposal document.", 15, 42, { maxWidth: 180 });

      gridY = 100;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.4);
      
      // Signature lines
      doc.line(15, gridY, 85, gridY);
      doc.line(125, gridY, 195, gridY);
      
      gridY += 5;
      doc.setFont("Helvetica", "bold");
      doc.text("Prepared By:", 15, gridY);
      doc.text("Approved & Accepted By:", 125, gridY);

      gridY += 5;
      doc.setFont("Helvetica", "normal");
      doc.text("Engineering Manager", 15, gridY);
      doc.text("Authorized Signatory (Client)", 125, gridY);

      gridY += 5;
      doc.text("Primelisometrics Consultancy", 15, gridY);
      doc.text("Company Stamp / Seal Area:", 125, gridY);

      // Seal box outline
      doc.rect(125, gridY + 4, 60, 30);

      // ==========================================
      // RUNNING HEADERS & FOOTERS ON EVERY PAGE
      // ==========================================
      if (isDebug) console.log("[PDF Debug] Compiling page headers and footer tags...");
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // --- RUNNING HEADERS (Every page after page 1) ---
        if (i > 1) {
          // Horizontal running header divider line
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.4);
          doc.line(15, 18, 195, 18);

          // Small Logo / Brand
          if (logoImg) {
            doc.addImage(logoImg, 'PNG', 15, 7, 9, 9);
          }
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text("PRIMELISOMETRICS", 26, 13);

          // Center Page Title
          let pageTitle = "COMMERCIAL SUMMARY";
          if (i === 3) pageTitle = "SCOPE OF DELIVERABLES";
          if (i === 4) pageTitle = "COMMERCIAL CONDITIONS & TERMS";
          if (i === 5) pageTitle = "OFFER ACCEPTANCE & SIGNATURES";
          
          doc.setFont("Helvetica", "normal");
          doc.setTextColor(textDarkNavy[0], textDarkNavy[1], textDarkNavy[2]);
          doc.text(pageTitle, 105, 13, { align: 'center' });

          // Right Quotation number
          doc.setTextColor(textMutedGrey[0], textMutedGrey[1], textMutedGrey[2]);
          doc.text(q.quotation_number || 'PMC-TEMP', 195, 13, { align: 'right' });
        }

        // --- FOOTERS (Every page, including cover) ---
        // Footer Height: 35 px = ~9 mm. Bottom margin is 297 - 9 = 288.
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.45);
        doc.line(15, 280, 195, 280);

        doc.setFontSize(7.5);
        doc.setTextColor(textMutedGrey[0], textMutedGrey[1], textMutedGrey[2]);

        // Left Column (Company & email)
        doc.setFont("Helvetica", "bold");
        doc.text("Primelisometrics Consultancy", 15, 284);
        doc.setFont("Helvetica", "normal");
        doc.text("admin@primelisometrics.com", 15, 287.5);

        // Center Column (Confidential note)
        doc.text("Confidential Engineering Proposal", 105, 285.5, { align: 'center' });

        // Right Column (Page number)
        doc.text(`Page ${i} of ${totalPages}`, 195, 285.5, { align: 'right' });
      }

      if (isDebug) console.log("[PDF Debug] Outputting proposal PDF document...");
      if (previewOnly) {
        window.open(doc.output('bloburl'), '_blank');
      } else {
        doc.save(`${q.quotation_number || 'PMC-TEMP'}_Engineering_Quotation.pdf`);
      }
      triggerToast(previewOnly ? "Preview proposal generated." : "Downloaded corporate PDF proposal.");
      
      if (isDebug) console.log("[PDF Debug] PDF generation finished.");
    } catch (e) {
      console.error("PDF Generation Exception caught:", e);
      console.error(e.stack);
      console.error("Failing Component Context: exportToPdf");
      alert(`Failed to compile proposal PDF: ${e.message}`);
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
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px' }}>Engineering Fee Rate Factor ({currency})</label>
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
                <div style={{ gridColumn: 'span 4', borderTop: '1px solid #E2E8F0', paddingTop: '16px', marginTop: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#6C4DFF', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Edit Payment Schedule Milestones</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Milestone 1 Description</label>
                      <input type="text" value={milestone1Name} onChange={(e) => setMilestone1Name(e.target.value)} style={{ width: '100%', height: '36px', padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748B', display: 'block', marginTop: '4px', marginBottom: '2px' }}>Milestone 1 %</label>
                      <input type="number" value={milestone1Percent} onChange={(e) => setMilestone1Percent(Number(e.target.value) || 0)} style={{ width: '100%', height: '36px', padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Milestone 2 Description</label>
                      <input type="text" value={milestone2Name} onChange={(e) => setMilestone2Name(e.target.value)} style={{ width: '100%', height: '36px', padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748B', display: 'block', marginTop: '4px', marginBottom: '2px' }}>Milestone 2 %</label>
                      <input type="number" value={milestone2Percent} onChange={(e) => setMilestone2Percent(Number(e.target.value) || 0)} style={{ width: '100%', height: '36px', padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Milestone 3 Description</label>
                      <input type="text" value={milestone3Name} onChange={(e) => setMilestone3Name(e.target.value)} style={{ width: '100%', height: '36px', padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748B', display: 'block', marginTop: '4px', marginBottom: '2px' }}>Milestone 3 %</label>
                      <input type="number" value={milestone3Percent} onChange={(e) => setMilestone3Percent(Number(e.target.value) || 0)} style={{ width: '100%', height: '36px', padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '4px' }}>Milestone 4 Description</label>
                      <input type="text" value={milestone4Name} onChange={(e) => setMilestone4Name(e.target.value)} style={{ width: '100%', height: '36px', padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                      <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748B', display: 'block', marginTop: '4px', marginBottom: '2px' }}>Milestone 4 %</label>
                      <input type="number" value={milestone4Percent} onChange={(e) => setMilestone4Percent(Number(e.target.value) || 0)} style={{ width: '100%', height: '36px', padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                    </div>
                  </div>
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
                  onClick={() => exportToPdf({ 
                    quotation: { 
                      ...editingQuote,
                      client_name: clientName, 
                      project_name: projectName, 
                      contact_person: contactPerson, 
                      project_location: projectLocation, 
                      currency, 
                      commercial_conditions: commercialConditions 
                    }, 
                    items: deliverables, 
                    costing: { 
                      engineering_hours: totalHours, 
                      engineering_fee: calculatedFee, 
                      software_cost: softwareCost, 
                      contingency: calculatedContingency, 
                      subtotal: calculatedSubtotal, 
                      gst: calculatedGst, 
                      grand_total: calculatedGrandTotal, 
                      hourly_rate: hourlyRate 
                    } 
                  }, false)}
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
