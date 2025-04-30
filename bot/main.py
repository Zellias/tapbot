from balethon import Client
from balethon.conditions import private
import aiohttp
import requests

API_BASE_URL = 'https://yourdomain.com/api/user'
TOKEN = ''
bot = Client(TOKEN)

async def create_account(user_id: int, ref_id: str = None) -> dict:
    """Create or get user account from API"""
    headers = {'X-USER-ID': str(user_id)}
    if ref_id:
        headers['X-REF-ID'] = ref_id
        
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(API_BASE_URL, headers=headers) as response:
                return await response.json()
    except Exception as e:
        print(f"API Error: {e}")
        return None

@bot.on_message(private)
async def answer_message(message):
    command = message.text.split(' ')[0]
    if command == '/start':
        start_params = message.text.split(' ')
        ref_id = start_params[1] if len(start_params) > 1 else None
        
        result = await create_account(message.author.id, ref_id)
        
        if not result:
            await message.reply("متاسفانه در پردازش درخواست شما خطایی رخ داد.")
            return
            
        if 'user' in result:
      
            try:
                await bot.send_message(
                    int(ref_id),
                    f"کاربر جدیدی با شناسه {message.author.id} از طریق لینک دعوت شما ثبت نام کرد."
                )
            except:
                pass
            opening_text = """خوش آمدید! 👋

برای کسب درآمد از طریق انجام تسک‌ها و دعوت از دوستان خود، روی دکمه «بازکردن» کلیک کنید.

💰 با دعوت هر دوست، امتیاز دریافت کنید
✨ تسک‌های متنوع با پاداش‌های جذاب
💎 برداشت آسان و سریع

همین حالا شروع کنید! 🚀"""


            with open("banner.png", "rb") as photo:
                files = {'photo': photo}
                response = requests.post(f"https://tapi.bale.ai/bot{TOKEN}/sendPhoto", data={
                    "chat_id": message.chat.id,
                    "caption": opening_text,
                    "reply_markup": '{"inline_keyboard": [[{"text": "بازکردن", "web_app": {"url": "https://tap.donatex.ir"}}], [{"text": "کانال رسمی", "url": "https://ble.ir/tapspot"}]]}',
                    "parse_mode": "HTML"
                }, files=files)
                
        else:
            await message.reply("متاسفانه در ثبت نام شما خطایی رخ داد.")

bot.run()
