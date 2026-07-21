import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to parse metadata from the notes field
export const parseInvoiceNotes = (notesString) => {
  const defaultDetails = {
    client_state: 'Karnataka',
    cgst_rate: 9,
    cgst_amount: 0,
    sgst_rate: 9,
    sgst_amount: 0,
    igst_rate: 0,
    igst_amount: 0,
    clean_notes: notesString || ''
  };
  
  if (!notesString) return defaultDetails;
  
  const marker = "[GST_DETAILS:";
  const index = notesString.indexOf(marker);
  if (index !== -1) {
    try {
      const lastIndex = notesString.lastIndexOf("]");
      const jsonStr = notesString.slice(index + marker.length, lastIndex).trim();
      const parsed = JSON.parse(jsonStr);
      return {
        ...defaultDetails,
        ...parsed,
        clean_notes: notesString.slice(0, index).trim()
      };
    } catch (e) {
      console.error("Failed to parse invoice GST metadata:", e);
    }
  }
  
  return defaultDetails;
};

// Safe autoTable call function to prevent runtime crash
const safeAutoTable = (doc, options) => {
  if (typeof doc.autoTable === 'function') {
    doc.autoTable(options);
  } else if (typeof autoTable === 'function') {
    autoTable(doc, options);
  } else {
    console.error("jspdf-autotable is not loaded correctly.");
  }
};

