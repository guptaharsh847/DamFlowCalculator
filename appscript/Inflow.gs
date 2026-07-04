/**********************************************************************
 * Dam Flow Calculator
 * Inflow.gs
 *
 * Business Logic
 **********************************************************************/

/**********************************************************************
 * Calculate Inflow
 **********************************************************************/
function calculateInflow(request) {
  try {
    /**********************************************************
     * Validation
     **********************************************************/
    requireNumber(request.waterLevel, "Water Level");

    const waterLevel = number(request.waterLevel);

    /**********************************************************
     * Lookup Live Capacity
     **********************************************************/
    const lookup = getLiveCapacity(waterLevel);

    if (!lookup.success) {
      return lookup;
    }

    const currentCapacity = number(lookup.liveCapacity);

    /**********************************************************
     * First Record
     **********************************************************/
    const latestInflow = getLatestInflow();

    if (!latestInflow) {
      saveInflow({
        date: today(),

        time: currentTime(),

        waterLevel: waterLevel,

        liveCapacity: currentCapacity,

        capacityDifference: 0,

        timeDifference: 0,

        inflow: 0,
      });

      return success({
        firstRecord: true,

        message: "Initial inflow record created successfully.",

        waterLevel: waterLevel,

        liveCapacity: currentCapacity,

        inflow: 0,

        history: getInflowHistory(),
      });
    }

    /**********************************************************
     * Previous Values
     **********************************************************/
    const previousCapacity = number(latestInflow.liveCapacity);

    const previousDateTime = new Date(
      latestInflow.date + " " + latestInflow.time,
    );

    const currentDateTime = new Date();

    /**********************************************************
     * Capacity Difference
     **********************************************************/
    const capacityDifference = currentCapacity - previousCapacity;

    /**********************************************************
     * Time Difference (Hours)
     **********************************************************/
    const timeDifference =
      (currentDateTime.getTime() - previousDateTime.getTime()) /
      (1000 * 60 * 60);

    if (timeDifference <= 0) {
      return failure("Invalid time difference.");
    }

    /**********************************************************
     * Capacity Change (Cumec)
     **********************************************************/
    const capacityCumec =
      (capacityDifference * CONFIG.MCM_TO_CUBIC) /
      (timeDifference * CONFIG.SECONDS_PER_HOUR);

    /**********************************************************
     * Previous Outflow
     **********************************************************/
    const previousOutflow = getLastOutflowValue();

    /**********************************************************
     * Final Inflow
     **********************************************************/
    const inflow = capacityCumec + previousOutflow;

    /**********************************************************
     * Save Record
     **********************************************************/
    saveInflow({
      date: today(),

      time: currentTime(),

      waterLevel: waterLevel,

      liveCapacity: currentCapacity,

      capacityDifference: capacityDifference,

      timeDifference: timeDifference,

      inflow: inflow,
    });

    /**********************************************************
     * Response
     **********************************************************/
    return success({
      waterLevel: waterLevel,

      previousCapacity: previousCapacity,

      currentCapacity: currentCapacity,

      capacityDifference: capacityDifference,

      timeDifference: timeDifference,

      capacityCumec: capacityCumec,

      previousOutflow: previousOutflow,

      inflow: inflow,

      history: getInflowHistory(),
    });
  } catch (error) {
    return failure(error.toString());
  }
}

/**********************************************************************
 * Test Function
 **********************************************************************/
function testInflow() {
  const response = calculateInflow({
    waterLevel: 320.5,
  });

  log(response);
}
