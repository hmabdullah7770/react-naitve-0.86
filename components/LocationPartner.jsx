import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import LocationModal from './LocationModal';
import PartnerModal from './PartnerModal';
import { setuserstaterequest } from '../Redux/action/states';
import { useSelector,useDispatch } from 'react-redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';

const LocationPartner = ({Auth:{user},States:{userstate,locationlist, partnerlist},setuserstaterequest}) => {
  console.log('Authuser:::::::::::::::::::::::::::::::',user);
  console.log('Statesuserstate++++++++++++++++++++++',userstate);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);
  // const { userstate,locationlist, partnerlist } = useSelector(state => state.States);


  const dispatch = useDispatch();
  const [selectedPartner, setSelectedPartner] = useState(userstate?.partnerName || '');
  const [selectedLocation, setSelectedLocation] = useState(userstate?.stationid || '');

  console.log('username stationid and partner id',user?.username,locationlist?.data?.[0]?.stationID,partnerlist?.data?.[0]?.partnerKey);
  // user?.username
  // const handleLocationSelect = (location) => {

    const handleLocationSelect = (location,partner) => {
      setSelectedLocation(location.locationName);
      if (partner) {
        setSelectedPartner(partner.name);
      }


      // setSelectedPartner(partner?.name);
       console.log(`username stationid and partner id inside location ${selectedPartner}`,user?.username, location.stationID,userstate.partnerkey,selectedPartner);

      console.log(location.locationName);
        dispatch(setuserstaterequest(user?.username, location.stationID, userstate.partnerkey ));
        //  dispatch(setuserstaterequest(user?.username, location.stationID, selectedPartner ))
      //  dispatch(userstaterequest(user?.username));
       setLocationModalVisible(false);
    };

    const handlePartnerSelect = (partner) => {
      setSelectedPartner(partner.name);
      console.log(`username stationid and partner id inside partner ${selectedLocation}`, user?.username,userstate.stationid,partner.partnerKey);
      setuserstaterequest(user?.username, userstate.stationid, partner.partnerKey);
    //  dispatch(setuserstaterequest(user?.username, selectedLocation ,partner.partnerKey  ))
    //  dispatch(userstaterequest(user?.username));
      console.log(partner.name);
      setPartnerModalVisible(false);
    };

  return (
    // <Text>
    //   hello
    // </Text>
       <View style={styles.roundContainer}>
      <View style={styles.roundedContent}>
         <View>
          <Text style={styles.roundedFont}>
            <FontAwesome
              size={15}
              solid={true}
              color="#23c4b4"
              name="map-marker-alt"
            />
            <Text> </Text>
            Location
          </Text>
          {userstate && (
            <TouchableOpacity onPress={() => {setLocationModalVisible(true);

            }}>
                {/* I use OR function if person selectlocation and if not the show   userstate.stationid  */}
            <Text style={styles.textColor}>{' '}{ selectedLocation && userstate.stationid}</Text>
            </TouchableOpacity>
          )}
             </View>

        <View>

          <Text style={styles.roundedFont}>
            <Text> </Text>
            Partner{' '}
            <FontAwesome
              size={15}
              color="#23c4b4"
              solid={false}
              name="building"
            />
          </Text>





          {userstate && (
            <TouchableOpacity onPress={() =>{ setPartnerModalVisible(true);

            }}>
              {/* I use OR function if person selectparnter and if not the show   userstate.partnerName */}
             <Text style={styles.textColor}>{' '}{selectedPartner && userstate.partnerName}</Text>

                 {/* <Text style={styles.textColor}>{' '}{ userstate?.partner.partnerName}</Text>  */}
          </TouchableOpacity>
          )}
          </View>
        </View>
        <LocationModal
          visible={locationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          // locationList={locationlist}
          onSelect={handleLocationSelect}
        />

       <PartnerModal
          visible={partnerModalVisible}
          onClose={() => setPartnerModalVisible(false)}
          // partnerList={partnerlist} // Add your partner list data here
          onSelect={handlePartnerSelect}
        />
      </View>

  );
};

const styles = StyleSheet.create({





  roundContainer: {
    width: '90%',
    height: 55,
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 30,
    elevation: 2,
  },
  roundedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 7,
  },
  roundedFont: {
    margin: 2,
    fontWeight: 'bold',
  },
  textColor: {
    color: 'gray',

  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    maxHeight: '80%',
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 25,
    marginHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  searchIcon: {
    marginHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    padding: 8,
    fontSize: 16,
  },
  locationList: {
    maxHeight: '70%',
    paddingHorizontal: 15,
  },
  locationItem: {
    paddingVertical: 12,
  },
  locationText: {
    fontSize: 16,
  },
});


 LocationPartner.propTypes = {
   Auth: PropTypes.object.isRequired,
   States: PropTypes.object.isRequired,
   setuserstaterequest:PropTypes.func.isRequired,
  };


 const mapStateToProps = (state) =>
   ({
     Auth: state.Auth,
     States:state.States,
   });



export default connect(mapStateToProps,{setuserstaterequest})(LocationPartner);
