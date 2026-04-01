import asyncio
import logging
from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton,
    LabeledPrice, PreCheckoutQuery
)
from aiogram.filters import CommandStart
from aiogram.fsm.storage.memory import MemoryStorage

logging.basicConfig(level=logging.INFO)

BOT_TOKEN = "8157837752:AAFtwsiptEIY3Sb6DxF89W8_uZ7GJRthlpQ"
ADMIN_USERNAME = "@wopst"

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())

# База данных пользователей (в памяти)
users_db = {}

# Каталог товаров
CATALOG = {
    "bd": {
        "name": "🇧🇩 Бангладеш +880",
        "stock": 3,
        "price": 20,
        "emoji": "🇧🇩"
    },
    "ca": {
        "name": "🇨🇦 Канада +1",
        "stock": 5,
        "price": 30,
        "emoji": "🇨🇦"
    },
    "ru": {
        "name": "🇷🇺 Россия +7",
        "stock": 10,
        "price": 50,
        "emoji": "🇷🇺"
    }
}

def get_user(user_id: int):
    if user_id not in users_db:
        users_db[user_id] = {"balance": 0, "purchases": []}
    return users_db[user_id]

def main_menu():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛒 Каталог", callback_data="catalog")],
        [InlineKeyboardButton(text="💰 Баланс", callback_data="balance")],
        [InlineKeyboardButton(text="🆘 Поддержка", url=f"https://t.me/wopst")]
    ])

def catalog_keyboard():
    buttons = []
    for key, item in CATALOG.items():
        stock = item["stock"]
        stock_text = f"({stock} шт.)" if stock > 0 else "(нет в наличии)"
        buttons.append([
            InlineKeyboardButton(
                text=f"{item['emoji']} {item['name']} — {item['price']} ⭐ {stock_text}",
                callback_data=f"item_{key}"
            )
        ])
    buttons.append([InlineKeyboardButton(text="🔙 Назад", callback_data="main")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def item_keyboard(item_key: str):
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛍 Купить", callback_data=f"buy_{item_key}")],
        [InlineKeyboardButton(text="🔙 Назад в каталог", callback_data="catalog")]
    ])

def balance_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⭐ Пополнить баланс", callback_data="topup")],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="main")]
    ])

def topup_keyboard():
    amounts = [50, 100, 200, 500]
    buttons = []
    row = []
    for amount in amounts:
        row.append(InlineKeyboardButton(
            text=f"⭐ {amount} Stars",
            callback_data=f"topup_{amount}"
        ))
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    buttons.append([InlineKeyboardButton(text="🔙 Назад", callback_data="balance")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)

# ───── Хэндлеры ─────

@dp.message(CommandStart())
async def cmd_start(message: Message):
    get_user(message.from_user.id)
    await message.answer(
        f"👋 Добро пожаловать в магазин аккаунтов!\n\n"
        f"Здесь вы можете купить Telegram-номера по выгодным ценам.\n"
        f"Используйте меню ниже 👇",
        reply_markup=main_menu()
    )

@dp.callback_query(F.data == "main")
async def cb_main(call: CallbackQuery):
    await call.message.edit_text(
        "🏠 Главное меню\n\nВыберите раздел:",
        reply_markup=main_menu()
    )

@dp.callback_query(F.data == "catalog")
async def cb_catalog(call: CallbackQuery):
    await call.message.edit_text(
        "🛒 <b>Каталог номеров</b>\n\nВыберите страну:",
        reply_markup=catalog_keyboard(),
        parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("item_"))
async def cb_item(call: CallbackQuery):
    key = call.data.split("_", 1)[1]
    item = CATALOG.get(key)
    if not item:
        await call.answer("Товар не найден", show_alert=True)
        return

    stock_text = f"{item['stock']} шт." if item['stock'] > 0 else "❌ Нет в наличии"
    text = (
        f"{item['emoji']} <b>{item['name']}</b>\n\n"
        f"💰 Цена: <b>{item['price']} ⭐ Stars</b>\n"
        f"📦 В наличии: <b>{stock_text}</b>\n\n"
        f"Нажмите <b>Купить</b> для оформления заказа."
    )
    await call.message.edit_text(text, reply_markup=item_keyboard(key), parse_mode="HTML")

@dp.callback_query(F.data.startswith("buy_"))
async def cb_buy(call: CallbackQuery):
    key = call.data.split("_", 1)[1]
    item = CATALOG.get(key)
    if not item:
        await call.answer("Товар не найден", show_alert=True)
        return

    if item["stock"] <= 0:
        await call.answer("❌ К сожалению, этот товар закончился!", show_alert=True)
        return

    user = get_user(call.from_user.id)

    if user["balance"] >= item["price"]:
        # Списываем с баланса
        user["balance"] -= item["price"]
        item["stock"] -= 1
        user["purchases"].append(item["name"])
        await call.message.edit_text(
            f"✅ <b>Покупка успешна!</b>\n\n"
            f"Вы купили: {item['emoji']} {item['name']}\n"
            f"Списано: {item['price']} ⭐\n"
            f"Остаток баланса: {user['balance']} ⭐\n\n"
            f"📩 Для получения товара напишите {ADMIN_USERNAME}",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="✉️ Написать продавцу", url="https://t.me/wopst")],
                [InlineKeyboardButton(text="🏠 В меню", callback_data="main")]
            ]),
            parse_mode="HTML"
        )
    else:
        needed = item["price"] - user["balance"]
        await call.answer(
            f"❌ Недостаточно Stars!\nНужно ещё {needed} ⭐",
            show_alert=True
        )

@dp.callback_query(F.data == "balance")
async def cb_balance(call: CallbackQuery):
    user = get_user(call.from_user.id)
    await call.message.edit_text(
        f"💰 <b>Ваш баланс</b>\n\n"
        f"⭐ Stars: <b>{user['balance']}</b>\n\n"
        f"Для пополнения нажмите кнопку ниже 👇",
        reply_markup=balance_keyboard(),
        parse_mode="HTML"
    )

@dp.callback_query(F.data == "topup")
async def cb_topup(call: CallbackQuery):
    await call.message.edit_text(
        "⭐ <b>Пополнение баланса</b>\n\nВыберите сумму пополнения:",
        reply_markup=topup_keyboard(),
        parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("topup_"))
async def cb_topup_amount(call: CallbackQuery):
    amount = int(call.data.split("_")[1])
    await bot.send_invoice(
        chat_id=call.from_user.id,
        title=f"Пополнение баланса на {amount} ⭐",
        description=f"После оплаты {amount} Stars будут зачислены на ваш баланс в боте.",
        payload=f"topup_{amount}_{call.from_user.id}",
        currency="XTR",  # Telegram Stars
        prices=[LabeledPrice(label=f"{amount} Stars", amount=amount)],
        provider_token=""  # Для Stars — пустая строка
    )
    await call.answer()

@dp.pre_checkout_query()
async def pre_checkout(query: PreCheckoutQuery):
    await query.answer(ok=True)

@dp.message(F.successful_payment)
async def successful_payment(message: Message):
    payload = message.successful_payment.invoice_payload
    parts = payload.split("_")
    amount = int(parts[1])
    user_id = int(parts[2])

    user = get_user(user_id)
    user["balance"] += amount

    await message.answer(
        f"✅ <b>Баланс пополнен!</b>\n\n"
        f"Зачислено: <b>{amount} ⭐ Stars</b>\n"
        f"Текущий баланс: <b>{user['balance']} ⭐</b>",
        reply_markup=main_menu(),
        parse_mode="HTML"
    )

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
