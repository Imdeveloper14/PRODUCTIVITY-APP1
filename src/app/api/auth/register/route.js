import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { getLocalDb, saveLocalDb, isSupabaseTableAvailable } from '../../../utils/dbFallback';
import { seedDatabase } from '../../../utils/seeder';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

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

export async function POST(request) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection is not configured." }, { status: 500 });
    }

    // Ensure database is seeded with default admin & sample data
    await seedDatabase();

    const body = await request.json();
    const {
      first_name,
      last_name,
      firstName,
      lastName,
      username,
      email,
      password,
      confirm_password
    } = body;

    const finalFirstName = (firstName || first_name || '').trim();
    const finalLastName = (lastName || last_name || '').trim();
    const finalUsername = (username || '').trim();
    const finalEmail = (email || '').trim().toLowerCase();

    // Validate required fields
    if (!finalFirstName || !finalLastName || !finalUsername || !finalEmail || !password) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    if (password !== confirm_password) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    // Check if table is available
    const useSupabase = await isSupabaseTableAvailable('aura_users');
    let existingUser = null;

    if (useSupabase) {
      const { data: dbUser, error: findError } = await supabase
        .from('aura_users')
        .select('id, email, username')
        .or(`email.eq.${finalEmail},username.eq.${finalUsername}`)
        .maybeSingle();

      if (findError) {
        console.error("Full database error finding existing user:", findError);
        return NextResponse.json({ error: "Unable to process your registration request at this time. Please try again later." }, { status: 500 });
      }
      existingUser = dbUser;
    } else {
      const localDb = getLocalDb();
      existingUser = localDb.users.find(u => u.email.toLowerCase() === finalEmail || u.username === finalUsername);
    }

    if (existingUser) {
      if (existingUser.email.toLowerCase() === finalEmail) {
        return NextResponse.json({ error: "Email is already registered." }, { status: 400 });
      }
      if (existingUser.username === finalUsername) {
        return NextResponse.json({ error: "Username is already taken." }, { status: 400 });
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Determine role (permanent admin email gets elevated privileges)
    const role = finalEmail === 'chandrunavalarch@gmail.com' ? 'Super Admin' : 'Engineer';
    // If Super Admin or Admin, auto-approve, otherwise Pending
    const status = (role === 'Super Admin' || role === 'Admin') ? 'Approved' : 'Pending';

    let insertedUser = null;

    if (useSupabase) {
      const { data: newUser, error: insertError } = await supabase
        .from('aura_users')
        .insert({
          first_name: finalFirstName,
          last_name: finalLastName,
          username: finalUsername,
          email: finalEmail,
          mobile_number: null,
          department: null,
          designation: null,
          employee_id: null,
          password_hash,
          status,
          role
        })
        .select('id, email, username, status, role')
        .single();

      if (insertError) {
        console.error("Full database error inserting user:", insertError);
        return NextResponse.json({ error: "Unable to process your registration request at this time. Please try again later." }, { status: 500 });
      }
      insertedUser = newUser;
    } else {
      // Local db save
      const localDb = getLocalDb();
      const newLocalId = `u-${Date.now()}`;
      insertedUser = {
        id: newLocalId,
        first_name: finalFirstName,
        last_name: finalLastName,
        username: finalUsername,
        email: finalEmail,
        mobile_number: null,
        department: null,
        designation: null,
        employee_id: null,
        password_hash,
        status,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localDb.users.push(insertedUser);
      saveLocalDb(localDb);
    }

    // Create Audit Log
    const auditRecord = {
      event_type: 'registration_submitted',
      username: finalUsername,
      email: finalEmail,
      actor: 'system',
      details: `User registration submitted. Assigned role: ${role}. Initial status: ${status}.`
    };

    if (useSupabase) {
      const { error: logError } = await supabase.from('aura_audit_logs').insert(auditRecord);
      if (logError) console.error("Error creating audit log:", logError);
    } else {
      const localDb = getLocalDb();
      localDb.audit_logs.push({
        id: `log-${Date.now()}`,
        ...auditRecord,
        created_at: new Date().toISOString()
      });
      saveLocalDb(localDb);
    }

    // If User is Pending approval, notify Admin via email and notifications panel
    if (status === 'Pending') {
      const adminEmail = 'chandrunavalarch@gmail.com';
      const approveLink = `http://localhost:3000/?action=approve&id=${insertedUser.id}`;
      const rejectLink = `http://localhost:3000/?action=reject&id=${insertedUser.id}`;
      const regTime = new Date().toLocaleString();

      const subject = `New Employee Registration Request`;
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6C4DFF; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px;">New Access Request</h2>
          <p>A new employee has submitted an access request for AURA Workspace.</p>
          <table style="border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 20px;">
            <tr style="background-color: #F8FAFC;">
              <td style="padding: 10px; border: 1px solid #E2E8F0; font-weight: bold; width: 150px;">Name</td>
              <td style="padding: 10px; border: 1px solid #E2E8F0;">${finalFirstName} ${finalLastName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #E2E8F0; font-weight: bold;">Username</td>
              <td style="padding: 10px; border: 1px solid #E2E8F0;">${finalUsername}</td>
            </tr>
            <tr style="background-color: #F8FAFC;">
              <td style="padding: 10px; border: 1px solid #E2E8F0; font-weight: bold;">Email</td>
              <td style="padding: 10px; border: 1px solid #E2E8F0;">${finalEmail}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #E2E8F0; font-weight: bold;">Registration Time</td>
              <td style="padding: 10px; border: 1px solid #E2E8F0;">${regTime}</td>
            </tr>
          </table>
          
          <div style="margin-top: 25px; display: flex; gap: 15px; border-top: 1px solid #E2E8F0; padding-top: 20px;">
            <a href="${approveLink}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 0.9rem;">Approve Request</a>
            <a href="${rejectLink}" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 0.9rem; margin-left: 15px;">Reject Request</a>
          </div>
          <p style="margin-top: 25px; font-size: 0.8rem; color: #6B7280;">This is an automated system notification.</p>
        </div>
      `;
      
      // Attempt email dispatch
      const emailResult = await sendEmailNotification(adminEmail, subject, emailHtml);
      
      // If email is mock or failed, store in local DB notifications array for dashboard UI presentation
      if (!emailResult.success || emailResult.mock) {
        const localDb = getLocalDb();
        if (!localDb.notifications) localDb.notifications = [];
        localDb.notifications.push({
          id: `notif-${Date.now()}`,
          title: `New Employee Registration Request`,
          user_id: insertedUser.id,
          name: `${finalFirstName} ${finalLastName}`,
          username: finalUsername,
          email: finalEmail,
          created_at: new Date().toISOString(),
          details: `Access request submitted by ${finalFirstName} ${finalLastName} (@${finalUsername}).`
        });
        saveLocalDb(localDb);
      }
    }

    return NextResponse.json({
      success: true,
      message: status === 'Approved' 
        ? "Registration successful! You can now log in." 
        : "Access request submitted successfully! Your account is pending administrator approval."
    });

  } catch (error) {
    console.error("Unhandled registration error details:", error);
    return NextResponse.json({ error: "Unable to process your registration request at this time. Please try again later." }, { status: 500 });
  }
}
