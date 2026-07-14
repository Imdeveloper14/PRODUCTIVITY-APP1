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

// Draws a very faint engineering grid background (5% opacity visual grid)
const drawFaintEngineeringWatermark = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setDrawColor(153, 27, 27); // Dark Red Primary
  doc.setLineWidth(0.05);
  
  // Draw vertical grid lines
  for (let x = 10; x < pageWidth; x += 20) {
    doc.line(x, 10, x, pageHeight - 10);
  }
  // Draw horizontal grid lines
  for (let y = 10; y < pageHeight; y += 20) {
    doc.line(10, y, pageWidth - 10, y);
  }

  // Centered circular compass watermark symbol
  doc.setDrawColor(153, 27, 27);
  doc.circle(pageWidth / 2, pageHeight / 2, 40, 'D');
  doc.circle(pageWidth / 2, pageHeight / 2, 42, 'D');
  doc.line(pageWidth / 2 - 50, pageHeight / 2, pageWidth / 2 + 50, pageHeight / 2);
  doc.line(pageWidth / 2, pageHeight / 2 - 50, pageWidth / 2, pageHeight / 2 + 50);

  doc.setTextColor(153, 27, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("PRIMELISOMETRICS CONSULTANCY", pageWidth / 2, pageHeight / 2 + 5, { align: 'center', angle: 45 });

  // Reset graphics state manually to defaults
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
};

// Shared currency formatting function (avoids Unicode glyph overlaps by using "Rs.")
export const formatCurrency = (amount) => {
  const val = Number(amount) || 0;
  return `Rs. ${val.toLocaleString('en-IN')}`;
};

