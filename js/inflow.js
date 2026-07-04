/**********************************************************************
 * Dam Flow Calculator
 * inflow.js
 * Part 1
 **********************************************************************/

"use strict";

/**************************************************************
 * DOM
 **************************************************************/
const Inflow = {
  waterLevel: Dom.byId("currentWaterLevel"),
  calculateBtn: Dom.byId("calculateInflowBtn"),
  resetBtn: Dom.byId("resetInflowBtn"),
  historyTable: Dom.byId("inflowHistory"),
};

/**************************************************************
 * Initialize
 **************************************************************/
window.addEventListener(
  "DOMContentLoaded",

  initializeInflow,
);

async function initializeInflow() {
  registerInflowEvents();

  await loadInflowHistory();
}

/**************************************************************
 * Events
 **************************************************************/
function registerInflowEvents() {
  if (Inflow.calculateBtn) {
    Inflow.calculateBtn.addEventListener(
      "click",

      calculateInflow,
    );
  }

  if (Inflow.resetBtn) {
    Inflow.resetBtn.addEventListener(
      "click",

      resetInflowForm,
    );
  }

  if (Inflow.waterLevel) {
    Inflow.waterLevel.addEventListener(
      "keypress",

      function (e) {
        if (e.key === "Enter") {
          calculateInflow();
        }
      },
    );
  }
}

/**************************************************************
 * Validation
 **************************************************************/
function validateInflowForm() {
  return Validator.number(
    "currentWaterLevel",

    "Water Level",
  );
}

/**************************************************************
 * Calculate Inflow
 **************************************************************/
async function calculateInflow() {
  if (!validateInflowForm()) return;

  try {
    Loader.show("Calculating Inflow...");

    Utils.disable("calculateInflowBtn");

    const payload = {
      waterLevel: Dom.number("currentWaterLevel"),
    };

    const response = await API.calculateInflow(payload);

    updateInflowResult(response);

    renderInflowHistory(response.history);

    Toast.show(
      response.firstRecord
        ? "Initial Record Created"
        : "Inflow Calculated Successfully",
    );
  } catch (error) {
    console.error(error);
  } finally {
    Utils.enable("calculateInflowBtn");
  }
}

/**********************************************************************
 * Dam Flow Calculator
 * inflow.js
 * Part 2
 **********************************************************************/

/**************************************************************
 * Update Result Cards
 **************************************************************/
function updateInflowResult(response) {
  Dom.html("previousWaterLevel", format(response.previousWaterLevel, 2));
  Dom.html("displayCurrentWaterLevel", format(response.waterLevel, 2));
  Dom.html("previousCapacity", format(response.previousCapacity));

  Dom.html("currentCapacity", format(response.currentCapacity));

  Dom.html("capacityDifference", format(response.capacityDifference));

  Dom.html("timeDifference", format(response.timeDifference, 2));

  Dom.html("capacityCumec", format(response.capacityCumec));

  Dom.html("previousOutflow", format(response.previousOutflow));

  Dom.html("finalInflow", format(response.inflow));
}

/**************************************************************
 * Load History
 **************************************************************/
async function loadInflowHistory() {
  try {
    const history = await API.inflowHistory();

    console.log("History Response:", history);
    console.log("Is Array:", Array.isArray(history));

    renderInflowHistory(history);
  } catch (error) {
    console.error(error);
  }
}

/**************************************************************
 * Render History
 **************************************************************/
