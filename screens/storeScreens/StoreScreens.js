import React, {useContext} from 'react';
import {View, TouchableOpacity, Text, StyleSheet, Platform} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Store_HomeScreen from './Store_HomeScreen';
import Store_ProductScreen from './Store_ProductScreen';
import Store_CartScreen from './Store_CartScreen';
import Store_CheckoutScreen from './Store_CheckoutScreen';
import Store_Dashboard from './storeOwner/Store_Dashboard';
import Store_Admin_Notification from './storeOwner/Store_Admin_Notification';
import Store_ProductDetail from './Store_ProductDetail';
import Store_OrderSuccessScreen from './Store_OrderSuccessScreen';
import Store_OrderCustomerDetailScreen from './Store_OrderCustomerDetailScreen';
import {
  StoreOwnerContext,
  StoreOwnerProvider,
} from '../../context/IsStoreOwner';
import Loader from '../../components/Loader';
import Icon from '@react-native-vector-icons/ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useGetStoreById} from '../../ReactQuery/TanStackQueryHooks/storee/useStore';
import Store_OrderScreen from './Store_OrderScreen';
import Store_Add_Carousel from './storeOwner/Store_Add_Carousel';
import Store_Add_Product from './storeOwner/Store_Add_Product';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Tab Config ────────────────────────────────────────────────────────────────
const LEFT_TABS = [
  {
    name: 'Store_HomeScreen',
    label: 'Home',
    icon: 'home-outline',
    iconFocused: 'home',
  },
  {
    name: 'Store_ProductScreen',
    label: 'Products',
    icon: 'grid-outline',
    iconFocused: 'grid',
  },
  {
    name: 'Store_CartScreen',
    label: 'Cart',
    icon: 'cart-outline',
    iconFocused: 'cart',
  },

  // ✅ New Orders tab
  {
    name: 'Store_OrderScreen',
    label: 'Orders',
    icon: 'local-shipping', // MaterialIcons — outlined feel via color
    iconFocused: 'local-shipping', // same icon, active state shown via color/bg
    iconLib: 'MaterialIcons',
  },
];

const ADMIN_TAB = {
  name: 'Store_Dashboard',
  label: 'Admin',
  materialIcon: 'settings',
};

