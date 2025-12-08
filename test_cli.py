#!/usr/bin/env python3
"""
Test Predator CLI in Bot
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ua-sources'))

from app.services.telegram_assistant import init_assistant

async def test_cli():
    bot = init_assistant('FAKE_TOKEN')
    
    print("Testing 'predator add provider --name=Groq' (without key)...")
    result = await bot._cmd_predator_cli("add provider --name=Groq")
    print(result)
    
    print("\nTesting 'predator status'...")
    result2 = await bot._cmd_predator_cli("status")
    print(result2)

asyncio.run(test_cli())
