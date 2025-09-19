'use client';

import { useState, useEffect } from 'react';
import { tflApi } from '../services/api/tflApi';

interface TflResponse {
  $type: string;
  disambiguation: {
    $type: string;
    disambiguationOptions: Array<{
      $type: string;
      description: string;
      uri: string;
    }>;
  };
}

interface HealthResponse {
  status: string;
  api_key_configured: boolean;
}

export default function TflApiTest() {
  const [tflData, setTflData] = useState<TflResponse | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTflData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tflApi.testTflApi();
      setTflData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch TFL data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthData = async () => {
    try {
      const data = await tflApi.healthCheck();
      setHealthData(data);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🚇 Tube Trace - TFL API Test
          </h1>

          {/* Health Status */}
          {healthData && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Backend Status
              </h2>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  healthData.status === 'healthy' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {healthData.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  healthData.api_key_configured 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  API Key: {healthData.api_key_configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>
            </div>
          )}

          {/* Test Button */}
          <div className="mb-6">
            <button
              onClick={fetchTflData}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-tube-red text-white hover:bg-red-700'
              }`}
            >
              {loading ? 'Loading...' : 'Test TFL API Call'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Error
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* TFL Data Display */}
          {tflData && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                TFL API Response
              </h2>
              
              {/* Disambiguation Options */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-3">
                  Circle Line Timetable Options
                </h3>
                <div className="space-y-2">
                  {tflData.disambiguation.disambiguationOptions.map((option, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <p className="font-medium text-gray-900 mb-1">
                        {option.description}
                      </p>
                      <p className="text-sm text-gray-600 font-mono">
                        URI: {option.uri}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Raw JSON Response
                </h3>
                <pre className="text-sm text-gray-700 overflow-x-auto bg-white p-3 rounded border">
                  {JSON.stringify(tflData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
