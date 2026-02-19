import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { API_URL } from '../../config';

interface BikePremiumRequest {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  packageType: string;
  packageCategory: string;
  status: string;
  purchaseDate: string;
  expiryDate: string;
  isActive: boolean;
  adminNotes: string;
  approvedAt: string;
  rejectedAt: string;
  daysRemaining: number;
  isExpired: boolean;
}

const AdminBikePremiumDashboard: React.FC = () => {
  const [requests, setRequests] = useState<BikePremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/bike-premium-requests`);
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching bike premium requests:', error);
      Alert.alert('Error', 'Failed to fetch bike premium requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(userId);
      
      const response = await fetch(`${API_URL}/admin/approve-bike-premium/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminNotes: 'Approved by admin',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Bike premium package approved successfully');
        fetchRequests(); // Refresh the list
      } else {
        Alert.alert('Error', data.message || 'Failed to approve package');
      }
    } catch (error) {
      console.error('Error approving package:', error);
      Alert.alert('Error', 'Failed to approve package');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    Alert.alert(
      'Reject Package',
      'Are you sure you want to reject this package?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(userId);
              
              const response = await fetch(`${API_URL}/admin/reject-bike-premium/${userId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  adminNotes: 'Rejected by admin',
                }),
              });

              const data = await response.json();

              if (response.ok) {
                Alert.alert('Success', 'Bike premium package rejected');
                fetchRequests(); // Refresh the list
              } else {
                Alert.alert('Error', data.message || 'Failed to reject package');
              }
            } catch (error) {
              console.error('Error rejecting package:', error);
              Alert.alert('Error', 'Failed to reject package');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string, isExpired: boolean) => {
    if (isExpired) return '#FF6B6B';
    switch (status) {
      case 'pending': return '#FFA500';
      case 'approved': return '#4ECDC4';
      case 'active': return '#45B7D1';
      case 'rejected': return '#FF6B6B';
      case 'expired': return '#95A5A6';
      default: return '#95A5A6';
    }
  };

  const getStatusIcon = (status: string, isExpired: boolean) => {
    if (isExpired) return 'clock-o';
    switch (status) {
      case 'pending': return 'hourglass-half';
      case 'approved': return 'check-circle';
      case 'active': return 'play-circle';
      case 'rejected': return 'times-circle';
      case 'expired': return 'clock-o';
      default: return 'question-circle';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CD0100" />
        <Text style={styles.loadingText}>Loading bike premium requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome name="motorcycle" size={24} color="#CD0100" />
        <Text style={styles.headerTitle}>Bike Premium Management</Text>
        <TouchableOpacity onPress={fetchRequests} style={styles.refreshButton}>
          <FontAwesome name="refresh" size={20} color="#CD0100" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No bike premium requests found</Text>
          </View>
        ) : (
          requests.map((request, index) => (
            <View key={index} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{request.userName}</Text>
                  <Text style={styles.userEmail}>{request.userEmail}</Text>
                  <Text style={styles.userPhone}>{request.userPhone}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status, request.isExpired) }]}>
                  <FontAwesome name={getStatusIcon(request.status, request.isExpired)} size={12} color="#fff" />
                  <Text style={styles.statusText}>
                    {request.isExpired ? 'EXPIRED' : request.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.packageInfo}>
                <Text style={styles.packageType}>
                  {request.packageType.toUpperCase()} Package ({request.packageCategory})
                </Text>
                <Text style={styles.dateInfo}>
                  Purchased: {formatDate(request.purchaseDate)}
                </Text>
                <Text style={styles.dateInfo}>
                  Expires: {formatDate(request.expiryDate)}
                </Text>
                {!request.isExpired && (
                  <Text style={styles.daysRemaining}>
                    {request.daysRemaining > 0 
                      ? `${request.daysRemaining} days remaining`
                      : 'Expires today'
                    }
                  </Text>
                )}
              </View>

              {request.adminNotes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Admin Notes:</Text>
                  <Text style={styles.notesText}>{request.adminNotes}</Text>
                </View>
              )}

              {request.status === 'pending' && !request.isExpired && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.approveButton, actionLoading === request.userId && styles.loadingButton]}
                    onPress={() => handleApprove(request.userId)}
                    disabled={actionLoading === request.userId}
                  >
                    {actionLoading === request.userId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <FontAwesome name="check" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.rejectButton, actionLoading === request.userId && styles.loadingButton]}
                    onPress={() => handleReject(request.userId)}
                    disabled={actionLoading === request.userId}
                  >
                    {actionLoading === request.userId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <FontAwesome name="times" size={16} color="#fff" />
                        <Text style={styles.buttonText}>Reject</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageInfo: {
    marginBottom: 10,
  },
  packageType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dateInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  daysRemaining: {
    fontSize: 12,
    color: '#CD0100',
    fontWeight: '600',
  },
  notesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 5,
  },
  loadingButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AdminBikePremiumDashboard;
