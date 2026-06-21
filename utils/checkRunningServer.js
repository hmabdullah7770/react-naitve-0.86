import { BASE_URL, PRODUCTION_URL } from '@env';
import axios from 'axios';

export const getWorkingBaseUrl = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/users/healthcheck`);
    if (response.status === 200) {
        console.log('base url is', BASE_URL,'status is', response.status);
        return { url: BASE_URL, status: response.status };

    }
    // If status is not 200, fallback to PRODUCTION_URL
    return { url: PRODUCTION_URL, status: null };
  } catch (error) {
    // If BASE_URL is not reachable, use PRODUCTION_URL
       console.log('Production url is',  PRODUCTION_URL,'status is', response.status);
    return { url: PRODUCTION_URL, status: null };
  }
};
