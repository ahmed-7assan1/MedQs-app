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
    SAVE_PATH = "./"

import subprocess, time, requests, json, sys, os
from datetime import datetime

# ─────────────────────────────────────────────────────────────────────────────
# ⚙️ الإعدادات (بدون سيكريت كما طلبت)
# ─────────────────────────────────────────────────────────────────────────────

TG_API_ID = '34818218' 
TG_API_HASH = '37f1c08f94e73484142b168165623df7'
SITE_URL = "https://medonex.vercel.app" 

YT_TOKEN_FILE = SAVE_PATH + "youtube_token.json" 
TG_SESSION_FILE = SAVE_PATH + "medonex_session"
YT_COOKIES_FILE = SAVE_PATH + "youtube_cookies.txt" 

# عداد الرفع للتحكم في الكوتا
BATCH_LIMIT = 5
SUCCESSFUL_UPLOADS = 0

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/drive.file"
]

YOUTUBE_CLIENT_CONFIG = {
    "installed": {
        "client_id": "YOUR_CLIENT_ID_HERE",
        "project_id": "medqs-491720",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "YOUR_CLIENT_SECRET_HERE",
        "redirect_uris": ["http://localhost"]
    }
}

HEADERS = { "Content-Type": "application/json" }

def log_to_site(job_id, message):
    ts = datetime.now().strftime("%H:%M:%S")
    full_msg = f"[{ts}] {message}"
    print(full_msg)
    try: requests.patch(f"{SITE_URL}/api/v1/admin/colab/jobs/{job_id}", headers=HEADERS, json={"logs": [full_msg]}, timeout=5)
    except: pass

def update_job(job_id, **kwargs):
    try: requests.patch(f"{SITE_URL}/api/v1/admin/colab/jobs/{job_id}", headers=HEADERS, json=kwargs, timeout=5)
    except: pass

