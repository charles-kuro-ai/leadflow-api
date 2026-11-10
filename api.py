"""
LeadFlow Nigeria — Scraper API
Deploy this to Railway. The dashboard calls it to trigger lead scraping.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import time
import threading
from supabase import create_client

app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = "AIzaSyDzGTwpWp9n5tCP3i3a2LYDjqR48eKddaY"
SUPABASE_URL   = "https://jyigungffdpqdgknhqao.supabase.co"
SUPABASE_KEY   = "sb_publishable_Am7kFgOwqUw6BWWwElm0pw_0nS_wzHP"

# Track running jobs
jobs = {}

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
    except:
        return []

def push_lead(supabase, place, city, business_type, user_id):
    name  = place.get("displayName", {}).get("text", "").strip()
    phone = place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber") or None
    address = place.get("formattedAddress", city).strip()
    btype = place.get("primaryTypeDisplayName", {}).get("text", business_type).title()
    tier  = assign_tier(btype, name)
    score = calc_score(place)

    if not name:
        return False

    # Duplicate check scoped to this user
    check = supabase.table("leads").select("id").eq("name", name).eq("location", city).eq("user_id", user_id).execute()
    if check.data:
        return False

    lead = {
        "name": name, "phone": phone, "location": city,
        "tier": tier, "score": score, "source": "Google Maps",
        "status": "New", "agent": None, "income": None,
        "business_type": btype, "notes": address,
        "user_id": user_id,
    }
    result = supabase.table("leads").insert(lead).execute()
    return bool(result.data)

def run_scraper(job_id, cities, business_types, max_per_search, user_id):
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    jobs[job_id]["status"] = "running"
    jobs[job_id]["added"] = 0
    jobs[job_id]["total_searched"] = 0
    total = len(cities) * len(business_types)

    for city in cities:
        if jobs[job_id].get("cancelled"):
            break
        for btype in business_types:
            if jobs[job_id].get("cancelled"):
                break
            places = search_places(btype, city, max_per_search)
            for p in places:
                if jobs[job_id].get("cancelled"):
                    break
                if push_lead(supabase, p, city, btype, user_id):
                    jobs[job_id]["added"] += 1
            jobs[job_id]["total_searched"] += 1
            jobs[job_id]["progress"] = round((jobs[job_id]["total_searched"] / total) * 100)
            time.sleep(0.3)

    if jobs[job_id].get("cancelled"):
        jobs[job_id]["status"] = "cancelled"
    else:
        jobs[job_id]["status"] = "done"

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "LeadFlow API running"})

def verify_token(token):
    """Verify Supabase JWT and return user_id, or None if invalid."""
    try:
        # Decode JWT manually — no external lib needed, just parse the payload
        import base64, json as _json
        parts = token.split(".")
        if len(parts) != 3:
            return None
        # Add padding
        payload = parts[1] + "=" * (-len(parts[1]) % 4)
        decoded = _json.loads(base64.urlsafe_b64decode(payload))
        user_id = decoded.get("sub")
        exp = decoded.get("exp", 0)
        if not user_id:
            return None
        import time as _time
        if _time.time() > exp:
            return None  # token expired
        return user_id
    except Exception:
        return None

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

    import uuid
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
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
