/**
 * AURA Workspace 2.0 - Core Script Engine
 * Implements Resizable Sidebar, Command Palette (Ctrl + K), focus session logic,
 * HTML5 Drag & Drop Kanban task boards, mock cloud databases, charts, & AI Assistant actions.
 */

// ==========================================================================
// Seed Data (Pre-populates on first initialization)
// ==========================================================================
const DEFAULT_CLIENTS = [
  { id: "c1", name: "Apex Structural Builders", project: "3D BIM Warehouse Model", rate: 85, currency: "USD" },
  { id: "c2", name: "Nova Interior Design", project: "AutoCAD Floorplan Layouts", rate: 65, currency: "USD" },
  { id: "c3", name: "Zenith Mechanical Co", project: "CAD Machine Tooling Parts", rate: 95, currency: "USD" }
];

const DEFAULT_TASKS = [
  { id: "t1", title: "Complete BIM Warehouse Columns", category: "cad", status: "progress", startTime: "09:00", duration: 2.5, desc: "Run clearance checks and adjust structural spacing for Apex Warehouse.", date: "2026-06-26" },
  { id: "t2", title: "Apex Client Alignment Call", category: "consulting", status: "todo", startTime: "12:00", duration: 1.0, desc: "Review structural spacing corrections with project lead.", date: "2026-06-26" },
  { id: "t3", title: "Draft Kitchen Counter CAD details", category: "cad", status: "done", startTime: "14:00", duration: 1.5, desc: "Create structural counter layout details for Nova Interior Design.", date: "2026-06-26" },
  { id: "t4", title: "Gym Workout & Stretching", category: "personal", status: "done", startTime: "17:00", duration: 1.2, desc: "Cardio + upper body strength routine.", date: "2026-06-26" },
  { id: "t5", title: "Read CAD Engineering Newsletter", category: "habits", status: "todo", startTime: "20:00", duration: 0.5, desc: "Read latest BIM design standard documentation releases.", date: "2026-06-26" }
];

const DEFAULT_TIMELOGS = [
  { id: "l1", date: "2026-06-25", clientId: "c1", clientName: "Apex Structural Builders", project: "3D BIM Warehouse Model", notes: "Completed roof truss framing revisions", duration: 3.2, earnings: 272 },
  { id: "l2", date: "2026-06-25", clientId: "c2", clientName: "Nova Interior Design", project: "AutoCAD Floorplan Layouts", notes: "Drafted electrical ceiling diagrams", duration: 2.0, earnings: 130 },
  { id: "l3", date: "2026-06-24", clientId: "c3", clientName: "Zenith Mechanical Co", project: "CAD Machine Tooling Parts", notes: "Designed prototype brackets v1.1", duration: 4.5, earnings: 427.5 }
];

const DEFAULT_HABITS = [
  { id: "h1", name: "Drink 3L Water", category: "health", streak: 5, completedToday: true },
  { id: "h2", name: "Read CAD Publications", category: "career", streak: 3, completedToday: false },
  { id: "h3", name: "Core Workout Routine", category: "health", streak: 12, completedToday: true },
  { id: "h4", name: "10 min Mindfulness", category: "mind", streak: 7, completedToday: false }
];

const DEFAULT_WELLNESS = [
  { date: "2026-06-25", energy: 8, focus: 9, sleep: 7.5 },
  { date: "2026-06-24", energy: 7, focus: 8, sleep: 7.0 },
  { date: "2026-06-23", energy: 6, focus: 6, sleep: 6.5 }
];

// ==========================================================================
// Application State Management
// ==========================================================================
let state = {
  clients: JSON.parse(localStorage.getItem("aura_clients")) || DEFAULT_CLIENTS,
  tasks: JSON.parse(localStorage.getItem("aura_tasks")) || DEFAULT_TASKS,
  timeLogs: JSON.parse(localStorage.getItem("aura_timelogs")) || DEFAULT_TIMELOGS,
  habits: JSON.parse(localStorage.getItem("aura_habits")) || DEFAULT_HABITS,
  wellnessLogs: JSON.parse(localStorage.getItem("aura_wellness")) || DEFAULT_WELLNESS,
  activeTimer: JSON.parse(localStorage.getItem("aura_active_timer")) || null,
  user: JSON.parse(localStorage.getItem("aura_user")) || null, 
  accounts: JSON.parse(localStorage.getItem("aura_accounts")) || [], 
  currentDate: "2026-06-26" 
};

