import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

LocaleConfig.locales["en"] = {
  monthNames: [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ],
  monthNamesShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  dayNames:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  dayNamesShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
};
LocaleConfig.defaultLocale = "en";

interface CarAvailabilityCalendarProps {
  onChange?: (data: {
    type: "day" | "week" | "month" | null;
    selected: string[];
  }) => void;
}

const CarAvailabilityCalendar: React.FC<CarAvailabilityCalendarProps> = ({ onChange }) => {
  const today = new Date();
  const [availabilityType, setAvailabilityType] = useState<"day" | "week" | "month" | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  const availabilityOptions = ["Day", "Week", "Month"];

  // Call onChange whenever selection changes
  const updateParent = (type: "day" | "week" | "month", selected: string[]) => {
    onChange && onChange({ type, selected });
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => {
      const newSelection = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      updateParent("day", newSelection);
      return newSelection;
    });
  };

  const toggleWeek = (date: string) => {
    const startOfWeek = getStartOfWeek(date);
    setSelectedWeeks(prev => {
      const newSelection = prev.includes(startOfWeek) ? prev.filter(w => w !== startOfWeek) : [...prev, startOfWeek];
      updateParent("week", newSelection);
      return newSelection;
    });
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => {
      const newSelection = prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month];
      updateParent("month", newSelection);
      return newSelection;
    });
  };

  const getStartOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const upcomingMonths = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    upcomingMonths.push(`${d.getFullYear()}-${d.getMonth() + 1}`);
  }

  const renderSelectedItems = (type: "day" | "week" | "month") => {
    let data: string[] = [];
    let label: string = "";
    if (type === "day") { data = selectedDays; label = "Selected Days"; }
    if (type === "week") { data = selectedWeeks; label = "Selected Weeks"; }
    if (type === "month") { data = selectedMonths; label = "Selected Months"; }

    if (data.length === 0) return null;

    return (
      <View style={{ marginTop: 12, }}>
        <Text style={{ fontWeight: "600", marginBottom: 6 }}>{label}:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {data.map((item, index) => {
            // Ensure key is always a string
            const itemKey = typeof item === 'string' ? item : (typeof item === 'object' && item?.toString ? String(item.toString()) : `item-${index}`);
            let displayText = item;
            if (type === "month") {
              const [year, month] = item.split("-");
              displayText = new Date(parseInt(year), parseInt(month)-1).toLocaleString('default',{month:'short',year:'numeric'});
            } else if(type==="week") {
              const start = new Date(item);
              const end = new Date(start);
              end.setDate(end.getDate()+6);
              displayText = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
            } else {
              displayText = new Date(item).toLocaleDateString();
            }

            return (
              <View key={itemKey} style={{
                flexDirection: "row",
                backgroundColor: COLORS.primary,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 20,
                marginRight: 8,
                alignItems: "center"
              }}>
                <Text style={{ color: "#fff", marginRight: 6 }}>{displayText}</Text>
                <TouchableOpacity onPress={()=>{
                  if(type==="day") setSelectedDays(prev => prev.filter(d => d!==item));
                  if(type==="week") setSelectedWeeks(prev => prev.filter(w => w!==item));
                  if(type==="month") setSelectedMonths(prev => prev.filter(m => m!==item));
                }}>
                  <Ionicons name="close-circle" size={16} color="#fff"/>
                </TouchableOpacity>
              </View>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  return (
    <ScrollView style={{ padding: 16, backgroundColor: COLORS.background, borderRadius: 15 }}>
      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>Car Availability</Text>

      {/* Availability Type Selector */}
      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        {availabilityOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: availabilityType === option.toLowerCase() ? COLORS.primary : COLORS.border,
              backgroundColor: availabilityType === option.toLowerCase() ? COLORS.primary : COLORS.white,
              marginRight: 10,
            }}
            onPress={() => {
              setAvailabilityType(option.toLowerCase() as any);
              setSelectedDays([]);
              setSelectedWeeks([]);
              setSelectedMonths([]);
            }}
          >
            <Text style={{
              color: availabilityType === option.toLowerCase() ? COLORS.white : COLORS.black,
              fontWeight: "500",
            }}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calendar & Selection */}
      {availabilityType === "day" && (
        <View>
          <Calendar
            minDate={today.toISOString().split("T")[0]}
            onDayPress={(day) => toggleDay(day.dateString)}
            markedDates={selectedDays.reduce((acc, date) => {
              acc[date] = { selected: true, selectedColor: COLORS.primary };
              return acc;
            }, {} as any)}
          />
          {renderSelectedItems("day")}
        </View>
      )}

      {availabilityType === "week" && (
        <View>
          <Calendar
            minDate={today.toISOString().split("T")[0]}
            onDayPress={(day) => toggleWeek(day.dateString)}
            markedDates={selectedWeeks.reduce((acc, start) => {
              const end = new Date(start);
              end.setDate(end.getDate()+6);
              let temp = new Date(start);
              while(temp <= end){
                acc[temp.toISOString().split("T")[0]] = { selected: true, selectedColor: COLORS.primary };
                temp.setDate(temp.getDate()+1);
              }
              return acc;
            }, {} as any)}
          />
          {renderSelectedItems("week")}
        </View>
      )}

      {availabilityType === "month" && (
        <View>
          <FlatList
            data={upcomingMonths}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const [year, month] = item.split("-");
              const monthName = new Date(parseInt(year), parseInt(month)-1).toLocaleString("default", {month:"long"});
              const isSelected = selectedMonths.includes(item);
              return (
                <TouchableOpacity
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    marginRight: 10,
                    backgroundColor: isSelected ? COLORS.primary : COLORS.white,
                    borderWidth: 1,
                    borderColor: isSelected ? COLORS.primary : COLORS.border
                  }}
                  onPress={()=>toggleMonth(item)}
                >
                  <Text style={{ color: isSelected ? "#fff" : COLORS.black, fontWeight: "500" }}>{monthName} {year}</Text>
                </TouchableOpacity>
              )
            }}
          />
          {renderSelectedItems("month")}
        </View>
      )}
    </ScrollView>
  );
};

export default CarAvailabilityCalendar;
