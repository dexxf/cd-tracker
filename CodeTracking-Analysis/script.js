// Complete enhanced JavaScript with all new features

// Sample data for demo
const demoData = {
  overview: {
    completed: "1/2",
    inProgress: 1,
    notStarted: 0,
    avgScore: "75%"
  },
  heatmap: [14, 9, 7, 12, 1, 4, 4], // Monday to Sunday totals
  branches: [
    {
      name: "main",
      commits: [
        { msg: "Initial project setup", hash: "a3f12bc", ago: "2 days ago" },
        { msg: "Add authentication logic", hash: "b7e45cd", ago: "1 day ago" },
        { msg: "Fix login bug", hash: "c9a78ef", ago: "5 hours ago" }
      ]
    },
    {
      name: "feature/ui-updates",
      commits: [
        { msg: "Update dashboard design", hash: "d4a23bc", ago: "3 hours ago" },
        { msg: "Add responsive styles", hash: "e6b89cd", ago: "1 hour ago" }
      ]
    }
  ],
  assignments: [
    {
      id: 1,
      title: "GitHub CodeTracker Project",
      due: "2026-02-20",
      desc: "Build a student project tracking system using GitHub commits as basis.",
      status: "In Progress",
      progress: 65,
      difficulty: "medium",
      assignTo: "All Students"
    },
    {
      id: 2,
      title: "Web API Development",
      due: "2026-02-25",
      desc: "Create RESTful API with authentication and data validation.",
      status: "Not Started",
      progress: 0,
      difficulty: "hard",
      assignTo: "All Students"
    }
  ],
  timeline: [
    { action: "Pushed commit to main branch", time: "2 hours ago", type: "commit", passed: true },
    { action: "Created feature/dashboard branch", time: "1 day ago", type: "branch", passed: true },
    { action: "Submitted GitHub repository", time: "2 days ago", type: "submission", passed: true },
    { action: "Instructor reviewed commits", time: "3 days ago", type: "review", passed: true },
    { action: "Updated README.md", time: "4 days ago", type: "commit", passed: true }
  ],
  analytics: {
    completion: 50,
    classAvgCompletion: 65,
    avgScore: 75,
    classAvgScore: 72,
    predictedGrade: "80%",
    gradeDistribution: {
      A: 15,
      B: 25,
      C: 30,
      D: 20,
      F: 10
    }
  },
  feedback: [
    {
      id: 1,
      author: "Instructor",
      role: "Senior Lecturer",
      text: "Good commit frequency. Try to add clearer commit messages with descriptive summaries of changes made.",
      date: "Feb 3, 2026",
      type: "code_quality"
    },
    {
      id: 2,
      author: "Instructor",
      role: "Senior Lecturer",
      text: "Dashboard UI looks clean and professional. Analytics logic needs improvement in error handling.",
      date: "Feb 5, 2026",
      type: "performance"
    }
  ],
  codeQuality: {
    overallScore: 82,
    complexity: {
      cyclomatic: 12.3,
      maintainability: 78,
      duplication: 5.2
    },
    standards: {
      naming: 92,
      formatting: 88,
      documentation: 45,
      errorHandling: 76
    },
    testCoverage: {
      unit: 78,
      integration: 45,
      total: 65
    }
  }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadDemoData();
  initEventListeners();
  initOverview();
  initGradeChart();
  initTestCoverageChart();
});

// Tab switching with smooth animations
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".content");

  tabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      const targetId = tab.dataset.tab;
      
      // Update active states
      tabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      
      // Hide all contents with fade out
      contents.forEach(content => {
        if (content.classList.contains("active")) {
          content.style.opacity = "0";
          content.style.transform = "translateY(10px)";
          
          setTimeout(() => {
            content.classList.remove("active");
            content.style.display = "none";
            content.style.opacity = "";
            content.style.transform = "";
          }, 200);
        }
      });
      
      // Show target content with fade in
      setTimeout(() => {
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.style.display = "block";
          targetContent.style.opacity = "0";
          targetContent.style.transform = "translateY(10px)";
          
          requestAnimationFrame(() => {
            targetContent.classList.add("active");
            targetContent.style.opacity = "1";
            targetContent.style.transform = "translateY(0)";
          });
        }
      }, 220);
    });
  });
}

