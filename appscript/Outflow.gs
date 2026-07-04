/**********************************************************************
 * Dam Flow Calculator
 * Outflow.gs
 *
 * Business Logic
 **********************************************************************/

/**********************************************************************
 * Calculate Outflow
 **********************************************************************/
function calculateOutflow(request) {
  try {
    /**********************************************************
     * Validation
     **********************************************************/
    requireNumber(request.waterLevel, "Water Level");
    requireNumber(request.gateOpening, "Gate Opening");
    requireNumber(request.powerhouseHours, "Powerhouse Hours");
    requireNumber(request.ukailaCanal, "Ukaila Canal");

    const waterLevel = number(request.waterLevel);

    const gateOpening = number(request.gateOpening);

    const powerhouseHours = number(request.powerhouseHours);

    const ukailaCanal = number(request.ukailaCanal);

    /**********************************************************
     * Lookup Q
     **********************************************************/
    const qLookup = getQ(
      waterLevel,

      gateOpening,
    );

    if (!qLookup.success) return qLookup;

    const q = number(qLookup.q);

    /**********************************************************
     * Powerhouse Calculation
     **********************************************************/
    const powerhouseOutflow = powerhouseHours * CONFIG.POWERHOUSE_FACTOR;

    /**********************************************************
     * Total Outflow
     **********************************************************/
    const totalOutflow = q + powerhouseOutflow + ukailaCanal;

    /**********************************************************
     * Save History
     **********************************************************/
    const historyRecord = {
      date: today(),

      time: currentTime(),

      waterLevel: waterLevel,

      gateOpening: gateOpening,

      q: q,

      powerhouseHours: powerhouseHours,

      powerhouseOutflow: powerhouseOutflow,

      ukailaCanal: ukailaCanal,

      totalOutflow: totalOutflow,
    };

    saveOutflow(historyRecord);

    /**********************************************************
     * Response
     **********************************************************/
    return success({
      date: historyRecord.date,

      time: historyRecord.time,

      waterLevel: waterLevel,

      gateOpening: gateOpening,

      q: q,

      powerhouseHours: powerhouseHours,

      powerhouseOutflow: powerhouseOutflow,

      ukailaCanal: ukailaCanal,

      totalOutflow: totalOutflow,

      history: getOutflowHistory(),
    });
  } catch (error) {
    return failure(error.toString());
  }
}

/**********************************************************************
 * Test Function
 **********************************************************************/
function testOutflow() {
  const response = calculateOutflow({
    waterLevel: 334.5,

    gateOpening: 0.25,

    powerhouseHours: 3,

    ukailaCanal: 5,
  });

  log(response);
}
/**********************************************************************
 * Dam Flow Calculator
 * Outflow.gs
 *
 * Business Logic
 **********************************************************************/

/**********************************************************************
 * Calculate Outflow
 **********************************************************************/
function calculateOutflow(request) {
  try {
    /**********************************************************
     * Validation
     **********************************************************/
    requireNumber(request.waterLevel, "Water Level");
    requireNumber(request.gateOpening, "Gate Opening");
    requireNumber(request.powerhouseHours, "Powerhouse Hours");
    requireNumber(request.ukailaCanal, "Ukaila Canal");

    const waterLevel = number(request.waterLevel);

    const gateOpening = number(request.gateOpening);

    const powerhouseHours = number(request.powerhouseHours);

    const ukailaCanal = number(request.ukailaCanal);

    /**********************************************************
     * Lookup Q
     **********************************************************/
    const qLookup = getQ(
      waterLevel,

      gateOpening,
    );

    if (!qLookup.success) return qLookup;

    const q = number(qLookup.q);

    /**********************************************************
     * Powerhouse Calculation
     **********************************************************/
    const powerhouseOutflow = powerhouseHours * CONFIG.POWERHOUSE_FACTOR;

    /**********************************************************
     * Total Outflow
     **********************************************************/
    const totalOutflow = q + powerhouseOutflow + ukailaCanal;

    /**********************************************************
     * Save History
     **********************************************************/
    const historyRecord = {
      date: today(),

      time: currentTime(),

      waterLevel: waterLevel,

      gateOpening: gateOpening,

      q: q,

      powerhouseHours: powerhouseHours,

      powerhouseOutflow: powerhouseOutflow,

      ukailaCanal: ukailaCanal,

      totalOutflow: totalOutflow,
    };

    saveOutflow(historyRecord);

    /**********************************************************
     * Response
     **********************************************************/
    return success({
      date: historyRecord.date,

      time: historyRecord.time,

      waterLevel: waterLevel,

      gateOpening: gateOpening,

      q: q,

      powerhouseHours: powerhouseHours,

      powerhouseOutflow: powerhouseOutflow,

      ukailaCanal: ukailaCanal,

      totalOutflow: totalOutflow,

      history: getOutflowHistory(),
    });
  } catch (error) {
    return failure(error.toString());
  }
}

/**********************************************************************
 * Test Function
 **********************************************************************/
function testOutflow() {
  const response = calculateOutflow({
    waterLevel: 334.5,

    gateOpening: 0.25,

    powerhouseHours: 3,

    ukailaCanal: 5,
  });

  log(response);
}
