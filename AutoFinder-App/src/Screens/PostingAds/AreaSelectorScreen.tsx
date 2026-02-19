import React, { useMemo, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import { COLORS } from "../../constants/colors"
import { pakistaniLocations } from "../../Components/EnhancedDropdownData"

const AreaSelectorScreen = () => {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const city: string = (route.params && route.params.city) || ""
  const returnTo: string = (route.params && route.params.returnTo) || 'PostCarAdFeatured'

  const allAreas: string[] = ((pakistaniLocations as Record<string, string[]>)[city] || []).slice().sort((a, b) => a.localeCompare(b))
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allAreas
    return allAreas.filter(a => a.toLowerCase().includes(q))
  }, [query, city])

  const handleSelect = (area: string) => {
    navigation.navigate(returnTo, { selectedArea: area })
  }

  if (!city) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.headerTitle}>Select Area</Text></View>
        <View style={{ padding:16 }}><Text style={{ color: COLORS.darkGray }}>Please select a city first.</Text></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Select Area - {city}</Text></View>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search area"
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.item} onPress={()=>handleSelect(item)}>
            <Text style={styles.itemText}>{item}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={{ padding:16 }}><Text style={{ color: COLORS.darkGray }}>No areas found.</Text></View>}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor: COLORS.white },
  header:{ padding:16, borderBottomWidth:1, borderBottomColor: COLORS.lightGray },
  headerTitle:{ fontSize:18, fontWeight:'bold', color: COLORS.black },
  searchRow:{ padding:12 },
  input:{ borderWidth:1, borderColor: COLORS.lightGray, borderRadius:8, paddingHorizontal:12, paddingVertical:10 },
  item:{ paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor: COLORS.lightGray },
  itemText:{ fontSize:16, color: COLORS.black },
})

export default AreaSelectorScreen


