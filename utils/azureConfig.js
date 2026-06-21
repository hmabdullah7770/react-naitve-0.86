import { Buffer } from 'buffer';
import { REACT_APP_PROD_MODE_CLIENTID, REACT_APP_PROD_MODE_REDIRECT_URL, REACT_APP_PROD_MODE_TANENT_ID } from '@env';

export const decodeJWT = (token) => {

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

export const config = {

    issuer: `https://login.microsoftonline.com/${REACT_APP_PROD_MODE_TANENT_ID}`,
    clientId: `${REACT_APP_PROD_MODE_CLIENTID}`,
    redirectUrl: `${REACT_APP_PROD_MODE_REDIRECT_URL}`,
    scopes: ['openid', 'profile', 'email'],
    serviceConfiguration: {
        authorizationEndpoint: `https://login.microsoftonline.com/${REACT_APP_PROD_MODE_TANENT_ID}/oauth2/v2.0/authorize`,
        tokenEndpoint: `https://login.microsoftonline.com/${REACT_APP_PROD_MODE_TANENT_ID}/oauth2/v2.0/token`,
    },

};