// Load demo data
function loadDemoData() {
  document.getElementById("demoBtn").addEventListener("click", () => {
    // Add loading animation
    const btn = document.getElementById("demoBtn");
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Loading...</span>';
    btn.disabled = true;
    
    setTimeout(() => {
      loadOverview();
      loadHeatmap();
      loadBranches();
      loadAssignments();
      loadTimeline();
      loadAnalytics();
      loadFeedback();
      loadCodeQuality();
      
      // Restore button
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      
      // Show success notification
      showNotification("Demo data loaded successfully!", "success");
    }, 800);
  });
}

// Initialize event listeners
function initEventListeners() {
  // Assignment form submission
  const assignmentForm = document.getElementById("assignmentForm");
  if (assignmentForm) {
    assignmentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const title = document.getElementById("title").value;
      const due = document.getElementById("due").value;
      const difficulty = document.getElementById("difficulty").value;
      const desc = document.getElementById("desc").value;
      
      if (title && due && difficulty) {
        addAssignment({
          id: Date.now(),
          title,
          due,
          desc,
          difficulty,
          assignTo: "All Students",
          status: "Not Started",
          progress: 0
        });
        
        assignmentForm.reset();
        showNotification("Assignment added successfully!", "success");
      }
    });
  }
  
  // Auto-generate assignments
  const generateAssignmentsBtn = document.getElementById("generateAssignments");
  if (generateAssignmentsBtn) {
    generateAssignmentsBtn.addEventListener("click", generateSampleAssignments);
  }
  
  // Auto-generate feedback
  const generateFeedbackBtn = document.getElementById("generateFeedback");
  if (generateFeedbackBtn) {
    generateFeedbackBtn.addEventListener("click", generateSampleFeedback);
  }
  
  // AI Feedback generation
  const generateAIFeedbackBtn = document.getElementById("generateAIFeedback");
  if (generateAIFeedbackBtn) {
    generateAIFeedbackBtn.addEventListener("click", generateAIFeedback);
  }
}

