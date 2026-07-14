import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle2, Clock, Plus, Trash2, Edit3, Send, Search, BrainCircuit, Sparkles
} from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function PlannerView({
  user,
  tasks = [],
  setTasks,
  meetings = [],
  setMeetings,
  birthdays = [],
  setBirthdays,
  reminders = [],
  setReminders,
  personalTasks = [],
  setPersonalTasks,
  habits = [],
  setHabits,
  triggerToast
}) {
  // Calendar states
  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'week' | 'day'
  const [calendarFilter, setCalendarFilter] = useState('All');
  const [calendarSearchQuery, setCalendarSearchQuery] = useState('');
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Personal tasks & Habits states
  const [showPersonalTaskModal, setShowPersonalTaskModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingPersonalTask, setEditingPersonalTask] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);
  const [personalTrackerCategoryFilter, setPersonalTrackerCategoryFilter] = useState('All');

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

  // Calendar utility calculations
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (month, year) => new Date(year, month, 1).getDay();

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
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleCalendarDateClick = (dayNum) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
    setShowDayDetailModal(true);
  };

  // Quick reminder & task addition
  const handleQuickAddReminder = async (selectedDate, title) => {
    if (!title) return;
    const record = {
      title,
      reminder_date: selectedDate,
      user_id: user?.id
    };
    let saved = false;
    if (supabase && user?.id) {
      const { data, error } = await supabase.from('reminders').insert([record]).select();
      if (!error && data) {
        saved = true;
        setReminders(prev => [...prev, { ...data[0], due_date: data[0].reminder_date }]);
      }
    }
    if (!saved) {
      const fallback = { id: 'rem_' + Date.now(), title, due_date: selectedDate };
      setReminders(prev => [...prev, fallback]);
    }
    triggerToast("Reminder added.");
  };

  const handleQuickAddTask = async (selectedDate, title) => {
    if (!title) return;
    const record = {
      title,
      priority: 'Medium',
      due_date: selectedDate,
      completed: false,
      user_id: user?.id
    };
    let saved = false;
    if (supabase && user?.id) {
      const { data, error } = await supabase.from('tasks').insert([record]).select();
      if (!error && data) {
        saved = true;
        setTasks(prev => [...prev, { ...data[0], dueDate: data[0].due_date }]);
      }
    }
    if (!saved) {
      const fallback = { id: 'tsk_' + Date.now(), title, priority: 'Medium', dueDate: selectedDate, completed: false };
      setTasks(prev => [...prev, fallback]);
    }
    triggerToast("Task added.");
  };

  // Personal tasks CRUD handlers
  const handleSavePersonalTask = async (e) => {
    e.preventDefault();
    if (!personalTaskForm.title) return;

    const record = {
      title: personalTaskForm.title,
      category: personalTaskForm.category,
      priority: personalTaskForm.priority,
      due_date: personalTaskForm.due_date,
      reminder_date: personalTaskForm.reminder_date || null,
      status: personalTaskForm.status,
      completion_percentage: parseInt(personalTaskForm.completion_percentage) || 0,
      notes: personalTaskForm.notes || '',
      user_id: user?.id
    };

    let saved = false;
    if (supabase && user?.id) {
      if (editingPersonalTask && !String(editingPersonalTask.id).startsWith('pt_')) {
        const { error } = await supabase.from('personal_tasks').update(record).eq('id', editingPersonalTask.id);
        if (!error) saved = true;
      } else {
        const { data, error } = await supabase.from('personal_tasks').insert([record]).select();
        if (!error && data) {
          saved = true;
          setPersonalTasks(prev => [...prev, data[0]]);
        }
      }
    }

    if (saved) {
      // Re-fetch or locally update
      triggerToast("Personal task synchronized with database.");
    } else {
      if (editingPersonalTask) {
        const updated = personalTasks.map(t => t.id === editingPersonalTask.id ? { ...t, ...personalTaskForm } : t);
        setPersonalTasks(updated);
      } else {
        const added = { ...personalTaskForm, id: 'pt_' + Date.now() };
        setPersonalTasks(prev => [...prev, added]);
      }
      triggerToast("Personal task updated locally.");
    }

    setShowPersonalTaskModal(false);
    setEditingPersonalTask(null);
  };

  const handleMarkPersonalTaskDone = async (id) => {
    let saved = false;
    if (supabase && user?.id && !String(id).startsWith('pt_')) {
      const { error } = await supabase.from('personal_tasks').update({ status: 'Done', completion_percentage: 100 }).eq('id', id);
      if (!error) saved = true;
    }
    const updated = personalTasks.map(t => t.id === id ? { ...t, status: 'Done', completion_percentage: 100 } : t);
    setPersonalTasks(updated);
    triggerToast("Task marked as completed.");
  };

  const handleDeletePersonalTask = async (id) => {
    if (supabase && user?.id && !String(id).startsWith('pt_')) {
      await supabase.from('personal_tasks').delete().eq('id', id);
    }
    setPersonalTasks(prev => prev.filter(t => t.id !== id));
    triggerToast("Task deleted.");
  };

  // Habits CRUD handlers
  const handleSaveHabit = async (e) => {
    e.preventDefault();
    if (!habitForm.habit_name) return;

    const record = {
      habit_name: habitForm.habit_name,
      frequency: habitForm.frequency,
      streak_count: parseInt(habitForm.streak_count) || 0,
      last_completed_date: habitForm.last_completed_date || null,
      status: habitForm.status,
      user_id: user?.id
    };

    let saved = false;
    if (supabase && user?.id) {
      if (editingHabit && !String(editingHabit.id).startsWith('h_')) {
        const { error } = await supabase.from('habits').update(record).eq('id', editingHabit.id);
        if (!error) saved = true;
      } else {
        const { data, error } = await supabase.from('habits').insert([record]).select();
        if (!error && data) {
          saved = true;
          setHabits(prev => [...prev, data[0]]);
        }
      }
    }

    if (!saved) {
      if (editingHabit) {
        const updated = habits.map(h => h.id === editingHabit.id ? { ...h, ...habitForm } : h);
        setHabits(updated);
      } else {
        const added = { ...habitForm, id: 'h_' + Date.now() };
        setHabits(prev => [...prev, added]);
      }
    }
    triggerToast("Habit settings saved.");
    setShowHabitModal(false);
    setEditingHabit(null);
  };

  const handleCompleteHabit = async (id) => {
    const today = new Date().toISOString().split('T')[0];
    const target = habits.find(h => h.id === id);
    if (!target) return;
    const nextStreak = (target.streak_count || 0) + 1;
    
    let saved = false;
    if (supabase && user?.id && !String(id).startsWith('h_')) {
      const { error } = await supabase.from('habits').update({ streak_count: nextStreak, last_completed_date: today }).eq('id', id);
      if (!error) saved = true;
    }
    const updated = habits.map(h => h.id === id ? { ...h, streak_count: nextStreak, last_completed_date: today } : h);
    setHabits(updated);
    triggerToast("Habit checked off!");
  };

  const handleResetHabit = async (id) => {
    let saved = false;
    if (supabase && user?.id && !String(id).startsWith('h_')) {
      const { error } = await supabase.from('habits').update({ streak_count: 0 }).eq('id', id);
      if (!error) saved = true;
    }
    const updated = habits.map(h => h.id === id ? { ...h, streak_count: 0 } : h);
    setHabits(updated);
    triggerToast("Streak reset.");
  };

  const handleDeleteHabit = async (id) => {
    if (supabase && user?.id && !String(id).startsWith('h_')) {
      await supabase.from('habits').delete().eq('id', id);
    }
    setHabits(prev => prev.filter(h => h.id !== id));
    triggerToast("Habit removed.");
  };

  // Day detail modal calendar events helper
  const getDayEvents = (dateStr) => {
    const ev = [];
    meetings.filter(m => m.date === dateStr).forEach(m => ev.push({ type: 'Meeting', text: `${m.time} - ${m.title}`, color: '#D7263D' }));
    tasks.filter(t => t.dueDate === dateStr).forEach(t => ev.push({ type: 'Task', text: `${t.title} (${t.priority})`, color: t.completed ? '#10B981' : '#F59E0B' }));
    reminders.filter(r => r.due_date === dateStr).forEach(r => ev.push({ type: 'Reminder', text: r.title, color: '#3B82F6' }));
    personalTasks.filter(pt => pt.due_date === dateStr).forEach(pt => ev.push({ type: 'Personal', text: pt.title, color: '#EC4899' }));
    return ev;
  };

  return (
    <div>
      {/* Calendar Header / Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Interlocking Operations</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '4px 0 0 0', color: 'var(--text-primary)' }}>Daily Planner & Tracker</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => { setPersonalTaskForm({ title: '', category: 'Personal Tasks', priority: 'Medium', due_date: new Date().toISOString().split('T')[0], reminder_date: '', status: 'Pending', completion_percentage: 0, notes: '' }); setShowPersonalTaskModal(true); }}>➕ New Task</button>
          <button className="btn btn-primary" onClick={() => { setHabitForm({ habit_name: '', frequency: 'Daily', streak_count: 0, last_completed_date: '', status: 'Active' }); setShowHabitModal(true); }}>➕ New Habit</button>
        </div>
      </div>

      {/* Calendar Navigation Block */}
      <div className="card" style={{ padding: '20px', background: 'var(--bg-sidebar)', borderLeft: '3px solid var(--accent)', marginBottom: '24px', margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '850', margin: 0, color: 'var(--text-primary)' }}>
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', minWidth: 'auto' }} onClick={handlePrevMonth}>◀</button>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', minWidth: 'auto' }} onClick={handleToday}>Today</button>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', minWidth: 'auto' }} onClick={handleNextMonth}>▶</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {['month', 'week', 'day'].map(view => (
              <button 
                key={view} 
                className="btn" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', background: calendarView === view ? 'var(--accent)' : 'none', color: '#F5F5F5' }}
                onClick={() => setCalendarView(view)}
              >
                {view.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid Render */}
        <div style={{ marginTop: '20px' }}>
          {calendarView === 'month' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', padding: '6px 0', color: 'var(--text-muted)' }}>{d}</div>
              ))}
              
              {Array.from({ length: firstDayIndex(currentMonth, currentYear) }).map((_, idx) => (
                <div key={`empty-${idx}`} style={{ minHeight: '80px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid transparent' }} />
              ))}

              {Array.from({ length: daysInMonth(currentMonth, currentYear) }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const ev = getDayEvents(dateStr);
                const isSelected = selectedDateStr === dateStr;

                return (
                  <div 
                    key={dayNum} 
                    className="calendar-day" 
                    style={{ minHeight: '85px', background: isSelected ? 'rgba(215, 38, 61, 0.12)' : 'rgba(255,255,255,0.02)', border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'all 0.15s ease' }}
                    onClick={() => handleCalendarDateClick(dayNum)}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isSelected ? 'var(--accent)' : 'var(--text-secondary)' }}>{dayNum}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden', flex: 1 }}>
                      {ev.slice(0, 3).map((e, index) => (
                        <div key={index} style={{ fontSize: '0.65rem', padding: '2px 4px', borderRadius: '3px', background: e.color, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {e.text}
                        </div>
                      ))}
                      {ev.length > 3 && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'right' }}>+{ev.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Week & Day Placeholders */}
          {calendarView !== 'month' && (
            <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
              Full interlocking timeline schedules view is best viewed in Month configuration. Click Month button to display full layout.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout for Personal Checklists and Habits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
        
        {/* Personal Tasks Checklist */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '750', color: 'var(--text-primary)', margin: 0 }}>🎯 Personal Tasks Checklist</h3>
            <select 
              className="btn btn-secondary" 
              style={{ fontSize: '0.75rem', padding: '4px 8px', minHeight: 'auto' }}
              value={personalTrackerCategoryFilter} 
              onChange={(e) => setPersonalTrackerCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Personal Tasks">Personal Tasks</option>
              <option value="Learning Goals">Learning Goals</option>
              <option value="Health & Fitness">Health & Fitness</option>
              <option value="Bills & Payments">Bills & Payments</option>
              <option value="Family / Home Work">Family / Home Work</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {personalTasks
              .filter(pt => personalTrackerCategoryFilter === 'All' || pt.category === personalTrackerCategoryFilter)
              .map(pt => (
                <div key={pt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderLeft: pt.status === 'Done' ? '3px solid #10B981' : '3px solid var(--accent)', padding: '10px 12px', borderRadius: '0 6px 6px 0' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', textDecoration: pt.status === 'Done' ? 'line-through' : 'none', color: pt.status === 'Done' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {pt.title}
                      </span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.6, background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{pt.category}</span>
                    </div>
                    {pt.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{pt.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {pt.status !== 'Done' && (
                      <button className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '0.7rem', minHeight: '26px' }} onClick={() => handleMarkPersonalTaskDone(pt.id)}>✔ Complete</button>
                    )}
                    <button className="btn btn-secondary" style={{ padding: '4px', minWidth: 'auto', minHeight: 'auto', color: 'var(--color-danger)' }} onClick={() => handleDeletePersonalTask(pt.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            {personalTasks.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>No personal tasks yet.</p>
            )}
          </div>
        </div>

        {/* Habits Completion Tracker */}
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '750', color: 'var(--text-primary)', marginBottom: '18px' }}>🔥 Habit Streak Builder</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {habits.map(h => {
              const completedToday = h.last_completed_date === new Date().toISOString().split('T')[0];
              return (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #3B82F6', padding: '10px 12px', borderRadius: '0 6px 6px 0' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{h.habit_name}</strong>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span>Frequency: {h.frequency}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: '600' }}>Streak: {h.streak_count || 0} days</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn" 
                      style={{ padding: '4px 10px', fontSize: '0.7rem', background: completedToday ? '#10B981' : 'var(--accent)', color: 'white', border: 'none', minHeight: '26px' }} 
                      onClick={() => handleCompleteHabit(h.id)}
                      disabled={completedToday}
                    >
                      {completedToday ? 'Done 🟢' : 'Tick'}
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', minHeight: '26px' }} onClick={() => handleResetHabit(h.id)}>Reset</button>
                    <button className="btn btn-secondary" style={{ padding: '4px', minWidth: 'auto', minHeight: 'auto', color: 'var(--color-danger)' }} onClick={() => handleDeleteHabit(h.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
            {habits.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>Add a daily habit checklist to begin streaking.</p>
            )}
          </div>
        </div>

      </div>

      {/* Day Details Modal */}
      {showDayDetailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '750', color: 'var(--text-primary)', margin: 0 }}>📅 Schedule for {selectedDateStr}</h3>
              <button className="btn" style={{ border: 'none', background: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem' }} onClick={() => setShowDayDetailModal(false)}>✕</button>
            </div>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {getDayEvents(selectedDateStr).map((ev, index) => (
                <div key={index} style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${ev.color}`, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  <strong>[{ev.type}]</strong> {ev.text}
                </div>
              ))}
              {getDayEvents(selectedDateStr).length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No events scheduled for this day.</p>
              )}
            </div>

            {/* Quick Add Forms */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)' }}>Quick Add Activity</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Task / Reminder title..." 
                  value={quickTitle} 
                  onChange={(e) => setQuickTitle(e.target.value)} 
                  style={{ flex: 1, fontSize: '0.8rem' }}
                />
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => { handleQuickAddTask(selectedDateStr, quickTitle); setQuickTitle(''); }}>+ Task</button>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => { handleQuickAddReminder(selectedDateStr, quickTitle); setQuickTitle(''); }}>+ Reminder</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Task Create Modal */}
      {showPersonalTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>🎯 Add Personal Task</h3>
            <form onSubmit={handleSavePersonalTask}>
              <div className="form-group">
                <label className="form-label">Task Name *</label>
                <input type="text" className="form-input" value={personalTaskForm.title} onChange={(e) => setPersonalTaskForm({...personalTaskForm, title: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={personalTaskForm.category} onChange={(e) => setPersonalTaskForm({...personalTaskForm, category: e.target.value})}>
                    <option value="Personal Tasks">Personal Tasks</option>
                    <option value="Learning Goals">Learning Goals</option>
                    <option value="Health & Fitness">Health & Fitness</option>
                    <option value="Bills & Payments">Bills & Payments</option>
                    <option value="Family / Home Work">Family / Home Work</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={personalTaskForm.priority} onChange={(e) => setPersonalTaskForm({...personalTaskForm, priority: e.target.value})}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={personalTaskForm.due_date} onChange={(e) => setPersonalTaskForm({...personalTaskForm, due_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Reminder Date</label>
                  <input type="date" className="form-input" value={personalTaskForm.reminder_date} onChange={(e) => setPersonalTaskForm({...personalTaskForm, reminder_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes & Guidelines</label>
                <textarea className="form-input" value={personalTaskForm.notes} onChange={(e) => setPersonalTaskForm({...personalTaskForm, notes: e.target.value})} rows="2" />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowPersonalTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Habit Create Modal */}
      {showHabitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>🔥 Add Streaking Habit</h3>
            <form onSubmit={handleSaveHabit}>
              <div className="form-group">
                <label className="form-label">Habit Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Read tech documentation" value={habitForm.habit_name} onChange={(e) => setHabitForm({...habitForm, habit_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select className="form-input" value={habitForm.frequency} onChange={(e) => setHabitForm({...habitForm, frequency: e.target.value})}>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowHabitModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Habit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
