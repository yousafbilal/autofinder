// Enhanced dropdown data with comprehensive options

// Pakistani Cities - Complete Master Database (100+ Cities with GB & AJK)
export const pakistaniCities = [
  // Major Cities
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", 
  "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad", "Sargodha",
  "Bahawalpur", "Sukkur", "Abbottabad", "Mardan", "Swat", "Kasur",
  "Sheikhupura", "Okara", "Jhang", "Larkana", "Rahim Yar Khan", "Gujrat",
  "Dera Ghazi Khan", "Mirpur", "Muzaffarabad", "Nawabshah", "Chiniot",
  "Khairpur", "Charsadda", "Nowshera",   "Kohat", "Karak", "Bannu", "Dera Ismail Khan",
  "Haripur", "Kamoke", "Turbat", "Gwadar", "Hub", "Jacobabad", "Khuzdar",
  "Mansehra", "Attock", "Hassan Abdal", "Lodhran", "Toba Tek Singh", "Jhelum",
  "Kharian", "Wazirabad", "Pakpattan", "Shikarpur", "Badin", "Thatta",
  "Matiari", "Hala", "Mianwali", "Bhakkar", "Hafizabad", "Khanewal",
  "Sadiqabad", "Ghotki", "Kotri", "Shahdadpur", "Umerkot", "Sanghar",
  "Dadu", "Tando Adam", "Tando Allahyar", "Moro", "Khairpur Nathan Shah",
  "Rohri", "Chaman", "Zhob", "Loralai", "Pishin", "Kalat", "Sibi", "Vehari",
  "Arifwala", "Khanpur", "Kot Addu", "Muzaffargarh", "Jatoi", "Chishtian",
  "Hasilpur", "Muridke", "Kaswal", "Mandi Bahauddin", "Narowal", "Shorkot",
  "Jaranwala", "Pattoki",
  // Gilgit Baltistan
  "Gilgit", "Skardu", "Hunza", "Nagar", "Ghizer", "Astore", "Diamer",
  // Azad Kashmir
  "Mirpur AJK", "Kotli AJK", "Rawalakot", "Bagh AJK", "Bhimber"
].sort((a, b) => a.localeCompare(b)); // Sort alphabetically