function saveState() {
  localStorage.setItem("aura_clients", JSON.stringify(state.clients));
  localStorage.setItem("aura_tasks", JSON.stringify(state.tasks));
  localStorage.setItem("aura_timelogs", JSON.stringify(state.timeLogs));
  localStorage.setItem("aura_habits", JSON.stringify(state.habits));
  localStorage.setItem("aura_wellness", JSON.stringify(state.wellnessLogs));
  localStorage.setItem("aura_active_timer", JSON.stringify(state.activeTimer));
  localStorage.setItem("aura_user", JSON.stringify(state.user));
  localStorage.setItem("aura_accounts", JSON.stringify(state.accounts));
}

// Global Chart & Timer references
let donutChartObj = null;
let barChartObj = null;
let timerInterval = null;
let draggedTaskId = null;

// ==========================================================================
// DOM Load Handler
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  initAuthPortal();
  initNavigation();
  initResizableSidebar();
  initCommandPalette();
  initModals();
  initHabitsView();
  initAIAssistant();
  checkActiveTimer();
  initCloudSync();

  renderAllViews();
});

// ==========================================================================
// Resizable Left Sidebar
// ==========================================================================
function initResizableSidebar() {
  const sidebar = document.getElementById("sidebar-resizable");
  const handle = document.getElementById("sidebar-resize-handle");
  let isResizing = false;

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isResizing = true;
    handle.classList.add("active");
    document.body.style.cursor = "col-resize";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const newWidth = Math.max(240, Math.min(480, e.clientX));
    sidebar.style.width = `${newWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", `${newWidth}px`);
  });

  document.addEventListener("mouseup", () => {
    if (!isResizing) return;
    isResizing = false;
    handle.classList.remove("active");
    document.body.style.cursor = "default";
  });
}

// ==========================================================================
// Command Palette (Ctrl + K)
// ==========================================================================
function initCommandPalette() {
  const palette = document.getElementById("command-palette");
  const input = document.getElementById("palette-search-input");
  const searchBtn = document.getElementById("btn-trigger-search");

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      togglePalette();
    }
    if (e.key === "Escape") {
      palette.classList.remove("open");
    }
  });

  searchBtn.addEventListener("click", togglePalette);
  
  palette.addEventListener("click", (e) => {
    if (e.target === palette) palette.classList.remove("open");
  });

  function togglePalette() {
    palette.classList.toggle("open");
    if (palette.classList.contains("open")) {
      setTimeout(() => input.focus(), 100);
    }
  }

  document.querySelectorAll(".palette-item").forEach(item => {
    item.addEventListener("click", () => {
      palette.classList.remove("open");
      const action = item.getAttribute("data-action");
      triggerPaletteAction(action);
    });
  });
}

function triggerPaletteAction(action) {
  if (action === "new-task") {
    openModal(document.getElementById("task-modal"));
  } else if (action === "start-timer") {
    document.getElementById("btn-hero-timer-toggle").click();
  } else if (action === "new-client") {
    openModal(document.getElementById("client-modal"));
  } else if (action === "generate-invoice") {
    document.querySelector("[data-view=finance]").click();
  }
}

// ==========================================================================
// Navigation Routing
// ==========================================================================
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".content-view");

  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetView = item.getAttribute("data-view");

      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");

      let mappedId = `view-${targetView}`;
      if (targetView === "clients" || targetView === "today" || targetView === "calendar" || targetView === "projects" || targetView === "files") {
        mappedId = "view-dashboard";
      } else if (targetView === "finance" || targetView === "analytics") {
        mappedId = "view-reports";
      }

      views.forEach(v => {
        if (v.id === mappedId) {
          v.classList.add("active");
        } else {
          v.classList.remove("active");
        }
      });

      if (targetView === "dashboard") {
        setTimeout(initDashboardCharts, 100);
      }
    });
  });
}

// ==========================================================================
// Authentication
// ==========================================================================
function initAuthPortal() {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const btnTabLogin = document.getElementById("btn-tab-login");
  const btnTabSignup = document.getElementById("btn-tab-signup");
  const btnGuest = document.getElementById("btn-guest-bypass");
  const btnLogout = document.getElementById("btn-auth-logout");

  if (!state.user) {
    document.body.classList.add("auth-locked");
  } else {
    document.body.classList.remove("auth-locked");
    updateUserDOM();
  }

  btnTabLogin.addEventListener("click", () => {
    btnTabLogin.classList.add("active");
    btnTabSignup.classList.remove("active");
    loginForm.classList.add("active");
    signupForm.classList.remove("active");
  });

  btnTabSignup.addEventListener("click", () => {
    btnTabSignup.classList.add("active");
    btnTabLogin.classList.remove("active");
    signupForm.classList.add("active");
    loginForm.classList.remove("active");
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    state.user = { name: "Michael Robinson", email: "michael@designstudio.com" };
    saveState();
    document.body.classList.remove("auth-locked");
    updateUserDOM();
    renderAllViews();
  });

  btnGuest.addEventListener("click", () => {
    state.user = { name: "Michael Robinson", email: "michael@design.studio" };
    saveState();
    document.body.classList.remove("auth-locked");
    updateUserDOM();
    renderAllViews();
  });

  btnLogout.addEventListener("click", () => {
    state.user = null;
    saveState();
    document.body.classList.add("auth-locked");
  });
}

function updateUserDOM() {
  if (!state.user) return;
  document.getElementById("user-display-name").textContent = state.user.name;
  document.getElementById("user-display-email").textContent = state.user.email;
  document.getElementById("welcome-text-name").textContent = `Good Morning Michael 👋`;
}

// ==========================================================================
// Drag and Drop Tasks
// ==========================================================================
window.allowDrop = function(e) {
  e.preventDefault();
};

window.handleDragStart = function(e, taskId) {
  draggedTaskId = taskId;
  e.dataTransfer.setData("text/plain", taskId);
};

window.handleDrop = function(e, status) {
  e.preventDefault();
  if (!draggedTaskId) return;

  const task = state.tasks.find(t => t.id === draggedTaskId);
  if (task) {
    task.status = status;
    saveState();
    renderAllViews();
  }
  draggedTaskId = null;
};

// ==========================================================================
// Modals controls
// ==========================================================================
function initModals() {
  const taskModal = document.getElementById("task-modal");
  const clientModal = document.getElementById("client-modal");

  document.getElementById("btn-quick-add-task").addEventListener("click", () => openModal(taskModal));
  document.querySelectorAll(".close-modal").forEach(b => {
    b.addEventListener("click", (e) => {
      e.preventDefault();
      closeModals();
    });
  });

  document.getElementById("task-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("task-title").value;
    const category = document.getElementById("task-category").value;
    const status = document.getElementById("task-status").value;
    const startTime = document.getElementById("task-start-time").value;
    const duration = parseFloat(document.getElementById("task-duration").value) || 1.5;
    const desc = document.getElementById("task-desc").value;

    const task = {
      id: "t_" + Date.now(),
      title,
      category,
      status,
      startTime,
      duration,
      desc,
      date: state.currentDate
    };

    state.tasks.push(task);
    saveState();
    closeModals();
    e.target.reset();
    renderAllViews();
  });

  document.getElementById("client-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("client-name").value;
    const project = document.getElementById("client-project").value;
    const rate = parseFloat(document.getElementById("client-rate").value) || 75;
    const currency = document.getElementById("client-currency").value;

    const client = {
      id: "c_" + Date.now(),
      name,
      project,
      rate,
      currency
    };

    state.clients.push(client);
    saveState();
    closeModals();
    e.target.reset();
    renderAllViews();
  });
}

function openModal(modal) {
  modal.classList.add("open");
}

function closeModals() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("open"));
}

// ==========================================================================
// Cloud Sync Integration
// ==========================================================================
function initCloudSync() {
  const provider = document.getElementById("cloud-provider");
  const cfBlock = document.getElementById("cloudflare-config-block");
  const btnSync = document.getElementById("btn-cloud-sync-now");
  const syncBadge = document.getElementById("sync-status-badge");
  const btnExport = document.getElementById("btn-export-json");
  const btnImportTrigger = document.getElementById("btn-import-trigger");
  const fileInput = document.getElementById("json-file-input");

  provider.addEventListener("change", () => {
    if (provider.value.startsWith("cloudflare")) {
      cfBlock.style.display = "block";
    } else {
      cfBlock.style.display = "none";
    }
  });

  btnSync.addEventListener("click", () => {
    syncBadge.textContent = "SYNCING...";
    setTimeout(() => {
      syncBadge.textContent = "CONNECTED";
      syncBadge.className = "timer-status-badge active";
      
      if (provider.value === "cloudflare-kv") {
        alert("AURA Workspace Cloud Sync: Successfully written state to Cloudflare KV Namespace edge storage.");
      } else if (provider.value === "cloudflare-d1") {
        alert("AURA Workspace Cloud Sync: Successfully updated local SQL backup tables on Cloudflare D1 Database.");
      } else {
        alert("AURA Workspace Cloud Sync complete.");
      }
    }, 1200);
  });

  btnExport.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `aura_os_backup.json`);
    dlAnchorElem.click();
  });

  btnImportTrigger.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.clients && imported.tasks) {
          state.clients = imported.clients;
          state.tasks = imported.tasks;
          state.timeLogs = imported.timeLogs || state.timeLogs;
          saveState();
          renderAllViews();
          alert("AURA database configuration restored.");
        }
      } catch (err) {
        alert("Parse error.");
      }
    };
    if (e.target.files[0]) reader.readAsText(e.target.files[0]);
  });

  // Reports
  document.getElementById("btn-generate-report").addEventListener("click", buildSelectedReport);
  document.getElementById("btn-print-invoice").addEventListener("click", printGeneratedInvoice);
}

// ==========================================================================
// AI Assistant Console Actions (Intelligent OS Actions)
// ==========================================================================
function initAIAssistant() {
  const form = document.getElementById("dashboard-ai-form");
  const input = document.getElementById("dashboard-ai-input");
  const log = document.getElementById("dashboard-ai-log");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    appendBubble("user", query);
    input.value = "";

    setTimeout(() => {
      const reply = parseAICommand(query);
      appendBubble("bot", reply);
    }, 500);
  });

  document.querySelectorAll(".suggest-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const query = btn.getAttribute("data-input");
      appendBubble("user", query);
      setTimeout(() => {
        const reply = parseAICommand(query);
        appendBubble("bot", reply);
      }, 500);
    });
  });

  function appendBubble(sender, text) {
    const bubble = document.createElement("div");
    bubble.className = `ai-msg ${sender}`;
    bubble.innerHTML = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }
}

function parseAICommand(str) {
  const lower = str.toLowerCase();
  
  if (lower.includes("tomorrow") && lower.includes("finish") && lower.includes("9 am")) {
    const task = {
      id: "t_ai_" + Date.now(),
      title: "Finish Warehouse Columns Details",
      category: "cad",
      status: "todo",
      startTime: "09:00",
      duration: 2.0,
      desc: "Created by AURA AI OS Scheduler.",
      date: "2026-06-27"
    };
    state.tasks.push(task);
    saveState();
    renderAllViews();
    return "✅ Reminder scheduled. I have created a CAD task for tomorrow at 9 AM.";
  }

  if (lower.includes("create a cad task") || lower.includes("create cad task")) {
    const task = {
      id: "t_ai_cad_" + Date.now(),
      title: "AutoCAD Floorplan Revisions",
      category: "cad",
      status: "todo",
      startTime: "10:30",
      duration: 1.5,
      desc: "Revit clearance adjustments.",
      date: state.currentDate
    };
    state.tasks.push(task);
    saveState();
    renderAllViews();
    return "✅ Created CAD task 'AutoCAD Floorplan Revisions' automatically. Slated for 10:30 today (High Priority, CAD category).";
  }

  if (lower.includes("call me") || (lower.includes("remind") && lower.includes("2 pm"))) {
    return "✅ Reminder created. If ignored by 2:00 PM today, AURA will initiate desktop alerts and trigger voice synthesizer notification loops.";
  }

  if (lower.includes("summarize") || lower.includes("work today")) {
    const loggedSum = state.timeLogs.reduce((sum, l) => sum + l.duration, 0);
    return `📝 <strong>AURA Daily Work Journal:</strong><br>
    - Completed 2 CAD tasks.<br>
    - Billed <strong>${loggedSum.toFixed(1)} hours</strong> across active clients.<br>
    - Tracked 75% of your wellness habits today. Focus levels averaged 94%.`;
  }

  if (lower.includes("invoice") || lower.includes("apex")) {
    const logged = state.timeLogs.filter(l => l.clientId === "c1");
    const sum = logged.reduce((s, l) => s + l.earnings, 0);
    const tax = sum * 0.15;
    return `📄 <strong>Invoice Draft: Apex Builders</strong><br>
    - Gross Billable: $${sum.toFixed(2)}<br>
    - Tax (15% VAT): $${tax.toFixed(2)}<br>
    - Total Due: <strong>$${(sum + tax).toFixed(2)}</strong><br>
    Ready to send to client portal.`;
  }

  if (lower.includes("start focus") || lower.includes("focus mode")) {
    document.getElementById("btn-hero-timer-toggle").click();
    return "🎧 Smart Focus Mode initiated. Notifications silenced, timer running.";
  }

  return "I'm on standby to log hours, draft invoices, summarize tasks, or block your schedule.";
}

// ==========================================================================
// Focus Hero Stopwatches Tickers
// ==========================================================================
function checkActiveTimer() {
  const toggleBtn = document.getElementById("btn-hero-timer-toggle");
  toggleBtn.addEventListener("click", toggleFocusTimer);

  if (state.activeTimer) resumeFocusTimer();
}

function toggleFocusTimer() {
  const toggleBtn = document.getElementById("btn-hero-timer-toggle");
  
  if (state.activeTimer) {
    clearInterval(timerInterval);
    timerInterval = null;

    const elapsed = Date.now() - state.activeTimer.startTimeStamp;
    const hours = elapsed / (1000 * 60 * 60);

    const log = {
      id: "l_" + Date.now(),
      date: state.currentDate,
      clientId: "c1",
      clientName: "Apex Structural Builders",
      project: "3D BIM Warehouse Model",
      notes: "BIM columns detailing focus session",
      duration: hours,
      earnings: hours * 85
    };

    state.timeLogs.unshift(log);
    state.activeTimer = null;
    saveState();

    toggleBtn.innerHTML = '<i data-lucide="play"></i> Start Focus';
    document.getElementById("sb-timer-display").textContent = "00:00:00";
    lucide.createIcons();
    renderAllViews();
  } else {
    state.activeTimer = { startTimeStamp: Date.now() };
    saveState();
    resumeFocusTimer();
  }
}

function resumeFocusTimer() {
  const toggleBtn = document.getElementById("btn-hero-timer-toggle");
  toggleBtn.innerHTML = '<i data-lucide="square" style="color:var(--color-danger);"></i> Stop Focus';
  lucide.createIcons();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!state.activeTimer) return;
    const elapsed = Date.now() - state.activeTimer.startTimeStamp;
    const hrs = Math.floor(elapsed / 3600000);
    const mins = Math.floor((elapsed % 3600000) / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    
    const formatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.getElementById("sb-timer-display").textContent = formatted;
  }, 1000);
}

// ==========================================================================
// Habits View checks
// ==========================================================================
function initHabitsView() {
  renderHabitsChecklist();
}

function renderHabitsChecklist() {
  const list = document.getElementById("habits-list");
  const dashboardChecklist = document.getElementById("dashboard-tasks-checklist");
  
  list.innerHTML = "";
  dashboardChecklist.innerHTML = "";

  let done = 0;
  state.habits.forEach(h => {
    if (h.completedToday) done++;
    
    const row = document.createElement("div");
    row.className = `habit-row ${h.completedToday ? 'completed' : ''}`;
    row.innerHTML = `
      <div class="habit-checkbox"><i data-lucide="check" style="width: 10px; height: 10px;"></i></div>
      <span class="habit-title">${h.name}</span>
      <span class="habit-streak"><i data-lucide="flame" style="width:10px; height:10px; vertical-align:middle;"></i> ${h.streak}d</span>
    `;

    row.addEventListener("click", () => {
      h.completedToday = !h.completedToday;
      h.streak = h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1);
      saveState();
      renderHabitsChecklist();
    });

    list.appendChild(row);

    // Sync to Dashboard Timeline bottom Checklist
    const dashRow = row.cloneNode(true);
    dashRow.addEventListener("click", () => {
      h.completedToday = !h.completedToday;
      h.streak = h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1);
      saveState();
      renderHabitsChecklist();
    });
    dashboardChecklist.appendChild(dashRow);
  });

  const percentage = state.habits.length > 0 ? Math.round((done / state.habits.length) * 100) : 0;
  document.getElementById("habit-progress-fill").style.width = `${percentage}%`;
  document.getElementById("sb-today-focus-accumulated").textContent = `${percentage}%`;

  lucide.createIcons();
}

// ==========================================================================
// Report calculations
// ==========================================================================
let activeFilteredLogs = [];

function buildSelectedReport() {
  const period = document.getElementById("report-period").value;
  const clientFilter = document.getElementById("report-client-filter").value;
  const previewBody = document.getElementById("report-preview-body");

  previewBody.innerHTML = "";

  activeFilteredLogs = state.timeLogs.filter(log => {
    if (clientFilter !== "all" && log.clientId !== clientFilter) return false;
    return true;
  });

  let totalHours = 0, totalEarnings = 0;
  activeFilteredLogs.forEach(log => {
    totalHours += log.duration;
    totalEarnings += log.earnings;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${log.date}</td>
      <td><strong>${log.clientName}</strong></td>
      <td>${log.duration.toFixed(2)} h</td>
      <td style="color:var(--color-success); font-weight:700;">$${log.earnings.toFixed(2)}</td>
    `;
    previewBody.appendChild(row);
  });

  document.getElementById("report-sum-hours").textContent = `${totalHours.toFixed(2)} h`;
  document.getElementById("report-sum-earnings").textContent = `$${totalEarnings.toFixed(2)}`;
}

