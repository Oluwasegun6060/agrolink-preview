// Theme Toggle
const toggle = document.getElementById('themeToggle');
toggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  toggle.textContent = document.body.classList.contains('dark')
    ? '☀️ Light Mode'
    : '🌙 Dark Mode';
});

// Yield Performance Chart
const yieldCtx = document.getElementById('yieldChart').getContext('2d');
new Chart(yieldCtx, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Yield (kg)',
      data: [2000, 2200, 2100, 2500, 2600, 2600],
      borderColor: '#2f855a',
      backgroundColor: 'rgba(47, 133, 90, 0.2)',
      tension: 0.4,
      fill: true
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'top' }
    }
  }
});

// Revenue Growth Chart
const revenueCtx = document.getElementById('revenueChart').getContext('2d');
new Chart(revenueCtx, {
  type: 'bar',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{
      label: 'Revenue ($)',
      data: [10000, 12000, 11000, 12000],
      backgroundColor: '#68d391'
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false }
    }
  }
});
