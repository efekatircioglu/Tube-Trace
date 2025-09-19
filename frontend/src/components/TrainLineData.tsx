'use client';

import { useState } from 'react';
import { tflApi } from '../services/api/tflApi';

interface LineStatus {
  $type: string;
  id: string;
  name: string;
  modeName: string;
  disruptions: Array<{
    $type: string;
    category: string;
    type: string;
    categoryDescription: string;
    description: string;
    affectedRoutes: any[];
    affectedStops: any[];
    closureText: string;
  }>;
  lineStatuses: Array<{
    $type: string;
    id: string;
    statusSeverity: number;
    statusSeverityDescription: string;
    reason?: string;
    validityPeriods: any[];
  }>;
}

interface LineStatus {
  $type: string;
  id: string;
  name: string;
  modeName: string;
  disruptions: Array<{
    $type: string;
    category: string;
    type: string;
    categoryDescription: string;
    description: string;
    affectedRoutes: any[];
    affectedStops: any[];
    closureText: string;
  }>;
  lineStatuses: Array<{
    $type: string;
    id: string;
    statusSeverity: number;
    statusSeverityDescription: string;
    reason?: string;
    validityPeriods: any[];
  }>;
}

interface Arrival {
  $type: string;
  id: string;
  operationType: number;
  vehicleId: string;
  naptanId: string;
  stationName: string;
  lineId: string;
  platformName: string;
  direction: string;
  bearing: string;
  destinationNaptanId: string;
  destinationName: string;
  towards: string;
  expectedArrival: string;
  timeToStation: number;
  currentLocation: string;
  inCongestion: boolean;
  inPip: boolean;
}

