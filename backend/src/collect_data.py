import os
import requests
import pandas as pd
import psycopg2
from datetime import datetime
from dotenv import load_dotenv
import io

# --- 1. CONFIGURATION ---
# Loads credentials from your .env file
load_dotenv()

# Your 6 target lines
LINE_IDS = ["bakerloo", "central", "circle", "district", "hammersmith-city", "metropolitan"]

# API Key and Database credentials from your .env file
TFL_API_KEY = os.getenv("TFL_API_KEY")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# --- 2. HELPER FUNCTION ---
def clean_tfl_status(severity, reason):
    """Cleans the raw TfL status text into a simple category."""
    reason = reason or ""
    if "good service on the rest" in reason.lower():
        return "Partial"
    return severity.replace(" ", "_").lower()

# --- 3. MAIN LOGIC ---
def main():
    """Main function to collect, process, and store data."""
    print(f"Starting data collection run at: {datetime.now().isoformat()}")

    all_lines_data = []

    # Loop through each of the 6 lines
    for line_id in LINE_IDS:
        try:
            # Fetch Line Status
            status_url = f"https://api.tfl.gov.uk/Line/{line_id}/Status?app_key={TFL_API_KEY}"
            status_response = requests.get(status_url, timeout=10)
            status_response.raise_for_status()
            status_json = status_response.json()
            status_data = status_json[0]['lineStatuses'][0]

            # Fetch Arrivals Data
            arrivals_url = f"https://api.tfl.gov.uk/Line/{line_id}/Arrivals?app_key={TFL_API_KEY}"
            arrivals_response = requests.get(arrivals_url, timeout=10)
            arrivals_response.raise_for_status()
            arrivals_data = arrivals_response.json()
            
            # Engineer Features from the data
            active_train_count = len({pred.get('vehicleId') for pred in arrivals_data})
            clean_status = clean_tfl_status(status_data['statusSeverityDescription'], status_data.get('reason'))

            # Assemble the data for this line into a dictionary
            line_snapshot = {
                "timestamp": datetime.now(),
                "line_id": line_id,
                "status": clean_status,
                "status_reason": status_data.get('reason'),
                "active_trains": active_train_count,
            }
            all_lines_data.append(line_snapshot)
            print(f"Successfully fetched data for {line_id}.")

        except Exception as e:
            print(f"Error processing {line_id}: {e}")
            continue # If one line fails, continue to the next

    if not all_lines_data:
        print("No data was collected. Ending run.")
        return
        
    # Convert the collected data to a Pandas DataFrame
    df = pd.DataFrame(all_lines_data)
    
    # Connect to the database and save the data
    try:
        conn = psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)
        
        buffer = io.StringIO()
        df.to_csv(buffer, index=False, header=False)
        buffer.seek(0)
        
        cursor = conn.cursor()
        cursor.copy_from(buffer, 'tube_snapshots', sep=',')
        conn.commit()
        
        print(f"Successfully inserted {len(df)} rows into the database.")
    except Exception as e:
        print(f"Database error: {e}")
    finally:
        if 'conn' in locals() and conn:
            cursor.close()
            conn.close()

# --- 4. EXECUTION ---
# This makes the script runnable from the command line
if __name__ == "__main__":
    main()