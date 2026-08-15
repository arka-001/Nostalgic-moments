import re
import time
from typing import Dict, Any, Optional
from fastapi import Request
import httpx

# In-memory GeoIP cache: {ip_address: {"data": dict, "cached_at": float}}
_GEOIP_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 86400  # 24 hours TTL per IP


def is_private_ip(ip: str) -> bool:
    """Check if an IP address is a private, loopback, or local address."""
    if not ip or ip in ("127.0.0.1", "::1", "localhost", "0.0.0.0"):
        return True
    if ip.startswith(("10.", "192.168.", "169.254.")):
        return True
    if ip.startswith("172."):
        parts = ip.split(".")
        if len(parts) >= 2 and parts[1].isdigit():
            val = int(parts[1])
            if 16 <= val <= 31:
                return True
    return False


def extract_client_ip(request: Request) -> str:
    """
    Extract the real client IP address from proxy and forwarding headers.
    Supports Cloudflare, AWS/ngrok X-Forwarded-For, and direct connections.
    """
    # 1. Cloudflare header
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()

    # 2. X-Forwarded-For (may contain comma-separated chain: client, proxy1, proxy2)
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        parts = [p.strip() for p in x_forwarded_for.split(",") if p.strip()]
        for p in parts:
            ip = p.split(":")[0]  # Remove port if present
            if not is_private_ip(ip):
                return ip
        if parts:
            return parts[0].split(":")[0]

    # 3. X-Real-IP
    x_real_ip = request.headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip.strip().split(":")[0]

    # 4. Fallback to direct client host
    if request.client and request.client.host:
        return request.client.host.split(":")[0]

    return "127.0.0.1"


def parse_user_agent(ua_string: Optional[str]) -> Dict[str, str]:
    """Parse User-Agent string to extract device category, browser, and OS."""
    if not ua_string:
        return {"device": "Desktop", "browser": "Chrome", "os": "Windows"}

    ua = ua_string.lower()

    # 1. Device detection
    if "ipad" in ua or "tablet" in ua or "playbook" in ua:
        device = "Tablet"
    elif "mobile" in ua or "iphone" in ua or "android" in ua or "ipod" in ua:
        device = "Mobile"
    else:
        device = "Desktop"

    # 2. OS detection
    if "iphone" in ua or "ipad" in ua or "ipod" in ua or "ios" in ua:
        os = "iOS"
    elif "android" in ua:
        os = "Android"
    elif "windows" in ua:
        os = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os = "macOS"
    elif "cros" in ua:
        os = "ChromeOS"
    elif "linux" in ua:
        os = "Linux"
    elif "cros" in ua:
        os = "ChromeOS"
    else:
        os = "Other"

    # 3. Browser detection
    if "edg" in ua or "edge" in ua:
        browser = "Edge"
    elif "opr" in ua or "opera" in ua:
        browser = "Opera"
    elif "chrome" in ua and "chromium" not in ua and "edg" not in ua:
        browser = "Chrome"
    elif "safari" in ua and "chrome" not in ua:
        browser = "Safari"
    elif "firefox" in ua:
        browser = "Firefox"
    else:
        browser = "Browser"

    return {"device": device, "browser": browser, "os": os}


async def resolve_geoip(ip_address: str) -> Dict[str, Any]:
    """
    Resolve IP address to Geographic location data (Country, City, Region, ISP, Lat/Lon).
    Uses high-speed in-memory caching and safe fallbacks for local/private IPs.
    """
    clean_ip = (ip_address or "127.0.0.1").strip()

    # 1. Check in-memory cache
    cached = _GEOIP_CACHE.get(clean_ip)
    now = time.time()
    if cached and (now - cached["cached_at"]) < CACHE_TTL_SECONDS:
        return cached["data"]

    # 2. Handle private / local development IPs
    if is_private_ip(clean_ip):
        mock_data = {
            "ip": clean_ip,
            "country": "India",
            "country_code": "IN",
            "city": "Kolkata",
            "region": "West Bengal",
            "latitude": 22.5726,
            "longitude": 88.3639,
            "isp": "Local Development / Broadband",
        }
        _GEOIP_CACHE[clean_ip] = {"data": mock_data, "cached_at": now}
        return mock_data

    # 3. Fetch from fast public GeoIP API (ip-api.com)
    url = f"http://ip-api.com/json/{clean_ip}?fields=status,message,country,countryCode,regionName,city,lat,lon,isp,org"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "success":
                    result = {
                        "ip": clean_ip,
                        "country": data.get("country") or "Unknown",
                        "country_code": data.get("countryCode") or "UN",
                        "city": data.get("city") or "Unknown",
                        "region": data.get("regionName") or "Unknown",
                        "latitude": float(data.get("lat") or 0.0),
                        "longitude": float(data.get("lon") or 0.0),
                        "isp": data.get("isp") or data.get("org") or "Internet Service Provider",
                    }
                    _GEOIP_CACHE[clean_ip] = {"data": result, "cached_at": now}
                    return result
    except Exception as e:
        # Fallback gracefully without throwing
        pass

    fallback_data = {
        "ip": clean_ip,
        "country": "Unknown",
        "country_code": "UN",
        "city": "Unknown",
        "region": "Unknown",
        "latitude": None,
        "longitude": None,
        "isp": "Unknown ISP",
    }
    _GEOIP_CACHE[clean_ip] = {"data": fallback_data, "cached_at": now}
    return fallback_data