function renderInflowHistory(history) {
  if (!Inflow.historyTable) return;

  Inflow.historyTable.innerHTML = "";

  if (!history || history.length === 0) {
    Inflow.historyTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    No Records Found
                </td>
            </tr>
        `;

    return;
  }

  history.forEach((record) => {
    Inflow.historyTable.innerHTML += `

<tr>

<td>${record.date}</td>

<td>${record.time}</td>

<td>${format(record.waterLevel, 2)}</td>

<td>${format(record.liveCapacity, 2)}</td>

<td>${format(record.capacityDifference, 2)}</td>

<td>${format(record.timeDifference, 2)}</td>

<td><strong>${format(record.inflow, 2)}</strong></td>

</tr>

`;
  });
}

/**************************************************************
 * Reset Form
 **************************************************************/
function resetInflowForm() {
  Utils.clearInputs();

  clearInflowResult();

  if (Inflow.waterLevel) {
    Inflow.waterLevel.focus();
  }
}

/**************************************************************
 * Clear Result
 **************************************************************/
function clearInflowResult() {
  Dom.html("displayCurrentWaterLevel", "--");

  Dom.html("previousWaterLevel", "--");
  Dom.html("previousCapacity", "--");

  Dom.html("currentCapacity", "--");

  Dom.html("capacityDifference", "--");

  Dom.html("timeDifference", "--");

  Dom.html("capacityCumec", "--");

  Dom.html("previousOutflow", "--");

  Dom.html("finalInflow", "--");
}

/**************************************************************
 * Refresh Dashboard
 **************************************************************/
async function refreshDashboardAfterInflow() {
  try {
    if (typeof loadDashboard === "function") {
      await loadDashboard();
    }
  } catch (error) {
    console.error(error);
  }
}
/**********************************************************************
 * Dam Flow Calculator
 * inflow.js
 * Part 3
 **********************************************************************/

/**************************************************************
 * Auto Format
 **************************************************************/
function autoFormatInflowInput() {
  if (!Inflow.waterLevel) return;

  Inflow.waterLevel.addEventListener(
    "blur",

    function () {
      if (this.value === "") return;

      this.value = Number(this.value).toFixed(2);
    },
  );
}

/**************************************************************
 * Prevent Invalid Keys
 **************************************************************/
function restrictInflowInput() {
  if (!Inflow.waterLevel) return;

  Inflow.waterLevel.addEventListener(
    "keydown",

    function (e) {
      if (e.key === "e" || e.key === "E" || e.key === "+") {
        e.preventDefault();
      }
    },
  );
}

/**************************************************************
 * Ctrl + Enter
 **************************************************************/
document.addEventListener(
  "keydown",

  function (e) {
    if (e.ctrlKey && e.key === "Enter") {
      calculateInflow();
    }
  },
);

/**************************************************************
 * Refresh History Button
 **************************************************************/
const inflowRefreshButton = Dom.byId("refreshInflowHistory");

if (inflowRefreshButton) {
  inflowRefreshButton.addEventListener(
    "click",

    loadInflowHistory,
  );
}

/**************************************************************
 * Export JSON
 **************************************************************/
function exportInflowJSON() {
  const result = {
    date: new Date().toLocaleDateString(),

    time: new Date().toLocaleTimeString(),

    waterLevel: Dom.number("currentWaterLevel"),

    previousCapacity: Dom.byId("previousCapacity").innerText,

    currentCapacity: Dom.byId("currentCapacity").innerText,

    capacityDifference: Dom.byId("capacityDifference").innerText,

    timeDifference: Dom.byId("timeDifference").innerText,

    capacityCumec: Dom.byId("capacityCumec").innerText,

    previousOutflow: Dom.byId("previousOutflow").innerText,

    inflow: Dom.byId("finalInflow").innerText,
  };

  const blob = new Blob(
    [
      JSON.stringify(
        result,

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

  a.download = "inflow.json";

  a.click();

  URL.revokeObjectURL(url);
}

/**************************************************************
 * Startup
 **************************************************************/
window.addEventListener(
  "load",

  () => {
    autoFormatInflowInput();

    restrictInflowInput();
  },
);

/**************************************************************
 * Debug
 **************************************************************/
function debugInflow() {
  console.table({
    waterLevel: Dom.number("currentWaterLevel"),
  });
}

console.log(
  "%cInflow Module Loaded",

  "background:#16a34a;color:white;padding:6px 12px;border-radius:4px;",
);

/**********************************************************************
 * END OF FILE
 **********************************************************************/
