# Tube Trace - London Underground Delay Prediction System

A full-stack machine learning application that predicts real-time train delays on the London Underground, starting with the Circle Line.

## Project Structure

```
Tube Trace/
├── backend/                 # Python backend
│   ├── src/
│   │   ├── api/            # FastAPI endpoints
│   │   ├── ml/             # Machine learning models
│   │   ├── data_collection/ # TFL API integration
│   │   ├── models/         # Database models
│   │   └── utils/          # Utility functions
│   ├── config/             # Configuration files
│   ├── tests/              # Backend tests
│   └── logs/               # Application logs
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── services/       # API services
│   │   ├── utils/          # Frontend utilities
│   │   └── styles/         # CSS/Tailwind styles
│   └── public/             # Static assets
├── data/                   # Data storage
│   ├── raw/               # Raw data from APIs
│   ├── processed/         # Cleaned data
│   └── models/            # Trained ML models
├── docs/                   # Documentation
├── scripts/               # Utility scripts
└── tests/                 # Integration tests
```

## Features (Planned)

- **Real-time Data Collection**: Automated data gathering from TFL API every 5 minutes
- **Machine Learning Models**: Predict train delays using historical and real-time data
- **Weather Integration**: Include weather data for better predictions
- **Interactive Dashboard**: Real-time visualization of predictions and delays
- **Circle Line Focus**: Initial testing on Circle Line before expanding

## Getting Started

### Backend Setup

1. Navigate to the project root
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Development Phases

### Phase 1: Circle Line Testing
- Focus on Circle Line data collection
- Basic ML model development
- Simple frontend dashboard

### Phase 2: Full System
- Expand to all Underground lines
- Cloud deployment with automated data collection
- Advanced ML models with weather integration

## API Keys Required

- TFL API key for London Underground data
- Weather API key (OpenWeatherMap or similar)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
