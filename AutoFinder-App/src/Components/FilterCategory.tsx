import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, FlatList, Dimensions } from "react-native";
import React, { useState, useMemo } from "react";
import {
  carCategoryImages,
  brandImages,
  modelImages,
  cityImages,
  budgetImages,
  bodyTypeImages,
} from "../constants/images";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigationTypes";

type CategoryType = "Category"  | "Brands" | "Model" | "Cities" | "Body Types" | "Budget";

const list: CategoryType[] = ["Category", "Brands", "Model", "Cities", "Budget", "Body Types", ];
const listDropDown: Record<CategoryType, any[]> = {
  Category: [
    {
      image: carCategoryImages.automaticCar,
      title: "Automatic Cars",
    },
    {
      image: carCategoryImages.familyCar,
      title: "Family Cars",
    },
    {
      image: carCategoryImages.fiveSeater,
      title: "5 Seater",
    },
    {
      image: carCategoryImages.imported,
      title: "Imported Cars",
    },
    {
      image: carCategoryImages.oldCar,
      title: "Old Cars",
    },
    {
      image: carCategoryImages.japanese,
      title: "Japanese Cars",
    },
    {
      image: carCategoryImages.lowMileage,
      title: "Low Mileage",
    },
    {
      image: carCategoryImages.jeep,
      title: "Jeep",
    },
    {
      image: carCategoryImages.hybrid,
      title: "Hybrid Cars",
    },
    {
      image: carCategoryImages.fourSeater,
      title: "4 Seater",
    },
  ],
    
  Brands: [
    { image: brandImages.suzuki, title: "Suzuki" },
    { image: brandImages.toyota, title: "Toyota" },
    { image: brandImages.honda, title: "Honda" },
    { image: brandImages.nissan, title: "Nissan" },
    { image: brandImages.hyundai, title: "Hyundai" },
    { image: brandImages.kia, title: "KIA" },
    { image: brandImages.mitsubishi, title: "Mitsubishi" },
    { image: brandImages.mercedes, title: "Mercedes Benz" },
    { image: brandImages.audi, title: "Audi" },
    { image: brandImages.bmw, title: "BMW" },
    { image: brandImages.ford, title: "Ford" },
    { image: brandImages.chevrolet, title: "Chevrolet" },
    { image: brandImages.jeep, title: "Jeep" },
    { image: brandImages.volkswagen, title: "Volkswagen" },
    { image: brandImages.tesla, title: "Tesla" },
    { image: brandImages.landRover, title: "Land Rover" },
    { image: brandImages.mazda, title: "Mazda" },
    { image: brandImages.porsche, title: "Porsche" },
    { image: brandImages.lexus, title: "Lexus" },
    { image: brandImages.volvo, title: "Volvo" },  
  ],
  Model: [
    { image: modelImages.corolla , title: "Corolla" },
    { image: modelImages.civic , title: "Civic" },
    { image: modelImages.mehran , title: "Mehran" },
    { image: modelImages.city , title: "City" },
    { image: modelImages.cultus , title: "Cultus" },
    { image: modelImages.alto , title: "Alto" },
    { image: modelImages.wagonR , title: "Wagon R" },
    { image: modelImages.vitz , title: "Vitz" },
    { image: modelImages.bolan , title: "Bolan" },
    { image: modelImages.swift , title: "Swift" },
  ],  
  Cities: [
    { image: cityImages.lahore, title: "Lahore" },
    { image: cityImages.karachi, title: "Karachi" },
    { image: cityImages.islamabad, title: "Islamabad" },
    { image: cityImages.rawalpindi, title: "Rawalpindi" },
    { image: cityImages.faisalabad, title: "Faisalabad" },
    { image: cityImages.multan, title: "Multan" },
    { image: cityImages.gujranwala, title: "Gujranwala" },
    { image: cityImages.sialkot, title: "Sialkot" },
    { image: cityImages.sargodha, title: "Sargodha" },
    { image: cityImages.peshawar, title: "Peshawar" },
    
  ], 
  Budget: [
    { image: budgetImages.cash, title: "Under 5 Lakh" },
    { image: budgetImages.cash, title: "5-10 Lakh" },
    { image: budgetImages.cash, title: "10-20 Lakh" },
    { image: budgetImages.cash, title: "20-30 Lakh" },
    { image: budgetImages.cash, title: "30-40 Lakh" },
    { image: budgetImages.cash, title: "40-50 Lakh" },
    { image: budgetImages.cash, title: "50-60 Lakh" },
    { image: budgetImages.cash, title: "60-70 Lakh" },
    { image: budgetImages.cash, title: "70-80 Lakh" },
    { image: budgetImages.cash, title: "80 Lakh - 1 Crore" },
    { image: budgetImages.cash, title: "1-1.5 Crore" },
    { image: budgetImages.cash, title: "1.5-2 Crore" },
    { image: budgetImages.cash, title: "Above 2 Crore" },
  ], 
  "Body Types": [
    { image: bodyTypeImages.hatchback, title: "Hatchback" },
    { image: bodyTypeImages.highRoofSingle, title: "High Roof Single Cabin" },
    { image: bodyTypeImages.sedan, title: "Sedan" },
    { image: bodyTypeImages.suv, title: "SUV" },
    { image: bodyTypeImages.crossover, title: "Crossover" },
    { image: bodyTypeImages.miniVan, title: "Mini Van" },
    { image: bodyTypeImages.van, title: "Van" },
    { image: bodyTypeImages.mpv, title: "MPV" },
    { image: bodyTypeImages.microVan, title: "Micro Van" },
    { image: bodyTypeImages.compactSedan, title: "Compact sedan" },
    { image: bodyTypeImages.doubleCabin, title: "Double Cabin" },
    { image: bodyTypeImages.compactSUV, title: "Compact SUV" },
    { image: bodyTypeImages.pickUp, title: "Pick Up" },
    { image: bodyTypeImages.stationWagon, title: "Station Wagon" },
    { image: bodyTypeImages.coupe, title: "Coupe" },
    { image: bodyTypeImages.mini, title: "Mini Vehicles" },
    { image: bodyTypeImages.truck, title: "Truck" },
    { image: bodyTypeImages.convertible, title: "Convertible" },
    { image: bodyTypeImages.highRoof, title: "High Roof" },
    { image: bodyTypeImages.offRoad, title: "Off Road Vehicles" },
    { image: bodyTypeImages.compactHatchback, title: "Compact Hatchback" },
  ],
};

