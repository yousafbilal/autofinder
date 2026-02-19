import React, { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import { COLORS } from "../../constants/colors"

const CARQUERY_BASE = "https://www.carqueryapi.com/api/0.3/?"

const parseCarQuery = (raw: string): any => {
  try { return JSON.parse(raw) } catch (_) {
    const first = raw.indexOf("{")
    const last = raw.lastIndexOf("}")
    if (first !== -1 && last !== -1) {
      const slice = raw.substring(first, last + 1)
      try { return JSON.parse(slice) } catch (_) {}
    }
  }
  return {}
}

// Car offline data (fallback) - Comprehensive Pakistani Car Data
const getOfflineCarMakes = () => [
  "Suzuki","Toyota","Honda","Kia","Hyundai","MG","Changan","BYD","BMW","Audi",
  "Proton","United","Porsche","Mercedes Benz","Prince","DFSK","Isuzu","Haval",
  "BAIC","ORA","Peugeot","JW Forland","Tank","Chery","JMC","Daehan","Deepal",
  "Honri","Tesla","GUGO","Seres","Nissan","Mitsubishi","Volkswagen","Lexus",
  "Subaru","Jeep","Chevrolet","Ford","Mazda","Volvo","Land Rover","Alfa Romeo",
  "Jaguar","Fiat","Daihatsu","FAW"
].map(m=>({label:m,value:m}))

const OFFLINE_CAR_MAKE_TO_MODELS: Record<string,string[]> = {
  Suzuki:["Alto","Cultus","Ravi","Every","Wagon R","Swift","Jimny","Bolan","Mehran","APV","Liana","Ciaz","Baleno","Celerio","Ertiga","Grand Vitara","Ignis","Kizashi","Samurai","SX4","Vitara","XL7"],
  Toyota:["Rush","Yaris","Corolla","Prius","Fortuner","Corolla Cross","Hilux","Hiace","Coaster","Camry","Land Cruiser","Prado","Aqua","Vitz","Crown","Avalon","Avensis","Aygo","bZ4X","Celica","C-HR","Corona","Echo","FJ Cruiser","GR86","Highlander"],
  Honda:["BR-V","City","HR-V","Fit","Civic","CR-V","Vezel","Accord","Jazz","Insight","Odyssey","Passport","Pilot","Ridgeline","S2000","CRZ"],
  Kia:["Picanto","Shehzore","Stonic","Sportage","Sorento","Grand Carnival","EV5","Forte","Cadenza","K5","Stinger","Niro","Seltos","Soul","Carnival","Optima","Rondo","K900","Telluride","Carens"],
  Hyundai:["H-100","Elantra","Tucson","Staria","Sonata","Santa Fe","Ioniq 5","Ioniq 6","Venue","Accent","Azera","Genesis","Tiburon","Veloster","Kona","i10","i20","i30","Nexo","Palisade"],
  MG:["HS","4","ZS EV","5 EV","ZS","3","6"],
  Changan:["M9","Karvaan","Alsvin","Oshan X7","CS35","CS55","CS75","CS95"],
  BYD:["Atto 3","Seal","Dolphin","Tang","Han","Song"],
  BMW:["X7","X1","i4","2 Series","iX3","iX","5 Series","X3","7 Series","X5","X2","3 Series","1 Series","4 Series","6 Series","8 Series","M2","M3","M4","M5","Z4","i3","i8"],
  Audi:["Q2","e-tron","e-tron GT","A1","A3","A4","A5","A6","A7","A8","Q3","Q5","Q7","Q8","R8","TT","RS3","RS5","RS7"],
  Proton:["Saga","X70","X50","Persona","Iriz"],
  United:["Bravo","Alpha"],
  Porsche:["Cayman","911","Cayenne","Macan","Panamera","Taycan","Boxster"],
  "Mercedes Benz":["A Class","GLB Class","E Class","CLA Class","S Class","G Class","C Class","GLE","GLC","GLA","CLS","SL","EQC","EQS","Maybach"],
  Prince:["K01","Pearl","K07"],
  DFSK:["C37","Glory 580","Glory 500"],
  Isuzu:["D-Max"],
  Haval:["Jolion","H6","F7","H9"],
  BAIC:["BJ40","X25","X35"],
  ORA:["03","07"],
  Peugeot:["2008","3008","5008","208","308","508"],
  "JW Forland":["Safari"],
  Tank:["300","500"],
  Chery:["Tiggo 4 Pro","Tiggo 8","Tiggo 7","Arrizo 6"],
  JMC:["Vigus 4x4"],
  Daehan:["Shehzore"],
  Deepal:["L07","S07"],
  Honri:["Ve"],
  Tesla:["Model Y","Model 3","Model S","Model X"],
  GUGO:["GIGI"],
  Seres:["3 EV","5"],
  Nissan:["Altima","Maxima","Sentra","Versa","Leaf","GT-R","Z","Kicks","Rogue","Murano","Pathfinder","Armada","Frontier","Titan","Juke","Xterra","Quest","Note","Sunny","Dayz","Latio"],
  Mitsubishi:["Outlander","Eclipse Cross","Mirage","Lancer","Galant","Montero","Pajero","ASX","Colt","Delica","Eclipse","Triton","L200"],
  Volkswagen:["Golf","Passat","Jetta","Tiguan","Atlas","Polo","Arteon","ID.4"],
  Lexus:["ES","RX","NX","IS","GX","LS","LC","UX","LX"],
  Subaru:["Impreza","Legacy","Forester","Outback","WRX","BRZ","Crosstrek"],
  Jeep:["Wrangler","Grand Cherokee","Cherokee","Compass","Renegade","Gladiator"],
  Chevrolet:["Spark","Cruze","Malibu","Impala","Camaro","Corvette","Equinox","Traverse","Tahoe","Suburban","Colorado","Silverado","Blazer"],
  Ford:["Fiesta","Focus","Fusion","Mustang","Taurus","EcoSport","Escape","Edge","Explorer","Expedition","Bronco","Ranger","F-150"],
  Mazda:["Mazda3","Mazda6","CX-3","CX-5","CX-9","MX-5","CX-30","CX-50"],
  Volvo:["S60","XC40","XC60","XC90","V60","V90","S90"],
  "Land Rover":["Range Rover","Discovery","Defender","Range Rover Evoque","Discovery Sport","Range Rover Sport","Range Rover Velar"],
  "Alfa Romeo":["Giulia","Stelvio","4C","Tonale"],
  Jaguar:["XE","XF","F-Type","F-Pace","E-Pace","I-Pace"],
  Fiat:["500","Panda","Tipo","500X"],
  Daihatsu:["Cuore","Mira","Move","Hijet","Copen","Rocky","Terios","Tanto"],
  FAW:["V2","X-PV","Carrier"],
}

const getOfflineCarModels = (make:string) => (OFFLINE_CAR_MAKE_TO_MODELS[make]||[]).map(m=>({label:m,value:m}))

const OFFLINE_CAR_VARIANTS: Record<string,Record<string,string[]>> = {
  Suzuki:{
    Alto:["VX","VXR","VXR AGS","VXL AGS"],
    Cultus:["VXR","VXL","Auto Gear Shift"],
    Ravi:["Euro II"],
    Every:["VX","VXR"],
    "Wagon R":["VXR","VXL","AGS"],
    Swift:["GL Manual","GL CVT","GLX CVT"],
    Jimny:["GA MT"],
    Bolan:["VX","Cargo Van"],
    Mehran:["VX","VXR"],
    APV:["GA","GL","SGX"],
    Liana:["LXI","RXI","Sport"],
    Ciaz:["GL","GLX","RS"],
    Baleno:["GL","GLX","GTX"],
    Celerio:["LXI","VXI","ZXI"],
    Ertiga:["LXI","VXI","ZXI"],
  },
  Toyota:{
    Rush:["G A/T","G M/T"],
    Yaris:["GLI MT 1.3","ATIV MT 1.3","GLI CVT 1.3","ATIV CVT 1.3","ATIV X CVT 1.5 Beige Interior","ATIV X CVT 1.5 Black Interior"],
    Corolla:["Altis X Manual 1.6","Altis 1.6 X CVT-i","Altis X CVT-i 1.8","Altis 1.6 X CVT-i Special Edition","Altis Grande X CVT-i 1.8 Beige Interior","Altis Grande X CVT-i 1.8 Black Interior","XLi","GLi","SE Saloon","XE"],
    Prius:["S","1.8 U Hybrid","2.0 G Hybrid","2.0 Z Hybrid","Z Phev"],
    Fortuner:["2.7 G","2.8 Sigma 4","2.7 V","Legender","GR-S"],
    "Corolla Cross":["1.8","1.8 X","1.8 HEV","1.8 HEV X","Low Grade","Smart Mid Grade","Premium High Grade"],
    Hilux:["Revo V Automatic 2.8","Revo G 2.8","Revo G Automatic 2.8","E","Revo Rocco","Revo GR-S"],
    Hiace:["Standard Roof","High Roof Commuter","High Roof Tourer"],
    Camry:["High Grade"],
    Prado:["TX 2.7L","VX 2.8L D"],
    "Land Cruiser":["ZX Gasoline 3.5L","VX","GXR"],
    Aqua:["S","G","Crossover"],
    Vitz:["F","Jewela","RS","F Smart Stop","U"],
  },
  Honda:{
    "BR-V":["i-VTEC S"],
    City:["1.2L M/T","1.2L CVT","1.5L CVT","1.5L ASPIRE M/T","1.5L ASPIRE CVT"],
    "HR-V":["VTi","VTi-S"],
    Fit:["1.5 EXECUTIVE","Hybrid","RS"],
    Civic:["Oriel","RS","VTi","VTi Oriel Prosmatec","Turbo RS"],
    "CR-V":["2.0 CVT"],
    Vezel:["e-HEV Play","Hybrid Z","Hybrid X","Hybrid RS"],
    Accord:["1.5L VTEC Turbo"],
    Jazz:["V","VX","ZX"],
    Insight:["Base","LX","EX","Touring"],
  },
  Kia:{
    Picanto:["1.0 MT","1.0 AT"],
    Shehzore:["K2700 Standard Cabin","K2700 King Cabin","K2700 Grand Cabin"],
    Stonic:["EX+"],
    Sportage:["Alpha","FWD","AWD","Black Limited Edition","Clear White Limited Edition"],
    Sorento:["2.4 FWD","2.4 AWD","3.5 FWD"],
    "Grand Carnival":["Executive"],
    EV5:["Air","EARTH"],
    Forte:["LX","EX","GT"],
    Cadenza:["Premium","Technology"],
    K5:["LX","EX","GT","GT-Line"],
    Stinger:["GT","GT1","GT2"],
    Niro:["Hybrid","Electric","Plug-in Hybrid"],
    Seltos:["LX","EX","SX","SX Turbo"],
    Soul:["LX","EX","GT-Line","X-Line"],
  },
  Hyundai:{
    "H-100":["Deckless","Flat Deck","High Deck"],
    Elantra:["GL","GLS","Hybrid"],
    Tucson:["FWD A/T GLS","FWD A/T GLS Sport","AWD A/T Ultimate"],
    Staria:["3.5 A/T","2.2D M/T","2.2D A/T","HGS"],
    Sonata:["2.0","2.5"],
    "Santa Fe":["Smart","Signature"],
    "Ioniq 5":["EV"],
    "Ioniq 6":["EV"],
    Venue:["SE","SEL","Limited"],
    Accent:["SE","SEL","Limited"],
    Kona:["SE","SEL","Limited","Ultimate","N"],
    i10:["Base","Classic","Sportz"],
    i20:["Active","Asta","Sportz"],
  },
  MG:{
    HS:["PHEV","Excite","Essence","2.0T AWD"],
    "4":["Excite","Essence"],
    "ZS EV":["MCE Essence","MCE Long Range"],
    "5 EV":["SE Long Range"],
    ZS:["Excite","Exclusive"],
    "3":["Excite","Exclusive"],
    "6":["Excite","Exclusive"],
  },
  Changan:{
    M9:["Base Model 1.0","Sherpa Power 1.2L"],
    Karvaan:["Plus 1.2"],
    Alsvin:["1.3L MT Comfort","1.5L DCT Comfort","1.5L DCT Lumiere","Black Edition"],
    "Oshan X7":["Comfort","FutureSense","FutureSense 7 Seat"],
  },
  BYD:{
    "Atto 3":["Advance"],
    Seal:["Dynamic","Premium"],
    Dolphin:["Base","Premium"],
  },
  BMW:{
    X7:["xDrive40i"],
    X1:["sDrive18i M/T"],
    i4:["eDrive40","M50"],
    "2 Series":["218i Gran Coupe"],
    iX3:["M Sport"],
    iX:["xDrive40","xDrive50"],
    "5 Series":["530e"],
    X3:["xDrive30e"],
    "7 Series":["i7 xDrive60 Excellence","750e xDrive Excellence"],
    X5:["xDrive45e"],
    X2:["sDrive18i"],
    "3 Series":["320i","330i","M3","M3 Competition"],
    M4:["M4","M4 GTS","M4 Competition"],
    Z4:["sDrive30i","sDrive35i","M40i"],
  },
  Audi:{
    Q2:["1.0 TFSI Standard Line","1.0 TFSI Exclusive Line"],
    "e-tron":["50 quattro 230 kW","50 quattro Sportback 230kW","55 quattro 300kW"],
    "e-tron GT":["Standard","RS"],
    A3:["Premium","Prestige","S3","RS3"],
    A4:["Premium","Prestige","S4","RS4"],
    A6:["Premium","Prestige","S6","RS6"],
    Q3:["Premium","Prestige","SQ3","RSQ3"],
    Q5:["Premium","Prestige","SQ5","RSQ5"],
    Q7:["Premium","Prestige","SQ7","RSQ7"],
    Q8:["Premium","Prestige","SQ8","RSQ8"],
    TT:["Coupe","Roadster","TTS","TT RS"],
    R8:["V10","V10 Spyder","V10 Performance"],
  },
  Proton:{
    Saga:["1.3L Standard M/T","1.3L Standard A/T","1.3L Ace A/T"],
    X70:["Executive AWD","Premium FWD"],
  },
  United:{
    Bravo:["Base Grade"],
    Alpha:["1.0 Manual"],
  },
  Porsche:{
    Cayman:["S","GTS","GT4"],
    "911":["Carrera","Turbo","GT3","GT3 RS"],
    Cayenne:["Base","S","Turbo","E-Hybrid"],
    Macan:["Base","S","GTS","Turbo"],
    Panamera:["Base","4S","Turbo","E-Hybrid"],
    Taycan:["4S","Turbo","Turbo S"],
  },
  "Mercedes Benz":{
    "A Class":["A200"],
    "GLB Class":["GLB 200 5-seater","GLB 200 7-seater"],
    "E Class":["E 180 Exclusive","E 180 AMG"],
    "CLA Class":["CLA200"],
    "S Class":["S 450 4MATIC Luxury"],
    "G Class":["G 63 AMG"],
    "C Class":["C200","C300","C63 AMG"],
    GLE:["GLE350","GLE450","AMG53","GLE63 AMG"],
    GLC:["GLC300","GLC43","GLC63"],
    GLA:["GLA250","GLA35 AMG","GLA200"],
  },
  Prince:{
    K01:["S"],
    Pearl:["MT"],
  },
  DFSK:{
    C37:["Euro V"],
    "Glory 580":["1.5 CVT","1.8 CVT","Pro"],
  },
  Isuzu:{
    "D-Max":["Hi Spark 4x2 Single Cab Deckless","Hi Spark 4x2 Single Cab Standard","Hi Lander 4x4 Single Cab Standard","Hi Lander 4x4 Double Cab Standard","V-Cross 3.0","V-Cross Automatic 3.0","V-Cross Limited GTX Edition"],
  },
  Haval:{
    Jolion:["1.5T","HEV"],
    H6:["1.5T","2.0T AWD","HEV"],
  },
  BAIC:{
    BJ40:["Plus Honorable Edition"],
  },
  ORA:{
    "03":["400-Pro"],
    "07":["EV"],
  },
  Peugeot:{
    "2008":["Active","Allure"],
    "3008":["Active","Allure","GT"],
    "5008":["Allure","GT"],
  },
  "JW Forland":{
    Safari:["Comfort 1.5 CL","Deluxe 1.5 EFI","Premium 1.5 DLX"],
  },
  Tank:{
    "500":["HEV High"],
  },
  Chery:{
    "Tiggo 4 Pro":["DEX Plus 1.5T"],
    "Tiggo 8":["Pro 1.6 DEX Plus"],
  },
  JMC:{
    "Vigus 4x4":["Double Cab"],
  },
  Daehan:{
    Shehzore:["Pickup 2.6"],
  },
  Deepal:{
    L07:["EV"],
    S07:["EV"],
  },
  Honri:{
    Ve:["2.0","3.0"],
  },
  Tesla:{
    "Model Y":["Standard Range","Long Range","Performance"],
    "Model 3":["Standard Range","Long Range","Performance"],
    "Model S":["Long Range","Plaid"],
    "Model X":["Long Range","Plaid"],
  },
  GUGO:{
    GIGI:["220"],
  },
  Seres:{
    "3 EV":["EV"],
  },
  Nissan:{
    Altima:["S","SR","SV","SL","Platinum"],
    Maxima:["SV","Platinum","SR","S"],
    Sentra:["S","SV","SR","SL"],
    Note:["e-Power","X"],
    Sunny:["S","SV"],
    Dayz:["X","Highway Star"],
    Juke:["S","SV","SL","Nismo","NismoRS"],
    Kicks:["S","SV","SR"],
    Rogue:["S","SL","SV","Platinum"],
    Murano:["S","SV","SL","Platinum"],
    Pathfinder:["S","SV","SL","Platinum"],
    "GT-R":["Premium","Nismo","TrackEdition"],
  },
  Mitsubishi:{
    Outlander:["ES","SE","SEL","GT"],
    "Eclipse Cross":["ES","SE","SEL","GT"],
    Mirage:["ES","SE","GT"],
    Lancer:["ES","GTS","Evolution","Ralliart"],
    Pajero:["GLS","Exceed","Sport","Shogun"],
    ASX:["ES","SE","Exceed","GT"],
    Triton:["GLX","GLS","Exceed","Ralliart"],
  },
  Volkswagen:{
    Golf:["S","SE","GTI","R"],
    Passat:["S","SE","SEL"],
    Jetta:["S","SE","GLI","R-Line"],
    Tiguan:["S","SE","SEL","R-Line"],
    Atlas:["S","SE","SEL","Cross Sport"],
    Polo:["TSI","GTI"],
  },
  Lexus:{
    ES:["ES250","ES300h","ES350"],
    RX:["RX350","RX450h","RX500h"],
    NX:["NX300","NX350","NX450h+"],
    IS:["IS300","IS350","IS500 F SPORT"],
    GX:["GX460","Luxury"],
  },
  Subaru:{
    Impreza:["Base","Premium","Sport","Limited"],
    Legacy:["Base","Premium","Sport","Limited","Touring"],
    Forester:["Base","Premium","Sport","Limited","Touring"],
    Outback:["Base","Premium","Limited","Touring","Wilderness"],
    WRX:["Base","Premium","Limited","GT"],
    BRZ:["Base","Limited"],
  },
  Jeep:{
    Wrangler:["Sport","Sport S","Sahara","Rubicon","Willys"],
    "Grand Cherokee":["Laredo","Limited","Overland","Summit","Trailhawk","SRT","Trackhawk"],
    Cherokee:["Latitude","Limited","Trailhawk"],
    Compass:["Sport","Latitude","Limited","Trailhawk"],
    Renegade:["Sport","Latitude","Limited","Trailhawk"],
  },
  Chevrolet:{
    Spark:["LS","1LT","2LT","Activ"],
    Cruze:["L","LS","LT","Premier"],
    Malibu:["L","LS","LT","Premier"],
    Camaro:["LS","LT","SS","ZL1"],
    Corvette:["Stingray","Grand Sport","Z06","ZR1"],
    Equinox:["L","LS","LT","Premier"],
    Tahoe:["LS","LT","Premier","High Country"],
    Silverado:["WT","LS","LT","High Country"],
    Blazer:["L","LT","RS","Premier"],
  },
  Ford:{
    Fiesta:["S","SE","Titanium","ST"],
    Focus:["S","SE","Titanium","ST","RS"],
    Fusion:["S","SE","Titanium","Hybrid","Energi"],
    Mustang:["EcoBoost","GT","Shelby GT350","Shelby GT500","Mach 1"],
    EcoSport:["S","SE","Titanium","SES"],
    Escape:["S","SE","SEL","Titanium","Plug-in Hybrid"],
    Explorer:["Base","XLT","Limited","ST","Platinum"],
    Expedition:["XLT","Limited","King Ranch","Platinum"],
    Bronco:["Base","Big Bend","Black Diamond","Outer Banks","Badlands","Wildtrak"],
    Ranger:["XL","XLT","Lariat","Raptor"],
    "F-150":["XL","XLT","Lariat","King Ranch","Platinum","Limited","Raptor"],
  },
  Mazda:{
    Mazda3:["Sport","Touring","Grand Touring"],
    Mazda6:["Sport","Touring","Grand Touring","Signature"],
    "CX-3":["Sport","Touring","Grand Touring"],
    "CX-5":["Sport","Touring","Carbon Edition","Grand Touring","Signature"],
    "CX-9":["Sport","Touring","Carbon Edition","Grand Touring","Signature"],
    "MX-5":["Sport","Club","Grand Touring"],
  },
  Volvo:{
    S60:["Momentum","R-Design","Inscription"],
    XC40:["T4","T5","Recharge"],
    XC60:["Momentum","R-Design","Inscription"],
    XC90:["T5","T6","Recharge"],
    V60:["Momentum","R-Design","Cross Country"],
    S90:["Momentum","R-Design","Inscription"],
  },
  "Land Rover":{
    "Range Rover":["SE","HSE","Autobiography","SV"],
    Discovery:["SE","HSE","Landmark"],
    Defender:["90","110","130"],
    "Range Rover Evoque":["SE","HSE","Autobiography"],
    "Discovery Sport":["SE","HSE","Landmark"],
    "Range Rover Sport":["SE","HSE","Autobiography","SVR"],
  },
  "Alfa Romeo":{
    Giulia:["Base","Ti","Veloce","Quadrifoglio"],
    Stelvio:["Base","Ti","Veloce","Quadrifoglio"],
    "4C":["Base","Spider"],
  },
  Jaguar:{
    XE:["Base","S","R-Dynamic"],
    XF:["Base","S","R-Dynamic"],
    "F-Type":["Base","P380","R","SVR"],
    "F-Pace":["Base","S","SVR"],
    "E-Pace":["Base","S","R-Dynamic"],
    "I-Pace":["S","SE","HSE"],
  },
  Daihatsu:{
    Cuore:["CX","CL"],
    Mira:["L","X","G"],
    Move:["L","X","Custom"],
    Hijet:["Cargo","Deck Van"],
    Copen:["Robe","XPLAY","GR SPORT"],
    Rocky:["X","G","Premium G"],
    Terios:["1.5","Custom"],
    Tanto:["L","X","Custom"],
  },
  FAW:{
    V2:["Standard","Luxury"],
    "X-PV":["Standard","Deluxe"],
    Carrier:["Standard"],
  },
}

const getOfflineCarVariants = (make:string, model:string) => ((OFFLINE_CAR_VARIANTS[make]||{})[model]||["Base"]).map(v=>({label:v,value:v}))

// Bike offline data
const BIKE_MAKES = ["Honda","Yamaha","Suzuki","United","Road Prince","Kawasaki","Super Power","Hi Speed","Super Star","Power"].map(m=>({label:m,value:m}))
const BIKE_MAKE_TO_MODELS: Record<string,string[]> = {
  Honda:["CD 70","CG 125","CB 150F","Pridor"],
  Yamaha:["YBR 125","YBR 125G","YBZ 125","R15"],
  Suzuki:["GS 150","GR 150","GD 110S","Gixxer"],
  United:["US 70","US 125"],
  "Road Prince":["RP 70","WeGo 150"],
  Kawasaki:["Ninja 250","Ninja 300"],
  "Super Power":["SP 70","SP 125"],
  "Hi Speed":["Infinity 150","SR 70"],
  "Super Star":["SS 70","SS 125"],
  Power:["PK 70","PK 125"],
}
const BIKE_VARIANTS: Record<string,Record<string,string[]>> = {
  Honda:{ "CD 70":["Euro II"], "CG 125":["Self Start","Special"], "CB 150F":["Standard"], Pridor:["Standard"] },
  Yamaha:{ "YBR 125":["Standard"], "YBR 125G":["Standard"], "YBZ 125":["Standard"], R15:["V3"] },
  Suzuki:{ "GS 150":["SE"], "GR 150":["Standard"], "GD 110S":["Standard"], Gixxer:["SF"] },
}

const fetchMakesByYear = async (year:string, isBike:boolean) => {
  try {
    if (isBike) {
      return BIKE_MAKES
    }
    const withYear = await (await fetch(`${CARQUERY_BASE}cmd=getMakes&year=${encodeURIComponent(year)}`)).text()
    const jsonY = parseCarQuery(withYear)
    const listY = (jsonY.Makes||[]).map((m:any)=>({label:m.make_display,value:m.make_display}))
    const allRaw = await (await fetch(`${CARQUERY_BASE}cmd=getMakes`)).text()
    const jsonAll = parseCarQuery(allRaw)
    const listAll = (jsonAll.Makes||[]).map((m:any)=>({label:m.make_display,value:m.make_display}))
    const merged = [...listY, ...listAll]
    const unique = Array.from(new Map(merged.map(m=>[m.value.toLowerCase(), m])).values())
    unique.sort((a,b)=>a.label.localeCompare(b.label))
    return unique
  } catch {
    return isBike ? BIKE_MAKES : getOfflineCarMakes()
  }
}
const fetchModels = async (make:string, year:string, isBike:boolean) => {
  try {
    if (isBike) {
      return (BIKE_MAKE_TO_MODELS[make]||[]).map(m=>({label:m,value:m}))
    }
    const withYear = await (await fetch(`${CARQUERY_BASE}cmd=getModels&make=${encodeURIComponent(make)}&year=${encodeURIComponent(year)}`)).text()
    const jsonY = parseCarQuery(withYear)
    const listY = (jsonY.Models||[]).map((m:any)=>({label:m.model_name,value:m.model_name}))
    const noYear = await (await fetch(`${CARQUERY_BASE}cmd=getModels&make=${encodeURIComponent(make)}`)).text()
    const jsonN = parseCarQuery(noYear)
    const listN = (jsonN.Models||[]).map((m:any)=>({label:m.model_name,value:m.model_name}))
    const merged = [...listY, ...listN]
    const unique = Array.from(new Map(merged.map(m=>[m.value.toLowerCase(), m])).values())
    unique.sort((a,b)=>a.label.localeCompare(b.label))
    return unique
  } catch {
    return isBike ? (BIKE_MAKE_TO_MODELS[make]||[]).map(m=>({label:m,value:m})) : getOfflineCarModels(make)
  }
}
const fetchVariants = async (make:string, model:string, year:string, isBike:boolean) => {
  try {
    if (isBike) {
      return ((BIKE_VARIANTS[make]||{})[model]||["Standard"]).map(v=>({label:v,value:v}))
    }
    const withYear = await (await fetch(`${CARQUERY_BASE}cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}`)).text()
    const jsonY = parseCarQuery(withYear)
    const set = new Set<string>()
    ;(jsonY.Trims||[]).forEach((t:any)=>{ const v=(t.model_trim||"").toString().trim(); if(v) set.add(v) })
    const noYear = await (await fetch(`${CARQUERY_BASE}cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`)).text()
    const jsonN = parseCarQuery(noYear)
    ;(jsonN.Trims||[]).forEach((t:any)=>{ const v=(t.model_trim||"").toString().trim(); if(v) set.add(v) })
    const arr = Array.from(set).map(v=>({label:v,value:v}))
    arr.sort((a,b)=>a.label.localeCompare(b.label))
    return arr
  } catch {
    return isBike ? ((BIKE_VARIANTS[make]||{})[model]||["Standard"]).map(v=>({label:v,value:v})) : getOfflineCarVariants(make, model)
  }
}

const BuyCarforMeBrandFlowScreen = () => {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { year, returnTo = 'BuyCarforMe' } = route.params as any
  const isBikeFlow = /PostBikeAd/i.test(returnTo)

  const [step, setStep] = useState<'make'|'model'|'variant'>('make')
  const [loading, setLoading] = useState(false)

  const [makes, setMakes] = useState<{label:string; value:string}[]>([])
  const [selectedMake, setSelectedMake] = useState<string|null>(null)

  const [models, setModels] = useState<{label:string; value:string}[]>([])
  const [selectedModel, setSelectedModel] = useState<string|null>(null)
  const [modelToMakes, setModelToMakes] = useState<Record<string,string[]>>({})

  const [variants, setVariants] = useState<{label:string; value:string}[]>([])
  const [selectedVariant, setSelectedVariant] = useState<string|null>(null)
  const [query, setQuery] = useState("")

  useEffect(()=>{
    (async()=>{
      setLoading(true)
      try {
        const ms = await fetchMakesByYear(year, isBikeFlow)
        setMakes(ms.length?ms:(isBikeFlow?BIKE_MAKES:getOfflineCarMakes()))
      } catch(e){ setMakes(getOfflineCarMakes()) }
      setLoading(false)
    })()
  },[year])

  useEffect(()=>{
    if(!selectedMake) { setModels([]); return }
    (async()=>{
      setLoading(true)
      try {
        const md = await fetchModels(selectedMake, year, isBikeFlow)
        setModels(md.length?md:(isBikeFlow?(BIKE_MAKE_TO_MODELS[selectedMake]||[]).map(m=>({label:m,value:m})):getOfflineCarModels(selectedMake)))
        setModelToMakes({})
      } catch(e){ setModels(isBikeFlow?(BIKE_MAKE_TO_MODELS[selectedMake]||[]).map(m=>({label:m,value:m})):getOfflineCarModels(selectedMake)) }
      setLoading(false)
    })()
  },[selectedMake, year])

  useEffect(()=>{
    if(!selectedMake || !selectedModel) { setVariants([]); return }
    (async()=>{
      setLoading(true)
      try {
        const vs = await fetchVariants(selectedMake, selectedModel, year, isBikeFlow)
        setVariants(vs.length?vs:(isBikeFlow?((BIKE_VARIANTS[selectedMake]||{})[selectedModel]||["Standard"]).map(v=>({label:v,value:v})):getOfflineCarVariants(selectedMake, selectedModel)))
      } catch(e){ setVariants(isBikeFlow?((BIKE_VARIANTS[selectedMake]||{})[selectedModel]||["Standard"]).map(v=>({label:v,value:v})):getOfflineCarVariants(selectedMake, selectedModel)) }
      setLoading(false)
    })()
  },[selectedMake, selectedModel, year])

  // Clear search query when step changes
  useEffect(() => {
    setQuery("")
  }, [step])

  const onSelectMake = (mk:string) => { setSelectedMake(mk); setSelectedModel(null); setSelectedVariant(null); setStep('model') }
  const onSelectModel = (md:string) => { setSelectedModel(md); setSelectedVariant(null); setStep('variant') }
  const onSelectVariant = (vr:string) => { setSelectedVariant(vr) }

  const onDone = () => {
    if (!selectedMake || !selectedModel) { return }
    const choice = selectedVariant ? [{ make: selectedMake, model: selectedModel, variant: selectedVariant }] : [{ make: selectedMake, model: selectedModel }]
    navigation.navigate(returnTo, { preselectedYear: year, carChoices: choice })
  }

  const items = step==='make' ? makes : step==='model' ? models : variants
  const selectedVal = step==='make' ? selectedMake : step==='model' ? selectedModel : selectedVariant
  const title = step==='make' ? 'Select Brand' : step==='model' ? 'Select Model' : 'Select Variant'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const src = items || []
    if (!q) return src
    return src.filter(i => i.label.toLowerCase().includes(q))
  }, [query, items])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>{title}</Text></View>
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={step==='make' ? 'Search brand' : step==='model' ? 'Search model' : 'Search variant'}
          style={styles.input}
        />
      </View>
      {loading ? (
        <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="small" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it)=>it.value}
          renderItem={({item})=> (
            <TouchableOpacity
              style={[styles.item, selectedVal===item.value && styles.itemSelected]}
              onPress={()=> step==='make' ? onSelectMake(item.value) : step==='model' ? onSelectModel(item.value) : onSelectVariant(item.value)}
            >
              <Text style={[styles.itemText, selectedVal===item.value && styles.itemTextSelected]}>{item.label}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
      <View style={styles.footer}>
        {step!=='make' && (
          <TouchableOpacity style={[styles.navBtn, styles.secondary]} onPress={()=> setStep(step==='variant' ? 'model' : 'make')}>
            <Text style={[styles.btnText, { color: COLORS.primary }]}>Back</Text>
          </TouchableOpacity>
        )}
        {step!=='variant' && (
          <TouchableOpacity style={styles.navBtn} onPress={()=> setStep(step==='make' ? 'model' : 'variant')}>
            <Text style={styles.btnText}>Next</Text>
          </TouchableOpacity>
        )}
        {step==='variant' && (
          <TouchableOpacity style={styles.navBtn} onPress={onDone}>
            <Text style={styles.btnText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor: COLORS.white },
  header:{ padding:16, borderBottomWidth:1, borderBottomColor: COLORS.lightGray },
  headerTitle:{ fontSize:18, fontWeight:'bold', color: COLORS.black },
  searchRow:{ padding:12 },
  input:{ borderWidth:1, borderColor: COLORS.lightGray, borderRadius:8, paddingHorizontal:12, paddingVertical:10 },
  list:{ padding:12 },
  item:{ paddingVertical:12, paddingHorizontal:16, borderBottomWidth:1, borderBottomColor: COLORS.lightGray, borderRadius:6, marginBottom:8 },
  itemSelected:{ backgroundColor:'#F1F5FF', borderColor: COLORS.primary, borderWidth:1 },
  itemText:{ fontSize:16, color: COLORS.black },
  itemTextSelected:{ color: COLORS.primary, fontWeight:'600' },
  footer:{ flexDirection:'row', gap:12, padding:12, borderTopWidth:1, borderTopColor: COLORS.lightGray, justifyContent:'flex-end' },
  navBtn:{ backgroundColor: COLORS.primary, paddingVertical:12, paddingHorizontal:18, borderRadius:8 },
  secondary:{ backgroundColor: 'transparent', borderWidth:1, borderColor: COLORS.primary },
  btnText:{ color:'#fff', fontWeight:'600' }
})

export default BuyCarforMeBrandFlowScreen