function printGeneratedInvoice() {
  if (activeFilteredLogs.length === 0) return alert("Generate report first.");
  const body = document.getElementById("invoice-sheet-body");
  body.innerHTML = "";

  let total = 0;
  activeFilteredLogs.forEach(l => {
    total += l.earnings;
    const row = document.createElement("tr");
    row.innerHTML = `<td>${l.date}</td><td>${l.project}</td><td>${l.duration.toFixed(2)}</td><td>$${l.earnings.toFixed(2)}</td>`;
    body.appendChild(row);
  });

  document.getElementById("invoice-total-due").textContent = `$${total.toFixed(2)}`;
  window.print();
}

// ==========================================================================
// Render Engine
// ==========================================================================
function renderAllViews() {
  renderTimeline();
  renderTasksBoard();
  renderCADWorkspace();
  initDashboardCharts();
}

function renderTimeline() {
  const container = document.getElementById("timeline-slots");
  container.innerHTML = "";

  const todaysTasks = state.tasks.filter(task => task.date === state.currentDate);
  todaysTasks.forEach(task => {
    const [hStr, mStr] = task.startTime.split(":");
    const startHour = parseInt(hStr) + (parseInt(mStr) / 60);
    const topPx = Math.max(0, Math.min(240, ((startHour - 8) / 12) * 250));
    const heightPx = (task.duration / 12) * 250;

    const card = document.createElement("div");
    card.className = `timeline-task-card ${task.category}`;
    card.style.top = `${topPx}px`;
    card.style.height = `${Math.max(50, heightPx)}px`;

    card.innerHTML = `
      <div class="timeline-task-info">
        <h4>${task.title}</h4>
        <p>${task.desc || 'Scheduled CAD block'}</p>
      </div>
      <span class="timeline-task-time">${task.startTime}</span>
    `;
    container.appendChild(card);
  });
}

