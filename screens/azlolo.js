import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '@react-native-vector-icons/material-icons';
import OTPTextView from 'react-native-otp-textinput';
import Logo from '../components/Logo';
import LineargradientCom from '../components/LineargradientCom';
import Button from '../components/Button';
import LineButton from '../components/LineButton';
import SharedLayout from '../components/SharedLayout';
import { authorize } from 'react-native-app-auth';
import { Buffer } from 'buffer';
import { REACT_APP_PROD_MODE_CLIENTID, REACT_APP_PROD_MODE_REDIRECT_URL, REACT_APP_PROD_MODE_TANENT_ID } from '@env';
// import { useNavigation } from '@react-navigation/native';

const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

const AzureloginScreen = ({ navigation }) => {
    const [username, setUsername] = useState(null);
    const config = {

        issuer: `https://login.microsoftonline.com/${REACT_APP_PROD_MODE_TANENT_ID}`,
        clientId: `${REACT_APP_PROD_MODE_CLIENTID}`,
        redirectUrl: `${REACT_APP_PROD_MODE_REDIRECT_URL}`,
        scopes: ['openid', 'profile', 'email'],
        serviceConfiguration: {
            authorizationEndpoint: `https://login.microsoftonline.com/${REACT_APP_PROD_MODE_TANENT_ID}/oauth2/v2.0/authorize`,
            tokenEndpoint: `https://login.microsoftonline.com/${REACT_APP_PROD_MODE_TANENT_ID}/oauth2/v2.0/token`,
        },

    };

    async function signIn() {
        try {
            const result = await authorize(config);
            console.log('Authorization Result:', result);

            if (result.idToken) {
                // Use the new decode function instead of atob
                const payload = decodeJWT(result.idToken);
                if (payload) {
                    const userEmail = payload.preferred_username;
                    setUsername(userEmail);
                    console.log('Logged in user:', userEmail);
                    const cleanUsername = userEmail.split('@')[0];
                    setUsername(cleanUsername);
                    console.log('Logged in user:', cleanUsername);
                }
            }

            navigation.navigate('Login');
        } catch (error) {
            console.error('Authorization Error:', error);
        }
    }









    return (
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

                <Button
                    onPress={() => navigation.navigate('Login')}
                    iconName="sign-in-alt"
                    value="go to home"
                />


            </View>

            <View style={styles.SharedLayout}>
                <SharedLayout />
            </View>
        </View>
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

export default AzureloginScreen;




