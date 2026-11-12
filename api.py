"""
LeadFlow Nigeria — Scraper API
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import threading
import os, uuid, base64, json, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
SUPABASE_URL   = os.environ.get("SUPABASE_URL", "https://jyigungffdpqdgknhqao.supabase.co")
SUPABASE_KEY   = os.environ.get("SUPABASE_KEY", "")

jobs = {}

BUSINESS_KEYWORDS = {
    "Supermarket": ["supermarket", "grocery store", "food market"],
    "Pharmacy": ["pharmacy", "chemist", "drug store"],
    "Hotel": ["hotel", "guest house", "lodge"],
    "Restaurant": ["restaurant", "eatery", "food canteen"],
    "Hospital": ["hospital", "medical centre", "clinic"],
    "School": ["school", "academy", "college"],
    "Logistics": ["logistics company", "courier service", "transport company"],
    "Filling Station": ["filling station", "petrol station", "fuel station"],
    "Hardware Store": ["hardware store", "building materials", "ironmonger"],
    "Fashion Shop": ["fashion shop", "boutique", "clothing store"],
    "Electronics Store": ["electronics store", "phone shop", "computer shop"],
    "Church": ["church", "ministry", "evangelical church"],
    "Mosque": ["mosque", "islamic centre", "masjid"],
    "Market": ["market", "trade centre", "shopping complex"],
    "Salon": ["salon", "barber shop", "hair stylist"],
    "Bakery": ["bakery", "bread shop", "confectionery"],
    "Printing Press": ["printing press", "print shop", "signage company"],
    "Clinic": ["clinic", "medical centre", "health centre"],
}

def get_keywords_for_type(business_type):
    return BUSINESS_KEYWORDS.get(business_type, [business_type])

def sb_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

def sb_select(table, filters):
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

def sb_insert(table, row):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=sb_headers(), json=row, timeout=10)
    if not r.ok:
        print(f"[INSERT ERROR] {r.status_code}: {r.text}")
    return r.ok

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
    body = {"textQuery": f"{query} in {city}, Nigeria", "maxResultCount": min(max_results, 20), "languageCode": "en"}
    try:
        r = requests.post(url, headers=headers, json=body, timeout=15)
        return r.json().get("places", [])
    except Exception as e:
        print(f"[GOOGLE ERROR] {e}")
        return []

def push_lead(place, city, business_type, user_id, branch=None):
    name    = place.get("displayName", {}).get("text", "").strip()
    phone   = place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber") or None
    address = place.get("formattedAddress", city).strip()
    btype   = place.get("primaryTypeDisplayName", {}).get("text", business_type).title()
    tier    = assign_tier(btype, name)
    score   = calc_score(place)
    if not name:
        return False
    # Duplicate check
    existing = sb_select("leads", {"name": name, "location": city})
    if existing:
        print(f"[SKIP] Duplicate: {name}")
        return False
    lead = {
        "name": name, "phone": phone, "location": city,
        "tier": tier, "score": score, "source": "Google Maps",
        "status": "New", "agent": None, "income": None,
        "business_type": btype, "notes": address, "user_id": user_id,
        "branch": branch,  # ← branch scoping
    }
    return sb_insert("leads", lead)

def run_scraper(job_id, cities, business_types, keywords_map, max_total, user_id, branch=None):
    jobs[job_id]["status"] = "running"
    jobs[job_id]["added"] = 0
    jobs[job_id]["total_searched"] = 0

    searches = []
    for city in cities:
        for btype in business_types:
            selected_keywords = keywords_map.get(btype, [btype])
            for kw in selected_keywords:
                searches.append((city, btype, kw))

    total = len(searches)
    jobs[job_id]["total"] = total
    counter_lock = Lock()  # prevents race condition on the add counter

    def do_search(city, btype, keyword):
        if jobs[job_id].get("cancelled"): return 0
        with counter_lock:
            if jobs[job_id]["added"] >= max_total: return 0

        places = search_places(keyword, city, 20)
        print(f"[SEARCH] '{keyword}' in {city} → {len(places)} places")
        added = 0
        for p in places:
            if jobs[job_id].get("cancelled"): break
            with counter_lock:
                if jobs[job_id]["added"] >= max_total: break
                # Reserve the slot before inserting to prevent over-shoot
                jobs[job_id]["added"] += 1
                reserved = True
            if reserved and push_lead(p, city, btype, user_id, branch):
                added += 1
            else:
                # Insertion failed or duplicate — give the slot back
                with counter_lock:
                    jobs[job_id]["added"] -= 1
            reserved = False
        with counter_lock:
            jobs[job_id]["total_searched"] += 1
            jobs[job_id]["progress"] = round((jobs[job_id]["total_searched"] / total) * 100)
        return added

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(do_search, c, b, kw): (c, b, kw) for c, b, kw in searches}
        for future in as_completed(futures):
            if jobs[job_id].get("cancelled"): break
            with counter_lock:
                if jobs[job_id]["added"] >= max_total: break
            future.result()

    jobs[job_id]["status"] = "cancelled" if jobs[job_id].get("cancelled") else "done"

def verify_token(token):
    try:
        parts = token.split(".")
        if len(parts) != 3: return None
        payload = parts[1] + "=" * (-len(parts[1]) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload))
        user_id = decoded.get("sub")
        exp = decoded.get("exp", 0)
        if not user_id or time.time() > exp: return None
        return user_id
    except: return None

def get_profile(user_id):
    """Fetch the caller's profile row (role + branch)."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/profiles",
        headers=sb_headers(),
        params={"user_id": f"eq.{user_id}", "select": "role,name,branch"}
    )
    data = r.json()
    return data[0] if data else None

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "LeadFlow API running"})