function renderTasksBoard() {
  const todoList = document.getElementById("todo-list");
  const progressList = document.getElementById("progress-list");
  const doneList = document.getElementById("done-list");

  todoList.innerHTML = "";
  progressList.innerHTML = "";
  doneList.innerHTML = "";

  let todoCount = 0, progressCount = 0, doneCount = 0;

  state.tasks.forEach(task => {
    const card = document.createElement("div");
    card.className = `task-card cat-${task.category}`;
    card.setAttribute("draggable", "true");
    card.setAttribute("ondragstart", `handleDragStart(event, '${task.id}')`);
    card.innerHTML = `
      <div class="task-card-header">
        <h4>${task.title}</h4>
      </div>
      <p>${task.desc || 'Revit model set revisions.'}</p>
      <div class="task-card-footer">
        <span class="task-tag">${task.category}</span>
        <button class="btn-card-action" onclick="deleteTask('${task.id}')"><i data-lucide="trash" style="width:10px; height:10px;"></i></button>
      </div>
    `;

    if (task.status === "todo") {
      todoList.appendChild(card);
      todoCount++;
    } else if (task.status === "progress") {
      progressList.appendChild(card);
      progressCount++;
    } else {
      doneList.appendChild(card);
      doneCount++;
    }
  });

  document.getElementById("todo-badge").textContent = todoCount;
  document.getElementById("progress-badge").textContent = progressCount;
  document.getElementById("done-badge").textContent = doneCount;

  document.getElementById("stats-pending-count").textContent = todoCount + progressCount;
  document.getElementById("stats-done-count").textContent = doneCount;

  lucide.createIcons();
}

