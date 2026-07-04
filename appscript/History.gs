/**********************************************************************
 * Dam Flow Calculator
 * History.gs
 **********************************************************************/

/**********************************************************************
 * Save Outflow
 **********************************************************************/
function saveOutflow(record) {
  append(
    SHEETS.OUTFLOW_HISTORY,

    [
      record.date,

      record.time,

      record.waterLevel,

      record.gateOpening,

      record.q,

      record.powerhouseHours,

      record.powerhouseOutflow,

      record.ukailaCanal,

      record.totalOutflow,
    ],
  );

  trimHistory(
    SHEETS.OUTFLOW_HISTORY,

    CONFIG.MAX_OUTFLOW_HISTORY,
  );
}

/**********************************************************************
 * Save Inflow
 **********************************************************************/
function saveInflow(record) {
  append(
    SHEETS.INFLOW_HISTORY,

    [
      record.date,

      record.time,

      record.waterLevel,

      record.liveCapacity,

      record.capacityDifference,

      record.timeDifference,

      record.inflow,
    ],
  );

  trimHistory(
    SHEETS.INFLOW_HISTORY,

    CONFIG.MAX_INFLOW_HISTORY,
  );
}

/**********************************************************************
 * Outflow History
 **********************************************************************/
function getOutflowHistory() {
  const rows = read(SHEETS.OUTFLOW_HISTORY);

  return rows.map((row) => ({
    date: row[0],

    time: row[1],

    waterLevel: row[2],

    gateOpening: row[3],

    q: row[4],

    powerhouseHours: row[5],

    powerhouseOutflow: row[6],

    ukailaCanal: row[7],

    totalOutflow: row[8],
  }));
}

/**********************************************************************
 * Inflow History
 **********************************************************************/
function getInflowHistory() {
  const rows = read(SHEETS.INFLOW_HISTORY);

  return rows.map((row) => ({
    date: row[0],

    time: row[1],

    waterLevel: row[2],

    liveCapacity: row[3],

    capacityDifference: row[4],

    timeDifference: row[5],

    inflow: row[6],
  }));
}

/**********************************************************************
 * Latest Outflow
 **********************************************************************/
function getLatestOutflow() {
  const history = getOutflowHistory();

  if (history.length === 0) return null;

  return history[history.length - 1];
}

/**********************************************************************
 * Latest Inflow
 **********************************************************************/
function getLatestInflow() {
  const history = getInflowHistory();

  if (history.length === 0) return null;

  return history[history.length - 1];
}

/**********************************************************************
 * Last Outflow Value
 **********************************************************************/
function getLastOutflowValue() {
  const latest = getLatestOutflow();

  if (!latest) return 0;

  return number(latest.totalOutflow);
}

/**********************************************************************
 * Last Live Capacity
 **********************************************************************/
function getLastLiveCapacity() {
  const latest = getLatestInflow();

  if (!latest) return null;

  return number(latest.liveCapacity);
}

/**********************************************************************
 * Last Inflow DateTime
 **********************************************************************/
function getLastInflowDateTime() {
  const latest = getLatestInflow();

  if (!latest) return null;

  return new Date(latest.date + " " + latest.time);
}

/**********************************************************************
 * Dashboard Data
 **********************************************************************/
function getDashboardData() {
  return {
    latestOutflow: getLatestOutflow(),

    latestInflow: getLatestInflow(),

    outflowHistory: getOutflowHistory(),

    inflowHistory: getInflowHistory(),
  };
}

/**********************************************************************
 * Development Utilities
 **********************************************************************/
function clearHistory(sheetName) {
  const sheet = sh(sheetName);

  const rows = sheet.getLastRow();

  if (rows > 1) {
    sheet.deleteRows(
      2,

      rows - 1,
    );
  }
}

function clearAllHistory() {
  clearHistory(SHEETS.OUTFLOW_HISTORY);

  clearHistory(SHEETS.INFLOW_HISTORY);
}
