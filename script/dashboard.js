// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// DOM Elements
const createClassBtn = document.getElementById('createClassBtn');
const joinClassBtn = document.getElementById('joinClassBtn');
const createModal = document.getElementById('createModal');
const joinModal = document.getElementById('joinModal');
const editProfileModal = document.getElementById('editProfileModal');
const confirmCreate = document.getElementById('confirmCreate');
const confirmJoin = document.getElementById('confirmJoin');
const cancelCreate = document.getElementById('cancelCreate');
const cancelJoin = document.getElementById('cancelJoin');
const userIcon = document.getElementById('userIcon');
const profileDropdown = document.getElementById('profileDropdown');
const editProfileBtn = document.getElementById('editProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const cancelEdit = document.getElementById('cancelEdit');
const saveProfileBtn = document.getElementById('saveProfileBtn');

// Form inputs
const classNameInput = document.getElementById('classNameInput');
const classDescInput = document.getElementById('classDescInput');
const maxStudentsInput = document.getElementById('maxStudentsInput');
const passcodeToggle = document.getElementById('passcodeToggle');
const passcodeSection = document.getElementById('passcodeSection');
const passcodeInput = document.getElementById('passcodeInput');
const requireApprovalInput = document.getElementById('requireApprovalInput');
const classCodeInput = document.getElementById('classCodeInput');

// Tab state
let currentTab = 'created';
let classroomsData = {
    created: [],
    joined: []
};

// Cached profile data
let currentUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadClasses();
    setupEventListeners();
});

// ── Load user profile from API ────────────────────────────────────────────────
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.replace('index.html');
                return;
            }
            throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const data = await response.json();
        currentUser = data;

        applyProfileToUI(data);

    } catch (error) {
        console.error('Error loading profile:', error);
        // Fall back to any cached data
        const cached = JSON.parse(localStorage.getItem('userData') || '{}');
        if (cached.firstName) applyProfileToUI(cached);
    }
}