// Show notification
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => {
    notification.remove();
  });
  
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === "success" ? "check-circle" : "info-circle"}"></i>
    <span>${message}</span>
    <button class="notification-close"><i class="fas fa-times"></i></button>
  `;
  
  document.body.appendChild(notification);
  
  // Add styles if not already added
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--card);
        border: 1px solid var(--border);
        border-left: 4px solid var(--accent);
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: var(--shadow);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 400px;
        font-size: 14px;
      }
      .notification.success {
        border-left-color: var(--success);
      }
      .notification i {
        font-size: 16px;
      }
      .notification.success i {
        color: var(--success);
      }
      .notification-close {
        background: none;
        border: none;
        color: var(--muted);
        cursor: pointer;
        padding: 4px;
        margin-left: auto;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Auto remove after 5 seconds
  const timeout = setTimeout(() => {
    notification.style.animation = "slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 5000);
  
  // Close button
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    clearTimeout(timeout);
    notification.style.animation = "slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  });
}

// Overview functions
function initOverview() {
  loadHeatmap();
  loadBranches();
  updatePerformanceOverview();
}

function updatePerformanceOverview() {
  document.getElementById("completedVal").textContent = demoData.overview.completed;
  document.getElementById("inProgressVal").textContent = demoData.overview.inProgress;
  document.getElementById("notStartedVal").textContent = demoData.overview.notStarted;
  document.getElementById("avgScoreVal").textContent = demoData.overview.avgScore;
}

function loadHeatmap() {
  const grid = document.getElementById("heatmapGrid");
  if (!grid) return;
  
  grid.innerHTML = "";
  
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyTotals = demoData.heatmap;
  
  weekdays.forEach((day, index) => {
    const row = document.createElement("div");
    row.className = "heatmap-row";
    
    // Day label
    const label = document.createElement("div");
    label.className = "weekday-label";
    label.textContent = day;
    
    // Cells (4 weeks)
    const cells = document.createElement("div");
    cells.className = "weekday-cells";
    
    const dayTotal = dailyTotals[index];
    const weekCounts = distributeEvenly(dayTotal, 4);
    
    weekCounts.forEach((count, weekIndex) => {
      const cell = document.createElement("div");
      cell.className = "cell-small";
      
      // Add level class based on count
      if (count === 0) {
        cell.classList.add("cell-level-0");
      } else if (count <= 3) {
        cell.classList.add("cell-level-1");
      } else if (count <= 7) {
        cell.classList.add("cell-level-2");
      } else if (count <= 10) {
        cell.classList.add("cell-level-3");
      } else {
        cell.classList.add("cell-level-4");
      }
      
      // Add tooltip with week info
      const weekNames = ["Week 1", "Week 2", "Week 3", "Week 4"];
      cell.title = `${weekNames[weekIndex]}: ${count} commit${count !== 1 ? "s" : ""}`;
      cell.setAttribute('data-count', count);
      cells.appendChild(cell);
    });
    
    // Day total count
    const count = document.createElement("div");
    count.className = "weekday-count";
    count.textContent = dayTotal;
    
    row.appendChild(label);
    row.appendChild(cells);
    row.appendChild(count);
    grid.appendChild(row);
  });
}

function distributeEvenly(total, weeks) {
  const base = Math.floor(total / weeks);
  const remainder = total % weeks;
  const result = Array(weeks).fill(base);
  
  for (let i = 0; i < remainder; i++) {
    result[i]++;
  }
  
  return result;
}

function loadBranches() {
  const list = document.getElementById("branchesList");
  if (!list) return;
  
  list.innerHTML = "";
  
  demoData.branches.forEach(branch => {
    const branchCard = document.createElement("div");
    branchCard.className = "branch-card";
    
    const commitsHTML = branch.commits.map(commit => `
      <div class="commit-item">
        <div class="commit-left">
          <div class="commit-title">${commit.msg}</div>
          <div class="commit-meta">
            <span>${commit.ago}</span>
            <span class="commit-hash">${commit.hash}</span>
          </div>
        </div>
        <a href="#" class="view-link" onclick="viewCommit('${commit.hash}'); return false;">
          <i class="fas fa-external-link-alt"></i>
          View
        </a>
      </div>
    `).join("");
    
    branchCard.innerHTML = `
      <div class="branch-header">
        <div class="branch-name">
          <div class="branch-icon">
            <i class="fas fa-code-branch"></i>
          </div>
          ${branch.name}
        </div>
        <div class="branch-count">${branch.commits.length} commits</div>
      </div>
      <div class="commit-list">
        ${commitsHTML}
      </div>
    `;
    
    list.appendChild(branchCard);
  });
}

function viewCommit(hash) {
  showNotification(`Viewing commit ${hash} (simulated)`, "info");
}

// Assignment functions
function loadAssignments() {
  const list = document.getElementById("assignList");
  if (!list) return;
  
  list.innerHTML = "";
  
  demoData.assignments.forEach(assignment => {
    const li = createAssignmentElement(assignment);
    list.appendChild(li);
  });
}

function createAssignmentElement(assignment) {
  const li = document.createElement("li");
  
  const difficultyColor = {
    easy: "#3fb950",
    medium: "#d29922",
    hard: "#f85149"
  }[assignment.difficulty] || "#8b949e";
  
  li.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <strong style="font-size: 15px;">${assignment.title}</strong>
          <span style="font-size: 12px; padding: 2px 8px; border-radius: 12px; background: ${difficultyColor}20; color: ${difficultyColor}; border: 1px solid ${difficultyColor}40;">
            ${assignment.difficulty.charAt(0).toUpperCase() + assignment.difficulty.slice(1)}
          </span>
        </div>
        <div class="muted" style="margin: 8px 0; font-size: 14px;">${assignment.desc}</div>
        <div style="display: flex; gap: 16px; font-size: 13px; color: var(--muted);">
          <span><i class="far fa-calendar"></i> Due: ${assignment.due}</span>
          <span><i class="fas fa-user"></i> ${assignment.assignTo}</span>
        </div>
      </div>
      <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <span class="${assignment.status === "In Progress" ? "badge blue" : "badge muted"}" 
              style="background: ${assignment.status === "In Progress" ? "rgba(88, 166, 255, 0.15)" : "rgba(139, 157, 195, 0.15)"}; 
                     border: 1px solid ${assignment.status === "In Progress" ? "rgba(88, 166, 255, 0.4)" : "rgba(139, 157, 195, 0.4)"};">
          ${assignment.status}
        </span>
        <div>
          <div class="progress" style="width: 120px; height: 6px;">
            <div class="progress-bar" style="width: ${assignment.progress}%"></div>
          </div>
          <div class="muted" style="font-size: 12px; margin-top: 4px;">${assignment.progress}% complete</div>
        </div>
      </div>
    </div>
  `;
  
  // Add click handler for assignment details
  li.style.cursor = "pointer";
  li.addEventListener("click", () => {
    showAssignmentDetails(assignment);
  });
  
  return li;
}

