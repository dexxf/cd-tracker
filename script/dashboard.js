// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD.JS — Refactored to implement JOIN CLASSROOM endpoint
// ══════════════════════════════════════════════════════════════════════════════

// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// ── DOM Elements ────────────────────────────────────────────────────────────
const createClassBtn       = document.getElementById('createClassBtn');
const joinClassBtn         = document.getElementById('joinClassBtn');
const createModal          = document.getElementById('createModal');
const joinModal            = document.getElementById('joinModal');
const editProfileModal     = document.getElementById('editProfileModal');
const confirmCreate        = document.getElementById('confirmCreate');
const confirmJoin          = document.getElementById('confirmJoin');
const cancelCreate         = document.getElementById('cancelCreate');
const cancelJoin           = document.getElementById('cancelJoin');
const userIcon             = document.getElementById('userIcon');
const profileDropdown      = document.getElementById('profileDropdown');
const editProfileBtn       = document.getElementById('editProfileBtn');
const logoutBtn            = document.getElementById('logoutBtn');
const cancelEdit           = document.getElementById('cancelEdit');
const saveProfileBtn       = document.getElementById('saveProfileBtn');

// Form inputs — Create Class
const classNameInput       = document.getElementById('classNameInput');
const classDescInput       = document.getElementById('classDescInput');
const maxStudentsInput     = document.getElementById('maxStudentsInput');
const passcodeToggle       = document.getElementById('passcodeToggle');
const passcodeSection      = document.getElementById('passcodeSection');
const passcodeInput        = document.getElementById('passcodeInput');
const requireApprovalInput = document.getElementById('requireApprovalInput');

// Form inputs — Join Class
const classCodeInput       = document.getElementById('classCodeInput');
const joinPasscodeSection  = document.getElementById('joinPasscodeSection');
const joinPasscodeInput    = document.getElementById('joinPasscodeInput');
const joinPasscodeToggle   = document.getElementById('joinPasscodeToggle');

// Tab state
let currentTab = 'created';
let classroomsData = { created: [], joined: [] };

// Current user
let currentUser = null;

// ══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadClasses();
    setupEventListeners();
});

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

function unwrap(val) {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        return val.value ?? val.number ?? val.date ?? val.name ?? '';
    }
    return String(val);
}

function capitalise(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

// ══════════════════════════════════════════════════════════════════════════════
// MODAL HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function openModal(modal) {
    modal.style.display = 'flex';
}