function applyProfileToUI(data) {
    // Resolve field names (API shape vs cached shape)
    const firstName  = data.firstName  || data.first_name  || '';
    const lastName   = data.lastName   || data.last_name   || '';
    const fullName   = `${firstName} ${lastName}`.trim() || 'User';
    const username   = data.username   || data.githubUsername || '';
    const email      = data.email      || '';
    const profileUrl = data.profileUrl || data.avatarUrl   || '';

    // Phone / birthday may be wrapped objects
    const phone    = data.phoneNumber?.value  || data.phoneNumber  || '';
    const birthday = data.birthday?.value     || data.birthday     || '';
    const bio      = data.bio || '';
    const gender   = data.gender ? capitalise(data.gender) : '';

    // ── Header ──
    document.getElementById('userName').textContent  = fullName;
    document.getElementById('userEmail').textContent = email || phone;
    document.getElementById('welcomeMsg').textContent = `Welcome back, ${firstName || fullName}!`;

    // ── Dropdown ──
    document.getElementById('fullName').textContent = fullName;
    document.getElementById('username').textContent = username ? `@${username}` : gender;

    // ── Avatar ──
    const iconEl = document.getElementById('userIcon');
    if (profileUrl) {
        iconEl.innerHTML = `<img src="${profileUrl}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
        iconEl.textContent = getInitials(fullName);
    }

    // ── Persist for edit-profile pre-fill ──
    localStorage.setItem('userData', JSON.stringify({
        fullName, firstName, lastName, username, email,
        phone, birthday, bio, gender, profileUrl
    }));
}

function capitalise(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ── Setup event listeners ─────────────────────────────────────────────────────
function setupEventListeners() {
    createClassBtn.addEventListener('click', () => openModal(createModal));
    joinClassBtn.addEventListener('click', () => openModal(joinModal));
    cancelCreate.addEventListener('click', () => closeModal(createModal));
    cancelJoin.addEventListener('click', () => closeModal(joinModal));
    cancelEdit.addEventListener('click', () => closeModal(editProfileModal));

    confirmCreate.addEventListener('click', handleCreateClass);
    confirmJoin.addEventListener('click', handleJoinClass);
    saveProfileBtn.addEventListener('click', handleSaveProfile);

    userIcon.addEventListener('click', toggleProfileDropdown);
    editProfileBtn.addEventListener('click', openEditProfile);
    logoutBtn.addEventListener('click', handleLogout);

    passcodeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            passcodeSection.style.display = 'block';
            passcodeInput.required = true;
        } else {
            passcodeSection.style.display = 'none';
            passcodeInput.required = false;
            passcodeInput.value = '';
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            switchTab(e.target.dataset.tab);
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal(e.target);
    });

    document.addEventListener('click', (e) => {
        if (!userIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    renderClasses();
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal(modal) {
    modal.style.display = 'flex';
}

function closeModal(modal) {
    modal.style.display = 'none';
    if (modal === createModal) {
        classNameInput.value = '';
        classDescInput.value = '';
        maxStudentsInput.value = '50';
        passcodeToggle.checked = false;
        passcodeSection.style.display = 'none';
        passcodeInput.value = '';
        passcodeInput.required = false;
        requireApprovalInput.checked = false;
    } else if (modal === joinModal) {
        classCodeInput.value = '';
    }
}

// ── Profile dropdown ──────────────────────────────────────────────────────────
function toggleProfileDropdown(e) {
    e.stopPropagation();
    profileDropdown.classList.toggle('show');
}

function openEditProfile() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    document.getElementById('editNameInput').value = userData.fullName || '';
    document.getElementById('editUsernameInput').value = userData.username || '';
    closeModal(editProfileModal);
    openModal(editProfileModal);
    profileDropdown.classList.remove('show');
}

function getInitials(name) {
    return name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function handleSaveProfile() {
    const fullName = document.getElementById('editNameInput').value.trim();
    const username = document.getElementById('editUsernameInput').value.trim();

    if (!fullName) {
        alert('Please enter your full name');
        return;
    }

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.fullName = fullName;
    userData.username = username;
    localStorage.setItem('userData', JSON.stringify(userData));

    // Update UI directly without re-fetching
    document.getElementById('userName').textContent  = fullName;
    document.getElementById('fullName').textContent  = fullName;
    document.getElementById('username').textContent  = username ? `@${username}` : '';
    document.getElementById('userIcon').textContent  = getInitials(fullName);
    document.getElementById('welcomeMsg').textContent = `Welcome back, ${fullName.split(' ')[0]}!`;

    closeModal(editProfileModal);
    showNotification('Profile updated successfully!', 'success');
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// ── Create classroom ──────────────────────────────────────────────────────────
async function handleCreateClass() {
    const name          = classNameInput.value.trim();
    const description   = classDescInput.value.trim();
    const maxStudents   = parseInt(maxStudentsInput.value);
    const hasPasscode   = passcodeToggle.checked;
    const passcode      = hasPasscode ? passcodeInput.value.trim() : null;
    const requireApproval = requireApprovalInput.checked;

    if (!name)                            return showNotification('Please enter a class name', 'error');
    if (name.length < 3 || name.length > 100) return showNotification('Class name must be 3–100 characters', 'error');
    if (description && description.length > 500) return showNotification('Description cannot exceed 500 characters', 'error');
    if (!maxStudents || maxStudents < 1 || maxStudents > 100) return showNotification('Max students must be 1–100', 'error');
    if (hasPasscode && !passcode)         return showNotification('Please enter a passcode', 'error');
    if (hasPasscode && passcode.length < 8) return showNotification('Passcode must be at least 8 characters', 'error');

    confirmCreate.disabled = true;
    confirmCreate.textContent = 'Creating...';

    try {
        const response = await fetch(`${API_BASE_URL}/classrooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, description: description || null, maxStudents, requireApproval, passcode: passcode || null })
        });

        const contentType = response.headers.get('content-type');
        let data = null;
        if (contentType?.includes('application/json')) {
            const text = await response.text();
            if (text) data = JSON.parse(text);
        }

        if (!response.ok) {
            if (response.status === 401) throw new Error('Authentication failed. Please log in again.');
            if (response.status === 403) throw new Error('You do not have permission to create classrooms.');
            throw new Error(data?.message || data?.error || `Server error: ${response.status}`);
        }

        showNotification('Classroom created successfully!', 'success');
        closeModal(createModal);
        await loadClasses();

    } catch (error) {
        console.error('Error creating classroom:', error);
        showNotification(error.message || 'Failed to create classroom. Please try again.', 'error');
    } finally {
        confirmCreate.disabled = false;
        confirmCreate.textContent = 'Create Class';
    }
}