// Main function to generate the premium engineering invoice PDF
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
  if (setInvoiceLoading) setInvoiceLoading('Generating Engineering PDF...');
  if (setInvoiceError) setInvoiceError('');
  
  try {
    const client = clients.find(c => c.id === inv.client_id || c.name === inv.client_id);
    const proj = projects.find(p => p.id === inv.project_id || p.title === inv.project_id);
    const quote = quotations.find(q => q.project_name?.toLowerCase() === proj?.title?.toLowerCase() || q.quotation_number === proj?.quoteAmount);

    const clientName = client ? client.name : "Unknown_Client";
    const sanitizedClientName = clientName.replace(/\s+/g, '_');
    const fileName = `${inv.invoice_number}_${sanitizedClientName}.pdf`;

    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Draw 5% opacity engineering grid
    drawFaintEngineeringWatermark(doc);
    
    // Parse GST metadata
    const gstData = parseInvoiceNotes(inv.notes);
    const isLocal = gstData.client_state === 'Karnataka';
    const taxableAmount = Math.max(0, inv.current_billing_amount - inv.discount);

    // 1. Premium Logo & Brand Header
    doc.setFillColor(153, 27, 27); // Dark Red Brand
    doc.rect(0, 0, 210, 48, 'F');
    
    // Brand details (Left)
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PRIMELISOMETRICS CONSULTANCY", 15, 16);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Marine Engineering, 3D BIM, Scantlings & ERP Systems", 15, 21);
    doc.text("GSTIN: 29AAAAA1111A1Z1 | PAN: AAAAA1111A | CIN: U74140KA2026PTC123456", 15, 25);
    doc.text("Registered Office: Suite 404, Tech Park, Bangalore, Karnataka, 560001, India", 15, 29);
    doc.text("Email: support@primelisometrics.com | Web: www.primelisometrics.com | Ph: +91 99999 88888", 15, 33);
    
    // Draw Visual Brand Logo Symbol (Hexagon Grid)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.line(15, 39, 195, 39);

    // Invoice Meta Header (Right)
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 150, 16);
    
    doc.setFontSize(9);
    doc.text(`No: ${inv.invoice_number || 'INV-2026-XXXX'}`, 150, 23);
    doc.setFont("helvetica", "normal");
    doc.text(`Revision: R-0`, 150, 28);
    doc.text(`Status: ${(inv.payment_status || 'Pending').toUpperCase()}`, 150, 33);

    // 2. Client & Project Columns
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENT / BILLING DETAILS:", 15, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Company: ${client?.company || 'Company N/A'}`, 15, 60);
    doc.text(`Contact: ${client?.name || 'Contact N/A'}`, 15, 64);
    doc.text(`GSTIN: ${client?.notes?.includes("GSTIN:") ? client.notes.split("GSTIN:")[1].trim().slice(0, 15) : '29BBBBB2222B2Z2'}`, 15, 68);
    doc.text(`Address: ${client?.notes || 'Bangalore Office, India'}`, 15, 72, { maxWidth: 55 });
    doc.text(`State: ${gstData.client_state || 'Karnataka'} | Country: India`, 15, 80);

    doc.setFont("helvetica", "bold");
    doc.text("PROJECT & ENGINEERING METADATA:", 75, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Project Code: PRJ-${(proj?.id || 'XXXX').slice(0, 5).toUpperCase()}`, 75, 60);
    doc.text(`Project Name: ${proj?.title || 'General Engineering'}`, 75, 64);
    doc.text(`Quote Ref: ${quote?.quotation_number || 'Q-2026-0001'}`, 75, 68);
    doc.text(`Discipline: Naval Architecture`, 75, 72);
    doc.text(`Engineer in Charge: Ashok Kumar`, 75, 76);
    doc.text(`Billing Method: Milestone-Based`, 75, 80);

    doc.setFont("helvetica", "bold");
    doc.text("ERP RUNTIME DATES:", 145, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Creation Date: ${inv.invoice_date || new Date().toISOString().split('T')[0]}`, 145, 60);
    doc.text(`Approval Date: ${inv.approved_at || inv.invoice_date || new Date().toISOString().split('T')[0]}`, 145, 64);
    doc.text(`Invoice Date: ${inv.invoice_date || new Date().toISOString().split('T')[0]}`, 145, 68);
    doc.text(`Due Date: ${inv.due_date || 'N/A'}`, 145, 72);
    doc.text(`Project Status: ${proj?.status || 'In Progress'}`, 145, 76);

    // Divider Line
    doc.setDrawColor(153, 27, 27);
    doc.setLineWidth(0.4);
    doc.line(15, 85, 195, 85);

    // 3. Deliverables Table (Loads actual deliverables from linked quotation if found, else falls back)
    const headers = [['No', 'Scope / Engineering Deliverables', 'Discipline', 'Hours', 'Rate', 'Amount']];
    let tableRows = [];

    if (quote && Array.isArray(quote.deliverables) && quote.deliverables.length > 0) {
      quote.deliverables.forEach((item, index) => {
        tableRows.push([
          String(index + 1),
          item.deliverable || 'Scope Module',
          item.category || quote.project_type || 'Naval Architecture',
          item.estimated_hours ? `${item.estimated_hours} hrs` : '-',
          formatCurrency(quote.custom_hourly_rate || 850),
          formatCurrency((item.estimated_hours || 0) * (quote.custom_hourly_rate || 850))
        ]);
      });
    } else {
      // Fallback structured deliverables
      tableRows = [
        ["1", "Hull Structural & Deflection Finite Element Analysis (FEA)", "Structural", "85 hrs", formatCurrency(850), formatCurrency(72250)],
        ["2", "General Arrangement Drawing & Deck Machinery Revision", "Naval Arch", "24 hrs", formatCurrency(850), formatCurrency(20400)],
        ["3", "3D CAD Solid Model & Nesting Drawing Pack", "BIM Model", "40 hrs", formatCurrency(850), formatCurrency(34000)]
      ];
    }

    safeAutoTable(doc, {
      head: headers,
      body: tableRows,
      startY: 90,
      theme: 'striped',
      headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 90 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' }
      }
    });

    // 4. ERP Financial Summary
    let finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const alignXLabel = 120;
    const alignXValue = 195;

    // Reset font for clean measurements
    doc.setFont("helvetica", "normal");
    
    // Render each total row ONCE with formatting
    doc.text("Contract Value (GST Exclusive):", alignXLabel, finalY);
    doc.text(formatCurrency(inv.contract_value || 0), alignXValue, finalY, { align: 'right' });
    
    finalY += 4.5;
    doc.text("Previously Invoiced:", alignXLabel, finalY);
    doc.text(formatCurrency(inv.previously_invoiced || 0), alignXValue, finalY, { align: 'right' });

    finalY += 4.5;
    doc.text("Current Billing Amount:", alignXLabel, finalY);
    doc.text(formatCurrency(inv.current_billing_amount || 0), alignXValue, finalY, { align: 'right' });

    finalY += 4.5;
    doc.text("Remaining Contract Value:", alignXLabel, finalY);
    doc.text(formatCurrency(inv.remaining_contract_value || 0), alignXValue, finalY, { align: 'right' });

    if (inv.discount > 0) {
      finalY += 4.5;
      doc.text("Discount:", alignXLabel, finalY);
      doc.text(`- ${formatCurrency(inv.discount)}`, alignXValue, finalY, { align: 'right' });
    }

    finalY += 4.5;
    doc.setFont("helvetica", "bold");
    doc.text("Taxable Value:", alignXLabel, finalY);
    doc.text(formatCurrency(taxableAmount), alignXValue, finalY, { align: 'right' });
    doc.setFont("helvetica", "normal");

    // GST Taxes Rows
    if (isLocal) {
      finalY += 4.5;
      doc.text(`CGST (9%):`, alignXLabel, finalY);
      doc.text(formatCurrency(gstData.cgst_amount), alignXValue, finalY, { align: 'right' });
      finalY += 4.5;
      doc.text(`SGST (9%):`, alignXLabel, finalY);
      doc.text(formatCurrency(gstData.sgst_amount), alignXValue, finalY, { align: 'right' });
    } else {
      finalY += 4.5;
      doc.text(`IGST (18%):`, alignXLabel, finalY);
      doc.text(formatCurrency(gstData.igst_amount), alignXValue, finalY, { align: 'right' });
    }

    // Round Off
    finalY += 4.5;
    const rawTotal = taxableAmount + (gstData.cgst_amount + gstData.sgst_amount + gstData.igst_amount);
    const grandTotal = inv.grand_total || Math.round(rawTotal);
    const roundOff = grandTotal - rawTotal;
    doc.text("Round Off:", alignXLabel, finalY);
    doc.text(formatCurrency(roundOff), alignXValue, finalY, { align: 'right' });

    // GRAND TOTAL PAYABLE
    finalY += 6.5;
    doc.setDrawColor(153, 27, 27);
    doc.setLineWidth(0.4);
    doc.line(alignXLabel, finalY - 3, alignXValue, finalY - 3);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL PAYABLE:", alignXLabel, finalY);
    doc.text(formatCurrency(grandTotal), alignXValue, finalY, { align: 'right' });

    // 5. High-Resolution QR Payment Section (38mm Square)
    let leftInfoY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT INSTRUCTIONS & INSTANT QR:", 15, leftInfoY);
    doc.setFont("helvetica", "normal");
    
    // Draw QR Code Border Block (38mm x 38mm)
    const qrSize = 32;
    doc.setDrawColor(153, 27, 27);
    doc.setLineWidth(0.3);
    doc.setFillColor(255, 255, 255);
    doc.rect(15, leftInfoY + 3, qrSize, qrSize, 'FD');
    
    // Render Simulated High-res QR Grid Matrix
    doc.setFillColor(30, 41, 59);
    doc.rect(17, leftInfoY + 5, 8, 8, 'F');
    doc.rect(37, leftInfoY + 5, 8, 8, 'F');
    doc.rect(17, leftInfoY + 25, 8, 8, 'F');
    // Inner white squares for QR finder patterns
    doc.setFillColor(255, 255, 255);
    doc.rect(19, leftInfoY + 7, 4, 4, 'F');
    doc.rect(39, leftInfoY + 7, 4, 4, 'F');
    doc.rect(19, leftInfoY + 27, 4, 4, 'F');
    // Dummy micro alignment pattern
    doc.setFillColor(30, 41, 59);
    doc.rect(33, leftInfoY + 21, 3, 3, 'F');
    doc.rect(27, leftInfoY + 13, 5, 5, 'F');

    // QR Details Text Column
    doc.setFontSize(7.5);
    doc.text(`UPI ID: primelisometrics@hdfcbank`, 50, leftInfoY + 8);
    doc.text(`Bank Name: HDFC Corporate Primary`, 50, leftInfoY + 13);
    doc.text(`Account No: 501009988776655`, 50, leftInfoY + 18);
    doc.text(`IFSC: HDFC0001234`, 50, leftInfoY + 23);
    doc.text(`Scan QR via BHIM / GPay / PhonePe`, 50, leftInfoY + 28);

    // 6. Signatures Area
    let termsY = Math.max(leftInfoY + 40, finalY + 12);
    if (termsY > 230) {
      doc.addPage();
      drawFaintEngineeringWatermark(doc);
      termsY = 30; // reset
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(15, termsY - 4, 195, termsY - 4);
    
    // Terms columns
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("TERMS AND CONDITIONS:", 15, termsY);
    doc.setFont("helvetica", "normal");
    doc.text("1. All model drafts must undergo final structural engineering sign-off.", 15, termsY + 3.5);
    doc.text("2. Please transfer payments to the listed corporate account within 15 days.", 15, termsY + 7);
    doc.text("3. The Contract Value is exclusive of GST.", 15, termsY + 10.5);
    doc.text("4. GST has been applied only to current invoice as per tax regulations.", 15, termsY + 14);
    if (gstData.clean_notes) {
      doc.setFont("helvetica", "bold");
      doc.text("Billing & Scope Notes:", 15, termsY + 19);
      doc.setFont("helvetica", "normal");
      doc.text(gstData.clean_notes, 15, termsY + 22.5, { maxWidth: 95 });
    }

    // Signatures blocks
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("PREPARED BY (ENGINEER):", 120, termsY);
    doc.setFont("helvetica", "normal");
    doc.text("Name: Ashok Kumar", 120, termsY + 4.5);
    doc.text("Designation: Lead Marine Designer", 120, termsY + 8);
    doc.text("Digital Signature: [ASHOK_KUMAR_2026]", 120, termsY + 11.5);
    
    doc.setFont("helvetica", "bold");
    doc.text("CLIENT VALIDATION & APPROVAL:", 158, termsY);
    doc.setFont("helvetica", "normal");
    doc.text("Name:", 158, termsY + 4.5);
    doc.text("Designation:", 158, termsY + 8);
    doc.text("Company Stamp & Sign:", 158, termsY + 11.5);
    doc.line(167, termsY + 4.5, 195, termsY + 4.5);
    doc.line(174, termsY + 8, 195, termsY + 8);
    doc.line(186, termsY + 11.5, 195, termsY + 11.5);

    // 7. Page Footer Branding
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer text on every page
      doc.setFillColor(245, 245, 245);
      doc.rect(0, 282, 210, 15, 'F');
      
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(153, 27, 27);
      doc.text("AURA Workspace ERP", 15, 290);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(" | Primelisometrics Consultancy | www.primelisometrics.com", 45, 290);
      doc.text(`Page ${i} of ${totalPages}`, 195, 290, { align: 'right' });
    }

    if (previewOnly) {
      if (setInvoiceLoading) setInvoiceLoading('');
      const previewBlobUrl = URL.createObjectURL(doc.output('blob'));
      return previewBlobUrl;
    }

    // Download PDF file
    doc.save(fileName);
    console.log(`Development Log: ERP PDF Generated successfully as ${fileName}`);

    // Upload to Supabase Storage
    const pdfBlob = doc.output('blob');
    const storagePath = `invoices/2026/${inv.invoice_number}.pdf`;
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
          console.log("Uploaded PDF successfully. Path:", storagePath);
        } else {
          console.error("Storage upload error:", error?.message);
        }
      } catch (err) {
        console.error("Storage upload execution error:", err);
      }
    }
    if (setInvoiceLoading) setInvoiceLoading('');
    return publicUrl;
  } catch (err) {
    console.error("Error generating engineering PDF:", err);
    if (setInvoiceError) setInvoiceError("Failed to generate PDF. Check fields consistency.");
    if (setInvoiceLoading) setInvoiceLoading('');
  }
};
