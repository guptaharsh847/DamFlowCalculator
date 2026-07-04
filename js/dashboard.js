/**********************************************************************
 * Dam Flow Calculator
 * dashboard.js
 **********************************************************************/

"use strict";

const Dashboard = {
  latestOutflow: Dom.byId("latestOutflow"),

  latestInflow: Dom.byId("latestInflow"),

  currentLevel: Dom.byId("currentLevel"),

  currentCapacity: Dom.byId("currentCapacity"),
};

/**************************************************************
 * Initialize
 **************************************************************/
window.addEventListener(
  "DOMContentLoaded",

  initDashboard,
);

async function initDashboard() {
  Loader.show("Fetching Dashboard Data...");
  await loadDashboard();
}

/**************************************************************
 * Load Dashboard
 **************************************************************/
async function loadDashboard() {
  try {
    const response = await API.dashboard();

    APP.dashboard = response;

    renderDashboard(response);
  } catch (error) {
    console.error(error);
  }
}

/**************************************************************
 * Render Dashboard
 **************************************************************/
function renderDashboard(data) {
  if (!data) return;

  if (data.latestOutflow) {
    Dom.html("latestOutflow", format(data.latestOutflow.totalOutflow));

    Dom.html("currentLevel", format(data.latestOutflow.waterLevel, 2));
  }

  if (data.latestInflow) {
    Dom.html("latestInflow", format(data.latestInflow.inflow));

    Dom.html("currentCapacity", format(data.latestInflow.liveCapacity));
  }

  renderCharts(data);
}

let inflowChartInstance = null;
let outflowChartInstance = null;

function renderCharts(data) {
  const inflowHistory = data.inflowHistory || [];
  const outflowHistory = data.outflowHistory || [];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#6b7280" },
        grid: { color: "#e5e7eb" },
      },
      x: {
        ticks: { color: "#6b7280" },
        grid: { display: false },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  // Inflow Chart
  const inflowCtx = document.getElementById("inflowChart")?.getContext("2d");
  if (inflowCtx) {
    if (inflowChartInstance) {
      inflowChartInstance.destroy();
    }
    inflowChartInstance = new Chart(inflowCtx, {
      type: "line",
      data: {
        labels: inflowHistory.map((r) => `${r.date.substring(0, 5)} ${r.time}`),
        datasets: [
          {
            label: "Inflow",
            data: inflowHistory.map((r) => r.inflow),
            borderColor: "#009cde",
            backgroundColor: "rgba(0, 156, 222, 0.1)",
            fill: true,
            tension: 0.3,
            pointBackgroundColor: "#009cde",
            pointRadius: 4,
          },
        ],
      },
      options: chartOptions,
    });
  }

  // Outflow Chart
  const outflowCtx = document.getElementById("outflowChart")?.getContext("2d");
  if (outflowCtx) {
    if (outflowChartInstance) {
      outflowChartInstance.destroy();
    }
    outflowChartInstance = new Chart(outflowCtx, {
      type: "bar",
      data: {
        labels: outflowHistory.map(
          (r) => `${r.date.substring(0, 5)} ${r.time}`,
        ),
        datasets: [
          {
            label: "Outflow",
            data: outflowHistory.map((r) => r.totalOutflow),
            backgroundColor: "rgba(0, 90, 158, 0.7)",
            borderColor: "#005a9e",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          x: { ...chartOptions.scales.x, grid: { display: false } },
        },
      },
    });
  }
}

/**********************************************************************
 * Dam Flow Calculator
 * dashboard.js
 * Part 2
 **********************************************************************/

/**************************************************************
 * Auto Refresh
 **************************************************************/
let dashboardTimer = null;

function startDashboardAutoRefresh() {
  stopDashboardAutoRefresh();

  dashboardTimer = setInterval(async () => {
    try {
      // Don't show loader for auto-refresh
      await loadDashboard();
    } catch (error) {
      console.error(error);
    }
  }, 60000);
}

function stopDashboardAutoRefresh() {
  if (dashboardTimer) {
    clearInterval(dashboardTimer);

    dashboardTimer = null;
  }
}

/**************************************************************
 * Connection Status
 **************************************************************/
function setConnectionStatus(isConnected) {
  const badge = Dom.byId("connectionStatus");

  if (!badge) return;

  if (isConnected) {
    badge.innerHTML = "● Connected";

    badge.className = "success";
  } else {
    badge.innerHTML = "● Offline";

    badge.className = "danger";
  }
}

/**************************************************************
 * Dashboard Summary
 **************************************************************/
function dashboardSummary() {
  if (!APP.dashboard) return;

  console.table({
    Outflow: APP.dashboard.latestOutflow,

    Inflow: APP.dashboard.latestInflow,

    OutflowHistory: APP.dashboard.outflowCount,

    InflowHistory: APP.dashboard.inflowCount,
  });
}

/**************************************************************
 * Export Dashboard
 **************************************************************/
function exportDashboard() {
  if (!APP.dashboard) {
    Toast.show(
      "Nothing to export",

      "warning",
    );

    return;
  }

  const blob = new Blob(
    [
      JSON.stringify(
        APP.dashboard,

        null,

        2,
      ),
    ],

    {
      type: "application/json",
    },
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = "dashboard.json";

  a.click();

  URL.revokeObjectURL(url);
}

/**************************************************************
 * Manual Refresh
 **************************************************************/
async function refreshDashboard() {
  try {
    Loader.show("Refreshing Data...");
    await loadDashboard();

    setConnectionStatus(true);

    Toast.show("Dashboard refreshed.");
  } catch (error) {
    setConnectionStatus(false);
  }
}

/**************************************************************
 * Keyboard Shortcut
 **************************************************************/
document.addEventListener(
  "keydown",

  function (event) {
    if (event.ctrlKey && event.key.toLowerCase() === "r") {
      event.preventDefault();

      refreshDashboard();
    }
  },
);

/**************************************************************
 * Startup
 **************************************************************/
window.addEventListener(
  "load",

  async () => {
    try {
      await loadDashboard();

      setConnectionStatus(true);
    } catch (error) {
      setConnectionStatus(false);
    }

    startDashboardAutoRefresh();
  },
);

/**************************************************************
 * Stop Refresh
 **************************************************************/
window.addEventListener(
  "beforeunload",

  () => {
    stopDashboardAutoRefresh();
  },
);

/**************************************************************
 * Debug
 **************************************************************/
function debugDashboard() {
  dashboardSummary();
}

console.log(
  "%cDashboard Module Loaded",

  "background:#0f766e;color:#fff;padding:6px 12px;border-radius:4px;",
);

/**********************************************************************
 * END OF dashboard.js
 **********************************************************************/