// ── Join classroom ────────────────────────────────────────────────────────────
async function handleJoinClass() {
    const classCode = classCodeInput.value.trim();
    if (!classCode) return showNotification('Please enter a class code', 'error');

    confirmJoin.disabled = true;
    confirmJoin.textContent = 'Joining...';

    try {
        showNotification('Join classroom feature coming soon!', 'info');
        closeModal(joinModal);
    } catch (error) {
        showNotification('Failed to join classroom. Please try again.', 'error');
    } finally {
        confirmJoin.disabled = false;
        confirmJoin.textContent = 'Join Class';
    }
}

// ── Load classes ──────────────────────────────────────────────────────────────
async function loadClasses() {
    const container = document.getElementById('classroomGrid');
    if (!container) return;

    container.innerHTML = '<p class="loading-message">Loading your classes...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/classrooms/me`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                showNotification('Authentication required. Please log in again.', 'error');
                setTimeout(() => { window.location.href = 'index.html'; }, 2000);
                return;
            }
            throw new Error(`Failed to fetch classrooms: ${response.status}`);
        }

        const data = await response.json();

        let createdClasses = [];
        let joinedClasses  = [];

        if (Array.isArray(data)) {
            createdClasses = data;
        } else if (data) {
            createdClasses = Array.isArray(data.createdClassrooms) ? data.createdClassrooms
                           : Array.isArray(data.created)           ? data.created
                           : Array.isArray(data.owned)             ? data.owned
                           : Array.isArray(data.classrooms)        ? data.classrooms
                           : Array.isArray(data.data)              ? data.data
                           : Array.isArray(data.data?.classrooms)  ? data.data.classrooms
                           : [];

            joinedClasses  = Array.isArray(data.joinedClassrooms)  ? data.joinedClassrooms
                           : Array.isArray(data.joined)            ? data.joined
                           : Array.isArray(data.member)            ? data.member
                           : Array.isArray(data.data?.joined)      ? data.data.joined
                           : [];
        }

        classroomsData.created = createdClasses;
        classroomsData.joined  = joinedClasses;

        updateTabCounts();
        renderClasses();

    } catch (error) {
        console.error('ERROR in loadClasses:', error);
        container.innerHTML = '<p class="error-message">Failed to load classes. Please try again.</p>';
        showNotification('Failed to load classes', 'error');
    }
}

// ── Tab counts ────────────────────────────────────────────────────────────────
function updateTabCounts() {
    const createdTab = document.querySelector('[data-tab="created"]');
    const joinedTab  = document.querySelector('[data-tab="joined"]');
    if (createdTab) createdTab.innerHTML = `My Classes <span class="tab-count">${classroomsData.created.length}</span>`;
    if (joinedTab)  joinedTab.innerHTML  = `Joined Classes <span class="tab-count">${classroomsData.joined.length}</span>`;
}

// ── Render classes ────────────────────────────────────────────────────────────
function renderClasses() {
    const container = document.getElementById('classroomGrid');
    const classes   = classroomsData[currentTab];
    const isCreated = currentTab === 'created';

    if (classes.length === 0) {
        const msg = isCreated
            ? 'No classes created yet. Create your first class to get started!'
            : 'You haven\'t joined any classes yet.';
        container.innerHTML = `<p class="empty-message">${msg}</p>`;
        return;
    }

    container.innerHTML = classes.map(c => createClassCard(c, isCreated)).join('');
    attachClassCardHandlers();
}

