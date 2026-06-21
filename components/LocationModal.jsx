import React from 'react';
import {useState} from 'react';
import {
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  // TextInput,
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
// import {useSelector} from 'react-redux';
import Search from './Search';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

const LocationModal = ({States:{locationlist},visible, onClose, onSelect}) => {
  // const {locationlist} = useSelector(state => state.States);
  const [search, setSearch] = useState('');

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  // const filteredLocations = locationlist?.data?.filter(item =>
  //   item.locationName.toLowerCase().includes(search.toLowerCase())
  // );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.headerTitle}> Select Location</Text>
            <TouchableOpacity onPress={handleClose}>
              <FontAwesome name="times" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <Search
            placeholder={'Search Location ... '}
            value={search}
            onChangeText={setSearch}
          />

          <ScrollView
            style={styles.locationList}
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            indicatorStyle="black">

            {locationlist?.data?.filter(item =>
  item.locationName.toUpperCase().includes(search.toUpperCase())
).length === 0 ? (
  <View style={styles.noResultContainer}>
    <Text style={styles.noResultText}>No Results Found</Text>
  </View>
) : (
  locationlist?.data?.
    filter(item => item.locationName.toUpperCase().includes(search.toUpperCase()))
    .map(item => (
      <TouchableOpacity
        key={item.stationID}
        style={styles.locationItem}
        onPress={() => {
          onSelect(item);
          handleClose();
        }}
      >
       <Text style={styles.locationText}>{item.locationName}</Text>
      </TouchableOpacity>
    ))
)}


          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  noResultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 30,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 10,

    borderWidth: 1,
    borderColor: 'gray',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginHorizontal: 7,
  },
  searchInput: {
    flex: 1,
    padding: 3,
    fontSize: 16,
  },
  locationList: {
    maxHeight: '80%',

    paddingHorizontal: 20,
  },
  locationItem: {
    paddingVertical: 12,
  },
  locationText: {
    fontSize: 16,
  },
});

 LocationModal.propTypes = {
  States:PropTypes.object.isRequired,

 };

 const mapStateToProps = state =>({

  States:state.States,

 });

export default connect(mapStateToProps,{})(LocationModal);