def get_google_service(service_name, version):
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    creds = None
    if os.path.exists(YT_TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(YT_TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_config(YOUTUBE_CLIENT_CONFIG, scopes=SCOPES)
            flow.redirect_uri = 'http://localhost'
            auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
            print(f"\n🔐 سجل دخول جوجل (يوتيوب + درايف):\n{auth_url}")
            res_url = input("\n🔗 انسخ الرابط النهائي هنا: ").strip()
            flow.fetch_token(authorization_response=res_url)
            creds = flow.credentials
            with open(YT_TOKEN_FILE, 'w') as token: token.write(creds.to_json())
    return build(service_name, version, credentials=creds)

async def process_job(job):
    global SUCCESSFUL_UPLOADS
    job_id, source_url, title = job['id'], job['sourceUrl'], job.get('title', "")
    
    local_file = f"/tmp/{job_id}"
    success = False
    file_ext = ".mp4"
    thumbnail_file = f"/tmp/{job_id}.jpg"

    try:
        # 1. تحميل الفيديو من تيليجرام
        if "t.me/" in source_url:
            from telethon import TelegramClient
            client = TelegramClient(TG_SESSION_FILE, TG_API_ID, TG_API_HASH)
            await client.start()
            parts = source_url.strip('/').split('/')
            msg = await client.get_messages(parts[-2], ids=int(parts[-1]))
            if msg and msg.media:
                if hasattr(msg.media, 'document'):
                    for attr in msg.media.document.attributes:
                        if hasattr(attr, 'file_name'): file_ext = os.path.splitext(attr.file_name)[1]
                local_file += file_ext
                await client.download_media(msg, file=local_file)
                success = True
            await client.disconnect()
        
        # 2. تحميل الفيديو من يوتيوب (نقل من قناة لقناة)
        else:
            local_file += ".mp4"
            import yt_dlp
            ydl_opts = {
                'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', 
                'outtmpl': local_file, 
                'quiet': True,
                'writethumbnail': True # سحب الصورة المصغرة الأصلية
            }
            if os.path.exists(YT_COOKIES_FILE): ydl_opts['cookiefile'] = YT_COOKIES_FILE
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl: 
                info = ydl.extract_info(source_url, download=True)
                # لو مفيش عنوان مخصص، استخدم عنوان يوتيوب الأصلي
                if not title: title = info.get('title')
                # حفظ الصورة المصغرة
                if info.get('thumbnail'):
                    thumb_res = requests.get(info['thumbnail'])
                    with open(thumbnail_file, 'wb') as f: f.write(thumb_res.content)
                success = os.path.exists(local_file)
        
        if success:
            from googleapiclient.http import MediaFileUpload
            from googleapiclient.errors import HttpError
            
            # رفع فيديو
            if file_ext.lower() in ['.mp4', '.mkv', '.webm', '.avi']:
                try:
                    log_to_site(job_id, f"📤 Uploading to YouTube...")
                    youtube = get_google_service("youtube", "v3")
                    media = MediaFileUpload(local_file, chunksize=1024*1024, resumable=True)
                    request = youtube.videos().insert(
                        part="snippet,status", 
                        body={"snippet": {"title": title or "Video"}, "status": {"privacyStatus": "unlisted"}}, 
                        media_body=media
                    )
                    response = None
                    while response is None:
                        status, response = request.next_chunk()
                        if status: sys.stdout.write(f"\r📤 YouTube: {int(status.progress() * 100)}%")
                    
                    # محاولة رفع الصورة المصغرة لو موجودة
                    if os.path.exists(thumbnail_file):
                        try:
                            youtube.thumbnails().set(videoId=response['id'], media_body=MediaFileUpload(thumbnail_file)).execute()
                            print("\n🖼️ Original thumbnail applied!")
                        except: pass

                    update_job(job_id, status="COMPLETED", progress=100, newVideoUrl=f"https://youtu.be/{response['id']}")
                    SUCCESSFUL_UPLOADS += 1
                except HttpError as e:
                    if "uploadLimitExceeded" in str(e):
                        # تحويل تلقائي للدرايف عند انتهاء الكوتا
                        log_to_site(job_id, "⚠️ YouTube Quota Full. Uploading to Drive instead...")
                        await upload_to_drive(local_file, title, file_ext, job_id)
                        SUCCESSFUL_UPLOADS += 1
                    else: raise e
            else:
                await upload_to_drive(local_file, title, file_ext, job_id)
                SUCCESSFUL_UPLOADS += 1

    except Exception as e: update_job(job_id, status="FAILED", error=str(e))
    finally:
        if os.path.exists(local_file): os.remove(local_file)
        if os.path.exists(thumbnail_file): os.remove(thumbnail_file)

async def upload_to_drive(local_file, title, file_ext, job_id):
    drive_service = get_google_service("drive", "v3")
    file_metadata = {'name': title + file_ext}
    from googleapiclient.http import MediaFileUpload
    media = MediaFileUpload(local_file, resumable=True)
    file = drive_service.files().create(body=file_metadata, media_body=media, fields='id, webViewLink').execute()
    drive_service.permissions().create(fileId=file.get('id'), body={'type': 'anyone', 'role': 'reader'}).execute()
    new_url = file.get('webViewLink')
    update_job(job_id, status="COMPLETED", progress=100, newVideoUrl=new_url)
    log_to_site(job_id, f"🎉 File in Drive: {new_url}")

async def main():
    global SUCCESSFUL_UPLOADS
    print(f"🚀 MedOneX Smart Worker ONLINE.")
    while True:
        # فحص عداد الـ 5 فيديوهات
        if SUCCESSFUL_UPLOADS >= BATCH_LIMIT:
            print("\n" + "="*50)
            print("🛑 BATCH LIMIT REACHED (5 Videos)!")
            print("Please change your Google Project / Client ID if needed.")
            print("To continue, please stop and restart the code.")
            print("="*50 + "\n")
            # توقف تام للمساعدة في تبديل المشروع
            return

        try:
            res = requests.get(f"{SITE_URL}/api/v1/admin/colab/jobs?colab=true", headers=HEADERS, timeout=10)
            job = res.json().get("job") if res.status_code == 200 else None
            if job: await process_job(job)
            else: sys.stdout.write("."); sys.stdout.flush()
            await asyncio.sleep(10)
        except Exception as e: print(f"⚠️ Error: {e}"); await asyncio.sleep(10)

import asyncio
await main()
