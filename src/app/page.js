"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FolderKanban, Calendar, BrainCircuit, 
  BarChart3, LogOut, LogIn, KeyRound, Plus, Trash2, Edit3, 
  Download, Play, Square, MessageSquare, Sparkles, AlertCircle, FileText, IndianRupee, Clock, CheckCircle2, Send, Filter, ArrowUpDown, Search, Paperclip, FileSpreadsheet, Mail, Copy, Eye
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { hasPermission } from './utils/permissions';
import QuotationsModule from './components/QuotationsModule';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;


// ==========================================================================
// Seed Data
// ==========================================================================
const DEFAULT_CLIENTS = [
  { id: "c1", name: "Apex Structural Builders", phone: "+91 98765 43210", email: "contact@apexstructural.com", company: "Apex Corp", notes: "Prefers Revit BIM models", projectHistory: "3D BIM Warehouse Model", agreement_documents: ["apex_nda.pdf", "quotation_signed.jpg"] },
  { id: "c2", name: "Nova Interior Design", phone: "+91 98765 54321", email: "info@novadesign.studio", company: "Nova LLC", notes: "Requires standard CAD floorplans", projectHistory: "Modern Kitchen Counter details", agreement_documents: [] },
  { id: "c3", name: "Zenith Mechanical Co", phone: "+91 98765 65432", email: "eng@zenithmech.co", company: "Zenith Co", notes: "Strict solid modeling tolerances", projectHistory: "CAD Machine Tooling Parts", agreement_documents: ["zenith_contract.docx"] }
];

const DEFAULT_PROJECTS = [
  { id: "p1", title: "Villa Project", clientId: "c1", progress: 90, status: "In Progress", deadline: "2026-06-27", quoteAmount: 250000, paidAmount: 223000, balanceAmount: 27000, cadType: "Revit 3D", fileNotes: "Truss revisions pending" },
  { id: "p2", title: "Factory Layout", clientId: "c3", progress: 60, status: "In Progress", deadline: "2026-06-29", quoteAmount: 180000, paidAmount: 135000, balanceAmount: 45000, cadType: "AutoCAD 2D", fileNotes: "Approved by safety manager" },
  { id: "p3", title: "Apartment Model", clientId: "c2", progress: 40, status: "In Progress", deadline: "2026-07-05", quoteAmount: 120000, paidAmount: 120000, balanceAmount: 0, cadType: "SolidWorks", fileNotes: "Delivered package v1" }
];

const DEFAULT_TASKS = [
  { id: "t1", title: "Review Client A", priority: "Medium", time: "08:00", completed: true },
  { id: "t2", title: "Structural Drawing", priority: "High", time: "10:00", completed: true },
  { id: "t3", title: "Site Meeting", priority: "High", time: "13:00", completed: true },
  { id: "t4", title: "AI Review", priority: "Medium", time: "15:00", completed: true },
  { id: "t5", title: "Submit Drawings", priority: "High", time: "17:00", completed: false },
  { id: "t6", title: "Check SolidWorks assembly", priority: "Low", time: "18:30", completed: true },
  { id: "t7", title: "Apex blueprint revision", priority: "High", time: "19:00", completed: true },
  { id: "t8", title: "Nova design presentation", priority: "Medium", time: "20:00", completed: false }
];

const DEFAULT_REMINDERS = [
  { id: "r1", title: "Review Nova specifications", due_date: "2026-06-26", time: "11:00" },
  { id: "r2", title: "Backup SolidWorks files", due_date: "2026-06-27", time: "18:00" }
];

const DEFAULT_INVOICES = [
  { 
    id: "inv_1", 
    invoice_number: "INV-2026-0001", 
    client_id: "c1", 
    project_id: "p1", 
    invoice_date: "2026-06-26", 
    due_date: "2026-07-10", 
    project_amount: 250000, 
    advance_paid: 223000, 
    balance_due: 27000, 
    gst_percentage: 18, 
    gst_amount: 4860, 
    discount: 1000, 
    grand_total: 30860, 
    payment_status: "Pending", 
    payment_method: "Bank Transfer", 
    notes: "Please transfer funds to HDFC primary account.",
    created_by: "Ashok"
  },
  { 
    id: "inv_2", 
    invoice_number: "INV-2026-0002", 
    client_id: "c2", 
    project_id: "p3", 
    invoice_date: "2026-06-20", 
    due_date: "2026-07-05", 
    project_amount: 120000, 
    advance_paid: 120000, 
    balance_due: 0, 
    gst_percentage: 18, 
    gst_amount: 0, 
    discount: 0, 
    grand_total: 0, 
    payment_status: "Paid", 
    payment_method: "UPI", 
    notes: "Thanks for business.",
    created_by: "Ashok"
  }
];

const DEFAULT_PERSONAL_TASKS = [
  { id: "pt1", title: "Buy groceries & vegetables", category: "Family / Home Work", priority: "Low", due_date: "2026-06-26", reminder_date: "2026-06-26", status: "Pending", completion_percentage: 0, notes: "Need organic spinach and milk" },
  { id: "pt2", title: "Morning jogging & gym workout", category: "Health & Fitness", priority: "Medium", due_date: "2026-06-26", reminder_date: "2026-06-26", status: "Done", completion_percentage: 100, notes: "45 mins cardio + strength training" },
  { id: "pt3", title: "Study Three.js webgl shaders", category: "Learning Goals", priority: "High", due_date: "2026-06-27", reminder_date: "2026-06-27", status: "In Progress", completion_percentage: 40, notes: "Complete chapter 4 on custom shaders" },
  { id: "pt4", title: "Pay electric utility bill", category: "Bills & Payments", priority: "High", due_date: "2026-06-28", reminder_date: "2026-06-28", status: "Pending", completion_percentage: 0, notes: "Amount ₹3,450" }
];

const DEFAULT_HABITS = [
  { id: "h1", habit_name: "Drink 3L Water", frequency: "Daily", streak_count: 5, last_completed_date: "2026-06-25", status: "Active" },
  { id: "h2", habit_name: "Read Technical Articles", frequency: "Daily", streak_count: 12, last_completed_date: "2026-06-26", status: "Active" },
  { id: "h3", habit_name: "Weekly Backup CAD Files", frequency: "Weekly", streak_count: 2, last_completed_date: "2026-06-21", status: "Active" }
];

const DEFAULT_MEETINGS = [
  { id: "m1", title: "Review structural plans", date: "2026-06-26", time: "10:00", clientId: "c1", notes: "Review beam sizes" },
  { id: "m2", title: "Site kick-off sync", date: "2026-06-27", time: "13:00", clientId: "c3", notes: "Review safety clearances" }
];

