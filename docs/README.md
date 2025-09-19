# Tube Trace Project Structure

This document outlines the complete directory structure and purpose of each component in the Tube Trace project.

## Root Directory
```
Tube Trace/
├── README.md                    # Main project documentation
├── requirements.txt             # Python dependencies
├── env.example                  # Environment variables template
├── .gitignore                   # Git ignore rules
├── backend/                     # Python backend application
├── frontend/                    # Next.js frontend application
├── data/                        # Data storage and processing
├── docs/                        # Project documentation
├── scripts/                     # Utility and deployment scripts
└── tests/                       # Integration tests
```

## Backend Structure (`backend/`)
```
backend/
├── src/                         # Source code
│   ├── api/                     # FastAPI application
│   │   ├── endpoints/           # API route handlers
│   │   └── middleware/          # Custom middleware
│   ├── ml/                      # Machine learning components
│   │   ├── models/              # ML model definitions
│   │   ├── preprocessing/       # Data preprocessing
│   │   └── training/            # Model training scripts
│   ├── data_collection/         # Data gathering modules
│   │   ├── tfl_api/            # TFL API integration
│   │   ├── weather_api/        # Weather data collection
│   │   └── scrapers/           # Web scraping utilities
│   ├── models/                  # Database models
│   │   ├── database/           # SQLAlchemy models
│   │   └── schemas/            # Pydantic schemas
│   └── utils/                   # Utility functions
│       ├── logging/            # Logging configuration
│       ├── config/             # Configuration management
│       └── helpers/            # Helper functions
├── config/                      # Configuration files
├── tests/                       # Backend unit tests
└── logs/                        # Application logs
```

## Frontend Structure (`frontend/`)
```
frontend/
├── src/                         # Source code
│   ├── components/              # React components
│   │   ├── common/             # Reusable components
│   │   ├── charts/             # Data visualization
│   │   └── layout/             # Layout components
│   ├── pages/                   # Next.js pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── predictions/        # Prediction views
│   │   └── stations/           # Station information
│   ├── services/                # API services
│   │   ├── api/                # HTTP client
│   │   └── websocket/          # Real-time updates
│   ├── utils/                   # Utility functions
│   │   ├── constants/          # Application constants
│   │   └── helpers/            # Helper functions
│   └── styles/                  # Styling
│       ├── components/         # Component styles
│       └── pages/              # Page styles
├── public/                      # Static assets
├── package.json                 # Node.js dependencies
├── tailwind.config.js           # Tailwind CSS config
└── next.config.js               # Next.js configuration
```

## Data Structure (`data/`)
```
data/
├── raw/                         # Raw data from APIs
│   ├── tfl/                    # TFL API responses
│   ├── weather/                # Weather data
│   └── historical/             # Historical data
├── processed/                   # Cleaned and processed data
│   ├── features/               # Feature engineering output
│   └── training/               # Training datasets
├── models/                      # Trained ML models
│   ├── delay_prediction/       # Delay prediction models
│   └── feature_importance/     # Feature analysis
└── circle_line_stations.json   # Circle Line station data
```

## Documentation Structure (`docs/`)
```
docs/
├── api/                         # API documentation
│   └── README.md               # API endpoints and schemas
├── deployment/                  # Deployment guides
│   └── README.md               # Deployment instructions
├── development/                # Development guides
│   └── README.md               # Setup and development
└── README.md                    # Main documentation
```

## Scripts Structure (`scripts/`)
```
scripts/
├── data_collection/             # Data collection scripts
│   ├── collect_tfl_data.py    # TFL data collection
│   ├── collect_weather.py     # Weather data collection
│   └── schedule_collection.py # Automated collection
├── deployment/                  # Deployment scripts
│   ├── deploy_backend.sh      # Backend deployment
│   ├── deploy_frontend.sh     # Frontend deployment
│   └── setup_infrastructure.sh # Infrastructure setup
└── maintenance/                 # Maintenance scripts
    ├── cleanup_logs.py        # Log cleanup
    ├── backup_data.py         # Data backup
    └── health_check.py        # System health check
```

## Key Features by Directory

### Backend Features
- **API**: RESTful endpoints for data access
- **ML**: Machine learning models for delay prediction
- **Data Collection**: Automated data gathering from TFL and weather APIs
- **Database**: PostgreSQL for data persistence
- **Caching**: Redis for performance optimization

### Frontend Features
- **Dashboard**: Real-time delay predictions visualization
- **Charts**: Interactive data visualization using Recharts
- **Responsive**: Mobile-friendly design with Tailwind CSS
- **Real-time**: WebSocket connections for live updates
- **Station Info**: Detailed station and line information

### Data Management
- **Raw Data**: Unprocessed API responses
- **Processed Data**: Cleaned and feature-engineered datasets
- **Models**: Trained ML models for predictions
- **Backup**: Automated data backup and recovery

### Development Support
- **Testing**: Comprehensive test suites
- **Documentation**: Detailed API and development guides
- **Scripts**: Automation for common tasks
- **Configuration**: Environment-based configuration management
