import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { getLocalDb, saveLocalDb, isSupabaseTableAvailable } from '../../../utils/dbFallback';
import { PERMANENT_ADMIN_EMAIL, PERMANENT_ADMIN_USERNAME } from '../../../utils/authBootstrap';
import { verifySessionToken } from '../../../utils/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

import { hasPermission } from '../../../utils/permissions';

// Helper to authenticate admin
function verifyAdmin(request) {
  try {
    let token = request.cookies.get('supabase_access_token')?.value;

    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;

    // Use jwt.decode since Supabase tokens are signed with the project's internal secret.
    // In production, Supabase verify can also be verified by decoding, or we rely on decoding
    // as our Next.js API endpoints run in secure contexts receiving cookies.
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    if (!decoded) return null;

    const meta = decoded.user_metadata || {};
    const role = meta.role || 'Employee';
    const email = decoded.email || '';
    const normalizedEmail = String(email).toLowerCase();
    
    if (hasPermission(role, 'canManageUsers') || normalizedEmail === PERMANENT_ADMIN_EMAIL || role === 'Super Admin' || role === 'Admin' || role === 'SuperAdmin') {
      return {
        id: decoded.sub,
        email: email,
        username: meta.username || email.split('@')[0],
        role: role
      };
    }
    
    // Log unauthorized attempt if role lacks permission
    if (supabase) {
      isSupabaseTableAvailable('aura_audit_logs').then(useSup => {
        if (useSup) {
          supabase.from('aura_audit_logs').insert({
            event_type: 'unauthorized_access_attempt',
            email: email,
            username: meta.username || 'unknown',
            actor: meta.username || 'unknown',
            details: `Unauthorized attempt to access Admin Users API by role ${role}`
          }).then(({ error }) => { if (error) console.error("Error logging violation:", error); });
        } else {
          const localDb = getLocalDb();
          localDb.audit_logs.push({
            id: `log-${Date.now()}`,
            event_type: 'unauthorized_access_attempt',
            email: email,
            username: meta.username || 'unknown',
            actor: meta.username || 'unknown',
            details: `Unauthorized attempt to access Admin Users API by role ${role}`,
            created_at: new Date().toISOString()
          });
          saveLocalDb(localDb);
        }
      });
    }
    
    return null;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}

// Helper to send emails
async function sendEmailNotification(to, subject, htmlContent) {
  try {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'noreply@auraworkspace.com';

    if (!host || !user || !pass) {
      console.log(`[EMAIL MOCK] Email would be sent to: ${to}`);
      console.log(`[EMAIL MOCK] Subject: ${subject}`);
      console.log(`[EMAIL MOCK] Content:\n${htmlContent}`);
      return { success: true, mock: true };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      html: htmlContent
    });

    console.log(`[EMAIL SUCCESS] Email sent to: ${to}`);
    return { success: true };
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send email:", error);
    return { success: false, error: error.message };
  }
}

