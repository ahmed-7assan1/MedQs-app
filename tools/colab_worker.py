# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║          MedOneX — Colab YouTube Transfer Worker                            ║
# ║  يعمل على سيرفرات Google Colab — لا تحميل على سيرفر موقعك                  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# 📌 طريقة الاستخدام:
# 1. افتح هذا الملف في Google Colab
# 2. عدّل SITE_URL و COLAB_SECRET في Cell 2
# 3. اضغط Runtime → Run all
# 4. الـ worker هيشتغل ويراقب الـ queue أوتوماتيك

# ─────────────────────────────────────────────────────────────────────────────
# CELL 1: Install dependencies
# ─────────────────────────────────────────────────────────────────────────────
# !pip install -q yt-dlp google-auth google-auth-oauthlib google-api-python-client

import subprocess
subprocess.run(["pip", "install", "-q", "yt-dlp", "google-auth", "google-auth-oauthlib", "google-api-python-client"], check=True)

import os
import time
import json
import requests
import yt_dlp
from datetime import datetime
from pathlib import Path

print("✅ Dependencies installed")

# ─────────────────────────────────────────────────────────────────────────────
# CELL 2: ⚙️ CONFIG — Edit these values
# ─────────────────────────────────────────────────────────────────────────────

SITE_URL = "https://medonex.vercel.app"   # تم التحديث لرابط موقعك الأونلاين
COLAB_SECRET = "medqs-colab-secret-2026-change-this"  # تأكد أن هذا يطابق الموجود في Vercel Env

# YouTube Upload Config (اختياري — لو مش عايز ترفع على يوتيوب، اتركه فاضي)
# لو فاضي، الـ worker هيعمل download بس ويبعت رابط R2/Storage أو يسكيب الـ upload
YOUTUBE_CLIENT_SECRETS = ""  # path to client_secrets.json (اتركه فاضي مبدئياً)

POLL_INTERVAL = 15  # seconds between polls
DOWNLOAD_DIR = "/tmp/colab_downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

HEADERS = {
    "x-colab-secret": COLAB_SECRET,
    "Content-Type": "application/json",
}

print(f"⚙️  Site: {SITE_URL}")
print(f"🔑 Secret: {'*' * len(COLAB_SECRET)}")
print(f"⏱️  Poll interval: {POLL_INTERVAL}s")


# ─────────────────────────────────────────────────────────────────────────────
# CELL 3: Helper functions
# ─────────────────────────────────────────────────────────────────────────────

def log(job_id: str, message: str) -> None:
    ts = datetime.utcnow().strftime("%H:%M:%S")
    line = f"[{ts}] {message}"
    print(line)
    try:
        requests.patch(
            f"{SITE_URL}/api/v1/admin/colab/jobs/{job_id}",
            headers=HEADERS,
            json={"logs": [line]},
            timeout=10,
        )
    except Exception as e:
        print(f"⚠️  Failed to send log: {e}")


def update_job(job_id: str, **kwargs) -> None:
    try:
        requests.patch(
            f"{SITE_URL}/api/v1/admin/colab/jobs/{job_id}",
            headers=HEADERS,
            json=kwargs,
            timeout=10,
        )
    except Exception as e:
        print(f"⚠️  Failed to update job {job_id}: {e}")


def claim_job() -> dict | None:
    """Poll the server for the next PENDING job."""
    try:
        res = requests.get(
            f"{SITE_URL}/api/v1/admin/colab/jobs",
            headers=HEADERS,
            timeout=10,
        )
        if res.status_code == 200:
            return res.json().get("job")
    except Exception as e:
        print(f"⚠️  Poll failed: {e}")
    return None


def download_video(job_id: str, url: str) -> str | None:
    """Download video using yt-dlp. Returns the local file path."""
    out_path = os.path.join(DOWNLOAD_DIR, f"{job_id}.%(ext)s")

    class ProgressLogger:
        def debug(self, msg): pass
        def info(self, msg): pass
        def warning(self, msg): print(msg)
        def error(self, msg): print(msg)

    def progress_hook(d):
        if d["status"] == "downloading":
            pct_str = d.get("_percent_str", "0%").strip().replace("%", "")
            try:
                pct = int(float(pct_str) * 0.7)  # download = 0→70%
                update_job(job_id, progress=pct)
            except:
                pass
        elif d["status"] == "finished":
            log(job_id, f"✅ Download complete: {d['filename']}")

    ydl_opts = {
        "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl": out_path,
        "merge_output_format": "mp4",
        "logger": ProgressLogger(),
        "progress_hooks": [progress_hook],
        "quiet": True,
    }

    try:
        if job:
            job_id, source_url = job['id'], job['sourceUrl']
            
            # تحسين روابط تيليجرام للسحب
            if "t.me/" in source_url and "/s/" not in source_url:
                source_url = source_url.replace("t.me/", "t.me/s/")
                
            log_to_site(job_id, f"🎬 New Task: {source_url}")
            
            # استخراج معلومات الفيديو
            title = "MedOneX Video"
            thumb_url = None
            try:
                with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True}) as ydl:
                    info = ydl.extract_info(source_url, download=False)
                    if info:
                        title = info.get('title') or info.get('description', 'Telegram Video')[:50]
                        thumb_url = info.get('thumbnail')
            except Exception as e:
                print(f"⚠️ Metadata extraction failed (Normal for some Telegram links): {e}")

            update_job(job_id, status="PROCESSING", progress=10, title=title)
    except Exception as e:
        log(job_id, f"❌ Download failed: {e}")
        return None


