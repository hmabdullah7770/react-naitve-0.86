import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

const ProfileContent2 = ({ isOwner, userData, isLoading, isError }) => {
  const [activeTab, setActiveTab] = useState('Network');

  const tabs = ['Network', 'Posts (120)', 'Shop', 'Reviews'];

  // Mock mutual connections data - replace with actual data from API
  const mutualConnections = [
    {
      id: '1',
      name: 'Marcus Chen',
      role: 'Creative Director @ Studio',
      avatar: 'https://via.placeholder.com/50',
      isMutual: true,
      isFollowing: true,
    },
    {
      id: '2',
      name: 'Sarah Jenkins',
      role: 'Luxury Goods Buyer',
      avatar: 'https://via.placeholder.com/50',
      isMutual: true,
      isFollowing: false,
    },
    {
      id: '3',
      name: 'Julian Darko',
      role: 'Sustainability Expert',
      avatar: 'https://via.placeholder.com/50',
      isMutual: true,
      isFollowing: true,
    },

    {
      id: '3',
      name: 'Julian Darko',
      role: 'Sustainability Expert',
      avatar: 'https://via.placeholder.com/50',
      isMutual: true,
      isFollowing: true,
    },{
      id: '4',
      name: 'Julian Darko',
      role: 'Sustainability Expert',
      avatar: 'https://via.placeholder.com/50',
      isMutual: true,
      isFollowing: true,
    },{
      id: '5',
      name: 'Julian Darko',
      role: 'Sustainability Expert',
      avatar: 'https://via.placeholder.com/50',
      isMutual: true,
      isFollowing: true,
    },{
      id: '6',
      name: 'Julian Darko',
      role: 'Sustainability Expert',
      avatar: 'https://via.placeholder.com/50',
      isMutual: true,
      isFollowing: true,
    },{
      id: '7',
      name: 'Julian Darko',
      role: 'Sustainability Expert',
      avatar: 'https://via.placeholder.com/50',
      isMutual: true,
      isFollowing: true,
    },
  

   {
      id: '10',
      name: 'Julian Darko',
      role: 'Sustainability Expert',
      avatar: 'https://via.placeholder.com/50',
      isMutual: true,
      isFollowing: true,
    },{
      id: '11',
      name: 'Julian Darko',
      role: 'Sustainability Expert',
      avatar: 'https://via.placeholder.com/50',
      isMutual: true,
      isFollowing: true,
    },


];

  const renderTabItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.tabItem, activeTab === item && styles.activeTabItem]}
      onPress={() => setActiveTab(item)}
    >
      <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>
        {item}
      </Text>
      {activeTab === item && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );

  const renderNetworkContent = () => (
    <View style={styles.contentContainer}>
      {/* Followers/Following Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{userData?.data?.data?.followersCount || 0}</Text>
          <Text style={styles.statLabel}>FOLLOWERS</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{userData?.data?.data?.followingCount || 0}</Text>
          <Text style={styles.statLabel}>FOLLOWING</Text>
        </View>
      </View>

      {/* Mutual Connections - Only show if not owner */}
      {isOwner && (
        <View style={styles.mutualConnectionsContainer}>
          <View style={styles.mutualHeader}>
            <Text style={styles.mutualTitle}>MUTUAL CONNECTIONS</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {mutualConnections.map((connection) => (
            <View key={connection.id} style={styles.connectionItem}>
              <View style={styles.connectionLeft}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: connection.avatar }}
                    style={styles.connectionAvatar}
                  />
                  {connection.isMutual && (
                    <View style={styles.mutualBadge}>
                      <Text style={styles.mutualBadgeText}>Mutual</Text>
                    </View>
                  )}
                </View>

                <View style={styles.connectionInfo}>
                  <Text style={styles.connectionName}>{connection.name}</Text>
                  <Text style={styles.connectionRole}>{connection.role}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.connectionButton,
                  connection.isFollowing && styles.followingButton,
                ]}
              >
                <Text
                  style={[
                    styles.connectionButtonText,
                    connection.isFollowing && styles.followingButtonText,
                  ]}
                >
                  {connection.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Network':
        return renderNetworkContent();
      case 'Posts (120)':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.placeholderText}>Posts content coming soon...</Text>
          </View>
        );
      case 'Shop':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.placeholderText}>Shop content coming soon...</Text>
          </View>
        );
      case 'Reviews':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.placeholderText}>Reviews content coming soon...</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text>Error loading content</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs FlatList */}
      <FlatList
        data={tabs}
        renderItem={renderTabItem}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsList}
        contentContainerStyle={styles.tabsContent}
      />

      {/* Content based on active tab */}
      {renderContent()}
    </View>
  );
};

export default ProfileContent2;

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabsList: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabsContent: {
    paddingHorizontal: 20,
  },
  tabItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
  },
  activeTabItem: {
    // Active state styling
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  activeTabText: {
    color: '#000000',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000000',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  mutualConnectionsContainer: {
    marginTop: 2,
  },
  mutualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mutualTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  connectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  connectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  connectionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
  },
  mutualBadge: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  mutualBadgeText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  connectionRole: {
    fontSize: 13,
    color: '#666666',
  },
  connectionButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  connectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#000000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginTop: 40,
  },
});