/**
 * EduTrack — Modern Student Task Manager
 * Full client-side application logic with LocalStorage persistence.
 */

// ============================================================================
// DEFAULT SEED DATA & CONSTANTS
// ============================================================================

const DEFAULT_SUBJECTS = [
    { id: 'subj-1', name: 'Computer Science', code: 'CS201', color: '#6366f1' },
    { id: 'subj-2', name: 'Calculus & Math', code: 'MATH105', color: '#3b82f6' },
    { id: 'subj-3', name: 'Physics Mechanics', code: 'PHYS110', color: '#06b6d4' },
    { id: 'subj-4', name: 'Organic Chemistry', code: 'CHEM120', color: '#10b981' },
    { id: 'subj-5', name: 'World History', code: 'HIST204', color: '#f59e0b' },
    { id: 'subj-6', name: 'Literature & Composition', code: 'ENG101', color: '#ec4899' }
];

const DEFAULT_PROFILE = {
    name: 'Alex Morgan',
    major: 'Computer Science • Year 2',
    avatarSeed: 'Alex',
    dailyGoal: 5,
    defaultPriority: 'Medium',
    soundEnabled: true,
    confettiEnabled: true
};

const AVATAR_SEEDS = ['Alex', 'Felix', 'Aneka', 'Sammy', 'Midnight', 'Milo', 'Luna', 'Oliver'];

// Generate initial sample tasks with dynamic relative dates (Overdue, Today, Tomorrow, Next Week)
function generateInitialTasks() {
    const now = new Date();
    
    // Yesterday (Overdue)
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(17, 0, 0, 0);

    // Today evening
    const today = new Date(now);
    today.setHours(20, 30, 0, 0);

    // Tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    // In 3 days
    const inThreeDays = new Date(now);
    inThreeDays.setDate(now.getDate() + 3);
    inThreeDays.setHours(23, 59, 0, 0);

    // In 5 days
    const inFiveDays = new Date(now);
    inFiveDays.setDate(now.getDate() + 5);
    inFiveDays.setHours(18, 0, 0, 0);

    return [
        {
            id: 'task-101',
            title: 'Complete Binary Search Tree Implementation',
            description: 'Implement insertion, deletion, and level-order traversal in C++. Test against edge cases provided in assignment sheet.',
            subjectId: 'subj-1',
            priority: 'High',
            dueDate: yesterday.toISOString(),
            status: 'Pending',
            createdAt: new Date(now.getTime() - 86400000 * 3).toISOString()
        },
        {
            id: 'task-102',
            title: 'Calculus Problem Set #4: Integration by Parts',
            description: 'Solve problems 12 through 35 on Chapter 7.2. Write out step-by-step proofs for questions 28 and 30.',
            subjectId: 'subj-2',
            priority: 'High',
            dueDate: today.toISOString(),
            status: 'In Progress',
            createdAt: new Date(now.getTime() - 86400000 * 2).toISOString()
        },
        {
            id: 'task-103',
            title: 'Physics Lab Report: Rotational Dynamics',
            description: 'Calculate moment of inertia from experimental sensor data and plot torque vs angular acceleration graphs.',
            subjectId: 'subj-3',
            priority: 'Medium',
            dueDate: tomorrow.toISOString(),
            status: 'Pending',
            createdAt: new Date(now.getTime() - 86400000).toISOString()
        },
        {
            id: 'task-104',
            title: 'Read Chapters 4-6 of Renaissance History',
            description: 'Prepare short 200-word discussion post for seminar debate on Thursday morning.',
            subjectId: 'subj-5',
            priority: 'Low',
            dueDate: inThreeDays.toISOString(),
            status: 'In Progress',
            createdAt: new Date().toISOString()
        },
        {
            id: 'task-105',
            title: 'Organic Chemistry Pre-Lab Quiz Preparation',
            description: 'Review reaction mechanisms for electrophilic aromatic substitution and resonance structures.',
            subjectId: 'subj-4',
            priority: 'Medium',
            dueDate: inFiveDays.toISOString(),
            status: 'Completed',
            createdAt: new Date(now.getTime() - 86400000 * 4).toISOString()
        },
        {
            id: 'task-106',
            title: 'Literature Analytical Essay Outline',
            description: 'Draft thesis statement and gather three primary text citations comparing narrative structures.',
            subjectId: 'subj-6',
            priority: 'Low',
            dueDate: new Date(now.getTime() + 86400000 * 7).toISOString(),
            status: 'Completed',
            createdAt: new Date(now.getTime() - 86400000 * 5).toISOString()
        }
    ];
}

// ============================================================================
// APPLICATION STATE
// ============================================================================

class AppState {
    constructor() {
        this.tasks = this.load('edutrack_tasks', generateInitialTasks());
        this.subjects = this.load('edutrack_subjects', DEFAULT_SUBJECTS);
        this.profile = this.load('edutrack_profile', DEFAULT_PROFILE);
        this.theme = localStorage.getItem('edutrack_theme') || 'dark';

        // UI View State
        this.currentView = 'dashboard';
        this.statusFilter = 'All'; // 'All' | 'Pending' | 'In Progress' | 'Completed'
        this.subjectFilter = 'All';
        this.priorityFilter = 'All';
        this.searchQuery = '';
        this.sortBy = 'due-asc';
        this.layoutMode = 'grid'; // 'grid' | 'list'
        this.dashboardMiniFilter = 'all';

        // Modal / Active Target State
        this.editingTaskId = null;
        this.activeDetailTaskId = null;
        this.confirmCallback = null;

        // Pomodoro State
        this.timerMode = 'pomodoro'; // 'pomodoro' | 'shortBreak' | 'longBreak'
        this.timerDuration = 25 * 60; // in seconds
        this.timerRemaining = 25 * 60;
        this.timerRunning = false;
        this.timerInterval = null;
        this.pomoSessions = parseInt(localStorage.getItem('edutrack_pomo_sessions') || '0', 10);
        this.pomoMinutes = parseInt(localStorage.getItem('edutrack_pomo_minutes') || '0', 10);
    }

    load(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            console.warn(`Failed to parse ${key} from storage:`, e);
            return fallback;
        }
    }

    saveTasks() {
        localStorage.setItem('edutrack_tasks', JSON.stringify(this.tasks));
    }

    saveSubjects() {
        localStorage.setItem('edutrack_subjects', JSON.stringify(this.subjects));
    }

    saveProfile() {
        localStorage.setItem('edutrack_profile', JSON.stringify(this.profile));
    }

    saveTheme() {
        localStorage.setItem('edutrack_theme', this.theme);
    }

    savePomoStats() {
        localStorage.setItem('edutrack_pomo_sessions', this.pomoSessions.toString());
        localStorage.setItem('edutrack_pomo_minutes', this.pomoMinutes.toString());
    }

    getSubject(id) {
        return this.subjects.find(s => s.id === id) || { name: 'General', color: '#6366f1', code: '' };
    }
}

const state = new AppState();

