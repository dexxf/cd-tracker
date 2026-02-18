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
let currentTab = 'created'; // 'created' or 'joined'
let classroomsData = {
    created: [],
    joined: []
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadClasses();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Modal controls
    createClassBtn.addEventListener('click', () => openModal(createModal));
    joinClassBtn.addEventListener('click', () => openModal(joinModal));
    cancelCreate.addEventListener('click', () => closeModal(createModal));
    cancelJoin.addEventListener('click', () => closeModal(joinModal));
    cancelEdit.addEventListener('click', () => closeModal(editProfileModal));

    // Form submissions
    confirmCreate.addEventListener('click', handleCreateClass);
    confirmJoin.addEventListener('click', handleJoinClass);
    saveProfileBtn.addEventListener('click', handleSaveProfile);

    // Profile dropdown
    userIcon.addEventListener('click', toggleProfileDropdown);
    editProfileBtn.addEventListener('click', openEditProfile);
    logoutBtn.addEventListener('click', handleLogout);

    // Passcode toggle
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

    // Tab switching
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        }
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });
}

// Tab switching function
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });
    
    // Render the appropriate classes
    renderClasses();
}

// Modal functions
function openModal(modal) {
    modal.style.display = 'flex';
}

function closeModal(modal) {
    modal.style.display = 'none';
    // Reset form inputs
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

// Profile functions
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

function loadUserProfile() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Update header
    document.getElementById('userName').textContent = userData.fullName || 'Teacher Name';
    document.getElementById('userEmail').textContent = userData.email || 'teacher@example.com';
    document.getElementById('welcomeMsg').textContent = `Welcome back, ${userData.fullName || 'Teacher'}!`;
    
    // Update dropdown
    document.getElementById('fullName').textContent = userData.fullName || 'Full Name';
    document.getElementById('username').textContent = userData.username || '@username';
    
    // Update user icon with initials
    const initials = getInitials(userData.fullName || 'Teacher');
    document.getElementById('userIcon').textContent = initials;
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
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

    loadUserProfile();
    closeModal(editProfileModal);
    showNotification('Profile updated successfully!', 'success');
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('userData');
        localStorage.removeItem('userId');
        localStorage.removeItem('accessToken');
        window.location.href = 'index.html';
    }
}

