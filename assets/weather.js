// weather.js — ES module to power weather.html
// Drop-in: save as weather.js and open weather.html
// Replace OPENWEATHER_API_KEY with your key (optional). If not present, fallback demo data used.

const OPENWEATHER_API_KEY = "1dd29951261a46dc781ab644d290e1c2"; // <-- put your key here, or leave as-is for demo fallback
const LAT = 9.0820;
const LON = 8.6753;
const DEFAULT_LOCATION_LABEL = "Nigeria (default)";

/* ---------- helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const formatDay = (dtSec) => {
  const d = new Date(dtSec * 1000);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
};
const toCSV = (rows) => rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');

/* ---------- DOM refs ---------- */
const forecastCanvas = document.getElementById('forecastChart');
const mapContainer = document.getElementById('weatherMap');
const locLabel = document.getElementById('locLabel');
const refreshBtn = document.getElementById('refreshBtn');
const downloadCsvBtn = document.getElementById('downloadCsv');
const ins1 = document.getElementById('ins-1');
const ins2 = document.getElementById('ins-2');
const ins3 = document.getElementById('ins-3');

/* ---------- fallback demo data ---------- */
const demoData = {
  locationLabel: DEFAULT_LOCATION_LABEL,
  daily: [
    // dt (unix seconds), temp.max (°C), rain (mm)
    { dt: Math.floor(Date.now()/1000) + 86400*0, temp: { max: 30 }, rain: 4 },
    { dt: Math.floor(Date.now()/1000) + 86400*1, temp: { max: 31 }, rain: 6 },
    { dt: Math.floor(Date.now()/1000) + 86400*2, temp: { max: 29 }, rain: 2 },
    { dt: Math.floor(Date.now()/1000) + 86400*3, temp: { max: 28 }, rain: 0 },
    { dt: Math.floor(Date.now()/1000) + 86400*4, temp: { max: 27 }, rain: 12 },
    { dt: Math.floor(Date.now()/1000) + 86400*5, temp: { max: 29 }, rain: 1 },
    { dt: Math.floor(Date.now()/1000) + 86400*6, temp: { max: 30 }, rain: 0 }
  ]
};

