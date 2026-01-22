"""
Authentication Utilities
========================

This module provides authentication and security utilities for the
TonyPi monitoring system, including:

1. Password Hashing: Secure storage of user passwords using bcrypt
2. Password Verification: Safe comparison of passwords
3. JWT Token Creation: Generate access tokens for authenticated sessions
4. JWT Token Decoding: Validate and extract data from tokens

Security Best Practices Implemented:
- Passwords are NEVER stored in plain text
- Bcrypt is used with random salts (protection against rainbow tables)
- JWTs have expiration times (protection against stolen tokens)
- Secret key should be changed in production

Dependencies:
- bcrypt: Industry-standard password hashing
- python-jose: JWT encoding/decoding
"""

# ============================================================================
# IMPORTS
# ============================================================================

# bcrypt: A password hashing library designed for security
# - Automatically generates random salts
# - Intentionally slow to prevent brute-force attacks
# - Used by major companies for password storage
import bcrypt

# datetime and timedelta: For handling JWT expiration times
from datetime import datetime, timedelta

# typing: Type hints for better code documentation
from typing import Optional

# jose: JavaScript Object Signing and Encryption library
# - jwt: JSON Web Token encoding/decoding
# - JWTError: Exception for invalid tokens
from jose import JWTError, jwt

# os: For reading environment variables
import os

# ============================================================================
# JWT CONFIGURATION
# ============================================================================

# SECRET_KEY: The secret used to sign JWT tokens
# IMPORTANT: In production, this MUST be changed to a secure random string!
# - Should be at least 32 characters of random data
# - Should be stored in environment variables, not in code
# - If this key is compromised, all tokens can be forged
#
# Generate a secure key: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tonypi-secret-key-change-in-production")

# ALGORITHM: The cryptographic algorithm used for JWT signatures
# HS256 = HMAC with SHA-256
# - Symmetric algorithm (same key for signing and verification)
# - Fast and widely supported
# - Suitable for single-server applications
ALGORITHM = "HS256"

# ACCESS_TOKEN_EXPIRE_HOURS: How long tokens are valid
# After this time, users must log in again
# Balance between security (shorter) and convenience (longer)
# 8 hours is typical for a workday session
ACCESS_TOKEN_EXPIRE_HOURS = 8


# ============================================================================
# PASSWORD FUNCTIONS
# ============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.
    
    This function is used during login to check if the entered
    password matches the stored hash.
    
    How it works:
    1. Extract the salt from the hashed password
    2. Hash the plain password with the same salt
    3. Compare the two hashes (timing-safe comparison)
    
    Args:
        plain_password (str): The password entered by the user
        hashed_password (str): The hash stored in the database
        
    Returns:
        bool: True if the password matches, False otherwise
        
    Example:
        >>> hashed = get_password_hash("mypassword")
        >>> verify_password("mypassword", hashed)
        True
        >>> verify_password("wrongpassword", hashed)
        False
    
    Security Notes:
        - bcrypt.checkpw does a constant-time comparison
        - This prevents timing attacks where attackers measure
          response time to guess passwords
    """
    # Convert strings to bytes (bcrypt works with bytes)
    # encode('utf-8') converts string to bytes using UTF-8 encoding
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),   # Password to verify
        hashed_password.encode('utf-8')   # Stored hash to check against
    )


def get_password_hash(password: str) -> str:
    """
    Hash a password for secure storage.
    
    This function is used during user registration or password change
    to create a hash that can be safely stored in the database.
    
    How it works:
    1. Generate a random salt (unique for each password)
    2. Combine password with salt and hash using bcrypt algorithm
    3. Return the hash (which includes the salt)
    
    Args:
        password (str): The plain text password to hash
        
    Returns:
        str: The bcrypt hash (60 characters, includes salt)
        
    Example:
        >>> hash1 = get_password_hash("mypassword")
        >>> hash2 = get_password_hash("mypassword")
        >>> hash1 == hash2  # Different salts = different hashes
        False
        >>> verify_password("mypassword", hash1)
        True
        
    Security Notes:
        - bcrypt.gensalt() generates a random 22-character salt
        - The default work factor (cost) is 12 rounds
        - Higher work factor = more secure but slower
        - The resulting hash includes the algorithm, cost, and salt
          so it's self-contained for verification
    """
    # Generate a random salt
    # Salt ensures that identical passwords have different hashes
    salt = bcrypt.gensalt()
    
    # Hash the password with the salt
    # Returns bytes, so we decode to string for database storage
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


# ============================================================================
# JWT TOKEN FUNCTIONS
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token.
    
    JWTs (JSON Web Tokens) are used for stateless authentication.
    The token contains encoded data and a signature that proves
    it was issued by this server.
    
    Token structure:
    - Header: Algorithm and token type
    - Payload: User data and expiration time
    - Signature: Cryptographic signature to verify authenticity
    
    Args:
        data (dict): Data to encode in the token
            Typically includes:
            - sub: Subject (username)
            - role: User role for authorization
        expires_delta (timedelta, optional): Custom expiration time
            If not provided, uses ACCESS_TOKEN_EXPIRE_HOURS
            
    Returns:
        str: The encoded JWT token
        
    Example:
        >>> token = create_access_token({"sub": "admin", "role": "admin"})
        >>> # Token looks like: "eyJhbGciOiJIUzI1NiIs..."
        
    Security Notes:
        - Tokens are signed but NOT encrypted
        - Don't put sensitive data in tokens (anyone can decode the payload)
        - Expiration time prevents stolen tokens from being used forever
    """
    # Make a copy so we don't modify the original dict
    to_encode = data.copy()
    
    # Calculate expiration time
    if expires_delta:
        # Use custom expiration if provided
        expire = datetime.utcnow() + expires_delta
    else:
        # Use default expiration time
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    # Add expiration to the payload
    # "exp" is a standard JWT claim that libraries automatically check
    to_encode.update({"exp": expire})
    
    # Encode and sign the token
    # jwt.encode creates the three-part token: header.payload.signature
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT token.
    
    This function:
    1. Verifies the signature (proves token came from us)
    2. Checks expiration time (rejects expired tokens)
    3. Extracts the payload data
    
    Args:
        token (str): The JWT token to decode
        
    Returns:
        dict: The decoded payload if valid
        None: If the token is invalid, expired, or tampered with
        
    Example:
        >>> token = create_access_token({"sub": "admin", "role": "admin"})
        >>> payload = decode_access_token(token)
        >>> payload["sub"]
        "admin"
        >>> decode_access_token("invalid.token.here")
        None
        
    Common reasons for returning None:
        - Token signature doesn't match (tampered or wrong key)
        - Token has expired
        - Token format is invalid
        - Token was issued with a different algorithm
    """
    try:
        # Decode and verify the token
        # jwt.decode will raise JWTError if:
        # - Signature is invalid
        # - Token has expired
        # - Token format is wrong
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # Token is invalid - return None instead of raising
        # This makes it easier for calling code to handle
        return None
