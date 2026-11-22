import requests
import time

API_URL = "http://127.0.0.1:8000/api/projects"

# Real-world Nagpur civic & Maha Metro Phase 2 project corridors
real_nagpur_projects = [
    # 1. PWD Project
    {
        "title": "PWD - Wardha Road Concretisation",
        "agency_id": 1,
        "start_date": "2026-08-01",
        "end_date": "2026-12-31",
        "coordinates": [
            [21.1313, 79.0789],  # Rahate Colony Square
            [21.1355, 79.0815],  # Lokmat Square
            [21.1400, 79.0830]   # Panchsheel Square
        ]
    },
    # 2. NMC Sewer Line (Collides with Wardha Road work)
    {
        "title": "NMC - Nag River Sewer Pipeline",
        "agency_id": 1,
        "start_date": "2026-08-15",
        "end_date": "2026-09-30",
        "coordinates": [
            [21.1387, 79.0847],  # Munje Square
            [21.1370, 79.0835],  # Crosses Wardha Road near Lokmat Sq
            [21.1350, 79.0848],  # Dhantoli Park stretch
            [21.1325, 79.0848]
        ]
    },
    # 3. MSEDCL Power Grid
    {
        "title": "MSEDCL - High-Tension Cabling (Dharampeth)",
        "agency_id": 2,
        "start_date": "2026-08-10",
        "end_date": "2026-08-28",
        "coordinates": [
            [21.1401, 79.0673],  # Law College Square
            [21.1368, 79.0658],  # Shankar Nagar Square
            [21.1317, 79.0654]   # Bajaj Nagar Square
        ]
    },
    # 4. Maha Metro Phase 2 - Reach 3A (Hingna Corridor Viaduct & Piling)
    {
        "title": "Maha Metro - Phase 2 Reach 3A (Hingna Corridor Viaduct)",
        "agency_id": 2,
        "start_date": "2026-08-15",
        "end_date": "2026-11-30",
        "coordinates": [
            [21.1245, 79.0264],  # Lokmanya Nagar Metro Station
            [21.1210, 79.0142],  # Mount View
            [21.1172, 79.0021],  # Rajiv Nagar
            [21.1098, 78.9875]   # Wanadongri / YCCE Junction
        ]
    },
    # 5. Maha Metro Phase 2 - Reach 4A (Pardi / Central Avenue Extension)
    {
        "title": "Maha Metro - Reach 4A Pier Construction (Central Ave)",
        "agency_id": 2,
        "start_date": "2026-09-01",
        "end_date": "2026-12-15",
        "coordinates": [
            [21.1498, 79.1382],  # Prajapati Nagar Metro Station
            [21.1512, 79.1490],  # Vaishnodevi Square
            [21.1528, 79.1620],  # Pardi Octroi Naka
            [21.1541, 79.1755]   # Transport Nagar Kapsi
        ]
    },
    # 6. BSNL Telecom - Pardi Fiber Trenching (Collides with Metro Reach 4A)
    {
        "title": "BSNL - Optical Fiber Trenching (Pardi Stretch)",
        "agency_id": 3,
        "start_date": "2026-09-05",
        "end_date": "2026-09-25",
        "coordinates": [
            [21.1505, 79.1450],  # Near Pardi Flyover
            [21.1520, 79.1580],  # Crosses Metro Pier Alignment
            [21.1535, 79.1710]
        ]
    },
    # 7. Maha Metro Phase 2 - Reach 2B (Automotive Sq to Kamptee Rd)
    {
        "title": "Maha Metro - Reach 2B Kamptee Road Viaduct",
        "agency_id": 2,
        "start_date": "2026-08-20",
        "end_date": "2026-12-20",
        "coordinates": [
            [21.1965, 79.0965],  # Automotive Square
            [21.2080, 79.1080],  # Pili Nadi
            [21.2215, 79.1235],  # Khasara Fata
            [21.2380, 79.1420]   # Lekha Nagar / Cantonment
        ]
    }
]

def seed_data():
    print("🚀 Seeding realistic Nagpur civic & Maha Metro Phase 2 infrastructure data...")
    for proj in real_nagpur_projects:
        try:
            response = requests.post(API_URL, json=proj)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Added: {proj['title']} (Conflicts detected: {data.get('conflicts_detected', 0)})")
            else:
                print(f"❌ Failed to add {proj['title']}: {response.text}")
        except Exception as e:
            print(f"⚠️ Connection Error: Ensure the FastAPI server is running on port 8000. ({e})")
            return
        time.sleep(0.4)
        
    print("\n🎉 Maha Metro & municipal infrastructure data seeded successfully!")

if __name__ == "__main__":
    seed_data()