export default function TrainLineData() {
  const [statusData, setStatusData] = useState<LineStatus[] | null>(null);
  const [arrivalsData, setArrivalsData] = useState<Arrival[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLines, setSelectedLines] = useState<string[]>(['circle']);
  const [searchStation, setSearchStation] = useState('');

  const fetchStatus = async () => {
    if (selectedLines.length === 0) {
      setError('Please select at least one train line');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await tflApi.getLineArrivals(selectedLines.join(','));
      // For status, we'll use the arrivals data to infer status
      setStatusData([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch line status');
    } finally {
      setLoading(false);
    }
  };

  const fetchArrivals = async () => {
    if (selectedLines.length === 0) {
      setError('Please select at least one train line');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch both status and arrivals data
      const [statusData, arrivalsData] = await Promise.all([
        tflApi.getLineStatus(selectedLines.join(',')),
        tflApi.getLineArrivals(selectedLines.join(','))
      ]);
      
      setStatusData(statusData);
      setArrivalsData(arrivalsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeToStation = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const countUniqueTrainsPerLine = (arrivalsData: Arrival[]) => {
    const trainCounts: Record<string, number> = {};
    
    arrivalsData.forEach(arrival => {
      const lineId = arrival.lineId;
      if (!trainCounts[lineId]) {
        trainCounts[lineId] = 0;
      }
    });

    // Count unique vehicle IDs per line
    const uniqueVehiclesPerLine: Record<string, Set<string>> = {};
    arrivalsData.forEach(arrival => {
      const lineId = arrival.lineId;
      if (!uniqueVehiclesPerLine[lineId]) {
        uniqueVehiclesPerLine[lineId] = new Set();
      }
      if (arrival.vehicleId) {
        uniqueVehiclesPerLine[lineId].add(arrival.vehicleId);
      }
    });

    // Convert sets to counts
    Object.keys(uniqueVehiclesPerLine).forEach(lineId => {
      trainCounts[lineId] = uniqueVehiclesPerLine[lineId].size;
    });

    return trainCounts;
  };

  const getLineColor = (lineId: string) => {
    const colors: Record<string, string> = {
      'bakerloo': 'bg-brown-600',
      'central': 'bg-red-600',
      'circle': 'bg-yellow-500',
      'district': 'bg-green-600',
      'hammersmith-city': 'bg-pink-500',
      'jubilee': 'bg-gray-600',
      'metropolitan': 'bg-purple-600',
      'northern': 'bg-black',
      'piccadilly': 'bg-blue-600',
      'victoria': 'bg-blue-500',
      'waterloo-city': 'bg-teal-500',
      'elizabeth': 'bg-purple-500'
    };
    return colors[lineId] || 'bg-gray-500';
  };

  const getLineName = (lineId: string) => {
    const names: Record<string, string> = {
      'bakerloo': 'Bakerloo Line',
      'central': 'Central Line',
      'circle': 'Circle Line',
      'district': 'District Line',
      'hammersmith-city': 'Hammersmith & City Line',
      'jubilee': 'Jubilee Line',
      'metropolitan': 'Metropolitan Line',
      'northern': 'Northern Line',
      'piccadilly': 'Piccadilly Line',
      'victoria': 'Victoria Line',
      'waterloo-city': 'Waterloo & City Line',
      'elizabeth': 'Elizabeth Line'
    };
    return names[lineId] || lineId;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🚇 Train Line Data
          </h1>

          {/* Line Selection */}
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

          {/* Action Buttons */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={fetchArrivals}
              disabled={loading || selectedLines.length === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                loading || selectedLines.length === 0
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-tube-yellow text-black hover:bg-yellow-600'
              }`}
            >
              {loading ? 'Loading...' : 'Get Arrivals'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Status Display */}
          {statusData && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Line Status
              </h2>
              <div className="space-y-4">
                {statusData.map((line, index) => {
                  const trainCounts = arrivalsData ? countUniqueTrainsPerLine(arrivalsData) : {};
                  const trainCount = trainCounts[line.id] || 0;
                  
                  return (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className={`w-4 h-4 rounded-full mr-3 ${getLineColor(line.id)}`}></span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {line.name}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {line.modeName}
                          </span>
                          {arrivalsData && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {trainCount} train{trainCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    
                    {/* Line Statuses */}
                    <div className="space-y-2">
                      {line.lineStatuses.map((status, statusIndex) => (
                        <div key={statusIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              status.statusSeverity === 10 
                                ? 'bg-green-100 text-green-800' 
                                : status.statusSeverity === 6
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : status.statusSeverity === 5
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                              {status.statusSeverityDescription}
                            </span>
                            {status.reason && (
                              <span className="text-sm text-gray-600">
                                {status.reason}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Disruptions */}
                    {line.disruptions && line.disruptions.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Disruptions:</h4>
                        <div className="space-y-2">
                          {line.disruptions.map((disruption, disruptionIndex) => (
                            <div key={disruptionIndex} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                              <div className="font-medium text-red-800 mb-1">
                                {disruption.categoryDescription}
                              </div>
                              <div className="text-red-700">
                                {disruption.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Arrivals Display */}
          {arrivalsData && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedLines.map(line => getLineName(line)).join(', ')} Arrivals
                </h2>
              </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-100 p-3 rounded-lg text-center">
                  <div className="text-sm text-green-700">
                    <span className="text-2xl font-bold text-green-800">
                      {arrivalsData.filter(a => a.timeToStation < 120).length}
                    </span> trains → Arriving in next 2 minutes
                  </div>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg text-center">
                  <div className="text-sm text-yellow-700">
                    <span className="text-2xl font-bold text-yellow-800">
                      {arrivalsData.filter(a => a.timeToStation >= 120 && a.timeToStation < 300).length}
                    </span> trains → Arriving in 2-5 minutes
                  </div>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg text-center">
                  <div className="text-sm text-blue-700">
                    <span className="text-2xl font-bold text-blue-800">
                      {arrivalsData.filter(a => a.timeToStation >= 300 && a.timeToStation < 600).length}
                    </span> trains → Arriving in 5-10 minutes
                  </div>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-700">
                    <span className="text-2xl font-bold text-gray-800">
                      {arrivalsData.filter(a => a.timeToStation >= 600).length}
                    </span> trains → Arriving in 10+ minutes
                  </div>
                </div>
              </div>

              {/* Search Filter */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search stations..."
                  value={searchStation}
                  onChange={(e) => setSearchStation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tube-yellow focus:border-transparent"
                />
              </div>

              {/* Station Groups */}
              <div className="space-y-4">
                {Object.entries(
                  arrivalsData.reduce((groups, arrival) => {
                    const station = arrival.stationName.replace(' Underground Station', '');
                    if (!groups[station]) groups[station] = [];
                    groups[station].push(arrival);
                    return groups;
                  }, {} as Record<string, Arrival[]>)
                )
                .filter(([stationName]) => 
                  searchStation === '' || 
                  stationName.toLowerCase().includes(searchStation.toLowerCase())
                )
                .sort(([,a], [,b]) => Math.min(...a.map(arr => arr.timeToStation)) - Math.min(...b.map(arr => arr.timeToStation)))
                .map(([stationName, arrivals]) => (
                  <div key={stationName} className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${getLineColor(arrivals[0]?.lineId || '')}`}></span>
                      {stationName}
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        ({arrivals.length} train{arrivals.length !== 1 ? 's' : ''})
                      </span>
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100 text-gray-700 font-medium">
                            <th className="px-3 py-2 text-left">ID</th>
                            <th className="px-3 py-2 text-left">Arrival Time</th>
                            <th className="px-3 py-2 text-left">Platform</th>
                            <th className="px-3 py-2 text-left">Train ID</th>
                            <th className="px-3 py-2 text-left">Destination</th>
                            <th className="px-3 py-2 text-left">UK Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {arrivals
                            .sort((a, b) => a.timeToStation - b.timeToStation)
                            .map((arrival, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-500 font-medium">
                                {index + 1}
                              </td>
                              <td className="px-3 py-2">
                                <div className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                                  arrival.timeToStation < 120 
                                    ? 'bg-green-100 text-green-800' 
                                    : arrival.timeToStation < 300 
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {formatTimeToStation(arrival.timeToStation)}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                {(() => {
                                  // Extract platform number from various platformName formats
                                  const platformMatch = arrival.platformName.match(/Platform (\d+)/i);
                                  if (platformMatch) {
                                    return (
                                      <span className="font-medium text-gray-700">
                                        {platformMatch[1]}
                                      </span>
                                    );
                                  }
                                  return <span className="text-gray-400">-</span>;
                                })()}
                              </td>
                              <td className="px-3 py-2">
                                {arrival.vehicleId ? (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                                    #{arrival.vehicleId}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {arrival.towards || arrival.destinationName}
                              </td>
                              <td className="px-3 py-2 text-gray-500">
                                {new Date(arrival.expectedArrival).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