// Create classroom function
async function handleCreateClass() {
    const name = classNameInput.value.trim();
    const description = classDescInput.value.trim();
    const maxStudents = parseInt(maxStudentsInput.value);
    const hasPasscode = passcodeToggle.checked;
    const passcode = hasPasscode ? passcodeInput.value.trim() : null;
    const requireApproval = requireApprovalInput.checked;

    // Validation
    if (!name) {
        showNotification('Please enter a class name', 'error');
        return;
    }

    if (name.length < 3 || name.length > 100) {
        showNotification('Class name must be between 3 and 100 characters', 'error');
        return;
    }

    if (description && description.length > 500) {
        showNotification('Description cannot exceed 500 characters', 'error');
        return;
    }

    if (!maxStudents || maxStudents < 1 || maxStudents > 100) {
        showNotification('Max students must be between 1 and 100', 'error');
        return;
    }

    // Validate passcode if enabled
    if (hasPasscode) {
        if (!passcode) {
            showNotification('Please enter a passcode', 'error');
            return;
        }
        if (passcode.length < 8) {
            showNotification('Passcode must be at least 8 characters', 'error');
            return;
        }
        if (passcode.length > 100) {
            showNotification('Passcode cannot exceed 100 characters', 'error');
            return;
        }
    }

    // Disable button to prevent double submission
    confirmCreate.disabled = true;
    confirmCreate.textContent = 'Creating...';

    const requestBody = {
        name,
        description: description || null,
        maxStudents,
        requireApproval,
        passcode: passcode || null
    };

    try {
        const response = await fetch(`${API_BASE_URL}/classrooms/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(requestBody)
        });

        const contentType = response.headers.get('content-type');
        let data = null;

        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (parseError) {
                    throw new Error('Invalid response from server');
                }
            }
        }

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication failed. Please log in again.');
            }

            if (response.status === 403) {
                throw new Error('You do not have permission to create classrooms.');
            }

            const errorMessage = data?.message || data?.error || `Server error: ${response.status}`;
            throw new Error(errorMessage);
        }

        showNotification('Classroom created successfully!', 'success');
        closeModal(createModal);
        
        // Reload classes to show the new classroom
        await loadClasses();

    } catch (error) {
        console.error('Error creating classroom:', error);
        showNotification(error.message || 'Failed to create classroom. Please try again.', 'error');
    } finally {
        confirmCreate.disabled = false;
        confirmCreate.textContent = 'Create Class';
    }
}

// Join classroom function
async function handleJoinClass() {
    const classCode = classCodeInput.value.trim();

    if (!classCode) {
        showNotification('Please enter a class code', 'error');
        return;
    }

    confirmJoin.disabled = true;
    confirmJoin.textContent = 'Joining...';

    try {
        showNotification('Join classroom feature coming soon!', 'info');
        closeModal(joinModal);
    } catch (error) {
        console.error('Error joining classroom:', error);
        showNotification('Failed to join classroom. Please try again.', 'error');
    } finally {
        confirmJoin.disabled = false;
        confirmJoin.textContent = 'Join Class';
    }
}

// Load classes function
async function loadClasses() {
    console.log('=== LOAD CLASSES STARTED ===');
    const container = document.getElementById('classroomGrid');
    
    if (!container) {
        console.error('Classroom grid container not found');
        return;
    }

    // Show loading state
    container.innerHTML = '<p class="loading-message">Loading your classes...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/classrooms/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                showNotification('Authentication required. Please log in again.', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            throw new Error(`Failed to fetch classrooms: ${response.status}`);
        }

        const data = await response.json();
        console.log('RAW API Response:', data);
        console.log('Response keys:', Object.keys(data));

        // Parse response into created and joined arrays
        let createdClasses = [];
        let joinedClasses = [];

        // Check if data is directly an array
        if (Array.isArray(data)) {
            createdClasses = data;
        } 
        // Check various possible property names
        else if (data) {
            // Check for created classrooms
            if (data.createdClassrooms !== undefined) {
                createdClasses = Array.isArray(data.createdClassrooms) ? data.createdClassrooms : [];
            } else if (data.created !== undefined) {
                createdClasses = Array.isArray(data.created) ? data.created : [];
            } else if (data.owned !== undefined) {
                createdClasses = Array.isArray(data.owned) ? data.owned : [];
            } else if (data.classrooms !== undefined) {
                createdClasses = Array.isArray(data.classrooms) ? data.classrooms : [];
            } else if (data.data !== undefined) {
                if (Array.isArray(data.data)) {
                    createdClasses = data.data;
                } else if (data.data.classrooms) {
                    createdClasses = Array.isArray(data.data.classrooms) ? data.data.classrooms : [];
                } else if (data.data.created) {
                    createdClasses = Array.isArray(data.data.created) ? data.data.created : [];
                }
            }

            // Check for joined classrooms
            if (data.joinedClassrooms !== undefined) {
                joinedClasses = Array.isArray(data.joinedClassrooms) ? data.joinedClassrooms : [];
            } else if (data.joined !== undefined) {
                joinedClasses = Array.isArray(data.joined) ? data.joined : [];
            } else if (data.member !== undefined) {
                joinedClasses = Array.isArray(data.member) ? data.member : [];
            } else if (data.data && data.data.joined) {
                joinedClasses = Array.isArray(data.data.joined) ? data.data.joined : [];
            }
        }

        console.log('Processed createdClasses:', createdClasses.length);
        console.log('Processed joinedClasses:', joinedClasses.length);

        // Store data
        classroomsData.created = createdClasses;
        classroomsData.joined = joinedClasses;

        // Update tab counts
        updateTabCounts();

        // Render current tab
        renderClasses();

        console.log('=== LOAD CLASSES COMPLETED ===');

    } catch (error) {
        console.error('ERROR in loadClasses:', error);
        container.innerHTML = '<p class="error-message">Failed to load classes. Please try again.</p>';
        showNotification('Failed to load classes', 'error');
    }
}

// Update tab counts
function updateTabCounts() {
    const createdTab = document.querySelector('[data-tab="created"]');
    const joinedTab = document.querySelector('[data-tab="joined"]');
    
    if (createdTab) {
        const count = classroomsData.created.length;
        createdTab.innerHTML = `My Classes <span class="tab-count">${count}</span>`;
    }
    
    if (joinedTab) {
        const count = classroomsData.joined.length;
        joinedTab.innerHTML = `Joined Classes <span class="tab-count">${count}</span>`;
    }
}

// Render classes based on current tab
function renderClasses() {
    const container = document.getElementById('classroomGrid');
    const classes = classroomsData[currentTab];
    const isCreated = currentTab === 'created';

    console.log(`Rendering ${currentTab} classes:`, classes.length);

    if (classes.length === 0) {
        const emptyMessage = isCreated 
            ? 'No classes created yet. Create your first class to get started!'
            : 'You haven\'t joined any classes yet.';
        container.innerHTML = `<p class="empty-message">${emptyMessage}</p>`;
        return;
    }

    const cardsHTML = classes.map(classroom => createClassCard(classroom, isCreated)).join('');
    container.innerHTML = cardsHTML;

    // Attach click handlers
    attachClassCardHandlers();
}

// Create class card HTML
function createClassCard(classroom, isCreated) {
    // Try multiple possible property names for each field
    const studentCount = classroom.studentCount || 
                        classroom.students?.length || 
                        classroom.enrolledCount || 
                        classroom.memberCount || 
                        0;
    
    const maxStudents = classroom.maxStudents || 
                       classroom.capacity || 
                       classroom.maxCapacity || 
                       50;
    
    const classCode = classroom.classCode || 
                     classroom.code || 
                     classroom.inviteCode || 
                     classroom.id || 
                     'N/A';
    
    const description = classroom.description || 
                       classroom.desc || 
                       'No description provided';
    
    const hasPasscode = classroom.hasPasscode || 
                       classroom.requiresPasscode || 
                       classroom.passcode || 
                       classroom.isPasswordProtected || 
                       false;
    
    const requireApproval = classroom.requireApproval || 
                           classroom.requiresApproval || 
                           classroom.needsApproval || 
                           classroom.manualApproval || 
                           false;

    const classId = classroom.id || classroom.classroomId || classroom._id || 'unknown';
    const className = classroom.name || classroom.title || classroom.className || 'Unnamed Class';

    return `
        <div class="class-card" data-class-id="${classId}" data-is-created="${isCreated}">
            <div class="class-card-header">
                <h4 class="class-name">${escapeHtml(className)}</h4>
                ${isCreated ? '<span class="badge badge-owner">Owner</span>' : '<span class="badge badge-member">Member</span>'}
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
                    ${hasPasscode ? '<span class="setting-badge"><i class="fas fa-lock"></i> Passcode</span>' : ''}
                    ${requireApproval ? '<span class="setting-badge"><i class="fas fa-user-check"></i> Approval</span>' : ''}
                </div>
            ` : ''}
            
            <div class="class-actions">
                <button class="btn btn-primary view-class" data-class-id="${classId}">
                    View Class
                </button>
                ${isCreated ? `
                    <button class="btn btn-secondary manage-class" data-class-id="${classId}">
                        Manage
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Attach event handlers to class cards
function attachClassCardHandlers() {
    // View class buttons
    document.querySelectorAll('.view-class').forEach(button => {
        button.addEventListener('click', (e) => {
            const classId = e.target.dataset.classId;
            viewClassroom(classId);
        });
    });

    // Manage class buttons
    document.querySelectorAll('.manage-class').forEach(button => {
        button.addEventListener('click', (e) => {
            const classId = e.target.dataset.classId;
            manageClassroom(classId);
        });
    });
}

// Navigate to classroom view
function viewClassroom(classId) {
    console.log('Viewing classroom:', classId);
    window.location.href = `classroom.html?id=${classId}`;
}

// Navigate to classroom management
function manageClassroom(classId) {
    console.log('Managing classroom:', classId);
    window.location.href = `manage-classroom.html?id=${classId}`;
}

// Notification system
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
    `;

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };

    notification.style.backgroundColor = colors[type] || colors.info;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);