/**********************************************************************
 * Dam Flow Calculator
 * prediction.js
 **********************************************************************/

"use strict";

/**************************************************************
 * Initialize
 **************************************************************/
window.addEventListener("DOMContentLoaded", initPrediction);

function initPrediction() {
  runPrediction();
  Dom.byId("refreshPrediction")?.addEventListener("click", runPrediction);

  // Handle disclaimer close button
  const disclaimer = document.querySelector(".fixed-disclaimer");
  const closeBtn = document.querySelector(".close-disclaimer-btn");
  if (disclaimer && closeBtn) {
    closeBtn.addEventListener("click", () => {
      disclaimer.classList.add("hidden");
    });
  }
}

/**************************************************************
 * Run Prediction
 **************************************************************/
async function runPrediction() {
  Loader.show("Fetching Prediction...");

  try {
    const response = await API.prediction();

    renderPrediction(response);
  } catch (error) {
    console.error(error);

    Toast.show(error.message, "error");

    const tbody = Dom.byId("predictionTableBody");

    if (tbody) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="4">Unable to load prediction.</td>
                </tr>
            `;
    }
  } finally {
    Loader.hide();
  }
}

/**************************************************************
 * Render Prediction
 **************************************************************/
function renderPrediction(response) {
  if (!response) {
    Toast.show("No prediction data found.", "error");
    return;
  }

  // If success() wraps the response in data, use it.
  const data = response.data || response;

  // Summary Cards
  if (Dom.byId("currentWaterLevel"))
    Dom.html("currentWaterLevel", format(data.currentWaterLevel, 2));

  if (Dom.byId("currentCapacity"))
    Dom.html("currentCapacity", format(data.currentCapacity, 3));

  if (Dom.byId("netFlow")) Dom.html("netFlow", format(data.netFlow, 2));

  // Table
  const tableBody = Dom.byId("predictionTableBody");
  const cardContainer = Dom.byId("predictionCardContainer");

  if (!tableBody || !cardContainer) return;

  tableBody.innerHTML = "";
  cardContainer.innerHTML = "";

  if (!data.prediction || data.prediction.length === 0) {
    const noRecordsHtml = `
            <tr>
                <td colspan="4" style="text-align:center">
                    No prediction available
                </td>
            </tr>
        `;
    tableBody.innerHTML = noRecordsHtml;
    cardContainer.innerHTML = noRecordsHtml; // Or a more card-friendly message
    return;
  }

  data.prediction.forEach((item) => {
    // For Desktop Table
    tableBody.innerHTML += `
            <tr>

                <td>${item.hour} Hr</td>

                <td>${format(item.addedMCM, 3)}</td>

                <td>${format(item.predictedCapacity, 3)}</td>

                <td>${format(item.predictedWaterLevel, 2)}</td>

            </tr>
        `;

    // For Mobile Cards
    cardContainer.innerHTML += `
      <div class="prediction-card">
        <div class="prediction-card-hour">${item.hour} Hour Prediction</div>
        <div class="prediction-card-main">
          <div class="value">${format(item.predictedWaterLevel, 2)} m</div>
          <div class="label">Predicted Water Level</div>
        </div>
        <div class="prediction-card-details">
          <div class="detail-item">
            <div class="value">${format(item.predictedCapacity, 3)}</div>
            <div class="label">Capacity (MCM)</div>
          </div>
          <div class="detail-item">
            <div class="value">${format(item.addedMCM, 3)}</div>
            <div class="label">Added (MCM)</div>
          </div>
        </div>
      </div>
    `;
  });

  // Graph
  renderPredictionChart(data.prediction);

  // Toggle visibility based on screen size
  const handleView = () => {
    if (window.innerWidth <= 768) {
      Dom.byId("predictionTable").classList.add("hidden");
      Dom.byId("predictionCardContainer").classList.remove("hidden");
    } else {
      Dom.byId("predictionTable").classList.remove("hidden");
      Dom.byId("predictionCardContainer").classList.add("hidden");
    }
  };

  window.removeEventListener("resize", handleView); // Prevent multiple listeners
  window.addEventListener("resize", handleView);
  handleView(); // Initial check
}
/**************************************************************
 * Build Table Row
 **************************************************************/
function buildPredictionRow(prediction) {
  return `
    <tr>
      <td data-label="Time (Hours From Now)">${prediction.hour}</td>
      <td data-label="Predicted Capacity (MCM)">${format(
        prediction.capacity,
        3,
      )}</td>
    </tr>`;
}
let predictionChart = null;

function renderPredictionChart(predictions) {
  const canvas = document.getElementById("predictionChart");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (predictionChart) {
    predictionChart.destroy();
  }

  predictionChart = new Chart(ctx, {
    type: "bar",

    data: {
      labels: predictions.map((p) => p.hour + " Hr"),

      datasets: [
        {
          label: "Predicted Water Level (m)",

          data: predictions.map((p) => p.predictedWaterLevel),

          backgroundColor: "rgba(0, 90, 158, 0.6)",
          borderColor: "rgba(0, 90, 158, 1)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: true,
        },
      },

      scales: {
        y: {
          beginAtZero: false, // Prevents the Y-axis from starting at 0
          title: {
            display: true,

            text: "Water Level (m)",
          },
        },

        x: {
          title: {
            display: true,

            text: "Prediction Time",
          },
        },
      },
    },
  });
}
