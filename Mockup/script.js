document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('.nav-button');
  const screens = document.querySelectorAll('.screen');

  function setActiveScreen(targetScreenId) {
      navButtons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.target === targetScreenId);
      });

      screens.forEach(screen => {
          screen.classList.toggle('active', screen.id === targetScreenId);
      });

      const contentArea = document.querySelector('.content-area');
      if (contentArea) {
          contentArea.scrollTop = 0;
      }
  }

  navButtons.forEach(button => {
      button.addEventListener('click', () => {
          const targetScreenId = button.dataset.target;
          setActiveScreen(targetScreenId);
      });
  });

  const initialActiveButton = document.querySelector('.nav-button.active') || document.querySelector('.nav-button[data-target="home"]');
  if (initialActiveButton) {
      setActiveScreen(initialActiveButton.dataset.target);
  }


  const sleepChart = document.querySelector('.donut-chart');
  if (sleepChart) {
      const progress = sleepChart.dataset.progress || 0;
      sleepChart.style.setProperty('--progress', progress);
  }

  console.log("Fitness App Phase 2 Initialized");
});
