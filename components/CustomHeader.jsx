// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'
// import LineargradientCom from './LineargradientCom'
// import BrandpathText from './BrandpathText'
// import LinearGradient from 'react-native-linear-gradient'
// const CustomHeader = () => {
//   return (
//     <View >


//     <View style={styles.CustomHeader}>

//     <LineargradientCom

//       />

//     <BrandpathText/>

//     </View>
//     </View>
//   )
// }

// export default CustomHeader

// const styles = StyleSheet.create({


//     CustomHeader:{


//         width: '100%',
//         alignItems:'center',
//        backgroundColor: 'transparent',
//     }
// ,

//     gradient: {

//         position: 'absolute',
//         top: 0,

//         width: '100%',
//         height: 370,
//         borderBottomLeftRadius: 24,
//         borderBottomRightRadius: 24,

//       },


// })



import {useNavigation, useNavigationState} from '@react-navigation/native';
import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome5'; // Import FontAwesome for icon
// import {goBack} from '../actions/global';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import LineargradientCom from './LineargradientCom';
import BrandpathText from './BrandpathText';
import BackButton from './BackButton';
// import {resetDockToStock} from '../actions/goodsIn';
// import logoImage from '../assets/images/logo-v.png';

// const {height} = Dimensions.get('window');

const CustomHeader = () => {

  return (
    <View >

     <LineargradientCom style={styles.container}/>
      <BackButton/>
     <BrandpathText/>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // height: height * 0.42,
    zIndex: -1, // Ensure it stays behind other components
  },
  topView: {
    flex: 1,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    justifyContent: 'center',
    top: '5%',
    width: '100%',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 10,
  },
  logoText: {
    fontFamily: '18KhebratMusamimRegular',
    fontSize: 36,
    color: 'white',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    zIndex: 1,
  },
  backButtonIcon: {
    fontSize: 20,
    color: 'black',
  },
});

export default CustomHeader;
