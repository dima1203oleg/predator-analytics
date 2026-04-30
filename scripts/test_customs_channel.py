import asyncio

from app.connectors.telegram_channel import telegram_channel_connector


async def check_customs_channel():

    if not telegram_channel_connector.is_configured:
        return


    # Try to fetch last 5 messages
    result = await telegram_channel_connector.fetch_channel_history("Customs_of_Ukraine", limit=5)

    if result.success:
        for _msg in result.data:
            pass
    else:
        pass

if __name__ == "__main__":
    asyncio.run(check_customs_channel())
