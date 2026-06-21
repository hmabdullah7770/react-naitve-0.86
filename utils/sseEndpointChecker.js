import { Baseurl } from './apiconfig';
import * as Keychain from 'react-native-keychain';

/**
 * Utility to check if SSE endpoint exists and is properly configured
 */
export const checkSSEEndpoint = async (endpoint = '/post/progress') => {
  try {
    // Get access token
    const credentials = await Keychain.getGenericPassword({
      service: 'accessToken',
    });
    const token = credentials ? credentials.password : null;

    const url = `${Baseurl()}${endpoint}`;
    console.log('Checking SSE endpoint:', url);

    // First, try a simple HEAD request to see if endpoint exists
    const headResponse = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    console.log('HEAD response status:', headResponse.status);
    console.log('HEAD response headers:', Object.fromEntries(headResponse.headers.entries()));

    if (headResponse.status === 404) {
      return {
        exists: false,
        error: 'Endpoint not found (404)',
        suggestion: 'Make sure your backend has the SSE endpoint implemented',
      };
    }

    if (headResponse.status === 401) {
      return {
        exists: true,
        error: 'Authentication required (401)',
        suggestion: 'Check if you are logged in and have a valid token',
      };
    }

    // Try a GET request to see what the server returns
    const getResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

    console.log('GET response status:', getResponse.status);
    console.log('GET response headers:', Object.fromEntries(getResponse.headers.entries()));

    const contentType = getResponse.headers.get('content-type');
    const hasEventStream = contentType && contentType.includes('text/event-stream');

    if (!getResponse.ok) {
      const errorText = await getResponse.text().catch(() => 'Unknown error');
      return {
        exists: true,
        error: `HTTP ${getResponse.status}: ${errorText}`,
        suggestion: 'Check server logs for more details',
      };
    }

    return {
      exists: true,
      supportsSSE: hasEventStream,
      contentType,
      hasBody: !!getResponse.body,
      suggestion: hasEventStream
        ? 'Endpoint looks good for SSE!'
        : 'Endpoint exists but may not support SSE (wrong content-type)',
    };

  } catch (error) {
    console.error('Error checking SSE endpoint:', error);
    return {
      exists: false,
      error: error.message,
      suggestion: 'Check network connection and server availability',
    };
  }
};

/**
 * Test SSE endpoint and log detailed information
 */
export const testSSEEndpoint = async () => {
  console.log('=== SSE Endpoint Test ===');
  const result = await checkSSEEndpoint();

  console.log('Test Results:', result);

  if (result.exists) {
    console.log('✅ Endpoint exists');
    if (result.supportsSSE) {
      console.log('✅ Supports SSE (correct content-type)');
    } else {
      console.log('⚠️ May not support SSE (content-type:', result.contentType, ')');
    }
    if (result.hasBody) {
      console.log('✅ Response has body for streaming');
    } else {
      console.log('❌ Response has no body - streaming not possible');
    }
  } else {
    console.log('❌ Endpoint does not exist');
  }

  console.log('Suggestion:', result.suggestion);
  console.log('=== End SSE Test ===');

  return result;
};