def upload_to_youtube(job_id: str, file_path: str, title: str) -> str | None:
    """
    Upload a video to YouTube using the YouTube Data API v3.
    Requires YouTube credentials to be configured.
    
    Returns the YouTube video URL if successful, None otherwise.
    """
    if not YOUTUBE_CLIENT_SECRETS or not os.path.exists(YOUTUBE_CLIENT_SECRETS):
        log(job_id, "⚠️  YouTube credentials not configured. Skipping upload.")
        log(job_id, "💡 Set YOUTUBE_CLIENT_SECRETS to your client_secrets.json path to enable upload.")
        return None

    try:
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        from google_auth_oauthlib.flow import InstalledAppFlow
        import google.oauth2.credentials

        SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
        flow = InstalledAppFlow.from_client_secrets_file(YOUTUBE_CLIENT_SECRETS, SCOPES)
        credentials = flow.run_local_server(port=0)
        youtube = build("youtube", "v3", credentials=credentials)

        log(job_id, f"📤 Uploading to YouTube: {title}")
        update_job(job_id, progress=75)

        media = MediaFileUpload(file_path, chunksize=-1, resumable=True)
        request = youtube.videos().insert(
            part="snippet,status",
            body={
                "snippet": {"title": title, "description": "Uploaded by MedOneX Colab Worker"},
                "status": {"privacyStatus": "unlisted"},
            },
            media_body=media,
        )

        response = None
        while response is None:
            status, response = request.next_chunk()
            if status:
                pct = 75 + int(status.progress() * 25)
                update_job(job_id, progress=pct)

        video_id = response.get("id")
        if video_id:
            url = f"https://www.youtube.com/watch?v={video_id}"
            log(job_id, f"✅ Uploaded! {url}")
            return url

    except Exception as e:
        log(job_id, f"❌ YouTube upload failed: {e}")
    return None


def process_job(job: dict) -> None:
    job_id = job["id"]
    source_url = job["sourceUrl"]
    title = job.get("title") or "MedOneX Video"

    log(job_id, f"🎬 Starting job: {title}")
    log(job_id, f"📡 Source: {source_url}")

    # Step 1: Download
    log(job_id, "⬇️  Downloading video...")
    update_job(job_id, progress=5)
    file_path = download_video(job_id, source_url)

    if not file_path or not os.path.exists(file_path):
        update_job(job_id, status="FAILED", error="Download failed — yt-dlp could not fetch the video.", progress=0)
        return

    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    log(job_id, f"📦 File size: {file_size_mb:.1f} MB")
    update_job(job_id, progress=70)

    # Step 2: Upload to YouTube (if credentials configured)
    new_url = upload_to_youtube(job_id, file_path, title)

    # If no YouTube upload, use the source URL as-is (or you could upload to R2)
    if not new_url:
        log(job_id, "ℹ️  No YouTube upload — job marked complete with original URL.")
        new_url = source_url

    # Step 3: Report completion
    update_job(job_id, status="COMPLETED", progress=100, newVideoUrl=new_url)
    log(job_id, f"🎉 Job COMPLETED! URL: {new_url}")

    # Cleanup downloaded file
    try:
        os.remove(file_path)
        log(job_id, "🧹 Temp file cleaned up")
    except:
        pass


# ─────────────────────────────────────────────────────────────────────────────
# CELL 4: 🚀 Main polling loop — Run this to start the worker
# ─────────────────────────────────────────────────────────────────────────────

print("=" * 60)
print("🚀 MedOneX Colab Worker Started")
print(f"   Watching: {SITE_URL}")
print(f"   Polling every {POLL_INTERVAL}s")
print("   Press Runtime > Interrupt to stop")
print("=" * 60)

while True:
    try:
        job = claim_job()

        if job is None:
            print(f"[{datetime.utcnow().strftime('%H:%M:%S')}] 💤 No pending jobs. Sleeping {POLL_INTERVAL}s...")
            time.sleep(POLL_INTERVAL)
            continue

        print(f"\n{'='*50}")
        print(f"📋 Job claimed: {job.get('title') or job['id']}")
        print(f"{'='*50}")

        process_job(job)

    except KeyboardInterrupt:
        print("\n⛔ Worker stopped by user.")
        break
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        time.sleep(POLL_INTERVAL)
