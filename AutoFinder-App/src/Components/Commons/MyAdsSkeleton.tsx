import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

const MyAdsSkeleton = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {[...Array(3)].map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.image} />
          <View style={styles.content}>
            <View style={styles.title} />
            <View style={styles.price} />
            <View style={styles.detailsRow}>
              <View style={styles.detailBox} />
              <View style={styles.detailBox} />
              <View style={styles.detailBox} />
            </View>
            <View style={styles.footer}>
              <View style={styles.date} />
              <View style={styles.statusBadge} />
            </View>
            <View style={styles.actions}>
              <View style={styles.actionBtn} />
              <View style={styles.actionBtn} />
              <View style={styles.actionBtn} />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const grey = '#E0E0E0';

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: grey,
  },
  content: {
    padding: 12,
  },
  title: {
    width: '80%',
    height: 20,
    backgroundColor: grey,
    borderRadius: 4,
    marginBottom: 10,
  },
  price: {
    width: '40%',
    height: 20,
    backgroundColor: grey,
    borderRadius: 4,
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailBox: {
    width: 70,
    height: 14,
    backgroundColor: grey,
    borderRadius: 4,
    marginRight: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  date: {
    width: 100,
    height: 14,
    backgroundColor: grey,
    borderRadius: 4,
  },
  statusBadge: {
    width: 60,
    height: 18,
    backgroundColor: grey,
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: '30%',
    height: 30,
    backgroundColor: grey,
    borderRadius: 6,
  },
});

export default MyAdsSkeleton;
