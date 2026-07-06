/**********************************************************************
 * Dam Flow Calculator
 * outflow.js
 * Part 1
 **********************************************************************/

"use strict";

/**************************************************************
 * DOM
 **************************************************************/
let Outflow = {};

/**************************************************************
 * Initialize
 **************************************************************/
window.addEventListener(
  "DOMContentLoaded",

  initOutflow,
);

async function initOutflow() {
  Outflow = {
    waterLevel: Dom.byId("waterLevel"),
    powerhouseHours: Dom.byId("powerhouseHours"),
    ukailaCanal: Dom.byId("ukailaCanal"),
    calculateBtn: Dom.byId("calculateBtn"),
    resetBtn: Dom.byId("resetBtn"),
    historyTable: Dom.byId("historyTable"),
  };

  bindEvents();

  await loadOutflowHistory();
  setupOutflowGateDetailsToggle();
}

/**************************************************************
 * Events
 **************************************************************/
function bindEvents() {
  if (Outflow.calculateBtn) {
    Outflow.calculateBtn.addEventListener(
      "click",

      calculateOutflow,
    );
  }

  if (Outflow.resetBtn) {
    Outflow.resetBtn.addEventListener(
      "click",

      resetOutflowForm,
    );
  }

  [
    Outflow.waterLevel, // Existing inputs
    Outflow.powerhouseHours,
    Outflow.ukailaCanal,
    ...Array.from({ length: 10 }, (_, i) => Dom.byId(`gateOpening${i + 1}`)), // Gate inputs
  ]
    .filter(Boolean) // Filter out nulls if any element is not found
    .forEach((input) => {
      if (!input) return;

      input.addEventListener(
        "keypress",

        function (e) {
          if (e.key === "Enter") {
            calculateOutflow();
          }
        },
      );
    });
}

function setupOutflowGateDetailsToggle() {
  Dom.byId("gate-details-toggle")?.addEventListener("click", toggleOutflowGateDetails);
}

/**************************************************************
 * Validation
 **************************************************************/
function validateOutflowForm() {
  if (
    !Validator.number(
      "waterLevel",

      "Water Level",
    )
  )
    return false;

  // Validate all 10 gate openings
  for (let i = 1; i <= 10; i++) {
    if (!Validator.number(`gateOpening${i}`, `Gate ${i} Opening`)) {
      return false;
    }
  }

  if (
    !Validator.number(
      "powerhouseHours",

      "Powerhouse Hours",
    )
  )
    return false;

  if (
    !Validator.number(
      "ukailaCanal",

      "Ukaila Canal",
    )
  )
    return false;

  return true;
}

/**************************************************************
 * Calculate
 **************************************************************/
async function calculateOutflow() {
  if (!validateOutflowForm()) return;

  try {
    Loader.show("Calculating Outflow...");

    Utils.disable("calculateBtn");

    const payload = {
      waterLevel: Dom.number("waterLevel"),
      powerhouseHours: Dom.number("powerhouseHours"),
      ukailaCanal: Dom.number("ukailaCanal"),
      returnIndividual: true, // Request individual q values from the backend
    };

    // Add all 10 gate openings to the payload
    for (let i = 1; i <= 10; i++) {
      payload[`gateOpening${i}`] = Dom.number(`gateOpening${i}`);
    }

    // Calculate total gate opening for history/display purposes
    payload.gateOpening = Object.values(payload)
      .slice(4) // Skips waterLevel, powerhouseHours, ukailaCanal, and returnIndividual
      .reduce((sum, val) => sum + (val || 0), 0);

    const response = await API.calculateOutflow(payload);

    // Log the full API response to the console for debugging
    console.log("Full API Response:", response);

    updateOutflowResult(response);

    renderOutflowHistory(response.history);

    Toast.show("Outflow Calculated Successfully");
  } catch (error) {
    console.error(error);
  } finally {
    Utils.enable("calculateBtn");
  }
}
/**********************************************************************
 * Dam Flow Calculator
 * outflow.js
 * Part 2
 **********************************************************************/

/**************************************************************
 * Update Result Cards
 **************************************************************/
function updateOutflowResult(response) {
  const totalGateDischarge = response.q || 0;
  let totalOpening = 0;
  for (let i = 1; i <= 10; i++) {
    totalOpening += Dom.number(`gateOpening${i}`);
  }

  // Dynamically build and insert individual gate discharge rows
  const innerTableBody = document.querySelector(".inner-result-table tbody");
  if (innerTableBody) {
    innerTableBody.innerHTML = ""; // Clear previous results
    for (let i = 1; i <= 10; i++) {
      let individualDischarge = 0;
      if (totalOpening > 0) {
        const gateOpening = Dom.number(`gateOpening${i}`);
        if (gateOpening > 0) {
          individualDischarge = (totalGateDischarge / totalOpening) * gateOpening;
        }
      }
      innerTableBody.innerHTML += `
        <tr>
          <td>Gate ${i} Discharge (q${i})</td>
          <td>${format(individualDischarge)}</td>
        </tr>
      `;
    }
  }

  // Show/hide the collapsible toggle based on gate discharge
  const toggleRow = Dom.byId("gate-details-toggle");
  if (totalGateDischarge > 0) {
    toggleRow.classList.remove("hidden");
  } else {
    toggleRow.classList.add("hidden");
  }

  // Always show the total gate discharge (q)
  Dom.html("qValue", format(response.q));

  Dom.html("powerhouseValue", format(response.powerhouseOutflow));

  Dom.html("ukailaValue", format(response.ukailaCanal));

  Dom.html("totalOutflow", format(response.totalOutflow));
}

