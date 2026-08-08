"""Unit tests for app.security (JWT verification)."""
import base64

import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.security import CurrentUser, get_current_user
from tests.conftest import TEST_JWT_SECRET, make_token


def _creds(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


class TestCurrentUser:
    def test_defaults_roles_to_empty_list_when_none(self):
        user = CurrentUser(user_id="u1", username="jdoe", roles=None)
        assert user.roles == []

    def test_stores_given_fields(self):
        user = CurrentUser(user_id="u1", username="jdoe", roles=["ADMIN"])
        assert user.user_id == "u1"
        assert user.username == "jdoe"
        assert user.roles == ["ADMIN"]


class TestGetCurrentUser:
    def test_missing_credentials_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=None)
        assert exc_info.value.status_code == 401
        assert "Missing or invalid" in exc_info.value.detail

    def test_empty_token_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=_creds(""))
        assert exc_info.value.status_code == 401

    def test_valid_hs384_token_is_accepted(self):
        token = make_token(userId="user-42", sub="alice", roles=["ADMIN", "EMPLOYEE"])
        user = get_current_user(credentials=_creds(token))
        assert user.user_id == "user-42"
        assert user.username == "alice"
        assert user.roles == ["ADMIN", "EMPLOYEE"]

    def test_falls_back_to_sub_when_userid_missing(self):
        token = make_token(userId=None, sub="bob")
        # jwt lib will still include userId=None in the payload; get_current_user
        # should fall back to `sub` since `userId` is falsy.
        user = get_current_user(credentials=_creds(token))
        assert user.user_id == "bob"

    def test_missing_both_sub_and_userid_raises_401(self):
        key = base64.b64decode(TEST_JWT_SECRET)
        token = jwt.encode({"roles": ["EMPLOYEE"]}, key, algorithm="HS384")
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=_creds(token))
        assert exc_info.value.status_code == 401
        assert "missing user id" in exc_info.value.detail.lower()

    def test_expired_token_raises_401(self):
        key = base64.b64decode(TEST_JWT_SECRET)
        token = jwt.encode(
            {"sub": "jdoe", "userId": "user-1", "exp": 1},  # epoch 1 -> long expired
            key,
            algorithm="HS384",
        )
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=_creds(token))
        assert exc_info.value.status_code == 401
        assert "expired" in exc_info.value.detail.lower()

    def test_garbage_token_raises_401_invalid_token(self):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=_creds("not-a-real-jwt"))
        assert exc_info.value.status_code == 401
        assert "invalid token" in exc_info.value.detail.lower()

    def test_token_signed_with_wrong_key_is_rejected(self):
        wrong_key = base64.b64encode(b"a-completely-different-secret-key").decode()
        token = make_token(secret_b64=wrong_key)
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(credentials=_creds(token))
        assert exc_info.value.status_code == 401

    def test_accepts_hs256_signed_tokens_too(self):
        # Same signing key, but a shorter one so jjwt/py-jwt would choose HS256;
        # get_current_user must accept the whole HMAC family, not just HS384.
        short_secret = base64.b64encode(b"short-hs256-key").decode()
        key = base64.b64decode(short_secret)
        token = jwt.encode({"sub": "jdoe", "userId": "user-7"}, key, algorithm="HS256")

        from app.config import settings as app_settings

        old_secret = app_settings.jwt_secret
        app_settings.jwt_secret = short_secret
        try:
            user = get_current_user(credentials=_creds(token))
            assert user.user_id == "user-7"
        finally:
            app_settings.jwt_secret = old_secret

    def test_non_base64_secret_falls_back_to_raw_bytes(self):
        """`_signing_key` should tolerate a plain (non-base64) secret."""
        from app.config import settings as app_settings
        from app.security import _signing_key

        old_secret = app_settings.jwt_secret
        # "!!!not-base64!!!" contains characters invalid in standard base64.
        app_settings.jwt_secret = "!!!not-base64!!!"
        try:
            key = _signing_key()
            assert key == b"!!!not-base64!!!"
        finally:
            app_settings.jwt_secret = old_secret