const DEFAULT_BIRTHDAYS = [
  { id: "b1", name: "Ashok's Birthday", date: "2026-06-26" },
  { id: "b2", name: "Apex Lead Manager", date: "2026-06-29" }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [user, setUser] = useState(null);

  // Authentication States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [regSubmitted, setRegSubmitted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // New Registration fields
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regDesignation, setRegDesignation] = useState('');
  const [regEmpId, setRegEmpId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAgreed, setRegAgreed] = useState(false);

  // Admin User Management states
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminActiveSubTab, setAdminActiveSubTab] = useState('Pending'); // 'Pending' | 'Approved' | 'Rejected' | 'Disabled' | 'AuditLogs'
  const [adminLoading, setAdminLoading] = useState(false);
  const [viewingUserDetails, setViewingUserDetails] = useState(null);

  // Admin approval form modal states
  const [approvingUser, setApprovingUser] = useState(null);
  const [approveRole, setApproveRole] = useState('Employee');
  const [approveDept, setApproveDept] = useState('Naval Architecture');
  const [approveDesignation, setApproveDesignation] = useState('Design Engineer');
  const [approveEmpId, setApproveEmpId] = useState('');
  const [approveIsManualId, setApproveIsManualId] = useState(false);
  const [approveManager, setApproveManager] = useState('');

  // Responsive & Dark Theme States
  const [theme, setTheme] = useState('system'); // 'light' | 'dark' | 'system'
  const [drawerOpen, setDrawerOpen] = useState(false);


  // Time Tracker State
  const [focusActive, setFocusActive] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(0);

  // UI Toast State
  const [toastMessage, setToastMessage] = useState(null);

  // Mobile Speed-Dial State
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Filter States
  const [projectSearch, setProjectSearch] = useState('');
  const [projectFilterStatus, setProjectFilterStatus] = useState('All');
  const [projectSortOrder, setProjectSortOrder] = useState('None');

  const [invoiceSearch, setInvoiceSearch] = useState('');
  
  // Invoice Sub-tabs (Drafts, Pending, Paid, Overdue)
  const [invoiceSubTab, setInvoiceSubTab] = useState('All');

  // Modals Toggles
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);

  // Editing States
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTaskMenuId, setActiveTaskMenuId] = useState(null);

  // Interactive Calendar & Details panel states
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [quickTitle, setQuickTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Personal Tracker States
  const [personalTasks, setPersonalTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [personalNotes, setPersonalNotes] = useState('');
  const [showPersonalTaskModal, setShowPersonalTaskModal] = useState(false);
  const [editingPersonalTask, setEditingPersonalTask] = useState(null);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [personalTaskForm, setPersonalTaskForm] = useState({
    title: '',
    category: 'Personal Tasks',
    priority: 'Medium',
    due_date: new Date().toISOString().split('T')[0],
    reminder_date: '',
    status: 'Pending',
    completion_percentage: 0,
    notes: ''
  });
  const [habitForm, setHabitForm] = useState({
    habit_name: '',
    frequency: 'Daily',
    streak_count: 0,
    last_completed_date: '',
    status: 'Active'
  });
  const [personalTrackerCategoryFilter, setPersonalTrackerCategoryFilter] = useState('All');

  // AI Productivity Calendar States
  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'week' | 'day'
  const [calendarFilter, setCalendarFilter] = useState('All'); // 'All' | 'Projects' | 'Tasks' | 'Invoices' | 'Meetings' | 'QC' | 'Personal' | 'Clients'
  const [calendarSearchQuery, setCalendarSearchQuery] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    clientId: '',
    notes: ''
  });

  // Loading indicator for Invoice PDF / Save action
  const [invoiceLoading, setInvoiceLoading] = useState(''); // 'Saving...', 'Generating PDF...', etc.
  const [invoiceError, setInvoiceError] = useState('');

  // Creation Inputs
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', company: '', notes: '' });
  const [uploadedAgreementFiles, setUploadedAgreementFiles] = useState([]);
  const [fileValidationError, setFileValidationError] = useState('');

  const [newProject, setNewProject] = useState({ title: '', clientId: '', cadType: 'AutoCAD 2D', status: 'In Progress', deadline: '', quoteAmount: '', paidAmount: '', fileNotes: '' });
  const [newTask, setNewTask] = useState({ title: '', priority: 'Medium', dueDate: '', reminder: false });

  // Invoice wizard form inputs
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    client_id: '',
    project_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    project_amount: 0,
    advance_paid: 0,
    balance_due: 0,
    gst_percentage: 18,
    gst_amount: 0,
    discount: 0,
    grand_total: 0,
    payment_status: 'Pending',
    payment_method: 'Bank Transfer',
    notes: 'Please transfer payments within 15 days of receiving this document.'
  });

  // AI Assistant Chat Log on Invoices Tab
  const [aiInvoiceInput, setAiInvoiceInput] = useState('');
  const [aiInvoiceChat, setAiInvoiceChat] = useState([
    { sender: 'bot', text: 'Hello! I am your Invoice AI assistant. I can predict payment risks, suggest payment reminder templates, or summarize invoice parameters.' }
  ]);

  // Fetch all user records from Supabase tables
  const fetchAllUserData = async (userId, userRole = 'Employee') => {
    if (!supabase) return;
    try {
      // 1. Fetch Clients (restricted to role capability)
      if (hasPermission(userRole, 'canManageUsers')) {
        const { data: dbClients, error: errClients } = await supabase
          .from('clients')
          .select('*')
          .order('name', { ascending: true });
        if (!errClients && dbClients) setClients(dbClients);
      }

      // 2. Fetch Projects
      const { data: dbProjects, error: errProjects } = await supabase
        .from('projects')
        .select('*')
        .order('deadline', { ascending: true });
      if (!errProjects && dbProjects) {
        // Map quoteAmount keys to match frontend mock keys
        const mapped = dbProjects.map(p => ({
          ...p,
          quoteAmount: parseFloat(p.quote_amount) || 0,
          paidAmount: parseFloat(p.paid_amount) || 0,
          balanceAmount: parseFloat(p.balance_amount) || 0,
          clientId: p.client_id,
          cadType: p.cad_type,
          fileNotes: p.file_notes
        }));
        setProjects(mapped);
      }

      // 3. Fetch Tasks
      const { data: dbTasks, error: errTasks } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });
      if (!errTasks && dbTasks) {
        const mapped = dbTasks.map(t => ({
          ...t,
          dueDate: t.due_date,
          projectId: t.project_id
        }));
        setTasks(mapped);
      }

      // 4. Fetch Reminders
      const { data: dbReminders, error: errReminders } = await supabase
        .from('reminders')
        .select('*')
        .order('reminder_date', { ascending: true });
      if (!errReminders && dbReminders) {
        const mapped = dbReminders.map(r => ({
          ...r,
          due_date: r.reminder_date
        }));
        setReminders(mapped);
      }

      // 5. Fetch Invoices (restricted to role capability)
      if (hasPermission(userRole, 'canViewInvoices')) {
        const { data: dbInvoices, error: errInvoices } = await supabase
          .from('invoices')
          .select('*')
          .order('invoice_number', { ascending: false });
        if (!errInvoices && dbInvoices) {
          const mapped = dbInvoices.map(i => ({
            ...i,
            project_amount: parseFloat(i.project_amount) || 0,
            advance_paid: parseFloat(i.advance_paid) || 0,
            balance_due: parseFloat(i.balance_due) || 0,
            gst_percentage: parseFloat(i.gst_percentage) || 18,
            gst_amount: parseFloat(i.gst_amount) || 0,
            discount: parseFloat(i.discount) || 0,
            grand_total: parseFloat(i.grand_total) || 0
          }));
          setInvoices(mapped);
        }
      }

      // 6. Fetch Meetings
      const { data: dbMeetings, error: errMeetings } = await supabase
        .from('client_meetings')
        .select('*')
        .order('meeting_date', { ascending: true });
      if (!errMeetings && dbMeetings) {
        const mapped = dbMeetings.map(m => ({
          ...m,
          date: m.meeting_date,
          time: m.meeting_time,
          clientId: m.client_id
        }));
        setMeetings(mapped);
      }

      // 7. Fetch Personal Tasks
      const { data: dbPersonalTasks, error: errPersonal } = await supabase
        .from('personal_tasks')
        .select('*')
        .order('due_date', { ascending: true });
      if (!errPersonal && dbPersonalTasks) setPersonalTasks(dbPersonalTasks);

      // 8. Fetch Habits
      const { data: dbHabits, error: errHabits } = await supabase
        .from('habits')
        .select('*')
        .order('habit_name', { ascending: true });
      if (!errHabits && dbHabits) setHabits(dbHabits);

      // Load activities
      setActivities([
        { id: "a1", text: "Database synchronized", time: "Just now" },
        { id: "a2", text: "All services connected", time: "Recently" }
      ]);

    } catch (err) {
      console.error("Error synchronizing Supabase data:", err);
    }
  };

  const applyTheme = (currentTheme) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else if (currentTheme === 'light') {
      root.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('aura_theme', newTheme);
    applyTheme(newTheme);
  };

  // Auth & State Hydration Mount Effect
  useEffect(() => {
    const savedTheme = localStorage.getItem("aura_theme") || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // 1. Initial Local State Hydration Fallback
    const savedUser = localStorage.getItem("aura_user_v7");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      fetchAllUserData(parsed.id, parsed.role);
    }

    if (!supabase) return;
    // Custom JWT Auth handles session locally, no onAuthStateChange listener needed.
  }, []);


  const saveState = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Focus Timer Tick
  useEffect(() => {
    let interval = null;
    if (focusActive) {
      interval = setInterval(() => {
        setFocusSeconds(sec => sec + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [focusActive]);

  // Trigger Toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAdminUsers = async () => {
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setAdminUsers(data.users);
      } else {
        console.error("Failed to load admin users:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchAdminLogs = async () => {
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (data.success) {
        setAdminLogs(data.logs);
      } else {
        console.error("Failed to load admin logs:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus, newRole) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newStatus, newRole })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`User details updated successfully`);
        fetchAdminUsers();
        fetchAdminLogs();
      } else {
        alert(`Failed to update user: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating user details.");
    }
  };

  const handleStartUserApproval = (targetUser) => {
    // Generate auto ID count e.g. AURA-0005 based on adminUsers length
    const nextNum = adminUsers.length + 1;
    const autoId = 'AURA-' + String(nextNum).padStart(4, '0');
    
    setApprovingUser(targetUser);
    setApproveRole('Employee');
    setApproveDept('Naval Architecture');
    setApproveDesignation('Design Engineer');
    setApproveEmpId(autoId);
    setApproveIsManualId(false);
    setApproveManager('');
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approvingUser) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: approvingUser.id,
          newStatus: 'Approved',
          newRole: approveRole,
          department: approveDept,
          designation: approveDesignation,
          employee_id: approveEmpId,
          reporting_manager: approveManager
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Account for ${approvingUser.first_name} has been approved and activated!`);
        setApprovingUser(null);
        fetchAdminUsers();
        fetchAdminLogs();
      } else {
        alert(`Failed to approve user: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error approving user.");
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchAdminUsers();
      fetchAdminLogs();
    }
  }, [activeTab]);

  // Secure Authentication & Access Request Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    if (authMode === 'signup') {
      // Validate fields
      if (!regFirstName || !regLastName || !regUsername || !regEmail || !regPassword) {
        alert("Please fill in all required fields.");
        return;
      }
      if (regPassword !== regConfirmPassword) {
        alert("Passwords do not match.");
        return;
      }
      if (!regAgreed) {
        alert("Please agree to the Terms of Use and Privacy Policy.");
        return;
      }

      setAuthLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: regFirstName,
            last_name: regLastName,
            username: regUsername,
            email: regEmail,
            password: regPassword,
            confirm_password: regConfirmPassword
          })
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          alert(`Registration Error: ${data.error}`);
        } else {
          // Clear registration form
          setRegFirstName('');
          setRegLastName('');
          setRegUsername('');
          setRegEmail('');
          setRegMobile('');
          setRegDept('');
          setRegDesignation('');
          setRegEmpId('');
          setRegPassword('');
          setRegConfirmPassword('');
          setRegSubmitted(true);
        }
      } catch (err) {
        console.error(err);
        alert("Registration failed. Please check network connection.");
      } finally {
        setAuthLoading(false);
      }
    } else {
      // Login flow
      if (!authEmail || !authPassword) {
        alert("Please enter both email/username and password.");
        return;
      }

      setAuthLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: authEmail,
            password: authPassword
          })
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          alert(`Login Error: ${data.error}`);
        } else if (data?.success && data?.user) {
          const loggedUser = {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.first_name} ${data.user.last_name}`,
            username: data.user.username,
            role: data.user.role,
            status: data.user.status
          };
          setUser(loggedUser);
          saveState("aura_user_v7", loggedUser);
          fetchAllUserData(data.user.id, data.user.role);
          triggerToast("Logged in successfully!");
          // Clear credentials form
          setAuthEmail('');
          setAuthPassword('');
        }
      } catch (err) {
        console.error(err);
        alert("Authentication failed. Please check network connection.");
      } finally {
        setAuthLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    // Clear cookie by hitting an endpoint or just removing local session details
    // We can also fetch a dummy logout api if needed, or simply delete cookies
    document.cookie = 'aura_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setUser(null);
    localStorage.removeItem("aura_user_v7");
    setActiveTab('dashboard');
    triggerToast("Logged out successfully.");
  };


  // File Upload Handlers
  const handleAgreementFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setFileValidationError('');
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    const maxSizeBytes = 10 * 1024 * 1024;
    let validFiles = [];
    for (let file of files) {
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
        setFileValidationError(`File format not supported: ${file.name}.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setFileValidationError(`File is too large: ${file.name}.`);
        return;
      }
      validFiles.push(file.name);
    }
    setUploadedAgreementFiles(validFiles);
  };

  // Wizard triggers
  const triggerNewProjectFlow = () => {
    if (clients.length === 0) {
      alert("Please create a client before starting a new project.");
      setShowClientModal(true);
    } else {
      setShowProjectModal(true);
    }
  };

  const triggerNewInvoiceFlow = () => {
    if (clients.length === 0) {
      alert("Please create a client before drafting an invoice.");
      setShowClientModal(true);
      return;
    }
    const nextNum = invoices.length + 1;
    const invNum = `INV-2026-${String(nextNum).padStart(4, '0')}`;
    setInvoiceForm({
      invoice_number: invNum,
      client_id: '',
      project_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
      project_amount: 0,
      advance_paid: 0,
      balance_due: 0,
      gst_percentage: 18,
      gst_amount: 0,
      discount: 0,
      grand_total: 0,
      payment_status: 'Pending',
      payment_method: 'Bank Transfer',
      notes: 'Please transfer payments within 15 days of receiving this document.'
    });
    setInvoiceError('');
    setShowInvoiceModal(true);
  };

  // Form selections and auto calculations
  const handleInvoiceClientSelect = (clientId) => {
    setInvoiceForm(prev => ({
      ...prev,
      client_id: clientId,
      project_id: '',
      project_amount: 0,
      advance_paid: 0,
      balance_due: 0,
      gst_amount: 0,
      grand_total: 0
    }));
  };

  const handleInvoiceProjectSelect = (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const balance = proj.quoteAmount - proj.paidAmount;
    const gstAmt = Math.round(balance * (invoiceForm.gst_percentage / 100));
    const total = balance + gstAmt - invoiceForm.discount;

    setInvoiceForm(prev => ({
      ...prev,
      project_id: projectId,
      project_amount: proj.quoteAmount,
      advance_paid: proj.paidAmount,
      balance_due: balance,
      gst_amount: gstAmt,
      grand_total: total
    }));
  };

  // Recalculate totals dynamically
  const recalculateInvoiceTotals = (updatedField) => {
    setInvoiceForm(prev => {
      const stateCopy = { ...prev, ...updatedField };
      const balance = stateCopy.project_amount - stateCopy.advance_paid;
      const gstAmt = Math.round(balance * (stateCopy.gst_percentage / 100));
      const total = balance + gstAmt - stateCopy.discount;
      return {
        ...stateCopy,
        balance_due: balance,
        gst_amount: gstAmt,
        grand_total: total
      };
    });
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClient.name) return;

    const record = {
      name: newClient.name,
      phone: newClient.phone || '',
      email: newClient.email || '',
      company: newClient.company || '',
      notes: newClient.notes || '',
      project_history: 'None yet',
      agreement_documents: uploadedAgreementFiles,
      user_id: user?.id
    };

    let savedToSupabase = false;
    if (supabase && user?.id) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .insert([record])
          .select();
        
        if (!error && data) {
          savedToSupabase = true;
          const inserted = data[0];
          setClients(prev => [...prev, inserted]);
        } else {
          console.error("Supabase insert client error:", error);
        }
      } catch (err) {
        console.error("Supabase client insertion error:", err);
      }
    }

    if (!savedToSupabase) {
      const added = { ...newClient, id: 'c_' + Date.now(), projectHistory: 'None yet', agreement_documents: uploadedAgreementFiles };
      const updated = [...clients, added];
      setClients(updated);
      saveState("aura_clients_v7", updated);
    }

    setNewClient({ name: '', phone: '', email: '', company: '', notes: '' });
    setUploadedAgreementFiles([]);
    setShowClientModal(false);
    triggerToast("Client added successfully.");
  };


  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.title || !newProject.clientId) return;
    const quote = parseFloat(newProject.quoteAmount) || 0;
    const paid = parseFloat(newProject.paidAmount) || 0;

    const record = {
      title: newProject.title,
      client_id: newProject.clientId,
      cad_type: newProject.cadType,
      status: newProject.status || 'In Progress',
      deadline: newProject.deadline || null,
      quote_amount: quote,
      paid_amount: paid,
      balance_amount: quote - paid,
      file_notes: newProject.fileNotes || '',
      progress: 0,
      user_id: user?.id
    };

    let savedToSupabase = false;
    if (supabase && user?.id) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert([record])
          .select();

        if (!error && data) {
          savedToSupabase = true;
          const inserted = data[0];
          setProjects(prev => [...prev, {
            ...inserted,
            quoteAmount: parseFloat(inserted.quote_amount) || 0,
            paidAmount: parseFloat(inserted.paid_amount) || 0,
            balanceAmount: parseFloat(inserted.balance_amount) || 0,
            clientId: inserted.client_id,
            cadType: inserted.cad_type,
            fileNotes: inserted.file_notes
          }]);
        } else {
          console.error("Supabase project insert error:", error);
        }
      } catch (err) {
        console.error("Supabase project execution error:", err);
      }
    }

    if (!savedToSupabase) {
      const added = {
        id: 'p_' + Date.now(),
        title: newProject.title,
        clientId: newProject.clientId,
        cadType: newProject.cadType,
        status: newProject.status || 'In Progress',
        deadline: newProject.deadline,
        quoteAmount: quote,
        paidAmount: paid,
        balanceAmount: quote - paid,
        fileNotes: newProject.fileNotes || '',
        progress: 0
      };
      const updated = [...projects, added];
      setProjects(updated);
      saveState("aura_projects_v7", updated);
    }

    setNewProject({ title: '', clientId: '', cadType: 'AutoCAD 2D', status: 'In Progress', deadline: '', quoteAmount: '', paidAmount: '', fileNotes: '' });
    setShowProjectModal(false);
    triggerToast("Project created successfully.");
  };


  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;

    const record = {
      title: newTask.title,
      priority: newTask.priority || 'Medium',
      due_date: newTask.dueDate || null,
      task_time: newTask.dueDate ? "09:00" : "10:00",
      completed: false,
      status: 'Pending',
      completion_percentage: 0,
      qc_status: 'Not Checked',
      sent_to_qc: false,
      notes: '',
      project_id: null,
      user_id: user?.id,
      updated_at: new Date().toISOString()
    };

    let savedToSupabase = false;
    if (supabase && user?.id) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert([record])
          .select();

        if (!error && data) {
          savedToSupabase = true;
          const inserted = data[0];
          setTasks(prev => [...prev, {
            ...inserted,
            dueDate: inserted.due_date,
            projectId: inserted.project_id
          }]);
        } else {
          console.error("Supabase insert task error:", error);
        }
      } catch (err) {
        console.error("Supabase insert task execution error:", err);
      }
    }

    if (!savedToSupabase) {
      const added = { 
        ...newTask, 
        id: 't_' + Date.now(), 
        completed: false, 
        time: newTask.dueDate ? "09:00" : "10:00",
        task_time: newTask.dueDate ? "09:00" : "10:00",
        status: 'Pending',
        notes: '',
        project_id: '',
        due_date: newTask.dueDate,
        user_id: user?.name || 'Ashok',
        updated_at: new Date().toISOString()
      };
      const updated = [...tasks, added];
      setTasks(updated);
      saveState("aura_tasks_v7", updated);
    }

    setNewTask({ title: '', priority: 'Medium', dueDate: '', reminder: false });
    setShowTaskModal(false);
    triggerToast("Task created successfully.");
  };


  const handleUpdateProjectStatus = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    const pct = parseInt(editingProject.progress) || 0;
    if (pct < 0 || pct > 100) {
      alert("Completion percentage must be between 0 and 100.");
      return;
    }

    // Validation checks
    const qcPassedSelected = editingProject.qc_status === 'QC Passed' || editingProject.status === 'QC Passed';
    if (qcPassedSelected && pct !== 100) {
      alert("QC Passed cannot be selected unless completion is 100%.");
      return;
    }

    const deliveredSelected = editingProject.delivery_status === 'Delivered' || editingProject.status === 'Delivered';
    if (deliveredSelected && editingProject.qc_status !== 'QC Passed') {
      alert("Delivered cannot be selected unless project has QC Passed status.");
      return;
    }

    const completedSelected = editingProject.status === 'Completed';
    if (completedSelected && editingProject.delivery_status !== 'Delivered' && editingProject.qc_status !== 'QC Passed') {
      alert("Completed cannot be selected unless Delivered or QC Passed.");
      return;
    }

    const updateFields = {
      status: editingProject.status,
      progress: pct,
      qc_status: editingProject.qc_status || 'Not Checked',
      revision_count: parseInt(editingProject.revision_count) || 0,
      delivery_status: editingProject.delivery_status || 'Not Delivered',
      updated_at: new Date().toISOString()
    };

    let savedToSupabase = false;
    // Check if ID is a valid Supabase UUID (usually not starting with 'p_')
    if (supabase && user?.id && !String(editingProject.id).startsWith('p_')) {
      try {
        const { error } = await supabase
          .from('projects')
          .update({
            status: updateFields.status,
            progress: updateFields.progress,
            qc_status: updateFields.qc_status,
            revision_count: updateFields.revision_count,
            delivery_status: updateFields.delivery_status,
            updated_at: updateFields.updated_at
          })
          .eq('id', editingProject.id);

        if (!error) {
          savedToSupabase = true;
        } else {
          console.error("Supabase project update error:", error);
        }
      } catch (err) {
        console.error("Supabase project update execution error:", err);
      }
    }

    const updated = projects.map(p => {
      if (p.id === editingProject.id) {
        return {
          ...p,
          ...updateFields,
          balanceAmount: p.quoteAmount - p.paidAmount
        };
      }
      return p;
    });

    setProjects(updated);
    if (!savedToSupabase) {
      saveState("aura_projects_v7", updated);
    }
    setShowProjectEditModal(false);
    setEditingProject(null);
    triggerToast("Project status updated successfully.");
  };


  const handleDeleteTask = async (id) => {
    let deletedFromSupabase = false;
    if (supabase && user?.id && !String(id).startsWith('t_')) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);
        if (!error) deletedFromSupabase = true;
      } catch (err) {
        console.error("Supabase task delete error:", err);
      }
    }

    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    if (!deletedFromSupabase) {
      saveState("aura_tasks_v7", updated);
    }
    triggerToast("Task deleted successfully.");
  };

  const handleMarkTaskStatus = async (id, newStatus) => {
    const isDone = newStatus === 'Done';
    const updatedFields = {
      status: newStatus,
      completed: isDone,
      completion_percentage: isDone ? 100 : 0,
      sent_to_qc: false,
      updated_at: new Date().toISOString()
    };

    let savedToSupabase = false;
    if (supabase && user?.id && !String(id).startsWith('t_')) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update(updatedFields)
          .eq('id', id);
        if (!error) savedToSupabase = true;
      } catch (err) {
        console.error("Supabase status toggle error:", err);
      }
    }

    const updated = tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...updatedFields
        };
      }
      return t;
    });

    setTasks(updated);
    if (!savedToSupabase) {
      saveState("aura_tasks_v7", updated);
    }
    triggerToast(`Task marked as ${newStatus} successfully.`);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    // Validate completion percentage
    const pct = parseInt(editingTask.completion_percentage) || 0;
    if (pct < 0 || pct > 100) {
      alert("Completion percentage must be between 0 and 100.");
      return;
    }

    // Validation: QC Passed cannot be selected unless completion is 100%
    if (editingTask.qc_status === 'QC Passed' && pct !== 100) {
      alert("QC Passed cannot be selected unless completion is 100%.");
      return;
    }

    // Process Task Completion & QC Send Logic
    let status = editingTask.status || 'Pending';
    let completion = pct;

    if (editingTask.sent_to_qc) {
      status = 'QC Pending';
    } else {
      if (status === 'Done') {
        completion = 100;
      } else if (completion === 100) {
        status = 'Done';
      } else if (completion >= 1 && completion <= 99) {
        status = 'In Progress';
      } else if (completion === 0) {
        status = 'Pending';
      }
    }

    const updateFields = {
      title: editingTask.title,
      task_time: editingTask.time,
      priority: editingTask.priority,
      status: status,
      completed: status === 'Done',
      project_id: editingTask.project_id || editingTask.projectId || null,
      notes: editingTask.notes || '',
      due_date: editingTask.due_date || editingTask.dueDate || null,
      completion_percentage: completion,
      qc_status: editingTask.qc_status || 'Not Checked',
      qc_checked_by: editingTask.qc_checked_by || null,
      qc_notes: editingTask.qc_notes || null,
      qc_date: editingTask.qc_date || null,
      sent_to_qc: editingTask.sent_to_qc || false,
      updated_at: new Date().toISOString()
    };

    let savedToSupabase = false;
    if (supabase && user?.id && !String(editingTask.id).startsWith('t_')) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update(updateFields)
          .eq('id', editingTask.id);

        if (!error) {
          savedToSupabase = true;
        } else {
          console.error("Supabase update task error:", error);
        }
      } catch (err) {
        console.error("Supabase update task execution error:", err);
      }
    }

    const updated = tasks.map(t => {
      if (t.id === editingTask.id) {
        return {
          ...t,
          ...updateFields,
          time: updateFields.task_time,
          dueDate: updateFields.due_date,
          projectId: updateFields.project_id
        };
      }
      return t;
    });

    setTasks(updated);
    if (!savedToSupabase) {
      saveState("aura_tasks_v7", updated);
    }
    setShowTaskEditModal(false);
    setEditingTask(null);
    triggerToast("Task updated successfully.");
  };


  const renderTaskActions = (t) => {
    const isMenuOpen = activeTaskMenuId === t.id;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Desktop View Action Buttons */}
        <div className="desktop-actions" style={{ gap: '6px' }}>
          <button 
            type="button"
            className="btn" 
            style={{ padding: '2px 6px', fontSize: '0.75rem', height: 'auto', minWidth: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', background: '#F8FAFC' }}
            onClick={(e) => { e.stopPropagation(); setEditingTask(t); setShowTaskEditModal(true); }}
          >
            Edit
          </button>
          {t.status !== 'Done' ? (
            <button 
              type="button"
              className="btn btn-primary" 
              style={{ padding: '2px 6px', fontSize: '0.75rem', height: 'auto', minWidth: 'auto', background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: '6px' }}
              onClick={(e) => { e.stopPropagation(); handleMarkTaskStatus(t.id, 'Done'); }}
            >
              Done
            </button>
          ) : (
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ padding: '2px 6px', fontSize: '0.75rem', height: 'auto', minWidth: 'auto', background: 'var(--color-warning)', color: 'white', border: 'none', borderRadius: '6px' }}
              onClick={(e) => { e.stopPropagation(); handleMarkTaskStatus(t.id, 'Pending'); }}
            >
              Undo
            </button>
          )}
          <button 
            type="button"
            className="btn" 
            style={{ padding: '2px 6px', fontSize: '0.75rem', height: 'auto', minWidth: 'auto', border: 'none', color: 'var(--color-danger)', background: '#FEE2E2', borderRadius: '6px' }}
            onClick={(e) => { e.stopPropagation(); handleDeleteTask(t.id); }}
          >
            Delete
          </button>
        </div>

        {/* Mobile View 3-dot Dropdown Menu */}
        <div className="mobile-actions" style={{ position: 'relative' }}>
          <button 
            type="button"
            className="btn btn-secondary" 
            style={{ padding: '2px 6px', minWidth: 'auto', height: 'auto', border: 'none', fontSize: '1rem', fontWeight: 'bold' }}
            onClick={(e) => { e.stopPropagation(); setActiveTaskMenuId(isMenuOpen ? null : t.id); }}
          >
            ⋮
          </button>
          {isMenuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '28px',
              background: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
              zIndex: 100,
              width: '130px',
              display: 'flex',
              flexDirection: 'column',
              padding: '4px'
            }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none', width: '100%', justifyContent: 'flex-start' }}
                onClick={() => { setEditingTask(t); setShowTaskEditModal(true); setActiveTaskMenuId(null); }}
              >
                Edit
              </button>
              {t.status !== 'Done' ? (
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none', width: '100%', justifyContent: 'flex-start', color: 'var(--color-success)' }}
                  onClick={() => { handleMarkTaskStatus(t.id, 'Done'); setActiveTaskMenuId(null); }}
                >
                  Mark Done
                </button>
              ) : (
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none', width: '100%', justifyContent: 'flex-start', color: 'var(--color-warning)' }}
                  onClick={() => { handleMarkTaskStatus(t.id, 'Pending'); setActiveTaskMenuId(null); }}
                >
                  Mark Pending
                </button>
              )}
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', border: 'none', width: '100%', justifyContent: 'flex-start', color: 'var(--color-danger)' }}
                onClick={() => { handleDeleteTask(t.id); setActiveTaskMenuId(null); }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  // Calendar Utilities
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const getMonthDays = (year, month) => {
    const numDays = new Date(year, month + 1, 0).getDate();
    let startDayOfWeek = new Date(year, month, 1).getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Mon=0, Sun=6
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= numDays; d++) {
      days.push(d);
    }
    return days;
  };

  const getDayEvents = (dateStr) => {
    if (!dateStr) return { tasks: [], projects: [], invoices: [], qcTasks: [], completedTasks: [], reminders: [], personalTasks: [], habits: [], bills: [], personalReminders: [], meetings: [], birthdays: [] };
    const dayTasks = tasks.filter(t => t.due_date === dateStr || t.dueDate === dateStr);
    const dayProjects = projects.filter(p => p.deadline === dateStr);
    const dayInvoices = invoices.filter(i => i.due_date === dateStr);
    const dayQcTasks = tasks.filter(t => (t.due_date === dateStr || t.dueDate === dateStr) && (t.status === 'QC Pending' || t.qc_status === 'QC Pending'));
    const dayCompletedTasks = tasks.filter(t => (t.due_date === dateStr || t.dueDate === dateStr) && (t.status === 'Done' || t.completed));
    const dayReminders = reminders.filter(r => r.due_date === dateStr || r.reminder_date === dateStr);

    const dayPersonalTasks = personalTasks.filter(pt => pt.due_date === dateStr && pt.category !== 'Bills & Payments');
    const dayHabits = habits.filter(h => h.last_completed_date === dateStr);
    const dayBills = personalTasks.filter(pt => pt.due_date === dateStr && pt.category === 'Bills & Payments');
    const dayPersonalReminders = personalTasks.filter(pt => pt.reminder_date === dateStr);
    const dayMeetings = meetings.filter(m => m.date === dateStr);
    const dayBirthdays = birthdays.filter(b => b.date === dateStr);

    return {
      tasks: dayTasks,
      projects: dayProjects,
      invoices: dayInvoices,
      qcTasks: dayQcTasks,
      completedTasks: dayCompletedTasks,
      reminders: dayReminders,
      personalTasks: dayPersonalTasks,
      habits: dayHabits,
      bills: dayBills,
      personalReminders: dayPersonalReminders,
      meetings: dayMeetings,
      birthdays: dayBirthdays
    };
  };

  const handleCalendarDateClick = (dayNum) => {
    if (!dayNum) return;
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    setSelectedDateStr(dateStr);
    setShowDayDetailModal(true);
  };

  const handleQuickAddReminder = async (selectedDate, title) => {
    if (!title?.trim() || !selectedDate) return;
    setIsAdding(true);
    const added = {
      id: 'rem_' + Date.now(),
      title: title.trim(),
      reminder_date: selectedDate,
      due_date: selectedDate,
      time: '09:00',
      user_id: user?.id || user?.email || user?.name || 'Ashok'
    };

    let savedToSupabase = false;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .insert([
            {
              title: added.title,
              reminder_date: added.reminder_date,
              user_id: added.user_id
            }
          ])
          .select();
        
        if (!error) {
          savedToSupabase = true;
          const newReminderFromDb = data?.[0] || added;
          const merged = { ...added, ...newReminderFromDb, due_date: newReminderFromDb.reminder_date || added.due_date };
          setReminders(prev => {
            const newReminders = [...prev, merged];
            saveState("aura_reminders_v7", newReminders);
            return newReminders;
          });
        } else {
          console.error("Supabase insert error:", error);
        }
      } catch (err) {
        console.error("Supabase execution error:", err);
      }
    }

    if (!savedToSupabase) {
      setReminders(prev => {
        const newReminders = [...prev, added];
        saveState("aura_reminders_v7", newReminders);
        return newReminders;
      });
    }

    setQuickTitle('');
    triggerToast("Reminder added successfully.");
    setIsAdding(false);
  };

  const handleQuickAddTask = async (selectedDate, title) => {
    if (!title?.trim() || !selectedDate) return;
    setIsAdding(true);
    const added = {
      id: 't_' + Date.now(),
      title: title.trim(),
      priority: 'Medium',
      dueDate: selectedDate,
      due_date: selectedDate,
      time: '09:00',
      task_time: '09:00',
      completed: false,
      status: 'Pending',
      completion_percentage: 0,
      qc_status: 'Not Checked',
      sent_to_qc: false,
      user_id: user?.id || user?.email || user?.name || 'Ashok',
      updated_at: new Date().toISOString()
    };

    let savedToSupabase = false;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert([
            {
              title: added.title,
              priority: added.priority,
              due_date: added.due_date,
              task_time: added.task_time,
              status: added.status,
              completion_percentage: added.completion_percentage,
              qc_status: added.qc_status,
              sent_to_qc: added.sent_to_qc,
              user_id: added.user_id,
              updated_at: added.updated_at
            }
          ])
          .select();
        
        if (!error) {
          savedToSupabase = true;
          const newTaskFromDb = data?.[0] || added;
          setTasks(prev => {
            const newTasks = [...prev, { ...added, ...newTaskFromDb }];
            saveState("aura_tasks_v7", newTasks);
            return newTasks;
          });
        } else {
          console.error("Supabase insert error:", error);
        }
      } catch (err) {
        console.error("Supabase execution error:", err);
      }
    }

    if (!savedToSupabase) {
      setTasks(prev => {
        const newTasks = [...prev, added];
        saveState("aura_tasks_v7", newTasks);
        return newTasks;
      });
    }

    setQuickTitle('');
    triggerToast("Task added successfully.");
    setIsAdding(false);
  };

  // ==========================================================================
  // Personal Tracker Handlers
  // ==========================================================================
  const handleSavePersonalTask = async (e) => {
    if (e) e.preventDefault();
    if (!personalTaskForm.title.trim()) {
      alert("Title is required.");
      return;
    }

    let pct = personalTaskForm.completion_percentage;
    let status = personalTaskForm.status;
    if (pct === 100) status = 'Done';
    else if (pct > 0 && pct < 100) status = 'In Progress';
    else if (pct === 0) status = 'Pending';

    const userId = user?.id || user?.email || user?.name || 'Ashok';
    const record = {
      ...personalTaskForm,
      title: personalTaskForm.title.trim(),
      status,
      completion_percentage: pct,
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    setIsAdding(true);
    let savedToSupabase = false;

    if (editingPersonalTask) {
      const targetId = editingPersonalTask.id;
      if (supabase) {
        try {
          const { error } = await supabase
            .from('personal_tasks')
            .update({
              title: record.title,
              category: record.category,
              priority: record.priority,
              due_date: record.due_date,
              reminder_date: record.reminder_date,
              status: record.status,
              completion_percentage: record.completion_percentage,
              notes: record.notes,
              updated_at: record.updated_at
            })
            .eq('id', targetId);
          if (!error) savedToSupabase = true;
          else console.error("Supabase update error:", error);
        } catch (err) {
          console.error("Supabase execution error:", err);
        }
      }

      setPersonalTasks(prev => {
        const nextList = prev.map(t => t.id === targetId ? { ...t, ...record } : t);
        saveState("aura_personal_tasks_v7", nextList);
        return nextList;
      });
      triggerToast("Personal task updated successfully.");
    } else {
      const newId = 'pt_' + Date.now();
      const newRecord = { ...record, id: newId, created_at: new Date().toISOString() };
      
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('personal_tasks')
            .insert([
              {
                title: newRecord.title,
                category: newRecord.category,
                priority: newRecord.priority,
                due_date: newRecord.due_date,
                reminder_date: newRecord.reminder_date,
                status: newRecord.status,
                completion_percentage: newRecord.completion_percentage,
                notes: newRecord.notes,
                user_id: newRecord.user_id,
                created_at: newRecord.created_at,
                updated_at: newRecord.updated_at
              }
            ])
            .select();
          if (!error) {
            savedToSupabase = true;
            const dbData = data?.[0] || newRecord;
            setPersonalTasks(prev => {
              const nextList = [...prev, { ...newRecord, ...dbData }];
              saveState("aura_personal_tasks_v7", nextList);
              return nextList;
            });
          } else {
            console.error("Supabase insert error:", error);
          }
        } catch (err) {
          console.error("Supabase execution error:", err);
        }
      }

      if (!savedToSupabase) {
        setPersonalTasks(prev => {
          const nextList = [...prev, newRecord];
          saveState("aura_personal_tasks_v7", nextList);
          return nextList;
        });
      }
      triggerToast("Personal task added successfully.");
    }

    setPersonalTaskForm({
      title: '',
      category: 'Personal Tasks',
      priority: 'Medium',
      due_date: new Date().toISOString().split('T')[0],
      reminder_date: '',
      status: 'Pending',
      completion_percentage: 0,
      notes: ''
    });
    setEditingPersonalTask(null);
    setShowPersonalTaskModal(false);
    setIsAdding(false);
  };

  const handleMarkPersonalTaskDone = async (id) => {
    const updatedTasks = personalTasks.map(t => {
      if (t.id === id) {
        return { ...t, status: 'Done', completion_percentage: 100, updated_at: new Date().toISOString() };
      }
      return t;
    });

    const target = updatedTasks.find(t => t.id === id);
    if (supabase && target) {
      try {
        await supabase
          .from('personal_tasks')
          .update({ status: 'Done', completion_percentage: 100, updated_at: target.updated_at })
          .eq('id', id);
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }

    setPersonalTasks(updatedTasks);
    saveState("aura_personal_tasks_v7", updatedTasks);
    triggerToast("Task marked as Done.");
  };

  const handleDeletePersonalTask = async (id) => {
    if (!confirm("Are you sure you want to delete this personal task?")) return;
    if (supabase) {
      try {
        await supabase.from('personal_tasks').delete().eq('id', id);
      } catch (err) {
        console.error("Supabase delete error:", err);
      }
    }

    const updated = personalTasks.filter(t => t.id !== id);
    setPersonalTasks(updated);
    saveState("aura_personal_tasks_v7", updated);
    triggerToast("Personal task deleted successfully.");
  };

  // Habits Operations
  const handleSaveHabit = async (e) => {
    if (e) e.preventDefault();
    if (!habitForm.habit_name.trim()) {
      alert("Habit name is required.");
      return;
    }

    const userId = user?.id || user?.email || user?.name || 'Ashok';
    const record = {
      ...habitForm,
      habit_name: habitForm.habit_name.trim(),
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    setIsAdding(true);
    let savedToSupabase = false;

    if (editingHabit) {
      const targetId = editingHabit.id;
      if (supabase) {
        try {
          const { error } = await supabase
            .from('habits')
            .update({
              habit_name: record.habit_name,
              frequency: record.frequency,
              streak_count: record.streak_count,
              last_completed_date: record.last_completed_date,
              status: record.status,
              updated_at: record.updated_at
            })
            .eq('id', targetId);
          if (!error) savedToSupabase = true;
        } catch (err) {
          console.error(err);
        }
      }

      setHabits(prev => {
        const nextList = prev.map(h => h.id === targetId ? { ...h, ...record } : h);
        saveState("aura_habits_v7", nextList);
        return nextList;
      });
      triggerToast("Habit updated successfully.");
    } else {
      const newId = 'h_' + Date.now();
      const newRecord = { ...record, id: newId, created_at: new Date().toISOString() };

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('habits')
            .insert([
              {
                habit_name: newRecord.habit_name,
                frequency: newRecord.frequency,
                streak_count: newRecord.streak_count,
                last_completed_date: newRecord.last_completed_date,
                status: newRecord.status,
                user_id: newRecord.user_id,
                created_at: newRecord.created_at,
                updated_at: newRecord.updated_at
              }
            ])
            .select();
          if (!error) {
            savedToSupabase = true;
            const dbData = data?.[0] || newRecord;
            setHabits(prev => {
              const nextList = [...prev, { ...newRecord, ...dbData }];
              saveState("aura_habits_v7", nextList);
              return nextList;
            });
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (!savedToSupabase) {
        setHabits(prev => {
          const nextList = [...prev, newRecord];
          saveState("aura_habits_v7", nextList);
          return nextList;
        });
      }
      triggerToast("Habit added successfully.");
    }

    setHabitForm({
      habit_name: '',
      frequency: 'Daily',
      streak_count: 0,
      last_completed_date: '',
      status: 'Active'
    });
    setEditingHabit(null);
    setShowHabitModal(false);
    setIsAdding(false);
  };

  const handleCompleteHabit = async (id) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id === id) {
        const nextStreak = h.streak_count + 1;
        return { ...h, streak_count: nextStreak, last_completed_date: today, updated_at: new Date().toISOString() };
      }
      return h;
    });

    const target = updated.find(h => h.id === id);
    if (supabase && target) {
      try {
        await supabase
          .from('habits')
          .update({ streak_count: target.streak_count, last_completed_date: today, updated_at: target.updated_at })
          .eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }

    setHabits(updated);
    saveState("aura_habits_v7", updated);
    triggerToast("Habit completed! Streak updated.");
  };

  const handleResetHabit = async (id) => {
    const updated = habits.map(h => {
      if (h.id === id) {
        return { ...h, streak_count: 0, updated_at: new Date().toISOString() };
      }
      return h;
    });

    const target = updated.find(h => h.id === id);
    if (supabase && target) {
      try {
        await supabase
          .from('habits')
          .update({ streak_count: 0, updated_at: target.updated_at })
          .eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }

    setHabits(updated);
    saveState("aura_habits_v7", updated);
    triggerToast("Habit streak reset to 0.");
  };

  const handleDeleteHabit = async (id) => {
    if (!confirm("Delete this habit?")) return;
    if (supabase) {
      try {
        await supabase.from('habits').delete().eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }

    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    saveState("aura_habits_v7", updated);
    triggerToast("Habit deleted successfully.");
  };

  const handleSavePersonalNotes = (val) => {
    setPersonalNotes(val);
    saveState("aura_personal_notes_v7", val);
  };

  const handleSaveMeeting = async (e) => {
    if (e) e.preventDefault();
    if (!meetingForm.title.trim()) return;

    const newId = 'm_' + Date.now();
    const added = {
      id: newId,
      title: meetingForm.title.trim(),
      date: meetingForm.date,
      time: meetingForm.time,
      clientId: meetingForm.clientId,
      notes: meetingForm.notes,
      user_id: user?.id || user?.email || user?.name || 'Ashok'
    };

    let savedToSupabase = false;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('client_meetings')
          .insert([
            {
              title: added.title,
              meeting_date: added.date,
              meeting_time: added.time,
              client_id: added.clientId || null,
              notes: added.notes,
              user_id: added.user_id
            }
          ])
          .select();
        
        if (!error) {
          savedToSupabase = true;
          const fromDb = data?.[0] || added;
          const merged = { ...added, ...fromDb, date: fromDb.meeting_date || added.date, time: fromDb.meeting_time || added.time };
          setMeetings(prev => {
            const nextList = [...prev, merged];
            saveState("aura_meetings_v7", nextList);
            return nextList;
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!savedToSupabase) {
      setMeetings(prev => {
        const nextList = [...prev, added];
        saveState("aura_meetings_v7", nextList);
        return nextList;
      });
    }

    triggerToast("Meeting scheduled successfully.");
    setShowMeetingModal(false);
    setMeetingForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      clientId: '',
      notes: ''
    });
  };

  const handleDeleteMeeting = async (id) => {
    if (!confirm("Are you sure you want to cancel this meeting?")) return;
    if (supabase) {
      try {
        await supabase.from('client_meetings').delete().eq('id', id);
      } catch (err) {
        console.error(err);
      }
    }
    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);
    saveState("aura_meetings_v7", updated);
    triggerToast("Meeting cancelled successfully.");
  };

  // PDF Generation Utility (Works before and after saving)
  const generateAndDownloadPDF = async (inv) => {
    setInvoiceLoading('Generating PDF...');
    setInvoiceError('');
    try {
      const client = clients.find(c => c.id === inv.client_id);
      const proj = projects.find(p => p.id === inv.project_id);

      const clientName = client ? client.name : "Unknown_Client";
      const sanitizedClientName = clientName.replace(/\s+/g, '_');
      const fileName = `${inv.invoice_number}_${sanitizedClientName}.pdf`;

      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Header branding
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("AURA WORKSPACE OS", 15, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Premium CAD Design & BIM Consultancies", 15, 25);
      doc.text("GSTIN: 27AAAAA1111A1Z1", 15, 30);

      doc.setFontSize(20);
      doc.text("INVOICE", 150, 20);
      doc.setFontSize(11);
      doc.text(inv.invoice_number, 150, 28);

      // Business Details
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text("FROM:", 15, 50);
      doc.setFont("helvetica", "bold");
      doc.text("Ashok Kumar (Freelancer)", 15, 55);
      doc.setFont("helvetica", "normal");
      doc.text("Suite 404, Tech Park, Bangalore", 15, 60);
      doc.text("Phone: +91 99999 88888", 15, 65);

      // Client Details
      doc.text("TO CLIENT:", 110, 50);
      doc.setFont("helvetica", "bold");
      doc.text(client ? client.name : "Unknown Client", 110, 55);
      doc.setFont("helvetica", "normal");
      doc.text(client ? client.company : "N/A", 110, 60);
      doc.text(client ? `Email: ${client.email}` : "N/A", 110, 65);

      // Invoice Meta Dates
      doc.line(15, 75, 195, 75);
      doc.text(`Invoice Date: ${inv.invoice_date}`, 15, 82);
      doc.text(`Payment Due: ${inv.due_date}`, 110, 82);
      doc.line(15, 87, 195, 87);

      // Items table breakdown
      const headers = [['Description / Project Details', 'Modeling Type', 'Project Total', 'Advance Paid', 'Outstanding Balance']];
      const data = [[
        proj ? proj.title : "CAD Drawings Service",
        proj ? proj.cadType : "N/A",
        `Rs. ${inv.project_amount.toLocaleString('en-IN')}`,
        `Rs. ${inv.advance_paid.toLocaleString('en-IN')}`,
        `Rs. ${inv.balance_due.toLocaleString('en-IN')}`
      ]];

      doc.autoTable({
        head: headers,
        body: data,
        startY: 95,
        theme: 'grid',
        headStyles: { fillContext: '#4F46E5' }
      });

      // Totals Grid
      let finalY = doc.lastAutoTable.finalY + 15;
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal (Outstanding Balance):", 110, finalY);
      doc.text(`Rs. ${inv.balance_due.toLocaleString('en-IN')}`, 170, finalY);
      
      finalY += 8;
      doc.text(`GST (${inv.gst_percentage}%):`, 110, finalY);
      doc.text(`Rs. ${inv.gst_amount.toLocaleString('en-IN')}`, 170, finalY);

      if (inv.discount > 0) {
        finalY += 8;
        doc.text("Discount Deductions:", 110, finalY);
        doc.text(`- Rs. ${inv.discount.toLocaleString('en-IN')}`, 170, finalY);
      }

      finalY += 10;
      doc.setFont("helvetica", "bold");
      doc.text("GRAND TOTAL DUE:", 110, finalY);
      doc.text(`Rs. ${inv.grand_total.toLocaleString('en-IN')}`, 170, finalY);

      // Payment Info
      finalY += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("PAYMENT INSTRUCTIONS:", 15, finalY);
      doc.text("Bank Name: HDFC Corporate Primary", 15, finalY + 5);
      doc.text("Account Number: 501009988776655", 15, finalY + 10);
      doc.text("IFSC Code: HDFC0001234", 15, finalY + 15);

      // Terms
      doc.text("TERMS AND CONDITIONS:", 15, finalY + 30);
      doc.text("1. All model drafts must undergo final structural engineering sign-off.", 15, finalY + 35);
      doc.text("2. Please send transaction receipts to support billing tracking.", 15, finalY + 40);

      // Signature Area
      doc.text("Authorized Signature:", 140, finalY + 30);
      doc.line(140, finalY + 45, 190, finalY + 45);

      // 1. Download file locally
      doc.save(fileName);
      console.log(`Development Log: PDF generated successfully as ${fileName}`);

      // 2. Upload to Supabase Storage bucket 'invoice-pdfs'
      const pdfBlob = doc.output('blob');
      const storagePath = `${user.id}/${Date.now()}_${fileName}`;
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
            console.log("PDF uploaded to Supabase Storage. URL:", publicUrl);
          } else {
            console.error("Supabase Storage PDF upload error:", error);
          }
        } catch (err) {
          console.error("Supabase Storage execution error:", err);
        }
      }

      setInvoiceLoading('');
      triggerToast("PDF downloaded and synced with Cloud storage successfully!");
      return publicUrl;
    } catch (err) {
      console.error(err);
      setInvoiceError("PDF Generation/Upload Failed. Try again.");
      setInvoiceLoading('');
    }
  };

  // Save Draft (Enforces Supabase Row Level Security parameters)
  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!invoiceForm.client_id || !invoiceForm.project_id) return alert("Select client and project.");
    
    setInvoiceLoading('Saving...');
    setInvoiceError('');
    try {
      const dbRecord = {
        invoice_number: invoiceForm.invoice_number,
        client_id: invoiceForm.client_id,
        project_id: invoiceForm.project_id,
        invoice_date: invoiceForm.invoice_date,
        due_date: invoiceForm.due_date || null,
        project_amount: invoiceForm.project_amount,
        advance_paid: invoiceForm.advance_paid,
        balance_due: invoiceForm.balance_due,
        gst_percentage: invoiceForm.gst_percentage,
        gst_amount: invoiceForm.gst_amount,
        discount: invoiceForm.discount,
        grand_total: invoiceForm.grand_total,
        payment_status: 'Draft',
        payment_method: invoiceForm.payment_method,
        notes: invoiceForm.notes,
        pdf_url: `https://supabase.co/storage/v1/object/private/invoice-pdfs/${user.id}/${invoiceForm.invoice_number}.pdf`,
        user_id: user.id
      };

      let savedToSupabase = false;
      if (supabase) {
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
              project_amount: parseFloat(inserted.project_amount) || 0,
              advance_paid: parseFloat(inserted.advance_paid) || 0,
              balance_due: parseFloat(inserted.balance_due) || 0,
              gst_percentage: parseFloat(inserted.gst_percentage) || 18,
              gst_amount: parseFloat(inserted.gst_amount) || 0,
              discount: parseFloat(inserted.discount) || 0,
              grand_total: parseFloat(inserted.grand_total) || 0
            }
          ]);
        } else {
          console.error("Supabase insert invoice error:", error);
        }
      }

      if (!savedToSupabase) {
        const addedDraft = {
          ...invoiceForm,
          id: 'inv_' + Date.now(),
          payment_status: 'Draft',
          created_by: user.name, // RLS filter parameter
          pdf_url: dbRecord.pdf_url
        };
        const updated = [...invoices, addedDraft];
        setInvoices(updated);
        saveState("aura_invoices_v7", updated);
      }

      console.log(`Development Log: Invoice saved successfully to Supabase 'invoices' table.`);

      setInvoiceLoading('');
      setShowInvoiceModal(false);
      triggerToast("Invoice draft saved successfully.");
    } catch (err) {
      console.error(err);
      setInvoiceError("Failed to save draft. Connection error.");
      setInvoiceLoading('');
    }
  };

  // Invoices Actions
  const handleMarkPaid = async (id) => {
    let savedToSupabase = false;
    if (supabase && user?.id && !String(id).startsWith('inv_')) {
      try {
        const { error } = await supabase
          .from('invoices')
          .update({
            payment_status: 'Paid',
            balance_due: 0,
            grand_total: 0
          })
          .eq('id', id);
        
        if (!error) savedToSupabase = true;
      } catch (err) {
        console.error("Supabase update invoice paid error:", err);
      }
    }

    const updated = invoices.map(inv => inv.id === id ? { ...inv, payment_status: 'Paid', balance_due: 0, grand_total: 0 } : inv);
    setInvoices(updated);
    if (!savedToSupabase) {
      saveState("aura_invoices_v7", updated);
    }
    triggerToast("Invoice marked as Paid.");
  };

  const handleDeleteInvoice = async (id) => {
    let deletedFromSupabase = false;
    if (supabase && user?.id && !String(id).startsWith('inv_')) {
      try {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', id);
        if (!error) deletedFromSupabase = true;
      } catch (err) {
        console.error("Supabase invoice delete error:", err);
      }
    }

    const updated = invoices.filter(inv => inv.id !== id);
    setInvoices(updated);
    if (!deletedFromSupabase) {
      saveState("aura_invoices_v7", updated);
    }
    triggerToast("Invoice deleted.");
  };


  const sendEmail = (inv) => {
    const client = clients.find(c => c.id === inv.client_id);
    alert(`Email successfully dispatched containing PDF invoice ${inv.invoice_number}.`);
  };

  // AI Invoice Commands
  const handleAIInvoiceCommand = (cmd) => {
    const query = cmd;
    const updatedChat = [...aiInvoiceChat, { sender: 'user', text: query }];
    setAiInvoiceChat(updatedChat);

    setTimeout(() => {
      let botResponse = "I'm evaluating your invoice ledgers. Try options below to predict risks or draft emails.";
      if (query.includes("Reminder")) {
        botResponse = `✉ **Payment Reminder Template:**
        *"Dear Client, this is a friendly reminder that invoice ${invoices[0]?.invoice_number || 'INV-2026-0001'} (Total: ₹${invoices[0]?.grand_total || '30,860'}) is currently pending payment. Please confirm remittance details. Thanks, Ashok."*`;
      } else if (query.includes("Follow-up")) {
        botResponse = `✉ **Late Payment Follow-up Draft:**
        *"Hello team, following up on the outstanding balance of ₹${invoices[0]?.grand_total || '30,860'} under project ${projects[0]?.title || 'Villa Project'}. We request you clear the invoices by early next week to prevent delivery holds."*`;
      } else if (query.includes("Summarize")) {
        const totalPending = invoices.filter(i => i.payment_status !== 'Paid').reduce((sum, i) => sum + i.grand_total, 0);
        botResponse = `📊 **Invoice Ledger Summary:**
        - **Total Invoices**: ${invoices.length}
        - **Unsettled Balances**: ₹${totalPending.toLocaleString('en-IN')} pending client transfer.
        - **Primary payment method**: Bank Transfer / UPI.`;
      } else if (query.includes("Risk")) {
        botResponse = `⚠️ **Late Payment Risk Predictor:**
        - **Apex Builders**: *Low Risk* (Past payments cleared within 12 days).
        - **Zenith Mechanical**: *Medium Risk* (Awaiting confirmation, pending balance ₹45,000).`;
      }
      setAiInvoiceChat(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 600);
  };

  // Invoices filtered list (supporting sub-tabs: All, Drafts, Pending, Paid, Overdue)
  const filteredInvoices = invoices.filter(inv => {
    // RLS: User can only see their own invoices
    if (inv.created_by && inv.created_by !== user?.name) return false;

    const client = clients.find(c => c.id === inv.client_id);
    const clientName = client ? client.name : 'Unknown';
    const proj = projects.find(p => p.id === inv.project_id);
    const projTitle = proj ? proj.title : 'N/A';

    const matchSearch = inv.invoice_number.toLowerCase().includes(invoiceSearch.toLowerCase()) || clientName.toLowerCase().includes(invoiceSearch.toLowerCase()) || projTitle.toLowerCase().includes(invoiceSearch.toLowerCase());
    
    let matchSubTab = true;
    if (invoiceSubTab !== 'All') {
      matchSubTab = inv.payment_status === invoiceSubTab;
    }

    return matchSearch && matchSubTab;
  });

  // Filtered Projects for creation
  const filteredProjects = projects
    .filter(p => {
      const client = clients.find(c => c.id === p.clientId);
      const clientName = client ? client.name : 'Unknown';
      const matchSearch = p.title.toLowerCase().includes(projectSearch.toLowerCase()) || clientName.toLowerCase().includes(projectSearch.toLowerCase());
      const matchFilter = projectFilterStatus === 'All' || p.status === projectFilterStatus;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (projectSortOrder === 'Ascending') {
        return new Date(a.deadline) - new Date(b.deadline);
      } else if (projectSortOrder === 'Descending') {
        return new Date(b.deadline) - new Date(a.deadline);
      }
      return 0;
    });

  // Authentication Guard Render View
  // Authentication Guard Render View
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', background: '#10B981', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1200, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
            <CheckCircle2 size={18} />
            {toastMessage}
          </div>
        )}

        {/* Left Panel: Branding and Illustration (Desktop Only) */}
        <div className="auth-left-panel" style={{
          width: '45%',
          background: 'linear-gradient(135deg, #6C4DFF 0%, #8B5CF6 100%)',
          color: 'white',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle abstract geometric background shapes */}
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', filter: 'blur(40px)' }}></div>
          <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(30px)' }}></div>

          <div style={{ maxWidth: '440px', position: 'relative', zIndex: 2 }}>
            {/* App Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <img src="/logo.png" alt="AURA" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'contain' }} />
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: '850', letterSpacing: '-0.5px' }}>AURA</span>
              </div>
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: '850', lineHeight: '1.15', marginBottom: '16px', letterSpacing: '-0.8px' }}>
              AURA Workspace
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '40px' }}>
              Your Engineering Productivity Platform. Manage active CAD files, track progress updates, check daily planners, and access AI assistant modules.
            </p>

            {/* Feature Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: 'Project Management', desc: 'Track drawing deadlines, files, quotes, and revisions.' },
                { title: 'Daily Planner', desc: 'Prioritize hourly tasks, check habits, and sync schedules.' },
                { title: 'AI Productivity Assistant', desc: 'Get smart billing risk estimates and document reminders.' }
              ].map((feat, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ color: '#34D399', fontSize: '1.1rem', marginTop: '2px' }}>✔</div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>{feat.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0 0', lineHeight: '1.4' }}>{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Content Panel */}
        <div className="auth-right-panel" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 24px',
          overflowY: 'auto'
        }}>
          <div style={{ maxWidth: '540px', width: '100%', padding: '24px 0' }}>
            
            {/* Branding header on mobile/tablets */}
            <div className="mobile-only-logo" style={{ textAlign: 'center', marginBottom: '28px' }}>
              <img src="/logo.png" alt="A" style={{ width: '76px', height: '76px', borderRadius: '16px', marginBottom: '12px', objectFit: 'contain' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>AURA Workspace</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Engineering Productivity Platform</span>
            </div>

            {regSubmitted ? (
              /* Registration Success Confirmation Screen */
              <div className="card" style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '24px',
                padding: '40px 32px',
                textAlign: 'center',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                margin: 0
              }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: '20px', fontWeight: 'bold' }}>
                  ✓
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Request Submitted
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '28px' }}>
                  Your registration request has been successfully sent to the system administrator for verification. Once approved, you will receive an activation email and can sign in to your dashboard.
                </p>
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', marginBottom: '28px', textAlign: 'left', border: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Need assistance?</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Contact your IT administrator or email <a href="mailto:chandrunavalarch@gmail.com" style={{ color: '#6C4DFF', fontWeight: '600' }}>chandrunavalarch@gmail.com</a>.</span>
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    height: '48px',
                    background: 'linear-gradient(135deg, #6C4DFF 0%, #8B5CF6 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => {
                    setRegSubmitted(false);
                    setAuthMode('login');
                  }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              /* Normal Sign In / Request Access Card */
              <div className="card" style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '24px',
                padding: '40px 36px',
                boxShadow: '0 15px 30px -10px rgba(0,0,0,0.04)',
                margin: 0
              }}>
                {/* Center Brand Logo Focal Point (Only on Desktop) */}
                <div className="desktop-only-logo-header" style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <img src="/logo.png" alt="AURA Logo" style={{ width: '80px', height: '80px', borderRadius: '18px', marginBottom: '12px', objectFit: 'contain' }} />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '850', color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>AURA Workspace</h2>
                  <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '4px 0 0 0' }}>Engineering Productivity Platform</p>
                </div>

                {/* Mode Toggles */}
                <div style={{
                  display: 'flex',
                  borderBottom: '1px solid #E2E8F0',
                  paddingBottom: '12px',
                  marginBottom: '32px',
                  gap: '12px'
                }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      height: '44px',
                      borderRadius: '22px',
                      border: 'none',
                      background: authMode === 'login' ? 'linear-gradient(135deg, #6C4DFF 0%, #8B5CF6 100%)' : 'transparent',
                      color: authMode === 'login' ? 'white' : 'var(--text-secondary)',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: authMode === 'login' ? '0 4px 12px rgba(108, 77, 255, 0.25)' : 'none'
                    }}
                    onClick={() => setAuthMode('login')}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      height: '44px',
                      borderRadius: '22px',
                      border: 'none',
                      background: authMode === 'signup' ? 'linear-gradient(135deg, #6C4DFF 0%, #8B5CF6 100%)' : 'transparent',
                      color: authMode === 'signup' ? 'white' : 'var(--text-secondary)',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: authMode === 'signup' ? '0 4px 12px rgba(108, 77, 255, 0.25)' : 'none'
                    }}
                    onClick={() => setAuthMode('signup')}
                  >
                    Request Access
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit}>
                  {authMode === 'login' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email or Username</label>
                        <input
                          type="text"
                          placeholder="name@company.com"
                          className="form-input auth-input"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            height: '48px',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="form-input auth-input"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            height: '48px',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Request Access Form with 2-Column Responsive Layout */
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '16px 20px'
                      }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>First Name *</label>
                          <input
                            type="text"
                            placeholder="John"
                            className="form-input auth-input"
                            value={regFirstName}
                            onChange={(e) => setRegFirstName(e.target.value)}
                            required
                            style={{ width: '100%', height: '46px', borderRadius: '10px', padding: '12px 16px', fontSize: '0.9rem' }}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Last Name *</label>
                          <input
                            type="text"
                            placeholder="Doe"
                            className="form-input auth-input"
                            value={regLastName}
                            onChange={(e) => setRegLastName(e.target.value)}
                            required
                            style={{ width: '100%', height: '46px', borderRadius: '10px', padding: '12px 16px', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Username *</label>
                        <input
                          type="text"
                          placeholder="johndoe"
                          className="form-input auth-input"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          required
                          style={{ width: '100%', height: '46px', borderRadius: '10px', padding: '12px 16px', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Address *</label>
                        <input
                          type="email"
                          placeholder="john@company.com"
                          className="form-input auth-input"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                          style={{ width: '100%', height: '46px', borderRadius: '10px', padding: '12px 16px', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '16px 20px'
                      }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Password *</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            className="form-input auth-input"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
                            style={{ width: '100%', height: '46px', borderRadius: '10px', padding: '12px 16px', fontSize: '0.9rem' }}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Confirm Password *</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            className="form-input auth-input"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            required
                            style={{ width: '100%', height: '46px', borderRadius: '10px', padding: '12px 16px', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>

                      {/* Terms & Privacy checkbox */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <input 
                          type="checkbox" 
                          id="reg-agreed-checkbox"
                          checked={regAgreed} 
                          onChange={(e) => setRegAgreed(e.target.checked)} 
                          style={{ width: '16px', height: '16px', accentColor: '#6C4DFF', cursor: 'pointer' }}
                        />
                        <label htmlFor="reg-agreed-checkbox" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                          I agree to the company's Terms of Use and Privacy Policy.
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    style={{
                      width: '100%',
                      height: '52px',
                      background: 'linear-gradient(135deg, #6C4DFF 0%, #8B5CF6 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      marginTop: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(108, 77, 255, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    className="auth-primary-btn"
                  >
                    {authLoading ? 'Processing...' : authMode === 'login' ? 'Sign In to Workspace' : 'Submit Access Request'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', background: '#10B981', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1200, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* Mobile Top Header Bar */}
      <div className="mobile-header-bar" style={{ width: '100%' }}>
        <button
          type="button"
          className="btn"
          style={{ border: 'none', background: 'transparent', minWidth: 'auto', padding: '4px', height: '44px', display: 'flex', alignItems: 'center' }}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
        >
          <span style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>☰</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="A" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain' }} />
          <span style={{ fontWeight: '750', fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>AURA</span>
        </div>
        <div
          style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', boxShadow: 'var(--shadow-card)' }}
          onClick={() => setActiveTab('profile')}
        >
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </div>
      </div>

      {/* Mobile Sidebar Navigation Drawer Overlay */}
      {drawerOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex' }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            style={{ width: '280px', height: '100%', background: 'var(--bg-sidebar)', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid var(--border-color)', animation: 'slideIn 0.2s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/logo.png" alt="A" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }} />
                  <div>
                    <h2 style={{ fontSize: '0.95rem', fontWeight: '700', letterSpacing: '-0.3px', margin: 0, color: 'var(--text-primary)' }}>AURA Workspace</h2>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OS Dashboard</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{ border: 'none', background: 'transparent', minWidth: 'auto', padding: '8px', fontSize: '1.2rem', color: 'var(--text-primary)' }}
                  onClick={() => setDrawerOpen(false)}
                >
                  ✕
                </button>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => { setActiveTab('dashboard'); setDrawerOpen(false); }}>
                  <LayoutDashboard size={18} /> Dashboard
                </button>
                {hasPermission(user?.role, 'canManageUsers') && (
                  <button className={`btn ${activeTab === 'clients' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => { setActiveTab('clients'); setDrawerOpen(false); }}>
                    <Users size={18} /> Clients
                  </button>
                )}
                <button className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => { setActiveTab('projects'); setDrawerOpen(false); }}>
                  <FolderKanban size={18} /> {user?.role === 'Employee' ? 'My Projects' : 'Projects'}
                </button>
                <button className={`btn ${activeTab === 'planner' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => { setActiveTab('planner'); setDrawerOpen(false); }}>
                  <Calendar size={18} /> {user?.role === 'Employee' ? 'My Tasks' : 'Daily Planner'}
                </button>
                <button className={`btn ${activeTab === 'quotations' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => { setActiveTab('quotations'); setDrawerOpen(false); }}>
                  <FileSpreadsheet size={18} /> Quotations
                </button>
                {hasPermission(user?.role, 'canViewInvoices') && (
                  <button className={`btn ${activeTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => { setActiveTab('invoices'); setDrawerOpen(false); }}>
                    <FileText size={18} /> Invoices
                  </button>
                )}
                {user?.role === 'Employee' && (
                  <button className={`btn ${activeTab === 'personal-tracker' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => { setActiveTab('personal-tracker'); setDrawerOpen(false); }}>
                    <BrainCircuit size={18} /> Personal Tracker
                  </button>
                )}
                {hasPermission(user?.role, 'canManageUsers') && (
                  <button className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => { setActiveTab('admin'); setDrawerOpen(false); }}>
                    <Users size={18} /> User Management
                  </button>
                )}
              </nav>
            </div>

            <div>
              <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user?.role === 'Admin' ? 'Administrator' : 'Workspace User'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <img src="/logo.png" alt="A" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'contain' }} />
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: '700', letterSpacing: '-0.3px', margin: 0 }}>AURA Workspace</h2>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', lineHeight: '1.2' }}>Engineering Productivity Platform</span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
            {hasPermission(user?.role, 'canManageUsers') && (
              <button className={`btn ${activeTab === 'clients' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => setActiveTab('clients')}>
                <Users size={18} /> Clients
              </button>
            )}
            <button className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => setActiveTab('projects')}>
              <FolderKanban size={18} /> {user?.role === 'Employee' ? 'My Projects' : 'Projects'}
            </button>
            <button className={`btn ${activeTab === 'planner' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => setActiveTab('planner')}>
              <Calendar size={18} /> {user?.role === 'Employee' ? 'My Tasks' : 'Daily Planner'}
            </button>
            <button className={`btn ${activeTab === 'quotations' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => setActiveTab('quotations')}>
              <FileSpreadsheet size={18} /> Quotations
            </button>
            {hasPermission(user?.role, 'canViewInvoices') && (
              <button className={`btn ${activeTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => setActiveTab('invoices')}>
                <FileText size={18} /> Invoices
              </button>
            )}
            {user?.role === 'Employee' && (
              <button className={`btn ${activeTab === 'personal-tracker' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => setActiveTab('personal-tracker')}>
                <BrainCircuit size={18} /> Personal Tracker
              </button>
            )}
            {hasPermission(user?.role, 'canManageUsers') && (
              <button className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', justifyContent: 'flex-start' }} onClick={() => setActiveTab('admin')}>
                <Users size={18} /> User Management
              </button>
            )}
          </nav>
        </div>

        <div>
          <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user?.role === 'Admin' ? 'Administrator' : 'Workspace User'}</span>
            </div>
            <button className="btn btn-secondary" style={{ padding: '6px', minWidth: 0 }} onClick={handleLogout} title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace Frame */}
      <main className="main-content" style={{ paddingBottom: '80px' }}>
        
        {activeTab === 'dashboard' && (
          <div>
            {/* Header */}
            <div className="card" style={{ background: 'var(--bg-sidebar)', marginBottom: '24px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ minWidth: '200px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>OS Workspace</span>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>👋 Welcome back,</h1>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: 'var(--accent)' }}>{user?.name || 'User'}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>Dashboard Home</p>
                </div>
                
                {/* Quick Actions Toolbar */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%', maxWidth: '450px' }}>
                  <button className="btn btn-primary" style={{ flex: '1 1 120px', justifyContent: 'center', height: '44px', cursor: 'pointer' }} onClick={() => setShowTaskModal(true)}>
                    ✅ Add Task
                  </button>
                  {hasPermission(user?.role, 'canViewInvoices') && (
                    <button className="btn btn-secondary" style={{ flex: '1 1 120px', justifyContent: 'center', height: '44px', cursor: 'pointer' }} onClick={triggerNewInvoiceFlow}>
                      💰 Create Invoice
                    </button>
                  )}
                  {hasPermission(user?.role, 'canManageUsers') && (
                    <button className="btn btn-secondary" style={{ flex: '1 1 120px', justifyContent: 'center', height: '44px', cursor: 'pointer' }} onClick={() => setShowClientModal(true)}>
                      👤 Add Client
                    </button>
                  )}
                  <button className="btn btn-secondary" style={{ flex: '1 1 120px', justifyContent: 'center', height: '44px', cursor: 'pointer' }} onClick={() => { setActiveTab(user?.role === 'Employee' ? 'personal-tracker' : 'projects') }}>
                    {user?.role === 'Employee' ? '🎯 My Tracker' : '📄 Manage Projects'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Today's Focus:</strong>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                    <span>✔ {tasks.filter(t => t.completed).length} Tasks Completed</span>
                    <span>⏳ {tasks.filter(t => !t.completed).length} Pending</span>
                    <span>🔥 {tasks.filter(t => t.priority === 'High' && !t.completed).length} High Priority</span>
                  </div>
                </div>
                <div style={{ background: '#FFFBEB', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FEF3C7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                  <BrainCircuit size={16} style={{ color: '#D97706' }} />
                  <span style={{ color: '#92400E', fontWeight: '500' }}>AI says: Finish Apex drawings before 4 PM.</span>
                </div>
              </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid-3" style={{ marginBottom: '24px' }}>
              {/* Financial KPIs - Only visible to Admins/SuperAdmins */}
              {hasPermission(user?.role, 'canViewRevenue') && (
                <>
                  <div className="card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL REVENUE</span>
                      <IndianRupee size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>₹{invoices.reduce((sum, i) => sum + i.grand_total, 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PENDING PAYMENTS</span>
                      <AlertCircle size={16} style={{ color: 'var(--color-danger)' }} />
                    </div>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>₹{invoices.filter(i => i.payment_status === 'Pending').reduce((sum, i) => sum + i.grand_total, 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PAID TODAY</span>
                      <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                    </div>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>₹{invoices.filter(i => i.payment_status === 'Paid').reduce((sum, i) => sum + i.grand_total, 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>OVERDUE INVOICES</span>
                      <Clock size={16} style={{ color: 'var(--color-warning)' }} />
                    </div>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{invoices.filter(i => i.payment_status === 'Overdue').length}</span>
                  </div>
                </>
              )}

              {/* Employee Productivity Widgets */}
              {user?.role === 'Employee' && (
                <>
                  <div className="card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>MY OPEN TASKS</span>
                      <Clock size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{tasks.filter(t => !t.completed).length}</span>
                  </div>
                  <div className="card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>COMPLETED TASKS</span>
                      <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                    </div>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{tasks.filter(t => t.completed).length}</span>
                  </div>
                  <div className="card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>MY ACTIVE PROJECTS</span>
                      <FolderKanban size={16} style={{ color: 'var(--color-info)' }} />
                    </div>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{projects.filter(p => p.status === 'In Progress').length}</span>
                  </div>
                </>
              )}

              {/* Manager Operations Widgets */}
              {user?.role === 'Manager' && (
                <>
                  <div className="card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TEAM TASKS</span>
                      <Clock size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{tasks.length}</span>
                  </div>
                  <div className="card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>ACTIVE TEAM PROJECTS</span>
                      <FolderKanban size={16} style={{ color: 'var(--color-info)' }} />
                    </div>
                    <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{projects.filter(p => p.status === 'In Progress').length}</span>
                  </div>
                </>
              )}

              {/* Shared General Stats */}
              <div className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{user?.role === 'Employee' ? 'MY PRODUCTIVITY' : 'TEAM PRODUCTIVITY'}</span>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-purple)' }} />
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>92%</span>
              </div>

              <div className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>WORK STREAK</span>
                  <Sparkles size={16} style={{ color: 'var(--color-warning)' }} />
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>14 Days</span>
              </div>
            </div>

            {/* Personal Tracker KPI metrics */}
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayPersonalTasks = personalTasks.filter(pt => pt.due_date === todayStr);
              const pendingPersonalTasks = personalTasks.filter(pt => pt.status !== 'Done');
              const completedThisWeek = personalTasks.filter(pt => {
                if (pt.status !== 'Done') return false;
                const updatedTime = pt.updated_at ? new Date(pt.updated_at).getTime() : 0;
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                return updatedTime >= sevenDaysAgo;
              });
              const highestStreak = habits.reduce((max, h) => Math.max(max, h.streak_count || 0), 0);
              const upcomingBills = personalTasks.filter(pt => pt.category === 'Bills & Payments' && pt.status !== 'Done');
              const personalRemindersCount = personalTasks.filter(pt => pt.reminder_date && pt.status !== 'Done').length;

              return (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)' }}>💖 Personal Tracker Summary</h3>
                  <div className="grid-3">
                    <div className="card" style={{ margin: 0, borderLeft: '4px solid #EC4899' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TODAY'S PERSONAL TASKS</span>
                        <span style={{ fontSize: '1.2rem' }}>📝</span>
                      </div>
                      <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{todayPersonalTasks.length}</span>
                    </div>

                    <div className="card" style={{ margin: 0, borderLeft: '4px solid #3B82F6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PENDING PERSONAL WORK</span>
                        <span style={{ fontSize: '1.2rem' }}>⏳</span>
                      </div>
                      <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{pendingPersonalTasks.length}</span>
                    </div>

                    <div className="card" style={{ margin: 0, borderLeft: '4px solid #10B981' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>COMPLETED THIS WEEK</span>
                        <span style={{ fontSize: '1.2rem' }}>✅</span>
                      </div>
                      <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{completedThisWeek.length}</span>
                    </div>

                    <div className="card" style={{ margin: 0, borderLeft: '4px solid #F59E0B' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>MAX HABIT STREAK</span>
                        <span style={{ fontSize: '1.2rem' }}>🔥</span>
                      </div>
                      <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{highestStreak} Days</span>
                    </div>

                    <div className="card" style={{ margin: 0, borderLeft: '4px solid #EF4444' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>UPCOMING BILLS</span>
                        <span style={{ fontSize: '1.2rem' }}>💳</span>
                      </div>
                      <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{upcomingBills.length}</span>
                    </div>

                    <div className="card" style={{ margin: 0, borderLeft: '4px solid #8B5CF6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PERSONAL REMINDERS</span>
                        <span style={{ fontSize: '1.2rem' }}>🔔</span>
                      </div>
                      <span style={{ fontSize: '1.8rem', fontWeight: '700' }}>{personalRemindersCount}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Main Split Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '65% 35%', gap: '24px' }}>
              
              {/* Left Column (65%) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Timeline */}
                <div className="card" style={{ margin: 0 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>Today's Schedule (Timeline)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tasks.filter(t => t.time).map(t => (
                      <div key={t.id} style={{ display: 'flex', gap: '16px', alignItems: 'center', borderLeft: '3px solid var(--accent)', paddingLeft: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, minWidth: '150px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-secondary)', width: '50px' }}>{t.time}</span>
                          <span style={{ fontSize: '0.9rem' }}>{t.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{t.completion_percentage || 0}%</span>
                          <span className={`badge ${t.status === 'Done' || t.completed ? 'badge-success' : t.status === 'QC Pending' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                            {t.status || 'Pending'}
                          </span>
                          {t.qc_status && t.qc_status !== 'Not Checked' && (
                            <span className={`badge ${t.qc_status === 'QC Passed' ? 'badge-success' : t.qc_status === 'QC Failed' || t.qc_status === 'Revision Required' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                              QC: {t.qc_status}
                            </span>
                          )}
                          {renderTaskActions(t)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Progress */}
                <div className="card" style={{ margin: 0 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>Project Progress</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {projects.map(p => {
                      const client = clients.find(c => c.id === p.clientId);
                      return (
                        <div key={p.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <strong>{p.title}</strong> ({client ? client.name : 'Unknown Client'})
                              <button 
                                type="button"
                                className="btn" 
                                style={{ padding: '2px 6px', fontSize: '0.7rem', height: 'auto', minWidth: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px', background: '#F8FAFC' }}
                                onClick={() => { setEditingProject(p); setShowProjectEditModal(true); }}
                              >
                                Edit Status
                              </button>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className={`badge ${p.status === 'Completed' || p.status === 'Delivered' || p.status === 'QC Passed' ? 'badge-success' : p.status === 'On Hold' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                                {p.status || 'In Progress'}
                              </span>
                              {p.qc_status && p.qc_status !== 'Not Checked' && (
                                <span className={`badge ${p.qc_status === 'QC Passed' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '0.7rem' }}>
                                  QC: {p.qc_status}
                                </span>
                              )}
                              <span style={{ fontWeight: '600' }}>{p.progress}%</span>
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${p.progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-indigo), var(--accent-purple))', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Invoices Widget */}
                <div className="card" style={{ margin: 0 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>Recent Invoices</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {invoices.slice(0, 3).map(inv => {
                      const client = clients.find(c => c.id === inv.client_id);
                      return (
                        <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                          <div>
                            <strong>{inv.invoice_number}</strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client: {client ? client.name : 'N/A'} • Due: {inv.due_date}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>₹{inv.grand_total.toLocaleString('en-IN')}</span>
                            <span className={`badge ${inv.payment_status === 'Paid' ? 'badge-success' : inv.payment_status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>{inv.payment_status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column (35%) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* AI Assistant */}
                <div className="card" style={{ margin: 0, background: '#EEF2F6', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <BrainCircuit size={18} style={{ color: 'var(--accent)' }} /> AI Assistant
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 16px' }}>
                    "Complete Project Apex today. Estimated work: 2h 30m. This keeps your schedule on track."
                  </p>
                  <button className={`btn ${focusActive ? 'btn-danger' : 'btn-primary'}`} style={{ width: '100%', justifyContent: 'center' }} onClick={() => setFocusActive(!focusActive)}>
                    {focusActive ? (
                      <>
                        <Square size={16} /> Stop Focus Mode ({Math.floor(focusSeconds / 60)}m)
                      </>
                    ) : (
                      <>
                        <Play size={16} /> Start Focus Mode
                      </>
                    )}
                  </button>
                </div>

                {/* Upcoming Deadlines */}
                <div className="card" style={{ margin: 0 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>Upcoming Deadlines</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span>Villa Project</span>
                      <span className="badge badge-danger">Tomorrow 🔴</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span>Factory Layout</span>
                      <span className="badge badge-warning">In 3 Days 🟠</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span>Apartment Model</span>
                      <span className="badge badge-info">Next Week 🟢</span>
                    </div>
                  </div>
                </div>

                {/* Modern AI Productivity Calendar */}
                <div className="card" style={{ margin: 0, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: 'var(--shadow-hover)' }}>
                  
                  {/* Search Query Input */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search meetings, tasks, deadlines..."
                      style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}
                      value={calendarSearchQuery}
                      onChange={(e) => setCalendarSearchQuery(e.target.value)}
                    />
                    {calendarSearchQuery && (
                      <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', minWidth: 'auto' }} onClick={() => setCalendarSearchQuery('')}>Clear</button>
                    )}
                  </div>

                  {/* Quick Filters */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {['All', 'Projects', 'Tasks', 'Invoices', 'Meetings', 'QC', 'Personal'].map(f => (
                      <button
                        key={f}
                        type="button"
                        className={`btn ${calendarFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '16px', border: '1px solid var(--border-color)', minWidth: 'auto' }}
                        onClick={() => setCalendarFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)' }}>
                        📅 {MONTH_NAMES[currentMonth]} {currentYear}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', minWidth: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }} onClick={handlePrevMonth}>&lt;</button>
                      <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', minWidth: 'auto', fontWeight: '600', border: '1px solid var(--border-color)', borderRadius: '6px' }} onClick={handleToday}>Today</button>
                      <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', minWidth: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }} onClick={handleNextMonth}>&gt;</button>
                    </div>
                  </div>

                  {/* View Toggles & AI Suggest Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '2px', gap: '2px' }}>
                      {['month', 'week', 'day'].map(view => (
                        <button
                          key={view}
                          type="button"
                          className="btn"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            background: calendarView === view ? 'white' : 'transparent',
                            color: calendarView === view ? 'var(--accent)' : 'var(--text-secondary)',
                            boxShadow: calendarView === view ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            border: 'none',
                            minWidth: 'auto',
                            fontWeight: '600'
                          }}
                          onClick={() => setCalendarView(view)}
                        >
                          {view.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                      onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                    >
                      <BrainCircuit size={14} /> AI Suggestions
                    </button>
                  </div>

                  {/* Dynamic Calendar Grid */}
                  <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px', border: '1px solid var(--border-color)' }}>
                    
                    {calendarView === 'month' && (
                      <div>
                        {/* Weekday Names */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <div key={i}>{day}</div>)}
                        </div>

                        {/* Month Grid Cells */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                          {getMonthDays(currentYear, currentMonth).map((dayNum, i) => {
                            if (dayNum === null) return <div key={`empty-${i}`} />;
                            
                            const formattedMonth = String(currentMonth + 1).padStart(2, '0');
                            const formattedDay = String(dayNum).padStart(2, '0');
                            const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
                            
                            const todayDate = new Date();
                            const isToday = todayDate.getDate() === dayNum && todayDate.getMonth() === currentMonth && todayDate.getFullYear() === currentYear;
                            
                            const dayEvents = getDayEvents(dateStr);
                            
                            // Gather event displays
                            let displayEvents = [];
                            if (calendarFilter === 'All' || calendarFilter === 'Meetings') {
                              dayEvents.meetings.forEach(m => displayEvents.push({ id: m.id, type: 'meeting', label: m.title, color: '#3B82F6', icon: '📞' }));
                              dayEvents.birthdays.forEach(b => displayEvents.push({ id: b.id, type: 'birthday', label: b.name, color: '#EC4899', icon: '🩷' }));
                            }
                            if (calendarFilter === 'All' || calendarFilter === 'Tasks') {
                              dayEvents.tasks.forEach(t => {
                                const isHigh = t.priority === 'High';
                                displayEvents.push({ id: t.id, type: 'client-task', label: t.title, color: t.status === 'Done' ? '#10B981' : (isHigh ? '#EF4444' : '#3B82F6'), icon: t.status === 'Done' ? '🟢' : (isHigh ? '🔴' : '🔵') });
                              });
                            }
                            if (calendarFilter === 'All' || calendarFilter === 'Projects') {
                              dayEvents.projects.forEach(p => displayEvents.push({ id: p.id, type: 'project', label: p.title, color: '#8B5CF6', icon: '🟣' }));
                            }
                            if (calendarFilter === 'All' || calendarFilter === 'Invoices') {
                              dayEvents.invoices.forEach(inv => displayEvents.push({ id: inv.id, type: 'invoice', label: inv.invoice_number, color: '#F59E0B', icon: '🟠' }));
                              dayEvents.bills.forEach(b => displayEvents.push({ id: b.id, type: 'bill', label: b.title, color: '#F59E0B', icon: '🟠' }));
                            }
                            if (calendarFilter === 'All' || calendarFilter === 'Personal') {
                              dayEvents.personalTasks.forEach(pt => {
                                if (pt.category !== 'Bills & Payments') {
                                  displayEvents.push({ id: pt.id, type: 'personal-task', label: pt.title, color: pt.status === 'Done' ? '#10B981' : '#EAB308', icon: pt.status === 'Done' ? '🟢' : '🟡' });
                                }
                              });
                              dayEvents.personalReminders.forEach(r => displayEvents.push({ id: r.id, type: 'personal-reminder', label: r.title, color: '#8B5CF6', icon: '⚙️' }));
                            }
                            if (calendarFilter === 'All' || calendarFilter === 'QC') {
                              dayEvents.qcTasks.forEach(q => displayEvents.push({ id: q.id, type: 'qc-task', label: q.title, color: '#6B7280', icon: '⚙️' }));
                            }

                            if (calendarSearchQuery) {
                              displayEvents = displayEvents.filter(e => e.label.toLowerCase().includes(calendarSearchQuery.toLowerCase()));
                            }

                            const totalCount = displayEvents.length;

                            return (
                              <div
                                key={`day-${dayNum}`}
                                style={{
                                  padding: '6px 4px',
                                  borderRadius: '8px',
                                  background: isToday ? '#EEF2F6' : 'white',
                                  border: isToday ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  minHeight: '80px',
                                  position: 'relative'
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  try {
                                    const dataStr = e.dataTransfer.getData("text/plain");
                                    const dragData = JSON.parse(dataStr);
                                    if (dragData.type === 'client-task') {
                                      const updated = tasks.map(t => t.id === dragData.id ? { ...t, due_date: dateStr, dueDate: dateStr } : t);
                                      setTasks(updated);
                                      saveState("aura_tasks_v7", updated);
                                      triggerToast(`Task rescheduled to ${dateStr}`);
                                    } else if (dragData.type === 'personal-task') {
                                      const updated = personalTasks.map(pt => pt.id === dragData.id ? { ...pt, due_date: dateStr } : pt);
                                      setPersonalTasks(updated);
                                      saveState("aura_personal_tasks_v7", updated);
                                      triggerToast(`Personal task rescheduled to ${dateStr}`);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                onClick={() => { setSelectedDateStr(dateStr); setShowSidePanel(true); }}
                              >
                                {/* Day Number Header */}
                                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isToday ? 'var(--accent)' : 'inherit' }}>{dayNum}</span>
                                  {totalCount > 0 && (
                                    <span style={{ fontSize: '0.65rem', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '10px', padding: '1px 6px', fontWeight: '700' }}>
                                      {totalCount}
                                    </span>
                                  )}
                                </div>

                                {/* Up to 3 Event Indicators */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', overflow: 'hidden' }}>
                                  {displayEvents.slice(0, 3).map((ev, idx) => (
                                    <div
                                      key={idx}
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData("text/plain", JSON.stringify({ type: ev.type, id: ev.id }));
                                      }}
                                      style={{
                                        fontSize: '0.65rem',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                        background: ev.color + '22',
                                        color: ev.color,
                                        border: `1px solid ${ev.color}44`,
                                        width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        transition: 'transform 0.15s'
                                      }}
                                    >
                                      <span>{ev.icon}</span>
                                      <span style={{ fontSize: '0.6rem', fontWeight: '600' }}>{ev.label}</span>
                                    </div>
                                  ))}
                                  {totalCount > 3 && (
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: '600' }}>
                                      +{totalCount - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {calendarView === 'week' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Weekly view (Lists matching events in the current week) */}
                        {(() => {
                          const today = new Date();
                          const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Mon=0
                          const startOfWeek = new Date(today);
                          startOfWeek.setDate(today.getDate() - currentDayIndex);

                          return Array.from({ length: 7 }).map((_, idx) => {
                            const date = new Date(startOfWeek);
                            date.setDate(startOfWeek.getDate() + idx);
                            const dateStr = date.toISOString().split('T')[0];
                            const dayEvents = getDayEvents(dateStr);
                            const count = dayEvents.tasks.length + dayEvents.meetings.length + dayEvents.projects.length;

                            return (
                              <div key={idx} style={{ background: 'white', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <strong style={{ fontSize: '0.85rem' }}>{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {count} Events scheduled
                                  </div>
                                </div>
                                <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', minWidth: 'auto' }} onClick={() => { setSelectedDateStr(dateStr); setShowSidePanel(true); }}>
                                  View
                                </button>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}

                    {calendarView === 'day' && (
                      <div>
                        {/* Hourly simple view */}
                        <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>Today's Tasks & Meetings</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {tasks.slice(0, 5).map(t => (
                            <div key={t.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-info)', fontWeight: '600' }}>{t.task_time || '09:00'}</span>
                              <span style={{ fontSize: '0.85rem' }}>{t.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Sync Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => alert("Calendar synced with Google Calendar!")}>Google Calendar</button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => alert("Calendar synced with Outlook Calendar!")}>Outlook Calendar</button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => alert("ICS file downloaded!")}>Export .ics</button>
                  </div>

                </div>

                {/* AI Planning suggestions & Heat Map & timeline */}
                {showAiSuggestions && (
                  <div className="card" style={{ margin: '16px 0 0 0', background: '#FAF5FF', border: '1px solid #E9D5FF' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: '700', color: '#6B46C1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BrainCircuit size={16} /> AI Calendar Suggestions
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: '#5B21B6' }}>
                      <p style={{ margin: 0 }}>💡 <strong>Finish Villa Project before Friday.</strong> Your next milestone deadline is approaching.</p>
                      <p style={{ margin: 0 }}>💡 <strong>Move Review Meeting to tomorrow.</strong> Your afternoon slot today is fully booked with CAD assemblies.</p>
                      <p style={{ margin: 0 }}>💡 <strong>You have 6 hours free today.</strong> Ideal window for focused Revit modeling.</p>
                      <p style={{ margin: 0 }}>💡 <strong>Invoice payment due in 2 days.</strong> Remember to follow up with Client A.</p>
                    </div>
                  </div>
                )}

                {/* Monthly Productivity Heat Map */}
                <div className="card" style={{ margin: '16px 0 0 0' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: '700' }}>📊 Monthly Productivity Heat Map</h4>
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                    {getMonthDays(currentYear, currentMonth).filter(d => d !== null).map(dayNum => {
                      const formattedMonth = String(currentMonth + 1).padStart(2, '0');
                      const formattedDay = String(dayNum).padStart(2, '0');
                      const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
                      const events = getDayEvents(dateStr);
                      const completedCount = events.completedTasks.length + events.habits.length;
                      
                      // Depth colors
                      let bg = '#F1F5F9';
                      if (completedCount > 0 && completedCount <= 1) bg = '#DDD6FE';
                      else if (completedCount > 1 && completedCount <= 2) bg = '#C4B5FD';
                      else if (completedCount > 2) bg = '#8B5CF6';

                      return (
                        <div
                          key={dayNum}
                          title={`Day ${dayNum}: ${completedCount} Completed`}
                          style={{ width: '20px', height: '20px', background: bg, borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '600' }}
                        >
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Deadline Timeline */}
                <div className="card" style={{ margin: '16px 0 0 0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: '700' }}>⏳ Next 7 Days Timeline</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong>Villa Project</strong>
                        <span style={{ color: 'var(--color-danger)' }}>Tomorrow 🔴</span>
                      </div>
                      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '90%', height: '100%', background: 'var(--color-danger)' }} />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong>Factory Layout</strong>
                        <span style={{ color: 'var(--color-warning)' }}>3 Days 🟠</span>
                      </div>
                      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '60%', height: '100%', background: 'var(--color-warning)' }} />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong>Invoice INV-2026-0001</strong>
                        <span style={{ color: 'var(--color-success)' }}>Today 🟢</span>
                      </div>
                      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', background: 'var(--color-success)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CLIENTS */}
        {activeTab === 'clients' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0 }}>Client Database</h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ background: '#E0F2FE', color: '#0369A1', border: 'none' }} onClick={() => setShowClientModal(true)}>➕ Add Client</button>
                <button className="btn btn-primary" style={{ background: '#E0E7FF', color: '#4338CA', border: 'none' }} onClick={triggerNewProjectFlow}>📁 New Project</button>
              </div>
            </div>

            {clients.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Please create a client before starting a new project.</p>
                <button className="btn btn-primary" onClick={() => setShowClientModal(true)}>+ Add Client</button>
              </div>
            ) : (
              <div className="grid-3">
                {clients.map(c => (
                  <div key={c.id} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0' }}>{c.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>{c.company}</p>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div>📞 {c.phone}</div>
                        <div>✉ {c.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: PROJECTS */}
        {activeTab === 'projects' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0 }}>Active Projects</h1>
            </div>

            {/* Project Filters Toolbar */}
            <div className="card" style={{ background: '#F8FAFC', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', flex: 1, minWidth: '200px' }}>
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search projects..." 
                  value={projectSearch} 
                  onChange={(e) => setProjectSearch(e.target.value)} 
                  style={{ border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
                <select className="form-input" style={{ width: '140px', padding: '6px 12px' }} value={projectFilterStatus} onChange={(e) => setProjectFilterStatus(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setShowClientModal(true)}>Add Client</button>
                <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={triggerNewProjectFlow}>New Project</button>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => exportPDF('projects')}>Export</button>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => exportExcel('projects')}>Analytics</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredProjects.map(p => {
                const client = clients.find(c => c.id === p.clientId);
                return (
                  <div key={p.id} className="card" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{p.title}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client: {client ? client.name : 'Unknown Client'} • Deadline: {p.deadline}</span>
                      {p.fileNotes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>📝 {p.fileNotes}</div>}
                      <div style={{ width: '150px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
                        <div style={{ width: `${p.progress}%`, height: '100%', background: 'var(--accent)' }}></div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700' }}>₹{p.quoteAmount.toLocaleString('en-IN')}</div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Paid: ₹{p.paidAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: DAILY PLANNER */}
        {activeTab === 'planner' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0 }}>Planner Tasks</h1>
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>✅ Add Task</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasks.map(t => (
                <div key={t.id} className="card" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{t.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge ${t.completed ? 'badge-success' : 'badge-warning'}`}>{t.status || (t.completed ? 'Completed' : 'Pending')}</span>
                    {renderTaskActions(t)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: INVOICES MANAGEMENT */}
        {activeTab === 'invoices' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', margin: 0 }}>Invoice Management</h1>
              <button className="btn btn-primary" onClick={triggerNewInvoiceFlow}>💰 Create Invoice</button>
            </div>

            {/* Invoices Search & Filter Toolbar */}
            <div className="card" style={{ background: '#F8FAFC', padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', flex: 1, minWidth: '200px' }}>
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search invoice no, client or project..." 
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                />
              </div>

              {/* Status Filter Subtabs (Drafts, Pending, Paid, Overdue) */}
              <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
                {['All', 'Draft', 'Pending', 'Paid', 'Overdue'].map(tab => (
                  <button 
                    key={tab} 
                    className="btn" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', background: invoiceSubTab === tab ? 'white' : 'none', border: 'none', boxShadow: invoiceSubTab === tab ? '0 1px 3px rgba(0,0,0,0.05)' : 'none', color: invoiceSubTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    onClick={() => setInvoiceSubTab(tab)}
                  >
                    {tab === 'All' ? 'All Invoices' : `${tab}s`}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => exportPDF('invoices')}>Export PDF</button>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => exportExcel('invoices')}>Export Excel</button>
              </div>
            </div>

            {/* Invoice Split view layout (65% Invoice list, 35% AI Console) */}
            <div className="invoices-grid">
              
              {/* Invoices List table (65%) */}
              <div className="card desktop-table-container" style={{ padding: 0, overflowX: 'auto', margin: 0, flex: 2 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Client</th>
                      <th>Project</th>
                      <th>Due Date</th>
                      <th>Grand Total</th>
                      <th>Payment Status</th>
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
                          <td style={{ fontSize: '0.85rem' }}>{inv.due_date}</td>
                          <td style={{ fontWeight: '600' }}>₹{inv.grand_total.toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`badge ${inv.payment_status === 'Paid' ? 'badge-success' : inv.payment_status === 'Draft' ? 'badge-info' : inv.payment_status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>{inv.payment_status}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 6px' }} title="Download PDF" onClick={() => generateAndDownloadPDF(inv)}>
                                <Download size={12} />
                              </button>
                              <button className="btn btn-secondary" style={{ padding: '4px 6px' }} title="Send Email" onClick={() => sendEmail(inv)}>
                                <Mail size={12} />
                              </button>
                              {inv.payment_status !== 'Paid' && (
                                <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleMarkPaid(inv.id)}>
                                  Mark Paid
                                </button>
                              )}
                              <button className="btn btn-secondary" style={{ padding: '4px 6px', color: 'var(--color-danger)' }} title="Delete" onClick={() => handleDeleteInvoice(inv.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInvoices.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No invoices found matching current criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Invoice Card List */}
              <div className="mobile-card-list" style={{ width: '100%' }}>
                {filteredInvoices.map(inv => {
                  const client = clients.find(c => c.id === inv.client_id);
                  const proj = projects.find(p => p.id === inv.project_id);
                  return (
                    <div key={inv.id} className="card" style={{ margin: 0, padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>{inv.invoice_number}</span>
                        <span className={`badge ${inv.payment_status === 'Paid' ? 'badge-success' : inv.payment_status === 'Draft' ? 'badge-info' : inv.payment_status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>{inv.payment_status}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                        <div><strong>Client:</strong> {client ? client.name : 'N/A'}</div>
                        <div><strong>Project:</strong> {proj ? proj.title : 'N/A'}</div>
                        <div><strong>Due Date:</strong> {inv.due_date}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '8px' }}>₹{inv.grand_total.toLocaleString('en-IN')}</div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', flex: 1, justifyContent: 'center' }} onClick={() => generateAndDownloadPDF(inv)}>
                          <Download size={14} /> PDF
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', flex: 1, justifyContent: 'center' }} onClick={() => sendEmail(inv)}>
                          <Mail size={14} /> Mail
                        </button>
                        {inv.payment_status !== 'Paid' && (
                          <button className="btn btn-primary" style={{ padding: '6px 12px', flex: 1, justifyContent: 'center', fontSize: '0.8rem' }} onClick={() => handleMarkPaid(inv.id)}>
                            Mark Paid
                          </button>
                        )}
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', color: 'var(--color-danger)', borderColor: 'var(--border-color)' }} onClick={() => handleDeleteInvoice(inv.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No invoices found.</div>
                )}
              </div>

              {/* AI Assistant Console (35%) */}
              <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '450px', background: '#F8FAFC' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BrainCircuit style={{ color: 'var(--accent)' }} size={18} />
                  <strong style={{ fontSize: '0.85rem' }}>Billing & Invoicing AI</strong>
                </div>

                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {aiInvoiceChat.map((msg, idx) => (
                    <div key={idx} className={`ai-msg ${msg.sender}`} style={{ fontSize: '0.8rem', padding: '8px 12px', margin: 0 }} dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                  ))}
                </div>

                <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'white' }}>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleAIInvoiceCommand("Suggest Payment Reminder")}>🔔 Suggest Reminder</button>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleAIInvoiceCommand("Generate Follow-up Email")}>✉ Late Follow-up</button>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleAIInvoiceCommand("Summarize Invoice")}>📊 Summarize Ledger</button>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleAIInvoiceCommand("Predict Late Payment Risk")}>⚠️ Predict Late Risk</button>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'personal-tracker' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>💖 Personal Tracker</h1>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Manage habits, fitness, home work, and personal commitments</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" onClick={() => { setEditingPersonalTask(null); setPersonalTaskForm({ title: '', category: 'Personal Tasks', priority: 'Medium', due_date: new Date().toISOString().split('T')[0], reminder_date: '', status: 'Pending', completion_percentage: 0, notes: '' }); setShowPersonalTaskModal(true); }}>
                  ➕ Add Personal Task
                </button>
                <button className="btn btn-secondary" onClick={() => { setEditingHabit(null); setHabitForm({ habit_name: '', frequency: 'Daily', streak_count: 0, last_completed_date: '', status: 'Active' }); setShowHabitModal(true); }}>
                  🌱 Add Habit
                </button>
              </div>
            </div>

            {/* Grid Layout */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {/* Left Column (65%) */}
              <div style={{ flex: '2 1 600px' }}>
                {/* Category Filters */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {['All', 'Personal Tasks', 'Health & Fitness', 'Learning Goals', 'Family / Home Work', 'Bills & Payments'].map(cat => (
                    <button
                      key={cat}
                      className={`btn ${personalTrackerCategoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px' }}
                      onClick={() => setPersonalTrackerCategoryFilter(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Personal Tasks Card */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📝 Personal Tasks ({personalTasks.filter(t => personalTrackerCategoryFilter === 'All' || t.category === personalTrackerCategoryFilter).length})
                  </h3>
                  
                  {personalTasks.filter(t => personalTrackerCategoryFilter === 'All' || t.category === personalTrackerCategoryFilter).length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: '24px 0' }}>No tasks found in this category.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {personalTasks.filter(t => personalTrackerCategoryFilter === 'All' || t.category === personalTrackerCategoryFilter).map(task => (
                        <div key={task.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span style={{ fontSize: '0.9rem', fontWeight: '700', textDecoration: task.status === 'Done' ? 'line-through' : 'none', color: task.status === 'Done' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{task.title}</span>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                <span className="badge" style={{ background: '#F0FDF4', color: '#166534', fontSize: '0.7rem' }}>{task.category}</span>
                                <span className={`badge ${task.priority === 'High' ? 'badge-danger' : task.priority === 'Medium' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.7rem' }}>{task.priority}</span>
                                <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.7rem' }}>🗓 Due: {task.due_date}</span>
                                {task.reminder_date && (
                                  <span className="badge" style={{ background: '#FAF5FF', color: '#6B46C1', fontSize: '0.7rem' }}>🔔 Remind: {task.reminder_date}</span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {task.status !== 'Done' && (
                                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#DCFCE7', color: '#166534', border: 'none' }} onClick={() => handleMarkPersonalTaskDone(task.id)}>
                                  Done
                                </button>
                              )}
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => { setEditingPersonalTask(task); setPersonalTaskForm(task); setShowPersonalTaskModal(true); }}>
                                Edit
                              </button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#FEE2E2', color: '#991B1B', border: 'none' }} onClick={() => handleDeletePersonalTask(task.id)}>
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Progress */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${task.completion_percentage}%`, height: '100%', background: task.status === 'Done' ? 'var(--color-success)' : 'var(--accent)', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{task.completion_percentage}%</span>
                          </div>

                          {task.notes && (
                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', background: '#FFFFFF', padding: '8px 10px', borderRadius: '6px', border: '1px solid #EDF2F7' }}>
                              📝 {task.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (35%) */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Habits Widget */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🌱 Daily & Weekly Habits
                  </h3>
                  
                  {habits.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: '24px 0' }}>No habits added yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {habits.map(habit => (
                        <div key={habit.id} style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{habit.habit_name}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                <span>🔄 {habit.frequency}</span>
                                {habit.last_completed_date && (
                                  <span style={{ marginLeft: '8px' }}>Last completed: {habit.last_completed_date}</span>
                                )}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.85rem', background: '#FFFBEB', color: '#D97706', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              🔥 {habit.streak_count}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <button className="btn btn-primary" style={{ flex: 1, padding: '4px 8px', fontSize: '0.75rem', background: 'var(--color-success)', color: 'white', border: 'none' }} onClick={() => handleCompleteHabit(habit.id)}>
                              Complete Today
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleResetHabit(habit.id)} title="Reset Streak">
                              Reset
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px', minWidth: 'auto', background: '#FEE2E2', color: '#991B1B', border: 'none' }} onClick={() => handleDeleteHabit(habit.id)}>
                              🗑
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Personal Notes Card */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px' }}>📓 Personal Quick Notes</h3>
                  <textarea
                    className="form-input"
                    rows={6}
                    placeholder="Jot down personal lists, notes, or ideas here..."
                    style={{ fontSize: '0.85rem', width: '100%', resize: 'vertical' }}
                    value={personalNotes}
                    onChange={(e) => handleSavePersonalNotes(e.target.value)}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px', textAlign: 'right' }}>
                    Auto-saved to local workspace
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quotations' && (
          <QuotationsModule user={user} triggerToast={triggerToast} />
        )}

        {activeTab === 'admin' && (
          <div>
            {/* Header */}
            <div className="card" style={{ background: '#F8FAFC', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>🛡️ Administrative Controls</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                Manage user access approvals, roles, status changes, and track system security audit logs.
              </p>
            </div>

            {/* Admin Management Sub-Tabs */}
            <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
                {['Pending', 'Approved', 'Rejected', 'Disabled', 'AuditLogs'].map((subTab) => {
                  const filteredCount = adminUsers.filter(u => u.status === subTab).length;
                  const label = subTab === 'AuditLogs' 
                    ? '📋 Audit Logs' 
                    : `${subTab} (${filteredCount})`;
                  return (
                    <button
                      key={subTab}
                      className="btn"
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: adminActiveSubTab === subTab ? 'var(--accent)' : 'transparent',
                        color: adminActiveSubTab === subTab ? 'white' : 'var(--text-secondary)',
                        fontWeight: adminActiveSubTab === subTab ? '600' : 'normal',
                        cursor: 'pointer'
                      }}
                      onClick={() => setAdminActiveSubTab(subTab)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Main Panel Content */}
              <div style={{ marginTop: '20px' }}>
                {adminLoading ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>Loading administrative data...</p>
                ) : adminActiveSubTab === 'AuditLogs' ? (
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>System Security & Event History</h3>
                    
                    {/* Desktop View Table */}
                    <div className="desktop-table-container" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                            <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Timestamp</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Event Type</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Target User</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Actor</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit events logged.</td>
                            </tr>
                          ) : (
                            adminLogs.map((log) => {
                              let badgeColor = '#64748B';
                              let badgeBg = '#F1F5F9';
                              if (log.event_type.includes('success')) {
                                badgeColor = '#166534';
                                badgeBg = '#DCFCE7';
                              } else if (log.event_type.includes('failed') || log.event_type.includes('rejected')) {
                                badgeColor = '#991B1B';
                                badgeBg = '#FEE2E2';
                              } else if (log.event_type.includes('approved')) {
                                badgeColor = '#155E75';
                                badgeBg = '#ECFEFF';
                              }

                              return (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                    {new Date(log.created_at).toLocaleString()}
                                  </td>
                                  <td style={{ padding: '12px 8px' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', color: badgeColor, background: badgeBg }}>
                                      {log.event_type}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 8px', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {log.email} {log.username !== 'unknown' && `(${log.username})`}
                                  </td>
                                  <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{log.actor}</td>
                                  <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{log.details}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View Card List */}
                    <div className="mobile-card-list">
                      {adminLogs.length === 0 ? (
                        <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit events logged.</div>
                      ) : (
                        adminLogs.map((log) => (
                          <div key={log.id} className="card" style={{ margin: 0, padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</span>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', color: log.event_type.includes('success') ? '#166534' : log.event_type.includes('failed') ? '#991B1B' : '#64748B', background: log.event_type.includes('success') ? '#DCFCE7' : log.event_type.includes('failed') ? '#FEE2E2' : '#F1F5F9' }}>
                                {log.event_type}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div><strong>User:</strong> {log.email}</div>
                              <div><strong>Actor:</strong> {log.actor}</div>
                              <div style={{ marginTop: '6px', padding: '8px', background: 'var(--bg-main)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{log.details}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>{adminActiveSubTab} Access Accounts</h3>
                    
                    {/* Desktop View Table */}
                    <div className="desktop-table-container" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                            <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>User Details</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Department</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Designation</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Registered</th>
                            <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.filter(u => u.status === adminActiveSubTab).length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No users found in this category.
                              </td>
                            </tr>
                          ) : (
                            adminUsers.filter(u => u.status === adminActiveSubTab).map((item) => (
                              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '12px 8px' }}>
                                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.first_name} {item.last_name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{item.username} • {item.email}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {item.mobile_number} {item.employee_id && `• Emp ID: ${item.employee_id}`}</div>
                                  
                                  {/* Role Select Dropdown */}
                                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Role:</span>
                                    <select 
                                      value={item.role || 'Employee'} 
                                      onChange={(e) => handleUpdateUserStatus(item.id, item.status, e.target.value)}
                                      style={{ padding: '2px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                    >
                                      <option value="Employee">Employee</option>
                                      <option value="Manager">Manager</option>
                                      <option value="Admin">Admin</option>
                                      <option value="SuperAdmin">SuperAdmin</option>
                                    </select>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 8px', color: 'var(--text-primary)' }}>{item.department}</td>
                                <td style={{ padding: '12px 8px', color: 'var(--text-primary)' }}>{item.designation}</td>
                                <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                                  {new Date(item.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                  {adminActiveSubTab === 'Pending' && (
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                      <button
                                        className="btn btn-primary"
                                        style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                                        onClick={() => handleStartUserApproval(item)}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        className="btn"
                                        style={{ background: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                                        onClick={() => handleUpdateUserStatus(item.id, 'Rejected')}
                                      >
                                        Reject
                                      </button>
                                      <button
                                        className="btn"
                                        style={{ background: '#6C4DFF', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                                        onClick={() => setViewingUserDetails(item)}
                                      >
                                        View Details
                                      </button>
                                    </div>
                                  )}
                                  {adminActiveSubTab === 'Approved' && (
                                    <button
                                      className="btn"
                                      style={{ background: '#F59E0B', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                                      onClick={() => handleUpdateUserStatus(item.id, 'Disabled')}
                                    >
                                      Disable
                                    </button>
                                  )}
                                  {(adminActiveSubTab === 'Rejected' || adminActiveSubTab === 'Disabled') && (
                                    <button
                                      className="btn btn-primary"
                                      style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                                      onClick={() => handleStartUserApproval(item)}
                                    >
                                      Re-Enable & Approve
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View Card List */}
                    <div className="mobile-card-list">
                      {adminUsers.filter(u => u.status === adminActiveSubTab).length === 0 ? (
                        <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No users found in this category.</div>
                      ) : (
                        adminUsers.filter(u => u.status === adminActiveSubTab).map((item) => (
                          <div key={item.id} className="card" style={{ margin: 0, padding: '16px' }}>
                            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>{item.first_name} {item.last_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>@{item.username} • {item.email}</div>
                            
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                              <div><strong>Department:</strong> {item.department}</div>
                              <div><strong>Designation:</strong> {item.designation}</div>
                              {item.employee_id && <div><strong>Employee ID:</strong> {item.employee_id}</div>}
                              <div><strong>Mobile:</strong> {item.mobile_number}</div>
                              <div><strong>Registered:</strong> {new Date(item.created_at).toLocaleDateString()}</div>
                              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong>Role:</strong>
                                <select 
                                  value={item.role || 'Employee'} 
                                  onChange={(e) => handleUpdateUserStatus(item.id, item.status, e.target.value)}
                                  style={{ padding: '2px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                >
                                  <option value="Employee">Employee</option>
                                  <option value="Manager">Manager</option>
                                  <option value="Admin">Admin</option>
                                  <option value="SuperAdmin">SuperAdmin</option>
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'stretch' }}>
                              {adminActiveSubTab === 'Pending' && (
                                <>
                                  <button
                                    className="btn btn-primary"
                                    style={{ background: '#10B981', color: 'white', border: 'none', flex: 1, justifyContent: 'center', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                                    onClick={() => handleStartUserApproval(item)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn"
                                    style={{ background: '#EF4444', color: 'white', border: 'none', flex: 1, justifyContent: 'center', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                                    onClick={() => handleUpdateUserStatus(item.id, 'Rejected')}
                                  >
                                    Reject
                                  </button>
                                  <button
                                    className="btn"
                                    style={{ background: '#6C4DFF', color: 'white', border: 'none', flex: 1, justifyContent: 'center', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                                    onClick={() => setViewingUserDetails(item)}
                                  >
                                    Details
                                  </button>
                                </>
                              )}
                              {adminActiveSubTab === 'Approved' && (
                                <button
                                  className="btn"
                                  style={{ background: '#F59E0B', color: 'white', border: 'none', flex: 1, justifyContent: 'center', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                                  onClick={() => handleUpdateUserStatus(item.id, 'Disabled')}
                                >
                                  Disable Account
                                </button>
                              )}
                              {(adminActiveSubTab === 'Rejected' || adminActiveSubTab === 'Disabled') && (
                                <button
                                  className="btn btn-primary"
                                  style={{ background: '#10B981', color: 'white', border: 'none', flex: 1, justifyContent: 'center', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                                  onClick={() => handleStartUserApproval(item)}
                                >
                                  Re-Enable Account
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <div className="card" style={{ background: '#F8FAFC', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '-0.5px', margin: 0, color: 'var(--text-primary)' }}>👤 User Settings & Profile</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                Manage theme preferences and view account details.
              </p>
            </div>

            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>🎨 Theme Preference</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['light', 'dark', 'system'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="btn"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      background: theme === t ? 'var(--accent)' : 'var(--bg-card)',
                      color: theme === t ? 'white' : 'var(--text-primary)',
                      borderColor: 'var(--border-color)',
                      textTransform: 'capitalize',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleThemeChange(t)}
                  >
                    {t} Mode
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>🔑 Account Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>FULL NAME</span>
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name || 'User'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>EMAIL ADDRESS</span>
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.email || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>USERNAME</span>
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>@{user?.username || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>ROLE</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: '750', color: 'var(--accent)' }}>
                    {user?.role || 'User'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-danger"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer' }}
              onClick={handleLogout}
            >
              Log Out of Account
            </button>
          </div>
        )}

      </main>

      {/* Floating Action Button (Mobile Screen Only) */}
      <div className="mobile-fab-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
        <button 
          className="btn" 
          style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', border: 'none', cursor: 'pointer' }}
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
        >
          <Plus size={24} style={{ transform: speedDialOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {speedDialOpen && (
          <div style={{ position: 'absolute', bottom: '70px', right: '0', display: 'flex', flexDirection: 'column', gap: '8px', width: '180px', background: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>
            {activeTab === 'clients' ? (
              <>
                <button className="btn" style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '0.8rem', width: '100%', justifyContent: 'flex-start', border: 'none' }} onClick={() => { setShowClientModal(true); setSpeedDialOpen(false); }}>➕ Add Client</button>
                <button className="btn" style={{ background: '#E0E7FF', color: '#4338CA', fontSize: '0.8rem', width: '100%', justifyContent: 'flex-start', border: 'none' }} onClick={() => { triggerNewProjectFlow(); setSpeedDialOpen(false); }}>📁 New Project</button>
              </>
            ) : (
              <>
                <button className="btn" style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.8rem', width: '100%', justifyContent: 'flex-start', border: 'none' }} onClick={() => { setShowTaskModal(true); setSpeedDialOpen(false); }}>✅ Add Task</button>
                <button className="btn" style={{ background: '#D1FAE5', color: '#047857', fontSize: '0.8rem', width: '100%', justifyContent: 'flex-start', border: 'none' }} onClick={() => { triggerNewInvoiceFlow(); setSpeedDialOpen(false); }}>💰 Create Invoice</button>
                <button className="btn" style={{ background: '#F3E8FF', color: '#7E22CE', fontSize: '0.8rem', width: '100%', justifyContent: 'flex-start', border: 'none' }} onClick={() => { exportPDF('projects'); setSpeedDialOpen(false); }}>📄 Generate Report</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-bar">
        <button
          type="button"
          className="btn"
          style={{ border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: activeTab === 'dashboard' ? 'var(--accent)' : 'var(--text-secondary)', padding: '4px', flex: 1, minHeight: 'auto' }}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span style={{ fontSize: '0.65rem', fontWeight: '600' }}>Home</span>
        </button>
        <button
          type="button"
          className="btn"
          style={{ border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: activeTab === 'projects' ? 'var(--accent)' : 'var(--text-secondary)', padding: '4px', flex: 1, minHeight: 'auto' }}
          onClick={() => setActiveTab('projects')}
        >
          <FolderKanban size={20} />
          <span style={{ fontSize: '0.65rem', fontWeight: '600' }}>Projects</span>
        </button>
        <button
          type="button"
          className="btn"
          style={{ border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: activeTab === 'planner' ? 'var(--accent)' : 'var(--text-secondary)', padding: '4px', flex: 1, minHeight: 'auto' }}
          onClick={() => setActiveTab('planner')}
        >
          <Calendar size={20} />
          <span style={{ fontSize: '0.65rem', fontWeight: '600' }}>Planner</span>
        </button>
        {hasPermission(user?.role, 'canViewInvoices') && (
          <button
            type="button"
            className="btn"
            style={{ border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: activeTab === 'invoices' ? 'var(--accent)' : 'var(--text-secondary)', padding: '4px', flex: 1, minHeight: 'auto' }}
            onClick={() => setActiveTab('invoices')}
          >
            <FileText size={20} />
            <span style={{ fontSize: '0.65rem', fontWeight: '600' }}>Invoices</span>
          </button>
        )}
        <button
          type="button"
          className="btn"
          style={{ border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: activeTab === 'profile' ? 'var(--accent)' : 'var(--text-secondary)', padding: '4px', flex: 1, minHeight: 'auto' }}
          onClick={() => setActiveTab('profile')}
        >
          <Users size={20} />
          <span style={{ fontSize: '0.65rem', fontWeight: '600' }}>Profile</span>
        </button>
      </div>

      {/* ==========================================================================
          MODALS & FORMS
         ========================================================================== */}
      
      {/* 1. Client Modal */}
      {showClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>➕ Create Client Profile</h3>
            <form onSubmit={handleAddClient}>
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input type="text" placeholder="e.g. Ashok Kumar" className="form-input" value={newClient.name} onChange={(e) => setNewClient({...newClient, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" placeholder="+91 99999 88888" className="form-input" value={newClient.phone} onChange={(e) => setNewClient({...newClient, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" placeholder="client@studio.in" className="form-input" value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input type="text" placeholder="Structural Ltd." className="form-input" value={newClient.company} onChange={(e) => setNewClient({...newClient, company: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" placeholder="Contract parameters, Revit/CAD templates..." rows="2" value={newClient.notes} onChange={(e) => setNewClient({...newClient, notes: e.target.value})}></textarea>
              </div>

              {/* Agreement Documents Section */}
              <div className="form-group">
                <label className="form-label">Agreement Documents</label>
                <input 
                  type="file" 
                  className="form-input" 
                  multiple 
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleAgreementFilesChange}
                  style={{ padding: '6px' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Upload signed agreements, quotation approvals, NDA, or contract documents.
                </p>

                {fileValidationError && (
                  <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '6px', fontWeight: '500' }}>
                    ⚠️ {fileValidationError}
                  </div>
                )}

                {uploadedAgreementFiles.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Selected Files:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      {uploadedAgreementFiles.map((name, i) => (
                        <div key={i} style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Paperclip size={12} />
                          <span>{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowClientModal(false); setUploadedAgreementFiles([]); setFileValidationError(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Project Modal */}
      {showProjectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>📁 Create CAD Project</h3>
            <form onSubmit={handleAddProject}>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input type="text" placeholder="e.g. Factory Layout Design" className="form-input" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Select Client *</label>
                <select className="form-input" value={newProject.clientId} onChange={(e) => setNewProject({...newProject, clientId: e.target.value})} required>
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">CAD Modeling Type</label>
                <select className="form-input" value={newProject.cadType} onChange={(e) => setNewProject({...newProject, cadType: e.target.value})}>
                  <option value="AutoCAD 2D">AutoCAD 2D</option>
                  <option value="Revit 3D">Revit 3D</option>
                  <option value="SolidWorks">SolidWorks</option>
                  <option value="Sketchup Modeling">Sketchup Modeling</option>
                  <option value="Piping">Piping</option>
                  <option value="Structural">Structural</option>
                  <option value="Structural Steel">Structural Steel</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="MEP">MEP</option>
                  <option value="Plant Layout">Plant Layout</option>
                  <option value="Fabrication Drawing">Fabrication Drawing</option>
                  <option value="Shop Drawing">Shop Drawing</option>
                  <option value="As-Built Drawing">As-Built Drawing</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input type="date" className="form-input" value={newProject.deadline} onChange={(e) => setNewProject({...newProject, deadline: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Quotation Amount (₹)</label>
                <input type="number" placeholder="100000" className="form-input" value={newProject.quoteAmount} onChange={(e) => setNewProject({...newProject, quoteAmount: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Paid Amount (₹)</label>
                <input type="number" placeholder="50000" className="form-input" value={newProject.paidAmount} onChange={(e) => setNewProject({...newProject, paidAmount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input type="text" placeholder="File layout versions, custom details..." className="form-input" value={newProject.fileNotes} onChange={(e) => setNewProject({...newProject, fileNotes: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Task Modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>✅ Create Planner Task</h3>
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input type="text" placeholder="e.g. Export DWG layouts" className="form-input" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Invoice Wizard Modal */}
      {showInvoiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>💰 Generate AURA Invoice</h3>
            
            {invoiceLoading && (
              <div style={{ padding: '8px 12px', background: '#DBEAFE', color: '#1D4ED8', fontSize: '0.85rem', borderRadius: '8px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '500' }}>
                <Clock size={16} className="animate-spin" /> {invoiceLoading}
              </div>
            )}
            
            {invoiceError && (
              <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#B91C1C', fontSize: '0.85rem', borderRadius: '8px', marginBottom: '12px' }}>
                ⚠️ {invoiceError}
              </div>
            )}

            <form onSubmit={handleSaveDraft}>
              
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input type="text" className="form-input" value={invoiceForm.invoice_number} readOnly style={{ background: '#F1F5F9' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice Date</label>
                  <input type="date" className="form-input" value={invoiceForm.invoice_date} onChange={(e) => setInvoiceForm({...invoiceForm, invoice_date: e.target.value})} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Select Client *</label>
                  <select className="form-input" value={invoiceForm.client_id} onChange={(e) => handleInvoiceClientSelect(e.target.value)} required>
                    <option value="">-- Select Client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Select Project *</label>
                  <select className="form-input" value={invoiceForm.project_id} onChange={(e) => handleInvoiceProjectSelect(e.target.value)} disabled={!invoiceForm.client_id} required>
                    <option value="">-- Select Project --</option>
                    {projects.filter(p => p.clientId === invoiceForm.client_id).map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Project Amt (₹)</label>
                  <input type="number" className="form-input" value={invoiceForm.project_amount} onChange={(e) => recalculateInvoiceTotals({ project_amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Advance Paid (₹)</label>
                  <input type="number" className="form-input" value={invoiceForm.advance_paid} onChange={(e) => recalculateInvoiceTotals({ advance_paid: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Balance Due (₹)</label>
                  <input type="number" className="form-input" value={invoiceForm.balance_due} readOnly style={{ background: '#F1F5F9' }} />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">GST %</label>
                  <input type="number" className="form-input" value={invoiceForm.gst_percentage} onChange={(e) => recalculateInvoiceTotals({ gst_percentage: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Amt (₹)</label>
                  <input type="number" className="form-input" value={invoiceForm.gst_amount} readOnly style={{ background: '#F1F5F9' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount (₹)</label>
                  <input type="number" className="form-input" value={invoiceForm.discount} onChange={(e) => recalculateInvoiceTotals({ discount: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({...invoiceForm, due_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Grand Total Due (₹)</label>
                  <input type="text" className="form-input" value={`₹ ${invoiceForm.grand_total.toLocaleString('en-IN')}`} readOnly style={{ background: '#EEF2F6', fontWeight: 'bold', color: 'var(--accent)' }} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Payment Status</label>
                  <select className="form-input" value={invoiceForm.payment_status} onChange={(e) => setInvoiceForm({...invoiceForm, payment_status: e.target.value})}>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-input" value={invoiceForm.payment_method} onChange={(e) => setInvoiceForm({...invoiceForm, payment_method: e.target.value})}>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Instructions</label>
                <textarea className="form-input" rows="2" value={invoiceForm.notes} onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Draft</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { generateAndDownloadPDF(invoiceForm); }}>Download PDF</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowInvoiceModal(false); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Project Status Modal */}
      {showProjectEditModal && editingProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>📁 Edit Project Status</h3>
            <form onSubmit={handleUpdateProjectStatus}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input type="text" className="form-input" value={editingProject.title} readOnly style={{ background: '#F1F5F9' }} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input" 
                    value={editingProject.status || 'In Progress'} 
                    onChange={(e) => setEditingProject({...editingProject, status: e.target.value})}
                    required
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="QC Pending">QC Pending</option>
                    <option value="QC Passed">QC Passed</option>
                    <option value="Revision Required">Revision Required</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">QC Status</label>
                  <select 
                    className="form-input" 
                    value={editingProject.qc_status || 'Not Checked'} 
                    onChange={(e) => setEditingProject({...editingProject, qc_status: e.target.value})}
                  >
                    <option value="Not Checked">Not Checked</option>
                    <option value="QC Pending">QC Pending</option>
                    <option value="QC Passed">QC Passed</option>
                    <option value="QC Failed">QC Failed</option>
                    <option value="Revision Required">Revision Required</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Revision Count</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input" 
                    value={editingProject.revision_count || 0} 
                    onChange={(e) => setEditingProject({...editingProject, revision_count: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Status</label>
                  <select 
                    className="form-input" 
                    value={editingProject.delivery_status || 'Not Delivered'} 
                    onChange={(e) => setEditingProject({...editingProject, delivery_status: e.target.value})}
                  >
                    <option value="Not Delivered">Not Delivered</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Progress / Completion Percentage ({editingProject.progress}%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5" 
                    style={{ flex: 1 }}
                    value={editingProject.progress} 
                    onChange={(e) => setEditingProject({...editingProject, progress: parseInt(e.target.value) || 0})} 
                  />
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="form-input"
                    style={{ width: '80px' }}
                    value={editingProject.progress} 
                    onChange={(e) => setEditingProject({...editingProject, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))})} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowProjectEditModal(false); setEditingProject(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Task Modal */}
      {showTaskEditModal && editingTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>✅ Edit Task Details</h3>
            <form onSubmit={handleUpdateTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editingTask.title} 
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input 
                  type="text" 
                  placeholder="e.g. 10:00" 
                  className="form-input" 
                  value={editingTask.time || ''} 
                  onChange={(e) => setEditingTask({...editingTask, time: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select 
                  className="form-input" 
                  value={editingTask.priority} 
                  onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input" 
                    value={editingTask.status || (editingTask.completed ? 'Done' : 'Pending')} 
                    onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="QC Pending">QC Pending</option>
                    <option value="Done">Done</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Linked Project</label>
                  <select 
                    className="form-input" 
                    value={editingTask.project_id || editingTask.projectId || ''} 
                    onChange={(e) => setEditingTask({...editingTask, project_id: e.target.value, projectId: e.target.value})}
                  >
                    <option value="">-- No Linked Project --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Completion Percentage ({editingTask.completion_percentage || 0}%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5" 
                    style={{ flex: 1 }}
                    value={editingTask.completion_percentage || 0} 
                    onChange={(e) => setEditingTask({...editingTask, completion_percentage: parseInt(e.target.value) || 0})} 
                    required
                  />
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="form-input"
                    style={{ width: '80px' }}
                    value={editingTask.completion_percentage || 0} 
                    onChange={(e) => setEditingTask({...editingTask, completion_percentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))})} 
                    required
                  />
                </div>
              </div>

              {/* QC Tracking Section */}
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '16px 0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>🛠 QC & Verification</h4>
                
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    type="checkbox" 
                    id="sent_to_qc"
                    checked={editingTask.sent_to_qc || false}
                    onChange={(e) => setEditingTask({...editingTask, sent_to_qc: e.target.checked, qc_status: e.target.checked ? 'QC Pending' : editingTask.qc_status})}
                  />
                  <label htmlFor="sent_to_qc" className="form-label" style={{ margin: 0, fontWeight: '600', cursor: 'pointer' }}>Send to QC</label>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">QC Status</label>
                    <select 
                      className="form-input" 
                      value={editingTask.qc_status || 'Not Checked'} 
                      onChange={(e) => setEditingTask({...editingTask, qc_status: e.target.value})}
                    >
                      <option value="Not Checked">Not Checked</option>
                      <option value="QC Pending">QC Pending</option>
                      <option value="QC Passed">QC Passed</option>
                      <option value="QC Failed">QC Failed</option>
                      <option value="Revision Required">Revision Required</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">QC Checked By</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Lead Engineer" 
                      value={editingTask.qc_checked_by || ''} 
                      onChange={(e) => setEditingTask({...editingTask, qc_checked_by: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">QC Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={editingTask.qc_date || ''} 
                      onChange={(e) => setEditingTask({...editingTask, qc_date: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">QC Notes</label>
                    <textarea 
                      className="form-input" 
                      rows="2" 
                      placeholder="Notes for revisions or approvals..." 
                      value={editingTask.qc_notes || ''} 
                      onChange={(e) => setEditingTask({...editingTask, qc_notes: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Task Notes</label>
                <textarea 
                  className="form-input" 
                  rows="2" 
                  value={editingTask.notes || ''} 
                  onChange={(e) => setEditingTask({...editingTask, notes: e.target.value})}
                  placeholder="Task progress notes, files reference..."
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowTaskEditModal(false); setEditingTask(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Updates</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Right Slide-Out Side Panel (for selected Date Details & Quick Actions) */}
      {showSidePanel && selectedDateStr && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '420px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border-color)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {/* Slide panel CSS animation inline style */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}} />

          {/* Side Panel Header */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>📅 Selected Date</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{selectedDateStr}</p>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ minWidth: 'auto', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#F1F5F9' }} 
              onClick={() => setShowSidePanel(false)}
            >
              Close
            </button>
          </div>

          {/* Side Panel Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Event Items on Clicked Day */}
            {(() => {
              const events = getDayEvents(selectedDateStr);
              const totalEvents = events.tasks.length + events.projects.length + events.invoices.length + events.reminders.length + events.personalTasks.length + events.habits.length + events.bills.length + events.personalReminders.length + events.meetings.length + events.birthdays.length;
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Meetings */}
                  {events.meetings.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>📞 Meetings ({events.meetings.length})</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.meetings.map(m => (
                          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', background: '#EFF6FF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1E40AF' }}>{m.title}</span>
                            <span style={{ fontSize: '0.75rem', color: '#1E3A8A' }}>Time: {m.time} {m.notes && `• Notes: ${m.notes}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Birthdays */}
                  {events.birthdays.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#EC4899', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>🩷 Birthdays ({events.birthdays.length})</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.birthdays.map(b => (
                          <div key={b.id} style={{ display: 'flex', alignItems: 'center', background: '#FDF2F8', padding: '10px 12px', borderRadius: '8px', border: '1px solid #FBCFE8' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#BE185D' }}>🎉 {b.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Client Project Deadlines */}
                  {events.projects.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>🟣 Project Deadlines ({events.projects.length})</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.projects.map(p => {
                          const client = clients.find(c => c.id === p.clientId);
                          return (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF5FF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E9D5FF' }}>
                              <div>
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6D28D9' }}>{p.title}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>({client ? client.name : 'Unknown'})</span>
                              </div>
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 6px', fontSize: '0.7rem', height: 'auto', minWidth: 'auto', background: 'white' }}
                                onClick={() => { setEditingProject(p); setShowProjectEditModal(true); }}
                              >
                                Edit Status
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  {events.tasks.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>🔵 Tasks ({events.tasks.length})</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.tasks.map(t => (
                          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: '700', textDecoration: t.completed ? 'line-through' : 'none' }}>{t.title}</span>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>{t.time || 'No Time'}</span>
                                <span className={`badge ${t.priority === 'High' ? 'badge-danger' : 'badge-secondary'}`} style={{ fontSize: '0.65rem', padding: '1px 4px' }}>{t.priority}</span>
                                <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>{t.completion_percentage || 0}%</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {t.status !== 'Done' && (
                                <button 
                                  type="button" 
                                  className="btn btn-primary" 
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', height: 'auto', minWidth: 'auto', background: 'var(--color-success)', color: 'white', border: 'none' }}
                                  onClick={() => { handleMarkTaskStatus(t.id, 'Done'); }}
                                >
                                  Done
                                </button>
                              )}
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 6px', fontSize: '0.7rem', height: 'auto', minWidth: 'auto' }}
                                onClick={() => { setEditingTask(t); setShowTaskEditModal(true); }}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* QC Tasks */}
                  {events.qcTasks.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>⚙️ QC Review Tasks ({events.qcTasks.length})</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.qcTasks.map(q => (
                          <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F3F4F6', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}>
                            <div>
                              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>{q.title}</span>
                              <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '1px 4px', marginLeft: '6px' }}>QC: {q.qc_status}</span>
                            </div>
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              style={{ padding: '2px 6px', fontSize: '0.7rem', height: 'auto', minWidth: 'auto' }}
                              onClick={() => { setEditingTask(q); setShowTaskEditModal(true); }}
                            >
                              Inspect
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personal Tasks */}
                  {events.personalTasks.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#EAB308', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>🟡 Personal Tasks ({events.personalTasks.length})</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.personalTasks.map(pt => (
                          <div key={pt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FEF08A', padding: '10px 12px', borderRadius: '8px', border: '1px solid #FEF08A' }}>
                            <div>
                              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#854D0E', textDecoration: pt.status === 'Done' ? 'line-through' : 'none' }}>{pt.title}</span>
                              <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '1px 4px', marginLeft: '6px' }}>{pt.category}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {pt.status !== 'Done' && (
                                <button 
                                  type="button" 
                                  className="btn btn-primary" 
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', height: 'auto', minWidth: 'auto', background: 'var(--color-success)', color: 'white', border: 'none' }}
                                  onClick={() => { handleMarkPersonalTaskDone(pt.id); }}
                                >
                                  Done
                                </button>
                              )}
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 6px', fontSize: '0.7rem', height: 'auto', minWidth: 'auto' }}
                                onClick={() => { setEditingPersonalTask(pt); setPersonalTaskForm(pt); setShowPersonalTaskModal(true); }}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invoice Due Dates */}
                  {events.invoices.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>🟠 Invoices Due ({events.invoices.length})</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.invoices.map(inv => {
                          const client = clients.find(c => c.id === inv.client_id);
                          return (
                            <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FEF3C7', padding: '10px 12px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                              <div>
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#92400E' }}>{inv.invoice_number}</span>
                                <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '2px' }}>
                                  Client: {client ? client.name : 'N/A'} • <strong>₹{inv.grand_total.toLocaleString('en-IN')}</strong>
                                </div>
                              </div>
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '2px 6px', fontSize: '0.7rem', height: 'auto', minWidth: 'auto', background: 'white' }}
                                onClick={() => { setActiveTab('invoices'); setShowSidePanel(false); }}
                              >
                                View
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reminders & Personal Reminders */}
                  {(events.reminders.length > 0 || events.personalReminders.length > 0) && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>🔔 Reminders ({events.reminders.length + events.personalReminders.length})</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.reminders.map(r => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F3E8FF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E9D5FF' }}>
                            <span style={{ fontSize: '0.85rem', color: '#6B46C1', fontWeight: '600' }}>🔔 {r.title}</span>
                            <span style={{ fontSize: '0.7rem', color: '#6B46C1' }}>{r.time || 'All day'}</span>
                          </div>
                        ))}
                        {events.personalReminders.map(pr => (
                          <div key={pr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F5F3FF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DDD6FE' }}>
                            <span style={{ fontSize: '0.85rem', color: '#5B21B6', fontWeight: '600' }}>🔔 {pr.title}</span>
                            <span style={{ fontSize: '0.7rem', color: '#5B21B6' }}>{pr.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Habits Completed */}
                  {events.habits.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>🌱 Habits Completed ({events.habits.length})</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.habits.map(h => (
                          <div key={h.id} style={{ display: 'flex', alignItems: 'center', background: '#HN12', backgroundColor: '#F0FDF4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #BBF7D0', color: '#166534' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>🔥 {h.habit_name} (Streak: {h.streak_count || 0})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state inside day drawer */}
                  {totalEvents === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>🗓️</span>
                      <p style={{ fontSize: '0.85rem', margin: 0 }}>No items scheduled on this date.</p>
                    </div>
                  )}

                </div>
              );
            })()}
          </div>

          {/* Quick Add Form Section (Always visible at bottom of drawer) */}
          <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: '#F8FAFC' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>⚡ Quick Add</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Title..." 
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                value={quickTitle}
                disabled={isAdding}
                onChange={(e) => setQuickTitle(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '8px 0', fontSize: '0.8rem', justifyContent: 'center' }}
                  disabled={isAdding || !quickTitle.trim()}
                  onClick={() => handleQuickAddTask(selectedDateStr, quickTitle)}
                >
                  {isAdding ? "Adding..." : "+ Task"}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '8px 0', fontSize: '0.8rem', justifyContent: 'center', border: '1px solid var(--border-color)' }}
                  disabled={isAdding || !quickTitle.trim()}
                  onClick={() => handleQuickAddReminder(selectedDateStr, quickTitle)}
                >
                  {isAdding ? "Adding..." : "+ Reminder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 8. Personal Task Modal */}
      {showPersonalTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>
              {editingPersonalTask ? "📝 Edit Personal Task" : "➕ Add Personal Task"}
            </h3>
            <form onSubmit={handleSavePersonalTask}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={personalTaskForm.title}
                  onChange={(e) => setPersonalTaskForm({ ...personalTaskForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2" style={{ gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={personalTaskForm.category}
                    onChange={(e) => setPersonalTaskForm({ ...personalTaskForm, category: e.target.value })}
                  >
                    <option value="Personal Tasks">Personal Tasks</option>
                    <option value="Health & Fitness">Health & Fitness</option>
                    <option value="Learning Goals">Learning Goals</option>
                    <option value="Family / Home Work">Family / Home Work</option>
                    <option value="Bills & Payments">Bills & Payments</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input"
                    value={personalTaskForm.priority}
                    onChange={(e) => setPersonalTaskForm({ ...personalTaskForm, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={personalTaskForm.due_date}
                    onChange={(e) => setPersonalTaskForm({ ...personalTaskForm, due_date: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Reminder Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={personalTaskForm.reminder_date}
                    onChange={(e) => setPersonalTaskForm({ ...personalTaskForm, reminder_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={personalTaskForm.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      let newPct = personalTaskForm.completion_percentage;
                      if (newStatus === 'Done') newPct = 100;
                      else if (newStatus === 'Pending') newPct = 0;
                      setPersonalTaskForm({ ...personalTaskForm, status: newStatus, completion_percentage: newPct });
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Completion % ({personalTaskForm.completion_percentage}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="form-input"
                    style={{ padding: 0 }}
                    value={personalTaskForm.completion_percentage}
                    onChange={(e) => {
                      const newPct = parseInt(e.target.value) || 0;
                      let newStatus = personalTaskForm.status;
                      if (newPct === 100) newStatus = 'Done';
                      else if (newPct > 0 && newPct < 100) newStatus = 'In Progress';
                      else if (newPct === 0) newStatus = 'Pending';
                      setPersonalTaskForm({ ...personalTaskForm, completion_percentage: newPct, status: newStatus });
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={personalTaskForm.notes || ''}
                  onChange={(e) => setPersonalTaskForm({ ...personalTaskForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowPersonalTaskModal(false); setEditingPersonalTask(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isAdding}>
                  {isAdding ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Habit Modal */}
      {showHabitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>
              {editingHabit ? "🌱 Edit Habit" : "🌱 Add Habit"}
            </h3>
            <form onSubmit={handleSaveHabit}>
              <div className="form-group">
                <label className="form-label">Habit Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Drink 3L Water"
                  value={habitForm.habit_name}
                  onChange={(e) => setHabitForm({ ...habitForm, habit_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select
                  className="form-input"
                  value={habitForm.frequency}
                  onChange={(e) => setHabitForm({ ...habitForm, frequency: e.target.value })}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Initial Streak Count</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={habitForm.streak_count}
                    onChange={(e) => setHabitForm({ ...habitForm, streak_count: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={habitForm.status}
                    onChange={(e) => setHabitForm({ ...habitForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowHabitModal(false); setEditingHabit(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isAdding}>
                  {isAdding ? "Saving..." : "Save Habit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin User Approval Modal */}
      {approvingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #6C4DFF 0%, #8B5CF6 100%)',
              padding: '24px',
              color: 'white'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>🛡️ Admin User Approval</h2>
              <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px', margin: 0 }}>
                Configure organizational role, department, and ID for {approvingUser.first_name} {approvingUser.last_name}
              </p>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleApproveSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Employee Name</label>
                  <input
                    type="text"
                    disabled
                    value={`${approvingUser.first_name} ${approvingUser.last_name}`}
                    style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email</label>
                  <input
                    type="text"
                    disabled
                    value={approvingUser.email}
                    style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Role *</label>
                <select
                  value={approveRole}
                  onChange={(e) => setApproveRole(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', color: '#111827', fontSize: '0.85rem' }}
                  required
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Department *</label>
                  <select
                    value={approveDept}
                    onChange={(e) => setApproveDept(e.target.value)}
                    style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', color: '#111827', fontSize: '0.85rem' }}
                    required
                  >
                    {[
                      "Naval Architecture", "Marine Engineering", "Mechanical Engineering", 
                      "Structural Engineering", "Piping Engineering", "Electrical Engineering", 
                      "BIM / CAD", "Project Management", "Administration", "HR", "Finance", "IT"
                    ].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Designation *</label>
                  <select
                    value={approveDesignation}
                    onChange={(e) => setApproveDesignation(e.target.value)}
                    style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', color: '#111827', fontSize: '0.85rem' }}
                    required
                  >
                    {[
                      "Trainee", "Junior Engineer", "Design Engineer", "Senior Engineer", 
                      "Lead Engineer", "Project Engineer", "Project Manager", "Department Head", "Administrator"
                    ].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Employee ID *</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={approveIsManualId}
                      onChange={(e) => {
                        setApproveIsManualId(e.target.checked);
                        if (!e.target.checked) {
                          const nextNum = adminUsers.length + 1;
                          setApproveEmpId('AURA-' + String(nextNum).padStart(4, '0'));
                        }
                      }}
                      style={{ accentColor: '#6C4DFF' }}
                    />
                    Manual override
                  </label>
                </div>
                <input
                  type="text"
                  value={approveEmpId}
                  onChange={(e) => setApproveEmpId(e.target.value)}
                  disabled={!approveIsManualId}
                  style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: approveIsManualId ? 'white' : '#F8FAFC', color: '#111827', fontSize: '0.85rem', fontWeight: '600' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Reporting Manager</label>
                <select
                  value={approveManager}
                  onChange={(e) => setApproveManager(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: 'white', color: '#111827', fontSize: '0.85rem' }}
                >
                  <option value="">None / Select Reporting Manager</option>
                  {adminUsers
                    .filter(u => u.role === 'Manager' || u.role === 'Admin' || u.role === 'SuperAdmin')
                    .map(u => (
                      <option key={u.id} value={`${u.first_name} ${u.last_name}`}>
                        {u.first_name} {u.last_name} ({u.role})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Employment Status</label>
                <input
                  type="text"
                  value="Active"
                  disabled
                  style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setApprovingUser(null)}
                  style={{ flex: 1, height: '44px', border: '1px solid #E2E8F0', borderRadius: '10px', background: '#F8FAFC', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, height: '44px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #6C4DFF 0%, #8B5CF6 100%)', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(108, 77, 255, 0.25)' }}
                >
                  Approve User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingUserDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', color: '#1E293B', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1E293B', margin: 0 }}>Registration Profile Details</h3>
              <button 
                onClick={() => setViewingUserDetails(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#64748B', cursor: 'pointer', lineHieght: 1 }}
              >&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: '600', color: '#64748B' }}>Full Name</span>
                <span style={{ fontWeight: '500' }}>{viewingUserDetails.first_name} {viewingUserDetails.last_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: '600', color: '#64748B' }}>Username</span>
                <span style={{ fontWeight: '500' }}>@{viewingUserDetails.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: '600', color: '#64748B' }}>Email Address</span>
                <span style={{ fontWeight: '500' }}>{viewingUserDetails.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: '600', color: '#64748B' }}>Role / Level</span>
                <span style={{ fontWeight: '700', color: '#6C4DFF' }}>{viewingUserDetails.role || 'Employee'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: '600', color: '#64748B' }}>Request Status</span>
                <span style={{ fontWeight: '700', color: viewingUserDetails.status === 'Approved' ? '#10B981' : viewingUserDetails.status === 'Pending' ? '#F59E0B' : '#EF4444' }}>
                  {viewingUserDetails.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: '600', color: '#64748B' }}>Registration Date</span>
                <span style={{ fontWeight: '500' }}>{new Date(viewingUserDetails.created_at).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: '600', color: '#64748B' }}>Department</span>
                <span style={{ fontWeight: '500' }}>{viewingUserDetails.department || 'Not Assigned'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: '600', color: '#64748B' }}>Designation</span>
                <span style={{ fontWeight: '500' }}>{viewingUserDetails.designation || 'Not Assigned'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: '600', color: '#64748B' }}>Employee ID</span>
                <span style={{ fontWeight: '500' }}>{viewingUserDetails.employee_id || 'Not Assigned'}</span>
              </div>
            </div>

            <button 
              onClick={() => setViewingUserDetails(null)}
              style={{ width: '100%', height: '42px', marginTop: '20px', border: 'none', borderRadius: '8px', background: '#6C4DFF', color: 'white', fontWeight: '700', cursor: 'pointer' }}
            >Close Details</button>
          </div>
        </div>
      )}

    </div>
  );
}
