/**********************************************************************
 * Dam Flow Calculator
 * Google Apps Script Backend
 * Author : ChatGPT
 * Version : 1.0
 **********************************************************************/

/************************************************************
 * SHEET NAMES
 ************************************************************/
const SHEETS = {
  OUTFLOW_GATE: "Outflow_gate",

  WATER_LEVEL: "water_level",

  OUTFLOW_HISTORY: "Outflow_History",

  INFLOW_HISTORY: "Inflow_History",
};

/************************************************************
 * CONSTANTS
 ************************************************************/
const CONSTANTS = {
  POWERHOUSE_FACTOR: 1.8808,

  MCM_TO_CUBIC: 1000000,

  SECONDS_PER_HOUR: 3600,

  MAX_OUTFLOW_HISTORY: 10,

  MAX_INFLOW_HISTORY: 20,
};

/************************************************************
 * doGet()
 ************************************************************/
function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case "getQ":
        return jsonResponse(
          getQ(
            Number(e.parameter.waterLevel),

            Number(e.parameter.gateOpening),
          ),
        );

      case "getLiveCapacity":
        return jsonResponse(getLiveCapacity(Number(e.parameter.waterLevel)));

      case "getOutflowHistory":
        return jsonResponse(getOutflowHistory());

      case "getInflowHistory":
        return jsonResponse(getInflowHistory());

      case "getDashboard":
        return jsonResponse(getDashboard());

      default:
        return jsonResponse({
          success: false,

          message: "Invalid Action",
        });
    }
  } catch (error) {
    return jsonResponse({
      success: false,

      message: error.toString(),
    });
  }
}

/************************************************************
 * doPost()
 ************************************************************/
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);

    switch (request.action) {
      case "calculateOutflow":
        return jsonResponse(calculateOutflow(request));

      case "calculateInflow":
        return jsonResponse(calculateInflow(request));

      default:
        return jsonResponse({
          success: false,

          message: "Unknown Action",
        });
    }
  } catch (error) {
    return jsonResponse({
      success: false,

      message: error.toString(),
    });
  }
}

/************************************************************
 * JSON RESPONSE
 ************************************************************/
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))

    .setMimeType(ContentService.MimeType.JSON);
}

/************************************************************
 * Spreadsheet
 ************************************************************/
function spreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/************************************************************
 * Sheet
 ************************************************************/
function sheet(name) {
  return spreadsheet().getSheetByName(name);
}

/************************************************************
 * Current Date
 ************************************************************/
function today() {
  return Utilities.formatDate(
    new Date(),

    Session.getScriptTimeZone(),

    "dd/MM/yyyy",
  );
}

/************************************************************
 * Current Time
 ************************************************************/
function currentTime() {
  return Utilities.formatDate(
    new Date(),

    Session.getScriptTimeZone(),

    "HH:mm",
  );
}

/************************************************************
 * Current DateTime
 ************************************************************/
function currentDateTime() {
  return new Date();
}
/**********************************************************************
 * LOOKUP FUNCTIONS
 **********************************************************************/

/************************************************************
 * getQ()
 *
 * Sheet :
 * Outflow_gate
 *
 * Search :
 * Column A -> Water Level
 * Column B -> Gate Opening
 *
 * Return :
 * Column J -> Q
 ************************************************************/
function getQ(waterLevel, gateOpening) {
  const sh = sheet(SHEETS.OUTFLOW_GATE);

  const lastRow = sh.getLastRow();

  if (lastRow < 2) {
    return {
      success: false,

      message: "Outflow Gate Sheet Empty",
    };
  }

  const values = sh.getRange(2, 1, lastRow - 1, 10).getValues();

  for (let i = 0; i < values.length; i++) {
    const wl = Number(values[i][0]);

    const go = Number(values[i][1]);

    if (wl === Number(waterLevel) && go === Number(gateOpening)) {
      return {
        success: true,

        q: Number(values[i][9]),
      };
    }
  }

  return {
    success: false,

    message: "Q Not Found",
  };
}

/************************************************************
 * getLiveCapacity()
 *
 * water_level
 *
 * Column B = Water Level
 *
 * Column E = Live Capacity
 ************************************************************/
function getLiveCapacity(waterLevel) {
  const sh = sheet(SHEETS.WATER_LEVEL);

  const lastRow = sh.getLastRow();

  const values = sh.getRange(4, 2, lastRow - 3, 4).getValues();

  for (let i = 0; i < values.length; i++) {
    const wl = Number(values[i][0]);

    if (wl === Number(waterLevel)) {
      return {
        success: true,

        waterLevel: wl,

        liveCapacity: Number(values[i][3]),
      };
    }
  }

  return {
    success: false,

    message: "Water Level Not Found",
  };
}

/**********************************************************************
 * OUTFLOW HISTORY
 **********************************************************************/
