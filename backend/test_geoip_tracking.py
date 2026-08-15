import asyncio
from fastapi import Request
from app.services.geoip import extract_client_ip, parse_user_agent, resolve_geoip, is_private_ip


def test_ip_helpers():
    print("Testing IP helpers...")
    assert is_private_ip("127.0.0.1") is True
    assert is_private_ip("192.168.1.10") is True
    assert is_private_ip("10.0.0.1") is True
    assert is_private_ip("8.8.8.8") is False
    assert is_private_ip("103.21.244.0") is False
    print("[OK] is_private_ip passed")


def test_ua_parser():
    print("Testing User-Agent parser...")
    ua_chrome_win = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    parsed_win = parse_user_agent(ua_chrome_win)
    assert parsed_win["device"] == "Desktop"
    assert parsed_win["os"] == "Windows"
    assert parsed_win["browser"] == "Chrome"

    ua_iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    parsed_iphone = parse_user_agent(ua_iphone)
    assert parsed_iphone["device"] == "Mobile"
    assert parsed_iphone["os"] == "iOS"
    assert parsed_iphone["browser"] == "Safari"
    print("[OK] User-Agent parser passed")


async def test_geoip_resolution():
    print("Testing GeoIP resolution...")
    local_geo = await resolve_geoip("127.0.0.1")
    assert local_geo["country"] == "India"
    assert local_geo["city"] == "Kolkata"

    # Public IP lookup (Google DNS as sample)
    pub_geo = await resolve_geoip("8.8.8.8")
    assert pub_geo["ip"] == "8.8.8.8"
    assert pub_geo["country"] != "Unknown"
    print(f"[OK] GeoIP resolved 8.8.8.8 to: {pub_geo['city']}, {pub_geo['country']} ({pub_geo['isp']})")


async def main():
    test_ip_helpers()
    test_ua_parser()
    await test_geoip_resolution()
    print("\nALL GEOIP & IP TRACKING TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(main())
