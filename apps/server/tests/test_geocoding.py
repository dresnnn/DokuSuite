import io
import json
import urllib.request

from app.services.geocoding import GeocodingService


class _FakeResp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        pass


def test_reverse_geocode_uses_cache(monkeypatch):
    calls = {"n": 0}

    def fake_urlopen(url):
        calls["n"] += 1
        data = {"results": [{"formatted_address": "Stub Address"}]}
        return _FakeResp(json.dumps(data).encode())

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    cache: dict[str, str] = {}
    svc = GeocodingService(api_key="k", cache=cache)

    addr1 = svc.reverse_geocode(1.0, 2.0)
    assert addr1 == "Stub Address"
    assert calls["n"] == 1

    addr2 = svc.reverse_geocode(1.0, 2.0)
    assert addr2 == "Stub Address"
    assert calls["n"] == 1
