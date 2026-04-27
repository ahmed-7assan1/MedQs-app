import os
import sys
import time
import json
import requests
import asyncio
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# --- CONFIGURATION ---
# ضع رابط السيرفر الخاص بك هنا
SITE_URL = "https://your-medonex-site.vercel.app" 

# حدود الرفع (للمساعدة في تجاوز الكوتا)
BATCH_LIMIT = 5 
SUCCESSFUL_UPLOADS = 0

def get_google_service(service_name, version):
    scopes = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/drive.file'
    ]
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', scopes)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('client_secrets.json'):
                raise Exception("Missing client_secrets.json. Please upload it to run Google services.")
            flow = InstalledAppFlow.from_client_secrets_file('client_secrets.json', scopes)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    
    return build(service_name, version, credentials=creds)

def update_job(job_id, status, progress=0, error=None, newVideoUrl=None):
    try:
        requests.patch(
            f"{SITE_URL}/api/admin/youtube-sync/{job_id}",
            json={"status": status, "progress": progress, "error": error, "newVideoUrl": newVideoUrl},
            timeout=10
        )
    except Exception as e: print(f"⚠️ Failed to update site: {e}")

async def process_job(job):
    global SUCCESSFUL_UPLOADS
    job_id = job["id"]
    video_url = job["sourceUrl"]
    title = job.get("title", "Synced Video")
    
    print(f"\n🎬 Processing: {title}")
    update_job(job_id, status="DOWNLOADING", progress=10)
    
    local_file = "video.mp4"
    
    try:
        # Step 1: Mock/Actual Download
        # os.system(f"yt-dlp -o {local_file} {video_url}")
        
        # Step 2: Upload to Drive
        await upload_to_drive(local_file, title, ".mp4", job_id)
        SUCCESSFUL_UPLOADS += 1

    except Exception as e: 
        print(f"❌ Error: {e}")
        update_job(job_id, status="FAILED", error=str(e))
    finally:
        if os.path.exists(local_file): os.remove(local_file)

async def upload_to_drive(local_file, title, file_ext, job_id):
    drive_service = get_google_service("drive", "v3")
    file_metadata = {'name': title + file_ext}
    from googleapiclient.http import MediaFileUpload
    media = MediaFileUpload(local_file, resumable=True)
    
    print(f"☁️ Uploading to Drive...")
    file = drive_service.files().create(body=file_metadata, media_body=media, fields='id, webViewLink').execute()
    
    # Make public
    drive_service.permissions().create(fileId=file.get('id'), body={'type': 'anyone', 'role': 'reader'}).execute()
    
    new_url = file.get('webViewLink')
    update_job(job_id, status="COMPLETED", progress=100, newVideoUrl=new_url)
    print(f"✅ Success! URL: {new_url}")

async def main():
    global SUCCESSFUL_UPLOADS
    print(f"🚀 MedOneX Smart Worker ONLINE (No-Secret Mode).")
    
    # Colab Auto-Mount
    try:
        from google.colab import drive
        if not os.path.exists('/content/drive'):
            drive.mount('/content/drive')
    except: pass

    while True:
        if SUCCESSFUL_UPLOADS >= BATCH_LIMIT:
            print("\n🛑 BATCH LIMIT REACHED (5 Videos)! Restart to continue.")
            break

        try:
            # Poll for jobs using colab=true flag
            res = requests.get(f"{SITE_URL}/api/v1/admin/colab/jobs?colab=true", timeout=10)
            if res.status_code == 200:
                job = res.json().get("job")
                if job: await process_job(job)
                else: sys.stdout.write("."); sys.stdout.flush()
            await asyncio.sleep(10)
        except Exception as e: 
            print(f"⚠️ Error: {e}")
            await asyncio.sleep(10)

if __name__ == "__main__":
    try:
        import nest_asyncio
        nest_asyncio.apply()
    except:
        os.system("pip install -q nest_asyncio")
        import nest_asyncio
        nest_asyncio.apply()
        
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(main())
        else:
            asyncio.run(main())
    except:
        asyncio.run(main())