// Pakistani Locations/Areas - Complete Database with Sublocations
export const pakistaniLocations: { [key: string]: string[] } = {
  "Karachi": [
    "DHA 1", "DHA 2", "DHA 3", "DHA 4", "DHA 5", "DHA 6", "DHA 7", "DHA 8",
    "DHA Phase 1", "DHA Phase 2", "DHA Phase 3", "DHA Phase 4", "DHA Phase 5",
    "DHA Phase 6", "DHA Phase 7", "DHA Phase 8", "DHA City",
    "Clifton", "Clifton Block 1", "Clifton Block 2", "Clifton Block 3",
    "Clifton Block 4", "Clifton Block 5", "Clifton Block 6", "Clifton Block 7",
    "Clifton Block 8", "Clifton Block 9", "Clifton Beach",
    "PECHS", "PECHS Block 1", "PECHS Block 2", "PECHS Block 3",
    "PECHS Block 4", "PECHS Block 5", "PECHS Block 6",
    "Gulshan-e-Iqbal", "Gulshan-e-Iqbal Block 1", "Gulshan-e-Iqbal Block 2",
    "Gulshan-e-Iqbal Block 3", "Gulshan-e-Iqbal Block 4", "Gulshan-e-Iqbal Block 5",
    "Gulshan-e-Iqbal Block 6", "Gulshan-e-Iqbal Block 7", "Gulshan-e-Iqbal Block 8",
    "Gulshan-e-Iqbal Block 9", "Gulshan-e-Iqbal Block 10", "Gulshan-e-Iqbal Block 11",
    "Gulshan-e-Iqbal Block 12", "Gulshan-e-Iqbal Block 13",
    "Johar", "Gulistan-e-Johar Block 1", "Gulistan-e-Johar Block 2",
    "Gulistan-e-Johar Block 3", "Gulistan-e-Johar Block 4", "Gulistan-e-Johar Block 5",
    "Gulistan-e-Johar Block 6", "Gulistan-e-Johar Block 7", "Gulistan-e-Johar Block 8",
    "Gulistan-e-Johar Block 9", "Gulistan-e-Johar Block 10", "Gulistan-e-Johar Block 11",
    "Gulistan-e-Johar Block 12", "Gulistan-e-Johar Block 13", "Gulistan-e-Johar Block 14",
    "Gulistan-e-Johar Block 15", "Gulistan-e-Johar Block 16", "Gulistan-e-Johar Block 17",
    "Gulistan-e-Johar Block 18", "Gulistan-e-Johar Block 19", "Gulistan-e-Johar Block 20",
    "Nazimabad", "Nazimabad No. 1", "Nazimabad No. 2", "Nazimabad No. 3",
    "Nazimabad No. 4", "Nazimabad No. 5", "Nazimabad No. 6", "Nazimabad No. 7",
    "North Nazimabad", "North Nazimabad Block A", "North Nazimabad Block B",
    "North Nazimabad Block C", "North Nazimabad Block D", "North Nazimabad Block E",
    "North Nazimabad Block F", "North Nazimabad Block G", "North Nazimabad Block H",
    "North Nazimabad Block I", "North Nazimabad Block J", "North Nazimabad Block K",
    "North Nazimabad Block L", "North Nazimabad Block M", "North Nazimabad Block N",
    "North Nazimabad Block O", "North Nazimabad Block P", "North Nazimabad Block Q",
    "North Nazimabad Block R", "North Nazimabad Block S", "North Nazimabad Block T",
    "North Karachi", "North Karachi Sectors 7D", "North Karachi Sectors 7E",
    "North Karachi Sectors 8", "North Karachi Sectors 9", "North Karachi Sectors 10",
    "North Karachi Sectors 11A", "North Karachi Sectors 11B",
    "Saddar", "Malir Cantt", "Malir", "Scheme 33", "Scheme 42",
    "Korangi", "Korangi 1", "Korangi 2", "Korangi 3", "Korangi 4", "Korangi 5", "Korangi 6",
    "Landhi", "Lyari", "Bahadurabad", "Federal B Area", "Federal B Area Block 1",
    "Federal B Area Block 2", "Federal B Area Block 3", "Federal B Area Block 4",
    "Federal B Area Block 5", "Federal B Area Block 6", "Federal B Area Block 7",
    "Federal B Area Block 8", "Federal B Area Block 9", "Federal B Area Block 10",
    "Federal B Area Block 11", "Federal B Area Block 12", "Federal B Area Block 13",
    "Federal B Area Block 14", "Federal B Area Block 15", "Federal B Area Block 16",
    "Federal B Area Block 17", "Federal B Area Block 18", "Federal B Area Block 19",
    "Federal B Area Block 20", "Federal B Area Block 21",
    "Tariq Road", "Surjani Town", "BTK – Bahria Town Karachi",
    "Gadap Town", "Baldia Town", "Shah Faisal Colony", "Green Town",
    "Orangi Town Sector 1", "Orangi Town Sector 2", "Orangi Town Sector 3",
    "Orangi Town Sector 4", "Orangi Town Sector 5", "Orangi Town Sector 6",
    "Orangi Town Sector 7", "Orangi Town Sector 8", "Orangi Town Sector 9",
    "Orangi Town Sector 10", "Orangi Town Sector 11", "Orangi Town Sector 12",
    "Orangi Town Sector 13", "Orangi Town Sector 14", "Orangi Town Sector 15",
    "Orangi Town Sector 16", "Kharadar", "Mithadar", "Garden East", "Garden West",
    "Defence View", "Mehmoodabad", "Ancholi", "Sohrab Goth", "Safoora Chowrangi",
    "NIPA Chowrangi", "New Karachi Sector 5A", "New Karachi Sector 6", "New Karachi Sector 7",
    "New Karachi Sector 8", "New Karachi Sector 9", "New Karachi Sector 10",
    "New Karachi Sector 11", "Super Highway Corridor", "Manora", "Keamari", "Hawksbay"
  ],
  "Lahore": [
    "DHA 1", "DHA 2", "DHA 3", "DHA 4", "DHA 5", "DHA 6", "DHA 7", "DHA 8",
    "DHA 9", "DHA 10", "DHA 11", "DHA 12", "DHA 13",
    "DHA Phase 1", "DHA Phase 2", "DHA Phase 3", "DHA Phase 4", "DHA Phase 5",
    "DHA Phase 6", "DHA Phase 7", "DHA Phase 8", "DHA Phase 9", "DHA Phase 10",
    "DHA Phase 11", "DHA Phase 12", "DHA Phase 13",
    "Bahria Town", "Bahria Town Sector A", "Bahria Town Sector B", "Bahria Town Sector C",
    "Bahria Town Sector D", "Bahria Town Sector E", "Bahria Town Sector F",
    "Johar Town", "Johar Town Phase 1", "Johar Town Phase 2",
    "Model Town", "Model Town Block A", "Model Town Block B", "Model Town Block C",
    "Model Town Block D", "Model Town Block E", "Model Town Block F", "Model Town Block G",
    "Model Town Block H", "Model Town Block I", "Model Town Block J", "Model Town Block K",
    "Gulberg", "Gulberg I", "Gulberg II", "Gulberg III",
    "Garden Town", "Iqbal Town", "Valencia", "Lake City", "Bahria Orchard",
    "Bahria Orchard Phase 1", "Bahria Orchard Phase 2", "Bahria Orchard Phase 3",
    "Bahria Orchard Phase 4", "Township", "Cantt", "Mall Road",
    "Faisal Town", "Allama Iqbal Town", "Shalimar", "Mughalpura", "Sabzazar",
    "Samanabad", "PCSIR Phase 1", "PCSIR Phase 2", "EME Society", "Valencia Town",
    "Wapda Town", "Park View Villas", "Eden Villas", "Canal Road Belt",
    "Liberty Market", "Zaman Park", "Raiwind Road", "Bedian Road",
    "Khuda Buksh Colony", "Walton", "Green Town", "Bahria Education & Medical City"
  ],
  "Islamabad": [
    "F-6", "F-7", "F-8", "F-10", "F-11", "F-12", "G-5", "G-6", "G-7", "G-8",
    "G-9", "G-10", "G-11", "G-13", "G-14", "G-15", "E-7", "E-8", "E-9", "E-11",
    "I-8", "I-9", "I-10", "I-11", "I-12", "I-14", "I-16", "D-12", "D-17",
    "Blue Area", "Bahria Enclave", "DHA Islamabad", "Bahria Town Phase 1",
    "Bahria Town Phase 2", "Bahria Town Phase 3", "Bahria Town Phase 4",
    "Bahria Town Phase 5", "Bahria Town Phase 6", "Bahria Town Phase 7",
    "Bahria Town Phase 8", "Gulberg", "B-17 Multi Gardens", "Chak Shahzad",
    "Naval Anchorage", "Park View City", "Top City-1", "Capital Smart City",
    "Red Zone", "Diplomatic Enclave", "Park Road", "Lehtarar Road", "Tarlai",
    "Nilore", "Gulberg Greens", "Gulberg Residencia", "Mumtaz City", "Faisal Town",
    "PECHS Housing", "PWD", "Soan Garden", "Pakistan Town", "Media Town",
    "Doctors Town", "Airport Green Garden", "Koral Chowk", "Kahuta Road", "H-8",
    "H-9", "H-10", "H-11"
  ],
  "Rawalpindi": [
    "Saddar", "Commercial Market", "Satellite Town", "Satellite Town Block B",
    "Satellite Town Block C", "Satellite Town Block D", "Satellite Town Block E",
    "Satellite Town Block F", "Shamsabad", "Bahria Town Phase 1", "Bahria Town Phase 2",
    "Bahria Town Phase 3", "Bahria Town Phase 4", "Bahria Town Phase 5",
    "Bahria Town Phase 6", "Bahria Town Phase 7", "Bahria Town Phase 8",
    "DHA Phase 1", "DHA Phase 2", "DHA Phase 3", "Chaklala Scheme 1",
    "Chaklala Scheme 2", "Chaklala Scheme 3", "Lalazar", "Peshawar Road",
    "Murree Road", "Raja Bazaar", "Adiala Road", "Chakri Road", "Westridge",
    "Westridge 1", "Westridge 2", "Westridge 3", "Tulsa Road", "Harley Street",
    "Tench Bhatta", "Dhamial", "Gulraiz 1", "Gulraiz 2", "Gulraiz 3",
    "Askari 1", "Askari 2", "Askari 3", "Askari 4", "Askari 5", "Askari 6",
    "Askari 7", "Askari 8", "Askari 9", "Askari 10", "Askari 11", "Askari 12",
    "Askari 13", "Askari 14", "Dhoke Kashmirian", "Dhoke Hassu", "Dhoke Ratta",
    "Committee Chowk", "Sadiqabad", "Khayaban-e-Sir Syed"
  ],
  "Faisalabad": [
    "D Ground", "Madina Town", "Jaranwala Road", "Canal Road", "Wapda City",
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Multan": [
    "DHA Multan", "Cantt", "Bosan Road", "Wapda Town", "Gulgasht Colony",
    "Buch Villas", "City Center", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Peshawar": [
    "Hayatabad Phase 1", "Hayatabad Phase 2", "Hayatabad Phase 3", "Hayatabad Phase 4",
    "Hayatabad Phase 5", "Hayatabad Phase 6", "Hayatabad Phase 7", "University Town",
    "Saddar", "Gulbahar", "Board Bazaar", "Ring Road", "Cantonment", "Warsak Road",
    "Regi Model Town", "Cantt", "Tehkal", "Hashtnagri", "Karkhano Market",
    "Pajagi Road", "Kohat Road", "Dalazak Road", "Charsadda Road", "Safiabad",
    "City Center", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Quetta": [
    "Jinnah Town", "Sariab Road", "Cantt", "Satellite Town", "Hazara Town",
    "City Center", "Model Town", "Industrial Area"
  ],
  "Sialkot": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Gujranwala": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Hyderabad": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Sargodha": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Bahawalpur": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Sukkur": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Abbottabad": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Mardan": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Swat": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Kasur": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Sheikhupura": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Okara": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Jhang": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Larkana": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Rahim Yar Khan": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Gujrat": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Dera Ghazi Khan": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Mirpur": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Muzaffarabad": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Nawabshah": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Chiniot": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Khairpur": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Charsadda": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Nowshera": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Kohat": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Karak": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Bannu": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Dera Ismail Khan": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Haripur": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Kamoke": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Turbat": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Gwadar": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Hub": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Jacobabad": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Khuzdar": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Mansehra": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Attock": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Hassan Abdal": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Lodhran": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Toba Tek Singh": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Jhelum": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Kharian": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Wazirabad": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Pakpattan": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Shikarpur": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Badin": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Thatta": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Matiari": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Hala": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Mianwali": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Bhakkar": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Hafizabad": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Khanewal": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Sadiqabad": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Ghotki": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Kotri": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Shahdadpur": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Umerkot": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Sanghar": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Dadu": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Tando Adam": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Tando Allahyar": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Moro": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Khairpur Nathan Shah": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Rohri": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Chaman": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Zhob": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Loralai": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Pishin": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Kalat": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Sibi": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Vehari": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Arifwala": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Khanpur": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Kot Addu": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Muzaffargarh": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Jatoi": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Chishtian": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Hasilpur": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Muridke": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Kaswal": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Mandi Bahauddin": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Narowal": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Shorkot": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Jaranwala": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  "Pattoki": [
    "City Center", "Cantt Area", "Model Town", "Satellite Town", "Industrial Area"
  ],
  // Gilgit Baltistan
  "Gilgit": [
    "Danyore", "Baseen", "Konodas", "Kashroute", "Sonikote", "Jutial",
    "Zulfiqarabad", "Sakwar", "Nomal Valley", "Oshikhandass", "Minawar",
    "Sultanabad", "Hunza Road Belt"
  ],
  "Skardu": [
    "Hussainabad", "Sadpara Road", "Airport Road", "Gamba Skardu", "Shigar Road",
    "Satpara Lake Road"
  ],
  "Hunza": [
    "Karimabad", "Aliabad", "Ganish", "Altit", "Baltit Fort Area", "Gulmit (Upper Hunza)"
  ],
  "Nagar": [
    "Hoper Valley", "Minapin", "Ghulmet"
  ],
  "Ghizer": [
    "Gahkuch", "Phander", "Ishkoman Valley"
  ],
  "Astore": [
    "Gorikot", "Astore Bazar", "Tarishing"
  ],
  "Diamer": [
    "Chilas", "Thak Das", "Darel Valley", "Tangir Valley"
  ],
  // Azad Kashmir
  "Muzaffarabad": [
    "Upper Chattar", "Lower Plate", "Bank Road", "Chehla Bandi", "Domel",
    "Naluchi", "Pir Chinasi Road"
  ],
  "Mirpur AJK": [
    "Sector F-1", "Sector D-4", "Allama Iqbal Road", "Airport Road",
    "Mian Muhammad Road", "New City"
  ],
  "Kotli AJK": [
    "Fatehpur", "Khuiratta Road", "Gulhar Sharif", "Model Town"
  ],
  "Rawalakot": [
    "Poonch Road", "Khawaja Mohalla", "Banjosa", "Dreak Road"
  ],
  "Bagh AJK": [
    "Dhirkot Road", "Hari Ghel", "Baloch", "Suddhan Gali"
  ],
  "Bhimber": [
    "Barnala", "Samahni", "Chowki", "Bhimber City"
  ]
};