function showAssignmentDetails(assignment) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${assignment.title}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p><strong>Description:</strong> ${assignment.desc}</p>
        <p><strong>Due Date:</strong> ${assignment.due}</p>
        <p><strong>Difficulty:</strong> ${assignment.difficulty}</p>
        <p><strong>Status:</strong> ${assignment.status}</p>
        <p><strong>Progress:</strong> ${assignment.progress}%</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add modal styles
  if (!document.querySelector('#modal-styles')) {
    const style = document.createElement("style");
    style.id = "modal-styles";
    style.textContent = `
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        animation: fadeIn 0.3s ease;
      }
      .modal-content {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 6px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border);
      }
      .modal-header h3 {
        margin: 0;
        font-size: 18px;
      }
      .modal-close {
        background: none;
        border: none;
        color: var(--muted);
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-body {
        padding: 20px;
      }
      .modal-body p {
        margin: 0 0 12px 0;
        font-size: 14px;
      }
      .modal-body strong {
        color: var(--text-light);
        display: inline-block;
        width: 120px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Close modal
  modal.querySelector(".modal-close").addEventListener("click", () => {
    modal.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => modal.remove(), 300);
  });
  
  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.animation = "fadeOut 0.3s ease";
      setTimeout(() => modal.remove(), 300);
    }
  });
}

function addAssignment(assignment) {
  const list = document.getElementById("assignList");
  if (!list) return;
  
  const li = createAssignmentElement(assignment);
  list.prepend(li);
}

function generateSampleAssignments() {
  const sampleAssignments = [
    {
      id: Date.now() + 1,
      title: "React Component Library",
      due: "2026-03-01",
      desc: "Build a reusable React component library with Storybook documentation.",
      difficulty: "hard",
      assignTo: "All Students",
      status: "Not Started",
      progress: 0
    },
    {
      id: Date.now() + 2,
      title: "Database Design",
      due: "2026-02-28",
      desc: "Design and implement a normalized database schema for an e-commerce platform.",
      difficulty: "medium",
      assignTo: "Advanced Students",
      status: "Not Started",
      progress: 0
    },
    {
      id: Date.now() + 3,
      title: "Algorithm Implementation",
      due: "2026-02-22",
      desc: "Implement sorting and searching algorithms with performance analysis.",
      difficulty: "easy",
      assignTo: "All Students",
      status: "Not Started",
      progress: 0
    }
  ];
  
  sampleAssignments.forEach(assignment => {
    addAssignment(assignment);
  });
  
  showNotification("Sample assignments generated!", "success");
}

// Timeline functions
function loadTimeline() {
  const list = document.getElementById("timelineList");
  if (!list) return;
  
  list.innerHTML = "";
  
  const passedActivities = demoData.timeline.filter(item => item.passed).length;
  document.getElementById("passedCount").textContent = passedActivities;
  document.getElementById("timelineTotal").textContent = demoData.timeline.length;
  
  demoData.timeline.forEach(item => {
    const li = document.createElement("li");
    const icon = getTimelineIcon(item.type);
    li.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${item.passed ? "rgba(63, 185, 80, 0.1)" : "rgba(248, 81, 73, 0.1)"}; display: flex; align-items: center; justify-content: center; color: ${item.passed ? "#3fb950" : "#f85149"};">
          <i class="${icon}"></i>
        </div>
        <div>
          <div>${item.action}</div>
          <div class="muted" style="font-size: 13px; margin-top: 4px;">
            <i class="far fa-clock"></i> ${item.time}
            ${item.passed ? '<span style="color: #3fb950; margin-left: 8px;"><i class="fas fa-check"></i> Passed</span>' : ''}
          </div>
        </div>
      </div>
    `;
    list.appendChild(li);
  });
}

