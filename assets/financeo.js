// assets/finance.js
document.addEventListener("DOMContentLoaded", () => {

  /* ----------------------
     Seeded demo data (replace with API later)
     ---------------------- */
  const revenueData = [
    { date: '2025-01-05', category: 'Crops', amount: 12000 },
    { date: '2025-02-10', category: 'Crops', amount: 18000 },
    { date: '2025-03-12', category: 'Livestock', amount: 7200 },
    { date: '2025-04-03', category: 'Equipment', amount: 5200 },
    { date: '2025-05-22', category: 'Crops', amount: 26000 },
    { date: '2025-06-14', category: 'Livestock', amount: 9500 },
  ];

  const expenseData = [
    { date: '2025-01-15', category: 'Crops', description: 'Seed purchase', amount: 3200 },
    { date: '2025-02-20', category: 'Equipment', description: 'Harvester service', amount: 4200 },
    { date: '2025-03-05', category: 'Labor', description: 'Seasonal wages', amount: 5200 },
    { date: '2025-04-18', category: 'Supplies', description: 'Fertilizer', amount: 2100 },
    { date: '2025-05-02', category: 'Crops', description: 'Irrigation supplies', amount: 800 },
    { date: '2025-06-01', category: 'Livestock', description: 'Vaccine batch', amount: 1400 },
  ];

  const invoiceData = [
    { invoice:'#INV-1001', client:'Local Market', date:'2025-05-22', amount:26000, status:'Paid' },
    { invoice:'#INV-1002', client:'Dairy Coop', date:'2025-06-14', amount:9500, status:'Pending' },
  ];

  /* ----------------------
     Helpers
     ---------------------- */
  const $ = id => document.getElementById(id);
  const formatCurrency = (v) => '$' + Number(v).toLocaleString();
  function sumBy(arr, keyFn) { return arr.reduce((s, item) => s + (keyFn(item) || 0), 0); }

  /* ----------------------
     KPI compute & update
     ---------------------- */
  function computeKPIs() {
    const totalRev = sumBy(revenueData, r => r.amount);
    const totalExp = sumBy(expenseData, e => e.amount);
    const profit = totalRev - totalExp;
    const cashflow = Math.round((totalRev * 0.2) - (totalExp * 0.1)); // demo rolling estimate

    $('totalRevenue').textContent = formatCurrency(totalRev.toFixed(0));
    $('totalExpenses').textContent = formatCurrency(totalExp.toFixed(0));
    $('profit').textContent = formatCurrency(profit.toFixed(0));
    $('cashFlow').textContent = formatCurrency(cashflow.toFixed(0));

    // demo change labels
    $('revChange').textContent = '▲ +8.2%';
    $('expChange').textContent = '▼ −3.0%';
  }
  computeKPIs();

  /* ----------------------
     Chart setup
     ---------------------- */
  const revExpCtx = document.getElementById('revExpChart').getContext('2d');
  const revExpChart = new Chart(revExpCtx, {
    type: 'bar',
    data: { labels: [], datasets: [{ label:'Revenue', backgroundColor:'#16a34a', data:[] }, { label:'Expenses', backgroundColor:'#f97316', data:[] }] },
    options: { responsive:true, plugins:{ legend:{position:'bottom'} }, scales:{ y:{ beginAtZero:true } } }
  });

  const expensePieCtx = document.getElementById('expensePie').getContext('2d');
  const expensePie = new Chart(expensePieCtx, {
    type: 'pie',
    data: { labels: [], datasets:[{ data:[], backgroundColor:['#16a34a','#4f46e5','#f97316','#fbbf24','#60a5fa'] }] },
    options:{ responsive:true, plugins:{ legend:{position:'bottom'} } }
  });

  const cashCtx = document.getElementById('cashflowChart').getContext('2d');
  const cashflowChart = new Chart(cashCtx, {
    type: 'line',
    data: { labels: [], datasets:[{ label:'Cash Flow', data:[], borderColor:'#0891b2', backgroundColor:'rgba(8,145,178,0.08)', fill:true }] },
    options: { responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:false } } }
  });

  /* ----------------------
     Aggregation helpers
     ---------------------- */
  function monthLabelFromDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.toLocaleString(undefined,{month:'short'})} ${d.getFullYear()}`;
  }

  function buildMonthSeries(revArr, expArr, monthsLimit=6, categoryFilter='all') {
    // determine latest date
    const allDates = revArr.concat(expArr).map(x => new Date(x.date));
    const latest = allDates.length ? new Date(Math.max.apply(null, allDates)) : new Date();
    const months = [];
    for (let i = monthsLimit-1; i >= 0; i--) {
      const d = new Date(latest.getFullYear(), latest.getMonth() - i, 1);
      months.push(`${d.toLocaleString(undefined,{month:'short'})} ${d.getFullYear()}`);
    }
    const revMap = months.reduce((acc,m)=> (acc[m]={rev:0,exp:0},acc), {});
    revArr.forEach(r=>{
      if(categoryFilter !== 'all' && r.category !== categoryFilter) return;
      const m = monthLabelFromDate(r.date);
      if(revMap[m]) revMap[m].rev += r.amount;
    });
    expArr.forEach(e=>{
      if(categoryFilter !== 'all' && e.category !== categoryFilter) return;
      const m = monthLabelFromDate(e.date);
      if(revMap[m]) revMap[m].exp += e.amount;
    });
    const revs = months.map(m=>Math.round(revMap[m].rev));
    const exps = months.map(m=>Math.round(revMap[m].exp));
    return { months, revs, exps };
  }

  function aggregateExpensesByCategory(expArr, categoryFilter='all') {
    const map = {};
    expArr.forEach(e => {
      if(categoryFilter !== 'all' && e.category !== categoryFilter) return;
      map[e.category] = (map[e.category]||0) + e.amount;
    });
    const labels = Object.keys(map);
    const data = labels.map(l => Math.round(map[l]));
    return { labels, data };
  }

  function buildCashflowSeries(revArr, expArr, monthsLimit=6) {
    const agg = buildMonthSeries(revArr, expArr, monthsLimit);
    const series = agg.months.map((m,i) => agg.revs[i] - agg.exps[i]);
    return { labels: agg.months, series };
  }

  /* ----------------------
     Render charts
     ---------------------- */
  function renderAllCharts(category='all', monthsLimit=6) {
    const agg = buildMonthSeries(revenueData, expenseData, monthsLimit, category);
    revExpChart.data.labels = agg.months;
    revExpChart.data.datasets[0].data = agg.revs;
    revExpChart.data.datasets[1].data = agg.exps;
    revExpChart.update();

    const pieAgg = aggregateExpensesByCategory(expenseData, category);
    expensePie.data.labels = pieAgg.labels.length ? pieAgg.labels : ['No data'];
    expensePie.data.datasets[0].data = pieAgg.data.length ? pieAgg.data : [1];
    expensePie.update();

    const cf = buildCashflowSeries(revenueData, expenseData, monthsLimit);
    cashflowChart.data.labels = cf.labels;
    cashflowChart.data.datasets[0].data = cf.series;
    cashflowChart.update();
  }

  renderAllCharts('all', 6);

  /* ----------------------
     Expense table & Invoice table rendering
     ---------------------- */
  const expenseTbody = document.querySelector('#expenseTable tbody');
  const invoiceTbody = document.querySelector('#invoiceTable tbody');

  function renderExpenseTable(filterCategory='all', searchText='') {
    expenseTbody.innerHTML = '';
    const rows = expenseData.filter(e=>{
      if(filterCategory !== 'all' && e.category !== filterCategory) return false;
      if(searchText && !(`${e.description} ${e.category} ${e.date}`).toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:8px">${r.date}</td>
        <td>${r.category}</td>
        <td>${r.description}</td>
        <td>${formatCurrency(r.amount)}</td>
        <td>${Math.random() > 0.6 ? '<a href="#">View</a>' : '—'}</td>
        <td style="text-align:center"><button class="btn btn-primary btn-sm edit-expense">Edit</button></td>
      `;
      expenseTbody.appendChild(tr);
    });
    // wire edit buttons quickly
    expenseTbody.querySelectorAll('.edit-expense').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const row = e.target.closest('tr');
        const date = row.children[0].textContent;
        const desc = row.children[2].textContent;
        const amt = row.children[3].textContent.replace(/[^0-9.-]+/g,'');
        alert(`Edit demo: ${date} — ${desc} — ${amt}. Real edit UI requires server integration.`);
      });
    });
  }
  renderExpenseTable();

  function renderInvoices() {
    invoiceTbody.innerHTML = '';
    invoiceData.forEach(inv=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:8px">${inv.invoice}</td>
        <td>${inv.client}</td>
        <td>${inv.date}</td>
        <td>${formatCurrency(inv.amount)}</td>
        <td>${inv.status}</td>
        <td style="text-align:center"><button class="btn btn-primary btn-sm view-invoice">View</button></td>
      `;
      invoiceTbody.appendChild(tr);
    });
    invoiceTbody.querySelectorAll('.view-invoice').forEach(btn=>{
      btn.addEventListener('click', ()=>alert('Invoice details demo — integrate back-end to show full invoice.'));
    });
  }
  renderInvoices();

  /* ----------------------
     Filters, search, exports wiring
     ---------------------- */
  $('categoryFilter').addEventListener('change', (e) => {
    const cat = e.target.value;
    renderAllCharts(cat, determineMonthsLimit($('timeRange').value));
    renderExpenseTable(cat, $('expenseSearch').value);
  });

  $('timeRange').addEventListener('change', (e) => {
    const months = determineMonthsLimit(e.target.value);
    renderAllCharts($('categoryFilter').value, months);
  });

  $('expenseCategory').addEventListener('change', (e) => {
    renderExpenseTable(e.target.value, $('expenseSearch').value);
  });

  $('expenseSearch').addEventListener('input', (e) => {
    renderExpenseTable($('expenseCategory').value, e.target.value);
  });

  $('globalSearch').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    renderExpenseTable($('expenseCategory').value, q);
    invoiceTbody.querySelectorAll('tr').forEach(tr => tr.style.display = '');
    if(q) invoiceTbody.querySelectorAll('tr').forEach(tr => {
      if(!tr.textContent.toLowerCase().includes(q)) tr.style.display = 'none';
    });
  });

  $('exportExpenseCsv').addEventListener('click', () => {
    exportCSV(expenseData, 'expenses.csv', ['date','category','description','amount']);
  });
  $('exportInvoices').addEventListener('click', () => {
    exportCSV(invoiceData, 'invoices.csv', ['invoice','client','date','amount','status']);
  });
  $('exportCsv').addEventListener('click', () => {
    const rows = [
      ['Metric','Value'],
      ['Total Revenue', $('totalRevenue').textContent],
      ['Total Expenses', $('totalExpenses').textContent],
      ['Profit', $('profit').textContent],
      ['Cash Flow', $('cashFlow').textContent]
    ];
    downloadBlob(rows.map(r=>r.join(',')).join('\n'), 'finance_summary.csv', 'text/csv');
  });
  $('exportExpenses').addEventListener('click', () => $('exportExpenseCsv').click());

  /* ----------------------
     Export helpers
     ---------------------- */
  function exportCSV(arr, filename='export.csv', keys=null){
    if(!arr.length) return alert('No data to export');
    keys = keys || Object.keys(arr[0]);
    const rows = [keys.join(',')].concat(arr.map(item => keys.map(k=>`"${String(item[k]).replace(/"/g,'""')}"`).join(',')));
    downloadBlob(rows.join('\n'), filename, 'text/csv');
  }
  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function determineMonthsLimit(rangeKey) {
    switch(rangeKey) {
      case '1M': return 1;
      case '3M': return 3;
      case '6M': return 6;
      case '1Y': return 12;
      case 'ALL': return 12;
      default: return 6;
    }
  }

  /* ----------------------
     Forecast toggle (demo)
     ---------------------- */
  let forecastVisible = false;
  $('toggleForecast').addEventListener('click', () => {
    forecastVisible = !forecastVisible;
    if(forecastVisible) {
      const recent = cashflowChart.data.datasets[0].data.slice(-3);
      const avg = recent.reduce((s,v)=>s+v,0)/recent.length || 0;
      const projected = cashflowChart.data.datasets[0].data.map((v,i)=>Math.round(v + avg * 0.2 * (i+1)));
      if(cashflowChart.data.datasets.length === 1) {
        cashflowChart.data.datasets.push({ label:'Forecast', data:projected, borderColor:'#a78bfa', borderDash:[6,4], backgroundColor:'rgba(167,139,250,0.06)', fill:false });
      } else {
        cashflowChart.data.datasets[1].data = projected;
      }
    } else {
      if(cashflowChart.data.datasets.length > 1) cashflowChart.data.datasets.splice(1,1);
    }
    cashflowChart.update();
  });

  /* ----------------------
     Drawer (reusable modal) logic
     ---------------------- */
  const drawerOverlay = $('drawerOverlay');
  const drawer = $('drawer');
  const drawerForm = $('drawerForm');
  const drawerModeInput = $('drawerMode');
  const drawerTitle = $('drawerTitle');

  function openDrawer(mode='expense', prefill = {}) {
    drawerModeInput.value = mode;
    drawerTitle.textContent = mode === 'expense' ? 'Add Expense' : 'Create Invoice';
    // Show/hide fields
    document.querySelectorAll('.for-expense').forEach(el => el.style.display = mode === 'expense' ? 'block' : 'none');
    document.querySelectorAll('.for-invoice').forEach(el => el.style.display = mode === 'invoice' ? 'block' : 'none');
    // set labels
    $('d_label_desc').textContent = mode === 'expense' ? 'Description' : 'Description / Item';
    // prefill
    $('d_date').value = prefill.date || new Date().toISOString().split('T')[0];
    $('d_category').value = prefill.category || 'Crops';
    $('d_desc').value = prefill.description || prefill.client || '';
    $('d_amount').value = prefill.amount || '';
    $('d_client').value = prefill.client || '';

    drawerOverlay.classList.add('open');
    drawerOverlay.setAttribute('aria-hidden','false');
  }

  function closeDrawer() {
    drawerOverlay.classList.remove('open');
    drawerOverlay.setAttribute('aria-hidden','true');
    drawerForm.reset();
  }

  // open drawer when Add buttons pressed
  document.querySelectorAll('[data-drawer-mode]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const mode = btn.dataset.drawerMode || 'expense';
      openDrawer(mode);
    });
  });

  $('drawerClose').addEventListener('click', closeDrawer);
  $('drawerCancel').addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', (e)=>{ if(e.target === drawerOverlay) closeDrawer(); });

  // Handle submit
  drawerForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const mode = drawerModeInput.value;
    const date = $('d_date').value || new Date().toISOString().split('T')[0];
    const amount = parseFloat($('d_amount').value) || 0;
    if(mode === 'expense') {
      const category = $('d_category').value;
      const desc = $('d_desc').value || 'Expense';
      expenseData.unshift({ date, category, description: desc, amount });
      renderExpenseTable($('expenseCategory').value, $('expenseSearch').value);
      renderAllCharts($('categoryFilter').value, determineMonthsLimit($('timeRange').value));
      computeKPIs();
      closeDrawer();
      alert('Expense added (demo)');
    } else {
      const client = $('d_client').value || 'Unknown';
      const desc = $('d_desc').value || '';
      const id = '#INV-' + Math.floor(1000 + Math.random()*9000);
      invoiceData.unshift({ invoice: id, client, date, amount, status: 'Pending' });
      renderInvoices();
      computeKPIs();
      closeDrawer();
      alert('Invoice created (demo)');
    }
  });

  /* ----------------------
     Add Expense quick prompt (keeps backward compatibility)
     ---------------------- */
  $('addExpenseBtn')?.addEventListener('click', ()=>openDrawer('expense'));

  /* ----------------------
     Add Transaction placeholder (keeps original button action)
     ---------------------- */
  $('addTransaction')?.addEventListener('click', ()=>openDrawer('expense'));

  /* ----------------------
     Create invoice button (uses drawer)
     ---------------------- */
  $('newInvoice')?.addEventListener('click', ()=>openDrawer('invoice'));

  /* ----------------------
     Add some UI niceties
     ---------------------- */
  $('refreshData').addEventListener('click', ()=> {
    // simulate refresh
    renderAllCharts($('categoryFilter').value, determineMonthsLimit($('timeRange').value));
    renderExpenseTable($('expenseCategory').value, $('expenseSearch').value);
    renderInvoices();
    computeKPIs();
    alert('Data refreshed (demo). In production this will fetch from server.');
  });

  /* ----------------------
     Initial render & update
     ---------------------- */
  renderAllCharts('all', 6);
  renderExpenseTable('all','');
  renderInvoices();
  computeKPIs();

});
