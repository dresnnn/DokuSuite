import os
import json
import urllib.parse
import urllib.request
from typing import Any

try:
    from redis import Redis
except Exception:  # pragma: no cover - redis optional
    Redis = None


class GeocodingService:
    """Reverse geocode coordinates using Google API with simple caching."""

    def __init__(self, api_key: str | None = None, cache: Any | None = None, ttl: int = 86400):
        self.api_key = api_key or os.getenv("GOOGLE_MAPS_API_KEY", "")
        self.ttl = ttl
        if cache is not None:
            self.cache = cache
        else:
            redis_url = os.getenv("REDIS_URL")
            if Redis is not None and redis_url:
                try:
                    self.cache = Redis.from_url(redis_url)
                except Exception:  # pragma: no cover - redis misconfigured
                    self.cache = {}
            else:
                self.cache = {}

    def _cache_get(self, key: str) -> str | None:
        if isinstance(self.cache, dict):
            return self.cache.get(key)
        val = self.cache.get(key)
        if val:
            return val.decode() if isinstance(val, bytes) else val
        return None

    def _cache_set(self, key: str, value: str) -> None:
        if isinstance(self.cache, dict):
            self.cache[key] = value
        else:
            self.cache.set(key, value, ex=self.ttl)

    def reverse_geocode(self, lat: float, lon: float) -> str | None:
        key = f"{lat},{lon}"
        cached = self._cache_get(key)
        if cached:
            return cached
        if not self.api_key:
            return None
        params = urllib.parse.urlencode({"latlng": key, "key": self.api_key})
        url = f"https://maps.googleapis.com/maps/api/geocode/json?{params}"
        with urllib.request.urlopen(url) as resp:  # pragma: no cover - network
            data = json.load(resp)
        address = data.get("results", [{}])[0].get("formatted_address")
        if address:
            self._cache_set(key, address)
        return address
