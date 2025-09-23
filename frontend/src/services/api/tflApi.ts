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

  // Station Crowding Data
  getStationCrowding: async (naptanId: string) => {
    try {
      const response = await apiClient.get(`/api/tfl/crowding/${naptanId}`);
      return response.data;
    } catch (error) {
      console.error('Station Crowding Error:', error);
      throw error;
    }
  },
};
