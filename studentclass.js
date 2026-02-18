// CodeTracker - GitHub Project Tracking System
document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const logoIcon = document.querySelector(".logo-icon");
  const assignmentTitles = document.querySelectorAll(".assignment-title");
  const newSubmissionBtn = document.getElementById("newSubmissionBtn");
  const viewCalendarBtn = document.getElementById("viewCalendarBtn");
  const viewAllActivityBtn = document.getElementById("viewAllActivityBtn");
  const daysLeftElements = document.querySelectorAll(
    ".days-left, .deadline-date",
  );

  // Initialize the dashboard
  initDashboard();

  function initDashboard() {
    console.log("CodeTracker Dashboard Initialized");

    // Update days left counters
    updateDaysLeft();

    // Set up event listeners
    setupEventListeners();

    // Add click effect to logo
    if (logoIcon) {
      logoIcon.style.cursor = "pointer";
      logoIcon.title = "CodeTracker - GitHub Project Tracking System";
    }

    // Show welcome notification
    showNotification(
      "Welcome to CodeTracker! Dashboard loaded successfully.",
      "info",
    );
  }

  function setupEventListeners() {
    // Logo click event
    if (logoIcon) {
      logoIcon.addEventListener("click", showCodeTrackerInfo);
    }

    // Assignment title click events
    assignmentTitles.forEach((title) => {
      title.addEventListener("click", function (e) {
        e.preventDefault();
        const assignmentName = this.textContent.trim();
        showNotification(`Viewing assignment: ${assignmentName}`, "info");
      });
    });

    // Button click events
    if (newSubmissionBtn) {
      newSubmissionBtn.addEventListener("click", function (e) {
        e.preventDefault();
        showNotification("Opening new submission form...", "info");
        // In a real app, this would open a modal or navigate to submission page
      });
    }

    if (viewCalendarBtn) {
      viewCalendarBtn.addEventListener("click", function (e) {
        e.preventDefault();
        showNotification("Opening calendar view...", "info");
        // In a real app, this would open a calendar view
      });
    }

    if (viewAllActivityBtn) {
      viewAllActivityBtn.addEventListener("click", function (e) {
        e.preventDefault();
        showNotification("Loading all activity...", "info");
        // In a real app, this would load more activity items
      });
    }

    // Add hover effects to cards
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => {
      card.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-4px)";
        this.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.2)";
      });

      card.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0)";
        this.style.boxShadow = "none";
      });
    });

    // Add click effect to activity items
    const activityItems = document.querySelectorAll(".activity-item");
    activityItems.forEach((item) => {
      item.addEventListener("click", function () {
        const activityText = this.querySelector(".activity-text").textContent;
        showNotification(`Activity: ${activityText}`, "info");
      });

      item.style.cursor = "pointer";
    });
  }

  function updateDaysLeft() {
    const today = new Date();
    const dueDate = new Date("2026-02-15");
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Update all days left elements
    daysLeftElements.forEach((element) => {
      if (element.classList.contains("days-left")) {
        element.textContent = `${daysLeft} days left`;
      } else if (element.textContent.includes("9 days")) {
        element.textContent = `Due Feb 15, 2026 (${daysLeft} days)`;
      } else if (element.textContent.includes("14 days")) {
        const quizDueDate = new Date("2026-02-20");
        const quizDaysLeft = Math.ceil(
          (quizDueDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
        );
        element.textContent = `Due Feb 20, 2026 (${quizDaysLeft} days)`;
      } else if (element.textContent.includes("23 days")) {
        const projectDueDate = new Date("2026-03-01");
        const projectDaysLeft = Math.ceil(
          (projectDueDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
        );
        element.textContent = `Due Mar 1, 2026 (${projectDaysLeft} days)`;
      }
    });

    // Update urgent label if less than 3 days left
    const urgentLabel = document.querySelector(".label-red");
    if (daysLeft <= 3 && urgentLabel) {
      urgentLabel.innerHTML = `<i class="fas fa-exclamation-triangle"></i> URGENT (${daysLeft} days)`;
    }
  }

  function showCodeTrackerInfo() {
    const info = `
            CodeTracker v1.0
            GitHub Project Tracking System
            Developed by Dexter Facelo
            SE1-2026 Project
            Last Updated: ${new Date().toLocaleDateString()}
        `;

    showNotification(info, "info");

    // Add visual feedback
    logoIcon.style.transform = "scale(1.1)";
    setTimeout(() => {
      logoIcon.style.transform = "scale(1)";
    }, 300);
  }

  function showNotification(message, type = "info") {
    // Remove existing notification
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    // Create notification dot
    const dot = document.createElement("div");
    dot.className = "notification-dot";
    dot.style.backgroundColor =
      type === "success"
        ? "var(--color-success-fg)"
        : type === "error"
          ? "var(--color-danger-fg)"
          : "var(--color-accent-fg)";

    // Create message container
    const messageDiv = document.createElement("div");
    messageDiv.textContent = message;

    // Assemble notification
    notification.appendChild(dot);
    notification.appendChild(messageDiv);

    // Add to document
    document.body.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease-out forwards";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 4000);
  }

  // Simulate real-time updates
  function simulateUpdates() {
    setInterval(() => {
      // Randomly update progress bars occasionally
      if (Math.random() > 0.7) {
        const progressItems = document.querySelectorAll(".progress-fill");
        progressItems.forEach((item) => {
          const currentWidth = parseInt(item.style.width);
          const randomChange = Math.random() > 0.5 ? 1 : -1;
          const newWidth = Math.max(
            10,
            Math.min(100, currentWidth + randomChange),
          );
          item.style.width = `${newWidth}%`;

          // Update corresponding value
          const progressValue = item
            .closest(".progress-item")
            .querySelector(".progress-value");
          if (progressValue) {
            if (progressValue.textContent.includes("/")) {
              const [current, total] = progressValue.textContent
                .split("/")
                .map(Number);
              const newCurrent = Math.max(
                0,
                Math.min(total, current + randomChange),
              );
              progressValue.textContent = `${newCurrent}/${total}`;
            } else if (progressValue.textContent.includes("%")) {
              const currentPercent = parseInt(progressValue.textContent);
              const newPercent = Math.max(
                0,
                Math.min(100, currentPercent + randomChange),
              );
              progressValue.textContent = `${newPercent}%`;
            }
          }
        });

        showNotification("Progress updated automatically", "info");
      }
    }, 15000); // Every 15 seconds
  }

  // Start simulation after initial load
  setTimeout(simulateUpdates, 5000);

  // Add keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // Ctrl + H for help
    if (e.ctrlKey && e.key === "h") {
      e.preventDefault();
      showCodeTrackerInfo();
    }

    // Ctrl + D for dashboard refresh
    if (e.ctrlKey && e.key === "d") {
      e.preventDefault();
      updateDaysLeft();
      showNotification("Dashboard data refreshed", "success");
    }

    // Escape to close notifications
    if (e.key === "Escape") {
      const notification = document.querySelector(".notification");
      if (notification) {
        notification.remove();
      }
    }
  });

  // Add context menu to logo
  if (logoIcon) {
    logoIcon.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      showNotification(
        "Right-click: CodeTracker Admin Options (Simulated)",
        "info",
      );
    });
  }

  // Initialize tooltips
  function initTooltips() {
    const elementsWithTooltips = [
      { selector: ".user-avatar", text: "Your Profile" },
      { selector: ".course-icon", text: "Course Details" },
      { selector: ".btn-primary", text: "Create New Item" },
      { selector: ".label", text: "Status Label" },
    ];

    elementsWithTooltips.forEach((item) => {
      const element = document.querySelector(item.selector);
      if (element) {
        element.title = item.text;
      }
    });
  }

  initTooltips();
});
// Get elements
const modal = document.getElementById("submissionModal");
const openBtn = document.getElementById("newSubmissionBtn");
const closeBtn = document.getElementById("closeModal");
const form = document.getElementById("submissionForm");

// Open modal
openBtn.addEventListener("click", function (e) {
  e.preventDefault();
  modal.style.display = "block";
});

// Close modal
closeBtn.addEventListener("click", function () {
  modal.style.display = "none";
});

// Close when clicking outside
window.addEventListener("click", function (e) {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// Handle form submit
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const project = document.getElementById("projectSelect").value;
  const github = document.getElementById("repositorySelect").value;

  const note = document.getElementById("submissionNote").value;

  if (!project || !github) {
    alert("Please complete all required fields.");
    return;
  }

  alert(
    `Submission Successful!\n\nProject: ${project}\nGitHub: ${github}\nNote: ${note}`,
  );

  form.reset();
  modal.style.display = "none";
});
