/*********************************************************************
 * Dam Flow Calculator
 * api.js
 * Frontend API Service
 *********************************************************************/

"use strict";

const API = (() => {
  async function request(method, payload = null, action = "") {
    try {
      Loader.show();

      let url = CONFIG.API_URL;

      let options = {
        method: method,
      };
      url += "?action=" + encodeURIComponent(action);

      if (payload) {
        Object.keys(payload).forEach((key) => {
          if (payload[key] !== undefined && payload[key] !== null) {
            url +=
              "&" +
              encodeURIComponent(key) +
              "=" +
              encodeURIComponent(payload[key]);
          }
        });
      }

      options = {
        method: "GET",
      };
      //   if (method === "GET") {
      //     url += "?action=" + encodeURIComponent(action);
      //   } else {
      //     options.headers = {
      //       "Content-Type": "application/json",
      //     };

      //     options.body = JSON.stringify(payload);
      //   }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error("Unable to connect to server.");
      }

      const json = await response.json();

      Loader.hide();

      if (!json.success) {
        throw new Error(json.message || "Unknown Error");
      }

      return json;
    } catch (error) {
      Loader.hide();

      Toast.show(error.message, "error");

      console.error(error);

      throw error;
    }
  }

  /*****************************************************
   * Outflow
   *****************************************************/
  async function calculateOutflow(data) {
    data.action = "calculateOutflow";

    return await request("GET", data, "calculateOutflow");
  }

  /*****************************************************
   * Inflow
   *****************************************************/
  async function calculateInflow(data) {
    const response = await request("GET", data, "calculateInflow");

    return response;
  }

  /*****************************************************
   * Dashboard
   *****************************************************/
  async function dashboard() {
    return await request(
      "GET",

      null,

      "dashboard",
    );
  }

  /*****************************************************
   * Outflow History
   *****************************************************/
  async function outflowHistory() {
    const response = await request("GET", null, "outflowHistory");
    return response.history;
  }

  /*****************************************************
   * Inflow History
   *****************************************************/
  async function inflowHistory() {
    const response = await request("GET", null, "inflowHistory");

    return response.history;
  }

  /*****************************************************
   * Water Level Prediction
   *****************************************************/
  async function prediction() {
    console.log("request raised");
    return await request("GET", null, "prediction");
  }

  /*****************************************************
   * Manual Calculator (No Save)
   *****************************************************/
  // async function manualCalculateOutflow(data) {
  //     const response = await request("GET", data, "manualCalculateOutflow");
  //     return response.data;
  // }
 async function manualCalculateOutflow(data) {
  const response = await request("GET", data, "manualCalculateOutflow");
  console.log("Response inside API:", response);
  return response;
}
async function manualCalculateInflow(data) {
  return await request("GET", data, "manualCalculateInflow");
}
  

  return {
    calculateOutflow,

    calculateInflow,

    dashboard,

    outflowHistory,

    inflowHistory,
    prediction,

    // Manual calculator functions
    manualCalculateOutflow,
    manualCalculateInflow,
  };
})();
/*********************************************************************
 * Dam Flow Calculator
 * api.js
 * PART 2
 *********************************************************************/

/**************************************************************
 * API Health Check
 **************************************************************/
API.healthCheck = async function () {
  try {
    const response = await API.dashboard();

    console.log("API Connected");

    return response.success;
  } catch (error) {
    console.error("API Connection Failed");

    return false;
  }
};

/**************************************************************
 * Load Dashboard
 **************************************************************/
API.loadDashboard = async function () {
  try {
    const response = await API.dashboard();

    APP.dashboard = response;

    return response;
  } catch (error) {
    console.error(error);

    throw error;
  }
};

/**************************************************************
 * Load Outflow History
 **************************************************************/
API.loadOutflowHistory = async function () {
  try {
    const response = await API.outflowHistory();

    APP.outflowHistory = response;

    return response;
  } catch (error) {
    console.error(error);

    throw error;
  }
};

/**************************************************************
 * Load Inflow History
 **************************************************************/
API.loadInflowHistory = async function () {
  try {
    const response = await API.inflowHistory();
    console.log("response", response);
    APP.inflowHistory = response;

    return response;
  } catch (error) {
    console.error(error);

    throw error;
  }
};

/**************************************************************
 * Request Timeout Wrapper
 **************************************************************/
API.withTimeout = async function (promise, timeout = 15000) {
  return Promise.race([
    promise,

    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Request Timeout")),

        timeout,
      ),
    ),
  ]);
};

/**************************************************************
 * Generic Safe Request
 **************************************************************/
API.safe = async function (callback) {
  try {
    return await callback();
  } catch (error) {
    Toast.show(
      error.message,

      "error",
    );

    return null;
  }
};

/**************************************************************
 * Refresh Dashboard
 **************************************************************/
API.refresh = async function () {
  try {
    const data = await API.dashboard();

    APP.dashboard = data;

    return data;
  } catch (error) {
    console.error(error);
  }
};

/**************************************************************
 * Application Startup
 **************************************************************/
window.addEventListener("load", async () => {
  try {
    const connected = await API.healthCheck();

    if (connected) {
      console.log(
        "%cApps Script Connected",

        "background:#16a34a;color:white;padding:6px 12px;border-radius:4px;",
      );
    } else {
      Toast.show(
        "Unable to connect to Apps Script.",

        "error",
      );
    }
  } catch (error) {
    console.error(error);
  }
});
/*********************************************************************
 * END OF api.js
 *********************************************************************/
