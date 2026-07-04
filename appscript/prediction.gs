/**********************************************************************
 * Prediction.gs
 * 8 Hour Prediction
 **********************************************************************/

function getPrediction() {
  try {
    const latestInflow = getLatestInflow();

    const latestOutflow = getLatestOutflow();

    if (!latestInflow || !latestOutflow) {
      return failure("No data available.");
    }

    const currentWaterLevel = Number(latestInflow.waterLevel);

    const currentCapacity = Number(latestInflow.liveCapacity);

    const inflow = Number(latestInflow.inflow);

    const outflow = Number(latestOutflow.totalOutflow);

    const netFlow = inflow - outflow;

    const prediction = [];

    for (let hour = 1; hour <= 8; hour++) {
      const addedMCM = (netFlow * hour * 60 * 60) / CONFIG.MCM_TO_CUBIC;

      const predictedCapacity = currentCapacity + addedMCM;

      const lookup = findNearestWaterLevel(predictedCapacity);

      prediction.push({
        hour,

        addedMCM: Number(addedMCM.toFixed(3)),

        predictedCapacity: Number(predictedCapacity.toFixed(3)),

        predictedWaterLevel: lookup.success
          ? lookup.waterLevel
          : currentWaterLevel,
      });
    }

    return success({
      currentWaterLevel,

      currentCapacity,

      inflow,

      outflow,

      netFlow,

      prediction,
    });
  } catch (err) {
    return failure(err);
  }
}
/**********************************************************************
 * Find Nearest Water Level from Live Capacity
 **********************************************************************/
function findNearestWaterLevel(liveCapacity) {
  liveCapacity = Number(liveCapacity);

  const sheet = sh(SHEETS.WATER_LEVEL);

  const lastRow = sheet.getLastRow();

  if (lastRow < 4) {
    return failure("Water Level sheet is empty.");
  }

  // B:E
  // B = Water Level
  // E = Live Capacity

  const data = sheet.getRange(4, 2, lastRow - 3, 4).getValues();

  let nearestLevel = null;
  let nearestCapacity = null;
  let minDifference = Number.MAX_VALUE;

  data.forEach((row) => {
    const waterLevel = Number(row[0]);

    const capacity = Number(row[3]);

    const difference = Math.abs(capacity - liveCapacity);

    if (difference < minDifference) {
      minDifference = difference;

      nearestLevel = waterLevel;

      nearestCapacity = capacity;
    }
  });

  return success({
    waterLevel: nearestLevel,

    liveCapacity: nearestCapacity,
  });
}
