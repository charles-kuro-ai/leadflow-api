"""
LeadFlow Nigeria — Scraper API
Deploy this to Railway. The dashboard calls it to trigger lead scraping.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import threading
import os
import uuid
import base64
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
SUPABASE_URL   = os.environ.get("SUPABASE_URL", "https://jyigungffdpqdgknhqao.supabase.co")
SUPABASE_KEY   = os.environ.get("SUPABASE_KEY", "")

# Track running jobs
jobs = {}

BUSINESS_KEYWORDS = {
    "Supermarket":       ["supermarket", "grocery store", "food market"],
    "Pharmacy":          ["pharmacy", "chemist", "drug store"],
    "Hotel":             ["hotel", "guest house", "lodge"],
    "Restaurant":        ["restaurant", "eatery", "food canteen"],
    "Hospital":          ["hospital", "medical centre", "clinic"],
    "School":            ["school", "academy", "college"],
    "Logistics":         ["logistics company", "courier service", "transport company"],
    "Filling Station":   ["filling station", "petrol station", "fuel station"],
    "Hardware Store":    ["hardware store", "building materials", "ironmonger"],
    "Fashion Shop":      ["fashion shop", "boutique", "clothing store"],
    "Electronics Store": ["electronics store", "phone shop", "computer shop"],
    "Church":            ["church", "ministry", "evangelical church"],
    "Mosque":            ["mosque", "islamic centre", "masjid"],
    "Market":            ["market", "trade centre", "shopping complex"],
    "Salon":             ["salon", "barber shop", "hair stylist"],
    "Bakery":            ["bakery", "bread shop", "confectionery"],
    "Printing Press":    ["printing press", "print shop", "signage company"],
    "Clinic":            ["clinic", "medical centre", "health centre"],
}

# ── Supabase REST helpers (no supabase library needed) ──────────────────────

def sb_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

def sb_select(table, filters: dict):
    """Return rows matching all filters."""
    params = {k: f"eq.{v}" for k, v in filters.items()}
    params["select"] = "id"
    try:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}", headers=sb_headers(), params=params, timeout=10)
        if r.ok:
            data = r.json()
            return data if isinstance(data, list) else []
        else:
            print(f"[SELECT ERROR] {r.status_code}: {r.text}")
            return []
    except Exception as e:
        print(f"[SELECT EXCEPTION] {e}")
        return []

def sb_insert(table, row: dict):
    """Insert a row. Returns True on success."""
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=sb_headers(), json=row, timeout=10)
    if not r.ok:
        print(f"[INSERT ERROR] {r.status_code}: {r.text}")
    return r.ok

# ── Business logic ──────────────────────────────────────────────────────────

def assign_tier(business_type, name):
    combined = (business_type + " " + name).lower()
    if any(k in combined for k in ["hospital","hotel","school","logistics","filling station","clinic"]):
        return "Corporate"
    if any(k in combined for k in ["market","salon","church","mosque","bakery"]):
        return "Mass Market"
    return "SME"

def calc_score(place):
    score = 40
    if place.get("rating"): score += min(int(place["rating"] * 4), 20)
    if place.get("userRatingCount", 0) > 50: score += 10
    if place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber"): score += 10
    if place.get("websiteUri"): score += 10
    return min(score, 100)

def search_places(query, city, max_results=20):
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.websiteUri"
    }
    body = {
        "textQuery": f"{query} in {city}, Nigeria",
        "maxResultCount": min(max_results, 20),
        "languageCode": "en"
    }
    try:
        r = requests.post(url, headers=headers, json=body, timeout=15)
        return r.json().get("places", [])
    except Exception as e:
        print(f"[GOOGLE ERROR] {e}")
        return []

def push_lead(place, city, business_type, user_id):
    name    = place.get("displayName", {}).get("text", "").strip()
    phone   = place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber") or None
    address = place.get("formattedAddress", city).strip()
    btype   = place.get("primaryTypeDisplayName", {}).get("text", business_type).title()
    tier    = assign_tier(btype, name)
    score   = calc_score(place)

    if not name:
        return False

    # Duplicate check temporarily disabled for debugging
    # existing = sb_select("leads", {"name": name, "location": city, "user_id": user_id})
    # if existing:
    #     print(f"[DUPLICATE] {name}")
    #     return False

    lead = {
        "name": name, "phone": phone, "location": city,
        "tier": tier, "score": score, "source": "Google Maps",
        "status": "New", "agent": None, "income": None,
        "business_type": btype, "notes": address,
        "user_id": user_id,
    }
    return sb_insert("leads", lead)

def run_scraper(job_id, cities, business_types, max_per_search, user_id):
    jobs[job_id]["status"] = "running"
    jobs[job_id]["added"] = 0
    jobs[job_id]["total_searched"] = 0

    searches = []
    for city in cities:
        for btype in business_types:
            keywords = BUSINESS_KEYWORDS.get(btype, [btype])
            for kw in keywords:
                searches.append((city, btype, kw))

    total = len(searches)
    jobs[job_id]["total"] = total

    def do_search(city, btype, keyword):
        if jobs[job_id].get("cancelled"):
            return 0
        places = search_places(keyword, city, max_per_search)
        print(f"[SEARCH] '{keyword}' in {city} → {len(places)} places")
        added = 0
        for p in places:
            if jobs[job_id].get("cancelled"):
                break
            if push_lead(p, city, btype, user_id):
                added += 1
        jobs[job_id]["total_searched"] += 1
        jobs[job_id]["progress"] = round((jobs[job_id]["total_searched"] / total) * 100)
        return added

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(do_search, city, btype, kw): (city, btype, kw) for city, btype, kw in searches}
        for future in as_completed(futures):
            if jobs[job_id].get("cancelled"):
                break
            jobs[job_id]["added"] += future.result()

    jobs[job_id]["status"] = "cancelled" if jobs[job_id].get("cancelled") else "done"

# ── JWT verification ────────────────────────────────────────────────────────

def verify_token(token):
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        payload = parts[1] + "=" * (-len(parts[1]) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload))
        user_id = decoded.get("sub")
        exp = decoded.get("exp", 0)
        if not user_id or time.time() > exp:
            return None
        return user_id
    except Exception:
        return None

# ── Routes ──────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "LeadFlow API running"})

@app.route("/scrape", methods=["POST"])
def scrape():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        return jsonify({"error": "Missing authorization token"}), 401

    user_id = verify_token(token)
    if not user_id:
        return jsonify({"error": "Invalid or expired token"}), 401

    data = request.json or {}
    cities         = data.get("cities", ["Lagos"])
    business_types = data.get("business_types", ["supermarket"])
    max_per_search = min(int(data.get("max_per_search", 20)), 20)

    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {"status": "starting", "added": 0, "progress": 0}

    t = threading.Thread(target=run_scraper, args=(job_id, cities, business_types, max_per_search, user_id))
    t.daemon = True
    t.start()

    return jsonify({"job_id": job_id, "message": "Scraper started"})

@app.route("/status/<job_id>", methods=["GET"])
def status(job_id):
    job = jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)

@app.route("/cancel/<job_id>", methods=["POST"])
def cancel(job_id):
    if job_id in jobs:
        jobs[job_id]["cancelled"] = True
        return jsonify({"message": "Cancelling..."})
    return jsonify({"error": "Job not found"}), 404

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
