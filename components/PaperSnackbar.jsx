import * as React from 'react';
import { View } from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import { StyleSheet, Text, TouchableOpacity} from 'react-native';

import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {SnackbarContext}  from '../context/Snackbar';
import { useContext } from 'react';

const PaperSnackbar = () => {
  const {show, setShow, messege, explain,type} = useContext(SnackbarContext);



    return (
    <View style={styles.container}>
      <Snackbar
        visible={show}
        onDismiss={() => setShow(false)}
        duration={3000}
        action={{
          label: 'Close',
          onPress: () => setShow(false),
        }}>
        <View>
          <Text style={styles.Snackbar}>
          {
           type === 'error' ? (
            <FontAwesome name="times-circle" size={25} color="red" solid={true}/>
           )
            : type === 'success' ? (
              <FontAwesome name="check-circle" size={25} color="lightgreen" solid={true}/>
            )
            : type === 'info' ? (

              <FontAwesome name="info-circle" size={25} color="lightblue" solid={true}/>

          )
          : null
              }</Text>
          <Text style={styles.text1}>{messege}</Text>
          <Text style={styles.text2}>{explain}</Text>
        </View>
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {

    justifyContent: 'space-between',
  },

  text1:
  {
    marginLeft:40,
    color: 'white',

  },
  text2:{
    marginLeft:40,
       color:'white',
  }
,
  Snackbar:{
   position:'absolute',
   top:'20%',
  },
});

export default PaperSnackbar;