function createClassCard(classroom, isCreated) {
    const studentCount  = classroom.studentCount  || classroom.students?.length || classroom.enrolledCount || classroom.memberCount || 0;
    const maxStudents   = classroom.maxStudents   || classroom.capacity || 50;
    const classCode     = classroom.classCode     || classroom.code || classroom.inviteCode || classroom.id || 'N/A';
    const description   = classroom.description   || classroom.desc || 'No description provided';
    const hasPasscode   = !!(classroom.hasPasscode || classroom.requiresPasscode || classroom.passcode || classroom.isPasswordProtected);
    const requireApproval = !!(classroom.requireApproval || classroom.requiresApproval || classroom.needsApproval || classroom.manualApproval);
    const classId       = classroom.id || classroom.classroomId || classroom._id || 'unknown';
    const className     = classroom.name || classroom.title || classroom.className || 'Unnamed Class';

    return `
        <div class="class-card" data-class-id="${classId}" data-is-created="${isCreated}">
            <div class="class-card-header">
                <h4 class="class-name">${escapeHtml(className)}</h4>
                ${isCreated
                    ? '<span class="badge badge-owner">Owner</span>'
                    : '<span class="badge badge-member">Member</span>'}
            </div>
            <p class="class-description">${escapeHtml(description)}</p>
            <div class="class-info">
                <div class="info-item">
                    <i class="fas fa-users"></i>
                    <span>${studentCount} / ${maxStudents} students</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-code"></i>
                    <span>Code: <strong>${classCode}</strong></span>
                </div>
            </div>
            ${hasPasscode || requireApproval ? `
                <div class="class-settings">
                    ${hasPasscode     ? '<span class="setting-badge"><i class="fas fa-lock"></i> Passcode</span>' : ''}
                    ${requireApproval ? '<span class="setting-badge"><i class="fas fa-user-check"></i> Approval</span>' : ''}
                </div>` : ''}
            <div class="class-actions">
                <button class="btn btn-primary view-class" data-class-id="${classId}">View Class</button>
                ${isCreated ? `<button class="btn btn-secondary manage-class" data-class-id="${classId}">Manage</button>` : ''}
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function attachClassCardHandlers() {
    document.querySelectorAll('.view-class').forEach(btn => {
        btn.addEventListener('click', e => viewClassroom(e.target.dataset.classId));
    });
    document.querySelectorAll('.manage-class').forEach(btn => {
        btn.addEventListener('click', e => manageClassroom(e.target.dataset.classId));
    });
}

function viewClassroom(classId) {
    window.location.href = `classroom.html?id=${classId}`;
}

function manageClassroom(classId) {
    window.location.href = `manage-classroom.html?id=${classId}`;
}

// ── Notifications ─────────────────────────────────────────────────────────────
function showNotification(message, type = 'info') {
    document.querySelector('.notification')?.remove();

    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.textContent = message;
    n.style.cssText = `
        position:fixed;top:20px;right:20px;padding:15px 20px;border-radius:8px;
        color:#fff;font-weight:500;z-index:10000;animation:slideIn .3s ease-out;
        box-shadow:0 4px 12px rgba(0,0,0,.15);max-width:400px;
        background-color:${colors[type] || colors.info};
    `;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.animation = 'slideOut .3s ease-in';
        setTimeout(() => n.remove(), 300);
    }, 3000);
}

// ── Animation styles ──────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn  { from { transform:translateX(400px);opacity:0 } to { transform:translateX(0);opacity:1 } }
    @keyframes slideOut { from { transform:translateX(0);opacity:1 } to { transform:translateX(400px);opacity:0 } }
`;
document.head.appendChild(style);