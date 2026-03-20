import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HubTabNavigation from '../components/ui/HubTabNavigation';
import FriendsScreen from '../components/social/FriendsScreen';
import LeaderboardScreen from '../components/social/LeaderboardScreen';
import ActivityFeedScreen from '../components/social/ActivityFeedScreen';
import GroupsScreen from '../components/social/GroupsScreen';
import UserProfileScreen from './UserProfileScreen';
import GroupDetailScreen from './GroupDetailScreen';

// ---------------------------------------------------------------------------
// Navigation types
// ---------------------------------------------------------------------------

export type SocialStackParamList = {
  SocialHome: undefined;
  UserProfile: { userId: string };
  GroupDetail: { groupId: string };
};

const Stack = createNativeStackNavigator<SocialStackParamList>();

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const SOCIAL_TABS = [
  { id: 'amis', label: 'Amis' },
  { id: 'classement', label: 'Classement' },
  { id: 'feed', label: 'Feed' },
  { id: 'groupes', label: 'Groupes' },
];

// ---------------------------------------------------------------------------
// Social home screen
// ---------------------------------------------------------------------------

function SocialHomeScreen() {
  const [activeTab, setActiveTab] = useState('amis');
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<SocialStackParamList>>();

  const renderTab = () => {
    switch (activeTab) {
      case 'classement':
        return <LeaderboardScreen isPremium={false} />;
      case 'feed':
        return <ActivityFeedScreen />;
      case 'groupes':
        return (
          <GroupsScreen
            onGroupPress={(groupId) =>
              navigation.navigate('GroupDetail', { groupId })
            }
          />
        );
      default:
        return (
          <FriendsScreen
            onUserPress={(userId) =>
              navigation.navigate('UserProfile', { userId })
            }
          />
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontFamily: 'Quilon-Medium',
            fontSize: 24,
            marginBottom: 16,
          }}
        >
          Social
        </Text>
        <HubTabNavigation
          tabs={SOCIAL_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>
      <View style={{ flex: 1 }}>{renderTab()}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stack navigator
// ---------------------------------------------------------------------------

export default function SocialScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SocialHome" component={SocialHomeScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
    </Stack.Navigator>
  );
}
