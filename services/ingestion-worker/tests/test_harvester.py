import pytest
from unittest.mock import AsyncMock, patch

from app.core.harvester import Harvester

@pytest.mark.asyncio
async def test_harvest_datagov():
    producer_mock = AsyncMock()
    harvester = Harvester(producer=producer_mock)
    
    await harvester._harvest_datagov()
    
    # Check if producer.send_and_wait was called
    producer_mock.send_and_wait.assert_called_once()
    
    # Verify the topic
    args, kwargs = producer_mock.send_and_wait.call_args
    assert "edr" in kwargs["topic"]
    
@pytest.mark.asyncio
async def test_harvest_prozorro():
    producer_mock = AsyncMock()
    harvester = Harvester(producer=producer_mock)
    
    await harvester._harvest_prozorro()
    
    # Check if producer.send_and_wait was called
    producer_mock.send_and_wait.assert_called_once()

@pytest.mark.asyncio
async def test_harvest_opendatabot():
    producer_mock = AsyncMock()
    harvester = Harvester(producer=producer_mock)
    
    await harvester._harvest_opendatabot()
    
    producer_mock.send_and_wait.assert_called_once()
    args, kwargs = producer_mock.send_and_wait.call_args
    assert "opendatabot" in kwargs["topic"]

@pytest.mark.asyncio
async def test_harvest_youcontrol():
    producer_mock = AsyncMock()
    harvester = Harvester(producer=producer_mock)
    
    await harvester._harvest_youcontrol()
    
    producer_mock.send_and_wait.assert_called_once()
    args, kwargs = producer_mock.send_and_wait.call_args
    assert "youcontrol" in kwargs["topic"]
