import { NextResponse } from 'next/server';
import { getLocalDb, saveLocalDb, isSupabaseTableAvailable, supabase } from '../../utils/dbFallback';
import { verifySessionToken } from '../../utils/session';

// Helper to authenticate user
function authenticate(request) {
  try {
    let token = request.cookies.get('aura_token')?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    if (!token) return null;
    return verifySessionToken(token);
  } catch (err) {
    return null;
  }
}

export async function GET(request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const useSupabase = await isSupabaseTableAvailable('quotations');
    let quotations = [];

    if (useSupabase) {
      // Supabase Query
      let query = supabase.from('quotations').select('*');
      if (user.role === 'Employee' || user.role === 'Engineer' || user.role === 'Viewer') {
        query = query.eq('created_by', user.username);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        console.error("Supabase quotations error:", error);
        return NextResponse.json({ error: "Database error retrieving quotations." }, { status: 500 });
      }
      
      // Load costing and items conditionally based on role
      const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Super Admin';
      
      for (const q of data) {
        let items = [];
        let costing = null;

        const { data: qItems } = await supabase.from('quotation_items').select('*').eq('quotation_id', q.id);
        items = qItems || [];

        if (isAdmin) {
          const { data: qCost } = await supabase.from('quotation_costing').select('*').eq('quotation_id', q.id).maybeSingle();
          costing = qCost;
        } else {
          // Non-admin can only see grand total, no hourly rate or internal metrics
          const { data: qCost } = await supabase.from('quotation_costing').select('grand_total, engineering_hours').eq('quotation_id', q.id).maybeSingle();
          if (qCost) {
            costing = {
              grand_total: qCost.grand_total,
              engineering_hours: qCost.engineering_hours
            };
          }
        }

        quotations.push({
          ...q,
          items,
          costing
        });
      }
    } else {
      // Local fallback
      const localDb = getLocalDb();
      let dbQuotes = localDb.quotations || [];
      if (user.role === 'Employee' || user.role === 'Engineer' || user.role === 'Viewer') {
        dbQuotes = dbQuotes.filter(q => q.created_by === user.username);
      }

      const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Super Admin';

      quotations = dbQuotes.map(q => {
        const items = (localDb.quotation_items || []).filter(item => item.quotation_id === q.id);
        const fullCosting = (localDb.quotation_costings || []).find(c => c.quotation_id === q.id);
        
        let costing = null;
        if (fullCosting) {
          if (isAdmin) {
            costing = fullCosting;
          } else {
            costing = {
              grand_total: fullCosting.grand_total,
              engineering_hours: fullCosting.engineering_hours
            };
          }
        }

        return {
          ...q,
          items,
          costing
        };
      });

      // Sort by created_at desc
      quotations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return NextResponse.json({ success: true, quotations });
  } catch (err) {
    console.error("Quotations GET error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const {
      client_name,
      contact_person,
      project_name,
      project_location,
      plant_capacity,
      currency,
      deliverables, // array of items
      commercial_conditions,
      custom_hourly_rate, // only used if user is admin
      custom_software_cost,
      custom_contingency_percent
    } = body;

    if (!client_name || !project_name) {
      return NextResponse.json({ error: "Client Name and Project Name are required." }, { status: 400 });
    }

    const useSupabase = await isSupabaseTableAvailable('quotations');
    const localDb = getLocalDb();

    // 1. Generate Quotation Number PMC-2026-XXXX
    const currentYear = new Date().getFullYear();
    let nextNum = 1;

    if (useSupabase) {
      const { data } = await supabase.from('quotations').select('quotation_number');
      const matchPattern = `PMC-${currentYear}-`;
      const yearQuotes = (data || []).filter(q => q.quotation_number?.startsWith(matchPattern));
      if (yearQuotes.length > 0) {
        const indices = yearQuotes.map(q => parseInt(q.quotation_number.replace(matchPattern, '')) || 0);
        nextNum = Math.max(...indices) + 1;
      }
    } else {
      const matchPattern = `PMC-${currentYear}-`;
      const yearQuotes = (localDb.quotations || []).filter(q => q.quotation_number?.startsWith(matchPattern));
      if (yearQuotes.length > 0) {
        const indices = yearQuotes.map(q => parseInt(q.quotation_number.replace(matchPattern, '')) || 0);
        nextNum = Math.max(...indices) + 1;
      }
    }

    const quotationNumber = `PMC-${currentYear}-${String(nextNum).padStart(4, '0')}`;

    // 2. Pricing calculations (default or custom if admin)
    const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Super Admin';
    const hourlyRate = (isAdmin && custom_hourly_rate !== undefined) ? Number(custom_hourly_rate) : 1400;
    const softwareCost = (isAdmin && custom_software_cost !== undefined) ? Number(custom_software_cost) : 50000;
    const contingencyPercent = (isAdmin && custom_contingency_percent !== undefined) ? Number(custom_contingency_percent) : 10;
    const gstPercent = 18; // default 18%

    const totalHours = (deliverables || []).reduce((sum, item) => sum + (item.included ? Number(item.estimated_hours || 0) : 0), 0);
    const engineeringFee = totalHours * hourlyRate;
    const contingencyAmount = (engineeringFee + softwareCost) * (contingencyPercent / 100);
    const subtotal = engineeringFee + softwareCost + contingencyAmount;
    const gstAmount = subtotal * (gstPercent / 100);
    const grandTotal = subtotal + gstAmount;

    const newQuotation = {
      quotation_number: quotationNumber,
      client_name,
      contact_person: contact_person || '',
      project_name,
      project_location: project_location || '',
      plant_capacity: plant_capacity || '',
      currency: currency || 'INR',
      status: 'Draft',
      created_by: user.username,
      approved_by: null,
      commercial_conditions: commercial_conditions || 'Standard Terms: 30 days validity, 15 days payment terms.'
    };

    let savedId = null;

    if (useSupabase) {
      const { data: dbQuote, error: qErr } = await supabase
        .from('quotations')
        .insert(newQuotation)
        .select()
        .single();

      if (qErr) {
        console.error("Create quotation error:", qErr);
        return NextResponse.json({ error: "Failed to create quotation request." }, { status: 500 });
      }
      savedId = dbQuote.id;

      // Insert Deliverables
      const itemsToInsert = (deliverables || []).map(item => ({
        quotation_id: savedId,
        category: item.category,
        deliverable: item.deliverable,
        included: !!item.included,
        estimated_hours: Number(item.estimated_hours || 0),
        remarks: item.remarks || ''
      }));

      if (itemsToInsert.length > 0) {
        await supabase.from('quotation_items').insert(itemsToInsert);
      }

      // Insert costing
      await supabase.from('quotation_costing').insert({
        quotation_id: savedId,
        hourly_rate: hourlyRate,
        engineering_hours: totalHours,
        engineering_fee: engineeringFee,
        software_cost: softwareCost,
        contingency: contingencyAmount,
        subtotal,
        gst: gstAmount,
        grand_total: grandTotal
      });

      // Audit Log
      await supabase.from('aura_audit_logs').insert({
        event_type: 'quotation_created',
        username: user.username,
        email: user.email,
        actor: user.username,
        details: `Created quotation request ${quotationNumber} for ${client_name}.`
      });
    } else {
      // Local Database insertion
      savedId = `q-${Date.now()}`;
      const localQuote = {
        id: savedId,
        ...newQuotation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      localDb.quotations.push(localQuote);

      // Save deliverables
      (deliverables || []).forEach((item, index) => {
        localDb.quotation_items.push({
          id: `qi-${Date.now()}-${index}`,
          quotation_id: savedId,
          category: item.category,
          deliverable: item.deliverable,
          included: !!item.included,
          estimated_hours: Number(item.estimated_hours || 0),
          remarks: item.remarks || ''
        });
      });

      // Save costing
      localDb.quotation_costings.push({
        id: `qc-${Date.now()}`,
        quotation_id: savedId,
        hourly_rate: hourlyRate,
        engineering_hours: totalHours,
        engineering_fee: engineeringFee,
        software_cost: softwareCost,
        contingency: contingencyAmount,
        subtotal,
        gst: gstAmount,
        grand_total: grandTotal,
        created_at: new Date().toISOString()
      });

      // Save Audit log
      localDb.audit_logs.push({
        id: `log-${Date.now()}`,
        event_type: 'quotation_created',
        username: user.username,
        email: user.email,
        actor: user.username,
        details: `Created quotation request ${quotationNumber} for ${client_name}.`,
        created_at: new Date().toISOString()
      });

      saveLocalDb(localDb);
    }

    return NextResponse.json({
      success: true,
      message: `Quotation draft ${quotationNumber} saved successfully.`,
      quotationId: savedId
    });

  } catch (err) {
    console.error("Quotation POST error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
