import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// import Loader from '../components/Loader';
// import Tabnavigation from '../screens/tabNavigation/Tabnavigation';
import PostFeed from './PostFeed'
import VideoFeed from './VideoFeed'
import ForYou from './ForYou'

const Stack = createStackNavigator();

const VideoFeedStack = () => {
    return (
        <Stack.Navigator initialRouteName="ForYou">
            <Stack.Screen name="ForYou" component={ForYou} options={{ headerShown: false }} />
            <Stack.Screen name="VideoFeed" component={VideoFeed} options={{ headerShown: false }} />
            <Stack.Screen name="PostFeed" component={PostFeed} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

export default VideoFeedStack;
