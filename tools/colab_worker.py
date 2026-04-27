import os
# السماح بالروابط غير المشفرة
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# 1. ربط جوجل درايف لحفظ تسجيل الدخول للأبد
try:
    from google.colab import drive
    print("🔗 Mounting Google Drive...")
    drive.mount('/content/drive')
    SAVE_PATH = "/content/drive/MyDrive/MedOneX_Worker/"
    if not os.path.exists(SAVE_PATH): os.makedirs(SAVE_PATH)
except:
    print("⚠️ Google Drive not found, using local storage.")
    SAVE_PATH = "./"

import subprocess
import time
import requests
import json
from datetime import datetime
import sys
import re

# ─────────────────────────────────────────────────────────────────────────────
# 2. ⚙️ الإعدادات (⚠️ بياناتك هنا)
# ─────────────────────────────────────────────────────────────────────────────

TG_API_ID = 'YOUR_TG_API_ID' 
TG_API_HASH = 'YOUR_TG_API_HASH'

SITE_URL = "https://medonex.vercel.app" 
COLAB_SECRET = "YOUR_COLAB_SECRET" 

YT_TOKEN_FILE = SAVE_PATH + "youtube_token.json" 
TG_SESSION_FILE = SAVE_PATH + "medonex_session"

YOUTUBE_CLIENT_CONFIG = {
    "installed": {
        "client_id": "YOUR_CLIENT_ID",
        "project_id": "YOUR_PROJECT_ID",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "YOUR_CLIENT_SECRET",
        "redirect_uris": ["http://localhost"]
    }
}

HEADERS = { "x-colab-secret": COLAB_SECRET, "Content-Type": "application/json" }

# ─────────────────────────────────────────────────────────────────────────────
# 3. الدوال المساعدة
# ─────────────────────────────────────────────────────────────────────────────

def log_to_site(job_id, message):
    ts = datetime.now().strftime("%H:%M:%S")
    full_msg = f"[{ts}] {message}"
    print(full_msg)
    try: requests.patch(f"{SITE_URL}/api/v1/admin/colab/jobs/{job_id}", headers=HEADERS, json={"logs": [full_msg]}, timeout=5)
    except: pass

def update_job(job_id, **kwargs):
    try: requests.patch(f"{SITE_URL}/api/v1/admin/colab/jobs/{job_id}", headers=HEADERS, json=kwargs, timeout=5)
    except: pass

