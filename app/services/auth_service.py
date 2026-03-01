import logging


logger = logging.getLogger("app.services.auth_service")


class User:
    def __init__(self, id: int, username: str):
        self.id = id
        self.username = username
        self.is_active = True


async def get_current_user() -> User:
    # Mock authentication
    return User(id=1, username="admin")