function getTimelineIcon(type) {
  switch (type) {
    case "commit": return "fas fa-code-commit";
    case "branch": return "fas fa-code-branch";
    case "submission": return "fas fa-paper-plane";
    case "review": return "fas fa-eye";
    default: return "fas fa-circle";
  }
}

// Analytics functions
function loadAnalytics() {
  // Completion rate
  const completionBar = document.getElementById("completionBarInner");
  const completionText = document.getElementById("completionText");
  
  if (completionBar && completionText) {
    completionBar.style.width = `${demoData.analytics.completion}%`;
    completionText.textContent = `${demoData.analytics.completion}%`;
  }
  
  // Average score
  const avgScoreBar = document.getElementById("avgScoreBarInner");
  const avgScoreText = document.getElementById("avgScoreText");
  
  if (avgScoreBar && avgScoreText) {
    avgScoreBar.style.width = `${demoData.analytics.avgScore}%`;
    avgScoreText.textContent = `${demoData.analytics.avgScore}%`;
  }
  
  // Prediction
  const predValue = document.getElementById("predValue");
  if (predValue) {
    predValue.textContent = demoData.analytics.predictedGrade;
  }
}

// Grade Distribution Chart
function initGradeChart() {
  const ctx = document.getElementById('gradeChart');
  if (!ctx) return;
  
  const gradeData = demoData.analytics.gradeDistribution;
  const colors = {
    A: '#3fb950',
    B: '#1f6feb',
    C: '#d29922',
    D: '#db6d28',
    F: '#f85149'
  };
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(gradeData),
      datasets: [{
        data: Object.values(gradeData),
        backgroundColor: Object.keys(gradeData).map(grade => colors[grade]),
        borderColor: Object.keys(gradeData).map(grade => colors[grade]),
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(22, 27, 34, 0.9)',
          titleColor: '#e6edf3',
          bodyColor: '#8b949e',
          borderColor: '#30363d',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `${context.parsed.y}% of students`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 40,
          grid: {
            color: 'rgba(48, 54, 61, 0.5)'
          },
          ticks: {
            color: '#8b949e',
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          grid: {
            color: 'rgba(48, 54, 61, 0.5)'
          },
          ticks: {
            color: '#8b949e'
          }
        }
      }
    }
  });
  
  // Create legend
  const legend = document.getElementById('gradeLegend');
  if (legend) {
    legend.innerHTML = Object.keys(gradeData).map(grade => `
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${colors[grade]}"></div>
        <span>Grade ${grade}: ${gradeData[grade]}%</span>
      </div>
    `).join('');
  }
}