/* ---------- Chart setup (dual axis) ---------- */
let forecastChart = null;
function createForecastChart(labels, temps, rains) {
  if (forecastChart) {
    forecastChart.data.labels = labels;
    forecastChart.data.datasets[0].data = temps;
    forecastChart.data.datasets[1].data = rains;
    forecastChart.update();
    return;
  }

  forecastChart = new Chart(forecastCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Max Temp (°C)',
          data: temps,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.08)',
          yAxisID: 'yTemp',
          tension: 0.35,
          pointRadius: 4,
          fill: true
        },
        {
          type: 'bar',
          label: 'Rain (mm)',
          data: rains,
          backgroundColor: '#3b82f6',
          yAxisID: 'yRain',
          barThickness: 18
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        yTemp: {
          type: 'linear',
          position: 'left',
          ticks: { callback: v => v + '°C' },
          grid: { drawOnChartArea: false }
        },
        yRain: {
          type: 'linear',
          position: 'right',
          ticks: { callback: v => v + ' mm' },
          grid: { drawOnChartArea: false }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

/* ---------- Map init (Leaflet) ---------- */
let map = null;
let weatherLayers = {};
function initMap() {
  // clear any placeholder text
  mapContainer.innerHTML = '';
  map = L.map(mapContainer).setView([LAT, LON], 6);

  // Base tiles
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // Farm polygon (example — replace with real coords)
  const farmBoundary = L.polygon([
    [LAT + 0.03, LON - 0.03],
    [LAT + 0.03, LON + 0.03],
    [LAT - 0.03, LON + 0.03],
    [LAT - 0.03, LON - 0.03]
  ], {
    color: "#16a34a",
    fillColor: "#22c55e",
    fillOpacity: 0.18
  }).addTo(map);
  farmBoundary.bindPopup("🌱 Farm boundary");

  // Farm center marker
  const farmCenter = L.marker([LAT, LON]).addTo(map).bindPopup("📍 Farm HQ");

  // Add OpenWeather overlay tiles (if API key provided)
  if (OPENWEATHER_API_KEY && OPENWEATHER_API_KEY !== "OPENWEATHER_API_KEY") {
    weatherLayers = {
      clouds: L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`, { attribution: '&copy; OpenWeather' }),
      precipitation: L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`, { attribution: '&copy; OpenWeather' }),
      wind: L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`, { attribution: '&copy; OpenWeather' })
    };
    // default add clouds
    weatherLayers.clouds.addTo(map);
  } else {
    // no key — just provide info that overlays unavailable
    console.warn("OPENWEATHER_API_KEY not set — overlay tiles disabled.");
  }

  // layer buttons
  document.querySelectorAll('.layer-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.layer;
      // remove all weather overlays first
      Object.values(weatherLayers).forEach(l => map.removeLayer(l));
      if (type === 'base') {
        // nothing else to do
      } else if (weatherLayers[type]) {
        weatherLayers[type].addTo(map);
      } else {
        // if no API key, show alert
        if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "OPENWEATHER_API_KEY") {
          alert('Weather overlay layers require an OpenWeather API key. Set OPENWEATHER_API_KEY in weather.js');
        }
      }
    });
  });
}

/* ---------- Fetch forecast (OpenWeather One Call) ---------- */
async function fetchForecast(lat = LAT, lon = LON) {
  // prefer One Call v2.5/3? We'll use 2.5 (widely available) - daily data
  if (OPENWEATHER_API_KEY && OPENWEATHER_API_KEY !== "OPENWEATHER_API_KEY") {
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${OPENWEATHER_API_KEY}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && json.daily && json.daily.length) {
        return {
          locationLabel: `${json.lat.toFixed(3)}, ${json.lon.toFixed(3)}`,
          daily: json.daily.slice(0, 7).map(d => ({
            dt: d.dt,
            temp: { max: d.temp.max },
            rain: d.rain || 0
          }))
        };
      } else {
        throw new Error('Invalid response shape');
      }
    } catch (err) {
      console.warn('OpenWeather fetch failed:', err);
      return null;
    }
  } else {
    // no key configured: return null so caller uses fallback
    return null;
  }
}

/* ---------- Render insights based on data ---------- */
function renderInsights(data) {
  if (!data) {
    ins1.textContent = 'Using demo forecast (no API key or offline).';
    ins2.textContent = 'Tip: add your OpenWeather API key to weather.js to enable live data.';
    ins3.textContent = 'Satellite overlay requires API key for radar/cloud tiles.';
    return;
  }
  // Example: check rain totals & temps
  const totalRain = data.daily.reduce((s, d) => s + (d.rain || 0), 0);
  const hottest = data.daily.reduce((max, d) => d.temp.max > max.temp.max ? d : max, data.daily[0]);
  ins1.textContent = `Total forecast rainfall (7d): ${totalRain.toFixed(1)} mm`;
  ins2.textContent = `Hottest day: ${formatDay(hottest.dt)} — ${hottest.temp.max.toFixed(1)}°C`;
  ins3.textContent = totalRain > 20 ? 'Recommend: check drainage & plan spraying windows.' : 'Rain expected is light — good for field work.';
}

/* ---------- main flow ---------- */
async function loadAndRender() {
  locLabel.textContent = DEFAULT_LOCATION_LABEL;
  // try fetch live forecast
  const live = await fetchForecast();
  const used = live || demoData;
  // build chart arrays
  const labels = used.daily.map(d => formatDay(d.dt));
  const temps = used.daily.map(d => Math.round(d.temp.max * 10) / 10);
  const rains = used.daily.map(d => (d.rain || 0));

  // create or update chart
  createForecastChart(labels, temps, rains);

  // set insights
  renderInsights(used);

  // setup download CSV action
  downloadCsvBtn.onclick = () => {
    const rows = [['Day','MaxTemp (°C)','Rain (mm)']];
    used.daily.forEach(d => rows.push([formatDay(d.dt), (d.temp.max).toString(), (d.rain || 0).toString()]));
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'weather_forecast.csv';
    document.body.appendChild(a); a.click(); a.remove();
  };
}

/* ---------- wire refresh + init ---------- */
refreshBtn.addEventListener('click', async () => {
  refreshBtn.disabled = true;
  refreshBtn.textContent = 'Refreshing...';
  try {
    await loadAndRender();
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<i class="ri-refresh-line"></i> Refresh Data';
  }
});

// initialize UI + chart + map
initMap();
loadAndRender();