/**************************************************************
 * Load History
 **************************************************************/
async function loadOutflowHistory() {
  try {
    const history = await API.outflowHistory();

    renderOutflowHistory(history);
  } catch (error) {
    console.error(error);
  }
}

/**************************************************************
 * Render History
 **************************************************************/
function renderOutflowHistory(history) {
  const tableBody = Outflow.historyTable;
  const cardContainer = Dom.byId("historyCardContainer");

  if (!tableBody || !cardContainer) return;

  tableBody.innerHTML = "";
  cardContainer.innerHTML = "";

  if (!history || history.length === 0) {
    const noRecordsHtml = `
            <tr>
                <td colspan="9" class="text-center">
                    No Records Found
                </td>
            </tr>
        `;
    tableBody.innerHTML = noRecordsHtml;
    cardContainer.innerHTML = `<div class="text-center" style="padding: 20px;">No Records Found</div>`;
    return;
  }

  history
    .slice()
    .reverse()
    .forEach((record) => {
      const { date: displayDate } = formatDateTime(record.date);
      const { time: displayTime } = formatDateTime(record.time);

      // For Desktop Table
      tableBody.innerHTML += `
      <tr>
        <td>${displayDate}</td>
        <td>${displayTime}</td>
        <td>${format(record.waterLevel, 2)}</td>
        <td>${format(record.gateOpening, 2)}</td>
        <td>${format(record.q, 2)}</td>
        <td>${format(record.powerhouseOutflow, 2)}</td>
        <td>${format(record.ukailaCanal, 2)}</td>
        <td><strong>${format(record.totalOutflow, 2)}</strong></td>
      </tr>
    `;

      // For Mobile Cards
      cardContainer.innerHTML += `
      <div class="history-card">
        <div class="history-card-header">
          <div class="info">
            <h4>Total Outflow: ${format(record.totalOutflow, 2)}</h4>
            <small>${displayDate} at ${displayTime}</small>
          </div>
          <span class="arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
        </div>
        <div class="history-card-body">
          <div class="prediction-detail"><span>Water Level (m)</span><span>${format(record.waterLevel, 2)}</span></div>
          <div class="prediction-detail"><span>Gate Opening (m)</span><span>${format(record.gateOpening, 2)}</span></div>
          <div class="prediction-detail"><span>Gate Discharge</span><span>${format(record.q, 2)}</span></div>
          <div class="prediction-detail"><span>Powerhouse Outflow</span><span>${format(record.powerhouseOutflow, 2)}</span></div>
          <div class="prediction-detail"><span>Ukaila Canal</span><span>${format(record.ukailaCanal, 2)}</span></div>
        </div>
      </div>
    `;
    });

  // Add event listeners for collapsible cards
  document.querySelectorAll(".history-card-header").forEach((header) => {
    header.addEventListener("click", () => {
      const body = header.nextElementSibling;
      header.classList.toggle("active");
      body.classList.toggle("open");
    });
  });

  // Toggle visibility based on screen size
  const handleView = () => {
    const table = Dom.byId("historyTable").parentElement; // The table element itself
    if (window.innerWidth <= 768) {
      // On mobile, hide the default responsive table behavior and show cards
      table.classList.add("hidden");
      cardContainer.classList.remove("hidden");
      // Remove the block display from the main table to prevent it from showing
      Dom.byId("historyTable").style.display = "none";
    } else {
      // On desktop, show the table and hide cards
      table.classList.remove("hidden");
      cardContainer.classList.add("hidden");
      // Restore table display
      Dom.byId("historyTable").style.display = "";
    }
  };

  // We need to override the default CSS for tables on mobile
  if (window.innerWidth > 768) {
    Dom.byId("historyTable").style.display = "";
  }

  window.removeEventListener("resize", handleView); // Prevent multiple listeners
  window.addEventListener("resize", handleView);
  handleView(); // Initial check
}

/**************************************************************
 * Reset Form
 **************************************************************/
function resetOutflowForm() {
  Utils.clearInputs();

  clearOutflowResult();

  if (Outflow.waterLevel) {
    Outflow.waterLevel.focus();
  }
}

/**************************************************************
 * Clear Result
 **************************************************************/
