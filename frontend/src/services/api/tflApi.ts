import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const tflApi = {
  // Test TFL API call
  testTflApi: async () => {
    try {
      const response = await apiClient.get('/api/tfl/test');
      return response.data;
    } catch (error) {
      console.error('TFL API Error:', error);
      throw error;
    }
  },

  // Circle Line Status
  getCircleLineStatus: async () => {
    try {
      const response = await apiClient.get('/api/tfl/circle/status');
      return response.data;
    } catch (error) {
      console.error('Circle Line Status Error:', error);
      throw error;
    }
  },

  // Circle Line Arrivals
  getCircleLineArrivals: async () => {
    try {
      const response = await apiClient.get('/api/tfl/circle/arrivals');
      return response.data;
    } catch (error) {
      console.error('Circle Line Arrivals Error:', error);
      throw error;
    }
  },

  // Transport Disruptions
  getTransportDisruptions: async (modes: string = 'tube,bus,dlr') => {
    try {
      const response = await apiClient.get(`/api/tfl/disruptions?modes=${modes}`);
      return response.data;
    } catch (error) {
      console.error('Transport Disruptions Error:', error);
      throw error;
    }
  },

  // Line-specific Disruptions
  getLineDisruptions: async (lineIds: string) => {
    try {
      const response = await apiClient.get(`/api/tfl/lines/disruptions?line_ids=${lineIds}`);
      return response.data;
    } catch (error) {
      console.error('Line Disruptions Error:', error);
      throw error;
    }
  },

  // Line-specific Arrivals
  getLineArrivals: async (lineIds: string) => {
    try {
      const response = await apiClient.get(`/api/tfl/lines/arrivals?line_ids=${lineIds}`);
      return response.data;
    } catch (error) {
      console.error('Line Arrivals Error:', error);
      throw error;
    }
  },

  // Line-specific Status
  getLineStatus: async (lineIds: string) => {
    try {
      const response = await apiClient.get(`/api/tfl/lines/status?line_ids=${lineIds}`);
      return response.data;
    } catch (error) {
      console.error('Line Status Error:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health Check Error:', error);
      throw error;
    }
  },

  // Root endpoint
  getRoot: async () => {
    try {
      const response = await apiClient.get('/');
      return response.data;
    } catch (error) {
      console.error('Root API Error:', error);
      throw error;
    }
  },
};
