# Tube Trace Cloud API Deployment Guide

## Overview
This is a streamlined FastAPI service specifically designed for cloud deployment that provides comprehensive data for 5 London Underground lines:
- Bakerloo
- Central  
- Circle
- District
- Hammersmith & City
- Metropolitan

## Files Included
- `cloud_main.py` - Main FastAPI application
- `cloud_requirements.txt` - Python dependencies
- `.env` - Environment variables (create this file)

## Environment Setup

### 1. Create .env file
```bash
TFL_API_KEY=your_tfl_api_key_here
```

### 2. Install Dependencies
```bash
pip install -r cloud_requirements.txt
```

### 3. Run the Application
```bash
python cloud_main.py
```

Or with uvicorn directly:
```bash
uvicorn cloud_main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Main Endpoints
- `GET /` - Service status and supported lines
- `GET /health` - Health check
- `GET /api/lines/all` - Get data for all supported lines
- `GET /api/lines/{line_id}` - Get comprehensive data for specific line
- `GET /api/lines/{line_id}/status` - Get only status for specific line
- `GET /api/lines/{line_id}/arrivals` - Get only arrivals for specific line
- `GET /api/lines/{line_id}/crowding` - Get only crowding data for specific line
- `GET /api/stations/{naptan_id}/crowding` - Get crowding for specific station

### Supported Line IDs
- `bakerloo`
- `central`
- `circle`
- `district`
- `hammersmith-city`
- `metropolitan`

## Example Usage

### Get all lines data:
```bash
curl http://your-server:8000/api/lines/all
```

### Get specific line data:
```bash
curl http://your-server:8000/api/lines/circle
```

### Get line status only:
```bash
curl http://your-server:8000/api/lines/circle/status
```

## Response Format

### Line Data Response
```json
{
  "line_id": "circle",
  "line_name": "Circle",
  "status": {
    "lineId": "circle",
    "lineName": "Circle",
    "lineStatuses": [...]
  },
  "arrivals": [
    {
      "id": "12345",
      "vehicleId": "#217",
      "lineId": "circle",
      "lineName": "Circle",
      "stationId": "940GZZLUSKS",
      "stationName": "South Kensington",
      "platformName": "1",
      "destinationName": "Edgware Road",
      "expectedArrival": "2024-01-01T15:31:38Z",
      "timeToStation": 1,
      "ukTime": "3:31:38 PM",
      "nextStation": "Unknown",
      "duration": "N/A"
    }
  ],
  "stations": [
    {
      "naptanId": "940GZZLUSKS",
      "crowdingLevel": "Low",
      "percentage": 48
    }
  ]
}
```

## Features

### 1. Concurrent Data Fetching
- All API calls to TFL are made concurrently for better performance
- Status, arrivals, and crowding data fetched simultaneously

### 2. Error Handling
- Graceful handling of TFL API errors
- Fallback data for stations without crowding support
- Comprehensive error messages

### 3. Data Processing
- Arrivals data includes UK time formatting
- Structured response format ready for frontend consumption
- Crowding data for key stations on each line

### 4. CORS Support
- Configured for cloud deployment with CORS enabled
- Supports all origins for maximum compatibility

## Deployment Notes

### Cloud Platforms
This API is ready for deployment on:
- AWS (EC2, Lambda, ECS)
- Google Cloud Platform (Cloud Run, Compute Engine)
- Azure (App Service, Container Instances)
- Heroku
- DigitalOcean
- Any cloud provider supporting Python/FastAPI

### Environment Variables
Make sure to set:
- `TFL_API_KEY` - Your Transport for London API key

### Port Configuration
Default port is 8000, but can be configured via environment variable `PORT` for platforms like Heroku.

### Health Monitoring
Use the `/health` endpoint for monitoring and load balancer health checks.

## Performance Considerations
- Concurrent API calls reduce response time
- 15-second timeout for TFL API calls
- Efficient data processing and formatting
- Minimal memory footprint

## Security
- CORS configured for cloud deployment
- API key stored in environment variables
- No sensitive data exposed in responses

