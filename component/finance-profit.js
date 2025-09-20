export function renderFinanceProfit(containerId, revenueData, expenseData) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <section class="card" style="margin-top:16px">
      <h4>Profitability by Category</h4>
      <canvas id="profitChart" height="160"></canvas>
    </section>
  `;

  const ctx = document.getElementById('profitChart').getContext('2d');
  const categories = ['Crops','Livestock','Equipment','Labor','Supplies'];

  const profits = categories.map(cat => {
    const rev = revenueData.filter(r=>r.category===cat).reduce((s,r)=>s+r.amount,0);
    const exp = expenseData.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0);
    return rev - exp;
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Profit',
        data: profits,
        backgroundColor: profits.map(p => p>=0 ? '#16a34a' : '#dc2626')
      }]
    },
    options: {
      responsive:true,
      plugins:{legend:{display:false}},
      scales:{ y:{ beginAtZero:true }}
    }
  });
}
