document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('.nav-button');
  const screens = document.querySelectorAll('.screen');

  // --- Navigation Logic ---
  function setActiveScreen(targetScreenId) {
      // 1. Update Active Button State
      navButtons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.target === targetScreenId);
      });

      // 2. Hide all screens and show the target screen
      screens.forEach(screen => {
          screen.classList.toggle('active', screen.id === targetScreenId);
      });

      // Optional: Scroll to top when changing screens
      const contentArea = document.querySelector('.content-area');
      if (contentArea) {
          contentArea.scrollTop = 0;
      }
  }

  // Add click listeners to nav buttons
  navButtons.forEach(button => {
      button.addEventListener('click', () => {
          const targetScreenId = button.dataset.target;
          setActiveScreen(targetScreenId);
      });
  });

  // --- Initialize (Set default active screen) ---
  // Find the initially active button (or default to 'home')
  const initialActiveButton = document.querySelector('.nav-button.active') || document.querySelector('.nav-button[data-target="home"]');
  if (initialActiveButton) {
      setActiveScreen(initialActiveButton.dataset.target);
  }


  // --- Dynamic Elements (Example: Sleep Chart Initialization) ---
  const sleepChart = document.querySelector('.donut-chart');
  if (sleepChart) {
      const progress = sleepChart.dataset.progress || 0;
      // Set CSS variable for the conic-gradient
      sleepChart.style.setProperty('--progress', progress);
  }

  // Add more JS logic here as needed for:
  // - Form submissions (Exercise, Nutrition)
  // - Fetching data for charts/trends
  // - Handling dynamic content updates
  // - Implementing "Edit" functionalities on Profile
  console.log("Fitness App Phase 2 Initialized");
});
