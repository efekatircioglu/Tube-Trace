# Development Setup Guide

## Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+

## Backend Setup

1. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb tube_trace
   
   # Run migrations (when available)
   alembic upgrade head
   ```

5. **Start Backend**
   ```bash
   cd backend
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

## Data Collection Setup

1. **Get TFL API Key**
   - Visit: https://api.tfl.gov.uk/
   - Register for an API key
   - Add to your .env file

2. **Get Weather API Key**
   - Visit: https://openweathermap.org/api
   - Register for an API key
   - Add to your .env file

## Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Circle Line Focus

For initial development, the system is configured to focus on Circle Line stations:
- Paddington
- Edgware Road
- Baker Street
- Great Portland Street
- Euston Square
- King's Cross St. Pancras
- Farringdon
- Barbican
- Moorgate
- Liverpool Street
- Aldgate
- Tower Hill
- Monument
- Cannon Street
- Mansion House
- Blackfriars
- Temple
- Embankment
- Westminster
- St. James's Park
- Victoria
- Sloane Square
- South Kensington
- Gloucester Road
- High Street Kensington
- Notting Hill Gate
- Bayswater
- Paddington
