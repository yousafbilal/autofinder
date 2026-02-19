import React, { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import { COLORS } from "../../constants/colors"
import { pakistaniCities } from "../../Components/EnhancedDropdownData"

const BuyCarforMeCityScreen = () => {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const returnTo = (route.params && route.params.returnTo) || 'BuyCarforMe'
  const [loading, setLoading] = useState(true)
  const [cities, setCities] = useState<string[]>([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    // Use local data instead of API call
    setCities(pakistaniCities)
    setLoading(false)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cities
    return cities.filter(c => c.toLowerCase().includes(q))
  }, [query, cities])

  const handleSelect = (city: string) => {
    navigation.navigate(returnTo, { selectedRegistrationCity: city })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Select Registration City</Text></View>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search city"
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
      </View>
      {loading ? (
        <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="small" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.item} onPress={()=>handleSelect(item)}>
              <Text style={styles.itemText}>{item}</Text>
            </TouchableOpacity>
          )}
          keyboardShouldPersistTaps="handled"
        />
      )}
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

export default BuyCarforMeCityScreen