@app.route("/debug", methods=["GET"])
def debug():
    key = GOOGLE_API_KEY
    return jsonify({
        "key_length": len(key),
        "key_start": key[:10] if key else "EMPTY",
        "key_end": key[-5:] if key else "EMPTY"
    })

@app.route("/keywords", methods=["GET"])
def get_keywords():
    return jsonify(BUSINESS_KEYWORDS)

@app.route("/scrape", methods=["POST"])
def scrape():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token: return jsonify({"error": "Missing authorization token"}), 401
    user_id = verify_token(token)
    if not user_id: return jsonify({"error": "Invalid or expired token"}), 401

    # Get the caller's branch so scraped leads are tagged to it
    caller = get_profile(user_id)
    caller_branch = caller.get("branch") if caller else None

    data = request.json or {}
    cities = data.get("cities", ["Lagos"])
    business_types = data.get("business_types", [])
    keywords_map = data.get("keywords_map", {})
    max_total = min(int(data.get("max_total", 20)), 500)

    if not keywords_map:
        for btype in business_types:
            keywords_map[btype] = BUSINESS_KEYWORDS.get(btype, [btype])

    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {"status": "starting", "added": 0, "progress": 0}
    t = threading.Thread(
        target=run_scraper,
        args=(job_id, cities, business_types, keywords_map, max_total, user_id, caller_branch)
    )
    t.daemon = True
    t.start()
    return jsonify({"job_id": job_id, "message": "Scraper started"})

@app.route("/status/<job_id>", methods=["GET"])
def status(job_id):
    job = jobs.get(job_id)
    if not job: return jsonify({"error": "Job not found"}), 404
    return jsonify(job)

@app.route("/cancel/<job_id>", methods=["POST"])
def cancel(job_id):
    if job_id in jobs:
        jobs[job_id]["cancelled"] = True
        return jsonify({"message": "Cancelling..."})
    return jsonify({"error": "Job not found"}), 404

# ── PROFILE ENDPOINTS ─────────────────────────────────────

@app.route("/profile", methods=["GET"])
def get_profile_route():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    user_id = verify_token(token)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401

    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/profiles",
        headers=sb_headers(),
        params={"user_id": f"eq.{user_id}", "select": "*"}
    )
    data = r.json()
    if not data: return jsonify({"error": "No profile found"}), 404
    return jsonify(data[0])


@app.route("/users", methods=["GET"])
def get_users():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    user_id = verify_token(token)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401

    caller = get_profile(user_id)
    if not caller or caller["role"] not in ["admin", "branch_manager"]:
        return jsonify({"error": "Forbidden"}), 403

    params = {"select": "*", "order": "created_at.desc"}

    # Branch managers only see users in their own branch
    if caller["role"] == "branch_manager" and caller.get("branch"):
        params["branch"] = f"eq.{caller['branch']}"

    r = requests.get(f"{SUPABASE_URL}/rest/v1/profiles", headers=sb_headers(), params=params)
    return jsonify(r.json())


@app.route("/create-user", methods=["POST"])
def create_user():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    creator_id = verify_token(token)
    if not creator_id: return jsonify({"error": "Unauthorized"}), 401

    caller = get_profile(creator_id)
    if not caller: return jsonify({"error": "Forbidden"}), 403
    creator_role   = caller["role"]
    creator_name   = caller.get("name", "Unknown")
    creator_branch = caller.get("branch")

    data = request.json or {}
    email    = data.get("email", "").strip()
    password = data.get("password", "").strip()
    name     = data.get("name", "").strip()
    role     = data.get("role", "agent")
    # Admin can assign any branch; BM can only create agents in their own branch
    branch = data.get("branch", "").strip() or None

    if not email or not password or not name:
        return jsonify({"error": "Email, password and name are required"}), 400

    if creator_role == "branch_manager" and role != "agent":
        return jsonify({"error": "Branch managers can only create agents"}), 403
    if role == "branch_manager" and creator_role != "admin":
        return jsonify({"error": "Only admins can create branch managers"}), 403

    # BMs automatically inherit their branch for the new agent
    if creator_role == "branch_manager":
        branch = creator_branch

    # Create user in Supabase Auth
    auth_r = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        },
        json={"email": email, "password": password, "email_confirm": True}
    )
    if not auth_r.ok:
        return jsonify({"error": auth_r.json().get("message", "Failed to create user")}), 400

    new_user_id = auth_r.json()["id"]

    # Create profile with branch
    profile_insert = requests.post(
        f"{SUPABASE_URL}/rest/v1/profiles",
        headers=sb_headers(),
        json={
            "user_id": new_user_id, "role": role, "name": name,
            "created_by": creator_id, "branch": branch
        }
    )
    if not profile_insert.ok:
        return jsonify({"error": "User created but profile failed"}), 500

    # Audit log
    requests.post(
        f"{SUPABASE_URL}/rest/v1/audit_logs",
        headers=sb_headers(),
        json={
            "user_id": creator_id, "user_name": creator_name,
            "action": f"Created {role}",
            "target_type": "user", "target_id": new_user_id,
            "details": {"email": email, "name": name, "role": role, "branch": branch}
        }
    )

    return jsonify({"message": f"{role} created successfully", "user_id": new_user_id})


@app.route("/audit-logs", methods=["GET"])
def get_audit_logs():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    user_id = verify_token(token)
    if not user_id: return jsonify({"error": "Unauthorized"}), 401

    caller = get_profile(user_id)
    if not caller or caller["role"] not in ["admin", "branch_manager"]:
        return jsonify({"error": "Forbidden"}), 403

    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/audit_logs",
        headers=sb_headers(),
        params={"select": "*", "order": "created_at.desc", "limit": "200"}
    )
    return jsonify(r.json())

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
