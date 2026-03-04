// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD.JS — Fixed and Refactored
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
const joinPasscodeToggle   = document.getElementById('joinPasscodeToggle');
const joinPasscodeSection  = document.getElementById('joinPasscodeSection');
const joinPasscodeInput    = document.getElementById('joinPasscodeInput');

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
    if (modal) modal.style.display = 'flex';
}

function closeModal(modal) {
    if (!modal) return;
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

function closeProfileDropdown() {
    if (profileDropdown) {
        profileDropdown.classList.remove('show');
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS SETUP
// ══════════════════════════════════════════════════════════════════════════════

function setupEventListeners() {
    // Modal triggers
    createClassBtn?.addEventListener('click', () => openModal(createModal));
    joinClassBtn?.addEventListener('click', () => openModal(joinModal));
    cancelCreate?.addEventListener('click', () => closeModal(createModal));
    cancelJoin?.addEventListener('click', () => closeModal(joinModal));
    cancelEdit?.addEventListener('click', () => closeModal(editProfileModal));

    // Form submissions
    confirmCreate?.addEventListener('click', handleCreateClass);
    confirmJoin?.addEventListener('click', handleJoinClass);
    saveProfileBtn?.addEventListener('click', handleSaveProfile);

    // Profile menu
    userIcon?.addEventListener('click', toggleProfileDropdown);
    editProfileBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeProfileDropdown();
        openEditProfile();
    });
    logoutBtn?.addEventListener('click', handleLogout);

    // Create class passcode toggle
    passcodeToggle?.addEventListener('change', (e) => {
        if (e.target.checked) {
            passcodeSection.style.display = 'block';
            passcodeInput.required = true;
        } else {
            passcodeSection.style.display = 'none';
            passcodeInput.required = false;
            passcodeInput.value = '';
        }
    });

    // Join class passcode toggle
    joinPasscodeToggle?.addEventListener('change', (e) => {
        if (e.target.checked) {
            if (joinPasscodeSection) joinPasscodeSection.style.display = 'block';
            if (joinPasscodeInput) joinPasscodeInput.required = true;
        } else {
            if (joinPasscodeSection) joinPasscodeSection.style.display = 'none';
            if (joinPasscodeInput) {
                joinPasscodeInput.required = false;
                joinPasscodeInput.value = '';
            }
        }
    });

    // Tab switching
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            switchTab(e.target.dataset.tab);
        }
    });

    // Modal close on background click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') && e.target.style.display === 'flex') {
            closeModal(e.target);
        }
    });

    // Profile dropdown close on outside click
    document.addEventListener('click', (e) => {
        const isUserIconClick = userIcon && userIcon.contains(e.target);
        const isDropdownClick = profileDropdown && profileDropdown.contains(e.target);
        
        if (!isUserIconClick && !isDropdownClick) {
            closeProfileDropdown();
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
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = fullName;
    
    const welcomeEl = document.getElementById('welcomeMsg');
    if (welcomeEl) welcomeEl.textContent = `Welcome back, ${firstName || fullName}!`;

    // Dropdown
    const fullNameEl = document.getElementById('fullName');
    if (fullNameEl) fullNameEl.textContent = fullName;
    
    const usernameEl = document.getElementById('username');
    if (usernameEl) usernameEl.textContent = gender;

    // Avatar
    const iconEl = document.getElementById('userIcon');
    if (iconEl) {
        if (profileUrl) {
            iconEl.innerHTML = `<img src="${escapeHtml(profileUrl)}" alt="${escapeHtml(fullName)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            iconEl.textContent = getInitials(fullName);
        }
    }
}

function toggleProfileDropdown(e) {
    e.stopPropagation();
    if (profileDropdown) {
        profileDropdown.classList.toggle('show');
    }
}

async function openEditProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();

        const firstNameEl = document.getElementById('editFirstNameInput');
        const lastNameEl = document.getElementById('editLastNameInput');
        const phoneEl = document.getElementById('editPhoneInput');
        const genderEl = document.getElementById('editGenderInput');
        const birthdayEl = document.getElementById('editBirthdayInput');
        const bioEl = document.getElementById('editBioInput');

        if (firstNameEl) firstNameEl.value = data.firstName || '';
        if (lastNameEl) lastNameEl.value = data.lastName || '';
        if (phoneEl) phoneEl.value = unwrap(data.phoneNumber) || '';
        if (genderEl) genderEl.value = unwrap(data.gender) || '';
        if (birthdayEl) birthdayEl.value = unwrap(data.birthday) || '';
        if (bioEl) bioEl.value = data.bio || '';

        openModal(editProfileModal);

    } catch (error) {
        console.error('Error fetching profile for edit:', error);
        showNotification('Failed to load profile data', 'error');
    }
}

async function handleSaveProfile() {
    const firstNameEl = document.getElementById('editFirstNameInput');
    const lastNameEl = document.getElementById('editLastNameInput');
    const phoneEl = document.getElementById('editPhoneInput');
    const genderEl = document.getElementById('editGenderInput');
    const birthdayEl = document.getElementById('editBirthdayInput');
    const bioEl = document.getElementById('editBioInput');

    const firstName   = firstNameEl?.value.trim() || '';
    const lastName    = lastNameEl?.value.trim() || '';
    const phoneNumber = phoneEl?.value.trim() || '';
    const gender      = genderEl?.value.trim() || '';
    const birthday    = birthdayEl?.value || '';
    const bio         = bioEl?.value || '';

    if (!firstName || !lastName || !phoneNumber || !gender || !birthday) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    if (saveProfileBtn) {
        saveProfileBtn.disabled    = true;
        saveProfileBtn.textContent = 'Saving...';
    }

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
        if (saveProfileBtn) {
            saveProfileBtn.disabled    = false;
            saveProfileBtn.textContent = 'Save Changes';
        }
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// CLASSROOM MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

async function handleCreateClass() {
    const name            = classNameInput?.value.trim() || '';
    const description     = classDescInput?.value.trim() || '';
    const maxStudents     = parseInt(maxStudentsInput?.value || '50');
    const requireApproval = requireApprovalInput?.checked || false;
    const passcode        = passcodeToggle?.checked ? passcodeInput?.value.trim() : null;

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

    if (confirmCreate) {
        confirmCreate.disabled    = true;
        confirmCreate.textContent = 'Creating...';
    }

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
        if (confirmCreate) {
            confirmCreate.disabled    = false;
            confirmCreate.textContent = 'Create Class';
        }
    }
}

async function handleJoinClass() {
    const code = classCodeInput?.value.trim() || '';
    const passcode = joinPasscodeToggle?.checked ? joinPasscodeInput?.value.trim() : undefined;

    if (!code) {
        return showNotification('Please enter a class code', 'error');
    }

    if (confirmJoin) {
        confirmJoin.disabled    = true;
        confirmJoin.textContent = 'Joining...';
    }

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

        const responseText = await response.text();
        console.log('Response text:', responseText);

        let data = null;
        try {
            if (responseText) {
                data = JSON.parse(responseText);
            }
        } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            throw new Error(`Invalid response format from server`);
        }

        if (!response.ok) {
            const errorMsg = data?.error || data?.message || `Server error: ${response.status}`;
            throw new Error(errorMsg);
        }

        if (data && data.success === false) {
            const errorMsg = data.error || data.message || 'Failed to join classroom';
            throw new Error(errorMsg);
        }

        console.log('Successfully joined classroom:', data);
        showNotification('Successfully joined classroom!', 'success');
        closeModal(joinModal);
        await loadClasses();

    } catch (error) {
        console.error('Error joining classroom:', error);
        showNotification(error.message || 'Failed to join classroom. Please try again.', 'error');
    } finally {
        if (confirmJoin) {
            confirmJoin.disabled    = false;
            confirmJoin.textContent = 'Join Class';
        }
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
        let joinedClasses = [];
        try {
            const joinedResponse = await fetch(`${API_BASE_URL}/classrooms/join`, {
                method: 'GET',
                credentials: 'include'
            });

            if (joinedResponse.ok) {
                const joinedData = await joinedResponse.json();
                joinedClasses = Array.isArray(joinedData) 
                    ? joinedData.map(item => ({
                        ...item.classroom,
                        studentCount: item.studentCount
                    }))
                    : [];
            }
        } catch (error) {
            console.warn('Failed to load joined classrooms:', error);
            joinedClasses = [];
        }

        classroomsData.created = createdClasses;
        classroomsData.joined  = joinedClasses;

        updateTabCounts();
        renderClasses();

    } catch (error) {
        console.error('ERROR in loadClasses:', error);
        if (container) {
            container.innerHTML = '<p class="error-message">Failed to load classes. Please try again.</p>';
        }
        showNotification('Failed to load classes', 'error');
    }
}

function switchTab(tab) {
    if (!tab) return;
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
    if (!container) return;

    const classes   = classroomsData[currentTab] || [];
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
        <div class="class-card" data-class-id="${escapeHtml(classId)}">
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
                <button class="btn btn-primary view-class" data-class-id="${escapeHtml(classId)}">View Class</button>
                ${isCreated ? `<button class="btn btn-secondary manage-class" data-class-id="${escapeHtml(classId)}">Manage</button>` : ''}
            </div>
        </div>
    `;
}

function attachClassCardHandlers() {
    document.querySelectorAll('.view-class').forEach(btn => {
        btn.addEventListener('click', e => {
            const classId = e.target.dataset.classId;
            if (classId) viewClassroom(classId);
        });
    });
    document.querySelectorAll('.manage-class').forEach(btn => {
        btn.addEventListener('click', e => {
            const classId = e.target.dataset.classId;
            if (classId) manageClassroom(classId);
        });
    });
}

function viewClassroom(classId) {
    if (classId && classId !== 'unknown') {
        window.location.href = `classroom.html?id=${encodeURIComponent(classId)}`;
    } else {
        showNotification('Invalid classroom ID', 'error');
    }
}

function manageClassroom(classId) {
    if (classId && classId !== 'unknown') {
        window.location.href = `manage-classroom.html?id=${encodeURIComponent(classId)}`;
    } else {
        showNotification('Invalid classroom ID', 'error');
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn  { from { transform:translateX(400px);opacity:0 } to { transform:translateX(0);opacity:1 } }
    @keyframes slideOut { from { transform:translateX(0);opacity:1 } to { transform:translateX(400px);opacity:0 } }
`;
document.head.appendChild(style);