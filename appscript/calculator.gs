/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this script to the Spreadsheet this script is container-bound to.
 * This is a good security practice.
 */

/****************************************************************
 * MANUAL CALCULATOR - OUTFLOW
 * Calculates outflow without saving to the sheet.
 ****************************************************************/
function manualCalculateOutflow(e) {
  const waterLevel = Number(e.parameter.waterLevel);
  const powerhouseHours = Number(e.parameter.powerhouseHours);
  const ukailaCanal = Number(e.parameter.ukailaCanal);
  const returnIndividual = e.parameter.returnIndividual === "true";

  const result = {
    q: 0,
    powerhouseOutflow: 0,
    ukailaCanal: ukailaCanal,
    totalOutflow: 0,
  };

  // 1. Calculate Powerhouse Outflow
  result.powerhouseOutflow = powerhouseHours * POWERHOUSE_FACTOR;

  // 2. Calculate Gate Discharge (q)
  let totalGateDischarge = 0;
  for (let i = 1; i <= 10; i++) {
    const gateOpening = Number(e.parameter["gateOpening" + i] || 0);
    if (gateOpening > 0) {
      const head = waterLevel - SILL_LEVEL;
      const q_individual =
        COEFFICIENT_OF_DISCHARGE *
        GATE_WIDTH *
        gateOpening *
        Math.sqrt(2 * GRAVITY * head);
      totalGateDischarge += q_individual;

      if (returnIndividual) {
        result["q" + i] = q_individual;
      }
    } else if (returnIndividual) {
      result["q" + i] = 0;
    }
  }
  result.q = totalGateDischarge;

  // 3. Calculate Total Outflow
  result.totalOutflow =
    result.q + result.powerhouseOutflow + result.ukailaCanal;

  return success(result);
}

/****************************************************************
 * MANUAL CALCULATOR - INFLOW
 * Calculates inflow using provided outflow, without saving.
 ****************************************************************/
function manualCalculateInflow(e) {
  const currentWaterLevel = Number(e.parameter.waterLevel);
  const previousWaterLevel = Number(e.parameter.previousWaterLevel);
  const timeDifference = Number(e.parameter.timeDifference);
  const previousOutflow = Number(e.parameter.previousOutflow); // From calculator page

  // Get capacities for water levels
  const currentCapacity = getCapacityForWaterLevel(currentWaterLevel);
  const previousCapacity = getCapacityForWaterLevel(previousWaterLevel);

  // Calculate capacity difference and rate
  const capacityDifference = currentCapacity - previousCapacity;
  const capacityCumec =
    (capacityDifference * 1000000) / (timeDifference * 3600);

  // Calculate final inflow
  const inflow = capacityCumec + previousOutflow;

  const result = {
    waterLevel: currentWaterLevel,
    previousWaterLevel: previousWaterLevel,
    timeDifference: timeDifference,
    currentCapacity: currentCapacity,
    previousCapacity: previousCapacity,
    capacityDifference: capacityDifference,
    capacityCumec: capacityCumec,
    previousOutflow: previousOutflow,
    inflow: inflow,
  };

  return success(result);
}