def get_youtube_service():
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    creds = None
    if os.path.exists(YT_TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(YT_TOKEN_FILE, ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.force-ssl"])
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_config(YOUTUBE_CLIENT_CONFIG, scopes=["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.force-ssl"])
            flow.redirect_uri = 'http://localhost'
            auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
            print(f"\n🔐 سجل دخول يوتيوب:\n{auth_url}")
            res_url = input("\n🔗 انسخ الرابط النهائي هنا: ").strip()
            flow.fetch_token(authorization_response=res_url)
            creds = flow.credentials
            with open(YT_TOKEN_FILE, 'w') as token: token.write(creds.to_json())
    return build("youtube", "v3", credentials=creds)

# ─────────────────────────────────────────────────────────────────────────────
# 4. محرك تحليل رسائل تيليجرام (Bulk Parser)
# ─────────────────────────────────────────────────────────────────────────────

async def parse_bulk_telegram(url, job_id):
    from telethon import TelegramClient
    from telethon.tl.types import MessageEntityTextUrl, MessageEntityUrl, MessageMediaDocument
    client = TelegramClient(TG_SESSION_FILE, TG_API_ID, TG_API_HASH)
    await client.start()
    try:
        log_to_site(job_id, "📡 Analyzing message for links and files...")
        parts = url.strip('/').split('/')
        msg_id = int(parts[-1]); peer = parts[-2]
        entity = await client.get_entity(peer)
        message = await client.get_messages(entity, ids=msg_id)
        if not message: return False, "Message not found"

        detected = []
        # 1. سحب اللينكات
        entities = message.entities or []
        for ent in entities:
            link = None
            link_text = ""
            if isinstance(ent, MessageEntityTextUrl):
                link = ent.url
                link_text = message.text[ent.offset : ent.offset + ent.length]
            elif isinstance(ent, MessageEntityUrl):
                link = message.text[ent.offset : ent.offset + ent.length]
                link_text = "Video"

            if link and ("t.me/" in link or "youtu" in link):
                subject, lecture, doctor = "General", "Lecture", ""
                lines_before = message.text[:ent.offset].split('\n')
                for line in reversed(lines_before):
                    line = line.strip()
                    if '📍' in line: subject = line.replace('📍', '').strip()
                    if '⭐' in line or '💠' in line: lecture = line.strip()
                    if 'Dr' in line and not doctor: doctor = line.split('(')[0].strip()
                    if subject != "General" and lecture != "Lecture" and doctor: break
                
                full_title = f"{subject} | {lecture} - {doctor} ({link_text})"
                detected.append({"url": link, "title": full_title})

        # 2. سحب الملفات المرفقة
        if message.media and isinstance(message.media, MessageMediaDocument):
             detected.append({"url": url, "title": f"Attached: {(message.text or 'Document')[:50]}"})

        log_to_site(job_id, f"🔍 Found {len(detected)} items. Sending to site...")
        added = 0
        for d in detected:
            try:
                res = requests.post(f"{SITE_URL}/api/v1/admin/colab/jobs", headers=HEADERS, json={"sourceUrl": d['url'], "title": d['title']}, timeout=10)
                if res.status_code in [200, 201]: added += 1
                else: print(f"❌ Site rejected: {d['title']} ({res.status_code})")
            except: pass
        return True, f"Successfully extracted {added} items."
    finally: await client.disconnect()

# ─────────────────────────────────────────────────────────────────────────────
# 5. محرك المعالجة
# ─────────────────────────────────────────────────────────────────────────────

async def process_job(job):
    job_id, source_url = job['id'], job['sourceUrl']
    title = job.get('title', "")
    if "bulk" in title.lower() and "t.me/" in source_url:
        update_job(job_id, status="PROCESSING")
        success, msg = await parse_bulk_telegram(source_url, job_id)
        update_job(job_id, status="COMPLETED" if success else "FAILED", logs=[msg])
        return

    local_file, local_thumb = f"/tmp/{job_id}.mp4", f"/tmp/{job_id}.jpg"
    success, thumb_url = False, None
    try:
        if "t.me/" in source_url:
            from telethon import TelegramClient
            client = TelegramClient(TG_SESSION_FILE, TG_API_ID, TG_API_HASH)
            await client.start()
            parts = source_url.strip('/').split('/')
            msg = await client.get_messages(parts[-2], ids=int(parts[-1]))
            if msg and msg.media:
                await client.download_media(msg, file=local_file, progress_callback=lambda c,t: sys.stdout.write(f"\r⬇️ TG: {int(100*c/t)}%"))
                if not job.get('title'): title = (msg.text or "Video")[:80]
                success = True
            await client.disconnect()
        else:
            import yt_dlp
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info = ydl.extract_info(source_url, download=False)
                title, thumb_url = job.get('title') or info.get('title', "Video"), info.get('thumbnail')
                if thumb_url:
                    with open(local_thumb, 'wb') as f: f.write(requests.get(thumb_url).content)
                ydl.download([source_url]); success = os.path.exists(local_file)

        if success:
            from googleapiclient.http import MediaFileUpload
            youtube = get_youtube_service()
            media = MediaFileUpload(local_file, chunksize=1024*1024, resumable=True)
            request = youtube.videos().insert(
                part="snippet,status",
                body={"snippet": {"title": title}},
                media_body=media
            )
            response = None
            while response is None:
                status, response = request.next_chunk()
                if status: sys.stdout.write(f"\r📤 YT: {int(status.progress() * 100)}%")
            update_job(job_id, status="COMPLETED", progress=100, newVideoUrl=f"https://youtu.be/{response['id']}")
            log_to_site(job_id, f"🎉 Success!")
    except Exception as e:
        update_job(job_id, status="FAILED", error=str(e))
    finally:
        if os.path.exists(local_file): os.remove(local_file)
        if os.path.exists(local_thumb): os.remove(local_thumb)

# ─────────────────────────────────────────────────────────────────────────────
# 6. التشغيل
# ─────────────────────────────────────────────────────────────────────────────
print("⏳ Setting up Environment...")
subprocess.run(["pip", "install", "-U", "-q", "yt-dlp", "telethon", "google-auth-oauthlib", "google-api-python-client"], check=True)

import asyncio
import yt_dlp

async def main():
    print(f"🚀 MedOneX AI-Worker is ONLINE.")
    while True:
        try:
            res = requests.get(f"{SITE_URL}/api/v1/admin/colab/jobs", headers=HEADERS, timeout=10)
            job = res.json().get("job") if res.status_code == 200 else None
            if job: await process_job(job)
            else: sys.stdout.write("."); sys.stdout.flush()
            await asyncio.sleep(10)
        except Exception as e: print(f"⚠️ Error: {e}"); await asyncio.sleep(10)

await main()
