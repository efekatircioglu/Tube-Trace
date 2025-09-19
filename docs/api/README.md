# Backend API Documentation

## Overview
The backend provides RESTful APIs for the Tube Trace application, handling data collection, machine learning predictions, and serving data to the frontend.

## API Endpoints

### Data Collection
- `GET /api/data/collect` - Trigger manual data collection
- `GET /api/data/status` - Get data collection status
- `GET /api/data/history` - Get historical data

### Predictions
- `GET /api/predictions/current` - Get current delay predictions
- `GET /api/predictions/station/{station_id}` - Get predictions for specific station
- `GET /api/predictions/line/{line_id}` - Get predictions for specific line

### Stations and Lines
- `GET /api/stations` - Get all stations
- `GET /api/stations/{station_id}` - Get specific station details
- `GET /api/lines` - Get all tube lines
- `GET /api/lines/{line_id}` - Get specific line details

### Health and Monitoring
- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - Application metrics

## Data Models

### Station
```json
{
  "id": "string",
  "name": "string",
  "line": "string",
  "zone": "number",
  "coordinates": {
    "lat": "number",
    "lng": "number"
  }
}
```

### Prediction
```json
{
  "station_id": "string",
  "line": "string",
  "predicted_delay": "number",
  "confidence": "number",
  "timestamp": "datetime",
  "features": {
    "weather": "object",
    "time_of_day": "number",
    "day_of_week": "number"
  }
}
```