// ============================================================================
// AUDIO & NOTIFICATION HELPERS
// ============================================================================

class SoundManager {
    static playSuccess() {
        if (!state.profile.soundEnabled) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
            
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } catch (e) {}
    }

    static playChime() {
        if (!state.profile.soundEnabled) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();

            const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.08);
                osc.stop(ctx.currentTime + i * 0.08 + 0.3);
            });
        } catch (e) {}
    }
}

function showToast(message, type = 'info', iconName = 'check') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 4000);
}

function triggerConfetti() {
    if (!state.profile.confettiEnabled || typeof confetti !== 'function') return;
    confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6']
    });
}

// ============================================================================
// DATE & TIME FORMATTING HELPERS
// ============================================================================

function isOverdue(dateString, status) {
    if (status === 'Completed') return false;
    const due = new Date(dateString);
    return due.getTime() < Date.now();
}

function isDueToday(dateString) {
    const due = new Date(dateString);
    const now = new Date();
    return due.toDateString() === now.toDateString();
}

function formatDueDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'No date';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today, ${timeStr}`;
    if (isTomorrow) return `Tomorrow, ${timeStr}`;

    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

function formatDateTimeForInput(dateString) {
    const date = dateString ? new Date(dateString) : new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
}

function getRelativeDeadlineText(dateString, status) {
    if (status === 'Completed') return { text: 'Completed', className: 'completed' };
    const due = new Date(dateString).getTime();
    const diff = due - Date.now();

    if (diff < 0) {
        const hoursAgo = Math.floor(Math.abs(diff) / 3600000);
        if (hoursAgo < 24) return { text: `Overdue by ${hoursAgo || 1}h`, className: 'urgent' };
        const daysAgo = Math.floor(hoursAgo / 24);
        return { text: `Overdue by ${daysAgo}d`, className: 'urgent' };
    }

    const hoursLeft = Math.floor(diff / 3600000);
    if (hoursLeft < 1) return { text: 'Due in minutes!', className: 'urgent' };
    if (hoursLeft < 24) return { text: `Due in ${hoursLeft}h`, className: 'today' };

    const daysLeft = Math.floor(hoursLeft / 24);
    if (daysLeft === 1) return { text: 'Due tomorrow', className: 'today' };
    return { text: `Due in ${daysLeft} days`, className: '' };
}

// ============================================================================
// CORE UI RENDERING
// ============================================================================

function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const switchEl = document.getElementById('settingsThemeSwitch');
    if (switchEl) switchEl.checked = theme === 'dark';
    state.saveTheme();
}

function updateProfileUI() {
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${state.profile.avatarSeed}&backgroundColor=6366f1`;

    const els = {
        name: document.getElementById('userNameDisplay'),
        headerName: document.getElementById('headerNameDisplay'),
        major: document.getElementById('userMajorDisplay'),
        avatar: document.getElementById('userAvatarImg'),
        headerAvatar: document.getElementById('headerAvatarImg'),
        settingsAvatar: document.getElementById('settingsAvatarPreview'),
        greeting: document.getElementById('greetingTitle')
    };

    if (els.name) els.name.textContent = state.profile.name;
    if (els.headerName) els.headerName.textContent = state.profile.name;
    if (els.major) els.major.textContent = state.profile.major;
    if (els.avatar) els.avatar.src = avatarUrl;
    if (els.headerAvatar) els.headerAvatar.src = avatarUrl;
    if (els.settingsAvatar) els.settingsAvatar.src = avatarUrl;
    if (els.greeting) els.greeting.textContent = `Welcome back, ${state.profile.name.split(' ')[0]}! 👋`;

    // Populate settings inputs
    const nameInput = document.getElementById('settingsStudentName');
    const majorInput = document.getElementById('settingsStudentMajor');
    const goalInput = document.getElementById('settingsDailyTaskGoal');
    const prioInput = document.getElementById('settingsDefaultPriority');
    const soundInput = document.getElementById('settingsSoundSwitch');
    const confettiInput = document.getElementById('settingsConfettiSwitch');

    if (nameInput) nameInput.value = state.profile.name;
    if (majorInput) majorInput.value = state.profile.major;
    if (goalInput) goalInput.value = state.profile.dailyGoal;
    if (prioInput) prioInput.value = state.profile.defaultPriority;
    if (soundInput) soundInput.checked = state.profile.soundEnabled;
    if (confettiInput) confettiInput.checked = state.profile.confettiEnabled;
}

function renderAvatarSeeds() {
    const container = document.getElementById('avatarSeedsContainer');
    if (!container) return;

    container.innerHTML = AVATAR_SEEDS.map(seed => {
        const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=6366f1`;
        const isActive = state.profile.avatarSeed === seed ? 'active' : '';
        return `
            <div class="avatar-seed-choice ${isActive}" data-seed="${seed}" title="${seed}">
                <img src="${url}" alt="${seed}">
            </div>
        `;
    }).join('');

    container.querySelectorAll('.avatar-seed-choice').forEach(el => {
        el.addEventListener('click', () => {
            container.querySelectorAll('.avatar-seed-choice').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
            const seed = el.dataset.seed;
            state.profile.avatarSeed = seed;
            const preview = document.getElementById('settingsAvatarPreview');
            if (preview) preview.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=6366f1`;
        });
    });
}

function updateSubjectDropdowns() {
    const taskSelect = document.getElementById('taskSubjectSelect');
    const filterSelect = document.getElementById('filterSubjectSelect');

    const options = state.subjects.map(s => `<option value="${s.id}">${s.name} ${s.code ? `(${s.code})` : ''}</option>`).join('');

    if (taskSelect) {
        taskSelect.innerHTML = options;
    }
    if (filterSelect) {
        filterSelect.innerHTML = `<option value="All">All Subjects</option>` + options;
        filterSelect.value = state.subjectFilter;
    }
}

// ============================================================================
// STATS & DASHBOARD CALCULATOR
// ============================================================================