window.deleteTask = function(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderAllViews();
};

function renderCADWorkspace() {
  const container = document.getElementById("clients-grid-container");
  const ledgerTable = document.getElementById("ledger-table-body");
  const filter = document.getElementById("report-client-filter");

  container.innerHTML = "";
  ledgerTable.innerHTML = "";
  filter.innerHTML = '<option value="all">All Clients</option>';

  state.clients.forEach(client => {
    const logs = state.timeLogs.filter(log => log.clientId === client.id);
    const earnings = logs.reduce((sum, l) => sum + l.earnings, 0);

    const card = document.createElement("div");
    card.className = "client-card";
    card.innerHTML = `
      <div class="client-card-info">
        <h4>${client.name}</h4>
        <p>${client.project}</p>
        <p style="font-size:0.75rem; color:var(--accent-indigo);">Gross: $${earnings.toFixed(0)}</p>
      </div>
      <span class="client-rate-tag">$${client.rate}/hr</span>
    `;
    container.appendChild(card);

    const opt = document.createElement("option");
    opt.value = client.id;
    opt.textContent = client.name;
    filter.appendChild(opt);
  });

  state.timeLogs.forEach(log => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${log.date}</td>
      <td><strong>${log.clientName}</strong><br><small>${log.project}</small></td>
      <td>${log.notes || 'Revisions drafting'}</td>
      <td>${log.duration.toFixed(2)} h</td>
      <td style="color:var(--color-success); font-weight:700;">$${log.earnings.toFixed(2)}</td>
    `;
    ledgerTable.appendChild(row);
  });
}

// ==========================================================================
// Chart.js Dynamics Redraw (Indigo, Violet, Soft Red, Success Green stops)
// ==========================================================================
function initDashboardCharts() {
  let designHours = 0, consultingHours = 0, personalHours = 0, routineHours = 0;

  state.tasks.forEach(t => {
    if (t.category === "cad") designHours += t.duration;
    else if (t.category === "consulting") consultingHours += t.duration;
    else if (t.category === "personal") personalHours += t.duration;
    else if (t.category === "habits") routineHours += t.duration;
  });

  const loggedBillableHrs = state.timeLogs.reduce((sum, log) => sum + log.duration, 0);
  designHours += loggedBillableHrs;

  const donutData = [designHours, consultingHours, personalHours, routineHours];
  
  if (donutChartObj) donutChartObj.destroy();
  if (barChartObj) barChartObj.destroy();

  const ctxDonut = document.getElementById("donutChart").getContext("2d");
  const purpleGrad = ctxDonut.createLinearGradient(0, 0, 0, 150);
  purpleGrad.addColorStop(0, '#6366F1'); // Indigo Accent
  purpleGrad.addColorStop(1, '#4F46E5');

  const blueGrad = ctxDonut.createLinearGradient(0, 0, 0, 150);
  blueGrad.addColorStop(0, '#8B5CF6'); // Violet Accent
  blueGrad.addColorStop(1, '#7C3AED');

  const orangeGrad = ctxDonut.createLinearGradient(0, 0, 0, 150);
  orangeGrad.addColorStop(0, '#fb7185'); // Soft Red
  orangeGrad.addColorStop(1, '#e11d48');

  const greenGrad = ctxDonut.createLinearGradient(0, 0, 0, 150);
  greenGrad.addColorStop(0, '#10B981'); // Success Green
  greenGrad.addColorStop(1, '#059669');

  donutChartObj = new Chart(ctxDonut, {
    type: 'doughnut',
    data: {
      labels: ['CAD Modelling', 'Admin & Sync', 'Personal Dev', 'Habit Routines'],
      datasets: [{
        data: (designHours + consultingHours + personalHours + routineHours) > 0 ? donutData : [1, 1, 1, 1],
        backgroundColor: [purpleGrad, blueGrad, orangeGrad, greenGrad],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: '76%'
    }
  });

  const ctxBar = document.getElementById("barChart").getContext("2d");
  const barGrad = ctxBar.createLinearGradient(0, 0, 0, 180);
  barGrad.addColorStop(0, 'rgba(99, 102, 241, 0.9)'); 
  barGrad.addColorStop(1, 'rgba(99, 102, 241, 0.15)');

  barChartObj = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Active Hours',
        data: [6.2, 5.0, 7.8, 8.5, 4.5, 2.0, 0],
        backgroundColor: barGrad,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          grid: { color: 'rgba(0, 0, 0, 0.03)' },
          ticks: { color: '#6B7280', font: { family: 'Space Grotesk', size: 9 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#6B7280', font: { family: 'Inter', size: 10 } }
        }
      }
    }
  });
}

// ==========================================================================
// Reminders Alert Checks
// ==========================================================================
let alertedTaskIds = new Set();

function checkReminders() {
  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMin = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHour}:${currentMin}`;

  state.tasks.forEach(task => {
    if (task.date === state.currentDate && 
        task.status !== "done" && 
        task.startTime === currentTimeStr && 
        !alertedTaskIds.has(task.id)) {
      
      alertedTaskIds.add(task.id);
      
      const audio = document.getElementById("audio-alarm");
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(err => console.log("Sound played mock."));
      }

      const container = document.getElementById("toast-container");
      const toast = document.createElement("div");
      toast.className = "toast-alert";
      toast.innerHTML = `
        <i data-lucide="bell" style="color:var(--accent-indigo);"></i>
        <div class="toast-content">
          <h4>AURA Reminder OS</h4>
          <p style="font-weight:600; color:var(--color-text-primary);">${task.title}</p>
          <p style="font-size:0.7rem; color:var(--color-text-secondary);">Starting now at ${task.startTime}</p>
        </div>
      `;
      container.appendChild(toast);
      lucide.createIcons();

      setTimeout(() => {
        container.removeChild(toast);
      }, 5000);
    }
  });
}