// Comprehensive Car Features
export const carFeatures = [
  // Safety Features
  "Airbags", "ABS (Anti-lock Braking System)", "EBD (Electronic Brake Distribution)",
  "ESP (Electronic Stability Program)", "Traction Control", "Hill Start Assist",
  "Blind Spot Monitoring", "Lane Departure Warning", "Forward Collision Warning",
  "Rear Cross Traffic Alert", "Parking Sensors", "Parking Camera", "360° Camera",
  "Tire Pressure Monitoring", "Child Safety Locks", "Seat Belt Warning",
  "Door Ajar Warning", "Speed Sensing Door Lock", "Central Locking",
  
  // Exterior Features
  "Alloy Wheels", "Steel Wheels", "Chrome Grille", "Fog Lights", "LED Headlights",
  "Xenon Headlights", "Daytime Running Lights (DRL)", "Automatic Headlights",
  "Headlight Washer", "Power Adjustable Mirrors", "Heated Mirrors",
  "Power Folding Mirrors", "Body Colored Bumpers", "Chrome Door Handles",
  "Body Colored Door Handles", "Sunroof", "Moonroof", "Panoramic Sunroof",
  "Roof Rails", "Side Steps", "Rear Spoiler", "Rear Wiper", "Rain Sensing Wipers",
  "Automatic Wipers", "Tinted Windows", "Privacy Glass",
  
  // Interior Features
  "Leather Seats", "Fabric Seats", "Heated Seats", "Ventilated Seats",
  "Power Adjustable Seats", "Memory Seats", "Lumbar Support", "Armrest",
  "Cup Holders", "Glove Compartment", "Center Console", "Door Pockets",
  "Cargo Net", "Cargo Cover", "Cargo Organizer", "Floor Mats",
  "Carpeted Floor", "Wooden Trim", "Carbon Fiber Trim", "Chrome Trim",
  "Ambient Lighting", "Mood Lighting", "Reading Lights", "Map Lights",
  
  // Entertainment & Technology
  "Touchscreen Display", "Navigation System", "GPS", "Bluetooth", "USB Port",
  "AUX Port", "CD Player", "DVD Player", "Radio", "AM/FM Radio",
  "Satellite Radio", "Apple CarPlay", "Android Auto", "WiFi", "Hotspot",
  "Wireless Charging", "Multiple USB Ports", "HDMI Port", "Rear Entertainment",
  "Headphone Jacks", "Premium Sound System", "Bose Audio", "Harman Kardon",
  "JBL Audio", "Infinity Audio", "Subwoofer", "Amplifier",
  
  // Climate Control
  "Air Conditioning"
];

