/**********************************************************************
 * Dam Flow Calculator
 * dashboard.js
 **********************************************************************/

"use strict";

const Dashboard = {
  latestOutflow: Dom.byId("latestOutflow"),

  latestInflow: Dom.byId("latestInflow"),

  currentLevel: Dom.byId("currentLevel"),
};

/**************************************************************
 * Initialize
 **************************************************************/
window.addEventListener(
  "DOMContentLoaded",

  initDashboard,
);

async function initDashboard() {
  Loader.show("Fetching Dashboard Data..."); // Show loader immediately
  await loadDashboard(); // Fetch and render data
  setConnectionStatus(true); // Set status after successful load
  startDashboardAutoRefresh(); // Start the refresh timer
}

/**************************************************************
 * Load Dashboard
 **************************************************************/
async function loadDashboard() {
  try {
    // Fetch both dashboard stats and inflow history at the same time
    const [dashboardResponse, inflowHistory] = await Promise.all([
      API.dashboard(),
      API.inflowHistory(),
    ]);

    APP.dashboard = { ...dashboardResponse, inflowHistory }; // Combine results
    renderDashboard(APP.dashboard);
  } catch (error) {
    console.error(error);
    setConnectionStatus(false); // Set status to offline on error
  }
}

/**************************************************************
 * Render Dashboard
 **************************************************************/
function renderDashboard(data) {
  if (!data) return;

  const inflowCard = Dom.byId("inflowCard");
  const differenceCard = Dom.byId("differenceCard");
  const waterLevelChangeCard = Dom.byId("waterLevelChangeCard");

  let inflowValue = 0;
  let outflowValue = 0;

  if (data.latestOutflow) {
    outflowValue = data.latestOutflow.totalOutflow || 0;
    Dom.html("latestOutflow", format(outflowValue));
    // Dom.html("currentLevel", format(data.latestOutflow.waterLevel, 2));
    Dom.html("currentLevel", format(data.latestInflow.waterLevel, 2));
  }

  if (data.latestInflow) {
    // --- Water Level Change Calculation ---
    inflowValue = data.latestInflow.inflow || 0;
    // Display absolute value for inflow, but use real value for color coding
    Dom.html("latestInflow", format(Math.abs(inflowValue)));

    if (inflowCard) {
      inflowCard.classList.remove("card-success", "card-danger");
      if (inflowValue >= 0) {
        inflowCard.classList.add("card-success");
      } else {
        inflowCard.classList.add("card-danger");
      }
    }

    // Use the fetched inflow history for a more reliable calculation
    const history = data.inflowHistory || [];
    let currentLevel = 0;
    let previousLevel = 0;
    if (history.length >= 2) {
      // Use the last two records from the history for the most recent data
      currentLevel = history[history.length - 1].waterLevel || 0;
      previousLevel = history[history.length - 2].waterLevel || 0;
    }
    const levelChange = currentLevel - previousLevel;
    console.log("currentLevel", currentLevel);
    console.log("levelChange", levelChange);
    console.log("previousLevel", previousLevel);

    Dom.html("waterLevelChange", format(Math.abs(levelChange), 2));

    if (waterLevelChangeCard) {
      waterLevelChangeCard.classList.remove("card-success", "card-danger");
      if (levelChange >= 0) {
        waterLevelChangeCard.classList.add("card-success");
      } else {
        waterLevelChangeCard.classList.add("card-danger");
      }
    }
    // --- End Water Level Change ---
  }

  // Calculate and render the difference
  const difference = inflowValue - outflowValue;
  Dom.html("levelDifference", format(difference));

  if (differenceCard) {
    differenceCard.classList.remove("card-success", "card-danger");
    if (difference >= 0) {
      differenceCard.classList.add("card-success");
    } else {
      // Display as positive, but card is red
      Dom.html("levelDifference", format(Math.abs(difference)));
      differenceCard.classList.add("card-danger");
    }
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
