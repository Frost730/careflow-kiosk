import json
import urllib.request
import urllib.error
import sys
import time

API_URL = "http://127.0.0.1:8000/api/patients"
LOGIN_URL = "http://127.0.0.1:8000/api/admin/login"
LOGOUT_URL = "http://127.0.0.1:8000/api/admin/logout"
STATS_URL = "http://127.0.0.1:8000/api/public/stats"

def make_request(url, method="GET", data=None, token=None):
    req = urllib.request.Request(url, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
        json_data = json.dumps(data).encode("utf-8")
    else:
        json_data = None
        
    if token:
        req.add_header("Authorization", f"Bearer {token}")
        
    try:
        with urllib.request.urlopen(req, data=json_data) as response:
            status_code = response.status
            body = response.read().decode("utf-8")
            return status_code, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, body
    except Exception as e:
        print(f"Error connecting to server: {e}")
        sys.exit(1)

def run_tests():
    print("==================================================")
    print("      RUNNING DOCTOR ROUTING & API VALIDATION     ")
    print("==================================================")

    # Test 1: Try to fetch patients without authentication (should fail with 401)
    print("Test 1: GET /api/patients (No Token Auth check)...", end="")
    status, res = make_request(API_URL)
    if status == 401:
        print(" OK (Correctly blocked with 401)")
    else:
        print(f" FAILED (Status: {status}, Response: {res})")

    # Test 2: Attempt login with invalid credentials (should fail with 401)
    print("Test 2: POST /api/admin/login (Bad Credentials)...", end="")
    bad_login = {
        "email": "admin@careflow.com",
        "password": "wrongpassword"
    }
    status, res = make_request(LOGIN_URL, method="POST", data=bad_login)
    if status == 401:
        print(" OK (Correctly rejected with 401)")
    else:
        print(f" FAILED (Status: {status}, Response: {res})")

    # Test 3: Login with correct credentials (should return token)
    print("Test 3: POST /api/admin/login (Valid Credentials)...", end="")
    good_login = {
        "email": "admin@careflow.com",
        "password": "admin123"
    }
    status, res = make_request(LOGIN_URL, method="POST", data=good_login)
    if status == 200 and "token" in res:
        token = res["token"]
        print(f" OK (Session token received: {token[:8]}...)")
    else:
        print(f" FAILED (Status: {status}, Response: {res})")
        token = None

    # Test 4: Register patient with doctor (should be public, no token required)
    print("Test 4: POST /api/patients (Public patient check-in with doctor)...", end="")
    valid_payload = {
        "name": "Jane Smith",
        "age": 42,
        "gender": "Female",
        "mobile": "9876543210",
        "address": "456 Oak Avenue",
        "department": "Cardiology",
        "doctor": "Dr. Clara Evans" # Added doctor field
    }
    status, res = make_request(API_URL, method="POST", data=valid_payload)
    if status == 201 and "token" in res and res["doctor"] == "Dr. Clara Evans":
        created_id = res["id"]
        created_token = res["token"]
        print(f" OK (Token generated: {created_token}, Doctor assigned: {res['doctor']})")
    else:
        print(f" FAILED (Status: {status}, Response: {res})")
        created_id = None

    # Test 5: Fetch patients with valid token
    if token:
        print("Test 5: GET /api/patients (With Valid Token + Pagination Envelope)...", end="")
        status, res = make_request(API_URL, token=token)
        if status == 200 and "total" in res and "patients" in res and isinstance(res["patients"], list):
            print(f" OK (Total records in DB: {res['total']}, returned size: {len(res['patients'])})")
        else:
            print(f" FAILED (Status: {status}, Response: {res})")
    else:
        print("Test 5: GET /api/patients... SKIPPED")

    # Test 6: Fetch specific patient by ID with token
    if token and created_id:
        print(f"Test 6: GET /api/patients/{created_id} (Fetch by ID with token)...", end="")
        status, res = make_request(f"{API_URL}/{created_id}", token=token)
        if status == 200 and res["doctor"] == "Dr. Clara Evans":
            print(" OK")
        else:
            print(f" FAILED (Status: {status}, Response: {res})")
    else:
        print("Test 6: Fetch by ID with token... SKIPPED")

    # Test 7: Filter patients by doctor query (should only return Dr. Clara Evans assignments)
    if token:
        print("Test 7: GET /api/patients?doctor=Dr.+Clara+Evans (Doctor filter check)...", end="")
        status, res = make_request(f"{API_URL}?doctor=Dr.+Clara+Evans", token=token)
        if status == 200 and len(res["patients"]) >= 1 and all(p["doctor"] == "Dr. Clara Evans" for p in res["patients"]):
            print(f" OK (Verified all {len(res['patients'])} matched doctor name)")
        else:
            print(f" FAILED (Status: {status}, Response: {res})")
    else:
        print("Test 7: GET /api/patients?doctor=Dr.+Clara+Evans... SKIPPED")

    # Test 8: Logout (should invalidate token)
    if token:
        print("Test 8: POST /api/admin/logout (Log out session)...", end="")
        status, res = make_request(LOGOUT_URL, method="POST", token=token)
        if status == 200:
            print(" OK (Session closed)")
        else:
            print(f" FAILED (Status: {status}, Response: {res})")
    else:
        print("Test 8: POST /api/admin/logout (Log out session)... SKIPPED")

    # Test 9: Verify logged-out token is rejected
    if token:
        print("Test 9: GET /api/patients (Using invalidated token)...", end="")
        status, res = make_request(API_URL, token=token)
        if status == 401:
            print(" OK (Correctly blocked with 401 after logout)")
        else:
            print(f" FAILED (Status: {status}, Response: {res})")
    else:
        print("Test 9: Verify invalidated token... SKIPPED")

    print("==================================================")
    print("         DOCTOR ROUTING TESTS COMPLETE           ")
    print("==================================================")

if __name__ == "__main__":
    time.sleep(1)
    run_tests()
