import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Bell, CalendarDays,
  Check, CheckCircle2, ChevronDown, CircleHelp, Flame, Flower2, LayoutDashboard,
  Leaf, Menu, MoreHorizontal, Plus, Settings2, Sparkles, Target, X,
} from 'lucide-react';
import { api } from './api';
import './styles.css';

const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const prettyDate = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const shortDay = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
const idOf = (habit) => habit._id || habit.id;

function App() {
  const [date, setDate] = useState(dateKey(new Date()));
  const [habits, setHabits] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const refresh = useCallback(async (selectedDate = date) => {
    setLoading(true);
    setError('');
    try {
      const [habitData, dashboardData] = await Promise.all([api.habits(selectedDate), api.dashboard(selectedDate)]);
      setHabits(habitData.habits);
      setDashboard(dashboardData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { refresh(date); }, [date, refresh]);
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const completed = habits.filter((habit) => habit.completed).length;
  const completionPercent = habits.length ? Math.round((completed / habits.length) * 100) : 0;
  const week = dashboard?.week || [];
  const habitStreaks = useMemo(() => new Map((dashboard?.habits || []).map((item) => [item.habitId, item.streak])), [dashboard]);
  const dateOffset = (offset) => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + offset);
    setDate(dateKey(next));
  };

  async function toggleHabit(habit) {
    const nextValue = !habit.completed;
    setHabits((items) => items.map((item) => idOf(item) === idOf(habit) ? { ...item, completed: nextValue } : item));
    try {
      await api.checkIn(idOf(habit), date, nextValue);
      const fresh = await api.dashboard(date);
      setDashboard(fresh);
    } catch (err) {
      setHabits((items) => items.map((item) => idOf(item) === idOf(habit) ? { ...item, completed: !nextValue } : item));
      setToast(err.message);
    }
  }

  async function addHabit(payload) {
    try {
      await api.createHabit(payload);
      await refresh(date);
      setModalOpen(false);
      setToast('Your new habit is ready.');
    } catch (err) {
      setToast(err.message);
    }
  }

  async function archiveHabit(habit) {
    try {
      await api.updateHabit(idOf(habit), { archived: true });
      await refresh(date);
      setToast('Habit tucked away. You can still find it in your history.');
    } catch (err) { setToast(err.message); }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Flower2 size={21} strokeWidth={2.5} /></span><span>daynest<span className="brand-dot">.</span></span></div>
        <div className="workspace"><div className="workspace-avatar">M</div><div><strong>My space</strong><small>Personal workspace</small></div><ChevronDown size={15} /></div>
        <div className="nav-label">MENU</div>
        <nav className="nav-list">
          <button className="nav-item active"><LayoutDashboard size={18} /> Overview <span className="nav-pip" /></button>
          <button className="nav-item" onClick={() => document.getElementById('habits')?.scrollIntoView({ behavior: 'smooth' })}><CheckCircle2 size={18} /> My habits <span className="nav-count">{habits.length}</span></button>
          <button className="nav-item" onClick={() => document.getElementById('week-card')?.scrollIntoView({ behavior: 'smooth' })}><CalendarDays size={18} /> Progress</button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip"><span className="tip-icon"><Sparkles size={16} /></span><strong>Little by little</strong><p>Small steps each day add up to big changes.</p><div className="tip-progress"><span /></div><small>Keep your rhythm going</small></div>
        <div className="nav-bottom"><button className="nav-item"><CircleHelp size={18} /> Help & support</button><button className="nav-item"><Settings2 size={18} /> Settings</button></div>
        <div className="profile"><div className="profile-avatar">M</div><div className="profile-info"><strong>Melani R.</strong><small>Free plan</small></div><MoreHorizontal size={19} /></div>
      </aside>
      {mobileNav && <button aria-label="Close menu" className="nav-scrim" onClick={() => setMobileNav(false)} />}

      <main className="main-content">
        <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-actions"><span className="today-pill"><span className="online-dot" /> Your space is growing</span><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="top-avatar">M</div></div></header>

        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR DAILY RHYTHM</div><h1>A little progress,<br className="mobile-break" /> <span>every day.</span></h1><p className="welcome-sub">Make room for the habits that make you feel good.</p></div><div className="date-picker"><button className="date-arrow" aria-label="Previous day" onClick={() => dateOffset(-1)}><ArrowLeft size={16} /></button><div><small>YOUR DAY</small><strong>{prettyDate(date)}</strong></div><button className="date-arrow" aria-label="Next day" onClick={() => dateOffset(1)}><ArrowRight size={16} /></button></div></section>

        {error && <div className="error-banner"><div><strong>We couldn't load your habits</strong><span>{error}</span></div><button onClick={() => refresh(date)}>Try again</button></div>}

        <section className="hero-grid">
          <div className="hero-card"><div className="hero-content"><span className="hero-tag"><Sparkles size={13} /> TODAY'S FOCUS</span><h2>Show up for<br />yourself today.</h2><p>Every check-in is a promise kept to you.</p><button className="hero-button" onClick={() => document.getElementById('habits')?.scrollIntoView({ behavior: 'smooth' })}>Let's do this <ArrowRight size={15} /></button></div><div className="hero-art" aria-hidden="true"><div className="sun-glow" /><div className="art-cloud cloud-one" /><div className="art-cloud cloud-two" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="plant plant-one">✿</div><div className="plant plant-two">✦</div><div className="art-person"><div className="person-head" /><div className="person-hair" /><div className="person-body" /><div className="person-arm" /><div className="person-leg leg-one" /><div className="person-leg leg-two" /><div className="person-pot" /></div><span className="floating-star star-a">✳</span><span className="floating-star star-b">✦</span></div><div className="hero-bottom"><span><span className="hero-check"><Check size={12} /></span> One day at a time</span><span className="hero-bottom-note">YOU'VE GOT THIS <span>↗</span></span></div></div>
          <div className="progress-card"><div className="card-heading"><div><span className="section-kicker">YOUR MOMENTUM</span><h3>Daily progress</h3></div><button className="dots-button" aria-label="More options"><MoreHorizontal size={20} /></button></div><div className="progress-main"><div className="progress-ring" style={{ '--progress': `${completionPercent * 3.6}deg` }}><div className="ring-inner"><strong>{completionPercent}<small>%</small></strong><span>complete</span></div></div><div className="progress-copy"><span className="progress-label">{completionPercent === 100 && habits.length ? 'Beautifully done!' : completed ? 'Nice momentum!' : 'A fresh start'}</span><p>{habits.length ? `${completed} of ${habits.length} habits checked off` : 'Your daily ritual starts here'}</p><div className="mini-progress"><span style={{ width: `${completionPercent}%` }} /></div><small>{Math.max(0, habits.length - completed)} more to reach your daily goal</small></div></div><div className="progress-footer"><span><span className="footer-dot lime" /> Done today</span><strong>{completed}<small>/{habits.length}</small></strong></div><div className="progress-caption"><span className="tiny-spark">✳</span> Consistency feels good, doesn't it?</div></div>
        </section>

        <section className="content-grid">
          <div className="habits-panel" id="habits"><div className="panel-heading"><div><span className="section-kicker">YOUR ROUTINE</span><h2>Today's habits <span className="soft-count">{habits.length}</span></h2><p>One small promise at a time.</p></div><button className="add-button" onClick={() => setModalOpen(true)}><Plus size={17} /><span>Add habit</span></button></div>
            {loading && !habits.length ? <div className="loading-state"><span className="loader" /> Gathering your day...</div> : habits.length ? <div className="habit-list">{habits.map((habit, index) => <HabitRow key={idOf(habit)} habit={habit} streak={habitStreaks.get(String(idOf(habit))) || 0} index={index} onToggle={() => toggleHabit(habit)} onArchive={() => archiveHabit(habit)} />)}</div> : <div className="empty-state"><div className="empty-flower">✿</div><strong>A lovely day to begin</strong><p>Add a habit you'd like to make part of your routine.</p><button onClick={() => setModalOpen(true)}><Plus size={16} /> Create your first habit</button></div>}
            <button className="view-all" onClick={() => setModalOpen(true)}>Build your routine <ArrowRight size={15} /></button>
          </div>
          <div className="week-card" id="week-card"><div className="week-heading"><div><span className="section-kicker">YOUR CONSISTENCY</span><h3>This week</h3></div><button className="week-select">This week <ChevronDown size={14} /></button></div><div className="week-chart"><div className="chart-labels"><span>100%</span><span>50%</span><span>0%</span></div><div className="chart-area"><div className="chart-gridline line-top" /><div className="chart-gridline line-middle" /><div className="chart-gridline line-bottom" /><div className="chart-bars">{week.map((day) => { const pct = day.scheduled ? Math.round((day.completed / day.scheduled) * 100) : 0; const selected = day.date === date; return <div className={`chart-day ${selected ? 'selected' : ''}`} key={day.date}><div className="bar-track"><div className="bar-fill" style={{ height: `${Math.max(pct, day.scheduled ? 9 : 4)}%` }}><span>{pct > 0 ? `${pct}%` : ''}</span></div></div><span className="day-label">{shortDay(day.date).slice(0, 1)}</span></div>; })}</div></div></div><div className="week-summary"><div className="summary-icon"><Activity size={17} /></div><div><strong>{week.reduce((sum, day) => sum + day.completed, 0)} <span>check-ins this week</span></strong><small>{week.reduce((sum, day) => sum + day.scheduled, 0) ? 'Every little win counts. Keep your rhythm.' : 'Add a habit to start seeing your progress.'}</small></div><div className="trend"><ArrowUpRight size={15} /></div></div><div className="streak-highlight"><div className="streak-orbit"><Flame size={17} fill="currentColor" /></div><div><strong>Keep your spark alive</strong><span>{Math.max(0, habits.reduce((max, habit) => Math.max(max, habitStreaks.get(String(idOf(habit))) || 0), 0))} day best streak <span className="sparkle-small">✦</span></span></div><ArrowDownRight className="streak-arrow" size={16} /></div></div>
        </section>

        <footer className="page-footer"><span>Made for the days you're becoming <span>✿</span></span><span>DAYNEST <i>·</i> YOUR SPACE TO GROW</span></footer>
      </main>
      {modalOpen && <HabitModal onClose={() => setModalOpen(false)} onSubmit={addHabit} />}
      {toast && <div role="status" className="toast"><span className="toast-mark"><Check size={14} /></span>{toast}<button aria-label="Dismiss" onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  );
}

function HabitRow({ habit, streak, index, onToggle, onArchive }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const colors = ['#faeee6', '#e8eff7', '#f1edfa', '#edf3e8', '#f9f0dc'];
  return <div className={`habit-row ${habit.completed ? 'habit-complete' : ''}`} style={{ '--row-delay': `${index * 55}ms` }}><button className={`habit-check ${habit.completed ? 'checked' : ''}`} onClick={onToggle} aria-label={habit.completed ? `Mark ${habit.name} incomplete` : `Complete ${habit.name}`}>{habit.completed && <Check size={15} strokeWidth={3} />}</button><div className="habit-icon" style={{ background: colors[index % colors.length], color: habit.color || '#7d9b55' }}><Leaf size={18} /></div><div className="habit-detail"><strong>{habit.name}</strong><span>{habit.description || 'A little progress goes a long way'}</span></div><div className="habit-meta"><span className={`streak-chip ${streak ? 'has-streak' : ''}`}><Flame size={13} /> {streak} <small>day{streak === 1 ? '' : 's'}</small></span><span className="habit-time">{habit.schedule?.length === 7 ? 'Every day' : `${habit.schedule?.length || 0} days / week`}</span></div><div className="habit-menu-wrap"><button className="habit-menu" aria-label={`Options for ${habit.name}`} onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={18} /></button>{menuOpen && <><button className="menu-dismiss" aria-label="Close menu" onClick={() => setMenuOpen(false)} /><div className="habit-menu-pop"><button onClick={() => { setMenuOpen(false); onArchive(); }}>Archive habit</button></div></>}</div></div>;
}

function HabitModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [saving, setSaving] = useState(false);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const toggleDay = (day) => setSelectedDays((previous) => previous.includes(day) ? previous.filter((item) => item !== day) : [...previous, day].sort());
  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || !selectedDays.length) return;
    setSaving(true);
    await onSubmit({ name: name.trim(), description: description.trim(), schedule: selectedDays });
    setSaving(false);
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="habit-modal" onSubmit={submit}><div className="modal-top"><div className="modal-icon"><Target size={20} /></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div><span className="section-kicker">A NEW LITTLE RITUAL</span><h2>Make it a habit.</h2><p className="modal-intro">Choose something that would make your everyday feel a bit better.</p><label className="field-label">Habit name<input autoFocus maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Read for 15 minutes" /></label><label className="field-label">A little note <span className="optional">OPTIONAL</span><input maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does this look like for you?" /></label><div className="field-label">Repeat on <span className="optional">PICK YOUR DAYS</span><div className="day-picker">{days.map((day, index) => <button type="button" key={index} className={selectedDays.includes(index) ? 'day-picked' : ''} onClick={() => toggleDay(index)}>{day}</button>)}</div></div>{!selectedDays.length && <small className="form-error">Choose at least one day to keep your rhythm.</small>}<button className="modal-submit" disabled={saving || !name.trim() || !selectedDays.length}>{saving ? 'Adding your habit…' : 'Add to my routine'} <ArrowRight size={16} /></button></form></div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
