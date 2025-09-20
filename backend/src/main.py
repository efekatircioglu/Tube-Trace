from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Tube Trace API",
    description="London Underground delay prediction system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TFL API configuration
TFL_API_KEY = os.getenv("TFL_API_KEY")
TFL_BASE_URL = "https://api.tfl.gov.uk"

@app.get("/")
async def root():
    return {"message": "Tube Trace API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "api_key_configured": bool(TFL_API_KEY)}

@app.get("/api/tfl/test")
async def test_tfl_api():
    """Test endpoint to call TFL API for Circle Line timetable"""
    if not TFL_API_KEY:
        raise HTTPException(status_code=500, detail="TFL_API_KEY not configured")
    
    # The URL you provided: https://api.tfl.gov.uk/Line/circle/Timetable/940GZZLUALD
    url = f"{TFL_BASE_URL}/Line/circle/Timetable/940GZZLUALD"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params={"app_key": TFL_API_KEY},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"TFL API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/tfl/circle/status")
async def get_circle_line_status():
    """Get Circle Line status information"""
    if not TFL_API_KEY:
        raise HTTPException(status_code=500, detail="TFL_API_KEY not configured")
    
    url = f"{TFL_BASE_URL}/Line/circle/Status"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params={"app_key": TFL_API_KEY},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"TFL API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/tfl/circle/arrivals")
async def get_circle_line_arrivals():
    """Get Circle Line arrivals information"""
    if not TFL_API_KEY:
        raise HTTPException(status_code=500, detail="TFL_API_KEY not configured")
    
    url = f"{TFL_BASE_URL}/Line/circle/Arrivals"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params={"app_key": TFL_API_KEY},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"TFL API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/tfl/disruptions")
async def get_transport_disruptions(modes: str = "tube,bus,dlr"):
    """Get transport disruptions for specified modes"""
    if not TFL_API_KEY:
        raise HTTPException(status_code=500, detail="TFL_API_KEY not configured")
    
    url = f"{TFL_BASE_URL}/Line/Mode/{modes}/Disruption"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params={"app_key": TFL_API_KEY},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"TFL API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/tfl/lines/disruptions")
async def get_line_disruptions(line_ids: str):
    """Get disruptions for specific train lines"""
    if not TFL_API_KEY:
        raise HTTPException(status_code=500, detail="TFL_API_KEY not configured")
    
    url = f"{TFL_BASE_URL}/Line/{line_ids}/Disruption"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params={"app_key": TFL_API_KEY},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"TFL API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/tfl/lines/arrivals")
async def get_line_arrivals(line_ids: str):
    """Get arrivals for specific train lines"""
    if not TFL_API_KEY:
        raise HTTPException(status_code=500, detail="TFL_API_KEY not configured")
    
    url = f"{TFL_BASE_URL}/Line/{line_ids}/Arrivals"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params={"app_key": TFL_API_KEY},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"TFL API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/tfl/lines/status")
async def get_line_status(line_ids: str):
    """Get status for specific train lines"""
    if not TFL_API_KEY:
        raise HTTPException(status_code=500, detail="TFL_API_KEY not configured")
    
    url = f"{TFL_BASE_URL}/Line/{line_ids}/Status"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params={"app_key": TFL_API_KEY},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"TFL API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/tfl/crowding/{naptan_id}")
async def get_station_crowding(naptan_id: str):
    """Get live crowding data for a specific station"""
    if not TFL_API_KEY:
        raise HTTPException(status_code=500, detail="TFL_API_KEY not configured")
    
    url = f"{TFL_BASE_URL}/crowding/{naptan_id}/Live"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params={"app_key": TFL_API_KEY},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"TFL API error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
