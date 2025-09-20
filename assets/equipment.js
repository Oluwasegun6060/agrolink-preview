/* assets/equipment.js */
document.addEventListener("DOMContentLoaded", () => {
  // === Equipment Data ===
  const equipmentLocations = [
    { id: "T1", type: "Tractor", coords: [9.1, 8.7], status: "Active", fuel: "80%", operator: "John Doe" },
    { id: "D3", type: "Drone", coords: [9.09, 8.68], status: "Low Battery", fuel: "15%", operator: "Jane Smith" },
    { id: "H2", type: "Harvester", coords: [9.07, 8.65], status: "Service", fuel: "60%", operator: "Samuel Ade" },
    { id: "S1", type: "Sprayer", coords: [9.05, 8.66], status: "Idle", fuel: "95%", operator: "Aisha Bello" }
  ];

  // === Chart: Weekly Usage ===
  new Chart(document.getElementById("equipUsageChart"), {
    type: "bar",
    data: {
      labels: ["Tractor T1", "Drone D3", "Harvester H2", "Sprayer S1"],
      datasets: [{
        label: "Hours Used",
        data: [34, 12, 5, 22],
        backgroundColor: ["#2563eb", "#f59e0b", "#ef4444", "#16a34a"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // === Chart: Efficiency Timeline ===
  new Chart(document.getElementById("equipTimelineChart"), {
    type: "line",
    data: {
      labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      datasets: [{
        label: "Efficiency %",
        data: [88, 92, 95, 90, 85, 93, 91],
        borderColor: "#16a34a",
        backgroundColor: "rgba(34,197,94,0.3)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });

  // === Map Setup ===
  const map = L.map("equipMap").setView([9.0820, 8.6753], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  // Status → marker color
  function getStatusIcon(status) {
    const colors = {
      "Active": "green",
      "Low Battery": "orange",
      "Service": "red",
      "Idle": "blue"
    };
    const color = colors[status] || "gray";
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  // Add equipment markers
  equipmentLocations.forEach(eq => {
    const marker = L.marker(eq.coords, { icon: getStatusIcon(eq.status) }).addTo(map);
    marker.bindPopup(`
      🚜 <b>${eq.type} ${eq.id}</b><br>
      Status: ${eq.status}<br>
      Fuel: ${eq.fuel}<br>
      Operator: ${eq.operator}
    `);
  });

  // === Filter Equipment Table ===
  const equipFilter = document.getElementById("equipFilter");
  equipFilter?.addEventListener("change", e => {
    const rows = document.querySelectorAll("#equipTable tbody tr");
    rows.forEach(row => {
      const type = row.getAttribute("data-type") || row.children[1].textContent;
      if (e.target.value === "all" || type === e.target.value) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });

  // === Alerts Auto-Refresh ===
  const equipAlerts = document.getElementById("equipAlerts");
  setInterval(() => {
    const messages = [
      "🛠️ Tractor T2 scheduled for tire replacement.",
      "⚡ Drone D4 battery swapped.",
      "⛽ Harvester H3 fuel low.",
      "🔧 Sprayer S5 nozzle cleaning required.",
      "✅ Tractor T1 maintenance completed."
    ];
    const li = document.createElement("li");
    li.textContent = messages[Math.floor(Math.random() * messages.length)];
    equipAlerts.prepend(li);
    while (equipAlerts.children.length > 6) {
      equipAlerts.removeChild(equipAlerts.lastChild);
    }
  }, 8000);

  // === Add Equipment Button ===
  document.getElementById("addEquipBtn")?.addEventListener("click", () => {
    alert("🚜 Add Equipment form (future Laravel integration).");
  });

  // === Export Equipment Table to CSV ===
  document.querySelector(".btn.btn-primary i.ri-inbox-unarchive-line")
    ?.parentElement.addEventListener("click", () => {
      const table = document.querySelector("#equipTable");
      if (!table) return;

      let csv = [];
      const rows = table.querySelectorAll("tr");

      rows.forEach(row => {
        const cols = row.querySelectorAll("th, td");
        const rowData = [];
        cols.forEach(col => rowData.push(col.innerText.trim()));
        csv.push(rowData.join(","));
      });

      const blob = new Blob([csv.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "equipment_inventory.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
});
