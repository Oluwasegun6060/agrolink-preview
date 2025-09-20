let map;
let activeLayer;
const API_KEY = "YOUR_REAL_KEY_HERE"; // replace

export default function initWeatherMap({ containerId, farmCoords, center, zoom }) {
  console.log("✅ weatherMap.js loaded");

  map = L.map(containerId).setView(center, zoom);

  // base map
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  // cloud layer
  activeLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`);
  activeLayer.addTo(map);

  // farm polygon
  if (farmCoords) {
    L.polygon(farmCoords, { color: "green" }).addTo(map);
  }
}