// Feedback functions
function loadFeedback() {
  const list = document.getElementById("feedbackList");
  const history = document.getElementById("feedbackHistory");
  
  if (!list || !history) return;
  
  // Feedback list
  list.innerHTML = "";
  
  demoData.feedback.forEach(feedback => {
    const feedbackItem = document.createElement("div");
    feedbackItem.className = "feedback-item";
    feedbackItem.innerHTML = `
      <div class="feedback-header">
        <div class="feedback-author">
          <div class="avatar">${feedback.author.charAt(0)}</div>
          <div class="feedback-meta">
            <div class="feedback-who">${feedback.author}</div>
            <div class="feedback-role">${feedback.role}</div>
          </div>
        </div>
        <div class="feedback-when">${feedback.date}</div>
      </div>
      <div class="feedback-text">${feedback.text}</div>
      <div class="feedback-tags">
        <span class="tag" style="background: rgba(88, 166, 255, 0.1); color: var(--accent); padding: 2px 8px; border-radius: 12px; font-size: 11px;">
          ${feedback.type.replace('_', ' ')}
        </span>
      </div>
    `;
    list.appendChild(feedbackItem);
  });
  
  // Feedback history
  history.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div>
        <strong>Last 30 days:</strong>
        <div style="display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap;">
          <span><i class="fas fa-comment" style="color: var(--accent);"></i> 8 comments</span>
          <span><i class="fas fa-thumbs-up" style="color: var(--success);"></i> 12 approvals</span>
          <span><i class="fas fa-edit" style="color: var(--warning);"></i> 3 suggestions</span>
        </div>
      </div>
      <div>
        <strong>Response time:</strong>
        <div style="margin-top: 8px; color: var(--success);">
          <i class="fas fa-clock"></i> Average: 1.2 days
        </div>
      </div>
    </div>
  `;
}

function generateSampleFeedback() {
  const sampleFeedback = [
    {
      id: Date.now() + 1,
      author: "Instructor",
      role: "Senior Lecturer",
      text: "Excellent work on the authentication system. The JWT implementation is secure and well-structured. Consider adding rate limiting for production.",
      date: "Today",
      type: "code_quality"
    },
    {
      id: Date.now() + 2,
      author: "Teaching Assistant",
      role: "TA",
      text: "Good job on the responsive design. The mobile layout works well. Suggest adding more accessibility features like ARIA labels.",
      date: "Yesterday",
      type: "ui_ux"
    }
  ];
  
  const list = document.getElementById("feedbackList");
  if (!list) return;
  
  sampleFeedback.forEach(feedback => {
    const feedbackItem = document.createElement("div");
    feedbackItem.className = "feedback-item";
    feedbackItem.innerHTML = `
      <div class="feedback-header">
        <div class="feedback-author">
          <div class="avatar">${feedback.author.charAt(0)}</div>
          <div class="feedback-meta">
            <div class="feedback-who">${feedback.author}</div>
            <div class="feedback-role">${feedback.role}</div>
          </div>
        </div>
        <div class="feedback-when">${feedback.date}</div>
      </div>
      <div class="feedback-text">${feedback.text}</div>
      <div class="feedback-tags">
        <span class="tag" style="background: rgba(88, 166, 255, 0.1); color: var(--accent); padding: 2px 8px; border-radius: 12px; font-size: 11px;">
          ${feedback.type.replace('_', ' ')}
        </span>
      </div>
    `;
    list.prepend(feedbackItem);
  });
  
  showNotification("Sample feedback generated!", "success");
}

function generateAIFeedback() {
  const type = document.getElementById("feedbackType").value;
  const tone = document.getElementById("feedbackTone").value;
  const output = document.getElementById("aiFeedbackOutput");
  
  if (!output) return;
  
  // Show loading state
  output.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Generating feedback...</div>';
  
  // Simulate AI generation delay
  setTimeout(() => {
    const feedbackTemplates = {
      code_quality: {
        encouraging: "Your code shows good structure and organization. The functions are well-named and follow single responsibility principle. Keep up the great work!",
        constructive: "The code structure is good, but could benefit from more comments explaining complex logic. Consider breaking down larger functions into smaller, more focused ones.",
        direct: "Code structure needs improvement. Add more comments and break down complex functions. Follow consistent naming conventions."
      },
      commit_practices: {
        encouraging: "Great commit frequency! Your commit messages are descriptive and helpful for tracking changes.",
        constructive: "Good commit frequency, but some commit messages could be more descriptive. Try to follow the convention: 'feat: add feature' or 'fix: resolve issue'.",
        direct: "Commit messages need to be more descriptive. Use conventional commit format for better tracking."
      },
      performance: {
        encouraging: "Good performance on recent assignments. Your solutions show efficient algorithm choices.",
        constructive: "Performance is good overall, but some solutions could be optimized further. Consider time complexity in your algorithms.",
        direct: "Some performance issues detected. Optimize algorithms for better time complexity."
      },
      engagement: {
        encouraging: "Excellent engagement with the course material! Your regular participation is impressive.",
        constructive: "Good engagement, but try to participate more in discussions and peer reviews.",
        direct: "Engagement level needs improvement. Increase participation in course activities."
      }
    };
    
    const feedback = feedbackTemplates[type]?.[tone] || "Based on your recent work, you're making good progress. Continue focusing on code quality and regular practice.";
    
    output.innerHTML = `
      <div style="padding: 16px; background: rgba(88, 166, 255, 0.05); border-radius: 6px; border-left: 4px solid var(--accent);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: var(--accent);">
          <i class="fas fa-robot"></i>
          <strong>AI Feedback Generated</strong>
        </div>
        <p style="margin: 0; color: var(--text); line-height: 1.6;">${feedback}</p>
        <div style="margin-top: 12px; display: flex; gap: 8px; font-size: 12px; color: var(--muted);">
          <span>Type: ${type.replace('_', ' ')}</span>
          <span>•</span>
          <span>Tone: ${tone}</span>
        </div>
      </div>
    `;
    
    showNotification("AI feedback generated successfully!", "success");
  }, 1500);
}

// Code Quality functions
function loadCodeQuality() {
  // Update quality score
  const qualityScore = document.getElementById("qualityScore");
  const qualityScoreCircle = document.getElementById("qualityScoreCircle");
  
  if (qualityScore && qualityScoreCircle) {
    qualityScore.textContent = demoData.codeQuality.overallScore;
    qualityScoreCircle.style.background = `conic-gradient(#3fb950 0% ${demoData.codeQuality.overallScore}%, var(--border) ${demoData.codeQuality.overallScore}% 100%)`;
  }
  
  // Update complexity metrics
  document.getElementById("cyclomaticComplexity").textContent = demoData.codeQuality.complexity.cyclomatic;
  document.getElementById("maintainabilityIndex").textContent = demoData.codeQuality.complexity.maintainability;
  document.getElementById("codeDuplication").textContent = demoData.codeQuality.complexity.duplication + "%";
  
  // Update progress bars
  updateComplexityProgressBars();
}