// Currency formatting helper using standard Rs. prefix
export const formatCurrency = (amount) => {
  const val = Number(amount) || 0;
  return `Rs. ${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Main function to generate executive consultancy invoice PDF
export const generateAndDownloadPDF = async ({
  inv,
  clients = [],
  projects = [],
  quotations = [],
  user = {},
  supabase = null,
  setInvoiceLoading = null,
  setInvoiceError = null,
  previewOnly = false
}) => {
  if (setInvoiceLoading) setInvoiceLoading('Generating Executive PDF...');
  if (setInvoiceError) setInvoiceError('');
  
  try {
    const client = clients.find(c => c.id === inv.client_id || c.name === inv.client_id);
    const proj = projects.find(p => p.id === inv.project_id || p.title === inv.project_id);
    const quote = quotations.find(q => q.project_name?.toLowerCase() === proj?.title?.toLowerCase() || q.quotation_number === proj?.quoteAmount);

    // Clean sequential filename: INV-2026-0001.pdf or INV-2026-0001-R1.pdf
    const baseInvNum = inv.invoice_number || 'INV-2026-0001';
    const revisionSuffix = inv.revision ? `-R${inv.revision}` : '';
    const fileName = `${baseInvNum}${revisionSuffix}.pdf`;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width; // 210mm
    const pageHeight = doc.internal.pageSize.height; // 297mm

    // Parse GST metadata
    const gstData = parseInvoiceNotes(inv.notes);
    const isLocal = gstData.client_state === 'Karnataka';
    const taxableAmount = Math.max(0, (inv.current_billing_amount || 0) - (inv.discount || 0));

    // ----------------------------------------------------------------------
    // 1. HEADER & BRANDING (Printer-Friendly Low-Ink Design)
    // ----------------------------------------------------------------------
    // Left: Company Logo Title & Address
    doc.setTextColor(15, 23, 42); // Dark Navy / Black
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PRIMELISOMETRICS", 14, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // Slate Gray
    doc.text("Marine Engineering Consultancy", 14, 20);
    doc.setFontSize(7.5);
    doc.text("GSTIN: 29AAAAA1111A1Z1 | PAN: AAAAA1111A", 14, 25);
    doc.text("Suite 404, Tech Park, Bangalore, KA, 560001, India", 14, 29);
    doc.text("Email: support@primelisometrics.com | Ph: +91 99999 88888", 14, 33);

    // Right: Invoice Title & Metadata
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth - 14, 15, { align: 'right' });

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Invoice No: ${baseInvNum}`, pageWidth - 14, 21, { align: 'right' });
    doc.text(`Date: ${inv.invoice_date || new Date().toISOString().split('T')[0]}`, pageWidth - 14, 25.5, { align: 'right' });
    doc.text(`Due Date: ${inv.due_date || 'Payment Upon Receipt'}`, pageWidth - 14, 30, { align: 'right' });

    // Minimal Status Badge Outline
    const statusText = (inv.payment_status || 'Draft').toUpperCase();
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.2);
    doc.setFillColor(255, 255, 255);
    doc.rect(pageWidth - 42, 33, 28, 4.5, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text(statusText, pageWidth - 28, 36.2, { align: 'center' });

    // Thin Bottom Border Line for Header
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(14, 40, pageWidth - 14, 40);

    // ----------------------------------------------------------------------
    // 2. CLIENT DETAILS & INVOICE SUMMARY
    // ----------------------------------------------------------------------
    let currentY = 48;

    // Bill To Box (Left Column)
    doc.setFillColor(248, 250, 252); // Light Gray Background
    doc.rect(14, currentY, 88, 34, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 88, 34, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", 18, currentY + 6);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(client?.company || client?.name || 'Client Name N/A', 18, currentY + 11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Contact: ${client?.name || 'N/A'}`, 18, currentY + 16);
    doc.text(`Email: ${client?.email || 'N/A'}`, 18, currentY + 20);
    doc.text(`Phone: ${client?.phone || 'N/A'}`, 18, currentY + 24);
    doc.text(`GSTIN: ${client?.notes?.includes("GSTIN:") ? client.notes.split("GSTIN:")[1].trim().slice(0, 15) : '29BBBBB2222B2Z2'}`, 18, currentY + 28);

    // Invoice Summary Box (Right Column)
    doc.setFillColor(248, 250, 252);
    doc.rect(108, currentY, 88, 34, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(108, currentY, 88, 34, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE SUMMARY", 112, currentY + 6);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Project: ${proj?.title || 'Marine Engineering Scope'}`, 112, currentY + 11);
    doc.text(`Quote Reference: ${quote?.quotation_number || 'Q-2026-0001'}`, 112, currentY + 16);
    doc.text(`Invoice Reference: ${inv.invoice_number || baseInvNum}`, 112, currentY + 20);
    doc.text(`Engineer in Charge: ${user?.name || 'Ashok Kumar'}`, 112, currentY + 24);
    doc.text(`Currency: ${inv.currency || 'INR (Rs.)'}`, 112, currentY + 28);

    currentY += 40;

    // ----------------------------------------------------------------------
    // 3. DELIVERABLES TABLE (Clean Professional Grid with Alternating Rows)
    // ----------------------------------------------------------------------
    const headers = [['No', 'Description / Deliverable Scope', 'Qty', 'Unit', 'Rate', 'Amount']];
    let tableRows = [];

    if (quote && Array.isArray(quote.deliverables) && quote.deliverables.length > 0) {
      quote.deliverables.forEach((item, index) => {
        const hrs = item.estimated_hours || 1;
        const rate = quote.custom_hourly_rate || 850;
        tableRows.push([
          String(index + 1),
          item.deliverable || 'Engineering Service',
          String(hrs),
          'Hrs',
          formatCurrency(rate),
          formatCurrency(hrs * rate)
        ]);
      });
    } else {
      tableRows = [
        ["1", "Hull Structural Deflection Analysis & FEA Simulation", "85", "Hrs", formatCurrency(850), formatCurrency(72250)],
        ["2", "General Arrangement & Deck Machinery Machinery Plan", "24", "Hrs", formatCurrency(850), formatCurrency(20400)],
        ["3", "3D CAD Solid Model & Nesting Drawing Release", "40", "Hrs", formatCurrency(850), formatCurrency(34000)]
      ];
    }

    safeAutoTable(doc, {
      head: headers,
      body: tableRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { 
        fillColor: [15, 23, 42], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        fontSize: 8.5,
        cellPadding: 4 
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8, cellPadding: 3.5, lineColor: [226, 232, 240], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 90 },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 26, halign: 'right' }
      }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // ----------------------------------------------------------------------
    // 4. FINANCIAL TOTALS BLOCK
    // ----------------------------------------------------------------------
    const labelX = 122;
    const valueX = pageWidth - 14;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);

    // Subtotal
    doc.text("Subtotal:", labelX, currentY);
    doc.text(formatCurrency(inv.current_billing_amount || 0), valueX, currentY, { align: 'right' });
    currentY += 4.5;

    // Discount
    if (inv.discount && inv.discount > 0) {
      doc.text("Discount:", labelX, currentY);
      doc.text(`- ${formatCurrency(inv.discount)}`, valueX, currentY, { align: 'right' });
      currentY += 4.5;
    }

    // Taxable Value
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Taxable Value:", labelX, currentY);
    doc.text(formatCurrency(taxableAmount), valueX, currentY, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    currentY += 4.5;

    // Taxes
    if (isLocal) {
      doc.text("CGST (9%):", labelX, currentY);
      doc.text(formatCurrency(gstData.cgst_amount), valueX, currentY, { align: 'right' });
      currentY += 4.5;
      doc.text("SGST (9%):", labelX, currentY);
      doc.text(formatCurrency(gstData.sgst_amount), valueX, currentY, { align: 'right' });
      currentY += 4.5;
    } else {
      doc.text("IGST (18%):", labelX, currentY);
      doc.text(formatCurrency(gstData.igst_amount), valueX, currentY, { align: 'right' });
      currentY += 4.5;
    }

    // Round Off
    const rawTotal = taxableAmount + (gstData.cgst_amount + gstData.sgst_amount + gstData.igst_amount);
    const grandTotal = inv.grand_total || Math.round(rawTotal);
    const roundOff = grandTotal - rawTotal;
    doc.text("Round Off:", labelX, currentY);
    doc.text(formatCurrency(roundOff), valueX, currentY, { align: 'right' });
    currentY += 6;

    // Bold Grand Total Line
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(labelX, currentY - 3, valueX, currentY - 3);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("GRAND TOTAL:", labelX, currentY);
    doc.text(formatCurrency(grandTotal), valueX, currentY, { align: 'right' });
    doc.line(labelX, currentY + 2, valueX, currentY + 2);

    // ----------------------------------------------------------------------
    // 5. PAYMENT INFORMATION (Clean Text Only - No QR Scan Block)
    // ----------------------------------------------------------------------
    let paymentY = doc.lastAutoTable.finalY + 8;
    
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("PAYMENT INFORMATION", 14, paymentY);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("Bank Name: HDFC Bank Corporate Primary", 14, paymentY + 5);
    doc.text("Account Number: 501009988776655", 14, paymentY + 9);
    doc.text("IFSC Code: HDFC0001234", 14, paymentY + 13);
    doc.text("UPI ID: primelisometrics@hdfcbank", 14, paymentY + 17);

    // ----------------------------------------------------------------------
    // 6. NOTES & TERMS
    // ----------------------------------------------------------------------
    let notesY = Math.max(paymentY + 24, currentY + 10);
    if (notesY > 235) {
      doc.addPage();
      notesY = 25;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(14, notesY, pageWidth - 14, notesY);
    notesY += 5;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("TERMS & PAYMENT CONDITIONS", 14, notesY);
    notesY += 4.5;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("1. Payments delayed beyond 14 calendar days from due date incur a 1.5% weekly late fee.", 14, notesY);
    notesY += 3.5;
    doc.text("2. All CAD models and report files remain Primelisometrics property until final milestone payment clearance.", 14, notesY);
    notesY += 3.5;
    doc.text("3. Proposal & invoice validity is subject to standard consultancy terms and conditions.", 14, notesY);

    if (gstData.clean_notes) {
      notesY += 4.5;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Scope & Billing Notes:", 14, notesY);
      notesY += 3.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(gstData.clean_notes, 14, notesY, { maxWidth: 100 });
    }

    // ----------------------------------------------------------------------
    // 7. FOOTER & EDITABLE SIGNATURE VERIFICATION
    // ----------------------------------------------------------------------
    let footerY = Math.max(notesY + 10, 245);
    if (footerY > 260) {
      doc.addPage();
      footerY = 245;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(14, footerY, pageWidth - 14, footerY);
    footerY += 6;

    const prepName = inv.prepared_by_name || user?.name || 'Ashok Kumar';
    const prepDesignation = inv.prepared_by_designation || 'Lead Marine Designer';

    const appName = inv.approved_by_name || 'Chandru Admin';
    const appDesignation = inv.approved_by_designation || 'Managing Director';

    // Prepared By Block
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("PREPARED BY", 14, footerY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(prepName, 14, footerY + 4);
    doc.text(prepDesignation, 14, footerY + 7.5);

    // Approved By Block
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("APPROVED BY", 85, footerY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(appName, 85, footerY + 4);
    doc.text(appDesignation, 85, footerY + 7.5);

    // Client Signature Line
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("CLIENT SIGNATURE", 150, footerY);
    doc.setDrawColor(148, 163, 184);
    doc.line(150, footerY + 8, pageWidth - 14, footerY + 8);

    // ----------------------------------------------------------------------
    // 8. MULTI-PAGE PAGE NUMBERING FOOTER
    // ----------------------------------------------------------------------
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setFillColor(248, 250, 252);
      doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("PRIMELISOMETRICS", 14, pageHeight - 5);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(" Marine Engineering Consultancy | www.primelisometrics.com", 42, pageHeight - 5);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
    }

    if (previewOnly) {
      if (setInvoiceLoading) setInvoiceLoading('');
      const previewBlobUrl = URL.createObjectURL(doc.output('blob'));
      return previewBlobUrl;
    }

    // Download PDF file
    doc.save(fileName);
    console.log(`Development Log: Executive PDF Generated successfully as ${fileName}`);

    // Upload to Supabase Storage
    const pdfBlob = doc.output('blob');
    const storagePath = `invoices/2026/${baseInvNum}.pdf`;
    let publicUrl = `https://supabase.co/storage/v1/object/private/invoice-pdfs/${storagePath}`;

    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('invoice-pdfs')
          .upload(storagePath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });
        
        if (!error && data) {
          const { data: publicData } = supabase.storage
            .from('invoice-pdfs')
            .getPublicUrl(storagePath);
          if (publicData?.publicUrl) {
            publicUrl = publicData.publicUrl;
          }
        }
      } catch (err) {
        console.error("Storage upload execution error:", err);
      }
    }

    if (setInvoiceLoading) setInvoiceLoading('');
    return publicUrl;
  } catch (err) {
    console.error("Error generating executive PDF:", err);
    if (setInvoiceError) setInvoiceError("Failed to generate PDF. Check fields consistency.");
    if (setInvoiceLoading) setInvoiceLoading('');
  }
};

// Function to generate and download clean A4 Meeting Minutes (MoM) PDF
export const generateMeetingMinutesPDF = async ({ meeting = {}, client = {}, user = {} }) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("MINUTES OF MEETING (MoM)", 14, 15);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("PRIMELISOMETRICS Marine Engineering Consultancy", 14, 21);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, 25, pageWidth - 14, 25);
  
  let currentY = 32;
  
  // Meeting Header Information
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(meeting.title || 'Technical Engineering Meeting', 14, currentY);
  currentY += 6;
  
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Client Partner: ${client.name || meeting.client_name || 'N/A'}`, 14, currentY);
  doc.text(`Date: ${meeting.date || 'N/A'} | Time: ${meeting.time || '10:00 AM'}`, 110, currentY);
  currentY += 5;
  doc.text(`Location / Platform: ${meeting.location || 'Online Conference Workspace'}`, 14, currentY);
  doc.text(`Chairperson / Organizer: ${user.name || 'Ashok Kumar'}`, 110, currentY);
  currentY += 9;
  
  // 1. Agenda
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("1. MEETING AGENDA", 14, currentY);
  currentY += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(meeting.agenda || 'General engineering review and project deliverables alignment.', 14, currentY, { maxWidth: 180 });
  currentY += 10;
  
  // 2. Attendees
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2. ATTENDEES", 14, currentY);
  currentY += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(meeting.attendees || `${client.name || 'Client Representative'}, ${user.name || 'Ashok Kumar'}`, 14, currentY, { maxWidth: 180 });
  currentY += 10;
  
  // 3. Discussion Points & Decisions
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("3. KEY DISCUSSION POINTS & DECISIONS TAKEN", 14, currentY);
  currentY += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const notesText = meeting.discussion_points || meeting.minutes_notes || meeting.notes || 'Reviewed 3D CAD modeling progress, structural calculations, and billing milestones.';
  doc.text(notesText, 14, currentY, { maxWidth: 180 });
  currentY += 14;
  
  // 4. Action Items
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("4. ACTION ITEMS", 14, currentY);
  currentY += 4;
  
  const headers = [['#', 'Action Item / Deliverable Description', 'Responsible Person', 'Due Date']];
  const rows = Array.isArray(meeting.action_items) && meeting.action_items.length > 0
    ? meeting.action_items.map((item, idx) => [String(idx + 1), item.task || item.description, item.responsible || 'Lead Engineer', item.due_date || 'Next Milestone'])
    : [
        ['1', meeting.action_item || 'Finalize structural model revisions', meeting.responsible_person || user.name || 'Lead Designer', meeting.due_date || 'Next Week']
      ];
      
  safeAutoTable(doc, {
    head: headers,
    body: rows,
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, cellPadding: 3.5 },
    styles: { fontSize: 8, cellPadding: 3 }
  });
  
  currentY = doc.lastAutoTable.finalY + 12;
  if (currentY > 250) {
    doc.addPage();
    currentY = 25;
  }
  
  // Footer Signatures
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("ORGANIZER / CHAIRPERSON", 14, currentY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(user.name || 'Ashok Kumar', 14, currentY + 4);
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("CLIENT ACKNOWLEDGMENT", 120, currentY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(client.name || 'Client Representative', 120, currentY + 4);
  
  const fileName = `MoM_${meeting.date || '2026'}_${(meeting.title || 'Meeting').replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

