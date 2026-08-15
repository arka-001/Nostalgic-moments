import base64
import hashlib
from typing import Optional
from cryptography.fernet import Fernet

from app.core.config import settings


def _get_fernet() -> Fernet:
    """Derive a valid 32-byte Fernet encryption key from settings."""
    raw_key = settings.YOUTUBE_API_ENCRYPTION_KEY.encode("utf-8")
    # Generate SHA-256 digest and base64-encode to produce valid 32-byte Fernet key
    digest = hashlib.sha256(raw_key).digest()
    fernet_key = base64.urlsafe_b64encode(digest)
    return Fernet(fernet_key)


def encrypt_value(plain_text: Optional[str]) -> Optional[str]:
    """Encrypt plaintext string using AES/Fernet."""
    if not plain_text:
        return None
    f = _get_fernet()
    encrypted_bytes = f.encrypt(plain_text.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")


def decrypt_value(cipher_text: Optional[str]) -> Optional[str]:
    """Decrypt ciphertext string. Returns None if decryption fails or cipher is empty."""
    if not cipher_text:
        return None
    try:
        f = _get_fernet()
        decrypted_bytes = f.decrypt(cipher_text.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except Exception:
        return None


def mask_api_key(api_key: Optional[str]) -> str:
    """Mask the API key for safe UI display (e.g. AIza••••••••••••••••••••••201bE)."""
    if not api_key:
        return "Not Configured"
    cleaned = api_key.strip()
    if len(cleaned) <= 8:
        return "••••••••"
    prefix = cleaned[:4]
    suffix = cleaned[-4:]
    masked_middle = "•" * max(8, len(cleaned) - 8)
    return f"{prefix}{masked_middle}{suffix}"