function calculateStats() {
    const total = state.tasks.length;
    const pending = state.tasks.filter(t => t.status === 'Pending').length;
    const inProgress = state.tasks.filter(t => t.status === 'In Progress').length;
    const completed = state.tasks.filter(t => t.status === 'Completed').length;
    const overdueTasks = state.tasks.filter(t => isOverdue(t.dueDate, t.status));
    const dueTodayTasks = state.tasks.filter(t => isDueToday(t.dueDate) && t.status !== 'Completed');
    const highPriorityTasks = state.tasks.filter(t => t.priority === 'High' && t.status !== 'Completed');

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update Stat Badges & Numbers
    const elTotal = document.getElementById('statTotalTasks');
    const elPending = document.getElementById('statPendingTasks');
    const elInProgress = document.getElementById('statInProgressTasks');
    const elCompleted = document.getElementById('statCompletedTasks');
    const elRate = document.getElementById('statCompletionRate');

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = pending;
    if (elInProgress) elInProgress.textContent = inProgress;
    if (elCompleted) elCompleted.textContent = completed;
    if (elRate) elRate.innerHTML = `<i data-lucide="trending-up"></i> ${completionRate}% Rate`;

    // Sidebar quick counters
    const countHigh = document.getElementById('countHighPriority');
    const countOver = document.getElementById('countOverdue');
    const countToday = document.getElementById('countDueToday');
    const navPending = document.getElementById('navPendingBadge');
    const navSubjects = document.getElementById('navSubjectsBadge');

    if (countHigh) countHigh.textContent = highPriorityTasks.length;
    if (countOver) countOver.textContent = overdueTasks.length;
    if (countToday) countToday.textContent = dueTodayTasks.length;
    if (navPending) navPending.textContent = pending + inProgress;
    if (navSubjects) navSubjects.textContent = state.subjects.length;

    // Task view tab counters
    const tabAll = document.getElementById('tabCountAll');
    const tabPending = document.getElementById('tabCountPending');
    const tabInProg = document.getElementById('tabCountInProgress');
    const tabComp = document.getElementById('tabCountCompleted');

    if (tabAll) tabAll.textContent = total;
    if (tabPending) tabPending.textContent = pending;
    if (tabInProg) tabInProg.textContent = inProgress;
    if (tabComp) tabComp.textContent = completed;

    // Circular Progress Ring in Dashboard
    const ringFill = document.getElementById('overviewProgressRing');
    const ringPct = document.getElementById('overviewProgressPct');
    const ringPending = document.getElementById('ringPendingNum');
    const ringInProgress = document.getElementById('ringInProgressNum');
    const ringCompleted = document.getElementById('ringCompletedNum');

    if (ringPct) ringPct.textContent = `${completionRate}%`;
    if (ringPending) ringPending.textContent = pending;
    if (ringInProgress) ringInProgress.textContent = inProgress;
    if (ringCompleted) ringCompleted.textContent = completed;

    if (ringFill) {
        const circumference = 2 * Math.PI * 56; // 351.85
        const offset = circumference - (completionRate / 100) * circumference;
        ringFill.style.strokeDashoffset = offset;
    }

    // Overdue Alert Banner
    const alertBanner = document.getElementById('overdueAlertBanner');
    const alertTitle = document.getElementById('overdueAlertTitle');
    const alertDesc = document.getElementById('overdueAlertDesc');

    if (alertBanner) {
        if (overdueTasks.length > 0) {
            alertBanner.style.display = 'flex';
            if (alertTitle) alertTitle.textContent = `Attention: You have ${overdueTasks.length} overdue assignment${overdueTasks.length > 1 ? 's' : ''}!`;
            if (alertDesc) alertDesc.textContent = `"${overdueTasks[0].title}" and ${overdueTasks.length - 1} other task(s) require immediate attention.`;
        } else {
            alertBanner.style.display = 'none';
        }
    }

    // Daily Goal Pace in Sidebar
    const completedToday = state.tasks.filter(t => {
        if (t.status !== 'Completed') return false;
        // consider completed tasks
        return true;
    }).length;

    const goalBar = document.getElementById('dailyGoalBar');
    const goalCaption = document.getElementById('dailyGoalCaption');
    const target = state.profile.dailyGoal || 5;
    const pacePct = Math.min(100, Math.round((completed / target) * 100));

    if (goalBar) goalBar.style.width = `${pacePct}%`;
    if (goalCaption) goalCaption.textContent = `${completed} of ${target} task target achieved`;

    if (window.lucide) lucide.createIcons();
}

// ============================================================================
// DASHBOARD VIEW RENDERING
// ============================================================================

function renderDashboardWidgets() {
    renderUpcomingDeadlines();
    renderDashboardRecentTasks();
    renderSubjectBreakdown();
}

