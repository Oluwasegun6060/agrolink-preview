export function renderFinanceAlerts(containerId, revenueData, expenseData) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const totalRev = revenueData.reduce((s,r)=>s+r.amount,0);
  const totalExp = expenseData.reduce((s,e)=>s+e.amount,0);
  const profit = totalRev - totalExp;

  el.innerHTML = `
    <section class="card" style="margin-top:16px">
      <h4>Financial Insights</h4>
      <ul style="margin-top:8px;line-height:1.6">
        <li>📈 Total revenue so far: <b>$${totalRev.toLocaleString()}</b></li>
        <li>📉 Total expenses so far: <b>$${totalExp.toLocaleString()}</b></li>
        <li>💰 Profitability check: <b style="color:${profit>=0?'green':'red'}">
          ${profit>=0?'Profitable':'Loss-making'} (${profit.toLocaleString()})
        </b></li>
        <li>🔔 Suggestion: ${
          profit>=0 
            ? 'Reinvest into equipment upgrades.' 
            : 'Cut down expenses on low ROI inputs.'
        }</li>
      </ul>
    </section>
  `;
}
