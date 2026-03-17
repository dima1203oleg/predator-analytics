import pytest
import sys
sys.path.append('/Users/dima-mac/Documents/Predator_21')
sys.path.append('/Users/dima-mac/Documents/Predator_21')
sys.path.append('/Users/dima-mac/Documents/Predator_21/libs/predator-common')
sys.path.append('/Users/dima-mac/Documents/Predator_21/libs/predator-common')
sys.path.append('/Users/dima-mac/Documents/Predator_21/libs/predator-common')
sys.path.append('/Users/dima-mac/Documents/Predator_21/libs/predator-common')
from fastapi.testclient import TestClient
from app.main import app  
from predator_common import logging  # Замінений імпорт
from predator_common.logging import get_logger
from predator_common import logging as predator_logging
from predator_common import logging as predator_logging
try:
    from transformers import pipeline
except ImportError:
    pytest.skip('transformers not installed, skip test')

import sys
sys.path.append('/Users/dima-mac/Documents/Predator_21/libs/predator-common')
from predator_common.logging import get_logger

import sys
sys.path.append('/Users/dima-mac/Documents/Predator_21/libs/predator-common')
from predator_common.logging import get_logger

import sys
sys.path.append('/Users/dima-mac/Documents/Predator_21/libs/predator-common')
from predator_common import logging as predator_logging

import sys
sys.path.append('/Users/dima-mac/Documents/Predator_21/libs/predator-common')
from predator_common import predator_common

import sys
sys.path.append('/Users/dima-mac/Documents/Predator_21/libs/predator-common')
from predator_common.logging import get_logger

client = TestClient(app)

@pytest.mark.asyncio
async def test_login_flow():
    response = client.post('/api/v1/auth/login', json={'username': 'test', 'password': 'test'})
    assert response.status_code == 200, 'Login failed'

@pytest.mark.asyncio
async def test_data_display():
    response = client.get('/api/v1/data')
    assert response.status_code == 200, 'Data endpoint failed'
    assert 'data' in response.json(), 'Data not found in response'

# Додати більше тестів для інших ендпоінтів, як потрібно
