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
      powerhouseFactor: CONFIG.POWERHOUSE_FACTOR, // Send the factor to the backend
    };
    for (let i = 1; i <= 10; i++) {
      outflowPayload[`gateOpening${i}`] = Dom.number(`gateOpening${i}`);
    }

    // Add the total gateOpening, which the backend requires for validation.
    outflowPayload.gateOpening = Object.values(outflowPayload)
      .slice(5) // Skips waterLevel, powerhouseHours, ukailaCanal, returnIndividual, and powerhouseFactor
      .reduce((sum, val) => sum + (val || 0), 0);

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
    updateInflowResult(inflowResponse);
    updateOutflowResult(outflowResponse);

    Toast.show("Calculation Complete");
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
function updateInflowResult(response) {
  Dom.html("capacityDifference", format(response.capacityDifference));
  Dom.html("capacityCumec", format(response.capacityCumec));
  Dom.html("previousOutflow", format(response.previousOutflow));
  Dom.html("finalInflow", format(response.inflow));
}

function updateOutflowResult(response) {
  // Since the backend might not return individual q values, calculate them proportionally
  let totalOpening = 0;
  for (let i = 1; i <= 10; i++) {
    totalOpening += Dom.number(`gateOpening${i}`);
  }

  const totalGateDischarge = response.q || 0;

  for (let i = 1; i <= 10; i++) {
    const gateOpening = Dom.number(`gateOpening${i}`);
    let individualDischarge = 0;
    if (totalOpening > 0 && gateOpening > 0) {
      individualDischarge = (totalGateDischarge / totalOpening) * gateOpening;
    }
    Dom.html(`q${i}Value`, format(individualDischarge));
  }

  Dom.html("qValue", format(response.q));
  Dom.html("powerhouseValue", format(response.powerhouseOutflow));
  Dom.html("ukailaValue", format(response.ukailaCanal));
  Dom.html("totalOutflow", format(response.totalOutflow));
}

/**************************************************************
 * Form Handling
 **************************************************************/
function validateForm() {
  const fields = [
    "previousWaterLevel",
    "currentWaterLevel",
    "timeDiffHours",
    "timeDiffMinutes",
    "powerhouseHours",
    "ukailaCanal",
  ];
  for (const field of fields) {
    // Use Validator.number which checks for required and numeric
    if (!Validator.number(field, field.replace(/([A-Z])/g, " $1").trim())) {
      return false;
    }
  }
  for (let i = 1; i <= 10; i++) {
    // Use Validator.number, which correctly handles '0' as a valid numeric input
    // but will fail on empty or non-numeric values.
    if (!Validator.number(`gateOpening${i}`, `Gate ${i} Opening`)) return false;
  }
  return true;
}

function resetForm() {
  // Reset all number inputs to 0
  document
    .querySelectorAll('.formGrid input[type="number"]')
    .forEach((input) => {
      input.value = "0";
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
  ];
  resultIds.forEach((id) => Dom.html(id, "--"));

  for (let i = 1; i <= 10; i++) {
    Dom.html(`q${i}Value`, "--");
  }

  Dom.byId("previousWaterLevel").focus();
  Toast.show("Form has been reset");
}
