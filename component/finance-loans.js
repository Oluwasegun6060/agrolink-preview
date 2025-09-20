export function renderFinanceLoans(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const loans = [
    { id: 'LN-001', lender: 'AgriBank', amount: 20000, balance: 12500, status: 'Active' },
    { id: 'LN-002', lender: 'Coop Credit', amount: 8000, balance: 0, status: 'Repaid' },
  ];

  el.innerHTML = `
    <section class="card" style="margin-top:16px">
      <h4>Loans & Liabilities</h4>
      <div class="table-wrap">
        <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:14px;">
          <thead style="background:var(--muted)">
            <tr><th>ID</th><th>Lender</th><th>Amount</th><th>Balance</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${loans.map(l => `
              <tr>
                <td>${l.id}</td>
                <td>${l.lender}</td>
                <td>$${l.amount.toLocaleString()}</td>
                <td>$${l.balance.toLocaleString()}</td>
                <td>${l.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}
