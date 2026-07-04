/**********************************************************************
 * Dam Flow Calculator
 * Utils.gs
 **********************************************************************/

/**********************************************************************
 * Spreadsheet
 **********************************************************************/
function ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**********************************************************************
 * Sheet
 **********************************************************************/
function sh(sheetName) {
  return ss().getSheetByName(sheetName);
}

/**********************************************************************
 * Today
 **********************************************************************/
function today() {
  return Utilities.formatDate(
    new Date(),

    Session.getScriptTimeZone(),

    "dd/MM/yyyy",
  );
}

/**********************************************************************
 * Time
 **********************************************************************/
function currentTime() {
  return Utilities.formatDate(
    new Date(),

    Session.getScriptTimeZone(),

    "HH:mm",
  );
}

/**********************************************************************
 * Timestamp
 **********************************************************************/
function timestamp() {
  return new Date();
}

/**********************************************************************
 * Safe Number
 **********************************************************************/
function number(value) {
  if (value === null || value === undefined || value === "") return 0;

  return Number(value);
}

/**********************************************************************
 * Blank
 **********************************************************************/
function blank(value) {
  return value === "" || value === null || value === undefined;
}

/**********************************************************************
 * Success Response
 **********************************************************************/
function success(data) {
  return Object.assign(
    {
      success: true,
    },
    data,
  );
}

/**********************************************************************
 * Error Response
 **********************************************************************/
function failure(message) {
  return {
    success: false,

    message: message,
  };
}

/**********************************************************************
 * Last Row Data
 **********************************************************************/
function lastRow(sheet) {
  const row = sheet.getLastRow();

  if (row <= 1) return null;

  return sheet

    .getRange(
      row,

      1,

      1,

      sheet.getLastColumn(),
    )

    .getValues()[0];
}

/**********************************************************************
 * Delete Old Records
 **********************************************************************/
function trimHistory(sheetName, maxRows) {
  const sheet = sh(sheetName);

  const totalRows = sheet.getLastRow() - 1;

  if (totalRows <= maxRows) return;

  const removeRows = totalRows - maxRows;

  sheet.deleteRows(
    2,

    removeRows,
  );
}

/**********************************************************************
 * Append Row
 **********************************************************************/
function append(sheetName, row) {
  sh(sheetName).appendRow(row);
}

/**********************************************************************
 * Read All
 **********************************************************************/
function read(sheetName) {
  const sheet = sh(sheetName);

  if (sheet.getLastRow() <= 1) return [];

  return sheet

    .getRange(
      2,

      1,

      sheet.getLastRow() - 1,

      sheet.getLastColumn(),
    )

    .getValues();
}

/**********************************************************************
 * Logger
 **********************************************************************/
function log(data) {
  Logger.log(
    JSON.stringify(
      data,

      null,

      2,
    ),
  );
}

/**********************************************************************
 * Validation
 **********************************************************************/
function requireNumber(value, field) {
  if (blank(value)) throw new Error(field + " is required.");

  if (isNaN(value)) throw new Error(field + " should be numeric.");
}

/**********************************************************************
 * Current Unix Timestamp
 * (Future Refinement Ready)
 **********************************************************************/
function unix() {
  return Date.now();
}

/**********************************************************************
 * Version
 **********************************************************************/
function version() {
  return {
    application: "Dam Flow Calculator",

    version: "1.0",

    date: today(),
  };
}
