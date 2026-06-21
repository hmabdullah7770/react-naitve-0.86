import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {useDispatch} from 'react-redux';
import {logoutrequest} from '../../../Redux/action/auth';
import Button from '../components/Button';
import {useModal} from '../context/useModal';

const ProfileSetting = ({navigation}) => {
  const dispatch = useDispatch();
  const {showModal} = useModal();

  const handleLogout = () => {
    showModal({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      onConfirm: () => dispatch(logoutrequest()),
      onCancel: () => console.log('Logout cancelled'),
    });
  };

  const handleDisplaySettings = () => {
    // Navigate to DisplaySettings screen
    navigation.navigate('DisplaySettings');
  };

  return (
    <View style={styles.container}>
      <Text>ProfileSetting</Text>
      <Button
        onPress={handleLogout}
        value="Logout"
        iconname="log-out-outline"
        color="#000"
      />
      <Button
        onPress={handleDisplaySettings}
        value="Display Settings"
        iconname="tv-outline"
        color="#000"
      />
    </View>
  );
};

export default ProfileSetting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native'
// import React, { useState } from 'react'
// import { useDispatch } from 'react-redux'
// import { logoutrequest } from '../../../Redux/action/auth'
// import Button from '../components/Button'
// import Icon from '@react-native-vector-icons/Ionicons'

// const ProfileSetting = () => {
//   const dispatch = useDispatch()
//   const [modalVisible, setModalVisible] = useState(false)

//   const handleLogout = () => {
//     setModalVisible(true)
//   }

//   const confirmLogout = () => {
//     dispatch(logoutrequest())
//     setModalVisible(false)
//   }

//   return (
//     <View style={styles.container}>
//       <Text>ProfileSetting</Text>
//       <Button
//         onPress={handleLogout}
//         value="Logout"
//         iconname="log-out-outline"
//         color="#000"
//       />

//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalBackground}>
//           <View style={styles.modalContainer}>
//             <TouchableOpacity
//               style={styles.closeButton}
//               onPress={() => setModalVisible(false)}
//             >
//               <Icon name="close" size={24} color="#000" />
//             </TouchableOpacity>

//             <Text style={styles.modalTitle}>Confirm Logout</Text>
//             <Text style={styles.modalText}>Are you sure you want to logout?</Text>

//             <View style={styles.buttonContainer}>
//               <TouchableOpacity
//                 style={[styles.button, styles.noButton]}
//                 onPress={() => setModalVisible(false)}
//               >
//                 <Text style={styles.buttonText}>No</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[styles.button, styles.yesButton]}
//                 onPress={confirmLogout}
//               >
//                 <Text style={styles.buttonText}>Yes</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   modalBackground: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContainer: {
//     backgroundColor: 'white',
//     borderRadius: 20,
//     padding: 20,
//     width: '80%',
//     alignItems: 'center',
//     position: 'relative',
//   },
//   closeButton: {
//     position: 'absolute',
//     right: 10,
//     top: 10,
//     padding: 5,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   modalText: {
//     fontSize: 16,
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     paddingHorizontal: 20,
//   },
//   button: {
//     paddingVertical: 10,
//     paddingHorizontal: 30,
//     borderRadius: 10,
//     minWidth: 100,
//     alignItems: 'center',
//   },
//   yesButton: {
//     backgroundColor: '#FF3B30',
//   },
//   noButton: {
//     backgroundColor: '#007AFF',
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// })

// export default ProfileSetting
