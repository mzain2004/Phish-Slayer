
import os
import httpx
import jwt
import time
import logging
from fastapi import HTTPException, status
from typing import Optional, Dict

class ClerkAuthenticator:
    """
    Validates Clerk JWT tokens using JWKS.
    Caches JWKS for 1 hour.
    """
    
    def __init__(self):
        self.jwks_url = "https://api.clerk.dev/v1/jwks"
        self.cached_jwks = None
        self.last_fetch = 0
        self.cache_ttl = 3600 # 1 hour

    async def get_jwks(self):
        now = time.time()
        if not self.cached_jwks or (now - self.last_fetch) > self.cache_ttl:
            clerk_secret = os.getenv("CLERK_SECRET_KEY")
            headers = {}
            if clerk_secret:
                headers["Authorization"] = f"Bearer {clerk_secret}"
            
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(self.jwks_url, headers=headers)
                    response.raise_for_status()
                    self.cached_jwks = response.json()
                    self.last_fetch = now
            except Exception as e:
                logging.error(f"Failed to fetch Clerk JWKS: {e}")
                if self.cached_jwks:
                    return self.cached_jwks
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Authentication service unavailable"
                )
        return self.cached_jwks

    async def verify_token(self, token: str) -> Dict:
        try:
            jwks = await self.get_jwks()
            
            # Extract kid from header
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            
            if not kid:
                raise HTTPException(status_code=401, detail="Invalid token header")

            # Find matching key
            public_key = None
            for key in jwks.get("keys", []):
                if key["kid"] == kid:
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                    break
            
            if not public_key:
                raise HTTPException(status_code=401, detail="Invalid token signature key")

            # Verify JWT
            # Note: Clerk tokens usually have 'azp' or 'iss' claims. 
            # We don't verify 'aud' here as it varies.
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={"verify_aud": False}
            )
            
            return {
                "user_id": payload.get("sub"),
                "org_id": payload.get("org_id", "default"),
                "raw_claims": payload
            }
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"JWT verification error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")

authenticator = ClerkAuthenticator()

async def verify_clerk_jwt(token: str) -> Dict:
    return await authenticator.verify_token(token)