const FilterCategory = () => {
  const [selectedCat, setSelectedCat] = useState<CategoryType>("Category");
  const [selectedType, setSelectedType] = useState(""); // e.g. "BMW" or "Corolla"
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Optimize: Memoize the data chunking
  const pages = useMemo(() => {
    const chunkArray = (arr: any[], size: number) => {
      const result = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    };
    return chunkArray(listDropDown[selectedCat], 8);
  }, [selectedCat]);

  const [currentPage, setCurrentPage] = useState(0);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        const filterValue = item.title;
        let filterType = "model"; // default
        if (selectedCat === "Brands") filterType = "brand";
        else if (selectedCat === "Body Types") filterType = "bodyType";
        else if (selectedCat === "Model") filterType = "model";
        else if (selectedCat === "Cities") filterType = "city";
        else if (selectedCat === "Budget") filterType = "budget";
        else if (selectedCat === "Category") filterType = "category";

        navigation.navigate("CarListScreen", {
          filterType,
          filterValue,
        });
      }}
    >
      <Image source={item.image} style={styles.brandImage} />
      <Text style={styles.text}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderPage = ({ item: page }: { item: any[] }) => (
    <View style={styles.pageContainer}>
      <FlatList
        data={page}
        renderItem={renderItem}
        keyExtractor={(item, index) => {
          try {
            // Ensure title is always a string
            const title = item?.title;
            if (title) {
              if (typeof title === 'string') return `${title}-${index}`;
              if (typeof title === 'number') return `title-${title}-${index}`;
              if (typeof title === 'object' && title.toString) return `${String(title.toString())}-${index}`;
            }
            return `item-${index}`;
          } catch (error) {
            return `item-${index}-${Date.now()}`;
          }
        }}
        numColumns={4}
        scrollEnabled={false}
        contentContainerStyle={styles.gridContainer}
        removeClippedSubviews={true}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={2}
      />
    </View>
  );

  const onScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const pageWidth = event.nativeEvent.layoutMeasurement.width;
    const currentPageIndex = Math.round(scrollPosition / pageWidth);
    setCurrentPage(currentPageIndex);
  };

  return (
    <View>
      <ScrollView
        horizontal
        style={{ paddingHorizontal: 12 }}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingRight: 0 }}
      >
        {list.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.listItem}
            onPress={() => {
              setSelectedCat(item);
              setSelectedType("");
              setCurrentPage(0);
            }}
          >
            <View
              style={{
                paddingBottom: 8,
                borderBottomWidth: selectedCat === item ? 3 : 0,
                borderBottomColor: "#CD0100",
              }}
            >
              <Text>{item}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.swiperContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          bounces={false}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingRight: 0 }}
        >
          {pages.map((page, pageIndex) => (
            <View key={pageIndex} style={styles.pageWrapper}>
              {renderPage({ item: page })}
            </View>
          ))}
        </ScrollView>
        
        {/* Custom pagination dots */}
        {pages.length > 1 && (
          <View style={styles.pagination}>
            {pages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentPage === index && styles.activeDot,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listItem: {
    padding: 12,
    marginRight: 1,
  },
  swiperContainer: {
    height: 260,
  },
  pageWrapper: {
    width: Dimensions.get('window').width, // Full width for pagination
  },
  pageContainer: {
    width: '100%',
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingRight: 12,
  },
  swiperContent: {
    height: 300,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginHorizontal: 12,
    width: "100%",
  },
  card: {
    height: 100,
    width: "25%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    backgroundColor: "white",
    borderRadius: 12,
  },
  text: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 11,
  },
  tab: {
    display: "flex",
    width: "48%",
    marginTop: 12,
  },
  brandImage: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "gray",
    marginHorizontal: 3,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#CD0100",
  },
});

export default FilterCategory;