// Essential Bike Features (30 most important)
export const bikeFeatures = [
  // Safety Features (8)
  "ABS (Anti-lock Braking System)", "CBS (Combined Braking System)", "Traction Control",
  "Stability Control", "Hill Start Assist", "Emergency Stop Signal", "Hazard Lights",
  "Side Stand Indicator",
  
  // Lighting Features (6)
  "LED Headlamp", "LED Tail Light", "LED Turn Signals", "LED Daytime Running Lights",
  "Auto Headlight", "Fog Lights",
  
  // Digital & Technology Features (6)
  "Digital Console", "TFT Display", "Bluetooth Connectivity", "USB Charging Port",
  "Navigation System", "GPS",
  
  // Performance Features (4)
  "Slipper Clutch", "Quick Shifter", "Ride Modes", "Launch Control",
  
  // Comfort Features (6)
  "Adjustable Suspension", "Adjustable Seat Height", "Windshield", "Heated Grips",
  "Storage Compartment", "Under Seat Storage"
];

// Body Types
export const bodyTypes = [
  "Sedan", "Hatchback", "SUV", "Crossover", "Coupe", "Convertible",
  "Wagon", "Estate", "Pickup", "Truck", "Van", "Minivan", "MPV",
  "Sports Car", "Supercar", "Hypercar", "Luxury Car", "Executive Car",
  "Compact Car", "Mid-size Car", "Full-size Car", "Subcompact Car",
  "Micro Car", "City Car", "Roadster", "Spyder", "Targa", "Hardtop",
  "Liftback", "Fastback", "Notchback", "Kammback", "Shooting Brake"
];

