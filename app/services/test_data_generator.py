import logging


logger = logging.getLogger("app.services.test_data_generator")


class TestDataGenerator:
    async def generate_mock_datasets(self, count: int = 10):
        logger.info(f"Generating {count} mock datasets (Mock)")
        return True


def get_test_data_generator():
    return TestDataGenerator()
