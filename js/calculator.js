/**********************************************************************
 * Dam Flow Calculator
 * calculator.js
 * For the Manual Calculator page
 **********************************************************************/

"use strict";

/**************************************************************
 * Initialize
 **************************************************************/
window.addEventListener("DOMContentLoaded", initializeCalculator);

function initializeCalculator() {
  const calculateBtn = Dom.byId("calculateBtn");
  const resetBtn = Dom.byId("resetBtn");

  if (calculateBtn) {
    calculateBtn.addEventListener("click", runCalculations);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetForm);
  }

  populateTimeDropdowns();
  setupGateDetailsToggle();
}

function populateTimeDropdowns() {
  const hoursSelect = Dom.byId("timeDiffHours");
  const minutesSelect = Dom.byId("timeDiffMinutes");

  if (!hoursSelect || !minutesSelect) return;

  for (let i = 0; i <= 24; i++) {
    hoursSelect.innerHTML += `<option value="${i}">${i} hr</option>`;
  }

  for (let i = 0; i < 60; i += 5) {
    minutesSelect.innerHTML += `<option value="${i}">${i} min</option>`;
  }
}

function setupGateDetailsToggle() {
  Dom.byId("gate-details-toggle")?.addEventListener("click", toggleGateDetails);
}

/**************************************************************
 * Run Calculations
 **************************************************************/
async function runCalculations() {
  if (!validateForm()) return;

  try {
    Loader.show("Running Calculations...");
    Utils.disable("calculateBtn");

    // --- Get All Inputs ---
    const timeDiffHours = Dom.number("timeDiffHours");
    const timeDiffMinutes = Dom.number("timeDiffMinutes");
    const totalTimeDiff = timeDiffHours + timeDiffMinutes / 60;

    const currentWaterLevel = Dom.number("currentWaterLevel");

    const outflowPayload = {
      waterLevel: currentWaterLevel,
      powerhouseHours: Dom.number("powerhouseHours"),
      ukailaCanal: Dom.number("ukailaCanal"),
      returnIndividual: true,
      // powerhouseFactor: CONFIG.POWERHOUSE_FACTOR, // Send the factor to the backend
    };
    for (let i = 1; i <= 10; i++) {
      outflowPayload[`gateOpening${i}`] = Dom.number(`gateOpening${i}`);
    }

    // --- Run calculations sequentially ---
    // 1. Calculate Outflow first
    const outflowResponse = await API.manualCalculateOutflow(outflowPayload);
    console.log("Outflow Response:", outflowResponse);
    console.log("Total Outflow:", outflowResponse.totalOutflow);
    // 2. Prepare Inflow payload using the result from the outflow calculation
    const inflowPayload = {
      waterLevel: currentWaterLevel,
      previousWaterLevel: Dom.number("previousWaterLevel"),
      timeDifference: totalTimeDiff,
      previousOutflow: outflowResponse.totalOutflow, // Use calculated outflow from step 1
    };

    // 3. Calculate Inflow
    const inflowResponse = await API.manualCalculateInflow(inflowPayload);

    // --- Update UI ---
    updateManualInflowResult(inflowResponse);
    updateManualOutflowResult(outflowResponse);

    // Calculate and display Net Flow
    const netFlow =
      (inflowResponse.inflow || 0) - (outflowResponse.totalOutflow || 0);
    Dom.html("netFlowResult", format(netFlow));

    Toast.show(
      `Inflow: ${format(inflowResponse.inflow)} | Outflow: ${format(outflowResponse.totalOutflow)}`,
    );
  } catch (error) {
    console.error("Calculation failed:", error);
    // Toast message is already shown by the API handler
  } finally {
    Loader.hide();
    Utils.enable("calculateBtn");
  }
}

/**************************************************************
 * Update UI with Results
 **************************************************************/
function updateManualInflowResult(response) {
  Dom.html("capacityDifference", format(response.capacityDifference));
  Dom.html("capacityCumec", format(response.capacityCumec));
  Dom.html("previousOutflow", format(response.previousOutflow));
  Dom.html("finalInflow", format(response.inflow));
}

function updateManualOutflowResult(outflowResponse) {
  if (outflowResponse.gateDetails) {
    outflowResponse.gateDetails.forEach((gate) => {
      const gateValueCell = Dom.byId(`q${gate.gate}Value`);
      if (gateValueCell) {
        // Display both opening and discharge (q)
        gateValueCell.innerHTML = `
          ${format(gate.q)} <span class="text-sm text-gray-500">(${gate.opening}m)</span>
        `;
      }
    });
  }
  // Show/hide the collapsible toggle
  const toggleRow = Dom.byId("gate-details-toggle");
  if (outflowResponse.q > 0) {
    toggleRow.classList.remove("hidden");
  } else {
    toggleRow.classList.add("hidden");
  }
  Dom.html("qValue", format(outflowResponse.q));
  Dom.html("powerhouseValue", format(outflowResponse.powerhouseOutflow));
  Dom.html("ukailaValue", format(outflowResponse.ukailaCanal));
  Dom.html("totalOutflow", format(outflowResponse.totalOutflow));
}

/**************************************************************
 * Form Handling
 **************************************************************/
function validateForm() {
  if (!Validator.positiveNumber("previousWaterLevel", "Previous Water Level"))
    return false;
  if (!Validator.positiveNumber("currentWaterLevel", "Current Water Level"))
    return false;

  const timeDiffHours = Dom.number("timeDiffHours");
  const timeDiffMinutes = Dom.number("timeDiffMinutes");
  if (timeDiffHours === 0 && timeDiffMinutes === 0) {
    Toast.show("Time Difference cannot be zero", "error");
    Dom.byId("timeDiffHours").focus();
    return false;
  }

  if (!Validator.number("powerhouseHours", "Powerhouse Hours")) return false;
  if (!Validator.number("ukailaCanal", "Ukaila Canal")) return false;

  for (let i = 1; i <= 10; i++) {
    // Use Validator.number, which correctly handles '0' as a valid numeric input
    // but will fail on empty or non-numeric values.
    // Gate inputs have a default of 0, so Validator.number is fine.
    if (!Validator.number(`gateOpening${i}`, `Gate ${i} Opening`)) return false;
  }
  return true;
}

function resetForm() {
  // Reset all number inputs to 0
  document
    .querySelectorAll('.formGrid input[type="number"], .formGrid select')
    .forEach((input) => {
      if (input.id.startsWith("gateOpening")) {
        input.value = "0";
      } else if (input.tagName === "SELECT") {
        input.value = "0";
      } else {
        input.value = "";
      }
    });

  // Clear result tables
  const resultIds = [
    "capacityDifference",
    "capacityCumec",
    "previousOutflow",
    "finalInflow",
    "qValue",
    "powerhouseValue",
    "ukailaValue",
    "totalOutflow",
    "netFlowResult",
  ];
  resultIds.forEach((id) => Dom.html(id, "--"));

  for (let i = 1; i <= 10; i++) {
    Dom.html(`q${i}Value`, "--");
  }
  // Hide gate details on reset
  Dom.byId("gate-details-toggle").classList.add("hidden");
  document
    .querySelectorAll(".gate-discharge-row")
    .forEach((row) => row.classList.add("hidden"));

  Dom.byId("previousWaterLevel").focus();
  Toast.show("Form has been reset");
}

function toggleGateDetails() {
  const toggleRow = Dom.byId("gate-details-toggle");
  const detailsContainer = document.querySelector(
    ".gate-details-container",
  ).parentElement;

  toggleRow.classList.toggle("active");
  detailsContainer.classList.toggle("hidden");
}
