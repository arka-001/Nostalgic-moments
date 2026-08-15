import asyncio
import uuid
from app.core.encryption import encrypt_value, decrypt_value, mask_api_key
from app.services.youtube import extract_playlist_id, parse_iso8601_duration, test_youtube_api_connection


def test_encryption():
    key = "AIzaSyD_TestFakeKey_1234567890abcdef"
    enc = encrypt_value(key)
    assert enc is not None and enc != key, "Encryption failed"
    dec = decrypt_value(enc)
    assert dec == key, f"Decryption failed: expected {key}, got {dec}"
    masked = mask_api_key(key)
    assert masked.startswith("AIza") and masked.endswith("cdef") and "•" in masked, f"Masking incorrect: {masked}"
    print("[PASS] Encryption, Decryption, and Masking tests passed")


def test_url_extraction():
    urls = [
        ("https://www.youtube.com/playlist?list=PLrEnWoR732-DNQnp1kHbiXf_d_rBfP1dZ", "PLrEnWoR732-DNQnp1kHbiXf_d_rBfP1dZ"),
        ("https://music.youtube.com/playlist?list=PLxyz12345", "PLxyz12345"),
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc98765", "PLabc98765"),
        ("PLdirectId1234567890", "PLdirectId1234567890"),
        ("  PLwithWhitespace123  ", "PLwithWhitespace123"),
    ]
    for url, expected in urls:
        extracted = extract_playlist_id(url)
        assert extracted == expected, f"Failed extracting {url}: got {extracted}, expected {expected}"
    print("[PASS] YouTube Playlist URL extraction tests passed")


def test_duration_parsing():
    cases = [
        ("PT3M45S", 225.0),
        ("PT1H2M10S", 3730.0),
        ("PT52S", 52.0),
        ("PT4M", 240.0),
        ("PT1H", 3600.0),
        (None, 0.0),
        ("", 0.0),
    ]
    for d_str, expected in cases:
        parsed = parse_iso8601_duration(d_str)
        assert parsed == expected, f"Failed duration {d_str}: got {parsed}, expected {expected}"
    print("[PASS] ISO 8601 Duration parsing tests passed")


async def test_fake_api_connection():
    success, msg = await test_youtube_api_connection("AIzaFAKE_NOSTALGIC_MOMENTS_TEST_KEY_123456789")
    assert not success, "Fake key should fail"
    assert "AIzaFAKE_NOSTALGIC_MOMENTS_TEST_KEY_123456789" not in msg, "Key must not be reflected in message"
    print(f"[PASS] Fake API test handled cleanly without key exposure: {msg}")


async def main():
    print("Running backend unit tests for YouTube Integration...")
    test_encryption()
    test_url_extraction()
    test_duration_parsing()
    await test_fake_api_connection()
    print("ALL TESTS PASSED!")


if __name__ == "__main__":
    asyncio.run(main())