// ─── Custom Tab Bar ────────────────────────────────────────────────────────────
const CustomTabBar = ({state, navigation, isStoreOwner, storeId}) => {
  const activeIndex = state.index;

  const handleTabPress = (routeName, routeIndex) => {
    const isFocused = activeIndex === routeIndex;
    const route = state.routes[routeIndex];

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  // const renderLeftTab = (routeConfig, routeIndex) => {
  //   const isFocused = activeIndex === routeIndex;

  const renderLeftTab = (routeConfig, routeIndex) => {
    const isFocused = activeIndex === routeIndex;

    const iconComponent =
      routeConfig.iconLib === 'MaterialIcons' ? (
        <MaterialIcons
          name={isFocused ? routeConfig.iconFocused : routeConfig.icon}
          style={isFocused ? styles.iconThick : null}
          size={22}
          color={isFocused ? '#b6f56d' : '#9e9e9e'}
        />
      ) : (
        <Icon
          name={isFocused ? routeConfig.iconFocused : routeConfig.icon}
          style={isFocused ? styles.iconThick : null}
          size={22}
          color={isFocused ? '#b6f56d' : '#9e9e9e'}
        />
      );

    return (
      <TouchableOpacity
        key={routeConfig.name}
        onPress={() => handleTabPress(routeConfig.name, routeIndex)}
        activeOpacity={0.7}
        style={styles.tabItem}>
        <View
          style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
          {/* <Icon
            name={isFocused ? routeConfig.iconFocused : routeConfig.icon}
            style={isFocused ? styles.iconThick : null}
            size={22}
            color={isFocused ? '#b6f56d' : '#9e9e9e'}
          /> */}
          {iconComponent}
        </View>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {routeConfig.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAdminCircle = () => {
    const adminRouteIndex = state.routes.findIndex(
      r => r.name === ADMIN_TAB.name,
    );
    const isFocused = activeIndex === adminRouteIndex;

    return (
      <TouchableOpacity
        onPress={() => handleTabPress(ADMIN_TAB.name, adminRouteIndex)}
        activeOpacity={0.8}
        style={[styles.adminCircle, isFocused && styles.adminCircleActive]}>
        <MaterialIcons
          name={ADMIN_TAB.materialIcon}
          size={28}
          color={isFocused ? '#b6f56d' : '#ffffff'}
        />
        <Text
          style={[
            styles.tabLabelAdmin,
            isFocused && styles.tabLabelActiveAdmin,
          ]}>
          {ADMIN_TAB.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const showAdmin = isStoreOwner ===  storeId;

  return (
    <View
      style={[
        styles.tabBarContainer,
        !showAdmin && styles.tabBarContainerCentered,
      ]}
      pointerEvents="box-none">
      <View style={styles.leftPill}>
        {LEFT_TABS.map((tabConfig, i) => renderLeftTab(tabConfig, i))}
      </View>
      {showAdmin && renderAdminCircle()}
    </View>
  );
};

// ─── Tab Navigator ─────────────────────────────────────────────────────────────
const StoreTabs = ({route}) => {
  const {isStoreOwner, setIsStoreOwner} = useContext(StoreOwnerContext);
  const storeId = route?.params?.storeId;
const storeIdfromcard = route?.params?.storeIdfromcard;
const storeIdfromoffer = route?.params?.storeIdfromoffer;
const storeIdfromTopProduct = route?.params?.storeIdfromTopProduct;
const storeIdfromTopStore = route?.params?.storeIdfromTopStore; // ← add this
const source = route?.params?.source;

const resolvedStoreId = storeId ?? storeIdfromcard ?? storeIdfromTopStore ?? storeIdfromoffer ?? storeIdfromTopProduct; // ✅ Use nullish coalescing to prefer storeId, fallback to storeIdfromcard

  console.log('isStoreOwner', isStoreOwner);
  console.log('storeId', storeId);
  console.log('resolvedStoreId', resolvedStoreId);
  console.log('setIsStoreOwner', setIsStoreOwner);
  console.log("source", source);
  // console.log('route', storeId);

  const {
    data: storeData,
    isLoading: isLoadingStore,
    error: storeError,
  } = useGetStoreById(
    // storeId
    resolvedStoreId
    // source === 'card' ? storeIdfromcard : storeId,
   
    // storeId
  );

  return (
    <Tab.Navigator
      screenOptions={{headerShown: false}}
      tabBar={props => (
        <CustomTabBar
          {...props}
          isStoreOwner={isStoreOwner}
          storeId={resolvedStoreId}
        />
      )}>
      {/* ✅ Render function — props reach the component correctly */}
      <Tab.Screen name="Store_HomeScreen">
        {() => (
          <Store_HomeScreen
            GetStoreById={storeData}
            StoreByIdLoading={isLoadingStore}
            StoreByIderror={storeError}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Store_ProductScreen">
        {() => <Store_ProductScreen 
        // storeId={storeId}
         />}
      </Tab.Screen>

      <Tab.Screen name="Store_CartScreen">
        {() => (
          <Store_CartScreen
            GetStoreById={storeData}
            StoreByIdLoading={isLoadingStore}
            StoreByIderror={storeError}

            // storeId={storeId}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Store_OrderScreen">
        {() => (
          <Store_OrderScreen
            GetStoreById={storeData}
            StoreByIdLoading={isLoadingStore}
            StoreByIderror={storeError}

            // storeId={storeId}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Store_OrderCustomerDetailScreen"
      options={{tabBarButton: () => null}}
      >
        {() => (
          <Store_OrderCustomerDetailScreen
            GetStoreById={storeData}
            StoreByIdLoading={isLoadingStore}
            StoreByIderror={storeError}

            // storeId={storeId}
          />
        )}
      </Tab.Screen>

      {/* ✅ Admin tab — only registered for store owner */}
      {isStoreOwner === resolvedStoreId && (
        <><Tab.Screen name="Store_Dashboard">
          {() => (
            <Store_Dashboard
              GetStoreById={storeData}
              StoreByIdLoading={isLoadingStore}
              StoreByIderror={storeError}
            />
          )}
        </Tab.Screen>
      
      <Tab.Screen
        name="Store_Add_Carousel"
        options={{tabBarButton: () => null}}>
        {() => (
          <Store_Add_Carousel
            GetStoreById={storeData}
            StoreByIdLoading={isLoadingStore}
            StoreByIderror={storeError}

            // storeId={storeId}
          />
        )}
      </Tab.Screen>
      
       <Tab.Screen
        name="Store_Add_Product"
        options={{tabBarButton: () => null}}>
        {() => (
          <Store_Add_Product
            GetStoreById={storeData}
            StoreByIdLoading={isLoadingStore}
            StoreByIderror={storeError}

            // storeId={storeId}
          />
        )}
      </Tab.Screen>


      
      </>
      
      
      )}

      <Tab.Screen
        name="Store_ProductDetail"
        options={{tabBarButton: () => null}}>
        {() => (
          <Store_ProductDetail
            GetStoreById={storeData}
            StoreByIdLoading={isLoadingStore}
            StoreByIderror={storeError}

            // storeId={storeId}
          />
        )}
      </Tab.Screen>

      {/* ✅ Hidden tab — tab bar won't show it but it lives inside tabs */}
      {/* <Tab.Screen
        name="Store_ProductDetail"
        component={Store_ProductDetail}
        options={{tabBarButton: () => null}} // ← hides it from tab bar
      /> */}
    </Tab.Navigator>
  );
};

// ─── Stack Navigator ───────────────────────────────────────────────────────────
const StoreNavigator = ({route}) => {
  const {isStoreOwner, isLoading} = useContext(StoreOwnerContext);
  const storeId = route?.params?.storeId;
  const storeIdfromcard = route?.params?.storeIdfromcard;
  const storeIdfromTopProduct = route?.params?.storeIdfromTopProduct;
  const storeIdfromoffer = route?.params?.storeIdfromoffer;
  const storeIdfromTopStore = route?.params?.storeIdfromTopStore; // ← add this
  const source = route?.params?.source;

// ✅ Resolve which storeId to use
const resolvedStoreId = storeId ?? storeIdfromcard ?? storeIdfromTopStore ?? storeIdfromoffer ?? storeIdfromTopProduct; // ✅ Use nullish coalescing to prefer storeId, fallback to others

  if (isLoading) return <Loader />;

  return (
    <Stack.Navigator>
      <Stack.Screen name="StoreTabs" options={{headerShown: false}}>
        {props => <StoreTabs {...props} 
        // route={{params: {resolvedStoreId}}} 
         route={{params: {storeId: resolvedStoreId, source, ...props.route.params}}} 
        />}
      </Stack.Screen>

      {/* <Stack.Screen
        name="Store_ProductDetail"
        component={Store_ProductDetail}
        options={{headerShown: false}}
      /> */}
      <Stack.Screen
        name="Store_CheckoutScreen"
        component={Store_CheckoutScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="Store_OrderSuccessScreen"
        component={Store_OrderSuccessScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Store_Admin_Notification"
        component={Store_Admin_Notification}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

// ─── Root Export ───────────────────────────────────────────────────────────────
const StoreScreens = ({route}) => (
  <StoreOwnerProvider>
    <StoreNavigator route={route} />
  </StoreOwnerProvider>
);

export default StoreScreens;

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  tabBarContainerCentered: {
    justifyContent: 'center',
  },
  leftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 40,
    paddingVertical: 3,
    paddingHorizontal: 7,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  adminCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#000000',
    // borderWidth: 3,
    // borderColor:'#b6f56d',
    alignItems: 'center',
    justifyContent: 'center',
    // shadowColor: '#88fe02',
    // shadowOffset: {width: 0, height: 4},
    // shadowOpacity: 0.12,
    // shadowRadius: 16,
    // elevation: 12,
  },
  adminCircleActive: {
    borderColor: '#b6f56d',
    borderWidth: 3,
    shadowColor: '#88fe02',

    // backgroundColor: '#b5d14e',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: '#eeffcd',
    borderRadius: 7,
  },

  tabLabelAdmin: {
    fontSize: 10,
    color: '#ececec',
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActiveAdmin: {
    color: '#ffffff',
    fontWeight: '900',
  },

  tabLabel: {
    fontSize: 10,
    color: '#9e9e9e',
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#000000',
    fontWeight: '700',
  },

  iconThick: {
    textShadowColor: '#000000', // same as icon color
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 5, // controls how thick — increase for thicker
  },
});

// import React, {useContext} from 'react';
// import {View, TouchableOpacity, Text, StyleSheet, Platform} from 'react-native';
// import {createStackNavigator} from '@react-navigation/stack';
// import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
// import Store_HomeScreen from './Store_HomeScreen';
// import Store_ProductScreen from './Store_ProductScreen';
// import Store_CartScreen from './Store_CartScreen';
// import Store_CheckoutScreen from './Store_CheckoutScreen';
// import Store_Dashboard from './storeOwner/Store_Dashboard';
// import Store_Admin_Notification from './storeOwner/Store_Admin_Notification';
// import Store_ProductDetail from './Store_ProductDetail';
// import {
//   StoreOwnerContext,
//   StoreOwnerProvider,
// } from '../../context/IsStoreOwner';
// import Loader from '../../components/Loader';
// import Icon from 'react-native-vector-icons/Ionicons';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import {useGetStoreById} from '../../ReactQuery/TanStackQueryHooks/storee/useStore';

// const Stack = createStackNavigator();
// const Tab = createBottomTabNavigator();

// // ─── Tab Config ────────────────────────────────────────────────────────────────
// const LEFT_TABS = [
//   {
//     name: 'Store_HomeScreen',
//     label: 'Home',
//     icon: 'home-outline',
//     iconFocused: 'home',
//   },
//   {
//     name: 'Store_ProductScreen',
//     label: 'Products',
//     icon: 'grid-outline',
//     iconFocused: 'grid',
//   },
//   {
//     name: 'Store_CartScreen',
//     label: 'Cart',
//     icon: 'cart-outline',
//     iconFocused: 'cart',
//   },
// ];

// const ADMIN_TAB = {
//   name: 'Store_Dashboard',
//   label: 'Admin',
//   materialIcon: 'settings',
// };

// // ─── Custom Tab Bar ────────────────────────────────────────────────────────────
// const CustomTabBar = ({state, navigation, isStoreOwner, storeId}) => {
//   const activeIndex = state.index;

//   // ── Shared tab press logic — same for ALL tabs including admin ────────────
//   const handleTabPress = (routeName, routeIndex) => {
//     const isFocused = activeIndex === routeIndex;
//     const route = state.routes[routeIndex]; // always defined — all tabs are registered

//     const event = navigation.emit({
//       type: 'tabPress',
//       target: route.key, // ✅ always valid now
//       canPreventDefault: true,
//     });

//     if (!isFocused && !event.defaultPrevented) {
//       navigation.navigate(routeName);
//     }
//   };

//   // ── Left tabs — Ionicons ──────────────────────────────────────────────────
//   const renderLeftTab = (routeConfig, routeIndex) => {
//     const isFocused = activeIndex === routeIndex;

//     return (
//       <TouchableOpacity
//         key={routeConfig.name}
//         onPress={() => handleTabPress(routeConfig.name, routeIndex)}
//         activeOpacity={0.7}
//         style={styles.tabItem}>
//         <View
//           style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
//           <Icon
//             name={isFocused ? routeConfig.iconFocused : routeConfig.icon}
//             size={22}
//             color={isFocused ? '#6200ee' : '#9e9e9e'}
//           />
//         </View>
//         <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
//           {routeConfig.label}
//         </Text>
//       </TouchableOpacity>
//     );
//   };

//   // ── Admin circle — MaterialIcons, same emit logic as left tabs ────────────
//   const renderAdminCircle = () => {
//     // ✅ Always index 3 since Store_Dashboard is always registered
//     const adminRouteIndex = state.routes.findIndex(
//       r => r.name === ADMIN_TAB.name,
//     );
//     const isFocused = activeIndex === adminRouteIndex;

//     return (
//       <TouchableOpacity
//         onPress={() => handleTabPress(ADMIN_TAB.name, adminRouteIndex)}
//         activeOpacity={0.8}
//         style={[styles.adminCircle, isFocused && styles.adminCircleActive]}>
//         <MaterialIcons
//           name={ADMIN_TAB.materialIcon}
//           size={28}
//           color={isFocused ? '#6200ee' : '#555555'}
//         />
//         <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
//           {ADMIN_TAB.label}
//         </Text>
//       </TouchableOpacity>
//     );
//   };

//   const showAdmin = isStoreOwner === storeId;

//   return (
//     <View
//       style={[
//         styles.tabBarContainer,

//         !showAdmin && styles.tabBarContainerCentered, // ← add this
//       ]}
//       pointerEvents="box-none">
//       {/* ── LEFT PILL ── */}
//       <View style={styles.leftPill}>
//         {LEFT_TABS.map((tabConfig, i) => renderLeftTab(tabConfig, i))}
//       </View>

//       {/* ── ADMIN CIRCLE — only visible to owner, same tab system ── */}
//       {showAdmin && renderAdminCircle()}
//     </View>
//   );
// };

// // ─── Tab Navigator ─────────────────────────────────────────────────────────────
// const StoreTabs = ({route}) => {
//   const {isStoreOwner} = useContext(StoreOwnerContext);
//   const {storeId} = route.params;

//   console.log('route', storeId); // ✅ Verify storeId is received

//   // ✅ Call API here — storeId is available, all screens will get the data
//   const {
//     data: storeData,
//     isLoading: isLoadingStore,
//     error: storeError,
//   } = useGetStoreById(storeId);

//   return (
//     <Tab.Navigator
//       screenOptions={{headerShown: false}}
//       tabBar={props => (
//         <CustomTabBar
//           {...props}
//           isStoreOwner={isStoreOwner}
//           storeId={storeId}
//         />
//       )}>
//       <Tab.Screen
//         name="Store_HomeScreen"
//         component={Store_HomeScreen}
//         GetStoreById={storeData}
//         StoreByIdLoading={isLoadingStore}
//         StoreByIderror={storeError}
//       />
//       {/* test tabs */}
//       {/* <Tab.Screen name="Store_ProductDetail"    component={Store_ProductDetail} /> */}
//       <Tab.Screen name="Store_ProductScreen" component={Store_ProductScreen} />
//       <Tab.Screen name="Store_CartScreen" component={Store_CartScreen} />

//       {/*
//         ✅ Always registered — route.key always exists.
//            The custom tab bar controls whether the circle is VISIBLE (owner only).
//            Non-owners simply never see the button, but the route exists in state.
//       */}

//       {isStoreOwner === storeId && (
//         <Tab.Screen name="Store_Dashboard" component={Store_Dashboard} />
//       )}
//     </Tab.Navigator>
//   );
// };

// // ─── Stack Navigator ───────────────────────────────────────────────────────────
// const StoreNavigator = ({route}) => {
//   const {isStoreOwner, isLoading} = useContext(StoreOwnerContext);
//   const {storeId} = route.params;

//   if (isLoading) return <Loader />;

//   return (
//     <Stack.Navigator>
//       <Stack.Screen name="StoreTabs" options={{headerShown: false}}>
//         {props => <StoreTabs {...props} route={{params: {storeId}}} />}
//       </Stack.Screen>

//       <Stack.Screen
//         name="Store_ProductDetail"
//         component={Store_ProductDetail}
//         options={{headerShown: false}}
//       />
//       <Stack.Screen
//         name="Store_CheckoutScreen"
//         component={Store_CheckoutScreen}
//         options={{headerShown: false}}
//       />

//       <Stack.Screen
//         name="Store_Admin_Notification"
//         component={Store_Admin_Notification}
//         options={{headerShown: false}}
//       />
//     </Stack.Navigator>
//   );
// };

// // ─── Root Export ───────────────────────────────────────────────────────────────
// const StoreScreens = ({route}) => (
//   <StoreOwnerProvider>
//     <StoreNavigator route={route} />
//   </StoreOwnerProvider>
// );

// export default StoreScreens;

// // ─── Styles ────────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   tabBarContainer: {
//     position: 'absolute',
//     bottom: Platform.OS === 'ios' ? 28 : 16,
//     left: 16,
//     right: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: 'transparent',
//   },

//   tabBarContainerCentered: {
//     justifyContent: 'center', // centers the pill horizontally
//   },

//   leftPill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#ffffff',
//     borderRadius: 40,
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     gap: 4,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.12,
//     shadowRadius: 16,
//     elevation: 12,
//   },

//   adminCircle: {
//     width: 68,
//     height: 68,
//     borderRadius: 34,
//     backgroundColor: '#c6e25f',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.12,
//     shadowRadius: 16,
//     elevation: 12,
//   },

//   adminCircleActive: {
//     backgroundColor: '#b5d14e',
//   },

//   tabItem: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//   },

//   iconWrapper: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   iconWrapperActive: {
//     backgroundColor: '#ede7f6',
//   },

//   tabLabel: {
//     fontSize: 10,
//     color: '#9e9e9e',
//     marginTop: 2,
//     fontWeight: '500',
//   },

//   tabLabelActive: {
//     color: '#6200ee',
//     fontWeight: '700',
//   },
// });
