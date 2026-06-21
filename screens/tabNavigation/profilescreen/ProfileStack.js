import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import ProfileScreen from './ProfileScreen';
import ProfileSetting from './ProfileSetting';
import {ModalProvider} from '../context/useModal';
import {FollowProvider} from '../context/Followcontext';
import CustomModal from '../components/CustomModal';
import DisplaySettings from './DisplaySettings';
import EditProfileScreen from './EditProfileScreen';

const ProfileStack = () => {
  const Profile = createStackNavigator();

  return (
    <FollowProvider>
      <ModalProvider>
        <Profile.Navigator>
          <Profile.Screen
            name="ProfileScreen"
            component={ProfileScreen}
            options={{headerShown: false}} // Add this to hide the header
        />
        <Profile.Screen name="ProfileSetting" component={ProfileSetting} />
        <Profile.Screen name="DisplaySettings" component={DisplaySettings} />
        <Profile.Screen name="EditProfileScreen" component={EditProfileScreen} />
      </Profile.Navigator>
      <CustomModal />
    </ModalProvider>
    </FollowProvider>
  );
};

export default ProfileStack;

const styles = StyleSheet.create({});