function renderUpcomingDeadlines() {
    const listEl = document.getElementById('upcomingDeadlinesList');
    if (!listEl) return;

    // Filter non-completed, sort by due date ascending
    const activeTasks = state.tasks
        .filter(t => t.status !== 'Completed')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

    if (activeTasks.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state" style="padding: 1.5rem; border: none;">
                <p>🎉 No pending deadlines! You're completely caught up.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = activeTasks.map(task => {
        const subject = state.getSubject(task.subjectId);
        const overdue = isOverdue(task.dueDate, task.status);
        const dueToday = isDueToday(task.dueDate);
        const deadlineInfo = getRelativeDeadlineText(task.dueDate, task.status);

        let itemClass = 'mini-task-item';
        if (overdue) itemClass += ' is-overdue';
        else if (dueToday) itemClass += ' is-today';

        return `
            <div class="${itemClass}" data-id="${task.id}">
                <button class="mini-task-checkbox ${task.status === 'Completed' ? 'checked' : ''}" data-action="toggle-complete" data-id="${task.id}" title="Toggle Complete">
                    <i data-lucide="check" style="width: 12px; height: 12px;"></i>
                </button>
                <div class="mini-task-info" data-action="view-detail" data-id="${task.id}" style="cursor: pointer;">
                    <div class="mini-task-title">${escapeHtml(task.title)}</div>
                    <div class="mini-task-meta">
                        <span class="mini-task-tag" style="background: ${subject.color}22; color: ${subject.color};">
                            ${escapeHtml(subject.name)}
                        </span>
                        <span class="due-time-badge ${deadlineInfo.className}">
                            <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                            ${deadlineInfo.text}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function renderDashboardRecentTasks() {
    const listEl = document.getElementById('dashRecentTasksList');
    if (!listEl) return;

    let filtered = [...state.tasks];
    if (state.dashboardMiniFilter !== 'all') {
        filtered = filtered.filter(t => t.status === state.dashboardMiniFilter);
    }

    // Sort by newest created first
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const preview = filtered.slice(0, 4);

    if (preview.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state" style="padding: 1.5rem; border: none;">
                <p>No tasks found for this filter.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = preview.map(task => renderTaskCardHtml(task)).join('');
    if (window.lucide) lucide.createIcons();
}

function renderSubjectBreakdown() {
    const listEl = document.getElementById('dashSubjectProgressList');
    if (!listEl) return;

    if (state.subjects.length === 0) {
        listEl.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No subjects registered yet.</p>`;
        return;
    }

    listEl.innerHTML = state.subjects.map(subj => {
        const subjTasks = state.tasks.filter(t => t.subjectId === subj.id);
        const completed = subjTasks.filter(t => t.status === 'Completed').length;
        const total = subjTasks.length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        return `
            <div class="subj-progress-item">
                <div class="subj-progress-header">
                    <span class="subj-name-dot">
                        <span class="subj-dot" style="background-color: ${subj.color};"></span>
                        ${escapeHtml(subj.name)}
                    </span>
                    <span><strong>${completed}/${total}</strong> done (${pct}%)</span>
                </div>
                <div class="subj-progress-bar">
                    <div class="subj-progress-fill" style="width: ${pct}%; background-color: ${subj.color};"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================================
// ALL TASKS VIEW & FILTERING LOGIC
// ============================================================================

function renderAllTasks() {
    const gridEl = document.getElementById('allTasksGrid');
    const emptyState = document.getElementById('tasksEmptyState');
    if (!gridEl) return;

    // Apply layout class
    gridEl.className = `tasks-container layout-${state.layoutMode}`;

    // Filter Tasks
    let filtered = [...state.tasks];

    // Status Filter
    if (state.statusFilter !== 'All') {
        if (state.statusFilter === 'overdue') {
            filtered = filtered.filter(t => isOverdue(t.dueDate, t.status));
        } else if (state.statusFilter === 'today') {
            filtered = filtered.filter(t => isDueToday(t.dueDate) && t.status !== 'Completed');
        } else {
            filtered = filtered.filter(t => t.status === state.statusFilter);
        }
    }

    // Subject Filter
    if (state.subjectFilter !== 'All') {
        filtered = filtered.filter(t => t.subjectId === state.subjectFilter);
    }

    // Priority Filter
    if (state.priorityFilter !== 'All') {
        filtered = filtered.filter(t => t.priority === state.priorityFilter);
    }

    // Search Query (title, description, subject name)
    if (state.searchQuery.trim() !== '') {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(t => {
            const subject = state.getSubject(t.subjectId);
            const inTitle = t.title.toLowerCase().includes(query);
            const inDesc = (t.description || '').toLowerCase().includes(query);
            const inSubj = subject.name.toLowerCase().includes(query);
            return inTitle || inDesc || inSubj;
        });
    }

    // Sorting
    filtered.sort((a, b) => {
        if (state.sortBy === 'due-asc') {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (state.sortBy === 'due-desc') {
            return new Date(b.dueDate) - new Date(a.dueDate);
        }
        if (state.sortBy === 'priority-desc') {
            const weight = { 'High': 3, 'Medium': 2, 'Low': 1 };
            return (weight[b.priority] || 0) - (weight[a.priority] || 0);
        }
        if (state.sortBy === 'created-desc') {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (state.sortBy === 'title-asc') {
            return a.title.localeCompare(b.title);
        }
        return 0;
    });

    renderActiveFilterChips();

    if (filtered.length === 0) {
        gridEl.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        gridEl.innerHTML = filtered.map(task => renderTaskCardHtml(task)).join('');
    }

    if (window.lucide) lucide.createIcons();
}

function renderTaskCardHtml(task) {
    const subject = state.getSubject(task.subjectId);
    const overdue = isOverdue(task.dueDate, task.status);
    const isComp = task.status === 'Completed';

    let cardClass = 'task-card';
    if (overdue) cardClass += ' is-overdue';
    if (isComp) cardClass += ' is-completed';

    const statusClassMap = {
        'Pending': 'status-pending',
        'In Progress': 'status-inprogress',
        'Completed': 'status-completed'
    };

    return `
        <article class="${cardClass}" data-id="${task.id}">
            <div class="task-card-header">
                <span class="subject-pill" style="background: ${subject.color}22; color: ${subject.color};">
                    <i data-lucide="book" style="width: 12px; height: 12px;"></i>
                    ${escapeHtml(subject.name)}
                </span>
                <span class="priority-pill ${task.priority.toLowerCase()}">
                    ${task.priority} Priority
                </span>
            </div>

            <div class="task-card-body">
                <h3 class="task-card-title" data-action="view-detail" data-id="${task.id}">
                    ${escapeHtml(task.title)}
                </h3>
                ${task.description ? `<p class="task-card-desc">${escapeHtml(task.description)}</p>` : ''}
            </div>

            <div class="task-card-footer">
                <div class="due-date-box ${overdue ? 'overdue' : ''}">
                    <i data-lucide="${overdue ? 'alert-triangle' : 'calendar'}" style="width: 14px; height: 14px;"></i>
                    <span>${formatDueDate(task.dueDate)}</span>
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <select class="status-dropdown-select ${statusClassMap[task.status] || ''}" data-action="change-status" data-id="${task.id}" aria-label="Change Task Status">
                        <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
                        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>⚡ In Progress</option>
                        <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
                    </select>

                    <div class="task-actions-btn-group">
                        <button class="btn-icon-xs" data-action="edit-task" data-id="${task.id}" title="Edit Task">
                            <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                        </button>
                        <button class="btn-icon-xs delete" data-action="delete-task" data-id="${task.id}" title="Delete Task">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

function renderActiveFilterChips() {
    const bar = document.getElementById('activeFilterChipsBar');
    const container = document.getElementById('chipsListContainer');
    if (!bar || !container) return;

    const chips = [];

    if (state.statusFilter !== 'All') {
        chips.push({ key: 'status', label: `Status: ${state.statusFilter}` });
    }
    if (state.subjectFilter !== 'All') {
        const subj = state.getSubject(state.subjectFilter);
        chips.push({ key: 'subject', label: `Subject: ${subj.name}` });
    }
    if (state.priorityFilter !== 'All') {
        chips.push({ key: 'priority', label: `Priority: ${state.priorityFilter}` });
    }
    if (state.searchQuery.trim() !== '') {
        chips.push({ key: 'search', label: `Search: "${state.searchQuery}"` });
    }

    if (chips.length === 0) {
        bar.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    bar.style.display = 'flex';
    container.innerHTML = chips.map(c => `
        <span class="filter-chip">
            ${escapeHtml(c.label)}
            <button class="filter-chip-remove" data-remove-filter="${c.key}">&times;</button>
        </span>
    `).join('');

    container.querySelectorAll('[data-remove-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            const filterKey = btn.dataset.removeFilter;
            if (filterKey === 'status') state.statusFilter = 'All';
            if (filterKey === 'subject') state.subjectFilter = 'All';
            if (filterKey === 'priority') state.priorityFilter = 'All';
            if (filterKey === 'search') {
                state.searchQuery = '';
                const searchInput = document.getElementById('globalSearchInput');
                if (searchInput) searchInput.value = '';
                document.getElementById('clearSearchBtn').style.display = 'none';
            }
            syncFilterInputs();
            renderAllTasks();
        });
    });
}

function syncFilterInputs() {
    const tabs = document.querySelectorAll('#tasksStatusTabs .tab-btn');
    tabs.forEach(t => {
        if (t.dataset.status === state.statusFilter) t.classList.add('active');
        else t.classList.remove('active');
    });

    const subjSelect = document.getElementById('filterSubjectSelect');
    if (subjSelect) subjSelect.value = state.subjectFilter;

    const prioSelect = document.getElementById('filterPrioritySelect');
    if (prioSelect) prioSelect.value = state.priorityFilter;
}

// ============================================================================
// SUBJECTS VIEW RENDERING
// ============================================================================

function renderSubjects() {
    const grid = document.getElementById('subjectsCardGrid');
    if (!grid) return;

    if (state.subjects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon-box"><i data-lucide="book-open"></i></div>
                <h3>No Subjects Added</h3>
                <p>Click "Add Subject" to create your courses.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = state.subjects.map(subj => {
        const tasks = state.tasks.filter(t => t.subjectId === subj.id);
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const pending = tasks.filter(t => t.status === 'Pending').length;
        const inProgress = tasks.filter(t => t.status === 'In Progress').length;
        const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

        return `
            <div class="subject-card" style="--card-color: ${subj.color}; --card-color-bg: ${subj.color}20;">
                <div class="subject-card-top">
                    <div class="subject-color-badge">
                        <i data-lucide="book-open"></i>
                    </div>
                    <div class="task-actions-btn-group">
                        <button class="btn-icon-xs" data-action="edit-subject" data-id="${subj.id}" title="Edit Subject">
                            <i data-lucide="edit-3"></i>
                        </button>
                        <button class="btn-icon-xs delete" data-action="delete-subject" data-id="${subj.id}" title="Delete Subject">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>

                <div class="subject-card-info">
                    <h3>${escapeHtml(subj.name)}</h3>
                    ${subj.code ? `<span class="subject-code-tag">${escapeHtml(subj.code)}</span>` : ''}
                </div>

                <div class="subj-progress-bar">
                    <div class="subj-progress-fill" style="width: ${pct}%; background-color: ${subj.color};"></div>
                </div>

                <div class="subject-stats-bar">
                    <span>${tasks.length} Total</span>
                    <span>${pending} Pending</span>
                    <span>${inProgress} Active</span>
                    <span>${completed} Done</span>
                </div>

                <div class="subject-card-footer">
                    <button class="btn btn-sm btn-outline" data-action="filter-by-subject" data-id="${subj.id}">
                        <i data-lucide="list-filter"></i> View Course Tasks
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// ============================================================================
// FOCUS / POMODORO TIMER LOGIC
// ============================================================================

function initPomodoro() {
    updatePomoDisplay();
    updatePomoTaskSelect();

    const startBtn = document.getElementById('timerStartBtn');
    const resetBtn = document.getElementById('timerResetBtn');
    const modeBtns = document.querySelectorAll('.pomo-mode-btn');

    if (startBtn) {
        startBtn.addEventListener('click', togglePomodoro);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetPomodoro);
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const minutes = parseInt(btn.dataset.time, 10);
            state.timerMode = btn.dataset.mode;
            state.timerDuration = minutes * 60;
            resetPomodoro();

            const statusLabels = {
                'pomodoro': 'Time to concentrate & study!',
                'shortBreak': 'Short rest. Grab a glass of water.',
                'longBreak': 'Long break. Step away and stretch.'
            };
            const labelEl = document.getElementById('timerModeLabel');
            if (labelEl) labelEl.textContent = statusLabels[state.timerMode] || 'Focus mode';
        });
    });
}

function updatePomoDisplay() {
    const clock = document.getElementById('timerClockDisplay');
    const sessions = document.getElementById('pomoSessionsCount');
    const minutes = document.getElementById('pomoTotalFocusMinutes');

    if (clock) {
        const mins = Math.floor(state.timerRemaining / 60);
        const secs = state.timerRemaining % 60;
        clock.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    if (sessions) sessions.textContent = state.pomoSessions;
    if (minutes) minutes.textContent = state.pomoMinutes;
}

function togglePomodoro() {
    if (state.timerRunning) {
        pausePomodoro();
    } else {
        startPomodoro();
    }
}

function startPomodoro() {
    state.timerRunning = true;
    const playIcon = document.getElementById('timerPlayIcon');
    const playText = document.getElementById('timerPlayText');

    if (playText) playText.textContent = 'Pause';
    if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
    if (window.lucide) lucide.createIcons();

    state.timerInterval = setInterval(() => {
        if (state.timerRemaining > 0) {
            state.timerRemaining--;
            updatePomoDisplay();
        } else {
            completePomodoroSession();
        }
    }, 1000);
}

function pausePomodoro() {
    state.timerRunning = false;
    clearInterval(state.timerInterval);
    const playIcon = document.getElementById('timerPlayIcon');
    const playText = document.getElementById('timerPlayText');

    if (playText) playText.textContent = 'Resume';
    if (playIcon) playIcon.setAttribute('data-lucide', 'play');
    if (window.lucide) lucide.createIcons();
}

function resetPomodoro() {
    pausePomodoro();
    state.timerRemaining = state.timerDuration;
    updatePomoDisplay();
    const playText = document.getElementById('timerPlayText');
    if (playText) playText.textContent = 'Start Focus';
}

function completePomodoroSession() {
    pausePomodoro();
    SoundManager.playChime();
    triggerConfetti();

    if (state.timerMode === 'pomodoro') {
        state.pomoSessions++;
        state.pomoMinutes += Math.round(state.timerDuration / 60);
        state.savePomoStats();
        showToast('🎉 Focus session completed! Great job.', 'success', 'award');
    } else {
        showToast('Break finished! Ready to get back to work?', 'info', 'bell');
    }

    resetPomodoro();
}

function updatePomoTaskSelect() {
    const sel = document.getElementById('pomoLinkedTaskSelect');
    if (!sel) return;
    const activeTasks = state.tasks.filter(t => t.status !== 'Completed');
    sel.innerHTML = `<option value="">-- No specific task --</option>` +
        activeTasks.map(t => `<option value="${t.id}">${escapeHtml(t.title)}</option>`).join('');
}

// ============================================================================
// TASK MODAL (ADD / EDIT) & CRUD ACTIONS
// ============================================================================

function openAddTaskModal() {
    state.editingTaskId = null;
    const form = document.getElementById('taskForm');
    if (form) form.reset();

    const title = document.getElementById('taskModalTitle');
    const subtitle = document.getElementById('taskModalSubtitle');
    const submitBtnText = document.getElementById('saveTaskBtnText');
    const dueDateInput = document.getElementById('taskDueDateInput');
    const prioSelect = document.getElementById('taskPrioritySelect');

    if (title) title.textContent = 'Add New Task';
    if (subtitle) subtitle.textContent = 'Fill in the details for your academic task';
    if (submitBtnText) submitBtnText.textContent = 'Create Task';

    // Set default due date to tomorrow 5:00 PM
    const defDue = new Date();
    defDue.setDate(defDue.getDate() + 1);
    defDue.setHours(17, 0, 0, 0);
    if (dueDateInput) dueDateInput.value = formatDateTimeForInput(defDue);

    if (prioSelect) prioSelect.value = state.profile.defaultPriority || 'Medium';

    openModal('taskModal');
}

function openEditTaskModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    state.editingTaskId = taskId;
    const form = document.getElementById('taskForm');
    if (form) form.reset();

    const title = document.getElementById('taskModalTitle');
    const subtitle = document.getElementById('taskModalSubtitle');
    const submitBtnText = document.getElementById('saveTaskBtnText');

    if (title) title.textContent = 'Edit Task';
    if (subtitle) subtitle.textContent = 'Update task parameters and deadlines';
    if (submitBtnText) submitBtnText.textContent = 'Save Changes';

    document.getElementById('taskIdInput').value = task.id;
    document.getElementById('taskTitleInput').value = task.title;
    document.getElementById('taskDescInput').value = task.description || '';
    document.getElementById('taskSubjectSelect').value = task.subjectId;
    document.getElementById('taskPrioritySelect').value = task.priority;
    document.getElementById('taskDueDateInput').value = formatDateTimeForInput(task.dueDate);
    document.getElementById('taskStatusSelect').value = task.status;

    openModal('taskModal');
}

function handleTaskFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('taskTitleInput').value.trim();
    const desc = document.getElementById('taskDescInput').value.trim();
    const subjectId = document.getElementById('taskSubjectSelect').value;
    const priority = document.getElementById('taskPrioritySelect').value;
    const dueDateRaw = document.getElementById('taskDueDateInput').value;
    const status = document.getElementById('taskStatusSelect').value;

    if (!title || !dueDateRaw || !subjectId) {
        showToast('Please fill in all required fields.', 'warning', 'alert-circle');
        return;
    }

    const dueDate = new Date(dueDateRaw).toISOString();

    if (state.editingTaskId) {
        // Update existing task
        const index = state.tasks.findIndex(t => t.id === state.editingTaskId);
        if (index !== -1) {
            state.tasks[index] = {
                ...state.tasks[index],
                title,
                description: desc,
                subjectId,
                priority,
                dueDate,
                status
            };
            showToast('Task updated successfully!', 'success', 'check');
        }
    } else {
        // Create new task
        const newTask = {
            id: 'task-' + Date.now(),
            title,
            description: desc,
            subjectId,
            priority,
            dueDate,
            status,
            createdAt: new Date().toISOString()
        };
        state.tasks.unshift(newTask);
        showToast('New task added!', 'success', 'check-circle-2');
    }

    state.saveTasks();
    closeModal('taskModal');
    refreshAllViews();
}

function toggleTaskComplete(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === 'Completed') {
        task.status = 'Pending';
        showToast(`Marked "${task.title.slice(0, 24)}..." as pending.`, 'info', 'clock');
    } else {
        task.status = 'Completed';
        SoundManager.playSuccess();
        triggerConfetti();
        showToast(`Completed "${task.title.slice(0, 24)}..."! 🌟`, 'success', 'check-circle-2');
    }

    state.saveTasks();
    refreshAllViews();
}

function updateTaskStatus(taskId, newStatus) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    task.status = newStatus;

    if (newStatus === 'Completed' && oldStatus !== 'Completed') {
        SoundManager.playSuccess();
        triggerConfetti();
    }

    state.saveTasks();
    refreshAllViews();
    showToast(`Status changed to ${newStatus}`, 'info', 'refresh-cw');
}

function promptDeleteTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const confirmTitle = document.getElementById('confirmModalTitle');
    const confirmDesc = document.getElementById('confirmModalDesc');
    if (confirmTitle) confirmTitle.textContent = 'Delete Task?';
    if (confirmDesc) confirmDesc.textContent = `Are you sure you want to delete "${task.title}"?`;

    state.confirmCallback = () => {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        state.saveTasks();
        refreshAllViews();
        closeModal('confirmModal');
        closeModal('taskDetailModal');
        showToast('Task deleted.', 'danger', 'trash-2');
    };

    openModal('confirmModal');
}

// ============================================================================
// TASK DETAIL MODAL
// ============================================================================

function openTaskDetailModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    state.activeDetailTaskId = taskId;
    const subject = state.getSubject(task.subjectId);
    const overdue = isOverdue(task.dueDate, task.status);

    const titleEl = document.getElementById('detailTaskTitle');
    const prioBadge = document.getElementById('detailPriorityBadge');
    const statBadge = document.getElementById('detailStatusBadge');
    const subjTag = document.getElementById('detailSubjectTag');
    const dueEl = document.getElementById('detailDueDate');
    const overdueFlag = document.getElementById('detailOverdueFlag');
    const descEl = document.getElementById('detailDescription');
    const toggleBtn = document.getElementById('detailToggleStatusBtn');

    if (titleEl) titleEl.textContent = task.title;
    if (prioBadge) {
        prioBadge.className = `priority-pill ${task.priority.toLowerCase()}`;
        prioBadge.textContent = `${task.priority} Priority`;
    }
    if (statBadge) {
        statBadge.className = `status-dropdown-select status-${task.status.toLowerCase().replace(' ', '')}`;
        statBadge.textContent = task.status;
    }
    if (subjTag) {
        subjTag.textContent = subject.name;
        subjTag.style.background = `${subject.color}22`;
        subjTag.style.color = subject.color;
    }
    if (dueEl) dueEl.textContent = formatDueDate(task.dueDate);
    if (overdueFlag) overdueFlag.style.display = overdue ? 'flex' : 'none';
    if (descEl) descEl.textContent = task.description || 'No additional notes provided for this task.';

    if (toggleBtn) {
        toggleBtn.innerHTML = task.status === 'Completed'
            ? `<i data-lucide="rotate-ccw"></i> Mark as Pending`
            : `<i data-lucide="check"></i> Mark as Completed`;
    }

    openModal('taskDetailModal');
    if (window.lucide) lucide.createIcons();
}

// ============================================================================
// SUBJECT MODAL & CRUD ACTIONS
// ============================================================================

let selectedSubjectColor = '#6366f1';

function openAddSubjectModal() {
    const form = document.getElementById('subjectForm');
    if (form) form.reset();
    document.getElementById('subjectIdInput').value = '';
    document.getElementById('subjectModalTitle').textContent = 'Add New Subject';
    selectedSubjectColor = '#6366f1';
    syncSubjectColorPicker();
    openModal('subjectModal');
}

function openEditSubjectModal(subjectId) {
    const subj = state.subjects.find(s => s.id === subjectId);
    if (!subj) return;

    document.getElementById('subjectIdInput').value = subj.id;
    document.getElementById('subjectNameInput').value = subj.name;
    document.getElementById('subjectCodeInput').value = subj.code || '';
    document.getElementById('subjectModalTitle').textContent = 'Edit Subject';

    selectedSubjectColor = subj.color || '#6366f1';
    syncSubjectColorPicker();
    openModal('subjectModal');
}

function syncSubjectColorPicker() {
    const buttons = document.querySelectorAll('#subjectColorPalette .color-choice-btn');
    buttons.forEach(btn => {
        if (btn.dataset.color.toLowerCase() === selectedSubjectColor.toLowerCase()) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function handleSubjectFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('subjectIdInput').value;
    const name = document.getElementById('subjectNameInput').value.trim();
    const code = document.getElementById('subjectCodeInput').value.trim();

    if (!name) {
        showToast('Subject name is required.', 'warning', 'alert-circle');
        return;
    }

    if (id) {
        const index = state.subjects.findIndex(s => s.id === id);
        if (index !== -1) {
            state.subjects[index] = { ...state.subjects[index], name, code, color: selectedSubjectColor };
            showToast('Subject updated.', 'success', 'check');
        }
    } else {
        const newSubj = {
            id: 'subj-' + Date.now(),
            name,
            code,
            color: selectedSubjectColor
        };
        state.subjects.push(newSubj);
        showToast('New subject added!', 'success', 'check-circle-2');
    }

    state.saveSubjects();
    updateSubjectDropdowns();
    closeModal('subjectModal');
    refreshAllViews();
}

function promptDeleteSubject(subjectId) {
    const subj = state.subjects.find(s => s.id === subjectId);
    if (!subj) return;

    const taskCount = state.tasks.filter(t => t.subjectId === subjectId).length;
    const confirmTitle = document.getElementById('confirmModalTitle');
    const confirmDesc = document.getElementById('confirmModalDesc');

    if (confirmTitle) confirmTitle.textContent = 'Delete Subject?';
    if (confirmDesc) confirmDesc.textContent = `Are you sure you want to delete "${subj.name}"? ${taskCount} associated task(s) will be affected.`;

    state.confirmCallback = () => {
        state.subjects = state.subjects.filter(s => s.id !== subjectId);
        state.saveSubjects();
        updateSubjectDropdowns();
        refreshAllViews();
        closeModal('confirmModal');
        showToast('Subject deleted.', 'danger', 'trash-2');
    };

    openModal('confirmModal');
}

// ============================================================================
// PROFILE & SETTINGS FORM
// ============================================================================

function handleProfileSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('settingsStudentName').value.trim();
    const major = document.getElementById('settingsStudentMajor').value.trim();
    const goal = parseInt(document.getElementById('settingsDailyTaskGoal').value, 10) || 5;
    const prio = document.getElementById('settingsDefaultPriority').value;

    state.profile.name = name || 'Student';
    state.profile.major = major || 'Academic Explorer';
    state.profile.dailyGoal = goal;
    state.profile.defaultPriority = prio;

    state.saveProfile();
    updateProfileUI();
    calculateStats();
    showToast('Student profile updated!', 'success', 'check-circle-2');
}

// ============================================================================
// BACKUP, IMPORT, SEED & RESET
// ============================================================================

function exportData() {
    const exportObject = {
        app: 'EduTrack',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tasks: state.tasks,
        subjects: state.subjects,
        profile: state.profile
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edutrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded!', 'success', 'download');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data.tasks && Array.isArray(data.tasks)) {
                state.tasks = data.tasks;
                state.saveTasks();
            }
            if (data.subjects && Array.isArray(data.subjects)) {
                state.subjects = data.subjects;
                state.saveSubjects();
            }
            if (data.profile && typeof data.profile === 'object') {
                state.profile = { ...DEFAULT_PROFILE, ...data.profile };
                state.saveProfile();
            }
            updateSubjectDropdowns();
            updateProfileUI();
            refreshAllViews();
            showToast('Backup data imported successfully!', 'success', 'upload');
        } catch (err) {
            showToast('Failed to parse backup file.', 'danger', 'alert-triangle');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function seedDemoData() {
    state.tasks = generateInitialTasks();
    state.subjects = DEFAULT_SUBJECTS;
    state.saveTasks();
    state.saveSubjects();
    updateSubjectDropdowns();
    refreshAllViews();
    showToast('Loaded sample tasks & subjects!', 'success', 'refresh-cw');
}

function clearAllData() {
    const confirmTitle = document.getElementById('confirmModalTitle');
    const confirmDesc = document.getElementById('confirmModalDesc');
    if (confirmTitle) confirmTitle.textContent = 'Reset All Data?';
    if (confirmDesc) confirmDesc.textContent = 'This will delete all tasks, subjects, and reset your student settings to factory default.';

    state.confirmCallback = () => {
        localStorage.clear();
        state.tasks = [];
        state.subjects = DEFAULT_SUBJECTS;
        state.profile = { ...DEFAULT_PROFILE };
        state.saveTasks();
        state.saveSubjects();
        state.saveProfile();
        updateSubjectDropdowns();
        updateProfileUI();
        refreshAllViews();
        closeModal('confirmModal');
        showToast('All local storage cleared and reset.', 'danger', 'trash-2');
    };

    openModal('confirmModal');
}

// ============================================================================
// MODAL CONTROLLERS & EVENT LISTENERS
// ============================================================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function setupModalClosers() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('open');
            }
        });
    });

    document.getElementById('closeTaskModalBtn')?.addEventListener('click', () => closeModal('taskModal'));
    document.getElementById('cancelTaskModalBtn')?.addEventListener('click', () => closeModal('taskModal'));

    document.getElementById('closeSubjectModalBtn')?.addEventListener('click', () => closeModal('subjectModal'));
    document.getElementById('cancelSubjectModalBtn')?.addEventListener('click', () => closeModal('subjectModal'));

    document.getElementById('closeDetailModalBtn')?.addEventListener('click', () => closeModal('taskDetailModal'));

    document.getElementById('confirmCancelBtn')?.addEventListener('click', () => closeModal('confirmModal'));
    document.getElementById('confirmProceedBtn')?.addEventListener('click', () => {
        if (state.confirmCallback) state.confirmCallback();
    });
}

// ============================================================================
// NAVIGATION & VIEW SWITCHER
// ============================================================================

function switchView(viewName) {
    state.currentView = viewName;

    // Update sidebar nav highlights
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update View Panes
    document.querySelectorAll('.view-pane').forEach(pane => {
        if (pane.id === `view-${viewName}`) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    // Close mobile sidebar on navigation
    document.getElementById('sidebar')?.classList.remove('open');

    refreshAllViews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function refreshAllViews() {
    calculateStats();
    renderDashboardWidgets();
    renderAllTasks();
    renderSubjects();
    updatePomoTaskSelect();
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// GLOBAL EVENT DELEGATION & ATTACHMENTS
// ============================================================================

function setupEventListeners() {
    // Nav Items click
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            if (view) switchView(view);
        });
    });

    // Quick filters in Sidebar
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.dataset.filter;
            const filterVal = btn.dataset.value;
            if (filterType === 'priority') {
                state.priorityFilter = filterVal;
                state.statusFilter = 'All';
            } else if (filterType === 'status') {
                state.statusFilter = filterVal;
                state.priorityFilter = 'All';
            }
            syncFilterInputs();
            switchView('tasks');
        });
    });

    // Mobile Sidebar Toggles
    const sidebar = document.getElementById('sidebar');
    document.getElementById('openSidebarBtn')?.addEventListener('click', () => {
        sidebar?.classList.add('open');
    });
    document.getElementById('closeSidebarBtn')?.addEventListener('click', () => {
        sidebar?.classList.remove('open');
    });

    // Profile Click to Settings
    document.getElementById('sidebarProfileCard')?.addEventListener('click', () => switchView('settings'));
    document.getElementById('headerProfileTrigger')?.addEventListener('click', () => switchView('settings'));

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    themeBtn?.addEventListener('click', () => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
    });

    document.getElementById('settingsThemeSwitch')?.addEventListener('change', (e) => {
        applyTheme(e.target.checked ? 'dark' : 'light');
    });

    // Audio & Confetti settings switches
    document.getElementById('settingsSoundSwitch')?.addEventListener('change', (e) => {
        state.profile.soundEnabled = e.target.checked;
        state.saveProfile();
    });

    document.getElementById('settingsConfettiSwitch')?.addEventListener('change', (e) => {
        state.profile.confettiEnabled = e.target.checked;
        state.saveProfile();
    });

    // Global Search Input
    const searchInput = document.getElementById('globalSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    searchInput?.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (clearSearchBtn) clearSearchBtn.style.display = state.searchQuery ? 'flex' : 'none';
        if (state.currentView !== 'tasks') switchView('tasks');
        renderAllTasks();
    });

    clearSearchBtn?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        state.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderAllTasks();
    });

    // Shortcut: Ctrl/Cmd + K for search
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            searchInput?.focus();
        }
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        }
    });

    // Add Task Buttons
    document.getElementById('btnOpenAddTaskModal')?.addEventListener('click', openAddTaskModal);
    document.getElementById('btnOpenAddTaskModal2')?.addEventListener('click', openAddTaskModal);
    document.getElementById('mobileFabBtn')?.addEventListener('click', openAddTaskModal);
    document.getElementById('emptyStateAddBtn')?.addEventListener('click', openAddTaskModal);

    // Dashboard Buttons
    document.getElementById('dashViewAllTasksBtn')?.addEventListener('click', () => switchView('tasks'));
    document.getElementById('dashViewSubjectsBtn')?.addEventListener('click', () => switchView('subjects'));
    document.getElementById('viewOverdueBtn')?.addEventListener('click', () => {
        state.statusFilter = 'overdue';
        syncFilterInputs();
        switchView('tasks');
    });

    // Dashboard Mini Filter Pills
    document.querySelectorAll('.header-filters-mini .filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.header-filters-mini .filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.dashboardMiniFilter = pill.dataset.dashFilter;
            renderDashboardRecentTasks();
        });
    });

    // Tasks View Toolbar Status Tabs
    document.querySelectorAll('#tasksStatusTabs .tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#tasksStatusTabs .tab-btn').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.statusFilter = tab.dataset.status;
            renderAllTasks();
        });
    });

    // Tasks View Dropdown Filters & Sorters
    document.getElementById('filterSubjectSelect')?.addEventListener('change', (e) => {
        state.subjectFilter = e.target.value;
        renderAllTasks();
    });

    document.getElementById('filterPrioritySelect')?.addEventListener('change', (e) => {
        state.priorityFilter = e.target.value;
        renderAllTasks();
    });

    document.getElementById('sortTasksSelect')?.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderAllTasks();
    });

    document.getElementById('resetAllFiltersBtn')?.addEventListener('click', () => {
        state.statusFilter = 'All';
        state.subjectFilter = 'All';
        state.priorityFilter = 'All';
        state.searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        syncFilterInputs();
        renderAllTasks();
    });

    // Layout Toggle Buttons
    const gridBtn = document.getElementById('layoutGridBtn');
    const listBtn = document.getElementById('layoutListBtn');

    gridBtn?.addEventListener('click', () => {
        state.layoutMode = 'grid';
        gridBtn.classList.add('active');
        listBtn?.classList.remove('active');
        renderAllTasks();
    });

    listBtn?.addEventListener('click', () => {
        state.layoutMode = 'list';
        listBtn.classList.add('active');
        gridBtn?.classList.remove('active');
        renderAllTasks();
    });

    // Subject Color Palette Click
    document.querySelectorAll('#subjectColorPalette .color-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedSubjectColor = btn.dataset.color;
            syncSubjectColorPicker();
        });
    });

    // Add Subject Button
    document.getElementById('btnOpenAddSubjectModal')?.addEventListener('click', openAddSubjectModal);

    // Form Submissions
    document.getElementById('taskForm')?.addEventListener('submit', handleTaskFormSubmit);
    document.getElementById('subjectForm')?.addEventListener('submit', handleSubjectFormSubmit);
    document.getElementById('profileSettingsForm')?.addEventListener('submit', handleProfileSubmit);

    // Detail Modal Actions
    document.getElementById('detailDeleteBtn')?.addEventListener('click', () => {
        if (state.activeDetailTaskId) promptDeleteTask(state.activeDetailTaskId);
    });

    document.getElementById('detailEditBtn')?.addEventListener('click', () => {
        const id = state.activeDetailTaskId;
        closeModal('taskDetailModal');
        if (id) openEditTaskModal(id);
    });

    document.getElementById('detailToggleStatusBtn')?.addEventListener('click', () => {
        if (state.activeDetailTaskId) {
            toggleTaskComplete(state.activeDetailTaskId);
            openTaskDetailModal(state.activeDetailTaskId);
        }
    });

    // Data Management Buttons
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    document.getElementById('importDataInput')?.addEventListener('change', importData);
    document.getElementById('seedDemoDataBtn')?.addEventListener('click', seedDemoData);
    document.getElementById('clearAllDataBtn')?.addEventListener('click', clearAllData);

    // Dynamic Click Handlers via Event Delegation (Task & Subject Actions)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const id = target.dataset.id;

        if (action === 'toggle-complete') {
            e.stopPropagation();
            toggleTaskComplete(id);
        } else if (action === 'view-detail') {
            openTaskDetailModal(id);
        } else if (action === 'edit-task') {
            e.stopPropagation();
            openEditTaskModal(id);
        } else if (action === 'delete-task') {
            e.stopPropagation();
            promptDeleteTask(id);
        } else if (action === 'edit-subject') {
            e.stopPropagation();
            openEditSubjectModal(id);
        } else if (action === 'delete-subject') {
            e.stopPropagation();
            promptDeleteSubject(id);
        } else if (action === 'filter-by-subject') {
            state.subjectFilter = id;
            syncFilterInputs();
            switchView('tasks');
        }
    });

    // Change status from card dropdown
    document.addEventListener('change', (e) => {
        if (e.target.dataset.action === 'change-status') {
            const taskId = e.target.dataset.id;
            const newStatus = e.target.value;
            updateTaskStatus(taskId, newStatus);
        }
    });
}

// ============================================================================
// APP INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Set Current Date Header
    const dateChip = document.getElementById('currentDateDisplay');
    if (dateChip) {
        const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
        dateChip.textContent = new Date().toLocaleDateString('en-US', options);
    }

    applyTheme(state.theme);
    updateProfileUI();
    renderAvatarSeeds();
    updateSubjectDropdowns();
    setupModalClosers();
    setupEventListeners();
    initPomodoro();
    refreshAllViews();

    if (window.lucide) {
        lucide.createIcons();
    }
});