// Fuel Types
export const fuelTypes = [
  "Petrol", "Diesel", "Hybrid", "Electric", "CNG", "LPG", "Bio-diesel",
  "E85", "E10", "E15", "E20", "E85", "Methanol", "Ethanol", "Hydrogen"
];

// Transmission Types
export const transmissionTypes = [
  "Manual", "Automatic", "CVT", "Semi-Automatic", "DCT", "DSG", "PDK",
  "Tiptronic", "Sequential", "Paddle Shift", "Torque Converter"
];

// Assembly Types
export const assemblyTypes = [
  "Local", "Imported", "CBU", "CKD", "SKD", "Reconditioned", "Used Import"
];

// Engine Capacities
export const engineCapacities = [
  "600cc", "660cc", "800cc", "1000cc", "1100cc", "1200cc", "1300cc",
  "1400cc", "1500cc", "1600cc", "1700cc", "1800cc", "1900cc", "2000cc",
  "2100cc", "2200cc", "2300cc", "2400cc", "2500cc", "2600cc", "2700cc",
  "2800cc", "2900cc", "3000cc", "3200cc", "3500cc", "4000cc", "4500cc",
  "5000cc", "5500cc", "6000cc", "6500cc", "7000cc", "8000cc"
];

// Colors
export const carColors = [
  "White", "Black", "Silver", "Gray", "Red", "Blue", "Green", "Yellow",
  "Orange", "Purple", "Brown", "Gold", "Champagne", "Pearl White",
  "Metallic Black", "Metallic Silver", "Metallic Gray", "Metallic Red",
  "Metallic Blue", "Metallic Green", "Metallic Gold", "Matte Black",
  "Matte Gray", "Matte Red", "Matte Blue", "Two-Tone", "Custom Color"
];

