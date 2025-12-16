"""
Predator Analytics Telegram Bot v22.0 (Consolidated)
Main entry point for the modular bot architecture.
"""
import logging
import asyncio
import signal
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder

from .config import BOT_TOKEN, ADMIN_ID, MENUS, MESSAGES
from .controllers.git_controller import GitController

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Controllers
git_controller = GitController(repo_path=os.getcwd())

# ═══════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════

def get_keyboard(menu_name: str) -> InlineKeyboardMarkup:
    """Build keyboard from config"""
    layout = MENUS.get(menu_name, [])
    builder = InlineKeyboardBuilder()
    for row in layout:
        buttons = [InlineKeyboardButton(text=btn["text"], callback_data=btn["callback_data"]) for btn in row]
        builder.row(*buttons)
    return builder.as_markup()

# ═══════════════════════════════════════════════════════════════════════════
# HANDLERS: COMMANDS
# ═══════════════════════════════════════════════════════════════════════════

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    """Handle /start command"""
    if message.from_user.id != ADMIN_ID:
        await message.answer(MESSAGES["access_denied"])
        return

    await message.answer(
        MESSAGES["welcome"],
        reply_markup=get_keyboard("main"),
        parse_mode="Markdown"
    )

@dp.message(Command("status"))
async def cmd_status(message: types.Message):
    """Handle /status command"""
    if message.from_user.id != ADMIN_ID:
        return
    await message.answer("✅ System Operational (v22.0)")

# ═══════════════════════════════════════════════════════════════════════════
# HANDLERS: NAVIGATION CALLBACKS
# ═══════════════════════════════════════════════════════════════════════════

@dp.callback_query(F.data.startswith("menu_"))
async def handle_navigation(callback: types.CallbackQuery):
    """Handle menu navigation"""
    target_menu = callback.data.replace("menu_", "")

    if target_menu not in MENUS:
        await callback.answer("Menu not found")
        return

    await callback.message.edit_text(
        f"📂 *{target_menu.capitalize()} Module*",
        reply_markup=get_keyboard(target_menu),
        parse_mode="Markdown"
    )
    await callback.answer()

# ═══════════════════════════════════════════════════════════════════════════
# HANDLERS: GIT ACTIONS
# ═══════════════════════════════════════════════════════════════════════════

@dp.callback_query(F.data == "git_status")
async def git_status(callback: types.CallbackQuery):
    await callback.answer("Checking status...")
    status = await git_controller.get_status()
    await callback.message.answer(status, parse_mode="Markdown")

@dp.callback_query(F.data == "git_log")
async def git_log(callback: types.CallbackQuery):
    await callback.answer("Fetching log...")
    log = await git_controller.get_log()
    await callback.message.answer(log, parse_mode="Markdown")

@dp.callback_query(F.data == "git_pull")
async def git_pull(callback: types.CallbackQuery):
    await callback.answer("Pulling updates...")
    await callback.message.answer("⏳ Pulling changes from remote...")
    result = await git_controller.pull()
    await callback.message.answer(result, parse_mode="Markdown")


# ═══════════════════════════════════════════════════════════════════════════
# LIFECYCLE
# ═══════════════════════════════════════════════════════════════════════════

async def main():
    """Start the bot"""
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set!")
        return

    logger.info("🚀 Telegram Bot v22.0 Starting...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    import os
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bot stopped.")
