import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AssignedItem = {
  inspectionId: string;
  adId: string;
  title?: string;
  location?: string;
  scheduledAt?: string;
};

const AssignedJobsScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<AssignedItem[]>([]);
  const [inspectorId, setInspectorId] = useState<string | null>(null);

  const fetchAssigned = async () => {
    try {
      setLoading(true);
      const inspectorRaw = await AsyncStorage.getItem("inspector");
      const userRaw = await AsyncStorage.getItem("user");
      const inspector = inspectorRaw ? JSON.parse(inspectorRaw) : null;
      const user = userRaw ? JSON.parse(userRaw) : null;
      // Prefer explicit inspectorId fields; fallback to userId
      let id = inspector?.inspectorId || inspector?.inspector_id || inspector?._id || user?.inspectorId || user?.inspector_id || null;
      const headers: any = {};
      const token = await AsyncStorage.getItem("token");
      if (token) headers.Authorization = `Bearer ${token}`;

      // If still missing, try resolving from backend using token
      if (!id && token) {
        try {
          const meRes = await fetch(`${API_URL}/inspectors/me`, { headers });
          if (meRes.ok) {
            const me = await meRes.json();
            id = me?.inspectorId || me?._id || me?.id || null;
          }
        } catch {}
      }

      setInspectorId(id || null);
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const assignedUrl = id ? `${API_URL}/api/inspection/assigned?inspectorId=${encodeURIComponent(id)}` : `${API_URL}/api/inspection/assigned`;
      const res = await fetch(assignedUrl, { headers });
      const data = await res.json();
      if (Array.isArray(data?.items)) {
        setItems(data.items);
      } else if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAssigned(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchAssigned(); };

  if (loading) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex:1, padding:16 }}>
      <Text style={{ fontSize:18, fontWeight:'700', marginBottom:12 }}>Assigned Inspections</Text>
      <FlatList
        data={items}
        keyExtractor={(it) => it.inspectionId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={{ padding:12, borderWidth:1, borderColor:'#DDD', borderRadius:8, marginBottom:10 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ChecklistScreen', { inspectionId: item.inspectionId, adId: item.adId, title: item.title, location: item.location })}
            >
              <Text style={{ fontWeight:'600' }}>{item.title || item.adId}</Text>
              {!!item.location && <Text style={{ color:'#666' }}>{item.location}</Text>}
              {!!item.scheduledAt && <Text style={{ color:'#666', marginTop:4 }}>Scheduled: {new Date(item.scheduledAt).toLocaleString()}</Text>}
              {item.status === 'Completed' && (
                <Text style={{ color:'#28a745', marginTop:4, fontWeight:'600' }}>✓ Completed</Text>
              )}
            </TouchableOpacity>
            
            {item.status === 'Completed' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('InspectionReportView', { inspectionId: item.inspectionId })}
                style={{ 
                  marginTop: 8, 
                  backgroundColor: '#CD0100', 
                  padding: 8, 
                  borderRadius: 5, 
                  alignSelf: 'flex-start' 
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>View Report</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={{ color:'#666' }}>No assigned inspections.</Text>}
      />
    </View>
  );
};

export default AssignedJobsScreen;


