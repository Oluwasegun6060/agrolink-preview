export function renderFinanceAssets(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const assets = [
    { name: 'Stored Wheat', type: 'Crop', value: 12000 },
    { name: 'Dairy Cows (15)', type: 'Livestock', value: 45000 },
    { name: 'Tractor', type: 'Equipment', value: 25000 },
  ];

  const total = assets.reduce((s,a)=>s+a.value,0);

  el.innerHTML = `
    <section class="card" style="margin-top:16px">
      <h4>Assets & Inventory</h4>
      <div style="margin-bottom:8px">Total Value: <b>$${total.toLocaleString()}</b></div>
      <div class="table-wrap">
        <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:14px;">
          <thead style="background:var(--muted)">
            <tr><th>Asset</th><th>Type</th><th>Value</th></tr>
          </thead>
          <tbody>
            ${assets.map(a=>`
              <tr><td>${a.name}</td><td>${a.type}</td><td>$${a.value.toLocaleString()}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}
