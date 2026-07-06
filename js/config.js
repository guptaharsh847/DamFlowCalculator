/***********************************************************************
 *
 * Dam Flow Calculator
 * config.js
 *
 ***********************************************************************/

"use strict";

const CONFIG = {
  /******************************************************
   * CHANGE AFTER DEPLOYING APPS SCRIPT
   ******************************************************/
  API_URL:
  //prod
     "https://script.google.com/macros/s/AKfycbw5Bi9BqmsR6lbdFpSSaD78CFbHK-STz2dhFh-LzRG25Isp4GVf83Bju-BwH44Pu8o6BQ/exec",
  //uat
     // "https://script.google.com/macros/s/AKfycbyeF0N_guGzG4g4SniVPYLMqFVn3nToKeJYXVhsyyt0mDqD1LZ-LEolcDtT4u0Dr8lv/exec",

  /******************************************************
   * API ACTIONS
   ******************************************************/
  ACTIONS: {
    OUTFLOW: "calculateOutflow",

    INFLOW: "calculateInflow",

    DASHBOARD: "getDashboard",

    OUTFLOW_HISTORY: "getOutflowHistory",

    INFLOW_HISTORY: "getInflowHistory",

    WATER_LEVEL_FROM_CAPACITY: "getWaterLevelForCapacity",
  },

  /******************************************************
   * CONSTANTS
   ******************************************************/
  POWERHOUSE_FACTOR: 1.8808,

  MAX_OUTFLOW_HISTORY: 10,

  MAX_INFLOW_HISTORY: 20,

  DECIMAL: 3,
};

/***********************************************************************
 * Application State
 ***********************************************************************/

const APP = {
  dashboard: null,

  latestOutflow: null,

  latestInflow: null,

  outflowHistory: [],

  inflowHistory: [],
};

/***********************************************************************
 * DOM
 ***********************************************************************/

const Dom = {
  byId(id) {
    return document.getElementById(id);
  },

  value(id) {
    const element = this.byId(id);

    if (!element) {
      console.error("Element not found:", id);

      return "";
    }

    return element.value.trim();
  },

  number(id) {
    const element = this.byId(id);

    if (!element) {
      console.error("Element not found:", id);

      return 0;
    }

    return Number(element.value || 0);
  },

  html(id, value) {
    this.byId(id).innerHTML = value;
  },
};

/***********************************************************************
 * Loader
 ***********************************************************************/

const Loader = {
  show(text = "Loading...") {
    const loader = document.getElementById("loader");
    const loaderText = document.getElementById("loaderText");

    if (loader) {
      if (loaderText) loaderText.textContent = text;
      loader.classList.remove("hidden");
    }
  },

  hide() {
    const loader = document.getElementById("loader");

    if (loader) loader.classList.add("hidden");
  },
};

/***********************************************************************
 * Toast
 ***********************************************************************/

const Toast = {
  show(message, type = "success") {
    const old = document.querySelector(".toast");

    if (old) old.remove();

    const div = document.createElement("div");

    div.className = "toast " + type;

    div.innerHTML = message;

    document.body.appendChild(div);

    setTimeout(() => {
      div.remove();
    }, 3000);
  },
};

/***********************************************************************
 * Number Formatter
 ***********************************************************************/

function format(value, digit = 3) {
  if (value === null || value === undefined || value === "") return "--";

  return Number(value).toFixed(digit);
}
/***********************************************************************
 * Date & Time Formatter for API responses
 ***********************************************************************/
function formatDateTime(isoString) {
  if (!isoString || typeof isoString !== "string") {
    return { date: "--", time: "--" };
  }
  try {
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) {
      return { date: "Invalid Date", time: "" };
    }

    // Handle Google Sheets time-only artifact (e.g., 1899-12-30T...)
    if (dateObj.getFullYear() < 1970) {
      return {
        date: "N/A",
        time: dateObj.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata", // Convert to IST
        }),
      };
    }

    return {
      date: dateObj.toLocaleDateString("en-GB").replace(/\//g, "-"),
      time: dateObj.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kolkata",
      }),
    };
  } catch (e) {
    console.error("Error formatting date:", isoString, e);
    return { date: "--", time: "--" };
  }
}
/***********************************************************************
 * Date & Time
 ***********************************************************************/

const DateTime = {
  now() {
    return new Date();
  },

  date() {
    return new Date().toLocaleDateString("en-IN");
  },

  time() {
    return new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",

      minute: "2-digit",

      hour12: false,
    });
  },

  updateClock() {
    const clock = document.getElementById("currentDateTime");

    if (!clock) return;

    const update = () => {
      clock.innerHTML = this.date() + " | " + this.time();
    };

    update();

    setInterval(update, 1000);
  },
};

window.addEventListener("load", () => {
  DateTime.updateClock();
});

/***********************************************************************
 * Validation
 ***********************************************************************/

const Validator = {
  required(id, name) {
    const value = Dom.value(id);

    if (value === "") {
      Toast.show(
        name + " is required",

        "error",
      );

      Dom.byId(id).focus();

      return false;
    }

    return true;
  },

  number(id, name) {
    if (!this.required(id, name)) return false;

    const value = Dom.value(id);

    if (isNaN(value)) {
      Toast.show(
        name + " should be numeric",

        "error",
      );

      Dom.byId(id).focus();

      return false;
    }

    return true;
  },

  isNumeric(id, name) {
    const value = Dom.value(id);

    // It's okay if it's empty, but if it's not, it must be a number.
    if (value !== "" && isNaN(value)) {
      Toast.show(
        name + " should be numeric",

        "error",
      );

      Dom.byId(id).focus();

      return false;
    }
    return true;
  },
};

/***********************************************************************
 * Utilities
 ***********************************************************************/

const Utils = {
  clearInputs() {
    document.querySelectorAll("input").forEach((input) => {
      input.value = "";
    });
  },

  disable(id) {
    const btn = Dom.byId(id);

    if (btn) btn.disabled = true;
  },

  enable(id) {
    const btn = Dom.byId(id);

    if (btn) btn.disabled = false;
  },

  renderTable(tableId, rows, builder) {
    const tbody = Dom.byId(tableId);

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!rows || rows.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="20" class="text-center">
                        No Records Found
                    </td>
                </tr>
            `;

      return;
    }

    rows.forEach((row) => {
      tbody.innerHTML += builder(row);
    });
  },
};

/***********************************************************************
 * Global Keyboard Shortcuts
 ***********************************************************************/

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    Utils.clearInputs();
  }
});

/***********************************************************************
 * Prevent Negative Numbers
 ***********************************************************************/

document.addEventListener("input", (event) => {
  if (event.target.type !== "number") return;

  if (Number(event.target.value) < 0) event.target.value = "";
});

/***********************************************************************
 * Console Banner
 ***********************************************************************/

console.log(
  "%cDam Flow Calculator v1.0",

  "background:#2563eb;color:white;padding:8px 15px;border-radius:4px;font-size:13px;",
);
