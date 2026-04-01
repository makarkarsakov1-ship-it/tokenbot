import asyncio, logging, os
from aiogram import Bot, Dispatcher, F
from aiogram.types import *
from aiogram.filters import CommandStart

logging.basicConfig(level=logging.INFO)
BOT_TOKEN = os.getenv("BOT_TOKEN", "ВСТАВЬ_ТОКЕН")
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

users = {}
CATALOG = {
    "bd": {"name": "🇧🇩 Бангладеш +880", "stock": 3,  "price": 20},
    "ca": {"name": "🇨🇦 Канада +1",       "stock": 5,  "price": 30},
    "ru": {"name": "🇷🇺 Россия +7",        "stock": 10, "price": 50},
}

def u(id):
    if id not in users: users[id] = {"balance": 0}
    return users[id]

def kb_main():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛒 Каталог", callback_data="catalog"),
         InlineKeyboardButton(text="💰 Баланс", callback_data="balance")],
        [InlineKeyboardButton(text="🆘 Поддержка", url="https://t.me/wopst")]
    ])

def kb_catalog():
    rows = []
    for k, v in CATALOG.items():
        s = f"({v['stock']} шт.)" if v['stock'] > 0 else "(нет)"
        rows.append([InlineKeyboardButton(text=f"{v['name']} — {v['price']}⭐ {s}", callback_data=f"item_{k}")])
    rows.append([InlineKeyboardButton(text="🔙 Назад", callback_data="main")])
    return InlineKeyboardMarkup(inline_keyboard=rows)

@dp.message(CommandStart())
async def start(m: Message):
    u(m.from_user.id)
    await m.answer("👋 Добро пожаловать в магазин аккаунтов!\nВыберите раздел 👇", reply_markup=kb_main())

@dp.callback_query(F.data == "main")
async def cb_main(c: CallbackQuery):
    await c.message.edit_text("🏠 Главное меню:", reply_markup=kb_main())

@dp.callback_query(F.data == "catalog")
async def cb_catalog(c: CallbackQuery):
    await c.message.edit_text("🛒 <b>Каталог номеров:</b>", reply_markup=kb_catalog(), parse_mode="HTML")

@dp.callback_query(F.data.startswith("item_"))
async def cb_item(c: CallbackQuery):
    k = c.data[5:]
    v = CATALOG[k]
    s = f"{v['stock']} шт." if v['stock'] > 0 else "❌ Нет в наличии"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛍 Купить", callback_data=f"buy_{k}")],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="catalog")]
    ])
    await c.message.edit_text(f"{v['name']}\n💰 Цена: <b>{v['price']}⭐</b>\n📦 В наличии: <b>{s}</b>", reply_markup=kb, parse_mode="HTML")

@dp.callback_query(F.data.startswith("buy_"))
async def cb_buy(c: CallbackQuery):
    k = c.data[4:]
    v = CATALOG[k]
    user = u(c.from_user.id)
    if v['stock'] <= 0:
        return await c.answer("❌ Товар закончился!", show_alert=True)
    if user['balance'] < v['price']:
        return await c.answer(f"❌ Не хватает {v['price'] - user['balance']}⭐", show_alert=True)
    user['balance'] -= v['price']
    v['stock'] -= 1
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✉️ Написать продавцу", url="https://t.me/wopst")],
        [InlineKeyboardButton(text="🏠 В меню", callback_data="main")]
    ])
    await c.message.edit_text(f"✅ <b>Куплено!</b>\n{v['name']}\nОстаток: {user['balance']}⭐\n\n📩 Напишите @wopst для получения товара", reply_markup=kb, parse_mode="HTML")

@dp.callback_query(F.data == "balance")
async def cb_balance(c: CallbackQuery):
    user = u(c.from_user.id)
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⭐ Пополнить", callback_data="topup")],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="main")]
    ])
    await c.message.edit_text(f"💰 <b>Баланс:</b> {user['balance']}⭐", reply_markup=kb, parse_mode="HTML")

@dp.callback_query(F.data == "topup")
async def cb_topup(c: CallbackQuery):
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⭐ 50",  callback_data="pay_50"),
         InlineKeyboardButton(text="⭐ 100", callback_data="pay_100")],
        [InlineKeyboardButton(text="⭐ 200", callback_data="pay_200"),
         InlineKeyboardButton(text="⭐ 500", callback_data="pay_500")],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="balance")]
    ])
    await c.message.edit_text("⭐ Выберите сумму пополнения:", reply_markup=kb)

@dp.callback_query(F.data.startswith("pay_"))
async def cb_pay(c: CallbackQuery):
    amount = int(c.data[4:])
    await bot.send_invoice(c.from_user.id, title=f"Пополнение {amount}⭐",
        description=f"{amount} Stars будут зачислены на баланс.",
        payload=f"top_{amount}_{c.from_user.id}", currency="XTR", provider_token="",
        prices=[LabeledPrice(label=f"{amount} Stars", amount=amount)])
    await c.answer()

@dp.pre_checkout_query()
async def pre_checkout(q: PreCheckoutQuery):
    await q.answer(ok=True)

@dp.message(F.successful_payment)
async def paid(m: Message):
    parts = m.successful_payment.invoice_payload.split("_")
    amount = int(parts[1])
    user = u(m.from_user.id)
    user['balance'] += amount
    await m.answer(f"✅ Зачислено {amount}⭐\nБаланс: {user['balance']}⭐", reply_markup=kb_main())

asyncio.run(dp.start_polling(bot))
