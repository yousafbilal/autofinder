import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Modal, Platform, Linking } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { getInspectionReport } from "../../api/inspections";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { API_URL } from "../../../config";

const InspectionReportViewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, any>, string>>();
  const { inspectionId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [inspectionId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const result = await getInspectionReport(inspectionId);
      if (result.success && result.data) {
        setReport(result.data);
      } else {
        Alert.alert("Error", result.message || "Failed to fetch inspection report");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch inspection report");
    } finally {
      setLoading(false);
    }
  };

  // Calculate category percentage from legacy checklist fields (same logic as PDF)
  const calculateCategoryPct = (categoryName: string, checklistData: any): number => {
    if (!checklistData || typeof checklistData !== 'object') return 0;
    
    if (categoryName === 'Engine / Transmission / Clutch') {
      const engineKeys = ['engineOilLevel', 'engineOilLeakage', 'transmissionOilLeakage', 'coolantLeakage', 'brakeOilLeakage'];
      let engineScore = 0;
      engineKeys.forEach(key => {
        const value = checklistData[key];
        if (value) {
          if (value === 'Complete and Clean') engineScore += 20;
          else if (value === 'Low') engineScore += 15;
          else if (value === 'Dirty') engineScore += 10;
          else if (value === 'Needs Change') engineScore += 0;
          else if (value === 'No Leakage') engineScore += 20;
          else if (value === 'Minor Leakage') engineScore += 15;
          else if (value === 'Major Leakage') engineScore += 10;
          else if (value === 'Severe Leakage') engineScore += 0;
          else if (value === 'Good') engineScore += 20;
          else if (value === 'Fair') engineScore += 15;
          else if (value === 'Poor' || value === 'Critical') engineScore += 0;
        }
      });
      const totalPossibleScore = engineKeys.length * 20;
      return totalPossibleScore > 0 ? Math.round((engineScore / totalPossibleScore) * 100) : 0;
    }
    else if (categoryName === 'Brakes') {
      const keys = ['frontRightDisc','frontLeftDisc','frontRightBrakePad','frontLeftBrakePad','parkingHandBrake'];
      let totalScore = 0;
      keys.forEach(key => {
        const value = checklistData[key];
        if (value) {
          if (value === 'Smooth' || value === 'More than 50%' || value === 'Ok') totalScore += 20;
          else if (value === 'Rough' || value === 'Less than 50%' || value === 'Needs Adjustment') totalScore += 10;
          else if (value === 'Damaged' || value === 'Needs Replacement' || value === 'Not Ok') totalScore += 0;
          else if (value === 'Working' || value === 'Good') totalScore += 20;
          else if (value === 'Fair' || value === '25-50%' || value === 'Minor Issues' || value === 'Needs Attention') totalScore += 10;
          else if (value === 'Less than 25%' || value === 'Not Working' || value === 'Poor') totalScore += 0;
        }
      });
      const totalPossibleScore = keys.length * 20;
      return totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0;
    }
    else if (categoryName === 'Suspension/Steering') {
      const keys = ['steeringWheelPlay','rightBallJoint','leftBallJoint','rightZLinks','leftZLinks','rightTieRodEnd','leftTieRodEnd','frontRightBoots','frontLeftBoots','frontRightBushes','frontLeftBushes','frontRightShock','frontLeftShock','rearRightBushes','rearLeftBushes','rearRightShock','rearLeftShock'];
      let totalScore = 0;
      keys.forEach(key => {
        const value = checklistData[key];
        if (value) {
          if (value === 'Ok' || value === 'No Damage Found') totalScore += 20;
          else if (value === 'Not Ok' || value === 'Damage Found') totalScore += 10;
          else if (value === 'Needs Replacement' || value === 'Need Replacement' || value === 'Excessive Play') totalScore += 0;
          else if (value === 'Good' || value === 'Working' || value === 'Smooth') totalScore += 20;
          else if (value === 'Fair' || value === 'Minor Issues' || value === 'Needs Attention' || value === 'Slight Play') totalScore += 10;
          else if (value === 'Poor' || value === 'Major Issues' || value === 'Not Working' || value === 'Damaged') totalScore += 0;
        }
      });
      const totalPossibleScore = keys.length * 20;
      return totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0;
    }
    else if (categoryName === 'Interior') {
      const keys = ['seats', 'dashboard', 'carpet', 'headliner', 'electronics', 'climate','steeringWheelCondition', 'steeringWheelButtons', 'horn', 'lightsLeverSwitch', 'wiperWasherLever','rightSideMirror', 'leftSideMirror', 'rearViewMirrorDimmer','rightSeatAdjusterRecliner', 'leftSeatAdjusterRecliner', 'rightSeatAdjusterLearTrack', 'leftSeatAdjusterLearTrack','rightSeatBelt', 'leftSeatBelt', 'rearSeatBelts', 'gloveBox','frontRightPowerWindow', 'frontLeftPowerWindow', 'rearRightPowerWindow', 'rearLeftPowerWindow','centralLocking', 'interiorLightings', 'dashControlsAC', 'dashControlsDeFog', 'dashControlsHazardLights','dashControlsOthers', 'audioVideo', 'rearViewCamera', 'trunkReleaseLever', 'fuelCapReleaseLever','bonnetReleaseLever', 'sunRoofControlButton'];
      let totalScore = 0;
      let totalFields = keys.length;
      keys.forEach(key => {
        const value = checklistData[key];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          totalScore += 0;
          return;
        }
        if (value === 'Ok' || value === 'Good' || value === 'Working' || value === 'Excellent' || value === 'Working Properly' || value === 'Showing Reflection' || value === 'Perfect' || value === 'Present' || value === 'Complete') {
          totalScore += 100;
        } else if (value === 'Fair' || value === 'Minor Issues' || value === 'Needs Attention') {
          totalScore += 50;
        } else if (value === 'Poor' || value === 'Major Issues' || value === 'Not Working' || value === 'Bad' || value === 'Missing' || value === 'Not Present') {
          totalScore += 0;
        }
      });
      return Math.round((totalScore / (totalFields * 100)) * 100);
    }
    else if (categoryName === 'AC / Heater') {
      const keys = ['acFitted', 'acOperational', 'blower', 'cooling', 'heating'];
      let totalScore = 0;
      keys.forEach(key => {
        const value = checklistData[key];
        if (value) {
          if (value === 'Yes' || value === 'Excellent Air Throw' || value === 'Excellent' || value === 'Working') totalScore += 100;
          else if (value === 'Fair' || value === 'Good Air Throw' || value === 'Good' || value === 'Minor Issues') totalScore += 50;
          else if (value === 'No' || value === 'Poor Air Throw' || value === 'Poor' || value === 'Not Working') totalScore += 0;
        }
      });
      const totalPossibleScore = keys.length * 100;
      return totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0;
    }
    else if (categoryName === 'Electrical & Electronics') {
      const keys = ['computerCheck', 'batteryWarningLight', 'oilPressureLowWarningLight', 'temperatureWarningLightGauge','airBagWarningLight', 'powerSteeringWarningLight', 'absWarningLight', 'keyFobBatteryLowLight','batteryVoltage', 'batteryTerminalsCondition', 'batteryCharging', 'alternatorOperation', 'gauges'];
      let totalScore = 0;
      let totalFields = keys.length;
      keys.forEach(key => {
        const value = checklistData[key];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          totalScore += 0;
          return;
        }
        if (key === 'computerCheck') {
          if (value === 'Ok') totalScore += 100;
          else if (value === 'Fault Found') totalScore += 0;
          else if (value === 'Not Checked') totalScore += 50;
        } else if (['batteryWarningLight', 'oilPressureLowWarningLight', 'temperatureWarningLightGauge', 'airBagWarningLight', 'powerSteeringWarningLight', 'absWarningLight', 'keyFobBatteryLowLight'].includes(key)) {
          if (value === 'Not Present') totalScore += 100;
          else if (value === 'Present') totalScore += 0;
        } else if (key === 'batteryVoltage') {
          const voltage = parseFloat(String(value));
          if (voltage >= 12.6) totalScore += 100;
          else if (voltage >= 12.0) totalScore += 70;
          else if (voltage >= 11.5) totalScore += 40;
          else totalScore += 0;
        } else if (key === 'batteryTerminalsCondition') {
          if (value === 'Ok') totalScore += 100;
          else if (value === 'Corroded' || value === 'Loose') totalScore += 30;
        } else if (key === 'batteryCharging') {
          if (value === 'Ok') totalScore += 100;
          else if (value === 'Not Charging') totalScore += 0;
        } else if (key === 'alternatorOperation') {
          if (value === 'Ok') totalScore += 100;
          else if (value === 'Not Ok') totalScore += 0;
        } else if (key === 'gauges') {
          if (value === 'Working') totalScore += 100;
          else if (value === 'Not Working') totalScore += 0;
        }
      });
      return Math.round((totalScore / (totalFields * 100)) * 100);
    }
    else if (categoryName === 'Exterior & Body') {
      const bodyFrameKeys = ['radiatorCoreSupport','rightStrutTowerApron','leftStrutTowerApron','rightFrontRail','leftFrontRail','cowlPanelFirewall','rightAPillar','leftAPillar','rightBPillar','leftBPillar','rightCPillar','leftCPillar','bootFloor','bootLockPillar','rearSubFrame','frontSubFrame'];
      let bodyFrameScore = 0;
      bodyFrameKeys.forEach(key => {
        const value = checklistData[key];
        if (value) {
          if (value === 'OK') bodyFrameScore += 100;
          else if (value === 'Repair') bodyFrameScore += 50;
          else if (value === 'Damage') bodyFrameScore += 0;
        }
      });
      const bodyFrameTotal = bodyFrameKeys.length * 100;
      const bodyFramePct = bodyFrameTotal > 0 ? (bodyFrameScore / bodyFrameTotal) * 100 : 0;
      const exteriorKeys = ['trunkLock', 'frontWindshieldCondition', 'rearWindshieldCondition', 'frontRightDoorWindow','frontLeftDoorWindow', 'rearRightDoorWindow', 'rearLeftDoorWindow', 'windscreenWiper', 'sunRoofGlass','rightHeadlightWorking', 'leftHeadlightWorking', 'rightHeadlightCondition', 'leftHeadlightCondition','rightTaillightWorking', 'leftTaillightWorking', 'rightTaillightCondition', 'leftTaillightCondition', 'fogLightsWorking'];
      let exteriorScore = 0;
      exteriorKeys.forEach(key => {
        const value = checklistData[key];
        if (value) {
          if (['trunkLock', 'frontWindshieldCondition', 'rearWindshieldCondition', 'frontRightDoorWindow','frontLeftDoorWindow', 'rearRightDoorWindow', 'rearLeftDoorWindow', 'sunRoofGlass'].includes(key)) {
            if (value === 'Ok') exteriorScore += 100;
            else if (value === 'Not Ok') exteriorScore += 30;
            else if (value === 'Damaged' || value === 'Cracked') exteriorScore += 0;
          } else if (key === 'windscreenWiper') {
            if (value === 'Cleaning Properly') exteriorScore += 100;
            else if (value === 'Not Working') exteriorScore += 0;
            else if (value === 'Needs Replacement') exteriorScore += 20;
          } else if (['rightHeadlightWorking', 'leftHeadlightWorking', 'rightTaillightWorking', 'leftTaillightWorking', 'fogLightsWorking'].includes(key)) {
            if (value === 'Working') exteriorScore += 100;
            else if (value === 'Not Working') exteriorScore += 0;
          } else if (['rightHeadlightCondition', 'leftHeadlightCondition', 'rightTaillightCondition', 'leftTaillightCondition'].includes(key)) {
            if (value === 'Ok' || value === 'Good' || value === 'Perfect') exteriorScore += 100;
            else if (value === 'Fair') exteriorScore += 50;
            else if (value === 'Damaged') exteriorScore += 0;
          }
        }
      });
      const exteriorTotal = exteriorKeys.length * 100;
      const exteriorPct = exteriorTotal > 0 ? (exteriorScore / exteriorTotal) * 100 : 0;
      return Math.round((bodyFramePct + exteriorPct) / 2);
    }
    else if (categoryName === 'Tyres') {
      const selectionKeys = ['frontRightTyreBrand', 'frontRightTyreTread', 'frontLeftTyreBrand', 'frontLeftTyreTread','rearRightTyreBrand', 'rearRightTyreTread', 'rearLeftTyreBrand', 'rearLeftTyreTread','wheelCaps'];
      let totalScore = 0;
      let totalFields = selectionKeys.length;
      selectionKeys.forEach(key => {
        const value = checklistData[key];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          totalScore += 0;
          return;
        }
        if (key.includes('Brand')) {
          totalScore += 100;
        } else if (key.includes('Tread')) {
          const valStr = String(value);
          if (valStr.includes('8mm+') || valStr.includes('Excellent')) totalScore += 100;
          else if (valStr.includes('6-8mm') || valStr.includes('Good')) totalScore += 75;
          else if (valStr.includes('4-6mm') || valStr.includes('Fair')) totalScore += 50;
          else if (valStr.includes('2-4mm') || valStr.includes('Poor')) totalScore += 25;
          else if (valStr.includes('1-2mm') || valStr.includes('Critical')) totalScore += 10;
          else if (valStr.includes('Below 1mm') || valStr.includes('Dangerous')) totalScore += 0;
        } else if (key === 'wheelCaps') {
          if (value === 'Present') totalScore += 100;
          else if (value === 'Missing') totalScore += 0;
        }
      });
      return Math.round((totalScore / (totalFields * 100)) * 100);
    }
    return 0;
  };

  const handleViewPDF = async () => {
    if (!inspectionId) {
      Alert.alert("Error", "Inspection ID not available");
      return;
    }

    try {
      // Get PDF URL from backend
      const response = await fetch(`${API_URL}/api/inspection/${inspectionId}/pdf`);
      const data = await response.json();
      
      let pdfUrlToOpen = '';
      if (data.success && data.pdfUrl) {
        pdfUrlToOpen = data.pdfUrl;
      } else {
        // Fallback to admin panel URL
        pdfUrlToOpen = `${API_URL.replace('/api', '')}/dashboard/inspector?inspectionId=${inspectionId}&generatePdf=true`;
      }

      // Open PDF in browser
      const canOpen = await Linking.canOpenURL(pdfUrlToOpen);
      if (canOpen) {
        await Linking.openURL(pdfUrlToOpen);
      } else {
        Alert.alert("Error", "Cannot open PDF URL");
      }
    } catch (error: any) {
      console.error("Error opening PDF:", error);
      Alert.alert("Error", error.message || "Failed to open PDF");
    }
  };

  const handleDownloadPDF = async () => {
    if (!report || !inspectionId) {
      Alert.alert("Error", "Report data not available");
      return;
    }

    try {
      setDownloading(true);
      
      // First, get the PDF URL from backend
      const response = await fetch(`${API_URL}/api/inspection/${inspectionId}/pdf`);
      const data = await response.json();
      
      if (!data.success || !data.pdfUrl) {
        throw new Error(data.message || "Failed to get PDF URL");
      }

      // Download PDF file
      const fileUri = FileSystem.documentDirectory + `inspection_report_${inspectionId}.pdf`;
      const downloadResult = await FileSystem.downloadAsync(data.pdfUrl, fileUri);
      
      if (downloadResult.uri) {
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Download Inspection Report',
            UTI: 'com.adobe.pdf'
          });
          Alert.alert("Success", "PDF downloaded successfully!");
        } else {
          Alert.alert("Success", `PDF saved to: ${downloadResult.uri}`);
        }
      } else {
        throw new Error("Download failed");
      }
    } catch (error: any) {
      console.error("Download error:", error);
      Alert.alert("Error", error.message || "Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#CD0100" />
        <Text style={{ marginTop: 10 }}>Loading inspection report...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No inspection report found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 10, backgroundColor: '#CD0100', borderRadius: 5 }}>
          <Text style={{ color: 'white' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate overall score and section ratings (same as PDF)
  const detailedChecklists = {
    'Engine / Transmission / Clutch': report.engineTransmissionChecklist,
    'Brakes': report.brakesChecklist,
    'Suspension/Steering': report.suspensionSteeringChecklist,
    'Interior': report.interiorChecklist,
    'AC / Heater': report.acHeaterChecklist,
    'Electrical & Electronics': report.electricalElectronicsChecklist,
    'Exterior & Body': {
      ...(report.bodyFrameChecklist || {}),
      ...(report.exteriorBodyChecklist || {})
    },
    'Tyres': report.tyresChecklist
  };
  
  const categoryScores: number[] = [];
  Object.entries(detailedChecklists).forEach(([categoryName, checklistData]: [string, any]) => {
    const percentage = calculateCategoryPct(categoryName, checklistData);
    categoryScores.push(percentage);
  });
  
  const calculatedOverallScore = categoryScores.length > 0 
    ? categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length 
    : (report.overallScore || 0);

  // Section name mapping
  const sectionNames: Record<string, string> = {
    'Engine / Transmission / Clutch': "ENGINE / TRANSMISSION / CLUTCH",
    'Brakes': "BRAKES",
    'Suspension/Steering': "SUSPENSION / STEERING",
    'Interior': "INTERIOR",
    'AC / Heater': "AC / HEATER",
    'Electrical & Electronics': "ELECTRICAL & ELECTRONICS",
    'Exterior & Body': "EXTERIOR & BODY",
    'Tyres': "TYRES"
  };

  // Get photos from photosMeta
  const photosMeta = report.photosMeta || [];
  const photosByItemId: Record<string, string[]> = {};
  photosMeta.forEach((photo: any) => {
    if (photo.itemId && photo.url) {
      if (!photosByItemId[photo.itemId]) {
        photosByItemId[photo.itemId] = [];
      }
      photosByItemId[photo.itemId].push(photo.url);
    }
  });

  // Helper function to get all field values from a checklist
  const getChecklistFields = (checklistData: any): Array<{ key: string; value: string }> => {
    if (!checklistData || typeof checklistData !== 'object') return [];
    return Object.entries(checklistData)
      .filter(([key, value]) => value && String(value).trim() !== '')
      .map(([key, value]) => ({ key, value: String(value) }));
  };

  return (
    <>
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#CD0100' }}>Car Inspection Report</Text>
        <Text style={{ fontSize: 16, color: '#666', marginTop: 5 }}>AutoFinder • For Help: +923348400943</Text>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>Scan to Verify after submit</Text>
      </View>

      {/* Car Image */}
        {report.carImageUrl && (
          <Image 
            source={{ uri: report.carImageUrl }} 
            style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 16 }} 
            resizeMode="cover"
          />
        )}

        {/* Vehicle Details */}
      <View style={{ backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Vehicle Details</Text>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Make: <Text style={{ fontWeight: '600', color: '#000' }}>{report.make || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Model: <Text style={{ fontWeight: '600', color: '#000' }}>{report.model || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Year: <Text style={{ fontWeight: '600', color: '#000' }}>{report.year || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Variant: <Text style={{ fontWeight: '600', color: '#000' }}>{report.variant || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Engine Capacity: <Text style={{ fontWeight: '600', color: '#000' }}>{report.engineCapacity || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Mileage: <Text style={{ fontWeight: '600', color: '#000' }}>{report.kmDriven ? `${report.kmDriven.toLocaleString()} km` : 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Transmission: <Text style={{ fontWeight: '600', color: '#000' }}>{report.transmissionType || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Fuel Type: <Text style={{ fontWeight: '600', color: '#000' }}>{report.fuelType || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Color: <Text style={{ fontWeight: '600', color: '#000' }}>{report.color || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Chassis No: <Text style={{ fontWeight: '600', color: '#000' }}>{report.chassisNo || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Engine No: <Text style={{ fontWeight: '600', color: '#000' }}>{report.engineNo || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Registration No: <Text style={{ fontWeight: '600', color: '#000' }}>{report.registrationNo || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Location: <Text style={{ fontWeight: '600', color: '#000' }}>{report.location || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginBottom: 5 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Registered City: <Text style={{ fontWeight: '600', color: '#000' }}>{report.registeredCity || 'N/A'}</Text></Text>
          </View>
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Inspection Date: <Text style={{ fontWeight: '600', color: '#000' }}>{new Date(report.createdAt).toLocaleDateString()}</Text></Text>
          </View>
      </View>

        {/* Overall Rating */}
      <View style={{ backgroundColor: '#e8f5e8', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Overall Rating</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#CD0100', marginRight: 10 }}>
              {(calculatedOverallScore / 10).toFixed(1)}/10
            </Text>
            <View style={{ flex: 1, height: 20, backgroundColor: '#ddd', borderRadius: 10, overflow: 'hidden' }}>
              <View 
                style={{ 
                  height: '100%',
                  width: `${calculatedOverallScore}%`,
                  backgroundColor: calculatedOverallScore >= 70 ? '#28a745' : 
                                  calculatedOverallScore >= 50 ? '#ff9800' : '#d32f2f'
                }} 
              />
          </View>
        </View>
          <Text style={{ fontSize: 14, color: '#666' }}>Overall Rating: {calculatedOverallScore.toFixed(1)}%</Text>
          {report.overallRating && (
            <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>Verdict: {report.overallRating}</Text>
        )}
      </View>

        {/* Section Ratings */}
        {Object.entries(detailedChecklists).map(([categoryName, checklistData]: [string, any]) => {
          const percentage = calculateCategoryPct(categoryName, checklistData);
          if (percentage === 0 && !checklistData) return null;

          const fields = getChecklistFields(checklistData);
          if (fields.length === 0) return null;

        return (
            <View key={categoryName} style={{ marginBottom: 20, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 15 }}>
            <TouchableOpacity 
                onPress={() => setExpanded(prev => prev === categoryName ? null : categoryName)} 
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}
            >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 }}>
                    {sectionNames[categoryName] || categoryName.toUpperCase()}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#CD0100', marginRight: 10 }}>
                      {percentage}%
                    </Text>
                    <View style={{ flex: 1, height: 8, backgroundColor: '#ddd', borderRadius: 4, overflow: 'hidden' }}>
                      <View 
                        style={{ 
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: percentage >= 70 ? '#28a745' : 
                                          percentage >= 50 ? '#ff9800' : '#d32f2f'
                        }} 
                      />
                    </View>
                  </View>
                </View>
                <Text style={{ color: '#999', fontSize: 20, marginLeft: 10 }}>
                  {expanded === categoryName ? '▼' : '►'}
              </Text>
            </TouchableOpacity>

              {expanded === categoryName && (
                <View style={{ marginTop: 10 }}>
                  {fields.map((field) => {
                    const itemPhotos = photosByItemId[field.key] || [];
                    return (
                      <View key={field.key} style={{ marginBottom: 15, padding: 10, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 5 }}>
                          {field.key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                          {field.value}
                      </Text>
                        
                        {/* Photos for this item */}
                        {itemPhotos.length > 0 && (
                          <View style={{ marginTop: 10 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 5 }}>Photos:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              {itemPhotos.map((photoUrl: string, index: number) => (
                            <Image 
                              key={index}
                              source={{ uri: photoUrl }} 
                                  style={{ width: 100, height: 100, borderRadius: 8, marginRight: 8 }} 
                                  resizeMode="cover"
                            />
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                    );
                  })}
              </View>
            )}
          </View>
        );
      })}

        {/* All Photos Section */}
        {photosMeta.length > 0 && (
          <View style={{ marginBottom: 20, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 15 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10 }}>All Inspection Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photosMeta.map((photo: any, index: number) => (
                <Image 
                  key={index}
                  source={{ uri: photo.url }} 
                  style={{ width: 120, height: 120, borderRadius: 8, marginRight: 8 }} 
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ marginTop: 20, marginBottom: 40, gap: 10 }}>
          <TouchableOpacity 
            onPress={handleViewPDF}
            style={{ 
              backgroundColor: '#2196F3', 
              padding: 15, 
              borderRadius: 8, 
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>📄 View PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleDownloadPDF}
            disabled={downloading}
            style={{ 
              backgroundColor: downloading ? '#999' : '#28a745', 
              padding: 15, 
              borderRadius: 8, 
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {downloading ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Downloading...</Text>
              </>
            ) : (
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>⬇️ Download PDF</Text>
            )}
          </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={{ 
          backgroundColor: '#CD0100', 
          padding: 15, 
          borderRadius: 8, 
              alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Back</Text>
      </TouchableOpacity>
        </View>
    </ScrollView>
    </>
  );
};

export default InspectionReportViewScreen;
