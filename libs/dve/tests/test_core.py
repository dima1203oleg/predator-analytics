import asyncio
import json
import os
from libs.dve.core import DeploymentVerifier


def test_check_docker_containers(monkeypatch):
    # Mock subprocess output
    def mock_check_output(cmd, text=True):
        return "dve_container\nother_container"
    monkeypatch.setattr('subprocess.check_output', mock_check_output)
    os.environ['DVE_EXPECTED_CONTAINERS'] = 'dve_container,missing_container'
    verifier = DeploymentVerifier()
    verifier.check_docker_containers()
    result = verifier.results['containers']
    assert result['missing'] == ['missing_container']
    assert result['status'] == 'error'


def test_check_api_endpoints(monkeypatch):
    # Mock httpx.get
    class MockResponse:
        def __init__(self, status_code=200):
            self.status_code = status_code
            self.is_success = (200 <= status_code < 300)
    def mock_get(url, timeout=None):
        return MockResponse()
    monkeypatch.setattr('httpx.get', mock_get)
    os.environ['API_BASE_URL'] = 'http://localhost:8000'
    os.environ['DVE_API_ENDPOINTS'] = '["/health"]'
    verifier = DeploymentVerifier()
    verifier.check_api_endpoints()
    result = verifier.results['api']['/health']
    assert result['status_code'] == 200
    assert result['ok'] is True


def test_generate_report():
    verifier = DeploymentVerifier()
    verifier.results = {"mock": {"key": "value"}}
    report = verifier.generate_report()
    parsed = json.loads(report)
    assert parsed == verifier.results
