export function renderFinanceForecast(containerId, revenueData, expenseData) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <section class="card" style="margin-top:16px">
      <h4>Forecast & Scenarios</h4>
      <canvas id="forecastChart" height="160"></canvas>
    </section>
  `;

  const ctx = document.getElementById('forecastChart').getContext('2d');
  const months = ['Jul','Aug','Sep','Oct','Nov','Dec'];

  // simple demo forecast: revenue grows 5%, expense grows 3%
  const lastRev = revenueData.reduce((s,r)=>s+r.amount,0)/revenueData.length;
  const lastExp = expenseData.reduce((s,e)=>s+e.amount,0)/expenseData.length;

  const revSeries = months.map((m,i)=>Math.round(lastRev*(1.05**i)));
  const expSeries = months.map((m,i)=>Math.round(lastExp*(1.03**i)));

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        { label:'Revenue Forecast', data:revSeries, borderColor:'#16a34a', fill:false },
        { label:'Expense Forecast', data:expSeries, borderColor:'#dc2626', fill:false }
      ]
    },
    options:{ responsive:true }
  });
}
