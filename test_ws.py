import asyncio
import websockets

async def test_ws():
    uri = "ws://194.177.1.240:8000/ws/copilot"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            await websocket.send('{"message": "Hello"}')
            response = await websocket.recv()
            print(f"Received: {response}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_ws())
