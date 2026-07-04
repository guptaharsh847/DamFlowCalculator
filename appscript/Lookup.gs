/**********************************************************************
 * Dam Flow Calculator
 * Lookup.gs
 *
 * Handles all lookup operations
 **********************************************************************/

/**********************************************************************
 * getQ()
 *
 * Sheet : Outflow_gate
 *
 * Search:
 * Column A = Water Level
 * Column B = Gate Opening
 *
 * Return:
 * Column J = Q
 **********************************************************************/
function getQ(waterLevel, gateOpening) {

  waterLevel = Number(waterLevel);
  gateOpening = Number(gateOpening);

  const sheet = sh(SHEETS.OUTFLOW_GATE);

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {

    return failure("Outflow Gate sheet is empty.");

  }

  const data = sheet
    .getRange(2, 1, lastRow - 1, 10)
    .getValues();

  for (let i = 0; i < data.length; i++) {

    const rowWaterLevel = Number(data[i][0]);
    const rowGateOpening = Number(data[i][1]);

    if (

      rowWaterLevel === waterLevel &&

      rowGateOpening === gateOpening

    ) {

      return success({

        q: Number(data[i][9])

      });

    }

  }

  return failure(

    "Matching Water Level / Gate Opening not found."

  );

}

/**********************************************************************
 * getLiveCapacity()
 *
 * Sheet : water_level
 *
 * Search:
 * Column B = Water Level
 *
 * Return:
 * Column E = Live Capacity
 **********************************************************************/
function getLiveCapacity(waterLevel) {

  waterLevel = Number(waterLevel);

  const sheet = sh(SHEETS.WATER_LEVEL);

  const lastRow = sheet.getLastRow();

  if (lastRow < 4) {

    return failure("Water Level sheet is empty.");

  }

  /*
      B:E

      B -> Water Level

      E -> Live Capacity
  */

  const data = sheet
    .getRange(4, 2, lastRow - 3, 4)
    .getValues();

  for (let i = 0; i < data.length; i++) {

    const rowWaterLevel = Number(data[i][0]);

    if (rowWaterLevel === waterLevel) {

      return success({

        waterLevel: rowWaterLevel,

        liveCapacity: Number(data[i][3])

      });

    }

  }

  return failure(

    "Water Level not found."

  );

}

/**********************************************************************
 * Check Water Level Exists
 **********************************************************************/
function waterLevelExists(waterLevel) {

  const result = getLiveCapacity(waterLevel);

  return result.success;

}

/**********************************************************************
 * Check Gate Combination Exists
 **********************************************************************/
function gateCombinationExists(

  waterLevel,

  gateOpening

) {

  const result = getQ(

    waterLevel,

    gateOpening

  );

  return result.success;

}

/**********************************************************************
 * Lookup Test
 **********************************************************************/
function testLookup() {

  const q = getQ(

    334.50,

    0.25

  );

  log(q);

  const live = getLiveCapacity(

    320.05

  );

  log(live);

}