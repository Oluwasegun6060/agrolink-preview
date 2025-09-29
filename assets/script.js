// assets/script.js
// Global UI: sidebar collapse (desktop icon-only), mobile overlay, theme toggle,
// production chart init, leaflet map init, weather fetch, small utilities.

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Sidebar module (reusable across pages) ----------
  (function agrolinkSidebarModule(){
    const MOBILE_BREAKPOINT = 1100;
    const SIDEBAR_KEY = 'agro-sidebar-collapsed';

    const layoutRoot = document.getElementById('layoutRoot') || document.querySelector('.layout') || document.body;
    let collapseBtn = document.getElementById('collapseBtn');
    const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
    let sidebarBackdrop = document.getElementById('sidebarBackdrop') || document.querySelector('.sidebar-backdrop');

    const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;

    function ensureCollapseBtn(){
      if (collapseBtn) return collapseBtn;
      collapseBtn = document.createElement('button');
      collapseBtn.id = 'collapseBtn';
      collapseBtn.type = 'button';
      collapseBtn.className = 'btn';
      collapseBtn.setAttribute('aria-label','Toggle menu');
      collapseBtn.title = 'Toggle menu';
      collapseBtn.innerHTML = '<i class="ri-menu-line" aria-hidden="true"></i>';
      const top = document.querySelector('.topbar');
      if (top) top.insertBefore(collapseBtn, top.firstChild);
      else document.body.insertBefore(collapseBtn, document.body.firstChild);
      return collapseBtn;
    }

    function ensureBackdrop(){
      if (sidebarBackdrop) return sidebarBackdrop;
      sidebarBackdrop = document.createElement('div');
      sidebarBackdrop.id = 'sidebarBackdrop';
      sidebarBackdrop.className = 'sidebar-backdrop hidden';
      sidebarBackdrop.setAttribute('aria-hidden','true');
      document.body.appendChild(sidebarBackdrop);
      return sidebarBackdrop;
    }

    ensureCollapseBtn();
    ensureBackdrop();

    function setDesktopCollapsed(val){
      if (!layoutRoot) return;
      if (val) {
        layoutRoot.classList.add('sidebar-collapsed');
        localStorage.setItem(SIDEBAR_KEY, '1');
      } else {
        layoutRoot.classList.remove('sidebar-collapsed');
        localStorage.setItem(SIDEBAR_KEY, '0');
      }
    }

    function openMobileSidebar(){
      sidebar && sidebar.classList.add('open');
      sidebarBackdrop && (sidebarBackdrop.classList.add('visible'), sidebarBackdrop.classList.remove('hidden'));
      document.documentElement.classList.add('agro-mobile-menu-open');
      const first = sidebar && sidebar.querySelector('a,button,input,select');
      if (first) first.focus();
    }
    function closeMobileSidebar(){
      sidebar && sidebar.classList.remove('open');
      sidebarBackdrop && (sidebarBackdrop.classList.remove('visible'), sidebarBackdrop.classList.add('hidden'));
      document.documentElement.classList.remove('agro-mobile-menu-open');
      collapseBtn && collapseBtn.focus();
    }

    // restore desktop collapsed state (only apply if not mobile)
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === '1' && !isMobile()){
      layoutRoot.classList.add('sidebar-collapsed');
    } else {
      layoutRoot.classList.remove('sidebar-collapsed');
    }

    // click behavior
    collapseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isMobile()){
        if (sidebar && sidebar.classList.contains('open')) closeMobileSidebar();
        else openMobileSidebar();
        return;
      }
      const nowCollapsed = layoutRoot.classList.toggle('sidebar-collapsed');
      localStorage.setItem(SIDEBAR_KEY, nowCollapsed ? '1' : '0');
    });

    // backdrop click & Escape closes mobile
    sidebarBackdrop.addEventListener('click', () => { if (isMobile()) closeMobileSidebar(); });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && sidebar && sidebar.classList.contains('open')) closeMobileSidebar(); });

    // on resize: close overlay when reaching desktop, reapply stored desktop collapsed state
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!isMobile()){
          closeMobileSidebar();
          const storedNow = localStorage.getItem(SIDEBAR_KEY) === '1';
          if (storedNow) layoutRoot.classList.add('sidebar-collapsed');
          else layoutRoot.classList.remove('sidebar-collapsed');
        } else {
          layoutRoot.classList.remove('sidebar-collapsed'); // don't show desktop collapsed while in mobile layout
        }
      }, 120);
    });

    // API for pages / debug
    window.agrolinkSidebar = {
      openMobileMenu: openMobileSidebar,
      closeMobileMenu: closeMobileSidebar,
      toggle() {
        if (isMobile()) {
          if (sidebar && sidebar.classList.contains('open')) closeMobileSidebar();
          else openMobileSidebar();
          return;
        }
        const nowCollapsed = layoutRoot.classList.toggle('sidebar-collapsed');
        localStorage.setItem(SIDEBAR_KEY, nowCollapsed ? '1' : '0');
      },
      setCollapsed: setDesktopCollapsed
    };

    // accessibility aria sync
    function updateAria(){
      const collapsed = layoutRoot.classList.contains('sidebar-collapsed');
      collapseBtn.setAttribute('aria-expanded', String(!collapsed));
      if (sidebar) sidebar.setAttribute('aria-hidden', String(collapsed && !isMobile()));
    }
    const obs = new MutationObserver(updateAria);
    obs.observe(layoutRoot, { attributes: true, attributeFilter: ['class'] });
    updateAria();
  })();
  // ---------- End Sidebar module ----------


  // ---------- Theme toggle & other elements ----------
  const layoutRoot = document.getElementById('layoutRoot') || document.querySelector('.layout') || document.body;
  const themeToggle = document.getElementById('themeToggle');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  const THEME_KEY = 'agro-theme';

  // Theme: keep icon intact; only update the label text inside .nav-label
  function applySavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const labelSpan = themeToggle ? themeToggle.querySelector('.nav-label') : null;
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      if (labelSpan) labelSpan.textContent = 'Light';
    } else {
      document.documentElement.classList.remove('dark');
      if (labelSpan) labelSpan.textContent = 'Dark';
    }
  }
  applySavedTheme();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
      const labelSpan = themeToggle.querySelector('.nav-label');
      if (labelSpan) labelSpan.textContent = isDark ? 'Light' : 'Dark';
    });
  }

  // --- utility: animate numbers
  function animateValue(elOrId, start, end, duration = 700, formatFn = v => Math.round(v)) {
    const el = (typeof elOrId === 'string') ? document.getElementById(elOrId) : elOrId;
    if (!el) return;
    const startTime = performance.now();
    const from = Number(start) || 0;
    const to = Number(end) || 0;
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = from + (to - from) * eased;
      el.textContent = formatFn(val);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---------- Production chart dataset
  const datasetByRange = {
    ALL: { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      harvest:[120,140,135,150,180,200,210,205,198,190,175,160],
      revenue:[20,22,24,26,28,30,32,33,31,29,26,24] },
    '1M': { labels:['Week 1','Week 2','Week 3','Week 4'], harvest:[40,46,42,50], revenue:[7,8,7.5,9] },
    '6M': { labels:['Feb','Mar','Apr','May','Jun','Jul'], harvest:[140,135,150,180,200,210], revenue:[22,24,26,28,30,32] },
    '1Y': { labels:['Q1','Q2','Q3','Q4'], harvest:[395,540,618,525], revenue:[66,84,96,79] },
  };

  // ---------- Revenue chart (single instance)
  let productionChart = null;
  function initProductionChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas || typeof Chart === 'undefined') return;

    // ensure parent has a bounded height so canvas doesn't expand
    const parent = canvas.parentElement;
    if (parent) parent.style.minHeight = parent.style.minHeight || '260px';

    const ctx = canvas.getContext('2d');

    // create gradients
    const g1 = ctx.createLinearGradient(0,0,0,220);
    g1.addColorStop(0, 'rgba(79,70,229,0.20)');
    g1.addColorStop(1, 'rgba(79,70,229,0.02)');
    const g2 = ctx.createLinearGradient(0,0,0,220);
    g2.addColorStop(0, 'rgba(34,197,94,0.14)');
    g2.addColorStop(1, 'rgba(34,197,94,0.02)');

    // only create once
    if (productionChart) return;
    productionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datasetByRange.ALL.labels.slice(),
        datasets: [
          { label: 'Harvest (t)', data: datasetByRange.ALL.harvest.slice(), tension: 0.35, borderWidth: 2, backgroundColor: g1, borderColor: 'rgb(79,70,229)', fill: true, pointRadius: 3 },
          { label: 'Revenue ($k)', data: datasetByRange.ALL.revenue.slice(), tension: 0.35, borderWidth: 2, borderDash: [6,6], backgroundColor: g2, borderColor: 'rgb(34,197,94)', fill: true, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutCubic' },
        scales: { y: { grid: { color: '#eef2ff' } }, x: { grid: { display: false } } },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } }
      }
    });
  }

  // safe update with debounce
  let updateTimeout = null;
  function updateProductionRange(rangeKey = 'ALL') {
    if (!productionChart) return;
    if (!datasetByRange[rangeKey]) rangeKey = 'ALL';
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      const ds = datasetByRange[rangeKey];
      productionChart.data.labels = ds.labels.slice();
      productionChart.data.datasets[0].data = ds.harvest.slice();
      productionChart.data.datasets[1].data = ds.revenue.slice();
      productionChart.update();
      updateKPIs(rangeKey);
    }, 120);
  }

  function last(arr){ return arr && arr.length ? arr[arr.length - 1] : 0; }
  function updateKPIs(range) {
    const ds = datasetByRange[range] || datasetByRange.ALL;
    const lastH = last(ds.harvest);
    const lastR = last(ds.revenue);
    const shipments = Math.round(lastH * 36);
    const revenueVal = Math.round(lastR * 1000);
    const wastage = Math.round(lastH * 0.12);
    const yieldEff = 80 + (lastH % 20);

    const kpiShipmentsEl = document.getElementById('kpiShipments');
    const kpiRevenueEl = document.getElementById('kpiRevenue');
    const kpiWastageEl = document.getElementById('kpiWastage');
    const kpiYieldEl = document.getElementById('kpiYield');

    kpiShipmentsEl && animateValue(kpiShipmentsEl, Number(kpiShipmentsEl.textContent.replace(/,/g,'')) || 0, shipments, 700, v => Math.round(v).toLocaleString());
    kpiRevenueEl && animateValue(kpiRevenueEl, Number(kpiRevenueEl.textContent.replace(/[^0-9.-]+/g,'')) || 0, revenueVal, 700, v => '$' + Math.round(v).toLocaleString());
    kpiWastageEl && animateValue(kpiWastageEl, Number(kpiWastageEl.textContent.replace(/,/g,'')) || 0, wastage, 700, v => Math.round(v).toLocaleString());
    kpiYieldEl && animateValue(kpiYieldEl, Number(kpiYieldEl.textContent.replace('%','')) || 0, yieldEff, 700, v => (Math.round(v*100)/100) + '%');

    // top cards
    const mRevenueEl = document.getElementById('mRevenue');
    if (mRevenueEl) {
      const targetK = (revenueVal / 1000);
      animateValue(mRevenueEl, 0, targetK, 900, v => '$' + Number(v).toFixed(2) + 'k');
    }
    const mHarvestEl = document.getElementById('mHarvest');
    if (mHarvestEl) animateValue(mHarvestEl, 0, lastH, 900, v => Math.round(v).toLocaleString() + ' t');

    const mFieldsEl = document.getElementById('mFields');
    mFieldsEl && animateValue(mFieldsEl, 0, 183, 900, v => Math.round(v).toLocaleString());
    const mBalanceEl = document.getElementById('mBalance');
    mBalanceEl && animateValue(mBalanceEl, 0, 165.89, 900, v => '$' + Number(v).toFixed(2) + 'k');
  }

  const filtersEl = document.getElementById('filters');
  filtersEl && filtersEl.addEventListener('click', (e) => {
    if (e.target && e.target.matches('.pill')) {
      document.querySelectorAll('.pill').forEach(p => { p.classList.remove('active'); p.setAttribute('aria-pressed','false'); });
      e.target.classList.add('active');
      e.target.setAttribute('aria-pressed','true');
      const range = e.target.dataset.range || 'ALL';
      updateProductionRange(range);
    }
  });

  // Initialize chart AFTER DOM ready
  initProductionChart();

  // Initialize KPIs with default range
  updateKPIs('ALL');

  // ---------- Leaflet map: init only once & invalidate size ----------
  let farmMap = null;
  function initFarmMapIfNeeded() {
    if (!document.getElementById('map') || typeof L === 'undefined') return;
    if (farmMap) return; // already created
    try {
      farmMap = L.map('map', { zoomControl: true }).setView([9.0820, 8.6753], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(farmMap);

      const farms = [
        { name: 'Kaduna Maize', coords: [10.52, 7.44], output: '1,250 t' },
        { name: 'Oyo Cassava', coords: [8.15, 3.35], output: '980 t' },
        { name: 'Kano Tomatoes', coords: [12.00, 8.52], output: '650 t' },
        { name: 'Accra Vegetables', coords: [5.56, -0.20], output: '420 t' },
        { name: 'Nairobi Dairy', coords: [-1.29, 36.82], output: '1,100 L/day' },
      ];
      farms.forEach(f => {
        L.circleMarker(f.coords, { radius: 8, weight: 2, color: '#4f46e5', fillColor: '#a5b4fc', fillOpacity: .8 })
          .addTo(farmMap).bindPopup(`<b>${f.name}</b><br>Output: ${f.output}`);
      });

      // invalidate size shortly after init to avoid tile/control render issues
      setTimeout(() => { try { farmMap.invalidateSize(); } catch (e) { /* ignore */ } }, 200);
    } catch (err) {
      console.warn('Map init failed', err);
    }
  }
  initFarmMapIfNeeded();

  // When mobile sidebar opens/closes, map may be hidden/visible: ensure invalidate
  const observer = new MutationObserver(() => { if (farmMap) { try { farmMap.invalidateSize(); } catch (e) {} } });
  const mapNode = document.getElementById('map');
  if (mapNode) observer.observe(mapNode, { attributes: true, childList: false, subtree: false });

  // ---------- Weather (safe fetch, short timeout) ----------
  async function fetchWithTimeout(url, opts = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  async function updateSidebarWeather() {
    const summaryEl = document.getElementById('sidebarWeatherSummary');
    const tempEl = document.getElementById('sidebarWeatherTemp');
    const iconEl = document.getElementById('sidebarWeatherIcon');
    const updatedEl = document.getElementById('sidebarWeatherUpdated');
    if (!summaryEl || !tempEl) return;
    try {
      const lat = 9.0820, lon = 8.6753;
      const res = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`, {}, 6000);
      if (!res.ok) throw new Error('Weather fetch failed');
      const json = await res.json();
      if (json && json.current_weather) {
        const cw = json.current_weather;
        summaryEl.textContent = `Temp: ${cw.temperature}°C • Wind ${cw.windspeed} km/h`;
        tempEl.textContent = `${cw.temperature}°C`;
        iconEl.textContent = '🌤';
        updatedEl && (updatedEl.textContent = new Date().toLocaleTimeString());
      } else {
        summaryEl.textContent = 'Weather data unavailable';
        tempEl.textContent = '';
        iconEl.textContent = '';
      }
    } catch (err) {
      summaryEl.textContent = 'Weather unavailable';
      tempEl.textContent = '';
      iconEl.textContent = '—';
    }
  }
  updateSidebarWeather();

  // ---------- Small utilities (tasks, exports) ----------
  const addOpTaskBtn = document.getElementById('addOpTask');
  const downloadTasksBtn = document.getElementById('downloadTasks');
  addOpTaskBtn && addOpTaskBtn.addEventListener('click', () => {
    const ul = document.getElementById('opTasks'); if (!ul) return;
    const li = document.createElement('li'); li.textContent = `📝 Quick Task added — ${new Date().toLocaleString()}`; ul.prepend(li);
  });
  downloadTasksBtn && downloadTasksBtn.addEventListener('click', () => {
    const list = Array.from(document.querySelectorAll('#opTasks li')).map(li => li.textContent);
    if (!list.length) return alert('No tasks to export');
    const csv = ['Task'].concat(list).map(r => `"${r.replace(/"/g,'""')}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'agro_tasks.csv'; document.body.appendChild(a); a.click(); a.remove();
  });

  const exportBtn = document.getElementById('exportCsvBtn');
  exportBtn && exportBtn.addEventListener('click', () => {
    const rows = [
      ['Metric','Value'],
      ['Total Revenue', (document.getElementById('mRevenue')||{textContent:'-'}).textContent],
      ['Total Harvest', (document.getElementById('mHarvest')||{textContent:'-'}).textContent],
      ['Active Fields', (document.getElementById('mFields')||{textContent:'-'}).textContent],
      ['Farm Balance', (document.getElementById('mBalance')||{textContent:'-'}).textContent]
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'agro_kpis.csv'; document.body.appendChild(a); a.click(); a.remove();
  });

  // keyboard accessibility
  document.querySelectorAll('.pill, .nav a, .btn').forEach((el) => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  });

}); // DOMContentLoaded