function updateComplexityProgressBars() {
  const progressBars = document.querySelectorAll('.quality-metric .progress-bar');
  
  if (progressBars.length >= 3) {
    // Cyclomatic complexity (lower is better, scale inverted)
    const cyclomaticValue = demoData.codeQuality.complexity.cyclomatic;
    const cyclomaticPercent = Math.min(cyclomaticValue * 5, 100); // Scale for display
    progressBars[0].style.width = `${cyclomaticPercent}%`;
    progressBars[0].classList.toggle('warning', cyclomaticPercent > 60);
    
    // Maintainability index (higher is better)
    const maintainabilityValue = demoData.codeQuality.complexity.maintainability;
    progressBars[1].style.width = `${maintainabilityValue}%`;
    progressBars[1].classList.toggle('warning', maintainabilityValue < 70);
    
    // Code duplication (lower is better, scale inverted)
    const duplicationValue = demoData.codeQuality.complexity.duplication;
    progressBars[2].style.width = `${duplicationValue}%`;
    progressBars[2].classList.toggle('warning', duplicationValue > 10);
  }
}

// Test Coverage Chart
function initTestCoverageChart() {
  const ctx = document.getElementById('testCoverageChart');
  if (!ctx) return;
  
  const coverageData = demoData.codeQuality.testCoverage;
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Covered', 'Not Covered'],
      datasets: [{
        data: [coverageData.total, 100 - coverageData.total],
        backgroundColor: [
          '#3fb950',
          'rgba(48, 54, 61, 0.5)'
        ],
        borderWidth: 0,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      cutout: '70%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed}%`;
            }
          }
        }
      }
    }
  });
}

// Load all data
function loadOverview() {
  updatePerformanceOverview();
  loadHeatmap();
  loadBranches();
}

function loadAllData() {
  loadOverview();
  loadAssignments();
  loadTimeline();
  loadAnalytics();
  loadFeedback();
  loadCodeQuality();
}
document.addEventListener("click", function(e){

  // Show feedback textarea
  if(e.target.closest(".give-feedback-btn")){
    const item = e.target.closest(".assignment-item");
    item.querySelector(".feedback-box").classList.toggle("hidden");
  }

  // Show feedback history
  if(e.target.closest(".review-feedback-btn")){
    const item = e.target.closest(".assignment-item");
    item.querySelector(".feedback-history").classList.toggle("hidden");
  }

});