function closeModal(modal) {
    modal.style.display = 'none';
    
    if (modal === createModal) {
        classNameInput.value       = '';
        classDescInput.value       = '';
        maxStudentsInput.value     = '50';
        passcodeToggle.checked     = false;
        passcodeSection.style.display = 'none';
        passcodeInput.value        = '';
        passcodeInput.required     = false;
        requireApprovalInput.checked = false;
    } else if (modal === joinModal) {
        classCodeInput.value = '';
        if (joinPasscodeSection) joinPasscodeSection.style.display = 'none';
        if (joinPasscodeInput) joinPasscodeInput.value = '';
        if (joinPasscodeToggle) joinPasscodeToggle.checked = false;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS SETUP
// ══════════════════════════════════════════════════════════════════════════════

function setupEventListeners() {
    // Modal triggers
    createClassBtn.addEventListener('click', () => openModal(createModal));
    joinClassBtn.addEventListener('click', () => openModal(joinModal));
    cancelCreate.addEventListener('click', () => closeModal(createModal));
    cancelJoin.addEventListener('click', () => closeModal(joinModal));
    cancelEdit.addEventListener('click', () => closeModal(editProfileModal));

    // Form submissions
    confirmCreate.addEventListener('click', handleCreateClass);
    confirmJoin.addEventListener('click', handleJoinClass);
    saveProfileBtn.addEventListener('click', handleSaveProfile);

    // Profile menu
    userIcon.addEventListener('click', toggleProfileDropdown);
    editProfileBtn.addEventListener('click', openEditProfile);
    logoutBtn.addEventListener('click', handleLogout);

    // Create class passcode toggle
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

    // Join class passcode toggle (if element exists)
    if (joinPasscodeToggle) {
        joinPasscodeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                joinPasscodeSection.style.display = 'block';
                joinPasscodeInput.required = true;
            } else {
                joinPasscodeSection.style.display = 'none';
                joinPasscodeInput.required = false;
                joinPasscodeInput.value = '';
            }
        });
    }

    // Tab switching
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            switchTab(e.target.dataset.tab);
        }
    });

    // Modal close on background click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal(e.target);
    });

    // Profile dropdown close on outside click
    document.addEventListener('click', (e) => {
        if (!userIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

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
        showNotification('Failed to load profile', 'error');
    }
}

function applyProfileToUI(data) {
    const firstName  = data.firstName || '';
    const lastName   = data.lastName  || '';
    const fullName   = `${firstName} ${lastName}`.trim() || 'User';
    const profileUrl = data.profileUrl || '';
    const gender     = capitalise(unwrap(data.gender));

    // Header
    document.getElementById('userName').textContent   = fullName;
    document.getElementById('welcomeMsg').textContent = `Welcome back, ${firstName || fullName}!`;

    // Dropdown
    document.getElementById('fullName').textContent = fullName;
    document.getElementById('username').textContent = gender;

    // Avatar
    const iconEl = document.getElementById('userIcon');
    if (profileUrl) {
        iconEl.innerHTML = `<img src="${profileUrl}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
        iconEl.textContent = getInitials(fullName);
    }
}

function toggleProfileDropdown(e) {
    e.stopPropagation();
    profileDropdown.classList.toggle('show');
}

async function openEditProfile() {
    profileDropdown.classList.remove('show');

    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();

        document.getElementById('editFirstNameInput').value = data.firstName           || '';
        document.getElementById('editLastNameInput').value  = data.lastName            || '';
        document.getElementById('editPhoneInput').value     = unwrap(data.phoneNumber) || '';
        document.getElementById('editGenderInput').value    = unwrap(data.gender)      || '';
        document.getElementById('editBirthdayInput').value  = unwrap(data.birthday)    || '';
        document.getElementById('editBioInput').value       = data.bio                 || '';

    } catch (error) {
        console.error('Error fetching profile for edit:', error);
        showNotification('Failed to load profile data', 'error');
        return;
    }

    openModal(editProfileModal);
}

async function handleSaveProfile() {
    const firstName   = document.getElementById('editFirstNameInput').value.trim();
    const lastName    = document.getElementById('editLastNameInput').value.trim();
    const phoneNumber = document.getElementById('editPhoneInput').value.trim();
    const gender      = document.getElementById('editGenderInput').value.trim();
    const birthday    = document.getElementById('editBirthdayInput').value;
    const bio         = document.getElementById('editBioInput').value;

    if (!firstName || !lastName || !phoneNumber || !gender || !birthday) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    saveProfileBtn.disabled     = true;
    saveProfileBtn.textContent  = 'Saving...';

    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ firstName, lastName, phoneNumber, gender, birthday, bio })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile');
        }

        showNotification('Profile updated successfully!', 'success');
        closeModal(editProfileModal);
        await loadUserProfile();

    } catch (error) {
        console.error(error);
        showNotification(error.message || 'Update failed', 'error');
    } finally {
        saveProfileBtn.disabled    = false;
        saveProfileBtn.textContent = 'Save Changes';
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// CLASSROOM MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

async function handleCreateClass() {
    const name            = classNameInput.value.trim();
    const description     = classDescInput.value.trim();
    const maxStudents     = parseInt(maxStudentsInput.value);
    const requireApproval = requireApprovalInput.checked;
    const passcode        = passcodeToggle.checked ? passcodeInput.value.trim() : null;

    // Validation
    if (!name) {
        return showNotification('Please enter a class name', 'error');
    }
    if (name.length < 3 || name.length > 100) {
        return showNotification('Class name must be 3–100 characters', 'error');
    }
    if (description && description.length > 500) {
        return showNotification('Description cannot exceed 500 characters', 'error');
    }
    if (!maxStudents || maxStudents < 1 || maxStudents > 100) {
        return showNotification('Max students must be 1–100', 'error');
    }
    if (passcode && passcode.length < 4) {
        return showNotification('Passcode must be at least 4 characters', 'error');
    }

    confirmCreate.disabled     = true;
    confirmCreate.textContent  = 'Creating...';

    try {
        const response = await fetch(`${API_BASE_URL}/classrooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                name,
                description: description || null,
                maxStudents,
                requireApproval,
                passcode: passcode || null
            })
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
        confirmCreate.disabled    = false;
        confirmCreate.textContent = 'Create Class';
    }
}

/**
 * Handle join classroom — POST /api/classrooms/join
 * Sends: { code: string, passcode?: string }
 * Returns: { success: boolean, data: ClassroomJoinResult, error?: string }
 */
async function handleJoinClass() {
    const code = classCodeInput.value.trim();
    const passcode = joinPasscodeToggle?.checked ? joinPasscodeInput?.value.trim() : undefined;

    if (!code) {
        return showNotification('Please enter a class code', 'error');
    }

    confirmJoin.disabled    = true;
    confirmJoin.textContent = 'Joining...';

    try {
        const payload = { code };
        if (passcode) {
            payload.passcode = passcode;
        }

        console.log('Sending join request with payload:', payload);

        const response = await fetch(`${API_BASE_URL}/classrooms/join`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', {
            'content-type': response.headers.get('content-type')
        });

        // Try to parse response as text first
        const responseText = await response.text();
        console.log('Response text:', responseText);

        let data = null;
        try {
            if (responseText) {
                data = JSON.parse(responseText);
            }
        } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            throw new Error(`Invalid response format from server: ${responseText}`);
        }

        // Check if response is OK first
        if (!response.ok) {
            const errorMsg = data?.error || data?.message || `Server error: ${response.status}`;
            throw new Error(errorMsg);
        }

        // Then check for success flag
        if (data && data.success === false) {
            const errorMsg = data.error || data.message || 'Failed to join classroom';
            throw new Error(errorMsg);
        }

        // Success!
        console.log('Successfully joined classroom:', data);
        showNotification('Successfully joined classroom!', 'success');
        closeModal(joinModal);
        await loadClasses();

    } catch (error) {
        console.error('Error joining classroom:', error);
        showNotification(error.message || 'Failed to join classroom. Please try again.', 'error');
    } finally {
        confirmJoin.disabled    = false;
        confirmJoin.textContent = 'Join Class';
    }
}

