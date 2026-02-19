const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Made optional to handle existing records
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  status: {
    type : String,
    enum: ["draft", "pending", "active", "rejected"],
    default: "pending", // Changed to pending for admin approval
  },
  // Premium ad status for admin approval
  adStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  adminNotes: {
    type: String,
    default: "",
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  rejectedAt: {
    type: Date,
    default: null,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  make: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
  },
  year: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  bodyType: {
    type: String,
  },
  fuelType: {
    type: String,
  },

  //Key specifications
  
  dimensions: {
    type: String,
  },
  groundClearance: {
    type: String,
  },
  horsepower: {
    type: String,
  },
  bootSpace: {
    type: String,
  },
  batteryCapacity: {
    type: String,
  },
  chargingTime: {
    type: String,
  },
  topSpeed: {
    type: String,
  },
  range: {
    type: String,
  },
  transmission: {
    type: String,
  },
  kerbWeight: {
    type: String,
  },
  seatingCapacity: {
    type: String,
  },
  tyreSize: {
    type: String,
  },

  //Detailed specifications

  overallLength: {
    type: String,
  },
  overallWidth: {
    type: String,
  },
  overallHeight: {
    type: String,
  },
  wheelBase: {
    type: String,
  },
  numberOfDoors: {
    type: String,
  },


  engineType: {
    type: String,
  },
  batteryType: {
    type: String,
  },
  power: {
    type: String,
  },


  transmissionType: {
    type: String,
  },
  gearbox: {
    type: String,
  },


  steeringType: {
    type: String,
  },
  powerAssisted: {
    type: String,
  },
  minTurningRadius: {
    type: String,
  },


  frontSuspension: {
    type: String,
  },
  rearSuspension: {
    type: String,
  },
  frontBrakes: {
    type: String,
  },
  rearBrakes: {
    type: String,
  },

   //Features

  wheelType: {
    type: String,
  },
  wheelSize: {
    type: String,
  },
  spareTyre: {
    type: String,
  },
  pcd: {
    type: String,
  },



  numberOfAirbags: {
    type: String,
  },
  infoCluster: {
    type: String,
  },
  numberOfSpeakers: {
    type: Number,
  },


  seatbeltWarning: {
    type: Boolean,
    default: false,
  },
  doorAjarWarning: {
    type: Boolean,
    default: false,
  },
  adjustableSeats: {
    type: Boolean,
    default: false,
  },
  vehicleStabilityControl: {
    type: Boolean,
    default: false,
  },
  tractionControl: {
    type: Boolean,
    default: false,
  },
  hillStartAssist: {
    type: Boolean,
    default: false,
  },
  hillDescentControl: {
    type: Boolean,
    default: false,
  },
  childSafetyLock: {
    type: Boolean,
    default: false,
  },
  speedSensingDoorLock: {
    type: Boolean,
    default: false,
  },
  abs: {
    type: Boolean,
    default: false,
  },
  ebd: {
    type: Boolean,
    default: false,
  },
  brakeOverride: {
    type: Boolean,
    default: false,
  },
  alloyWheels: {
    type: Boolean,
    default: false,
  },
  coloredDoorHandles: {
    type: Boolean,
    default: false,
  },
  bodyColoredBumpers: {
    type: Boolean,
    default: false,
  },
  sunRoof: {
    type: Boolean,
    default: false,
  },
  moonRoof: {
    type: Boolean,
    default: false,
  },
  fogLamps: {
    type: Boolean,
    default: false,
  },
  roofRail: {
    type: Boolean,
    default: false,
  },
  sideSteps: {
    type: Boolean,
    default: false,
  },
  adjustableHeadlights: {
    type: Boolean,
    default: false,
  },
  drl: {
    type: Boolean,
    default: false,
  },
  headlightWasher: {
    type: Boolean,
    default: false,
  },
  xenonHeadlamps: {
    type: Boolean,
    default: false,
  },
  rearSpoiler: {
    type: Boolean,
    default: false,
  },
  rearWiper: {
    type: Boolean,
    default: false,
  },
  tachometer: {
    type: Boolean,
    default: false,
  },
  touchscreen: {
    type: Boolean,
    default: false,
  },
  cdPlayer: {
    type: Boolean,
    default: false,
  },
  dvdPlayer: {
    type: Boolean,
    default: false,
  },
  frontSpeakers: {
    type: Boolean,
    default: false,
  },
  rearSpeakers: {
    type: Boolean,
    default: false,
  },
  bluetooth: {
    type: Boolean,
    default: false,
  },
  usbAux: {
    type: Boolean,
    default: false,
  },
  rearEntertainment: {
    type: Boolean,
    default: false,
  },
  androidAuto: {
    type: Boolean,
    default: false,
  },
  appleCarPlay: {
    type: Boolean,
    default: false,
  },
  airConditioner: {
    type: Boolean,
    default: false,
  },
  climateControl: {
    type: Boolean,
    default: false,
  },
  airPurifier: {
    type: Boolean,
    default: false,
  },
  rearAcVents: {
    type: Boolean,
    default: false,
  },
  rearHeater: {
    type: Boolean,
    default: false,
  },
  heatedSeats: {
    type: Boolean,
    default: false,
  },
  frontVentilation: {
    type: Boolean,
    default: false,
  },
  rearVentilation: {
    type: Boolean,
    default: false,
  },
  remoteBootRelease: {
    type: Boolean,
    default: false,
  },
  navigationSystem: {
    type: Boolean,
    default: false,
  },
  keylessEntry: {
    type: Boolean,
    default: false,
  },
  pushButtonStart: {
    type: Boolean,
    default: false,
  },
  centralLocking: {
    type: Boolean,
    default: false,
  },
  cruiseControl: {
    type: Boolean,
    default: false,
  },
  parkingSensors: {
    type: Boolean,
    default: false,
  },
  parkingCamera: {
    type: Boolean,
    default: false,
  },
  autoWipers: {
    type: Boolean,
    default: false,
  },
  autoHeadlamps: {
    type: Boolean,
    default: false,
  },
  powerWindows: {
    type: Boolean,
    default: false,
  },
  powerSteering: {
    type: Boolean,
    default: false,
  },
  powerDoorLocks: {
    type: Boolean,
    default: false,
  },
  rearDefogger: {
    type: Boolean,
    default: false,
  },
  powerFoldingMirrors: {
    type: Boolean,
    default: false,
  },
  followMeHeadlamps: {
    type: Boolean,
    default: false,
  },
  headlampBeamAdjuster: {
    type: Boolean,
    default: false,
  },
  favoritedBy: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }],
  views: {
    type: Number,
    default: 0,
  },
  
  

  
  image1: { type: String },
  image2: { type: String },
  image3: { type: String },
  image4: { type: String },
  image5: { type: String },
  image6: { type: String },
  image7: { type: String },
  image8: { type: String },
  // Inspection report reference
  inspectionReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InspectionReport",
    default: null,
  },
});

const New_Car = mongoose.model("New_Car", productSchema);

module.exports = New_Car;
