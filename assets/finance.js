// assets/finance.js
document.addEventListener("DOMContentLoaded", () => {

  /* ----------------------
     Sample demo data (you'll replace with real API/Laravel later)
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
     Utility helpers
     ---------------------- */
  const $ = id => document.getElementById(id);
  const formatCurrency = (v) => '$' + Number(v).toLocaleString();

  function sumBy(arr, keyFn) {
    return arr.reduce((s, item) => s + (keyFn(item) || 0), 0);
  }

  /* ----------------------
     KPI initial compute
     ---------------------- */
  function computeKPIs() {
    const totalRev = sumBy(revenueData, r => r.amount);
    const totalExp = sumBy(expenseData, e => e.amount);
    const profit = totalRev - totalExp;
    const cashflow = (totalRev * 0.2) - (totalExp * 0.1); // demo rolling estimate

    $('totalRevenue').textContent = formatCurrency(totalRev.toFixed(0));
    $('totalExpenses').textContent = formatCurrency(totalExp.toFixed(0));
    $('profit').textContent = formatCurrency(profit.toFixed(0));
    $('cashFlow').textContent = formatCurrency(cashflow.toFixed(0));

    // small change indicators (demo random)
    $('revChange').textContent = '▲ +8.2%';
    $('expChange').textContent = '▼ −3.0%';
  }
  computeKPIs();

  /* ----------------------
     Charts setup
     ---------------------- */
  const revExpCtx = document.getElementById('revExpChart').getContext('2d');
  const revExpChart = new Chart(revExpCtx, {
    type: 'bar',
    data: {
      labels: [], // months
      datasets: [
        { label: 'Revenue', backgroundColor: '#4f46e5', data: [] },
        { label: 'Expenses', backgroundColor: '#f97316', data: [] }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true } }
    }
  });

  const expensePieCtx = document.getElementById('expensePie').getContext('2d');
  const expensePie = new Chart(expensePieCtx, {
    type: 'pie',
    data: { labels: [], datasets: [{ data: [], backgroundColor: ['#4f46e5','#22c55e','#f97316','#fbbf24','#60a5fa'] }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  const cashCtx = document.getElementById('cashflowChart').getContext('2d');
  const cashflowChart = new Chart(cashCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ label:'Cash Flow', data: [], borderColor:'#0891b2', backgroundColor:'rgba(8,145,178,0.08)', fill:true }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales:{ y:{ beginAtZero:false } } }
  });

  /* ----------------------
     Data aggregation helpers
     ---------------------- */
  function monthKey(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }

  function aggregateMonthly(revArr, expArr, categoryFilter='all', monthsLimit = 6) {
    const allDates = revArr.concat(expArr).map(r => new Date(r.date));
    const latest = allDates.length ? new Date(Math.max.apply(null, allDates)) : new Date();
    const months = [];
    for (let i = monthsLimit-1; i >= 0; i--) {
      const d = new Date(latest.getFullYear(), latest.getMonth() - i, 1);
      months.push(`${d.toLocaleString(undefined,{month:'short'})} ${d.getFullYear()}`);
    }

    const revMap = months.reduce((acc, m) => (acc[m]={rev:0,exp:0}, acc), {});
    function monthLabelFromDate(dateStr) {
      const d = new Date(dateStr);
      return `${d.toLocaleString(undefined,{month:'short'})} ${d.getFullYear()}`;
    }

    revArr.forEach(r => {
      if(categoryFilter !== 'all' && r.category !== categoryFilter) return;
      const lab = monthLabelFromDate(r.date);
      if(revMap[lab]) revMap[lab].rev += r.amount;
    });

    expArr.forEach(e => {
      if(categoryFilter !== 'all' && e.category !== categoryFilter) return;
      const lab = monthLabelFromDate(e.date);
      if(revMap[lab]) revMap[lab].exp += e.amount;
    });

    const revs = months.map(m => Math.round(revMap[m].rev));
    const exps = months.map(m => Math.round(revMap[m].exp));
    return { months, revs, exps };
  }

  function aggregateExpensesByCategory(expArr) {
    const map = {};
    expArr.forEach(e => { map[e.category] = (map[e.category]||0) + e.amount; });
    const labels = Object.keys(map);
    const data = labels.map(l => Math.round(map[l]));
    return { labels, data };
  }

  function buildCashflowSeries(revArr, expArr, monthsLimit=6) {
    const agg = aggregateMonthly(revArr, expArr, 'all', monthsLimit);
    const series = agg.months.map((m,i) => agg.revs[i] - agg.exps[i]);
    return { labels: agg.months, series };
  }

  /* ----------------------
     Render charts initially
     ---------------------- */
  function renderAllCharts(category='all', monthsLimit=6) {
    const agg = aggregateMonthly(revenueData, expenseData, category, monthsLimit);

    // Rev/Exp chart
    revExpChart.data.labels = agg.months;
    revExpChart.data.datasets[0].data = agg.revs;
    revExpChart.data.datasets[1].data = agg.exps;
    revExpChart.update();

    // Expense pie
    const pieAgg = aggregateExpensesByCategory(expenseData.filter(e => category === 'all' ? true : e.category === category));
    expensePie.data.labels = pieAgg.labels.length ? pieAgg.labels : ['No data'];
    expensePie.data.datasets[0].data = pieAgg.data.length ? pieAgg.data : [1];
    expensePie.update();

    // Cashflow
    const cf = buildCashflowSeries(revenueData, expenseData, monthsLimit);
    cashflowChart.data.labels = cf.labels;
    cashflowChart.data.datasets[0].data = cf.series;
    cashflowChart.update();
  }
  renderAllCharts('all', 6);

  /* ----------------------
     Expense table rendering & filtering
     ---------------------- */
  const expenseTbody = document.querySelector('#expenseTable tbody');
  function renderExpenseTable(filterCategory='all', searchText='') {
    expenseTbody.innerHTML = '';
    const rows = expenseData.filter(e => {
      if(filterCategory !== 'all' && e.category !== filterCategory) return false;
      if(searchText && !(`${e.description} ${e.category} ${e.date}`).toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:8px">${r.date}</td>
        <td>${r.category}</td>
        <td>${r.description}</td>
        <td>${formatCurrency(r.amount)}</td>
        <td>${Math.random() > 0.6 ? '<a href="#">View</a>' : '—'}</td>
        <td style="text-align:center"><button class="btn btn-primary btn-sm">Edit</button></td>
      `;
      expenseTbody.appendChild(tr);
    });
  }
  renderExpenseTable('all', '');

  /* ----------------------
     Invoice table render
     ---------------------- */
  const invoiceTbody = document.querySelector('#invoiceTable tbody');
  
  function renderInvoices() {
    invoiceTbody.innerHTML = '';
    invoiceData.forEach(inv => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:8px">${inv.invoice}</td>
        <td>${inv.client}</td>
        <td>${inv.date}</td>
        <td>${formatCurrency(inv.amount)}</td>
        <td>${inv.status}</td>
        <td style="text-align:center"><button class="btn btn-primary btn-sm">View</button></td>
      `;
      invoiceTbody.appendChild(tr);
    });
  }
  renderInvoices();

  /* ----------------------
     Interactions: Filters, search, exports
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
    if(q) {
      invoiceTbody.querySelectorAll('tr').forEach(tr => {
        if(!tr.textContent.toLowerCase().includes(q)) tr.style.display = 'none';
      });
    }
  });

  // Replaced prompt-based flow with modal form (see below).
  // $('addExpenseBtn').addEventListener('click', () => { ... }); // replaced

  $('addTransaction').addEventListener('click', () => {
    alert('Add transaction form will be implemented in Laravel back-end.');
  });

  $('newInvoice').addEventListener('click', () => {
    // replaced with modal opening below
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
    const csv = rows.map(r => r.join(',')).join('\n');
    downloadBlob(csv, 'finance_summary.csv', 'text/csv');
  });

  $('exportExpenses').addEventListener('click', () => $('exportExpenseCsv').click());

  $('downloadReport').addEventListener('click', () => {
    alert('Report generation will be implemented in back-end. This is a demo button.');
  });

  $('refreshData').addEventListener('click', () => {
    alert('Data refreshed (demo). In production, you would fetch latest data from server.');
  });

  /* ----------------------
     Helpers: exports etc.
     ---------------------- */
  function exportCSV(arr, filename = 'export.csv', keys = null) {
    if(!arr.length) return alert('No data to export');
    keys = keys || Object.keys(arr[0]);
    const rows = [keys.join(',')].concat(arr.map(item => keys.map(k => `"${String(item[k]).replace(/"/g,'""')}"`).join(',')));
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
     Forecast toggle (demo, simple projection)
     ---------------------- */
  let forecastVisible = false;
  $('toggleForecast').addEventListener('click', () => {
    forecastVisible = !forecastVisible;
    if(forecastVisible) {
      const recent = cashflowChart.data.datasets[0].data.slice(-3);
      const avg = recent.reduce((s,v)=>s+v,0)/recent.length || 0;
      const projected = cashflowChart.data.datasets[0].data.map((v,i) => Math.round(v + avg * 0.2 * (i+1)));
      if(cashflowChart.data.datasets.length === 1) {
        cashflowChart.data.datasets.push({ label: 'Forecast', data: projected, borderColor:'#a78bfa', borderDash:[6,4], backgroundColor:'rgba(167,139,250,0.06)', fill:false });
      } else {
        cashflowChart.data.datasets[1].data = projected;
      }
    } else {
      if(cashflowChart.data.datasets.length > 1) cashflowChart.data.datasets.splice(1,1);
    }
    cashflowChart.update();
  });

  /* ----------------------
     Initial render done
     ---------------------- */
  renderAllCharts('all', 6);

  /* ----------------------
     Modal helpers & wiring (added)
     ---------------------- */
  window.closeModal = function(id) {
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.add('hidden');
    el.setAttribute('aria-hidden','true');
  };
  function openModal(id) {
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.remove('hidden');
    el.setAttribute('aria-hidden','false');
    // focus first input
    const first = el.querySelector('input,select,textarea,button');
    if(first) first.focus();
  }

  // Open expense modal when Add Expense clicked
  $('addExpenseBtn').addEventListener('click', () => {
    // clear form
    $('expDate').value = new Date().toISOString().split('T')[0];
    $('expCategory').value = 'Crops';
    $('expDesc').value = '';
    $('expAmt').value = '';
    openModal('expenseModal');
  });

  // Save expense from modal
  $('saveExpense').addEventListener('click', () => {
    const d = $('expDate').value || new Date().toISOString().split('T')[0];
    const cat = $('expCategory').value;
    const desc = $('expDesc').value && $('expDesc').value.trim();
    const amt = parseFloat($('expAmt').value) || 0;
    if(!desc || amt <= 0) {
      alert('Please enter a description and a valid amount.');
      return;
    }
    expenseData.unshift({ date: d, category: cat, description: desc, amount: amt });
    renderExpenseTable($('expenseCategory').value, $('expenseSearch').value);
    renderAllCharts($('categoryFilter').value, determineMonthsLimit($('timeRange').value));
    computeKPIs();
    closeModal('expenseModal');
    alert('Expense added (demo). In production this will call your API.');
  });

  // Open invoice modal
  $('newInvoice').addEventListener('click', () => {
    $('invClient').value = '';
    $('invDate').value = new Date().toISOString().split('T')[0];
    $('invAmt').value = '';
    $('invStatus').value = 'Pending';
    openModal('invoiceModal');
  });

  // Save invoice from modal
  $('saveInvoice').addEventListener('click', () => {
    const client = $('invClient').value && $('invClient').value.trim();
    const d = $('invDate').value || new Date().toISOString().split('T')[0];
    const amt = parseFloat($('invAmt').value) || 0;
    const status = $('invStatus').value || 'Pending';
    if(!client || amt <= 0) {
      alert('Please enter client name and a valid amount.');
      return;
    }
    const id = '#INV-' + Math.floor(1000 + Math.random()*9000);
    invoiceData.unshift({ invoice: id, client, date: d, amount: amt, status });
    renderInvoices();
    computeKPIs();
    closeModal('invoiceModal');
    alert('Invoice created (demo).');
  });

  // close modal on ESC or click outside content
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
      ['expenseModal','invoiceModal'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
    }
  });
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (ev) => {
      if(ev.target === modal) modal.classList.add('hidden');
    });
  });

  /* ----------------------
     Small UI niceties: table filter select (top section)
     ---------------------- */
  // ensure expense table responds when categoryFilter changes (already wired above).



});


import { renderFinanceAlerts } from './component/finance-alerts.js';
import { renderFinanceLoans } from './component/finance-loans.js';
import { renderFinanceProfit } from './component/finance-profit.js';
import { renderFinanceAssets } from './component/finance-assets.js';
import { renderFinanceForecast } from './component/finance-forecast.js';

document.addEventListener("DOMContentLoaded", () => {
  // existing code ...

  // plug new modules
  renderFinanceAlerts("finance-alerts", revenueData, expenseData);
  renderFinanceLoans("finance-loans");
  renderFinanceProfit("finance-profit", revenueData, expenseData);
  renderFinanceAssets("finance-assets");
  renderFinanceForecast("finance-forecast", revenueData, expenseData);
});

