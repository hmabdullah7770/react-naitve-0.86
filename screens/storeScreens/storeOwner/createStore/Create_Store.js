import { StyleSheet, Text, View, TouchableOpacity, Modal, Image } from 'react-native';
import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import TextInput from '../../../../components/TextField';
import { useDispatch, useSelector } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from '@react-native-vector-icons/material-icons';
import { navigation} from '@react-navigation/native';

//navigate to dummy store after pressing create store button




// Validation Schema
const validationSchema = Yup.object().shape({
  storeName: Yup.string().required('Store name is required'),
  category: Yup.string().required('Category is required'),
  storeType: Yup.string().required('Store type is required'),
  productName: Yup.string().when('storeType', {
    is: 'one_product',
    then: Yup.string().required('Product name is required'),
  }),
});

// Default categories
const categories = [
  'Fashion',
  'Electronics',
  'Home & Garden',
  'Sports',
  'Beauty',
  'Books',
  'Toys',
  'Food',
  'Other',
];

const Name_Store = ({ navigation }) => {
  const dispatch = useDispatch();

  const error = useSelector(state => state.store);

  // Navigate on successful store creation
  useEffect(() => {
    if (!error) {
      navigation.navigate('Dummy_Store');
    }
  }, [error, navigation]);

  const [modalVisible, setModalVisible] = useState(false);
  const [storeLogo, setStoreLogo] = useState(null);

  const formik = useFormik({
    initialValues: {
      storeName: '',
      category: '',
      storeType: '',
      productName: '',
    },
    validationSchema,
    onSubmit: (values) => {
      dispatch(createStore({ ...values, storeLogo }));
    },
  });

  const handleImagePicker = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,
    });
    if (!result.didCancel) {
      setStoreLogo(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      {/* Store Logo */}
      <TouchableOpacity style={styles.logoContainer} onPress={handleImagePicker}>
        {storeLogo ? (
          <Image source={{ uri: storeLogo }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Icon name="add" size={40} color="#666" />
          </View>
        )}
      </TouchableOpacity>

      {/* Store Name */}
      <TextInput
        placeholder="Store Name"
        value={formik.values.storeName}
        onChangeText={formik.handleChange('storeName')}
        error={formik.touched.storeName && formik.errors.storeName}
      />

      {/* Category Selector */}
      <TouchableOpacity
        style={styles.categorySelector}
        onPress={() => setModalVisible(true)}
      >
        <Text>{formik.values.category || 'Select Category'}</Text>
        <Icon name="arrow-drop-down" size={24} color="#666" />
      </TouchableOpacity>

      {/* Store Type Selection */}
      <View style={styles.storeTypeContainer}>
        <Text style={styles.label}>Store Type</Text>
        {['Niche Store', 'One Product Store', 'Multiple Product Store'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.radioButton,
              formik.values.storeType === type && styles.radioButtonSelected,
            ]}
            onPress={() => formik.setFieldValue('storeType', type)}
          >
            <View style={styles.radio}>
              {formik.values.storeType === type && <View style={styles.radioInner} />}
            </View>
            <Text>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Product Name (Only for One Product Store) */}
      {formik.values.storeType === 'One Product Store' && (
        <TextInput
          placeholder="Product Name"
          value={formik.values.productName}
          onChangeText={formik.handleChange('productName')}
          error={formik.touched.productName && formik.errors.productName}
        />
      )}

      {/* Create Store Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={formik.handleSubmit}
      >
        <Text style={styles.buttonText}>Create Store</Text>
      </TouchableOpacity>

      {/* Category Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.categoryItem}
                onPress={() => {
                  formik.setFieldValue('category', category);
                  setModalVisible(false);
                }}
              >
                <Text>{category}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Name_Store;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
  },
  storeTypeContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#666',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
});




// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'
// import { useFormik } from 'formik'
// import * as Yup from 'yup';
// import  TextInput  from '../../../../components/TextField';
// import { useDispatch, useSelector } from 'react-redux';
// import { createStore } from '../../../../redux/actions/storeActions';


// //  category,   select add a new
// //         storeType,  (one product) radio button
// //         storeName,  (name of store )
// //         productName, (name of product)
// // storeLogo  logo(image picker)


// const Name_Store = () => {
//   return (
//     <View>
//       <Text>Name_Store</Text>
//     </View>
//   )
// }

// export default Name_Store

// const styles = StyleSheet.create({})
