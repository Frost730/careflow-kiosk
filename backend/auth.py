import hashlib
import os
import secrets

def hash_password(password: str) -> str:
    """
    Generates a secure PBKDF2 hash of a password using standard hashlib.
    Returns: salt_hex:hash_hex
    """
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac(
        "sha256", 
        password.encode("utf-8"), 
        salt, 
        100000  # Number of iterations
    )
    return f"{salt.hex()}:{key.hex()}"

def verify_password(stored_password: str, provided_password: str) -> bool:
    """
    Verifies a password against the stored salt:hash combination.
    """
    try:
        salt_hex, key_hex = stored_password.split(":")
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        
        # Re-hash provided password
        new_key = hashlib.pbkdf2_hmac(
            "sha256", 
            provided_password.encode("utf-8"), 
            salt, 
            100000
        )
        return secrets.compare_digest(key, new_key)
    except Exception:
        return False

def generate_session_token() -> str:
    """
    Generates a secure cryptographically random hex session token.
    """
    return secrets.token_hex(24)
