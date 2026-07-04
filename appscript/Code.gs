/**********************************************************************
 * Dam Flow Calculator
 * Code.gs
 *
 * Entry Point
 **********************************************************************/

const SHEETS = {
  OUTFLOW_GATE: "Outflow_gate",

  WATER_LEVEL: "water_level",

  OUTFLOW_HISTORY: "Outflow_History",

  INFLOW_HISTORY: "Inflow_History",
};

const CONFIG = {
  POWERHOUSE_FACTOR: 1.8808,

  MAX_OUTFLOW_HISTORY: 10,

  MAX_INFLOW_HISTORY: 20,

  MCM_TO_CUBIC: 1000000,

  SECONDS_PER_HOUR: 3600,
};

/**********************************************************************
 * GET
 **********************************************************************/
function doGet(e) {
  try {
    const action = String(e.parameter.action || "");

    switch (action) {
      case "dashboard":
        return json(dashboard());

      case "outflowHistory":
        return json(getOutflowHistory());

      case "inflowHistory":
        return json(getInflowHistory());

      default:
        return json({
          success: false,

          message: "Invalid GET Action",
        });
    }
  } catch (error) {
    return json({
      success: false,

      message: error.toString(),
    });
  }
}

/**********************************************************************
 * POST
 **********************************************************************/
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);

    const action = request.action;

    switch (action) {
      case "calculateOutflow":
        return json(calculateOutflow(request));

      case "calculateInflow":
        return json(calculateInflow(request));

      default:
        return json({
          success: false,

          message: "Invalid POST Action",
        });
    }
  } catch (error) {
    return json({
      success: false,

      message: error.toString(),
    });
  }
}

/**********************************************************************
 * Dashboard
 **********************************************************************/
function dashboard() {
  return {
    success: true,

    latestOutflow: getLatestOutflow(),

    latestInflow: getLatestInflow(),

    outflowCount: getOutflowHistory().length,

    inflowCount: getInflowHistory().length,
  };
}

/**********************************************************************
 * JSON
 **********************************************************************/
function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))

    .setMimeType(ContentService.MimeType.JSON);
}