function getOutflowHistory() {
  const sh = sheet(SHEETS.OUTFLOW_HISTORY);

  const lastRow = sh.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  return sh
    .getRange(
      2,

      1,

      lastRow - 1,

      9,
    )
    .getValues()
    .map((row) => ({
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
 * INFLOW HISTORY
 **********************************************************************/
function getInflowHistory() {
  const sh = sheet(SHEETS.INFLOW_HISTORY);

  const lastRow = sh.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  return sh
    .getRange(
      2,

      1,

      lastRow - 1,

      7,
    )
    .getValues()
    .map((row) => ({
      date: row[0],

      time: row[1],

      waterLevel: row[2],

      liveCapacity: row[3],

      capacityDifference: row[4],

      hourDifference: row[5],

      inflow: row[6],
    }));
}

/**********************************************************************
 * DASHBOARD
 **********************************************************************/
function getDashboard() {
  const outflow = getOutflowHistory();

  const inflow = getInflowHistory();

  return {
    success: true,

    latestOutflow: outflow.length ? outflow[outflow.length - 1] : null,

    latestInflow: inflow.length ? inflow[inflow.length - 1] : null,
  };
}

/**********************************************************************
 * CALCULATE OUTFLOW
 **********************************************************************/
function calculateOutflow(request) {
  try {
    const waterLevel = Number(request.waterLevel);
    const gateOpening = Number(request.gateOpening);
    const powerhouseHours = Number(request.powerhouseHours);
    const ukailaCanal = Number(request.ukailaCanal);

    if (isNaN(waterLevel)) throw new Error("Invalid Water Level");

    if (isNaN(gateOpening)) throw new Error("Invalid Gate Opening");

    if (isNaN(powerhouseHours)) throw new Error("Invalid Powerhouse Hours");

    if (isNaN(ukailaCanal)) throw new Error("Invalid Ukaila Canal");

    /**************************************************
     * Get Q
     **************************************************/
    const qResult = getQ(waterLevel, gateOpening);

    if (!qResult.success) return qResult;

    const q = Number(qResult.q);

    /**************************************************
     * Powerhouse
     **************************************************/
    const powerhouseOutflow = powerhouseHours * CONSTANTS.POWERHOUSE_FACTOR;

    /**************************************************
     * Total Outflow
     **************************************************/
    const totalOutflow = q + powerhouseOutflow + ukailaCanal;

    /**************************************************
     * Save History
     **************************************************/
    saveOutflowHistory({
      date: today(),

      time: currentTime(),

      waterLevel: waterLevel,

      gateOpening: gateOpening,

      q: q,

      powerhouseHours: powerhouseHours,

      powerhouseOutflow: powerhouseOutflow,

      ukailaCanal: ukailaCanal,

      totalOutflow: totalOutflow,
    });

    return {
      success: true,

      date: today(),

      time: currentTime(),

      q: q,

      powerhouseOutflow: powerhouseOutflow,

      totalOutflow: totalOutflow,

      history: getOutflowHistory(),
    };
  } catch (error) {
    return {
      success: false,

      message: error.toString(),
    };
  }
}

/**********************************************************************
 * SAVE OUTFLOW HISTORY
 **********************************************************************/
function saveOutflowHistory(data) {
  const sh = sheet(SHEETS.OUTFLOW_HISTORY);

  sh.appendRow([
    data.date,

    data.time,

    data.waterLevel,

    data.gateOpening,

    data.q,

    data.powerhouseHours,

    data.powerhouseOutflow,

    data.ukailaCanal,

    data.totalOutflow,
  ]);

  trimOutflowHistory();
}

/**********************************************************************
 * KEEP LAST 10 RECORDS
 **********************************************************************/
function trimOutflowHistory() {
  const sh = sheet(SHEETS.OUTFLOW_HISTORY);

  const lastRow = sh.getLastRow();

  const dataRows = lastRow - 1;

  if (dataRows <= CONSTANTS.MAX_OUTFLOW_HISTORY) return;

  const extraRows = dataRows - CONSTANTS.MAX_OUTFLOW_HISTORY;

  sh.deleteRows(
    2,

    extraRows,
  );
}

/**********************************************************************
 * CALCULATE INFLOW
 **********************************************************************/
function calculateInflow(request) {
  try {
    const waterLevel = Number(request.waterLevel);

    if (isNaN(waterLevel)) {
      throw new Error("Invalid Water Level");
    }

    /************************************************
     * Lookup Live Capacity
     ************************************************/
    const liveResult = getLiveCapacity(waterLevel);

    if (!liveResult.success) {
      return liveResult;
    }

    const currentCapacity = Number(liveResult.liveCapacity);

    const inflowSheet = sheet(SHEETS.INFLOW_HISTORY);

    const lastRow = inflowSheet.getLastRow();

    /************************************************
     * FIRST ENTRY
     ************************************************/
    if (lastRow <= 1) {
      inflowSheet.appendRow([
        today(),

        currentTime(),

        waterLevel,

        currentCapacity,

        0,

        0,

        0,
      ]);

      return {
        success: true,

        firstRecord: true,

        message: "Initial inflow record created successfully.",

        inflow: 0,

        liveCapacity: currentCapacity,
      };
    }

    /************************************************
     * Previous Record
     ************************************************/
    const previous = inflowSheet

      .getRange(lastRow, 1, 1, 7)

      .getValues()[0];

    const previousDate = previous[0];

    const previousTime = previous[1];

    const previousCapacity = Number(previous[3]);

    /************************************************
     * Capacity Difference
     ************************************************/
    const capacityDifference = currentCapacity - previousCapacity;

    /************************************************
     * Time Difference
     ************************************************/
    const previousDateTime = new Date(previousDate + " " + previousTime);

    const currentDT = new Date();

    const hourDifference =
      (currentDT.getTime() - previousDateTime.getTime()) / (1000 * 60 * 60);

    if (hourDifference <= 0) {
      throw new Error("Invalid Time Difference");
    }

    /************************************************
     * Capacity Change Cumec
     ************************************************/
    const capacityCumec =
      (capacityDifference * CONSTANTS.MCM_TO_CUBIC) /
      (hourDifference * CONSTANTS.SECONDS_PER_HOUR);

    /************************************************
     * Previous Outflow
     ************************************************/
    const outflowHistory = getOutflowHistory();

    let previousOutflow = 0;

    if (outflowHistory.length > 0) {
      previousOutflow = Number(
        outflowHistory[outflowHistory.length - 1].totalOutflow,
      );
    }

    /************************************************
     * Final Inflow
     ************************************************/
    const inflow = capacityCumec + previousOutflow;

    /************************************************
     * Save
     ************************************************/
    inflowSheet.appendRow([
      today(),

      currentTime(),

      waterLevel,

      currentCapacity,

      capacityDifference,

      hourDifference,

      inflow,
    ]);

    trimInflowHistory();

    return {
      success: true,

      waterLevel: waterLevel,

      liveCapacity: currentCapacity,

      previousCapacity: previousCapacity,

      capacityDifference: capacityDifference,

      hourDifference: hourDifference,

      capacityCumec: capacityCumec,

      previousOutflow: previousOutflow,

      inflow: inflow,

      history: getInflowHistory(),
    };
  } catch (error) {
    return {
      success: false,

      message: error.toString(),
    };
  }
}

/**********************************************************************
 * KEEP LAST 20 INFLOW RECORDS
 **********************************************************************/
function trimInflowHistory() {
  const sh = sheet(SHEETS.INFLOW_HISTORY);

  const rows = sh.getLastRow() - 1;

  if (rows <= CONSTANTS.MAX_INFLOW_HISTORY) {
    return;
  }

  const extra = rows - CONSTANTS.MAX_INFLOW_HISTORY;

  sh.deleteRows(
    2,

    extra,
  );
}
/**********************************************************************
 * COMMON VALIDATION
 **********************************************************************/
function isBlank(value) {
  return value === "" || value === null || value === undefined;
}

/**********************************************************************
 * SAFE NUMBER
 **********************************************************************/
function safeNumber(value) {
  if (isBlank(value)) return 0;

  return Number(value);
}

/**********************************************************************
 * GET LAST OUTFLOW
 **********************************************************************/
function getLastOutflow() {
  const history = getOutflowHistory();

  if (history.length === 0) {
    return 0;
  }

  return Number(history[history.length - 1].totalOutflow);
}

/**********************************************************************
 * GET LAST INFLOW
 **********************************************************************/
function getLastInflow() {
  const history = getInflowHistory();

  if (history.length === 0) return null;

  return history[history.length - 1];
}

/**********************************************************************
 * DASHBOARD SUMMARY
 **********************************************************************/
function dashboardSummary() {
  return {
    latestOutflow: getLastOutflow(),

    latestInflow: getLastInflow(),

    outflowHistory: getOutflowHistory(),

    inflowHistory: getInflowHistory(),
  };
}

/**********************************************************************
 * CLEAR OUTFLOW HISTORY
 * (Development Only)
 **********************************************************************/
function clearOutflowHistory() {
  const sh = sheet(SHEETS.OUTFLOW_HISTORY);

  const lastRow = sh.getLastRow();

  if (lastRow > 1) {
    sh.deleteRows(
      2,

      lastRow - 1,
    );
  }
}

/**********************************************************************
 * CLEAR INFLOW HISTORY
 * (Development Only)
 **********************************************************************/
function clearInflowHistory() {
  const sh = sheet(SHEETS.INFLOW_HISTORY);

  const lastRow = sh.getLastRow();

  if (lastRow > 1) {
    sh.deleteRows(
      2,

      lastRow - 1,
    );
  }
}

/**********************************************************************
 * RESET COMPLETE DATABASE
 **********************************************************************/
function resetApplication() {
  clearOutflowHistory();

  clearInflowHistory();
}

/**********************************************************************
 * TEST FUNCTIONS
 **********************************************************************/
function testQ() {
  Logger.log(
    getQ(
      334.5,

      0.25,
    ),
  );
}

function testCapacity() {
  Logger.log(getLiveCapacity(320.05));
}

function testDashboard() {
  Logger.log(dashboardSummary());
}

/**********************************************************************
 * VERSION
 **********************************************************************/
function version() {
  return {
    name: "Dam Flow Calculator",

    version: "1.0.0",

    author: "ChatGPT",

    date: today(),
  };
}