function clearOutflowResult() {
  Dom.html("qValue", "--");

  // Hide and clear the collapsible section
  const toggleRow = Dom.byId("gate-details-toggle");
  const containerRow = document.querySelector(".gate-discharge-container-row");
  toggleRow?.classList.add("hidden");
  toggleRow?.classList.remove("active");
  containerRow?.classList.add("hidden");

  Dom.html("powerhouseValue", "--");

  Dom.html("ukailaValue", "--");

  Dom.html("totalOutflow", "--");
}

function toggleOutflowGateDetails() {
  const toggleRow = Dom.byId("gate-details-toggle");
  const detailsContainerRow = document.querySelector(".gate-discharge-container-row");

  toggleRow?.classList.toggle("active");
  detailsContainerRow?.classList.toggle("hidden");
}

/**************************************************************
 * Refresh Dashboard
 **************************************************************/
async function refreshDashboard() {
  try {
    if (typeof loadDashboard === "function") {
      await loadDashboard();
    }
  } catch (error) {
    console.error(error);
  }
}

/**************************************************************
 * After Successful Calculation
 **************************************************************/
async function afterOutflowSaved(response) {
  updateOutflowResult(response);

  renderOutflowHistory(response.history);

  await refreshDashboard();
}

/**************************************************************
 * Copy Total Outflow
 **************************************************************/
function copyTotalOutflow() {
  const value = Dom.byId("totalOutflow").innerText;

  navigator.clipboard.writeText(value);

  Toast.show("Total Outflow copied.");
}
/**********************************************************************
 * Dam Flow Calculator
 * outflow.js
 * Part 3
 **********************************************************************/

/**************************************************************
 * Auto Format Numbers
 **************************************************************/
function autoFormatInputs() {
  [...document.querySelectorAll('.formGrid input[type="number"]')].forEach(
    (input) => {
      if (!input) return;

      input.addEventListener("blur", function () {
        if (this.value === "") return;
        const value = Number(this.value);

        if (isNaN(value)) return;

        switch (this.id) {
          case "waterLevel":
            this.value = value.toFixed(2);
            break;

          case "powerhouseHours": // Falls through
            this.value = value.toFixed(2);
            break;

          case "ukailaCanal":
            this.value = value.toFixed(3);
            break;
        }

        if (this.id.startsWith("gateOpening")) {
          this.value = value.toFixed(2);
        }
      });
    },
  );
}

/**************************************************************
 * Restrict Invalid Keys
 **************************************************************/
function restrictInput() {
  document.querySelectorAll("input[type='number']").forEach((input) => {
    input.addEventListener("wheel", function () {
      this.blur();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "e" || e.key === "E" || e.key === "+") {
        e.preventDefault();
      }
    });
  });
}

/**************************************************************
 * Keyboard Shortcut
 **************************************************************/
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key === "Enter") {
    calculateOutflow();
  }
});

/**************************************************************
 * Refresh History Button
 **************************************************************/
const refreshButton = Dom.byId("refreshHistoryBtn");

if (refreshButton) {
  refreshButton.addEventListener(
    "click",

    loadOutflowHistory,
  );
}

/**************************************************************
 * Print Result
 **************************************************************/
function printOutflow() {
  window.print();
}

/**************************************************************
 * Export Current Result
 **************************************************************/
function exportOutflowJSON() {
  const result = {
    date: new Date().toLocaleDateString(),

    time: new Date().toLocaleTimeString(),

    waterLevel: Dom.number("waterLevel"),

    powerhouseHours: Dom.number("powerhouseHours"),

    ukailaCanal: Dom.number("ukailaCanal"),

    q: Dom.byId("qValue").innerText,

    powerhouseOutflow: Dom.byId("powerhouseValue").innerText,

    totalOutflow: Dom.byId("totalOutflow").innerText,
  };

  // Add gate openings to the export
  for (let i = 1; i <= 10; i++) {
    result[`gateOpening${i}`] = Dom.number(`gateOpening${i}`);
  }

  const blob = new Blob(
    [JSON.stringify(result, null, 2)],

    {
      type: "application/json",
    },
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = "outflow.json";

  a.click();

  URL.revokeObjectURL(url);
}

/**************************************************************
 * Startup
 **************************************************************/
window.addEventListener("load", () => {
  autoFormatInputs();

  restrictInput();
});

/**************************************************************
 * Debug
 **************************************************************/
function debugOutflow() {
  console.table({
    waterLevel: Dom.number("waterLevel"),
    gateOpening1: Dom.number("gateOpening1"),
    gateOpening2: Dom.number("gateOpening2"),
    // ... and so on for all 10 gates if needed for debugging
    gateOpening10: Dom.number("gateOpening10"),
    powerhouseHours: Dom.number("powerhouseHours"),

    ukailaCanal: Dom.number("ukailaCanal"),
  });
}

console.log(
  "%cOutflow Module Loaded",

  "background:#2563eb;color:white;padding:6px 12px;border-radius:4px;",
);

/**********************************************************************
 * END OF FILE
 **********************************************************************/
