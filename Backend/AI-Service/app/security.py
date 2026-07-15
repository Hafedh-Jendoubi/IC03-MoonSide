"""
JWT verification for the AI-Service.

Moonside Connect's User-Service issues HMAC-SHA JWTs whose secret key is
base64-encoded (see Post-Service's JwtService: `Decoders.BASE64.decode(secretKey)`
+ `Keys.hmacShaKeyFor(...)`). We mirror that exact decoding here so a token
minted by User-Service verifies correctly against this service too.

Note: `Keys.hmacShaKeyFor()` picks the HMAC variant based on the decoded key's
byte length, not a hardcoded HS256 — with the platform's default 64-char
secret that decodes to 48 bytes, jjwt signs with HS384. Verification here
must accept whatever algorithm the key length implies (HS256/HS384/HS512).

Claims used elsewhere in the platform (see Post-Service's JwtService):
  - sub    -> username
  - userId -> Mongo user id
  - roles  -> list[str]
"""

import base64
import binascii

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

_bearer_scheme = HTTPBearer(auto_error=False)


def _signing_key() -> bytes:
    try:
        return base64.b64decode(settings.jwt_secret)
    except (binascii.Error, ValueError):
        # Fall back to raw bytes if the configured secret isn't valid base64.
        return settings.jwt_secret.encode("utf-8")


class CurrentUser:
    def __init__(self, user_id: str, username: str | None, roles: list[str] | None):
        self.user_id = user_id
        self.username = username
        self.roles = roles or []


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> CurrentUser:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = credentials.credentials
    try:
        # NOTE: jjwt's Keys.hmacShaKeyFor() auto-picks the HMAC algorithm based on the
        # decoded key length (48 bytes -> HS384 here), not a fixed HS256. Accept the
        # full HMAC family so this stays correct even if the shared secret changes length.
        payload = jwt.decode(token, _signing_key(), algorithms=["HS256", "HS384", "HS512"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("userId") or payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing user id")

    return CurrentUser(user_id=user_id, username=payload.get("sub"), roles=payload.get("roles"))
