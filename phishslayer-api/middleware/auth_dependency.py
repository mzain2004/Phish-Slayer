
import os
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from middleware.clerk_auth import verify_clerk_jwt

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    FastAPI dependency to validate Clerk JWT.
    If CLERK_SECRET_KEY is missing, returns a mock user for development.
    """
    clerk_secret = os.getenv("CLERK_SECRET_KEY")
    if not clerk_secret:
        # Development mode fallback
        return {
            "user_id": "dev-user-001",
            "org_id": "default-org"
        }
    
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    token = credentials.credentials
    
    try:
        user_info = await verify_clerk_jwt(token)
        return user_info
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