async function loadClasses() {
    const container = document.getElementById('classroomGrid');
    if (!container) return;

    container.innerHTML = '<p class="loading-message">Loading your classes...</p>';

    try {
        // Load created classrooms
        const createdResponse = await fetch(`${API_BASE_URL}/classrooms/me`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!createdResponse.ok) {
            if (createdResponse.status === 401) {
                showNotification('Authentication required. Please log in again.', 'error');
                setTimeout(() => { window.location.href = 'index.html'; }, 2000);
                return;
            }
            throw new Error(`Failed to fetch classrooms: ${createdResponse.status}`);
        }

        const createdData = await createdResponse.json();
        let createdClasses = Array.isArray(createdData) ? createdData : createdData.data || [];

        // Load joined classrooms
        const joinedResponse = await fetch(`${API_BASE_URL}/classrooms/join`, {
            method: 'GET',
            credentials: 'include'
        });

        let joinedClasses = [];
        if (joinedResponse.ok) {
            const joinedData = await joinedResponse.json();
            joinedClasses = Array.isArray(joinedData) ? joinedData : joinedData.data || [];
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

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    renderClasses();
}

function updateTabCounts() {
    const createdTab = document.querySelector('[data-tab="created"]');
    const joinedTab  = document.querySelector('[data-tab="joined"]');
    if (createdTab) createdTab.innerHTML = `My Classes <span class="tab-count">${classroomsData.created.length}</span>`;
    if (joinedTab)  joinedTab.innerHTML  = `Joined Classes <span class="tab-count">${classroomsData.joined.length}</span>`;
}

function renderClasses() {
    const container = document.getElementById('classroomGrid');
    const classes   = classroomsData[currentTab];
    const isCreated = currentTab === 'created';

    if (classes.length === 0) {
        const msg = isCreated
            ? 'No classes created yet. Create your first class to get started!'
            : "You haven't joined any classes yet.";
        container.innerHTML = `<p class="empty-message">${msg}</p>`;
        return;
    }

    container.innerHTML = classes.map(c => createClassCard(c, isCreated)).join('');
    attachClassCardHandlers();
}

function createClassCard(classroom, isCreated) {
    const studentCount    = classroom.studentCount  || classroom.students?.length || classroom.enrolledCount || classroom.memberCount || 0;
    const maxStudents     = classroom.maxStudents   || classroom.capacity || 50;
    const classCode       = classroom.classCode     || classroom.code || classroom.inviteCode || classroom.id || 'N/A';
    const description     = classroom.description   || classroom.desc || 'No description provided';
    const hasPasscode     = !!(classroom.hasPasscode || classroom.requiresPasscode || classroom.passcode || classroom.isPasswordProtected);
    const requireApproval = !!(classroom.requireApproval || classroom.requiresApproval || classroom.needsApproval || classroom.manualApproval);
    const classId         = classroom.id || classroom.classroomId || classroom._id || 'unknown';
    const className       = classroom.name || classroom.title || classroom.className || 'Unnamed Class';

    return `
        <div class="class-card" data-class-id="${classId}">
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
                    <span>Code: <strong>${escapeHtml(String(classCode))}</strong></span>
                </div>
            </div>
            ${hasPasscode || requireApproval ? `
                <div class="class-settings">
                    ${hasPasscode     ? '<span class="setting-badge"><i class="fas fa-lock"></i> Passcode</span>'        : ''}
                    ${requireApproval ? '<span class="setting-badge"><i class="fas fa-user-check"></i> Approval</span>' : ''}
                </div>` : ''}
            <div class="class-actions">
                <button class="btn btn-primary view-class" data-class-id="${classId}">View Class</button>
                ${isCreated ? `<button class="btn btn-secondary manage-class" data-class-id="${classId}">Manage</button>` : ''}
            </div>
        </div>
    `;
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

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATION STYLES
// ══════════════════════════════════════════════════════════════════════════════

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn  { from { transform:translateX(400px);opacity:0 } to { transform:translateX(0);opacity:1 } }
    @keyframes slideOut { from { transform:translateX(0);opacity:1 } to { transform:translateX(400px);opacity:0 } }
`;
document.head.appendChild(style);