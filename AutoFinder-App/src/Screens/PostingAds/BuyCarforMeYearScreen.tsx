import React, { useMemo, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Keyboard } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { COLORS } from "../../constants/colors"
import { useNavigation, useRoute } from "@react-navigation/native"

const MIN_YEAR = 1900
const MAX_YEAR = 2025

const buildYears = () => {
  const arr: { label: string; value: string }[] = []
  for (let y = MAX_YEAR; y >= MIN_YEAR; y--) arr.push({ label: String(y), value: String(y) })
  return arr
}

const BuyCarforMeYearScreen = () => {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const returnTo = (route.params && route.params.returnTo) || 'BuyCarforMe'
  const years = useMemo(buildYears, [])
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return years
    return years.filter(y => y.value.includes(q))
  }, [query, years])

  const handleSelect = (year: string) => {
    Keyboard.dismiss()
    navigation.navigate("BuyCarforMeBrandFlowScreen", { year, returnTo })
  }

  const renderItem = ({ item }: { item: { label: string; value: string } }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleSelect(item.value)}>
      <Text style={styles.itemText}>{item.label}</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Year</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search or type year (e.g. 2018)"
          keyboardType="number-pad"
          style={styles.input}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.value}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.black },
  searchRow: { padding: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  list: { padding: 12 },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  itemText: { fontSize: 16, color: COLORS.black },
})

export default BuyCarforMeYearScreen
