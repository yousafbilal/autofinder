import React, { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { bikeFeatures } from "../../Components/EnhancedDropdownData"

const ALL_FEATURE_KEYS: string[] = bikeFeatures

const humanize = (key: string) => key.replace(/([A-Z])/g, " $1").trim().replace(/^\w/, c => c.toUpperCase())

const FeaturesSelectorScreen = () => {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const preselected: string[] = (route.params && route.params.preselected) || []
  const returnTo: string = (route.params && route.params.returnTo) || 'PostCarAdFeatured'

  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set(preselected))

  useEffect(() => {
    // ensure only valid keys remain
    setSelected(prev => new Set(Array.from(prev).filter(k => ALL_FEATURE_KEYS.includes(k))))
  }, [])

  const filteredKeys = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_FEATURE_KEYS
    return ALL_FEATURE_KEYS.filter(k => humanize(k).toLowerCase().includes(q))
  }, [query])

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const onDone = () => {
    navigation.navigate(returnTo, { selectedFeatures: Array.from(selected) })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Features</Text>
        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={COLORS.darkGray} style={{ marginRight:8 }} />
          <TextInput
            placeholder="Search features"
            value={query}
            onChangeText={setQuery}
            style={styles.input}
          />
        </View>
        {selected.size > 0 && (
          <View style={{ paddingHorizontal:12, paddingBottom:8, flexDirection:'row', flexWrap:'wrap' }}>
            {Array.from(selected).map((k) => (
              <View key={k} style={styles.chip}>
                <Text style={styles.chipText}>{humanize(k)}</Text>
                <TouchableOpacity onPress={() => toggle(k)} style={{ marginLeft:6 }}>
                  <Text style={{ color: COLORS.primary }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <FlatList
          data={filteredKeys}
          keyExtractor={(k) => k}
          renderItem={({ item }) => {
            const isOn = selected.has(item)
            return (
              <TouchableOpacity style={styles.item} onPress={() => toggle(item)}>
                <Ionicons
                  name={isOn ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isOn ? COLORS.primary : COLORS.darkGray}
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.itemText}>{humanize(item)}</Text>
              </TouchableOpacity>
            )
          }}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: COLORS.white },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, borderBottomWidth:1, borderBottomColor: COLORS.lightGray },
  headerTitle: { fontSize:18, fontWeight:'bold', color: COLORS.black },
  doneButton: { paddingHorizontal:12, paddingVertical:8, backgroundColor: COLORS.primary, borderRadius:8 },
  doneText: { color: COLORS.white, fontWeight:'600' },
  searchRow: { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:10 },
  input: { flex:1, borderWidth:1, borderColor: COLORS.lightGray, borderRadius:8, paddingHorizontal:12, paddingVertical:8 },
  item: { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor: COLORS.lightGray },
  itemText: { fontSize:16, color: COLORS.black },
  chip: { flexDirection:'row', alignItems:'center', backgroundColor:'#EAF1FF', paddingHorizontal:12, paddingVertical:6, borderRadius:20, marginRight:8, marginBottom:8 },
  chipText: { color: COLORS.black },
})

export default FeaturesSelectorScreen


