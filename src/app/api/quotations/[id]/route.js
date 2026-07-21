import { NextResponse } from 'next/server';
import { getLocalDb, saveLocalDb, isSupabaseTableAvailable } from '../../../utils/dbFallback';
import { supabase } from '../../../utils/supabase';
import { verifySessionToken } from '../../../utils/session';

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

export async function GET(request, { params }) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    const useSupabase = await isSupabaseTableAvailable('quotations');

    let quotation = null;
    let items = [];
    let costing = null;
    let revisions = [];

    if (useSupabase) {
      const { data: dbQuote } = await supabase.from('quotations').select('*').eq('id', id).maybeSingle();
      if (!dbQuote) {
        return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
      }
      quotation = dbQuote;

      const { data: qItems } = await supabase.from('quotation_items').select('*').eq('quotation_id', id);
      items = qItems || [];

      // Check roles for costing details
      const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Super Admin';
      if (isAdmin) {
        const { data: qCost } = await supabase.from('quotation_costing').select('*').eq('quotation_id', id).maybeSingle();
        costing = qCost;
      } else {
        const { data: qCost } = await supabase.from('quotation_costing').select('grand_total, engineering_hours').eq('quotation_id', id).maybeSingle();
        if (qCost) {
          costing = {
            grand_total: qCost.grand_total,
            engineering_hours: qCost.engineering_hours
          };
        }
      }

      const { data: qRevs } = await supabase.from('quotation_revisions').select('*').eq('quotation_id', id);
      revisions = qRevs || [];

    } else {
      // Local fallback
      const localDb = getLocalDb();
      quotation = localDb.quotations.find(q => q.id === id);
      if (!quotation) {
        return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
      }

      items = (localDb.quotation_items || []).filter(item => item.quotation_id === id);
      
      const fullCosting = (localDb.quotation_costings || []).find(c => c.quotation_id === id);
      const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Super Admin';

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

      revisions = (localDb.quotation_revisions || []).filter(r => r.quotation_id === id);
    }

    // Role check: Employee can only see their own quotations
    if ((user.role === 'Employee' || user.role === 'Engineer' || user.role === 'Viewer') && quotation.created_by !== user.username) {
      return NextResponse.json({ error: "Unauthorized access to this quotation." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      quotation,
      items,
      costing,
      revisions
    });
  } catch (err) {
    console.error("Quotation GET ID error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      client_name,
      contact_person,
      project_name,
      project_location,
      plant_capacity,
      currency,
      status, // state changes
      deliverables,
      commercial_conditions,
      custom_hourly_rate,
      custom_software_cost,
      custom_contingency_percent,
      revision_description
    } = body;

    const useSupabase = await isSupabaseTableAvailable('quotations');
    const localDb = getLocalDb();

    let targetQuotation = null;
    let currentCosting = null;

    if (useSupabase) {
      const { data } = await supabase.from('quotations').select('*').eq('id', id).maybeSingle();
      targetQuotation = data;
      const { data: dbCost } = await supabase.from('quotation_costing').select('*').eq('quotation_id', id).maybeSingle();
      currentCosting = dbCost;
    } else {
      targetQuotation = localDb.quotations.find(q => q.id === id);
      currentCosting = (localDb.quotation_costings || []).find(c => c.quotation_id === id);
    }

    if (!targetQuotation) {
      return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    }

    // Employees cannot edit other people's stuff or edit pricing metrics
    if ((user.role === 'Employee' || user.role === 'Engineer' || user.role === 'Viewer') && targetQuotation.created_by !== user.username) {
      return NextResponse.json({ error: "Unauthorized access to edit this quotation." }, { status: 403 });
    }

    const updates = {};
    const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Super Admin';
    const isManager = user.role === 'Manager' || user.role === 'Project Manager';

    if (client_name !== undefined) updates.client_name = client_name;
    if (contact_person !== undefined) updates.contact_person = contact_person;
    if (project_name !== undefined) updates.project_name = project_name;
    if (project_location !== undefined) updates.project_location = project_location;
    if (plant_capacity !== undefined) updates.plant_capacity = plant_capacity;
    if (currency !== undefined) updates.currency = currency;
    if (commercial_conditions !== undefined && isAdmin) updates.commercial_conditions = commercial_conditions;

    // Status State Workflow Checks
    if (status !== undefined && targetQuotation.status !== status) {
      // Employees can only send to review (Draft -> Under Review)
      if ((user.role === 'Employee' || user.role === 'Engineer' || user.role === 'Viewer') && status !== 'Under Review' && status !== 'Draft') {
        return NextResponse.json({ error: "Employees cannot transition to this state directly." }, { status: 403 });
      }
      
      // Managers can review and suggestion edits (e.g. Under Review -> Draft / Sent)
      if (isManager && status === 'Approved') {
        return NextResponse.json({ error: "Only Admin/SuperAdmin can approve quotations." }, { status: 403 });
      }

      updates.status = status;
      if (status === 'Approved') {
        updates.approved_by = user.username;
      }
    }

    // Re-calculations for deliverables if they were edited
    let totalHours = currentCosting ? currentCosting.engineering_hours : 0;
    let hourlyRate = currentCosting ? currentCosting.hourly_rate : 1400;
    let softwareCost = currentCosting ? currentCosting.software_cost : 50000;
    let contingencyPercent = currentCosting ? ((currentCosting.contingency / (currentCosting.engineering_fee + currentCosting.software_cost)) * 100) : 10;
    const gstPercent = 18;

    if (isAdmin) {
      if (custom_hourly_rate !== undefined) hourlyRate = Number(custom_hourly_rate);
      if (custom_software_cost !== undefined) softwareCost = Number(custom_software_cost);
      if (custom_contingency_percent !== undefined) contingencyPercent = Number(custom_contingency_percent);
    }

    if (deliverables !== undefined) {
      totalHours = (deliverables || []).reduce((sum, item) => sum + (item.included ? Number(item.estimated_hours || 0) : 0), 0);
    }

    const engineeringFee = totalHours * hourlyRate;
    const contingencyAmount = (engineeringFee + softwareCost) * (contingencyPercent / 100);
    const subtotal = engineeringFee + softwareCost + contingencyAmount;
    const gstAmount = subtotal * (gstPercent / 100);
    const grandTotal = subtotal + gstAmount;

    // Perform updates
    if (useSupabase) {
      if (Object.keys(updates).length > 0) {
        await supabase.from('quotations').update(updates).eq('id', id);
      }

      // Update deliverables items
      if (deliverables !== undefined) {
        // Delete old items
        await supabase.from('quotation_items').delete().eq('quotation_id', id);
        // Insert new items
        const itemsToInsert = (deliverables || []).map(item => ({
          quotation_id: id,
          category: item.category,
          deliverable: item.deliverable,
          included: !!item.included,
          estimated_hours: Number(item.estimated_hours || 0),
          remarks: item.remarks || ''
        }));
        if (itemsToInsert.length > 0) {
          await supabase.from('quotation_items').insert(itemsToInsert);
        }
      }

      // Update costing
      if (currentCosting) {
        await supabase.from('quotation_costing').update({
          hourly_rate: hourlyRate,
          engineering_hours: totalHours,
          engineering_fee: engineeringFee,
          software_cost: softwareCost,
          contingency: contingencyAmount,
          subtotal,
          gst: gstAmount,
          grand_total: grandTotal
        }).eq('quotation_id', id);
      }

      // Save revision history if description provided
      if (revision_description) {
        await supabase.from('quotation_revisions').insert({
          quotation_id: id,
          revision_number: 1, // dynamically increments in larger apps
          description: revision_description,
          created_by: user.username
        });
      }

      // Audit Log
      await supabase.from('aura_audit_logs').insert({
        event_type: 'quotation_updated',
        username: user.username,
        email: user.email,
        actor: user.username,
        details: `Updated quotation ${targetQuotation.quotation_number}. Status: ${status || targetQuotation.status}.`
      });

    } else {
      // Local DB
      const qIndex = localDb.quotations.findIndex(q => q.id === id);
      if (qIndex !== -1) {
        localDb.quotations[qIndex] = {
          ...localDb.quotations[qIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
      }

      if (deliverables !== undefined) {
        // Remove old deliverables
        localDb.quotation_items = localDb.quotation_items.filter(item => item.quotation_id !== id);
        // Insert new deliverables
        (deliverables || []).forEach((item, index) => {
          localDb.quotation_items.push({
            id: `qi-${Date.now()}-${index}`,
            quotation_id: id,
            category: item.category,
            deliverable: item.deliverable,
            included: !!item.included,
            estimated_hours: Number(item.estimated_hours || 0),
            remarks: item.remarks || ''
          });
        });
      }

      // Costing update
      const costIndex = localDb.quotation_costings.findIndex(c => c.quotation_id === id);
      if (costIndex !== -1) {
        localDb.quotation_costings[costIndex] = {
          ...localDb.quotation_costings[costIndex],
          hourly_rate: hourlyRate,
          engineering_hours: totalHours,
          engineering_fee: engineeringFee,
          software_cost: softwareCost,
          contingency: contingencyAmount,
          subtotal,
          gst: gstAmount,
          grand_total: grandTotal
        };
      }

      // Revision history log
      if (revision_description) {
        const revCount = localDb.quotation_revisions.filter(r => r.quotation_id === id).length + 1;
        localDb.quotation_revisions.push({
          id: `rev-${Date.now()}`,
          quotation_id: id,
          revision_number: revCount,
          description: revision_description,
          created_by: user.username,
          created_at: new Date().toISOString()
        });
      }

      // Audit Log
      localDb.audit_logs.push({
        id: `log-${Date.now()}`,
        event_type: 'quotation_updated',
        username: user.username,
        email: user.email,
        actor: user.username,
        details: `Updated quotation ${targetQuotation.quotation_number}. Status: ${status || targetQuotation.status}.`,
        created_at: new Date().toISOString()
      });

      saveLocalDb(localDb);
    }

    return NextResponse.json({
      success: true,
      message: `Quotation details updated successfully.`
    });

  } catch (err) {
    console.error("Quotation PUT error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    const useSupabase = await isSupabaseTableAvailable('quotations');
    const localDb = getLocalDb();

    let targetQuotation = null;
    if (useSupabase) {
      const { data } = await supabase.from('quotations').select('id, created_by, quotation_number').eq('id', id).maybeSingle();
      targetQuotation = data;
    } else {
      targetQuotation = localDb.quotations.find(q => q.id === id);
    }

    if (!targetQuotation) {
      return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    }

    // Only Admin can delete or archive
    if (user.role !== 'Admin' && user.role !== 'SuperAdmin' && user.role !== 'Super Admin') {
      return NextResponse.json({ error: "Admin access required to delete quotations." }, { status: 403 });
    }

    if (useSupabase) {
      await supabase.from('quotations').delete().eq('id', id);
      await supabase.from('quotation_items').delete().eq('quotation_id', id);
      await supabase.from('quotation_costing').delete().eq('quotation_id', id);
      await supabase.from('quotation_revisions').delete().eq('quotation_id', id);
    } else {
      localDb.quotations = localDb.quotations.filter(q => q.id !== id);
      localDb.quotation_items = localDb.quotation_items.filter(item => item.quotation_id !== id);
      localDb.quotation_costings = localDb.quotation_costings.filter(c => c.quotation_id !== id);
      localDb.quotation_revisions = localDb.quotation_revisions.filter(r => r.quotation_id !== id);
      saveLocalDb(localDb);
    }

    return NextResponse.json({
      success: true,
      message: `Quotation ${targetQuotation.quotation_number} deleted successfully.`
    });

  } catch (err) {
    console.error("Quotation DELETE error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
