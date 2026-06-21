import {StyleSheet, View, Dimensions,ScrollView} from 'react-native';
import React from 'react';
import LocationPartner from '../components/LocationPartner';
import BarCode from '../components/BarCode';
import UserInfo from '../components/UserInfo';

import SharedLayout from '../components/SharedLayout';

const windowHeight = Dimensions.get('window').height;
const Hoc = WrappedComponent => {
  return props => (
    <>
     {/* <ScrollView
     style={styles.scrollViewContent}
      contentContainerStyle={{
         flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
      }}
    > */}

      <View style={styles.hoccontainer}>

        <View style={styles.LocationPartner}>
          <LocationPartner   navigation={props.navigation}/>
        </View>
        <View style={styles.UserInfo}>
          <UserInfo />
          <View style={styles.wrappedComponent}>
            <WrappedComponent {...props} />
          </View>
        </View>
        <View style={styles.BarCode}>
          <BarCode />
        </View>
        <View style={styles.SharedLayout}><SharedLayout/></View>

      </View>
      {/* </ScrollView> */}
    </>
  );
};

export default Hoc;

const styles = StyleSheet.create({

  scrollViewContent: {
   zIndex: 1,
  },


  hoccontainer: {
    zIndex: 1,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    paddingTop: 5,
    position: 'relative',
  },
  LocationPartner: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 3,
  },
  UserInfo: {
    //flex: 0.95,
    //height: 490,
    height: windowHeight * 0.68,
    alignItems: 'center',
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginBottom: '17%',
  },
  wrappedComponent: {
    width: '100%',
    flex: 1,
  },
  BarCode: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 15,
  },
  SharedLayout:{
    margin:3,
    position:'absolute',
    bottom: 0,
    zIndex: -1,
  },
});
