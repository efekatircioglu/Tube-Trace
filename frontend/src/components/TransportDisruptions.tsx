'use client';

import { useState } from 'react';
import { tflApi } from '../services/api/tflApi';

interface Disruption {
  $type: string;
  id?: string;
  category: string;
  categoryDescription: string;
  description: string;
  affectedRoutes: Array<{
    $type: string;
    id: string;
    name: string;
    modeName: string;
    disruptions: any[];
    created: string;
    modified: string;
  }>;
  affectedStops: any[];
  closureText?: string;
  additionalInfo?: string;
  created?: string;
  lastUpdate?: string;
}

export default function TransportDisruptions() {
  const [disruptionsData, setDisruptionsData] = useState<Disruption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModes, setSelectedModes] = useState<string>('tube,bus,dlr');
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [queryType, setQueryType] = useState<'modes' | 'lines'>('modes');

  const fetchDisruptions = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (queryType === 'modes') {
        data = await tflApi.getTransportDisruptions(selectedModes);
      } else {
        if (selectedLines.length === 0) {
          setError('Please select at least one train line');
          return;
        }
        data = await tflApi.getLineDisruptions(selectedLines.join(','));
      }
      setDisruptionsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch disruptions');
    } finally {
      setLoading(false);
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'tube': return 'bg-tube-red text-white';
      case 'bus': return 'bg-tube-red text-white';
      case 'dlr': return 'bg-tube-green text-white';
      case 'tram': return 'bg-tube-red text-white';
      case 'overground': return 'bg-tube-orange text-white';
      case 'tflrail': return 'bg-tube-blue text-white';
      case 'elizabeth-line': return 'bg-purple-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'realtime': return 'bg-red-100 text-red-800';
      case 'plannedwork': return 'bg-yellow-100 text-yellow-800';
      case 'information': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date available';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🚨 Transport Disruptions
          </h1>

          {/* Query Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query Type:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="queryType"
                  value="modes"
                  checked={queryType === 'modes'}
                  onChange={(e) => setQueryType(e.target.value as 'modes' | 'lines')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">By Transport Modes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="queryType"
                  value="lines"
                  checked={queryType === 'lines'}
                  onChange={(e) => setQueryType(e.target.value as 'modes' | 'lines')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">By Train Lines</span>
              </label>
            </div>
          </div>

          {/* Mode Selection */}
          {queryType === 'modes' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Transport Modes:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'tube', label: 'Tube' },
                  { value: 'bus', label: 'Bus' },
                  { value: 'dlr', label: 'DLR' },
                  { value: 'overground', label: 'Overground' },
                  { value: 'tram', label: 'Tram' }
                ].map((mode) => (
                  <label key={mode.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedModes.includes(mode.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModes(prev => 
                            prev ? `${prev},${mode.value}` : mode.value
                          );
                        } else {
                          setSelectedModes(prev => 
                            prev.split(',').filter(m => m !== mode.value).join(',')
                          );
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{mode.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Train Line Selection */}
          {queryType === 'lines' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Train Lines:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'bakerloo', label: 'Bakerloo Line' },
                  { value: 'central', label: 'Central Line' },
                  { value: 'circle', label: 'Circle Line' },
                  { value: 'district', label: 'District Line' },
                  { value: 'hammersmith-city', label: 'Hammersmith & City Line' },
                  { value: 'jubilee', label: 'Jubilee Line' },
                  { value: 'metropolitan', label: 'Metropolitan Line' },
                  { value: 'northern', label: 'Northern Line' },
                  { value: 'piccadilly', label: 'Piccadilly Line' },
                  { value: 'victoria', label: 'Victoria Line' },
                  { value: 'waterloo-city', label: 'Waterloo & City Line' },
                  { value: 'elizabeth', label: 'Elizabeth Line' }
                ].map((line) => (
                  <label key={line.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedLines.includes(line.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLines(prev => [...prev, line.value]);
                        } else {
                          setSelectedLines(prev => prev.filter(l => l !== line.value));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{line.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Fetch Button */}
          <div className="mb-6">
            <button
              onClick={fetchDisruptions}
              disabled={loading || (queryType === 'modes' ? !selectedModes : selectedLines.length === 0)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                loading || (queryType === 'modes' ? !selectedModes : selectedLines.length === 0)
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {loading ? 'Loading...' : 'Get Disruptions'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Disruptions Display */}
          {disruptionsData && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Current Disruptions ({disruptionsData.length} total)
              </h2>
              
              {disruptionsData.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    🎉 No Disruptions!
                  </h3>
                  <p className="text-green-700">
                    All selected transport modes are running normally.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disruptionsData.map((disruption, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {disruption.created && disruption.created !== null && (
                              <span className="text-sm text-gray-600">
                                {formatDate(disruption.created)}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {disruption.description}
                          </h3>
                          {disruption.additionalInfo && (
                            <p className="text-sm text-gray-600 mb-2">{disruption.additionalInfo}</p>
                          )}
                        </div>
                      </div>

                      {/* Affected Routes */}
                      {disruption.affectedRoutes && disruption.affectedRoutes.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Affected Routes:</h4>
                          <div className="flex flex-wrap gap-2">
                            {disruption.affectedRoutes.map((route, routeIndex) => (
                              <span
                                key={routeIndex}
                                className={`px-2 py-1 rounded text-xs font-medium ${getModeColor(route.modeName)}`}
                              >
                                {route.name} ({route.modeName})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Last Update */}
                      {disruption.lastUpdate && (
                        <div className="mt-2 text-xs text-gray-500">
                          Last updated: {formatDate(disruption.lastUpdate)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
