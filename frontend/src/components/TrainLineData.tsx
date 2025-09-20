'use client';

import React, { useState, useEffect } from 'react';
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
  const [lineTopology, setLineTopology] = useState<any>(null);
  const [crowdingData, setCrowdingData] = useState<Record<string, any>>({});

  // Load line topology data
  useEffect(() => {
    fetch('/line_topology.json')
      .then(response => response.json())
      .then(data => setLineTopology(data))
      .catch(err => console.error('Failed to load line topology:', err));
  }, []);

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
      
      // Fetch crowding data for all stations
      await fetchCrowdingData(arrivalsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch crowding data for all stations
  const fetchCrowdingData = async (arrivals: Arrival[]) => {
    if (!arrivals || arrivals.length === 0) return;

    // Get unique NAPTAN IDs from arrivals
    const uniqueNaptanIds = Array.from(new Set(arrivals.map(arrival => arrival.naptanId).filter(Boolean)));
    
    // Fetch crowding data for each station
    const crowdingPromises = uniqueNaptanIds.map(async (naptanId) => {
      try {
        const crowdingData = await tflApi.getStationCrowding(naptanId);
        return { naptanId, crowdingData };
      } catch (error) {
        console.error(`Failed to fetch crowding data for ${naptanId}:`, error);
        return { naptanId, crowdingData: null };
      }
    });

    const crowdingResults = await Promise.all(crowdingPromises);
    
    // Convert to object for easy lookup
    const crowdingMap = crowdingResults.reduce((acc, { naptanId, crowdingData }) => {
      acc[naptanId] = crowdingData;
      return acc;
    }, {} as Record<string, any>);

    setCrowdingData(crowdingMap);
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

  // Function to format crowding data
  const formatCrowdingData = (crowdingData: any) => {
    if (!crowdingData || !crowdingData.dataAvailable) {
      return { text: 'No Data', color: 'bg-gray-100 text-gray-600' };
    }

    const percentage = crowdingData.percentageOfBaseline || 0;
    const percentageText = `${Math.round(percentage * 100)}%`;
    
    if (percentage < 0.5) {
      return { text: `Low (${percentageText})`, color: 'bg-green-100 text-green-800' };
    } else if (percentage < 1.0) {
      return { text: `Medium (${percentageText})`, color: 'bg-yellow-100 text-yellow-800' };
    } else if (percentage < 1.5) {
      return { text: `High (${percentageText})`, color: 'bg-orange-100 text-orange-800' };
    } else {
      return { text: `Very High (${percentageText})`, color: 'bg-red-100 text-red-800' };
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

  // Enhanced function to calculate exact duration using same train movement
  const calculateDynamicDuration = (
    allArrivals: Arrival[], 
    currentStation: string, 
    nextStation: string, 
    lineId: string,
    currentVehicleId: string
  ): string => {
    if (nextStation === 'Terminal') {
      return 'N/A';
    }

    // Find the same train (vehicle ID) at both current and next stations
    const currentTrainArrival = allArrivals.find(arrival => 
      arrival.vehicleId === currentVehicleId &&
      arrival.stationName.toLowerCase().includes(currentStation.toLowerCase()) &&
      arrival.lineId.toLowerCase() === lineId.toLowerCase()
    );

    const nextTrainArrival = allArrivals.find(arrival => 
      arrival.vehicleId === currentVehicleId &&
      arrival.stationName.toLowerCase().includes(nextStation.toLowerCase()) &&
      arrival.lineId.toLowerCase() === lineId.toLowerCase()
    );

    if (currentTrainArrival && nextTrainArrival) {
      // Calculate exact time difference
      const currentTime = new Date(currentTrainArrival.expectedArrival).getTime();
      const nextTime = new Date(nextTrainArrival.expectedArrival).getTime();
      const timeDifferenceMs = nextTime - currentTime;
      
      if (timeDifferenceMs > 0) {
        const totalSeconds = Math.floor(timeDifferenceMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m${seconds}s`;
      }
    }

    // Fallback: look for any train making this journey
    const trainMovements = trackTrainMovements(allArrivals, lineId);
    const relevantMovements = trainMovements.filter(movement => 
      movement.fromStation.toLowerCase().includes(currentStation.toLowerCase()) &&
      movement.toStation.toLowerCase().includes(nextStation.toLowerCase())
    );

    if (relevantMovements.length > 0) {
      const averageTravelTime = relevantMovements.reduce((sum, movement) => {
        return sum + movement.travelTime;
      }, 0) / relevantMovements.length;

      const totalSeconds = Math.max(60, Math.round(averageTravelTime * 60));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}m${seconds}s`;
    }

    // Simple fallback: use default travel time
    return '2m0s';
  };

  // Function to track train movements between stations
  const trackTrainMovements = (allArrivals: Arrival[], lineId: string) => {
    const movements: Array<{
      vehicleId: string;
      fromStation: string;
      toStation: string;
      travelTime: number;
    }> = [];

    // Group arrivals by vehicle ID to track movements
    const trainsByVehicleId: Record<string, Arrival[]> = {};
    
    allArrivals.forEach(arrival => {
      if (arrival.vehicleId && arrival.lineId.toLowerCase() === lineId.toLowerCase()) {
        if (!trainsByVehicleId[arrival.vehicleId]) {
          trainsByVehicleId[arrival.vehicleId] = [];
        }
        trainsByVehicleId[arrival.vehicleId].push(arrival);
      }
    });

    // Analyze movements for each train
    Object.values(trainsByVehicleId).forEach(trainArrivals => {
      if (trainArrivals.length >= 2) {
        // Sort by arrival time to track movement sequence
        const sortedArrivals = trainArrivals.sort((a, b) => 
          new Date(a.expectedArrival).getTime() - new Date(b.expectedArrival).getTime()
        );

        // Calculate travel times between consecutive stations
        for (let i = 0; i < sortedArrivals.length - 1; i++) {
          const currentArrival = sortedArrivals[i];
          const nextArrival = sortedArrivals[i + 1];
          
          const currentStation = currentArrival.stationName.replace(' Underground Station', '').replace(' Underground', '');
          const nextStation = nextArrival.stationName.replace(' Underground Station', '').replace(' Underground', '');
          
          // Calculate travel time in minutes
          const currentTime = new Date(currentArrival.expectedArrival).getTime();
          const nextTime = new Date(nextArrival.expectedArrival).getTime();
          const travelTimeMinutes = Math.round((nextTime - currentTime) / (1000 * 60));

          if (travelTimeMinutes > 0 && travelTimeMinutes < 30) { // Reasonable travel time
            movements.push({
              vehicleId: currentArrival.vehicleId!,
              fromStation: currentStation,
              toStation: nextStation,
              travelTime: travelTimeMinutes
            });
          }
        }
      }
    });

    return movements;
  };

  // Function to determine direction based on current station and destination
  const determineDirection = (currentStation: string, destination: string, stationSequence: string[]): string => {
    const currentIndex = stationSequence.findIndex((station: string) => 
      station.toLowerCase().includes(currentStation.toLowerCase()) ||
      currentStation.toLowerCase().includes(station.toLowerCase())
    );
    
    const destIndex = stationSequence.findIndex((station: string) => 
      station.toLowerCase().includes(destination.toLowerCase()) ||
      destination.toLowerCase().includes(station.toLowerCase())
    );
    
    if (currentIndex === -1 || destIndex === -1) {
      return 'unknown';
    }
    
    return destIndex > currentIndex ? 'southbound' : 'northbound';
  };

  // Function to determine Northern Line branch and direction
  const determineNorthernLineBranch = (lineData: any, currentStation: string, destination: string, rawDestination: string) => {
    // Safety checks
    if (!lineData || !lineData.branches) {
      return {
        direction: 'unknown',
        stationSequence: []
      };
    }
    
    const branches = lineData.branches;
    const bankBranch = lineData['bank-branch'];
    const cxBranch = lineData['charing-cross-branch'];
    
    // Determine which central route to use based on "via Bank" or "via CX"
    let centralRoute = null;
    let routeName = '';
    
    if (rawDestination && rawDestination.toLowerCase().includes('via bank')) {
      centralRoute = bankBranch;
      routeName = 'Bank Branch';
    } else if (rawDestination && rawDestination.toLowerCase().includes('via cx')) {
      centralRoute = cxBranch;
      routeName = 'Charing Cross Branch';
    } else {
      // Default to Bank branch if no "via" specified
      centralRoute = bankBranch;
      routeName = 'Bank Branch';
    }
    
    if (!centralRoute) {
      return {
        direction: 'unknown',
        stationSequence: []
      };
    }
    
    // Find which northern branch the destination belongs to
    let destinationBranch = null;
    let destinationBranchName = null;
    
    for (const [branchKey, branch] of Object.entries(branches)) {
      const branchStations = (branch as any).stations;
      const found = branchStations.find((station: string) => {
        const stationLower = station.toLowerCase();
        const destLower = destination.toLowerCase();
        return stationLower.includes(destLower) || 
               destLower.includes(stationLower) ||
               stationLower === destLower;
      });
      
      if (found) {
        destinationBranch = branch;
        destinationBranchName = branchKey;
        break;
      }
    }
    
    // Find which northern branch the current station belongs to
    let currentBranch = null;
    let currentBranchName = null;
    
    for (const [branchKey, branch] of Object.entries(branches)) {
      const branchStations = (branch as any).stations;
      const found = branchStations.find((station: string) => {
        const stationLower = station.toLowerCase();
        const currentLower = currentStation.toLowerCase();
        return stationLower.includes(currentLower) || 
               currentLower.includes(stationLower) ||
               stationLower === currentLower;
      });
      
      if (found) {
        currentBranch = branch;
        currentBranchName = branchKey;
        break;
      }
    }
    
    // Check if current station is in central route
    const isCurrentInCentral = centralRoute.stations.find((station: string) => 
      station.toLowerCase().includes(currentStation.toLowerCase()) ||
      currentStation.toLowerCase().includes(station.toLowerCase())
    );
    
    // Check if destination is in central route
    const isDestinationInCentral = centralRoute.stations.find((station: string) => 
      station.toLowerCase().includes(destination.toLowerCase()) ||
      destination.toLowerCase().includes(station.toLowerCase())
    );
    
    // Build the complete station sequence based on routing
    if (isCurrentInCentral && destinationBranch) {
      // Current station is in central route, destination is in northern branch
      const branchStations = (destinationBranch as any).stations;
      const fullSequence = [...centralRoute.stations, ...branchStations];
      const direction = determineDirection(currentStation, destination, fullSequence);
      
      return {
        direction,
        stationSequence: fullSequence
      };
    } else if (currentBranch && isDestinationInCentral) {
      // Current station is in northern branch, destination is in central route
      const branchStations = (currentBranch as any).stations;
      const fullSequence = [...branchStations, ...centralRoute.stations];
      const direction = determineDirection(currentStation, destination, fullSequence);
      
      return {
        direction,
        stationSequence: fullSequence
      };
    } else if (currentBranch && destinationBranch && currentBranchName === destinationBranchName) {
      // Both stations are in the same northern branch
      const branchStations = (currentBranch as any).stations;
      const direction = determineDirection(currentStation, destination, branchStations);
      
      return {
        direction,
        stationSequence: branchStations
      };
    } else if (isCurrentInCentral && isDestinationInCentral) {
      // Both stations are in central route
      const direction = determineDirection(currentStation, destination, centralRoute.stations);
      
      return {
        direction,
        stationSequence: centralRoute.stations
      };
    }
    
    // Fallback: use the central route
    return {
      direction: 'southbound',
      stationSequence: centralRoute.stations
    };
  };

  // Northern Line station roadmap - direct mapping of current station to possible next stations
  const northernLineRoadmap: { [key: string]: string[] } = {
    "Angel": ["King's Cross St. Pancras", "Old Street"],
    "Archway": ["Highgate", "Tufnell Park"],
    "Balham": ["Clapham South", "Tooting Bec"],
    "Bank": ["London Bridge", "Moorgate"],
    "Battersea Power Station": ["Nine Elms"],
    "Belsize Park": ["Chalk Farm", "Hampstead"],
    "Borough": ["Elephant & Castle", "London Bridge"],
    "Brent Cross": ["Golders Green", "Hendon Central"],
    "Burnt Oak": ["Colindale", "Edgware"],
    "Camden Town": ["Chalk Farm", "Euston", "Kentish Town", "Mornington Crescent"],
    "Chalk Farm": ["Belsize Park", "Camden Town"],
    "Charing Cross": ["Embankment", "Leicester Square"],
    "Clapham Common": ["Clapham North", "Clapham South"],
    "Clapham North": ["Clapham Common", "Stockwell"],
    "Clapham South": ["Balham", "Clapham Common"],
    "Colindale": ["Burnt Oak", "Hendon Central"],
    "Colliers Wood": ["South Wimbledon", "Tooting Broadway"],
    "East Finchley": ["Finchley Central", "Highgate"],
    "Edgware": ["Burnt Oak"],
    "Elephant & Castle": ["Borough", "Kennington"],
    "Embankment": ["Charing Cross", "Waterloo"],
    "Euston": ["Camden Town", "King's Cross St. Pancras", "Mornington Crescent", "Warren Street"],
    "Finchley Central": ["East Finchley", "Mill Hill East", "West Finchley"],
    "Golders Green": ["Brent Cross", "Hampstead"],
    "Goodge Street": ["Tottenham Court Road", "Warren Street"],
    "Hampstead": ["Belsize Park", "Golders Green"],
    "Hendon Central": ["Brent Cross", "Colindale"],
    "High Barnet": ["Totteridge & Whetstone"],
    "Highgate": ["Archway", "East Finchley"],
    "Kennington": ["Elephant & Castle", "Nine Elms", "Oval", "Waterloo"],
    "Kentish Town": ["Camden Town", "Tufnell Park"],
    "King's Cross St. Pancras": ["Angel", "Euston"],
    "Leicester Square": ["Charing Cross", "Tottenham Court Road"],
    "London Bridge": ["Bank", "Borough"],
    "Mill Hill East": ["Finchley Central"],
    "Moorgate": ["Bank", "Old Street"],
    "Morden": ["South Wimbledon"],
    "Mornington Crescent": ["Camden Town", "Euston"],
    "Nine Elms": ["Battersea Power Station", "Kennington"],
    "Old Street": ["Angel", "Moorgate"],
    "Oval": ["Kennington", "Stockwell"],
    "South Wimbledon": ["Colliers Wood", "Morden"],
    "Stockwell": ["Clapham North", "Oval"],
    "Tooting Bec": ["Balham", "Tooting Broadway"],
    "Tooting Broadway": ["Colliers Wood", "Tooting Bec"],
    "Tottenham Court Road": ["Goodge Street", "Leicester Square"],
    "Totteridge & Whetstone": ["High Barnet", "Woodside Park"],
    "Tufnell Park": ["Archway", "Kentish Town"],
    "Warren Street": ["Euston", "Goodge Street"],
    "Waterloo": ["Embankment", "Kennington"],
    "West Finchley": ["Finchley Central", "Woodside Park"],
    "Woodside Park": ["Totteridge & Whetstone", "West Finchley"]
  };
  const bakerlooLineRoadmap: { [key: string]: string[] } = {
    "Harrow & Wealdstone": ["Kenton"],
    "Kenton": ["Harrow & Wealdstone", "South Kenton"],
    "South Kenton": ["Kenton", "North Wembley"],
    "North Wembley": ["South Kenton", "Wembley Central"],
    "Wembley Central": ["North Wembley", "Stonebridge Park"],
    "Stonebridge Park": ["Wembley Central", "Harlesden"],
    "Harlesden": ["Stonebridge Park", "Willesden Junction"],
    "Willesden Junction": ["Harlesden", "Kensal Green"],
    "Kensal Green": ["Willesden Junction", "Queen's Park"],
    "Queen's Park": ["Kensal Green", "Kilburn Park"],
    "Kilburn Park": ["Queen's Park", "Maida Vale"],
    "Maida Vale": ["Kilburn Park", "Warwick Avenue"],
    "Warwick Avenue": ["Maida Vale", "Paddington"],
    "Paddington": ["Warwick Avenue", "Edgware Road (Bakerloo)"],
    "Edgware Road (Bakerloo)": ["Paddington", "Marylebone"],
    "Marylebone": ["Edgware Road (Bakerloo)", "Baker Street"],
    "Baker Street": ["Marylebone", "Regent's Park"],
    "Regent's Park": ["Baker Street", "Oxford Circus"],
    "Oxford Circus": ["Regent's Park", "Piccadilly Circus"],
    "Piccadilly Circus": ["Oxford Circus", "Charing Cross"],
    "Charing Cross": ["Piccadilly Circus", "Embankment"],
    "Embankment": ["Charing Cross", "Waterloo"],
    "Waterloo": ["Embankment", "Lambeth North"],
    "Lambeth North": ["Waterloo", "Elephant & Castle"],
    "Elephant & Castle": ["Lambeth North"]
  };

  const circleLineRoadmap: { [key: string]: string[] } = {
    "Hammersmith": ["Goldhawk Road"],          // Hammersmith (shared H&C/Circle) — one direction
    "Goldhawk Road": ["Hammersmith", "Shepherd's Bush Market"],
    "Shepherd's Bush Market": ["Goldhawk Road", "Wood Lane"],
    "Wood Lane": ["Shepherd's Bush Market", "Latimer Road"],
    "Latimer Road": ["Wood Lane", "Ladbroke Grove"],
    "Ladbroke Grove": ["Latimer Road", "Westbourne Park"],
    "Westbourne Park": ["Ladbroke Grove", "Royal Oak"],
    "Royal Oak": ["Westbourne Park", "Paddington"],
    "Paddington": ["Royal Oak", "Edgware Road"],
    "Edgware Road": ["Paddington", "Baker Street"],
    "Baker Street": ["Edgware Road", "Great Portland Street"],
    "Great Portland Street": ["Baker Street", "Euston Square"],
    "Euston Square": ["Great Portland Street", "King's Cross St. Pancras"],
    "King's Cross St. Pancras": ["Euston Square", "Farringdon"],
    "Farringdon": ["King's Cross St. Pancras", "Barbican"],
    "Barbican": ["Farringdon", "Moorgate"],
    "Moorgate": ["Barbican", "Liverpool Street"],
    "Liverpool Street": ["Moorgate", "Aldgate"],
    "Aldgate": ["Liverpool Street", "Tower Hill"],
    "Tower Hill": ["Aldgate", "Monument"],
    "Monument": ["Tower Hill", "Cannon Street"],
    "Cannon Street": ["Monument", "Mansion House"],
    "Mansion House": ["Cannon Street", "Blackfriars"],
    "Blackfriars": ["Mansion House", "Temple"],
    "Temple": ["Blackfriars", "Embankment"],
    "Embankment": ["Temple", "Westminster"],
    "Westminster": ["Embankment", "St. James's Park"],
    "St. James's Park": ["Westminster", "Victoria"],
    "Victoria": ["St. James's Park", "Sloane Square"],
    "Sloane Square": ["Victoria", "South Kensington"],
    "South Kensington": ["Sloane Square", "Gloucester Road"],
    "Gloucester Road": ["South Kensington", "High Street Kensington"],
    "High Street Kensington": ["Gloucester Road", "Notting Hill Gate"],
    "Notting Hill Gate": ["High Street Kensington", "Holland Park"],
    "Holland Park": ["Notting Hill Gate", "Shepherd's Bush (Central)"] // continues toward Hammersmith via the H&C shared section
  };
  const hammersmithAndCityLineRoadmap: { [key: string]: string[] } = {
    "Hammersmith": ["Goldhawk Road"],
    "Goldhawk Road": ["Hammersmith", "Shepherd's Bush Market"],
    "Shepherd's Bush Market": ["Goldhawk Road", "Wood Lane"],
    "Wood Lane": ["Shepherd's Bush Market", "Latimer Road"],
    "Latimer Road": ["Wood Lane", "Ladbroke Grove"],
    "Ladbroke Grove": ["Latimer Road", "Westbourne Park"],
    "Westbourne Park": ["Ladbroke Grove", "Royal Oak"],
    "Royal Oak": ["Westbourne Park", "Paddington"],
    "Paddington": ["Royal Oak", "Edgware Road (H&C)"],
    "Edgware Road (H&C)": ["Paddington", "Baker Street"],
    "Baker Street": ["Edgware Road (H&C)", "Great Portland Street"],
    "Great Portland Street": ["Baker Street", "Euston Square"],
    "Euston Square": ["Great Portland Street", "King's Cross St. Pancras"],
    "King's Cross St. Pancras": ["Euston Square", "Farringdon"],
    "Farringdon": ["King's Cross St. Pancras", "Barbican"],
    "Barbican": ["Farringdon", "Moorgate"],
    "Moorgate": ["Barbican", "Liverpool Street"],
    "Liverpool Street": ["Moorgate", "Aldgate East"],
    "Aldgate East": ["Liverpool Street", "Whitechapel"],
    "Whitechapel": ["Aldgate East", "Stepney Green"],
    "Stepney Green": ["Whitechapel", "Mile End"],
    "Mile End": ["Stepney Green", "Bow Road"],
    "Bow Road": ["Mile End", "Bromley-by-Bow"],
    "Bromley-by-Bow": ["Bow Road", "West Ham"],
    "West Ham": ["Bromley-by-Bow", "Plaistow"],
    "Plaistow": ["West Ham", "Upton Park"],
    "Upton Park": ["Plaistow", "East Ham"],
    "East Ham": ["Upton Park", "Barking"],
    "Barking": ["East Ham"]
  };
  const jubileeLineRoadmap: { [key: string]: string[] } = {
    "Stanmore": ["Canons Park"],
    "Canons Park": ["Stanmore", "Queensbury"],
    "Queensbury": ["Canons Park", "Kingsbury"],
    "Kingsbury": ["Queensbury", "Wembley Park"],
    "Wembley Park": ["Kingsbury", "Neasden"],
    "Neasden": ["Wembley Park", "Dollis Hill"],
    "Dollis Hill": ["Neasden", "Willesden Green"],
    "Willesden Green": ["Dollis Hill", "Kilburn"],
    "Kilburn": ["Willesden Green", "West Hampstead"],
    "West Hampstead": ["Kilburn", "Finchley Road"],
    "Finchley Road": ["West Hampstead", "Wembley Park"], // note: some interleaving between Finchley Road / Swiss Cottage area
    "Swiss Cottage": ["Finchley Road", "St. John's Wood"],
    "St. John's Wood": ["Swiss Cottage", "Baker Street"],
    "Baker Street": ["St. John's Wood", "Bond Street"],
    "Bond Street": ["Baker Street", "Green Park"],
    "Green Park": ["Bond Street", "Westminster"],
    "Westminster": ["Green Park", "Waterloo"],
    "Waterloo": ["Westminster", "Southwark"],
    "Southwark": ["Waterloo", "London Bridge"],
    "London Bridge": ["Southwark", "Bermondsey"],
    "Bermondsey": ["London Bridge", "Canada Water"],
    "Canada Water": ["Bermondsey", "Canary Wharf"],
    "Canary Wharf": ["Canada Water", "West Silvertown"],
    "West Silvertown": ["Canary Wharf", "Pontoon Dock"],
    "Pontoon Dock": ["West Silvertown", "Canning Town"],
    "Canning Town": ["Pontoon Dock", "Stratford"],
    "Stratford": ["Canning Town", "North Greenwich"],
    "North Greenwich": ["Stratford", "Canning Town", "???"] // core extension patterns handled as Stratford ↔ North Greenwich ↔ Canning Town
  };
  const metropolitanLineRoadmap: { [key: string]: string[] } = {
    "Aldgate": ["Liverpool Street"],
    "Liverpool Street": ["Aldgate", "Moorgate"],
    "Moorgate": ["Liverpool Street", "Barbican"],
    "Barbican": ["Moorgate", "Farringdon"],
    "Farringdon": ["Barbican", "King's Cross St. Pancras"],
    "King's Cross St. Pancras": ["Farringdon", "Euston Square"],
    "Euston Square": ["King's Cross St. Pancras", "Great Portland Street"],
    "Great Portland Street": ["Euston Square", "Baker Street"],
    "Baker Street": ["Great Portland Street", "Finchley Road"],
    "Finchley Road": ["Baker Street", "Wembley Park"],
    "Wembley Park": ["Finchley Road", "Neasden"],
    "Neasden": ["Wembley Park", "Northwick Park"],
    "Northwick Park": ["Neasden", "Harrow-on-the-Hill"],
    "Harrow-on-the-Hill": ["Northwick Park", "North Harrow"],
    "North Harrow": ["Harrow-on-the-Hill", "Pinner"],
    "Pinner": ["North Harrow", "Northwood Hills"],
    "Northwood Hills": ["Pinner", "Northwood"],
    "Northwood": ["Northwood Hills", "Moor Park"],
    "Moor Park": ["Northwood", "Croxley"],
    "Croxley": ["Moor Park", "Watford"],
    "Watford": ["Croxley"],
    "Rickmansworth": ["Chorleywood", "Moor Park"],
    "Chorleywood": ["Rickmansworth", "Chalfont & Latimer"],
    "Chalfont & Latimer": ["Chorleywood", "Chesham"],
    "Chesham": ["Chalfont & Latimer"],
    "Amersham": ["Chalfont & Latimer"], // expresses the far branches (Amersham/Chesham/Watford/Uxbridge) — adjacency varies by branch
    "Uxbridge": ["Harrow-on-the-Hill"] // Uxbridge branch meets the core around Harrow-on-the-Hill / Rayners Lane area (service pattern aware)
  };
  const piccadillyLineRoadmap: { [key: string]: string[] } = {
    /* Eastern terminus Cockfosters; western branches to Uxbridge and Heathrow (via Acton Town split). */
    "Cockfosters": ["Oakwood"],
    "Oakwood": ["Cockfosters", "Arnos Grove"],
    "Arnos Grove": ["Oakwood", "Southgate"],
    "Southgate": ["Arnos Grove", "Woodside Park"],
    "Wood Green": ["Turnpike Lane", "Arnos Grove"],
    "Turnpike Lane": ["Wood Green", "Manor House"],
    "Manor House": ["Turnpike Lane", "Finsbury Park"],
    "Finsbury Park": ["Manor House", "Arsenal"],
    "Arsenal": ["Finsbury Park", "Holloway Road"],
    "Holloway Road": ["Arsenal", "Caledonian Road"],
    "Caledonian Road": ["Holloway Road", "King's Cross St. Pancras"],
    "King's Cross St. Pancras": ["Caledonian Road", "Russell Square"],
    "Russell Square": ["King's Cross St. Pancras", "Holborn"],
    "Holborn": ["Russell Square", "Covent Garden"],
    "Covent Garden": ["Holborn", "Leicester Square"],
    "Leicester Square": ["Covent Garden", "Piccadilly Circus"],
    "Piccadilly Circus": ["Leicester Square", "Green Park"],
    "Green Park": ["Piccadilly Circus", "Hyde Park Corner"],
    "Hyde Park Corner": ["Green Park", "Knightsbridge"],
    "Knightsbridge": ["Hyde Park Corner", "South Kensington"],
    "South Kensington": ["Knightsbridge", "Gloucester Road"],
    "Gloucester Road": ["South Kensington", "Earls Court"],
    "Earls Court": ["Gloucester Road", "Barons Court"],
    "Barons Court": ["Earls Court", "Hammersmith"],
    "Hammersmith": ["Barons Court", "Acton Town"],
    "Acton Town": ["Hammersmith", "Turnham Green"], // Acton Town is the branch junction
    /* Uxbridge branch (via Acton Town -> Turnham Green -> ... -> Uxbridge) */
    "South Ealing": ["Northfields", "Boston Manor"],
    "Northfields": ["South Ealing", "Boston Manor"], // (partial adjacencies noted)
    "Ealing Common": ["Ealing Broadway", "North Ealing"],
    "North Ealing": ["Ealing Common", "Park Royal"],
    "Park Royal": ["North Ealing", "Alperton"],
    "Alperton": ["Park Royal", "Sudbury Town"],
    "Sudbury Town": ["Alperton", "Sudbury Hill"],
    "Sudbury Hill": ["Sudbury Town", "South Harrow"],
    "South Harrow": ["Sudbury Hill", "Rayners Lane"],
    "Rayners Lane": ["South Harrow", "Eastcote"],
    "Eastcote": ["Rayners Lane", "Ruislip Manor"],
    "Ruislip Manor": ["Eastcote", "Ruislip"],
    "Ruislip": ["Ruislip Manor", "Ickenham"],
    "Ickenham": ["Ruislip", "Hillingdon"],
    "Hillingdon": ["Ickenham", "Uxbridge"],
    "Uxbridge": ["Hillingdon"],
    /* Heathrow branch */
    "Heathrow Terminal 4": ["Hatton Cross"],
    "Hatton Cross": ["Heathrow Terminals 2 & 3", "Heathrow Terminal 4", "Hounslow West"],
    "Heathrow Terminals 2 & 3": ["Hatton Cross", "Terminals 4/5 interchange area"],
    "Hounslow West": ["Hatton Cross", "Hounslow Central"]
  };
  const victoriaLineRoadmap: { [key: string]: string[] } = {
    "Walthamstow Central": ["Blackhorse Road"],
    "Blackhorse Road": ["Walthamstow Central", "Tottenham Hale"],
    "Tottenham Hale": ["Blackhorse Road", "Seven Sisters"],
    "Seven Sisters": ["Tottenham Hale", "Finsbury Park"],
    "Finsbury Park": ["Seven Sisters", "Highbury & Islington"],
    "Highbury & Islington": ["Finsbury Park", "King's Cross St. Pancras"],
    "King's Cross St. Pancras": ["Highbury & Islington", "Euston"],
    "Euston": ["King's Cross St. Pancras", "Warren Street"],
    "Warren Street": ["Euston", "Oxford Circus"],
    "Oxford Circus": ["Warren Street", "Green Park"],
    "Green Park": ["Oxford Circus", "Victoria"],
    "Victoria": ["Green Park", "Pimlico"],
    "Pimlico": ["Victoria", "Vauxhall"],
    "Vauxhall": ["Pimlico", "Stockwell"],
    "Stockwell": ["Vauxhall", "Brixton"],
    "Brixton": ["Stockwell"]
  };
  const waterlooAndCityLineRoadmap: { [key: string]: string[] } = {
    "Waterloo": ["Bank"],
    "Bank": ["Waterloo"]
  };
  const elizabethLineFullRoadmap: { [key: string]: string[] } = {
    "Reading": ["Twyford"],
    "Twyford": ["Reading", "Maidenhead"],
    "Maidenhead": ["Twyford", "Taplow"],
    "Taplow": ["Maidenhead", "Burnham"],
    "Burnham": ["Taplow", "Slough"],
    "Slough": ["Burnham", "Langley"],
    "Langley": ["Slough", "Iver"],
    "Iver": ["Langley", "West Drayton"],
    "West Drayton": ["Iver", "Heathrow Terminals 2 & 3", "Hayes & Harlington"],
    "Heathrow Terminals 2 & 3": ["West Drayton", "Heathrow Terminal 4", "Heathrow Terminal 5"],
    "Heathrow Terminal 4": ["Heathrow Terminals 2 & 3"],
    "Heathrow Terminal 5": ["Heathrow Terminals 2 & 3"],
    "Hayes & Harlington": ["West Drayton", "Southall"],
    "Southall": ["Hayes & Harlington", "Hanwell"],
    "Hanwell": ["Southall", "West Ealing"],
    "West Ealing": ["Hanwell", "Ealing Broadway"],
    "Ealing Broadway": ["West Ealing", "Acton Main Line"],
    "Acton Main Line": ["Ealing Broadway", "Paddington"],
    "Paddington": ["Acton Main Line", "Bond Street"],
    "Bond Street": ["Paddington", "Tottenham Court Road"],
    "Tottenham Court Road": ["Bond Street", "Farringdon"],
    "Farringdon": ["Tottenham Court Road", "Liverpool Street"],
    "Liverpool Street": ["Farringdon", "Whitechapel"],
    "Whitechapel": ["Liverpool Street", "Canary Wharf"],
    "Canary Wharf": ["Whitechapel", "Custom House"],
    "Custom House": ["Canary Wharf", "Woolwich"],
    "Woolwich": ["Custom House", "Abbey Wood"],
    "Abbey Wood": ["Woolwich"],
    "Stratford": ["Maryland", "Liverpool Street"],
    "Maryland": ["Stratford", "Forest Gate"],
    "Forest Gate": ["Maryland", "Manor Park"],
    "Manor Park": ["Forest Gate", "Ilford"],
    "Ilford": ["Manor Park", "Seven Kings"],
    "Seven Kings": ["Ilford", "Goodmayes"],
    "Goodmayes": ["Seven Kings", "Chadwell Heath"],
    "Chadwell Heath": ["Goodmayes", "Romford"],
    "Romford": ["Chadwell Heath", "Gidea Park"],
    "Gidea Park": ["Romford", "Harold Wood"],
    "Harold Wood": ["Gidea Park", "Brentwood"],
    "Brentwood": ["Harold Wood", "Shenfield"],
    "Shenfield": ["Brentwood"]
  };
  const centralLineRoadmap: { [key: string]: string[] } = {
    "West Ruislip": ["Ruislip Gardens"],
    "Ruislip Gardens": ["West Ruislip", "South Ruislip"],
    "South Ruislip": ["Ruislip Gardens", "Northolt"],
    "Northolt": ["South Ruislip", "Greenford"],
    "Greenford": ["Northolt", "Perivale"],
    "Perivale": ["Greenford", "Hanger Lane"],
    "Hanger Lane": ["Perivale", "North Acton"],
    "Ealing Broadway": ["West Acton"],
    "West Acton": ["Ealing Broadway", "North Acton"],
    "North Acton": ["West Acton", "East Acton", "Hanger Lane"],
    "East Acton": ["North Acton", "White City"],
    "White City": ["East Acton", "Shepherd's Bush"],
    "Shepherd's Bush": ["White City", "Holland Park"],
    "Holland Park": ["Shepherd's Bush", "Notting Hill Gate"],
    "Notting Hill Gate": ["Holland Park", "Queensway"],
    "Queensway": ["Notting Hill Gate", "Lancaster Gate"],
    "Lancaster Gate": ["Queensway", "Marble Arch"],
    "Marble Arch": ["Lancaster Gate", "Bond Street"],
    "Bond Street": ["Marble Arch", "Oxford Circus"],
    "Oxford Circus": ["Bond Street", "Tottenham Court Road"],
    "Tottenham Court Road": ["Oxford Circus", "Holborn"],
    "Holborn": ["Tottenham Court Road", "Chancery Lane"],
    "Chancery Lane": ["Holborn", "St. Paul's"],
    "St. Paul's": ["Chancery Lane", "Bank"],
    "Bank": ["St. Paul's", "Liverpool Street"],
    "Liverpool Street": ["Bank", "Bethnal Green"],
    "Bethnal Green": ["Liverpool Street", "Mile End"],
    "Mile End": ["Bethnal Green", "Stratford"],
    "Stratford": ["Mile End", "Leyton"],
    "Leyton": ["Stratford", "Leytonstone"],
    "Leytonstone": ["Leyton", "Snaresbrook", "Wanstead"],
    "Snaresbrook": ["Leytonstone", "South Woodford"],
    "South Woodford": ["Snaresbrook", "Woodford"],
    "Woodford": ["South Woodford", "Buckhurst Hill", "Roding Valley"],
    "Buckhurst Hill": ["Woodford", "Loughton"],
    "Loughton": ["Buckhurst Hill", "Debden"],
    "Debden": ["Loughton", "Theydon Bois"],
    "Theydon Bois": ["Debden", "Epping"],
    "Epping": ["Theydon Bois"],
    "Roding Valley": ["Woodford", "Chigwell"],
    "Chigwell": ["Roding Valley", "Grange Hill"],
    "Grange Hill": ["Chigwell", "Hainault"],
    "Hainault": ["Grange Hill", "Fairlop", "Newbury Park"],
    "Fairlop": ["Hainault", "Barkingside"],
    "Barkingside": ["Fairlop", "Newbury Park"],
    "Newbury Park": ["Barkingside", "Gants Hill", "Hainault"],
    "Gants Hill": ["Newbury Park", "Redbridge"],
    "Redbridge": ["Gants Hill", "Wanstead"],
    "Wanstead": ["Redbridge", "Leytonstone"]
  };
  const districtLineRoadmap: { [key: string]: string[] } = {
    "Upminster": ["Upminster Bridge"],
    "Upminster Bridge": ["Upminster", "Hornchurch"],
    "Hornchurch": ["Upminster Bridge", "Elm Park"],
    "Elm Park": ["Hornchurch", "Dagenham East"],
    "Dagenham East": ["Elm Park", "Dagenham Heathway"],
    "Dagenham Heathway": ["Dagenham East", "Becontree"],
    "Becontree": ["Dagenham Heathway", "Upney"],
    "Upney": ["Becontree", "Barking"],
    "Barking": ["Upney", "East Ham"],
    "East Ham": ["Barking", "Upton Park"],
    "Upton Park": ["East Ham", "Plaistow"],
    "Plaistow": ["Upton Park", "West Ham"],
    "West Ham": ["Plaistow", "Bromley-by-Bow"],
    "Bromley-by-Bow": ["West Ham", "Bow Road"],
    "Bow Road": ["Bromley-by-Bow", "Mile End"],
    "Mile End": ["Bow Road", "Stepney Green"],
    "Stepney Green": ["Mile End", "Whitechapel"],
    "Whitechapel": ["Stepney Green", "Aldgate East"],
    "Aldgate East": ["Whitechapel", "Tower Hill"],
    "Tower Hill": ["Aldgate East", "Monument"],
    "Monument": ["Tower Hill", "Cannon Street"],
    "Cannon Street": ["Monument", "Mansion House"],
    "Mansion House": ["Cannon Street", "Blackfriars"],
    "Blackfriars": ["Mansion House", "Temple"],
    "Temple": ["Blackfriars", "Embankment"],
    "Embankment": ["Temple", "Westminster"],
    "Westminster": ["Embankment", "St. James's Park"],
    "St. James's Park": ["Westminster", "Victoria"],
    "Victoria": ["St. James's Park", "Sloane Square"],
    "Sloane Square": ["Victoria", "South Kensington"],
    "South Kensington": ["Sloane Square", "Gloucester Road"],
    "Gloucester Road": ["South Kensington", "Earl's Court"],
    "Earl's Court": ["Gloucester Road", "West Kensington", "Kensington (Olympia)", "West Brompton"],
    "Kensington (Olympia)": ["Earl's Court"],
    "West Kensington": ["Earl's Court", "Barons Court"],
    "Barons Court": ["West Kensington", "Hammersmith"],
    "Hammersmith": ["Barons Court", "Ravenscourt Park"],
    "Ravenscourt Park": ["Hammersmith", "Stamford Brook"],
    "Stamford Brook": ["Ravenscourt Park", "Turnham Green"],
    "Turnham Green": ["Stamford Brook", "Gunnersbury", "Chiswick Park"],
    "Chiswick Park": ["Turnham Green", "Acton Town"],
    "Acton Town": ["Chiswick Park", "Ealing Common", "South Ealing"],
    "Ealing Common": ["Acton Town", "Ealing Broadway"],
    "Ealing Broadway": ["Ealing Common"],
    "South Ealing": ["Acton Town", "Northfields"],
    "Northfields": ["South Ealing", "Boston Manor"],
    "Boston Manor": ["Northfields", "Osterley"],
    "Osterley": ["Boston Manor", "Hounslow East"],
    "Hounslow East": ["Osterley", "Hounslow Central"],
    "Hounslow Central": ["Hounslow East", "Hounslow West"],
    "Hounslow West": ["Hounslow Central", "Hatton Cross"],
    "Hatton Cross": ["Hounslow West", "Heathrow Terminals 2 & 3"],
    "Heathrow Terminals 2 & 3": ["Hatton Cross", "Heathrow Terminal 4", "Heathrow Terminal 5"],
    "Heathrow Terminal 4": ["Heathrow Terminals 2 & 3"],
    "Heathrow Terminal 5": ["Heathrow Terminals 2 & 3"],
    "Wimbledon": ["Wimbledon Park"],
    "Wimbledon Park": ["Wimbledon", "Southfields"],
    "Southfields": ["Wimbledon Park", "East Putney"],
    "East Putney": ["Southfields", "Putney Bridge"],
    "Putney Bridge": ["East Putney", "Parsons Green"],
    "Parsons Green": ["Putney Bridge", "Fulham Broadway"],
    "Fulham Broadway": ["Parsons Green", "West Brompton"],
    "West Brompton": ["Fulham Broadway", "Earl's Court"]
  };
                    

  // Function to extract actual destination from complex destination strings
  const extractDestination = (destination: string): string => {
    if (!destination || destination.trim() === '') return 'Unknown';
    
    // Handle Northern Line destinations like "Morden via Bank", "Edgware via Bank"
    const viaMatch = destination.match(/^(.+?)\s+via\s+(.+)$/i);
    if (viaMatch) {
      return viaMatch[1].trim(); // Return the main destination (e.g., "Morden")
    }
    
    // Handle other patterns like "High Barnet via Bank"
    const viaMatch2 = destination.match(/^(.+?)\s+via\s+(.+)$/i);
    if (viaMatch2) {
      return viaMatch2[1].trim();
    }
    
    // Return original destination if no "via" pattern found
    return destination.trim();
  };

  // Helper function to check if a station is on the route to a destination
  const checkIfStationIsOnRouteToDestination = (lineId: string, nextStation: string, destination: string): boolean => {
    // This function would contain knowledge of which stations are on routes to destinations
    // For now, we'll implement some basic logic based on common patterns
    
    const destinationLower = destination.toLowerCase();
    const nextStationLower = nextStation.toLowerCase();
    
    // Common route patterns for different lines
    switch (lineId.toLowerCase()) {
      case 'bakerloo':
        // Bakerloo: Harrow & Wealdstone -> Elephant & Castle
        if (destinationLower.includes('elephant') && nextStationLower.includes('regent')) return true;
        if (destinationLower.includes('elephant') && nextStationLower.includes('oxford')) return true;
        if (destinationLower.includes('elephant') && nextStationLower.includes('piccadilly')) return true;
        if (destinationLower.includes('elephant') && nextStationLower.includes('charing')) return true;
        if (destinationLower.includes('elephant') && nextStationLower.includes('embankment')) return true;
        if (destinationLower.includes('elephant') && nextStationLower.includes('waterloo')) return true;
        if (destinationLower.includes('elephant') && nextStationLower.includes('lambeth')) return true;
        break;
        
      case 'circle':
        // Circle line route patterns
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('goldhawk')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('shepherd')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('wood lane')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('latimer')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('ladbroke')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('westbourne')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('royal oak')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('paddington')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('edgware')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('baker')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('great portland')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('euston square')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('king')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('farringdon')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('barbican')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('moorgate')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('liverpool')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('aldgate')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('tower')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('monument')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('cannon')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('mansion')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('blackfriars')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('temple')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('embankment')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('westminster')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('st. james')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('victoria')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('sloane')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('south kensington')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('gloucester')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('high street')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('notting hill')) return true;
        if (destinationLower.includes('hammersmith') && nextStationLower.includes('holland')) return true;
        break;
        
      // Add more lines as needed...
    }
    
    return false;
  };

  // Helper function for intelligent next station selection
  const selectNextStationIntelligently = (lineId: string, currentStation: string, destination: string, possibleNextStations: string[]): string => {
    const destinationLower = destination.toLowerCase();
    
    // Line-specific intelligent selection logic
    switch (lineId.toLowerCase()) {
      case 'bakerloo':
        // Bakerloo line logic
        if (destinationLower.includes('elephant') || destinationLower.includes('lambeth') || destinationLower.includes('waterloo')) {
          // Going towards Elephant & Castle - choose stations that lead south
          return possibleNextStations.find(station => 
            station.toLowerCase().includes('regent') || 
            station.toLowerCase().includes('oxford') || 
            station.toLowerCase().includes('piccadilly') ||
            station.toLowerCase().includes('charing') ||
            station.toLowerCase().includes('embankment') ||
            station.toLowerCase().includes('waterloo') ||
            station.toLowerCase().includes('lambeth')
          ) || possibleNextStations[possibleNextStations.length - 1];
        } else {
          // Going towards Harrow & Wealdstone - choose stations that lead north
          return possibleNextStations.find(station => 
            station.toLowerCase().includes('marylebone') || 
            station.toLowerCase().includes('baker') || 
            station.toLowerCase().includes('regent') ||
            station.toLowerCase().includes('oxford') ||
            station.toLowerCase().includes('piccadilly') ||
            station.toLowerCase().includes('charing') ||
            station.toLowerCase().includes('embankment') ||
            station.toLowerCase().includes('waterloo') ||
            station.toLowerCase().includes('lambeth')
          ) || possibleNextStations[0];
        }
        
      case 'circle':
        // Circle line logic - determine direction based on destination
        if (destinationLower.includes('hammersmith') || destinationLower.includes('goldhawk') || destinationLower.includes('shepherd')) {
          // Going towards Hammersmith
          return possibleNextStations.find(station => 
            station.toLowerCase().includes('goldhawk') || 
            station.toLowerCase().includes('shepherd') || 
            station.toLowerCase().includes('wood lane') ||
            station.toLowerCase().includes('latimer') ||
            station.toLowerCase().includes('ladbroke') ||
            station.toLowerCase().includes('westbourne') ||
            station.toLowerCase().includes('royal oak') ||
            station.toLowerCase().includes('paddington') ||
            station.toLowerCase().includes('edgware') ||
            station.toLowerCase().includes('baker') ||
            station.toLowerCase().includes('great portland') ||
            station.toLowerCase().includes('euston square') ||
            station.toLowerCase().includes('king') ||
            station.toLowerCase().includes('farringdon') ||
            station.toLowerCase().includes('barbican') ||
            station.toLowerCase().includes('moorgate') ||
            station.toLowerCase().includes('liverpool') ||
            station.toLowerCase().includes('aldgate') ||
            station.toLowerCase().includes('tower') ||
            station.toLowerCase().includes('monument') ||
            station.toLowerCase().includes('cannon') ||
            station.toLowerCase().includes('mansion') ||
            station.toLowerCase().includes('blackfriars') ||
            station.toLowerCase().includes('temple') ||
            station.toLowerCase().includes('embankment') ||
            station.toLowerCase().includes('westminster') ||
            station.toLowerCase().includes('st. james') ||
            station.toLowerCase().includes('victoria') ||
            station.toLowerCase().includes('sloane') ||
            station.toLowerCase().includes('south kensington') ||
            station.toLowerCase().includes('gloucester') ||
            station.toLowerCase().includes('high street') ||
            station.toLowerCase().includes('notting hill') ||
            station.toLowerCase().includes('holland')
          ) || possibleNextStations[0];
        } else {
          // Going in opposite direction
          return possibleNextStations.find(station => 
            station.toLowerCase().includes('holland') || 
            station.toLowerCase().includes('notting hill') || 
            station.toLowerCase().includes('high street') ||
            station.toLowerCase().includes('gloucester') ||
            station.toLowerCase().includes('south kensington') ||
            station.toLowerCase().includes('sloane') ||
            station.toLowerCase().includes('victoria') ||
            station.toLowerCase().includes('st. james') ||
            station.toLowerCase().includes('westminster') ||
            station.toLowerCase().includes('embankment') ||
            station.toLowerCase().includes('temple') ||
            station.toLowerCase().includes('blackfriars') ||
            station.toLowerCase().includes('mansion') ||
            station.toLowerCase().includes('cannon') ||
            station.toLowerCase().includes('monument') ||
            station.toLowerCase().includes('tower') ||
            station.toLowerCase().includes('aldgate') ||
            station.toLowerCase().includes('liverpool') ||
            station.toLowerCase().includes('moorgate') ||
            station.toLowerCase().includes('barbican') ||
            station.toLowerCase().includes('farringdon') ||
            station.toLowerCase().includes('king') ||
            station.toLowerCase().includes('euston square') ||
            station.toLowerCase().includes('great portland') ||
            station.toLowerCase().includes('baker') ||
            station.toLowerCase().includes('edgware') ||
            station.toLowerCase().includes('paddington') ||
            station.toLowerCase().includes('royal oak') ||
            station.toLowerCase().includes('westbourne') ||
            station.toLowerCase().includes('ladbroke') ||
            station.toLowerCase().includes('latimer') ||
            station.toLowerCase().includes('wood lane') ||
            station.toLowerCase().includes('shepherd') ||
            station.toLowerCase().includes('goldhawk')
          ) || possibleNextStations[possibleNextStations.length - 1];
        }
        
      default:
        // For other lines, use a simple heuristic
        // If destination contains common terminal names, choose accordingly
        const terminalKeywords = ['terminal', 'heathrow', 'uxbridge', 'walthamstow', 'brixton', 'elephant', 'harrow', 'stanmore', 'epping', 'upminster', 'wimbledon', 'richmond'];
        const isTerminalDestination = terminalKeywords.some(keyword => destinationLower.includes(keyword));
        
        if (isTerminalDestination) {
          // Going to a terminal - choose the station that's further along the route
          return possibleNextStations[possibleNextStations.length - 1];
        } else {
          // Going to an intermediate station - choose the first option
          return possibleNextStations[0];
        }
    }
  };

  // Universal roadmap lookup function for all tube lines
  const getNextStationFromRoadmap = (lineId: string, currentStation: string, destination: string, rawDestination: string): string => {
    // Get the appropriate roadmap based on line ID
    let roadmap: { [key: string]: string[] };
    
    switch (lineId.toLowerCase()) {
      case 'northern':
        roadmap = northernLineRoadmap;
        break;
      case 'bakerloo':
        roadmap = bakerlooLineRoadmap;
        break;
      case 'circle':
        roadmap = circleLineRoadmap;
        break;
      case 'hammersmith-city':
        roadmap = hammersmithAndCityLineRoadmap;
        break;
      case 'jubilee':
        roadmap = jubileeLineRoadmap;
        break;
      case 'metropolitan':
        roadmap = metropolitanLineRoadmap;
        break;
      case 'piccadilly':
        roadmap = piccadillyLineRoadmap;
        break;
      case 'victoria':
        roadmap = victoriaLineRoadmap;
        break;
      case 'waterloo-city':
        roadmap = waterlooAndCityLineRoadmap;
        break;
      case 'elizabeth':
      case 'elizabeth-line':
        roadmap = elizabethLineFullRoadmap;
        break;
      case 'central':
        roadmap = centralLineRoadmap;
        break;
      case 'district':
        roadmap = districtLineRoadmap;
        break;
      default:
        return 'Unknown';
    }

    const possibleNextStations = roadmap[currentStation];
    if (!possibleNextStations) {
      return 'Unknown';
    }

    // For stations with only one possible next station, return it
    if (possibleNextStations.length === 1) {
      return possibleNextStations[0];
    }

    // For stations with multiple options, determine based on destination
    const extractedDestination = extractDestination(rawDestination);
    
    // Special handling for Northern Line (most complex)
    if (lineId.toLowerCase() === 'northern') {
      switch (currentStation) {
        case "Angel":
          if (extractedDestination.includes("Edgware") || extractedDestination.includes("High Barnet") || extractedDestination.includes("Mill Hill East")) {
            return "King's Cross St. Pancras";
          } else {
            return "Old Street";
          }
        case "Bank":
          if (extractedDestination.includes("Morden") || extractedDestination.includes("Battersea")) {
            return "London Bridge";
          } else {
            return "Moorgate";
          }
        case "Moorgate":
          if (extractedDestination.includes("Morden") || extractedDestination.includes("Battersea")) {
            return "Bank";
          } else {
            return "Old Street";
          }
        case "Stockwell":
          if (extractedDestination.includes("Edgware") || extractedDestination.includes("High Barnet") || extractedDestination.includes("Mill Hill East")) {
            return "Clapham North";
          } else {
            return "Oval";
          }
        case "Kennington":
          if (extractedDestination.includes("Battersea")) {
            return "Nine Elms";
          } else if (extractedDestination.includes("Morden")) {
            return "Oval";
          } else if (extractedDestination.includes("Edgware") || extractedDestination.includes("High Barnet") || extractedDestination.includes("Mill Hill East")) {
            return "Elephant & Castle";
          } else {
            return "Waterloo";
          }
        case "Camden Town":
          if (rawDestination.toLowerCase().includes("via bank")) {
            if (extractedDestination.includes("Morden") || extractedDestination.includes("Battersea")) {
              return "Kentish Town";
            } else {
              return "Euston";
            }
          } else {
            if (extractedDestination.includes("Morden") || extractedDestination.includes("Battersea")) {
              return "Mornington Crescent";
            } else {
              return "Chalk Farm";
            }
          }
        case "Euston":
          if (rawDestination.toLowerCase().includes("via bank")) {
            if (extractedDestination.includes("Morden") || extractedDestination.includes("Battersea")) {
              return "King's Cross St. Pancras";
            } else {
              return "Camden Town";
            }
          } else {
            if (extractedDestination.includes("Morden") || extractedDestination.includes("Battersea")) {
              return "Warren Street";
            } else {
              return "Mornington Crescent";
            }
          }
      }
    }
    
    // Smart destination matching: analyze which next station makes sense based on destination
    const destinationLower = extractedDestination.toLowerCase();
    
    // For each possible next station, check if it's on the route to the destination
    for (const nextStation of possibleNextStations) {
      const nextStationLower = nextStation.toLowerCase();
      
      // Check if the next station is mentioned in the destination or vice versa
      if (destinationLower.includes(nextStationLower) || nextStationLower.includes(destinationLower)) {
        return nextStation;
      }
      
      // Check if the next station is a known intermediate station on the way to destination
      // This requires knowledge of common routes - we'll build this up
      const isOnRouteToDestination = checkIfStationIsOnRouteToDestination(lineId, nextStation, extractedDestination);
      if (isOnRouteToDestination) {
        return nextStation;
      }
    }
    
    // If no direct match found, use intelligent selection based on line-specific logic
    return selectNextStationIntelligently(lineId, currentStation, extractedDestination, possibleNextStations);
  };

  // Central Line hardcoded routing
  const getCentralLineNextStation = (currentStation: string, destination: string): string => {
    const destinationLower = destination.toLowerCase();
    
    // Full core route (West Ruislip ↔ Epping)
    const centralLineCore = [
      "West Ruislip",
      "Ruislip Gardens",
      "South Ruislip",
      "Northolt",
      "Greenford",
      "Perivale",
      "Hanger Lane",
      "North Acton",
      "East Acton",
      "White City",
      "Shepherd's Bush",
      "Holland Park",
      "Notting Hill Gate",
      "Queensway",
      "Lancaster Gate",
      "Marble Arch",
      "Bond Street",
      "Oxford Circus",
      "Tottenham Court Road",
      "Holborn",
      "Chancery Lane",
      "St. Paul's",
      "Bank",
      "Liverpool Street",
      "Bethnal Green",
      "Mile End",
      "Stratford",
      "Leyton",
      "Leytonstone"
    ];

    // To Ealing Broadway (splits at North Acton)
    const centralLineToEalingBroadway = [
      "Ealing Broadway",
      "West Acton",
      "North Acton",
      "East Acton",
      "White City",
      "Shepherd's Bush",
      "Holland Park",
      "Notting Hill Gate",
      "Queensway",
      "Lancaster Gate",
      "Marble Arch",
      "Bond Street",
      "Oxford Circus",
      "Tottenham Court Road",
      "Holborn",
      "Chancery Lane",
      "St. Paul's",
      "Bank",
      "Liverpool Street",
      "Bethnal Green",
      "Mile End",
      "Stratford",
      "Leyton",
      "Leytonstone"
    ];

    // Short turn: White City
    const centralLineToWhiteCity = [
      "West Ruislip",
      "Ruislip Gardens",
      "South Ruislip",
      "Northolt",
      "Greenford",
      "Perivale",
      "Hanger Lane",
      "North Acton",
      "East Acton",
      "White City"
    ];

    // Short turn: Ruislip Gardens
    const centralLineToRuislipGardens = [
      "West Ruislip",
      "Ruislip Gardens"
    ];

    // To Epping (via Loughton)
    const centralLineToEpping = [
      "West Ruislip",
      "Ruislip Gardens",
      "South Ruislip",
      "Northolt",
      "Greenford",
      "Perivale",
      "Hanger Lane",
      "North Acton",
      "East Acton",
      "White City",
      "Shepherd's Bush",
      "Holland Park",
      "Notting Hill Gate",
      "Queensway",
      "Lancaster Gate",
      "Marble Arch",
      "Bond Street",
      "Oxford Circus",
      "Tottenham Court Road",
      "Holborn",
      "Chancery Lane",
      "St. Paul's",
      "Bank",
      "Liverpool Street",
      "Bethnal Green",
      "Mile End",
      "Stratford",
      "Leyton",
      "Leytonstone",
      "Snaresbrook",
      "South Woodford",
      "Woodford",
      "Buckhurst Hill",
      "Loughton",
      "Debden",
      "Theydon Bois",
      "Epping"
    ];

    // To Loughton (short turn)
    const centralLineToLoughton = [
      "West Ruislip",
      "Ruislip Gardens",
      "South Ruislip",
      "Northolt",
      "Greenford",
      "Perivale",
      "Hanger Lane",
      "North Acton",
      "East Acton",
      "White City",
      "Shepherd's Bush",
      "Holland Park",
      "Notting Hill Gate",
      "Queensway",
      "Lancaster Gate",
      "Marble Arch",
      "Bond Street",
      "Oxford Circus",
      "Tottenham Court Road",
      "Holborn",
      "Chancery Lane",
      "St. Paul's",
      "Bank",
      "Liverpool Street",
      "Bethnal Green",
      "Mile End",
      "Stratford",
      "Leyton",
      "Leytonstone",
      "Snaresbrook",
      "South Woodford",
      "Woodford",
      "Buckhurst Hill",
      "Loughton"
    ];

    // To Hainault via Newbury Park (east loop)
    const centralLineToHainaultNewburyPark = [
      "West Ruislip",
      "Ruislip Gardens",
      "South Ruislip",
      "Northolt",
      "Greenford",
      "Perivale",
      "Hanger Lane",
      "North Acton",
      "East Acton",
      "White City",
      "Shepherd's Bush",
      "Holland Park",
      "Notting Hill Gate",
      "Queensway",
      "Lancaster Gate",
      "Marble Arch",
      "Bond Street",
      "Oxford Circus",
      "Tottenham Court Road",
      "Holborn",
      "Chancery Lane",
      "St. Paul's",
      "Bank",
      "Liverpool Street",
      "Bethnal Green",
      "Mile End",
      "Stratford",
      "Leyton",
      "Leytonstone",
      "Wanstead",
      "Redbridge",
      "Gants Hill",
      "Newbury Park",
      "Barkingside",
      "Fairlop",
      "Hainault"
    ];

    // To Newbury Park (short turn)
    const centralLineToNewburyPark = [
      "West Ruislip",
      "Ruislip Gardens",
      "South Ruislip",
      "Northolt",
      "Greenford",
      "Perivale",
      "Hanger Lane",
      "North Acton",
      "East Acton",
      "White City",
      "Shepherd's Bush",
      "Holland Park",
      "Notting Hill Gate",
      "Queensway",
      "Lancaster Gate",
      "Marble Arch",
      "Bond Street",
      "Oxford Circus",
      "Tottenham Court Road",
      "Holborn",
      "Chancery Lane",
      "St. Paul's",
      "Bank",
      "Liverpool Street",
      "Bethnal Green",
      "Mile End",
      "Stratford",
      "Leyton",
      "Leytonstone",
      "Wanstead",
      "Redbridge",
      "Gants Hill",
      "Newbury Park"
    ];

    // To Grange Hill via Woodford (loop via Hainault north)
    const centralLineToGrangeHill = [
      "West Ruislip",
      "Ruislip Gardens",
      "South Ruislip",
      "Northolt",
      "Greenford",
      "Perivale",
      "Hanger Lane",
      "North Acton",
      "East Acton",
      "White City",
      "Shepherd's Bush",
      "Holland Park",
      "Notting Hill Gate",
      "Queensway",
      "Lancaster Gate",
      "Marble Arch",
      "Bond Street",
      "Oxford Circus",
      "Tottenham Court Road",
      "Holborn",
      "Chancery Lane",
      "St. Paul's",
      "Bank",
      "Liverpool Street",
      "Bethnal Green",
      "Mile End",
      "Stratford",
      "Leyton",
      "Leytonstone",
      "Snaresbrook",
      "South Woodford",
      "Woodford",
      "Roding Valley",
      "Chigwell",
      "Grange Hill"
    ];

    // Determine which roadmap to use based on destination
    let sequence: string[];
    
    if (destinationLower.includes('west ruislip')) {
      sequence = centralLineCore;
    } else if (destinationLower.includes('ealing broadway')) {
      sequence = centralLineToEalingBroadway;
    } else if (destinationLower.includes('white city')) {
      sequence = centralLineToWhiteCity;
    } else if (destinationLower.includes('ruislip gardens')) {
      sequence = centralLineToRuislipGardens;
    } else if (destinationLower.includes('epping')) {
      sequence = centralLineToEpping;
    } else if (destinationLower.includes('loughton')) {
      sequence = centralLineToLoughton;
    } else if (destinationLower.includes('hainault')) {
      sequence = centralLineToHainaultNewburyPark;
    } else if (destinationLower.includes('newbury park')) {
      sequence = centralLineToNewburyPark;
    } else if (destinationLower.includes('grange hill')) {
      sequence = centralLineToGrangeHill;
    } else {
      return 'Unknown'; // Unknown destination
    }
    
    // Find current station in sequence
    const currentIndex = sequence.findIndex(station => 
      station.toLowerCase() === currentStation.toLowerCase()
    );
    
    if (currentIndex === -1) {
      return 'Unknown'; // Current station not found
    }
    
    // Check if this is a terminal station
    if (currentIndex === sequence.length - 1) {
      return 'Terminal';
    }
    
    // Return next station
    const nextStation = sequence[currentIndex + 1];
    console.log('🔵 CENTRAL LINE DEBUG:', { 
      currentStation, 
      destination, 
      destinationLower, 
      sequenceLength: sequence.length,
      sequenceStart: sequence[0],
      sequenceEnd: sequence[sequence.length - 1],
      currentIndex,
      nextStation
    });
    return nextStation;
  };

  // Bakerloo Line hardcoded routing
  const getBakerlooLineNextStation = (currentStation: string, destination: string): string => {
    const destinationLower = destination.toLowerCase();
    
    // Full length route (Harrow & Wealdstone → Elephant & Castle)
    const bakerlooLineFull = [
      "Harrow & Wealdstone",
      "Kenton",
      "South Kenton",
      "North Wembley",
      "Wembley Central",
      "Stonebridge Park",
      "Harlesden",
      "Willesden Junction",
      "Kensal Green",
      "Queen's Park",
      "Kilburn Park",
      "Maida Vale",
      "Warwick Avenue",
      "Paddington",
      "Edgware Road",
      "Marylebone",
      "Baker Street",
      "Regent's Park",
      "Oxford Circus",
      "Piccadilly Circus",
      "Charing Cross",
      "Embankment",
      "Waterloo",
      "Lambeth North",
      "Elephant & Castle"
    ];

    // Terminating at Queen's Park
    const bakerlooLineToQueensPark = [
      "Elephant & Castle",
      "Lambeth North",
      "Waterloo",
      "Embankment",
      "Charing Cross",
      "Piccadilly Circus",
      "Oxford Circus",
      "Regent's Park",
      "Baker Street",
      "Marylebone",
      "Edgware Road",
      "Paddington",
      "Warwick Avenue",
      "Maida Vale",
      "Kilburn Park",
      "Queen's Park"
    ];

    // Terminating at Stonebridge Park
    const bakerlooLineToStonebridgePark = [
      "Elephant & Castle",
      "Lambeth North",
      "Waterloo",
      "Embankment",
      "Charing Cross",
      "Piccadilly Circus",
      "Oxford Circus",
      "Regent's Park",
      "Baker Street",
      "Marylebone",
      "Edgware Road",
      "Paddington",
      "Warwick Avenue",
      "Maida Vale",
      "Kilburn Park",
      "Queen's Park",
      "Kensal Green",
      "Willesden Junction",
      "Harlesden",
      "Stonebridge Park"
    ];

    // Determine which roadmap to use based on destination
    let sequence: string[];
    
    if (destinationLower.includes('harrow') || destinationLower.includes('wealdstone')) {
      // Full route to Harrow & Wealdstone
      sequence = bakerlooLineFull;
    } else if (destinationLower.includes('queen') && destinationLower.includes('park')) {
      // Short turn to Queen's Park
      sequence = bakerlooLineToQueensPark;
    } else if (destinationLower.includes('stonebridge')) {
      // Short turn to Stonebridge Park
      sequence = bakerlooLineToStonebridgePark;
    } else if (destinationLower.includes('elephant') || destinationLower.includes('castle')) {
      // Full route to Elephant & Castle
      sequence = bakerlooLineFull;
    } else {
      return 'Unknown'; // Unknown destination
    }
    
    // Special handling for stations that appear in multiple roadmaps
    // These stations need direction-based logic to determine the correct next station
    
    // Edgware Road: direction depends on destination
    if (currentStation.toLowerCase() === 'edgware road') {
      if (destinationLower.includes('elephant') || destinationLower.includes('castle')) {
        // Southbound to Elephant & Castle: Edgware Road → Marylebone
        return 'Marylebone';
      } else {
        // Northbound to Harrow/Queen's Park/Stonebridge: Edgware Road → Paddington
        return 'Paddington';
      }
    }
    
    // Paddington: direction depends on destination
    if (currentStation.toLowerCase() === 'paddington') {
      if (destinationLower.includes('elephant') || destinationLower.includes('castle')) {
        // Southbound to Elephant & Castle: Paddington → Edgware Road
        return 'Edgware Road';
      } else {
        // Northbound to Harrow/Queen's Park/Stonebridge: Paddington → Warwick Avenue
        return 'Warwick Avenue';
      }
    }
    
    // Find current station in sequence
    const currentIndex = sequence.findIndex(station => 
      station.toLowerCase() === currentStation.toLowerCase()
    );
    
    if (currentIndex === -1) {
      return 'Unknown'; // Current station not found
    }
    
    // Check if this is a terminal station
    if (currentIndex === sequence.length - 1) {
      return 'Terminal';
    }
    
    // Return next station
    return sequence[currentIndex + 1];
  };

  // Hardcoded District Line destination mapping
  const getDistrictLineNextStation = (currentStation: string, destination: string): string => {
    const destinationLower = destination.toLowerCase();
    
    // === EASTBOUND CORE ===
    // Shared trunk Earl's Court → Upminster
    const districtLineToUpminster = [
      "Earl's Court",
      "Gloucester Road",
      "South Kensington",
      "Sloane Square",
      "Victoria",
      "St. James's Park",
      "Westminster",
      "Embankment",
      "Temple",
      "Blackfriars",
      "Mansion House",
      "Cannon Street",
      "Monument",
      "Tower Hill",
      "Aldgate East",
      "Whitechapel",
      "Stepney Green",
      "Mile End",
      "Bow Road",
      "Bromley-by-Bow",
      "West Ham",
      "Plaistow",
      "Upton Park",
      "East Ham",
      "Barking",
      "Upney",
      "Becontree",
      "Dagenham Heathway",
      "Dagenham East",
      "Elm Park",
      "Hornchurch",
      "Upminster Bridge",
      "Upminster"
    ];

    // === WESTBOUND BRANCHES ===

    // Ealing Broadway branch (via Turnham Green)
    const districtLineToEalingBroadway = [
      "Earl's Court",
      "West Kensington",
      "Barons Court",
      "Hammersmith",
      "Ravenscourt Park",
      "Stamford Brook",
      "Turnham Green",
      "Chiswick Park",
      "Acton Town",
      "Ealing Common",
      "Ealing Broadway"
    ];

    // Richmond branch (diverges after Turnham Green, via Gunnersbury)
    const districtLineToRichmond = [
      "Earl's Court",
      "West Kensington",
      "Barons Court",
      "Hammersmith",
      "Ravenscourt Park",
      "Stamford Brook",
      "Turnham Green",
      "Gunnersbury",
      "Kew Gardens",
      "Richmond"
    ];

    // Wimbledon branch (via West Brompton)
    const districtLineToWimbledon = [
      "Earl's Court",
      "West Brompton",
      "Fulham Broadway",
      "Parsons Green",
      "Putney Bridge",
      "East Putney",
      "Southfields",
      "Wimbledon Park",
      "Wimbledon"
    ];

    // Kensington (Olympia) shuttle (spur from Earl's Court)
    const districtLineToOlympia = [
      "Earl's Court",
      "Kensington (Olympia)"
    ];

    // Edgware Road branch (northbound from Earl's Court)
    const districtLineToEdgwareRoad = [
      "Earl's Court",
      "High Street Kensington",
      "Notting Hill Gate",
      "Bayswater",
      "Paddington",
      "Edgware Road"
    ];

    // Barking branch (terminates at Barking, shorter route)
    const districtLineToBarking = [
      "Earl's Court",
      "Gloucester Road",
      "South Kensington",
      "Sloane Square",
      "Victoria",
      "St. James's Park",
      "Westminster",
      "Embankment",
      "Temple",
      "Blackfriars",
      "Mansion House",
      "Cannon Street",
      "Monument",
      "Tower Hill",
      "Aldgate East",
      "Whitechapel",
      "Stepney Green",
      "Mile End",
      "Bow Road",
      "Bromley-by-Bow",
      "West Ham",
      "Plaistow",
      "Upton Park",
      "East Ham",
      "Barking"
    ];

    // Tower Hill branch (terminates at Tower Hill, very short route)
    const districtLineToTowerHill = [
      "Earl's Court",
      "Gloucester Road",
      "South Kensington",
      "Sloane Square",
      "Victoria",
      "St. James's Park",
      "Westminster",
      "Embankment",
      "Temple",
      "Blackfriars",
      "Mansion House",
      "Cannon Street",
      "Monument",
      "Tower Hill"
    ];

    // Determine which roadmap to use based on destination
    let sequence: string[];
    
    if (destinationLower.includes('upminster')) {
      sequence = districtLineToUpminster;
    } else if (destinationLower.includes('richmond')) {
      // For Richmond: follow Upminster route in reverse to Earl's Court, then Richmond route
      if (districtLineToUpminster.includes(currentStation) && currentStation !== "Earl's Court") {
        // Currently on Upminster route, heading towards Earl's Court
        const reverseUpminster = [...districtLineToUpminster].reverse();
        const currentIndex = reverseUpminster.findIndex(station => 
          station.toLowerCase() === currentStation.toLowerCase()
        );
        if (currentIndex !== -1 && currentIndex < reverseUpminster.length - 1) {
          return reverseUpminster[currentIndex + 1];
        }
      }
      sequence = districtLineToRichmond;
    } else if (destinationLower.includes('wimbledon')) {
      // For Wimbledon: follow Upminster route in reverse to Earl's Court, then Wimbledon route
      if (districtLineToUpminster.includes(currentStation) && currentStation !== "Earl's Court") {
        // Currently on Upminster route, heading towards Earl's Court
        const reverseUpminster = [...districtLineToUpminster].reverse();
        const currentIndex = reverseUpminster.findIndex(station => 
          station.toLowerCase() === currentStation.toLowerCase()
        );
        if (currentIndex !== -1 && currentIndex < reverseUpminster.length - 1) {
          return reverseUpminster[currentIndex + 1];
        }
      }
      sequence = districtLineToWimbledon;
    } else if (destinationLower.includes('olympia') || destinationLower.includes('kensington')) {
      // For Olympia: follow Upminster route in reverse to Earl's Court, then Olympia route
      if (districtLineToUpminster.includes(currentStation) && currentStation !== "Earl's Court") {
        // Currently on Upminster route, heading towards Earl's Court
        const reverseUpminster = [...districtLineToUpminster].reverse();
        const currentIndex = reverseUpminster.findIndex(station => 
          station.toLowerCase() === currentStation.toLowerCase()
        );
        if (currentIndex !== -1 && currentIndex < reverseUpminster.length - 1) {
          return reverseUpminster[currentIndex + 1];
        }
      }
      sequence = districtLineToOlympia;
    } else if (destinationLower.includes('edgware road')) {
      // For Edgware Road: follow Upminster route in reverse to Earl's Court, then Edgware Road route
      if (districtLineToUpminster.includes(currentStation) && currentStation !== "Earl's Court") {
        // Currently on Upminster route, heading towards Earl's Court
        const reverseUpminster = [...districtLineToUpminster].reverse();
        const currentIndex = reverseUpminster.findIndex(station => 
          station.toLowerCase() === currentStation.toLowerCase()
        );
        if (currentIndex !== -1 && currentIndex < reverseUpminster.length - 1) {
          return reverseUpminster[currentIndex + 1];
        }
      }
      sequence = districtLineToEdgwareRoad;
    } else if (destinationLower.includes('ealing')) {
      // For Ealing Broadway: follow Upminster route in reverse to Earl's Court, then Ealing route
      if (districtLineToUpminster.includes(currentStation) && currentStation !== "Earl's Court") {
        // Currently on Upminster route, heading towards Earl's Court
        const reverseUpminster = [...districtLineToUpminster].reverse();
        const currentIndex = reverseUpminster.findIndex(station => 
          station.toLowerCase() === currentStation.toLowerCase()
        );
        if (currentIndex !== -1 && currentIndex < reverseUpminster.length - 1) {
          return reverseUpminster[currentIndex + 1];
        }
      }
      sequence = districtLineToEalingBroadway;
    } else if (destinationLower.includes('barking')) {
      // For Barking: follow Upminster route in reverse to Earl's Court, then Barking route
      if (districtLineToUpminster.includes(currentStation) && currentStation !== "Earl's Court") {
        // Currently on Upminster route, heading towards Earl's Court
        const reverseUpminster = [...districtLineToUpminster].reverse();
        const currentIndex = reverseUpminster.findIndex(station => 
          station.toLowerCase() === currentStation.toLowerCase()
        );
        if (currentIndex !== -1 && currentIndex < reverseUpminster.length - 1) {
          return reverseUpminster[currentIndex + 1];
        }
      }
      sequence = districtLineToBarking;
    } else if (destinationLower.includes('tower hill')) {
      // For Tower Hill: follow Upminster route in reverse to Earl's Court, then Tower Hill route
      if (districtLineToUpminster.includes(currentStation) && currentStation !== "Earl's Court") {
        // Currently on Upminster route, heading towards Earl's Court
        const reverseUpminster = [...districtLineToUpminster].reverse();
        const currentIndex = reverseUpminster.findIndex(station => 
          station.toLowerCase() === currentStation.toLowerCase()
        );
        if (currentIndex !== -1 && currentIndex < reverseUpminster.length - 1) {
          return reverseUpminster[currentIndex + 1];
        }
      }
      sequence = districtLineToTowerHill;
    } else {
      return 'Unknown'; // Unknown destination
    }
    
    // Find current station in sequence
    const currentIndex = sequence.findIndex(station => 
      station.toLowerCase() === currentStation.toLowerCase()
    );
    
    if (currentIndex === -1) {
      return 'Unknown'; // Current station not found
    }
    
    // Get next station
    const nextIndex = (currentIndex + 1) % sequence.length;
    return sequence[nextIndex];
  };

  // Hardcoded Circle Line destination mapping
  const getCircleLineNextStation = (currentStation: string, destination: string): string => {
    const destinationLower = destination.toLowerCase();
    
    // Special case: Edgware Road is both terminus and through-station
    if (currentStation.toLowerCase() === 'edgware road') {
      if (destinationLower.includes('edgware') || destinationLower.includes('edgware road')) {
        // Arriving clockwise to Edgware Road - this is the TERMINUS
        return 'Terminal';
      } else if (destinationLower.includes('hammersmith')) {
        // Arriving anti-clockwise to Edgware Road - this is a THROUGH-STATION
        // Next station is Paddington (H&C platforms) towards Hammersmith
        return 'Paddington';
      }
    }
    
    // Circle Line sequences provided by user
    const circleLineToEdgwareRoad = [
      "Hammersmith",
      "Goldhawk Road",
      "Shepherd's Bush Market",
      "Wood Lane",
      "Latimer Road",
      "Ladbroke Grove",
      "Westbourne Park",
      "Royal Oak",
      "Paddington",
      "Edgware Road",
      "Baker Street",
      "Great Portland Street",
      "Euston Square",
      "King's Cross St. Pancras",
      "Farringdon",
      "Barbican",
      "Moorgate",
      "Liverpool Street",
      "Aldgate",
      "Tower Hill",
      "Monument",
      "Cannon Street",
      "Mansion House",
      "Blackfriars",
      "Temple",
      "Embankment",
      "Westminster",
      "St. James's Park",
      "Victoria",
      "Sloane Square",
      "South Kensington",
      "Gloucester Road",
      "High Street Kensington",
      "Notting Hill Gate",
      "Bayswater",
      "Paddington",
      "Edgware Road"
    ];

    const circleLineToHammersmith = [
      "Edgware Road",
      "Paddington",
      "Bayswater",
      "Notting Hill Gate",
      "High Street Kensington",
      "Gloucester Road",
      "South Kensington",
      "Sloane Square",
      "Victoria",
      "St. James's Park",
      "Westminster",
      "Embankment",
      "Temple",
      "Blackfriars",
      "Mansion House",
      "Cannon Street",
      "Monument",
      "Tower Hill",
      "Aldgate",
      "Liverpool Street",
      "Moorgate",
      "Barbican",
      "Farringdon",
      "King's Cross St. Pancras",
      "Euston Square",
      "Great Portland Street",
      "Baker Street",
      "Edgware Road",
      "Paddington",
      "Royal Oak",
      "Westbourne Park",
      "Ladbroke Grove",
      "Latimer Road",
      "Wood Lane",
      "Shepherd's Bush Market",
      "Goldhawk Road",
      "Hammersmith"
    ];

    // === EASTBOUND CORE ===
// Shared trunk Earl’s Court → Upminster
const districtLineToUpminster = [
  "Earl's Court",
  "Gloucester Road",
  "South Kensington",
  "Sloane Square",
  "Victoria",
  "St. James's Park",
  "Westminster",
  "Embankment",
  "Temple",
  "Blackfriars",
  "Mansion House",
  "Cannon Street",
  "Monument",
  "Tower Hill",
  "Aldgate East",
  "Whitechapel",
  "Stepney Green",
  "Mile End",
  "Bow Road",
  "Bromley-by-Bow",
  "West Ham",
  "Plaistow",
  "Upton Park",
  "East Ham",
  "Barking",
  "Upney",
  "Becontree",
  "Dagenham Heathway",
  "Dagenham East",
  "Elm Park",
  "Hornchurch",
  "Upminster Bridge",
  "Upminster"
];

// === WESTBOUND BRANCHES ===

// Ealing Broadway branch (via Turnham Green)
const districtLineToEalingBroadway = [
  "Earl's Court",
  "West Kensington",
  "Barons Court",
  "Hammersmith",
  "Ravenscourt Park",
  "Stamford Brook",
  "Turnham Green",
  "Chiswick Park",
  "Acton Town",
  "Ealing Common",
  "Ealing Broadway"
];

// Richmond branch (diverges after Turnham Green, via Gunnersbury)
const districtLineToRichmond = [
  "Earl's Court",
  "West Kensington",
  "Barons Court",
  "Hammersmith",
  "Ravenscourt Park",
  "Stamford Brook",
  "Turnham Green",
  "Gunnersbury",
  "Kew Gardens",
  "Richmond"
];

// Wimbledon branch (via West Brompton)
const districtLineToWimbledon = [
  "Earl's Court",
  "West Brompton",
  "Fulham Broadway",
  "Parsons Green",
  "Putney Bridge",
  "East Putney",
  "Southfields",
  "Wimbledon Park",
  "Wimbledon"
];

// Kensington (Olympia) shuttle (spur from Earl’s Court)
const districtLineToOlympia = [
  "Earl's Court",
  "Kensington (Olympia)"
];

// Edgware Road branch (northbound from Earl’s Court)
const districtLineToEdgwareRoad = [
  "Earl's Court",
  "High Street Kensington",
  "Notting Hill Gate",
  "Bayswater",
  "Paddington",
  "Edgware Road"
];

    
    // Determine which sequence to use based on destination
    let sequence: string[];
    if (destinationLower.includes('edgware') || destinationLower.includes('edgware road')) {
      sequence = circleLineToEdgwareRoad;
    } else if (destinationLower.includes('hammersmith')) {
      sequence = circleLineToHammersmith;
    } else {
      return 'Unknown'; // Unknown destination
    }
    
    // Find current station in sequence
    const currentIndex = sequence.findIndex(station => 
      station.toLowerCase() === currentStation.toLowerCase()
    );
    
    if (currentIndex === -1) {
      return 'Unknown'; // Current station not found
    }
    
    // Get next station
    const nextIndex = (currentIndex + 1) % sequence.length;
    return sequence[nextIndex];
  };

  // Function to get next station and duration
  const getNextStationInfo = (arrival: Arrival) => {
    if (!lineTopology) {
      return { nextStation: 'Loading...', duration: 'N/A' };
    }

    const lineId = arrival.lineId.toLowerCase();
    const currentStation = arrival.stationName
      .replace(' Underground Station', '')
      .replace(' Underground', '')
      .replace(' (H&C Line)', '')
      .replace(' (Circle)', '')
      .replace(' (District)', '')
      .replace(' (Bakerloo)', '')
      .replace(' (Central)', '')
      .replace(' (Northern)', '')
      .replace(' (Piccadilly)', '')
      .replace(' (Victoria)', '')
      .replace(' (Jubilee)', '')
      .replace(' (Hammersmith & City)', '')
      .replace(' (Metropolitan)', '')
      .replace(' (DLR)', '')
      .replace(' (Overground)', '')
      .replace(' (Tram)', '')
      .replace(' (Elizabeth)', '')
      .replace(' (TfL Rail)', '');
    const rawDestination = arrival.towards || arrival.destinationName;
    const destination = extractDestination(rawDestination);
    
    // Special handling for Circle Line with hardcoded mapping
    if (lineId === 'circle') {
      const nextStation = getCircleLineNextStation(currentStation, destination);
      console.log(`CIRCLE Line Hardcoded Debug:`, {
        currentStation,
        rawDestination,
        extractedDestination: destination,
        vehicleId: arrival.vehicleId,
        nextStation: nextStation,
        lineId: lineId
      });
      
      if (!lineTopology) {
        return { nextStation: 'Loading...', duration: 'N/A' };
      }
      
      const duration = calculateDynamicDuration(arrivalsData || [], currentStation, nextStation, lineId, arrival.vehicleId);
      return { nextStation, duration };
    }
    
    // Special handling for Bakerloo Line with hardcoded mapping
    if (lineId === 'bakerloo') {
      let nextStation = getBakerlooLineNextStation(currentStation, destination);
      
      // Special edge case handling for Bakerloo Line bidirectional stations
      const destinationLower = destination.toLowerCase();
      
      // Edgware Road: direction depends on destination
      if (currentStation.toLowerCase() === 'edgware road') {
        console.log('🔴 EDGWARE ROAD OVERRIDE TRIGGERED:', { currentStation, destination, destinationLower });
        if (destinationLower.includes('elephant') || destinationLower.includes('castle')) {
          // Southbound to Elephant & Castle: Edgware Road → Marylebone
          nextStation = 'Marylebone';
          console.log('🔴 EDGWARE ROAD → MARYLEBONE (Southbound)');
        } else {
          // Northbound to Harrow/Queen's Park/Stonebridge: Edgware Road → Paddington
          nextStation = 'Paddington';
          console.log('🔴 EDGWARE ROAD → PADDINGTON (Northbound)');
        }
      }
      
      // Paddington: direction depends on destination
      if (currentStation.toLowerCase() === 'paddington') {
        console.log('🔴 PADDINGTON OVERRIDE TRIGGERED:', { currentStation, destination, destinationLower });
        if (destinationLower.includes('elephant') || destinationLower.includes('castle')) {
          // Southbound to Elephant & Castle: Paddington → Edgware Road
          nextStation = 'Edgware Road';
          console.log('🔴 PADDINGTON → EDGWARE ROAD (Southbound)');
        } else {
          // Northbound to Harrow/Queen's Park/Stonebridge: Paddington → Warwick Avenue
          nextStation = 'Warwick Avenue';
          console.log('🔴 PADDINGTON → WARWICK AVENUE (Northbound)');
        }
      }
      
      // Fallback for Unknown next stations on Bakerloo Line
      if (nextStation === 'Unknown') {
        console.log('🔴 BAKERLOO FALLBACK TRIGGERED for Unknown nextStation:', { currentStation, destination });
        
        // Edgware Road fallback
        if (currentStation.toLowerCase().includes('edgware road')) {
          if (destinationLower.includes('elephant') || destinationLower.includes('castle')) {
            nextStation = 'Marylebone';
            console.log('🔴 FALLBACK: EDGWARE ROAD → MARYLEBONE (Southbound)');
          } else {
            nextStation = 'Paddington';
            console.log('🔴 FALLBACK: EDGWARE ROAD → PADDINGTON (Northbound)');
          }
        }
        
        // Paddington fallback
        if (currentStation.toLowerCase().includes('paddington')) {
          if (destinationLower.includes('elephant') || destinationLower.includes('castle')) {
            nextStation = 'Edgware Road';
            console.log('🔴 FALLBACK: PADDINGTON → EDGWARE ROAD (Southbound)');
          } else {
            nextStation = 'Warwick Avenue';
            console.log('🔴 FALLBACK: PADDINGTON → WARWICK AVENUE (Northbound)');
          }
        }
      }
      
      console.log(`BAKERLOO Line Hardcoded Debug:`, {
        currentStation,
        rawDestination,
        extractedDestination: destination,
        vehicleId: arrival.vehicleId,
        nextStation: nextStation,
        lineId: lineId
      });
      
      if (!lineTopology) {
        return { nextStation: 'Loading...', duration: 'N/A' };
      }
      
      const duration = calculateDynamicDuration(arrivalsData || [], currentStation, nextStation, lineId, arrival.vehicleId);
      return { nextStation, duration };
    }
    
    // Special handling for Central Line with hardcoded mapping
    if (lineId === 'central') {
      const nextStation = getCentralLineNextStation(currentStation, destination);
      console.log(`CENTRAL Line Hardcoded Debug:`, {
        currentStation,
        rawDestination,
        extractedDestination: destination,
        vehicleId: arrival.vehicleId,
        nextStation: nextStation,
        lineId: lineId
      });
      
      if (!lineTopology) {
        return { nextStation: 'Loading...', duration: 'N/A' };
      }
      
      const duration = calculateDynamicDuration(arrivalsData || [], currentStation, nextStation, lineId, arrival.vehicleId);
      return { nextStation, duration };
    }
    
    // Get line topology
    const lineData = lineTopology.lines[lineId];
    
    // Debug logging for all lines using roadmaps
    const nextStation = getNextStationFromRoadmap(lineId, currentStation, destination, rawDestination);
    console.log(`${lineId.toUpperCase()} Line Roadmap Debug:`, {
      currentStation,
      rawDestination,
      extractedDestination: destination,
      vehicleId: arrival.vehicleId,
      nextStation: nextStation,
      lineId: lineId
    });
    if (!lineData) {
      return { nextStation: 'Unknown', duration: 'N/A' };
    }

    // Determine direction based on destination
    let direction: string;
    let stationSequence: string[] = [];
    
    if (lineId === 'circle') {
      // Use roadmap-based approach for Circle Line
      const nextStation = getNextStationFromRoadmap(lineId, currentStation, destination, rawDestination);
      
      // Calculate duration using the roadmap-determined next station
      const duration = calculateDynamicDuration(
        arrivalsData || [], 
        currentStation, 
        nextStation, 
        lineId,
        arrival.vehicleId
      );
      
      return { 
        nextStation: nextStation, 
        duration: duration 
      };
    }
    
    if (lineId === 'district') {
      // Use hardcoded District Line routing
      const nextStation = getDistrictLineNextStation(currentStation, destination);
      
      // Calculate duration using the District Line-determined next station
      const duration = calculateDynamicDuration(
        arrivalsData || [], 
        currentStation, 
        nextStation, 
        lineId,
        arrival.vehicleId
      );
      
      return { 
        nextStation: nextStation, 
        duration: duration 
      };
    } else {
      // For other lines, determine direction based on destination
      if (lineId === 'northern') {
        // Use Northern Line roadmap for direct next station lookup
        const nextStation = getNextStationFromRoadmap(lineId, currentStation, destination, rawDestination);
        
        // For Northern Line, we don't need complex station sequences since we have direct mapping
        // Just return the next station and calculate duration
        const duration = calculateDynamicDuration(
          arrivalsData || [], 
          currentStation, 
          nextStation, 
          lineId,
          arrival.vehicleId
        );
        
        return { 
          nextStation: nextStation, 
          duration: duration 
        };
      } else {
        // Use roadmap-based approach for all other lines
        const nextStation = getNextStationFromRoadmap(lineId, currentStation, destination, rawDestination);
        
        // Calculate duration using the roadmap-determined next station
        const duration = calculateDynamicDuration(
          arrivalsData || [], 
          currentStation, 
          nextStation, 
          lineId,
          arrival.vehicleId
        );
        
        return { 
          nextStation: nextStation, 
          duration: duration 
        };
      }
    }
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
                  arrivalsData
                    .filter(arrival => {
                      const lineId = arrival.lineId.toLowerCase();
                      const destination = arrival.towards || arrival.destinationName || '';
                      const destinationLower = destination.toLowerCase();
                      const stationName = arrival.stationName || '';
                      const stationNameLower = stationName.toLowerCase();
                      
                      // Circle Line: Only show entries with destinations "Edgware Road (Circle)" or "Hammersmith"
                      if (lineId === 'circle') {
                        // Filter out H&C Line stations (Hammersmith & City Line)
                        if (stationNameLower.includes('h&c') || stationNameLower.includes('hammersmith & city')) {
                          return false;
                        }
                        
                        // Only allow "Edgware Road (Circle)" or "Hammersmith" destinations
                        return destinationLower.includes('edgware road') || 
                               destinationLower.includes('hammersmith');
                      }
                      
                      // District Line: Only show entries with specific destinations
                      if (lineId === 'district') {
                        return destinationLower.includes('upminster') || 
                               destinationLower.includes('richmond') || 
                               destinationLower.includes('wimbledon') || 
                               destinationLower.includes('ealing broadway') || 
                               destinationLower.includes('barking') || 
                               destinationLower.includes('tower hill') || 
                               destinationLower.includes('edgware road');
                      }
                      
                      // Bakerloo Line: Only show entries with specific destinations
                      if (lineId === 'bakerloo') {
                        return destinationLower.includes('harrow') || 
                               destinationLower.includes('wealdstone') || 
                               destinationLower.includes('queen') && destinationLower.includes('park') || 
                               destinationLower.includes('stonebridge') || 
                               destinationLower.includes('elephant') || 
                               destinationLower.includes('castle');
                      }
                      
                      // Central Line: Only show entries with specific destinations
                      if (lineId === 'central') {
                        return destinationLower.includes('west ruislip') || 
                               destinationLower.includes('ealing broadway') || 
                               destinationLower.includes('white city') || 
                               destinationLower.includes('ruislip gardens') || 
                               destinationLower.includes('epping') || 
                               destinationLower.includes('loughton') || 
                               destinationLower.includes('hainault') || 
                               destinationLower.includes('newbury park') || 
                               destinationLower.includes('grange hill');
                      }
                      
                      // For other lines, show all arrivals
                      return true;
                    })
                    .reduce((groups, arrival) => {
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
                      <span className="ml-2 text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {arrivals[0]?.naptanId || 'N/A'}
                      </span>
                      {(() => {
                        const naptanId = arrivals[0]?.naptanId;
                        const crowding = crowdingData[naptanId || ''];
                        const crowdingInfo = formatCrowdingData(crowding);
                        return (
                          <span className={`ml-2 text-xs font-medium px-2 py-1 rounded ${crowdingInfo.color}`}>
                            Crowding: {crowdingInfo.text}
                          </span>
                        );
                      })()}
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
                            <th className="px-3 py-2 text-left">Next Station</th>
                            <th className="px-3 py-2 text-left">Duration</th>
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
                                {(() => {
                                  const destination = arrival.towards || arrival.destinationName;
                                  if (!destination || destination.trim() === '') {
                                    return (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                        Unknown
                                      </span>
                                    );
                                  }
                                  
                                  // Clean up destination display
                                  let displayDestination = destination;
                                  
                                  // Show "Edgware Road (Circle)" as just "Edgware Road"
                                  if (destination.toLowerCase().includes('edgware road')) {
                                    displayDestination = 'Edgware Road';
                                  }
                                  
                                  return displayDestination;
                                })()}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {(() => {
                                  const nextStationInfo = getNextStationInfo(arrival);
                                  return (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      nextStationInfo.nextStation === 'Terminal' 
                                        ? 'bg-orange-100 text-orange-800'
                                        : nextStationInfo.nextStation === 'Unknown'
                                        ? 'bg-gray-100 text-gray-600'
                                        : 'bg-blue-50 text-blue-700'
                                    }`}>
                                      {nextStationInfo.nextStation}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {(() => {
                                  const nextStationInfo = getNextStationInfo(arrival);
                                  return nextStationInfo.duration;
                                })()}
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
