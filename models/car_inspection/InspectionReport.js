const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  inspectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inspection",
    required: true,
  },
  inspectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inspector",
    required: true,
  },
  // Vehicle details captured at submission time (for stable report rendering)
  vehicleDetails: {
    customerName: { type: String, default: "" },
    engineCapacity: { type: String, default: "" },
    mileage: { type: String, default: "" },
    transmissionType: { type: String, default: "" },
    inspectionDate: { type: String, default: "" },
    chassisNo: { type: String, default: "" },
    engineNo: { type: String, default: "" },
    registrationNo: { type: String, default: "" },
    fuelType: { type: String, default: "" },
    color: { type: String, default: "" },
    location: { type: String, default: "" },
    registeredCity: { type: String, default: "" },
  },
  // Optional hero image for the report
  carImageUrl: { type: String, default: "" },
  // Flattened vehicle fields (so consumers don't need to parse nested object)
  make: { type: String, default: "" },
  model: { type: String, default: "" },
  year: { type: Number, default: undefined },
  variant: { type: String, default: "" },
  engineCapacity: { type: String, default: "" },
  kmDriven: { type: Number, default: undefined },
  transmissionType: { type: String, default: "" },
  fuelType: { type: String, default: "" },
  color: { type: String, default: "" },
  chassisNo: { type: String, default: "" },
  engineNo: { type: String, default: "" },
  registrationNo: { type: String, default: "" },
  location: { type: String, default: "" },
  registeredCity: { type: String, default: "" },
  // New detailed checklist structure - flexible schema to handle dynamic data
  detailedChecklist: {
    type: Map,
    of: {
      weight: { type: Number, default: 0 },
      items: [{
        id: String,
        label: String,
        rating: Number,
        notes: String,
        photos: [String]
      }],
      rating: { type: Number, default: 0 },
      notes: { type: String, default: "" }
    },
    default: {}
  },
  // Photos metadata
  photosMeta: [{
    url: String,
    itemId: String,
    lat: Number,
    lon: Number,
    timestamp: String
  }],
  // Exterior condition diagram (pre-rendered image from frontend)
  exteriorConditionImage: { type: String, default: "" },
  // Optional legend provided by inspector for exterior diagram
  exteriorLegend: {
    u1: { type: String, default: "" },
    u2: { type: String, default: "" },
    a1: { type: String, default: "" },
    a2: { type: String, default: "" },
    minor: { type: String, default: "" },
  },
  // Overall scoring
  overallScore: { type: Number, default: 0 },
  overallRating: { 
    type: String, 
    enum: ["Excellent", "Good", "Fair", "Poor"],
    default: "Fair"
  },
  verdict: { type: String, default: "" },
  summary: { type: String, default: "" },
  // Inspector notes
  notes: String,
  documentsNotes: String,
  comments: String, // Inspector comments for PDF
  // Body Frame Accident Checklist
  bodyFrameChecklist: {
    radiatorCoreSupport: { type: String, default: "OK" },
    rightStrutTowerApron: { type: String, default: "OK" },
    leftStrutTowerApron: { type: String, default: "OK" },
    rightFrontRail: { type: String, default: "OK" },
    leftFrontRail: { type: String, default: "OK" },
    cowlPanelFirewall: { type: String, default: "OK" },
    rightAPillar: { type: String, default: "OK" },
    leftAPillar: { type: String, default: "OK" },
    rightBPillar: { type: String, default: "OK" },
    leftBPillar: { type: String, default: "OK" },
    rightCPillar: { type: String, default: "OK" },
    leftCPillar: { type: String, default: "OK" },
    bootFloor: { type: String, default: "OK" },
    bootLockPillar: { type: String, default: "OK" },
    rearSubFrame: { type: String, default: "OK" },
    frontSubFrame: { type: String, default: "OK" },
  },
  // Engine / Transmission / Clutch Checklist
  engineTransmissionChecklist: {
    engineOilLevel: { type: String, default: "Complete and Clean" },
    engineOilLeakage: { type: String, default: "No Leakage" },
    transmissionOilLeakage: { type: String, default: "No Leakage" },
    coolantLeakage: { type: String, default: "No Leakage" },
    brakeOilLeakage: { type: String, default: "No Leakage" },
  },
  // Detailed Mechanical Inspection Fields
  mechanicalChecklist: {
    // Belts and Wires
    beltsFan: { type: String, default: "Ok" },
    wiresWiringHarness: { type: String, default: "Ok" },
    engineBlowManualCheck: { type: String, default: "Not Present" },
    engineNoise: { type: String, default: "No Noise" },
    engineVibration: { type: String, default: "No Vibration" },
    coldStart: { type: String, default: "Ok" },
    engineMounts: { type: String, default: "Ok" },
    pulleysAdjuster: { type: String, default: "Ok" },
    hoses: { type: String, default: "Ok" },
    // Exhaust Check
    exhaustSound: { type: String, default: "Ok" },
    // Engine Cooling System
    radiator: { type: String, default: "Ok" },
    suctionFan: { type: String, default: "Working" },
    // Engine Electronics
    starterOperation: { type: String, default: "Ok" },
  },
  // Detailed Brakes Inspection Fields
  brakesChecklist: {
    frontRightDisc: { type: String, default: "Smooth" },
    frontLeftDisc: { type: String, default: "Smooth" },
    frontRightBrakePad: { type: String, default: "More than 50%" },
    frontLeftBrakePad: { type: String, default: "More than 50%" },
    parkingHandBrake: { type: String, default: "Ok" },
  },
  // Detailed Suspension/Steering Inspection Fields
  suspensionSteeringChecklist: {
    // Front Suspension
    steeringWheelPlay: { type: String, default: "Ok" },
    rightBallJoint: { type: String, default: "Ok" },
    leftBallJoint: { type: String, default: "Ok" },
    rightZLinks: { type: String, default: "Ok" },
    leftZLinks: { type: String, default: "Ok" },
    rightTieRodEnd: { type: String, default: "Ok" },
    leftTieRodEnd: { type: String, default: "Ok" },
    frontRightBoots: { type: String, default: "Ok" },
    frontLeftBoots: { type: String, default: "Ok" },
    frontRightBushes: { type: String, default: "Need Replacement" },
    frontLeftBushes: { type: String, default: "Need Replacement" },
    frontRightShock: { type: String, default: "Ok" },
    frontLeftShock: { type: String, default: "Ok" },
    // Rear Suspension
    rearRightBushes: { type: String, default: "No Damage Found" },
    rearLeftBushes: { type: String, default: "No Damage Found" },
    rearRightShock: { type: String, default: "Ok" },
    rearLeftShock: { type: String, default: "Ok" },
  },
    // Detailed Interior Inspection Fields
    interiorChecklist: {
      // Basic Interior
      seats: { type: String, default: "Ok" },
      dashboard: { type: String, default: "Ok" },
      carpet: { type: String, default: "Ok" },
      headliner: { type: String, default: "Ok" },
      electronics: { type: String, default: "Ok" },
      climate: { type: String, default: "Ok" },
      
      // Steering Controls
      steeringWheelCondition: { type: String, default: "Ok" },
      steeringWheelButtons: { type: String, default: "Working" },
      horn: { type: String, default: "Working" },
      lightsLeverSwitch: { type: String, default: "Working" },
      wiperWasherLever: { type: String, default: "Working" },
      
      // Mirrors
      rightSideMirror: { type: String, default: "Working" },
      leftSideMirror: { type: String, default: "Working" },
      rearViewMirrorDimmer: { type: String, default: "Showing Reflection" },
      
      // Seats
      rightSeatAdjusterRecliner: { type: String, default: "Working" },
      leftSeatAdjusterRecliner: { type: String, default: "Working" },
      rightSeatAdjusterLearTrack: { type: String, default: "Working" },
      leftSeatAdjusterLearTrack: { type: String, default: "Working" },
      rightSeatBelt: { type: String, default: "Working" },
      leftSeatBelt: { type: String, default: "Working" },
      rearSeatBelts: { type: String, default: "Working" },
      gloveBox: { type: String, default: "Working" },
      
      // Power/Manual Windows & Central Locking
      frontRightPowerWindow: { type: String, default: "Working Properly" },
      frontLeftPowerWindow: { type: String, default: "Working Properly" },
      rearRightPowerWindow: { type: String, default: "Working Properly" },
      rearLeftPowerWindow: { type: String, default: "Working Properly" },
      windowSafetyLock: { type: String, default: "Working" },
      
      // Dash/Roof Controls
      interiorLightings: { type: String, default: "Working" },
      dashControlsAC: { type: String, default: "Working" },
      dashControlsDeFog: { type: String, default: "Working" },
      dashControlsHazardLights: { type: String, default: "Working" },
      dashControlsOthers: { type: String, default: "Working" },
      audioVideo: { type: String, default: "Working" },
      rearViewCamera: { type: String, default: "Working" },
      trunkReleaseLever: { type: String, default: "Working" },
      fuelCapReleaseLever: { type: String, default: "Working" },
      bonnetReleaseLever: { type: String, default: "Working" },
      sunRoofControlButton: { type: String, default: "Working" },
      
      // Polish
      roofPolish: { type: String, default: "Perfect" },
      floorMat: { type: String, default: "Perfect" },
      frontRightSeatPolish: { type: String, default: "Perfect" },
      frontLeftSeatPolish: { type: String, default: "Perfect" },
      rearSeatPolish: { type: String, default: "Perfect" },
      dashboardCondition: { type: String, default: "Perfect" },
      
      // Equipment
      spareTire: { type: String, default: "Present" },
      tools: { type: String, default: "Complete" },
      jack: { type: String, default: "Present" },
    },
  // Legacy fields for backward compatibility
  exterior: {
    body: String,
    paint: String,
    glass: String,
    lights: String,
    tires: String,
    wheels: String,
  },
  // Detailed AC / Heater Inspection Fields
  acHeaterChecklist: {
    acFitted: { type: String, default: "Yes" },
    acOperational: { type: String, default: "Yes" },
    blower: { type: String, default: "Excellent Air Throw" },
    cooling: { type: String, default: "Excellent" },
    heating: { type: String, default: "Excellent" },
  },
  // Detailed Electrical & Electronics Inspection Fields
  electricalElectronicsChecklist: {
    // Computer checkup
    computerCheck: { type: String, default: "Not Checked" },
    batteryWarningLight: { type: String, default: "Not Present" },
    oilPressureLowWarningLight: { type: String, default: "Not Present" },
    temperatureWarningLightGauge: { type: String, default: "Not Present" },
    airBagWarningLight: { type: String, default: "Not Present" },
    powerSteeringWarningLight: { type: String, default: "Not Present" },
    absWarningLight: { type: String, default: "Not Present" },
    keyFobBatteryLowLight: { type: String, default: "Not Present" },
    // Battery
    batteryVoltage: { type: String, default: "12" },
    batteryTerminalsCondition: { type: String, default: "Ok" },
    batteryCharging: { type: String, default: "Ok" },
    alternatorOperation: { type: String, default: "Ok" },
    // Instrument cluster
    gauges: { type: String, default: "Working" },
  },
  // Detailed Exterior & Body Inspection Fields
  exteriorBodyChecklist: {
    // Car frame
    trunkLock: { type: String, default: "Ok" },
    frontWindshieldCondition: { type: String, default: "Ok" },
    rearWindshieldCondition: { type: String, default: "Ok" },
    frontRightDoorWindow: { type: String, default: "Ok" },
    frontLeftDoorWindow: { type: String, default: "Ok" },
    rearRightDoorWindow: { type: String, default: "Ok" },
    rearLeftDoorWindow: { type: String, default: "Ok" },
    windscreenWiper: { type: String, default: "Cleaning Properly" },
    sunRoofGlass: { type: String, default: "Ok" },
    // Exterior lights
    rightHeadlightWorking: { type: String, default: "Working" },
    leftHeadlightWorking: { type: String, default: "Working" },
    rightHeadlightCondition: { type: String, default: "Perfect" },
    leftHeadlightCondition: { type: String, default: "Perfect" },
    rightTaillightWorking: { type: String, default: "Working" },
    leftTaillightWorking: { type: String, default: "Working" },
    rightTaillightCondition: { type: String, default: "Perfect" },
    leftTaillightCondition: { type: String, default: "Perfect" },
    fogLightsWorking: { type: String, default: "Working" },
  },
  // Detailed Tyres Inspection Fields
  tyresChecklist: {
    // Individual tyres
    frontRightTyreBrand: { type: String, default: "" },
    frontRightTyreTread: { type: String, default: "" },
    frontLeftTyreBrand: { type: String, default: "" },
    frontLeftTyreTread: { type: String, default: "" },
    rearRightTyreBrand: { type: String, default: "" },
    rearRightTyreTread: { type: String, default: "" },
    rearLeftTyreBrand: { type: String, default: "" },
    rearLeftTyreTread: { type: String, default: "" },
    // General tyre info
    tyreSize: { type: String, default: "" },
    rims: { type: String, default: "" },
    wheelCaps: { type: String, default: "Present" },
  },
  // Test Drive Fields
  testDriveChecklist: {
    enginePick: { type: String, default: "Ok" },
    driveShaftNoise: { type: String, default: "No Noise" },
    gearShifting: { type: String, default: "Smooth" },
    brakePedalOperation: { type: String, default: "Timely Response" },
    frontSuspensionWhileDriving: { type: String, default: "No Noise" },
    rearSuspensionWhileDriving: { type: String, default: "No Noise" },
    steeringOperationWhileDriving: { type: String, default: "Smooth" },
    steeringWheelAlignmentWhileDriving: { type: String, default: "Centered" },
    heaterOperationWhileDriving: { type: String, default: "Perfect" },
    acOperationWhileDriving: { type: String, default: "Perfect" },
    speedometerWhileDriving: { type: String, default: "Working" },
    testDriveDoneBy: { type: String, default: "Seller" },
  },
  interior: {
    seats: String,
    dashboard: String,
    carpet: String,
    headliner: String,
    electronics: String,
    climate: String,
  },
  mechanical: {
    engine: String,
    transmission: String,
    brakes: String,
    suspension: String,
    exhaust: String,
    battery: String,
  },
  overallResult: String,
  inspectionOfficer: String, // Add inspection officer field
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const InspectionReport = mongoose.model("InspectionReport", reportSchema);

module.exports = InspectionReport;
