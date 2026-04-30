import logging

logger = logging.getLogger("app.services.system_control_service")


class SystemControlService:
    async def restart_subsystem(self, subsystem: str):
        logger.info(f"Restarting subsystem: {subsystem} (Mock)")
        return True


system_control_service = SystemControlService()
