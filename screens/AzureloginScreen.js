import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Logo from '../components/Logo';
import LineargradientCom from '../components/LineargradientCom';
import Button from '../components/Button';
import SharedLayout from '../components/SharedLayout';
import { authorize } from 'react-native-app-auth';
import {
    locationlistrequest,
    partnerlistrequest,
    userstaterequest,
} from '../Redux/action/states';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { config } from '../utils/azureConfig';
import { decodeJWT } from '../utils/azureConfig';
import { azureloginrequest } from '../Redux/action/auth';
// import Keychain from 'react-native-keychain';
import { haveaccesstoken } from '../Redux/action/auth';
import { useDispatch } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';

import Loader from '../components/Loader';

const AzureloginScreen = ({
    azureloginrequest,
    locationlistrequest,
    partnerlistrequest,
    userstaterequest,

}) => {

    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();







    async function signIn() {
        try {
            setIsLoading(true);
            const result = await authorize(config);
            console.log('Authorization Result:', result);

            // if (result.accessToken) {
            //     const saved = await Keychain(result.accessToken);
            //     if (saved) {
            //         dispatch(haveaccesstoken());
            //     } else {
            //         console.error('Failed to save token to keychain');
            //     }
            // }
            if (result.accessToken) {
                // Save the access token securely
                await EncryptedStorage.setItem('access_token', result.accessToken);
                // dispatch(haveaccesstoken());
            }



            if (result.idToken) {
                const payload = decodeJWT(result.idToken);
                if (payload) {
                    const userEmail = payload.preferred_username;
                    const azurename = userEmail.split('@')[0]; //clean usernae
                    console.log('Logged in user az:', azurename);
                    azureloginrequest(azurename);
                    userstaterequest(azurename);
                    locationlistrequest();
                    partnerlistrequest();
                }
            }
        } catch (error) {
            console.error('Authorization Error:', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>

            {isLoading && <Loader />}

            <View style={styles.container}>

                <LineargradientCom />
                <Logo />
                <View style={styles.formContainer}>
                    <Text style={[styles.text, styles.loginText]}>LOGIN</Text>
                    <Button
                        onPress={() => signIn()}
                        iconName="sign-in-alt"
                        value="Azure-Login"
                    />
                </View>

                <View style={styles.SharedLayout}>
                    <SharedLayout />
                </View>
            </View>
        </>

    );
};

const styles = StyleSheet.create({
    SharedLayout: {
        margin: 3,
        position: 'absolute',
        bottom: 0,
        zIndex: -1,
    },

    eye: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -12 }],
        marginRight: 4,
    },
    container: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#dcdbdb',
    },

    gradient: {
        position: 'absolute',
        top: 0,
        width: '100%',
        height: 270,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },

    formContainer: {
        backgroundColor: 'white',
        width: '80%',
        borderRadius: 16,
        padding: 15,
        zIndex: 10,
        marginBottom: '40%',
    },
    text: {
        fontFamily: '18 Khebrat Musamim Regular',
        textAlign: 'center',
        color: 'black',
        fontSize: 35,
    },
    loginText: {
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 23,
        width: '100%',
        backgroundColor: '#f0f0f0',
        borderRadius: 24,
        height: 38,
    },
    inputIcon: {
        height: 33,
        width: 33,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    input: {
        paddingBottom: 8,
        fontSize: 18,
        marginLeft: 4,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        height: 48,
        paddingHorizontal: 12,
    },
    passwordText: {
        borderBottomColor: 'gray',
        border: '1px solid gray',
        padding: 0,
        margin: 5,
        marginLeft: 6,
        alignContent: 'center',
    },
    passwordInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#94a3b8',
        padding: 0,
        margin: 5,
        marginLeft: 6,
        textAlign: 'center',
    },
    button: {
        padding: 12,
        borderRadius: 24,
        width: 240,
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        marginLeft: 8,
    },
    changePinContainer: {
        marginTop: 16,
    },
    changePinContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    changePinLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#d1d5db',

        marginLeft: 20,
    },
    changePinLine2: {
        flex: 1,
        height: 1,
        backgroundColor: '#d1d5db',

        marginRight: 20,
    },
    changePinText: {
        color: '#1e3a8a',
        width: 96,
        textAlign: 'center',
    },
    changepin: {
        fontFamily: 'Poppins-Regular',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 10,
    },
    placeholder: {
        fontFamily: 'Poppins-Regular',
        fontWeight: 'bold',
        fontSize: 10,
    },
    errorText: {
        color: 'red',
        textAlign: 'left',
        marginTop: -8,
        marginBottom: 8,
        marginLeft: '5%',
    },

    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',

        height: 49,
    },
    otpInput: {
        borderBottomWidth: 1,
        width: '11%',
        height: 29,
        fontSize: 12,
        textAlign: 'center',

        padding: 0,

        margin: 5,
        color: 'black',
    },

    fieldheadtext: {
        alignItems: 'center',
        marginLeft: '5%',
        marginBottom: '1%',
        fontFamily: 'Poppins-Regular',
    },
});
AzureloginScreen.propTypes = {
    locationlistrequest: PropTypes.func.isRequired,
    partnerlistrequest: PropTypes.func.isRequired,
    userstaterequest: PropTypes.func.isRequired,
    azureloginrequest: PropTypes.func.isRequired,

};

const mapDispatchToProps = {
    azureloginrequest,
    locationlistrequest,
    partnerlistrequest,
    userstaterequest,

};


export default connect(null, mapDispatchToProps)(AzureloginScreen);