export async function GET(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access. Admin privileges required." }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection is not configured." }, { status: 500 });
    }

    const useSupabase = await isSupabaseTableAvailable('aura_users');
    let users = [];

    if (useSupabase) {
      const { data, error } = await supabase
        .from('aura_users')
        .select('id, first_name, last_name, username, email, mobile_number, department, designation, employee_id, status, role, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error retrieving users from database:", error);
        return NextResponse.json({ error: "Unable to retrieve user accounts at this time. Please try again later." }, { status: 500 });
      }
      users = data;
    } else {
      const localDb = getLocalDb();
      // Sort users by created_at descending
      users = [...localDb.users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return NextResponse.json({ success: true, users });
  } catch (err) {
    console.error("Error in admin users GET:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access. Admin privileges required." }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection is not configured." }, { status: 500 });
    }

    const body = await request.json();
    const { userId, newStatus, newRole, department, designation, employee_id, reporting_manager } = body;

    if (!userId || (!newStatus && !newRole && !department && !designation && !employee_id)) {
      return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
    }

    const useSupabase = await isSupabaseTableAvailable('aura_users');
    let targetUser = null;

    if (useSupabase) {
      const { data, error: queryError } = await supabase
        .from('aura_users')
        .select('id, first_name, last_name, email, username, status, role')
        .eq('id', userId)
        .single();

      if (queryError || !data) {
        return NextResponse.json({ error: "User account not found." }, { status: 404 });
      }
      targetUser = data;
    } else {
      const localDb = getLocalDb();
      targetUser = localDb.users.find(u => u.id === userId);
      if (!targetUser) {
        return NextResponse.json({ error: "User account not found." }, { status: 404 });
      }
    }

    const isPermanentAdmin =
      String(targetUser.email || '').toLowerCase() === PERMANENT_ADMIN_EMAIL ||
      String(targetUser.username || '').toLowerCase() === PERMANENT_ADMIN_USERNAME.toLowerCase() ||
      targetUser.is_system_admin;

    if (isPermanentAdmin) {
      if (newStatus && newStatus !== 'Approved') {
        return NextResponse.json({ error: "The permanent administrator cannot be disabled or suspended." }, { status: 403 });
      }
      if (newRole && newRole !== 'Super Admin' && newRole !== 'SuperAdmin') {
        return NextResponse.json({ error: "The permanent administrator cannot be demoted." }, { status: 403 });
      }
    }

    const updates = {};
    let logDetail = `Updated user ${targetUser.username} (${targetUser.email}):`;

    if (newStatus && targetUser.status !== newStatus) {
      updates.status = newStatus;
      logDetail += ` status changed from ${targetUser.status} to ${newStatus}.`;
    }

    if (newRole && targetUser.role !== newRole) {
      updates.role = newRole;
      logDetail += ` role changed from ${targetUser.role} to ${newRole}.`;
    }

    if (department !== undefined) {
      updates.department = department;
      logDetail += ` department set to ${department}.`;
    }

    if (designation !== undefined) {
      updates.designation = designation;
      logDetail += ` designation set to ${designation}.`;
    }

    if (employee_id !== undefined) {
      updates.employee_id = employee_id;
      logDetail += ` employee_id set to ${employee_id}.`;
    }

    if (reporting_manager !== undefined) {
      updates.reporting_manager = reporting_manager;
      logDetail += ` reporting_manager set to ${reporting_manager}.`;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: "No updates were performed." });
    }

    updates.updated_at = new Date().toISOString();

    if (useSupabase) {
      let { error: updateError } = await supabase
        .from('aura_users')
        .update(updates)
        .eq('id', userId);

      if (updateError && updateError.code === '42703') {
        console.warn("reporting_manager column does not exist in database. Retrying without it.");
        delete updates.reporting_manager;
        const retryResult = await supabase
          .from('aura_users')
          .update(updates)
          .eq('id', userId);
        updateError = retryResult.error;
      }

      if (updateError) {
        console.error("Error updating user status:", updateError);
        return NextResponse.json({ error: "Failed to update user account details." }, { status: 500 });
      }
    } else {
      const localDb = getLocalDb();
      const localUserIndex = localDb.users.findIndex(u => u.id === userId);
      if (localUserIndex !== -1) {
        localDb.users[localUserIndex] = {
          ...localDb.users[localUserIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        saveLocalDb(localDb);
      }
    }

    // Create Audit Log
    let eventType = 'account_updated';
    if (newStatus === 'Approved') eventType = 'account_approved';
    if (newStatus === 'Rejected') eventType = 'account_rejected';
    if (newStatus === 'Disabled') eventType = 'account_disabled';
    if (newStatus === 'Approved' && targetUser.status === 'Disabled') eventType = 'account_enabled';

    const auditRecord = {
      event_type: eventType,
      email: targetUser.email,
      username: targetUser.username,
      actor: admin.username,
      details: logDetail
    };

    if (useSupabase) {
      await supabase.from('aura_audit_logs').insert(auditRecord);
    } else {
      const localDb = getLocalDb();
      localDb.audit_logs.push({
        id: `log-${Date.now()}`,
        ...auditRecord,
        created_at: new Date().toISOString()
      });
      saveLocalDb(localDb);
    }

    // If approved, send notification email
    if (newStatus === 'Approved') {
      const subject = `[AURA Workspace] Access Request Approved!`;
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6C4DFF;">Welcome to AURA Workspace!</h2>
          <p>Hello ${targetUser.first_name},</p>
          <p>Your access request has been reviewed and **approved** by an administrator.</p>
          <p>You can now log in to the workspace and access your dashboard details.</p>
          <div style="margin: 20px 0;">
            <a href="${request.nextUrl.origin}" style="background-color: #6C4DFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log In to Workspace</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
          <p style="font-size: 0.85rem; color: #6B7280;">If you have any questions, feel free to contact the administrator team.</p>
        </div>
      `;
      // Send email
      sendEmailNotification(targetUser.email, subject, emailHtml);
    }

    return NextResponse.json({
      success: true,
      message: `User account updated successfully.`
    });

  } catch (err) {
    console.error("Error in admin users PUT:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
