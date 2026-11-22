import requests
import time

API_URL = "http://127.0.0.1:8000/api/projects"

def clean_and_seed():
    print("🧹 Step 1: Wiping existing projects via API to prevent duplicates...")
    try:
        existing_projects = requests.get(API_URL).json()
        for p in existing_projects:
            requests.delete(f"{API_URL}/{p['id']}")
        print(f"🗑️ Successfully deleted {len(existing_projects)} old projects.")
    except Exception as e:
        print(f"⚠️ Could not reach API. Ensure Uvicorn is running on port 8000. ({e})")
        return

    # Real-world Nagpur civic & Maha Metro Phase 2 project corridors
    real_nagpur_projects = [
        {
            "title": "PWD - Wardha Road Concretisation",
            "agency_id": 1,
            "start_date": "2026-08-01",
            "end_date": "2026-12-31",
            "coordinates": [[21.1313, 79.0789], [21.1355, 79.0815], [21.1400, 79.0830]]
        },
        {
            "title": "NMC - Nag River Sewer Pipeline",
            "agency_id": 1,
            "start_date": "2026-08-15",
            "end_date": "2026-09-30",
            "coordinates": [[21.1387, 79.0847], [21.1370, 79.0835], [21.1350, 79.0848], [21.1325, 79.0848]]
        },
        {
            "title": "MSEDCL - High-Tension Cabling (Dharampeth)",
            "agency_id": 2,
            "start_date": "2026-08-10",
            "end_date": "2026-08-28",
            "coordinates": [[21.1401, 79.0673], [21.1368, 79.0658], [21.1317, 79.0654]]
        },
        {
            "title": "Maha Metro - Phase 2 Reach 3A (Hingna Viaduct)",
            "agency_id": 2,
            "start_date": "2026-08-15",
            "end_date": "2026-11-30",
            "coordinates": [[21.1245, 79.0264], [21.1210, 79.0142], [21.1172, 79.0021], [21.1098, 78.9875]]
        },
        {
            "title": "Maha Metro - Reach 4A Pier Construction (Central Ave)",
            "agency_id": 2,
            "start_date": "2026-09-01",
            "end_date": "2026-12-15",
            "coordinates": [[21.1498, 79.1382], [21.1512, 79.1490], [21.1528, 79.1620], [21.1541, 79.1755]]
        },
        {
            "title": "BSNL - Optical Fiber Trenching (Pardi Stretch)",
            "agency_id": 3,
            "start_date": "2026-09-05",
            "end_date": "2026-09-25",
            "coordinates": [[21.1505, 79.1450], [21.1520, 79.1580], [21.1535, 79.1710]]
        },
        {
            "title": "Maha Metro - Reach 2B Kamptee Road Viaduct",
            "agency_id": 2,
            "start_date": "2026-08-20",
            "end_date": "2026-12-20",
            "coordinates": [[21.1965, 79.0965], [21.2080, 79.1080], [21.2215, 79.1235], [21.2380, 79.1420]]
        }
    ]

    print("\n🚀 Step 2: Seeding fresh data...")
    for proj in real_nagpur_projects:
        response = requests.post(API_URL, json=proj)
        if response.status_code == 200:
            print(f"✅ Added: {proj['title']}")
        time.sleep(0.2)
        
    print("\n🎉 Database perfectly reset and seeded! Refresh your browser.")

if __name__ == "__main__":
    clean_and_seed()
