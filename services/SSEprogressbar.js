// services/SSEprogressbar.js
import { Baseurl } from '../utils/apiconfig';
import * as Keychain from 'react-native-keychain';
import EventSource from 'react-native-sse';

/**
 * SSE Service for React Native using react-native-sse
 * Properly handles Server-Sent Events in React Native
 */
class SSEService {
  constructor() {
    this.eventSource = null;
    this.listeners = {};
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 2000;
    this.latestProgress = { progress: 0, message: '', timestamp: 0 };
    this.connectionPromise = null;
  }

  /**
   * Get access token from Keychain
   */
  async getAccessToken() {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'accessToken',
      });
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      return null;
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // If subscribing to 'progress' and we have cached progress, send it immediately
    if (event === 'progress' && this.latestProgress && this.latestProgress.progress > 0) {
      setTimeout(() => {
        try {
          callback(this.latestProgress);
        } catch (err) {
          console.error('❌ Error delivering cached progress:', err);
        }
      }, 0);
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  /**
   * Emit event to all listeners
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Connect to SSE endpoint
   */
  async connect(endpoint = '/post/progress') {
    // If already connecting, return the existing promise
    if (this.connectionPromise) {
      console.log('⏳ Connection already in progress, waiting...');
      return this.connectionPromise;
    }

    // If already connected, just return
    if (this.isConnected) {
      console.log('✅ Already connected to SSE');
      return Promise.resolve();
    }

    this.connectionPromise = this._performConnect(endpoint);
    
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Internal method to perform the actual connection
   */
  async _performConnect(endpoint) {
    try {
      // Close existing connection if any
      this.close();

      console.log('📡 Connecting to SSE endpoint...');

      // Get access token
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${Baseurl()}${endpoint}`;
      console.log('🔗 SSE URL:', url);

      // Create EventSource with authorization header
      this.eventSource = new EventSource(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        pollingInterval: 0, // Disable polling, use pure SSE
      });

      // Set up event listeners
      this.eventSource.addEventListener('open', () => {
        console.log('✅ SSE connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('open', { connected: true });
      });

      this.eventSource.addEventListener('message', (event) => {
        console.log('📦 SSE message received');
        this.handleMessage(event);
      });

      this.eventSource.addEventListener('error', (event) => {
        console.error('❌ SSE error:', event);
        
        if (event.type === 'error') {
          const errorData = {
            error: event.message || 'SSE connection error',
            type: 'connection_error',
            shouldRetry: true,
          };

          // Check for specific error types
          if (event.status === 401) {
            errorData.type = 'authentication_error';
            errorData.shouldRetry = false;
            console.error('❌ Authentication failed');
          } else if (event.status === 404) {
            errorData.type = 'endpoint_not_found';
            errorData.shouldRetry = false;
            console.error('❌ Endpoint not found');
          }

          this.isConnected = false;
          this.emit('error', errorData);

          // Attempt reconnection if appropriate
          if (errorData.shouldRetry && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(endpoint);
          } else if (!errorData.shouldRetry) {
            console.log('🚫 Not attempting reconnection due to error type');
            this.close();
          }
        }
      });

      this.eventSource.addEventListener('close', () => {
        console.log('🔴 SSE connection closed');
        this.isConnected = false;
        this.emit('close', { closed: true });
      });

      // Connection initiated successfully
      return Promise.resolve();

    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      this.isConnected = false;

      let errorType = 'connection_error';
      let shouldRetry = false;

      const errorMsg = error.message.toLowerCase();

      if (errorMsg.includes('no access token')) {
        errorType = 'authentication_error';
        shouldRetry = false;
      }

      this.emit('error', {
        error: error.message,
        type: errorType,
        shouldRetry,
      });

      throw error;
    }
  }

  /**
   * Handle incoming SSE message
   */
  handleMessage(event) {
    try {
      // Parse the data
      let data;
      
      if (typeof event.data === 'string') {
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          console.error('❌ Failed to parse SSE data:', event.data);
          return;
        }
      } else {
        data = event.data;
      }

      // Handle progress updates
      if (data && typeof data === 'object' && typeof data.progress === 'number') {
        this.latestProgress = {
          progress: data.progress,
          message: typeof data.message === 'string' ? data.message : '',
          timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
        };
        
        console.log(
          `📊 Progress: ${this.latestProgress.progress}%`,
          this.latestProgress.message ? `- ${this.latestProgress.message}` : ''
        );
        
        // Emit progress event
        this.emit('progress', this.latestProgress);
        
        // Auto-close if progress reached 100
        if (this.latestProgress.progress >= 100) {
          console.log('✅ Upload complete (100%), closing connection in 1s...');
          setTimeout(() => {
            this.close();
          }, 1000);
        }
      } else {
        // Emit generic message event
        this.emit('message', data);
      }
    } catch (error) {
      console.error('❌ Error handling SSE message:', error);
    }
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect(endpoint) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🚫 Max reconnection attempts reached');
      this.emit('error', {
        error: 'Max reconnection attempts reached',
        type: 'reconnect_failed',
        shouldRetry: false,
      });
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`
    );

    setTimeout(() => {
      this.connect(endpoint);
    }, this.reconnectDelay);
  }

  /**
   * Close the SSE connection
   */
  close() {
    console.log('🔌 Closing SSE connection...');
    
    this.isConnected = false;

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (error) {
        console.error('❌ Error closing EventSource:', error);
      }
      this.eventSource = null;
    }

    this.reconnectAttempts = 0;
    this.connectionPromise = null;
  }

  /**
   * Check if connection is active
   */
  isActive() {
    return this.isConnected;
  }

  /**
   * Get latest progress
   */
  getLatestProgress() {
    return this.latestProgress;
  }

  /**
   * Reset progress state
   */
  resetProgress() {
    console.log('🔄 Resetting progress state');
    this.latestProgress = { progress: 0, message: '', timestamp: 0 };
  }

  /**
   * Complete cleanup
   */
  destroy() {
    console.log('💥 Destroying SSE service');
    this.close();
    this.listeners = {};
    this.latestProgress = { progress: 0, message: '', timestamp: 0 };
  }
}

// Export singleton instance
export default new SSEService();