// Condition
export const conditions = [
  "Excellent", "Very Good", "Good", "Fair", "Poor", "Accident Damaged",
  "Flood Damaged", "Fire Damaged", "Hail Damaged", "Vandalized", "Stolen Recovery"
];

// Usage Types
export const usageTypes = [
  "Personal Use", "Commercial Use", "Rental", "Taxi", "Uber/Careem",
  "Delivery", "Government", "Diplomatic", "Military", "Police", "Ambulance"
];

// Insurance Status
export const insuranceStatus = [
  "Insured", "Not Insured", "Expired", "Third Party", "Comprehensive",
  "Act Only", "Fully Covered", "Partial Coverage"
];

// Financing Options
export const financingOptions = [
  "Cash", "Bank Loan", "Leasing", "Installments", "Exchange", "Part Exchange",
  "Bank Transfer", "Cheque", "Easy Installments", "Zero Down Payment"
];

// Seller Types
export const sellerTypes = [
  "Individual", "Dealer", "Showroom", "Authorized Dealer", "Private Seller",
  "Car Dealer", "Auto Dealer", "Used Car Dealer", "Import Dealer"
];

// Export Data
export const enhancedDropdownData = {
  cities: pakistaniCities,
  locations: pakistaniLocations,
  features: carFeatures,
  bodyTypes,
  fuelTypes,
  transmissionTypes,
  assemblyTypes,
  engineCapacities,
  colors: carColors,
  conditions,
  usageTypes,
  insuranceStatus,
  financingOptions,
  sellerTypes
};

export default enhancedDropdownData;
