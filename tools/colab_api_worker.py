"""
colab_api_worker.py — YouTube Upload Worker (NO Selenium)
Uses YouTube Data API v3 with embedded OAuth2 credentials.
Run this in Google Colab — first run asks for browser auth once, then saves token forever.
"""

import os, sys, re, time, json, shutil, asyncio, subprocess, requests

# ── CONFIG ───────────────────────────────────────────────────
SITE_URL    = "https://medonex.vercel.app"
BATCH_LIMIT = 40

# Embedded OAuth2 credentials (New Channel)
CLIENT_CONFIG = {
    "installed": {
        "client_id":     os.getenv("YT_CLIENT_ID", "YOUR_CLIENT_ID"),
        "client_secret": os.getenv("YT_CLIENT_SECRET", "YOUR_CLIENT_SECRET"),
        "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
        "token_uri":     "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost"],
    }
}

# Token saved here — persists between Colab runs via Drive
TOKEN_DRIVE = "/content/drive/MyDrive/yt_upload_token_v2.json"
TOKEN_LOCAL = "/content/yt_upload_token_v2.json"

# Telegram Bot Config
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TG_API_ID = int(os.getenv("TG_API_ID", "0"))
TG_API_HASH = os.getenv("TG_API_HASH", "")
TELEGRAM_CHAT_ID   = ""  # To be dynamically fetched or passed
# ────────────────────────────────────────────────────────────

SUCCESSFUL_UPLOADS = 0
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]


# ── INSTALL ──────────────────────────────────────────────────
def install_dependencies():
    if not os.path.exists("/content"): return
    print("📦  Installing libraries …")
    os.system("pip install -q --upgrade yt-dlp "
              "google-auth google-auth-oauthlib "
              "google-auth-httplib2 google-api-python-client "
              "pyrogram tgcrypto")
    print("✅  Libraries ready.")


# ── GOOGLE DRIVE ─────────────────────────────────────────────
def mount_drive():
    if not os.path.exists("/content"): return
    try:
        from google.colab import drive
        if not os.path.ismount("/content/drive"):
            drive.mount("/content/drive", force_remount=False)
        print("✅  Google Drive mounted.")
    except Exception as e:
        print(f"⚠️  Drive not mounted: {e}")


def _token_path():
    """Return the best available token path."""
    if os.path.exists(TOKEN_DRIVE): return TOKEN_DRIVE
    if os.path.exists(TOKEN_LOCAL): return TOKEN_LOCAL
    return None


def _save_token(creds):
    data = {
        "token":         creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri":     creds.token_uri,
        "client_id":     creds.client_id,
        "client_secret": creds.client_secret,
        "scopes":        list(creds.scopes or SCOPES),
    }
    for path in [TOKEN_DRIVE, TOKEN_LOCAL]:
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w") as f:
                json.dump(data, f, indent=2)
            print(f"💾  Token saved → {path}")
            return
        except Exception:
            pass


def _load_token():
    from google.oauth2.credentials import Credentials
    path = _token_path()
    if not path: return None
    try:
        with open(path) as f:
            d = json.load(f)
        return Credentials(
            token         = d.get("token"),
            refresh_token = d.get("refresh_token"),
            token_uri     = d.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id     = d.get("client_id"),
            client_secret = d.get("client_secret"),
            scopes        = d.get("scopes", SCOPES),
        )
    except Exception as e:
        print(f"⚠️  Could not load token: {e}")
        return None


# ── OAUTH2 AUTHENTICATION ────────────────────────────────────
def authenticate_youtube():
    """
    Returns an authenticated YouTube API service.
    Uses saved token if valid, otherwise runs the OAuth flow.
    First-time: opens a URL for you to approve in your browser.
    """
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import InstalledAppFlow
    import googleapiclient.discovery

    print("\n🔐  Authenticating with YouTube API …")

    creds = _load_token()

    # Refresh expired token
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            print("✅  Token refreshed!")
            _save_token(creds)
        except Exception as e:
            print(f"⚠️  Refresh failed: {e} — re-authenticating …")
            creds = None

    if creds and creds.valid:
        print("✅  Using saved token — no login needed!\n")
    else:
        # First-time / expired: OAuth2 flow
        print("\n" + "="*60)
        print("🌐  ONE-TIME AUTHORIZATION REQUIRED")
        print("="*60)

        # Write temp secrets file (from embedded config)
        tmp_secrets = "/tmp/yt_client_secrets.json"
        with open(tmp_secrets, "w") as f:
            json.dump(CLIENT_CONFIG, f)

        REDIRECT_URI = "http://localhost"

        flow = InstalledAppFlow.from_client_secrets_file(tmp_secrets, SCOPES)
        flow.redirect_uri = REDIRECT_URI   # set once here — do NOT pass again below

        # Generate auth URL (redirect_uri already set on flow object)
        auth_url, _ = flow.authorization_url(
            access_type = "offline",
            prompt      = "consent",
        )

        print(f"\n🔗  Open this URL in your browser:\n")
        print(f"    {auth_url}\n")
        print("📋  Steps:")
        print("    1. Open the link above in Chrome")
        print("    2. Choose your Google account & click Allow")
        print("    3. Your browser will redirect to http://localhost (page won't load — that's OK!)")
        print("    4. Copy the FULL URL from the browser address bar")
        print("    5. Paste it below ↓\n")

        raw = input("⌨️  Paste the redirect URL (or just the code): ").strip()

        # Accept either the full redirect URL or just the code
        code = raw
        import urllib.parse as _up
        if raw.startswith("http"):
            parsed = _up.urlparse(raw)
            params = _up.parse_qs(parsed.query)
            code = params.get("code", [raw])[0]
            print(f"   ✅  Extracted code from URL.")

        flow.fetch_token(code=code)   # redirect_uri already on flow object
        creds = flow.credentials
        _save_token(creds)
        print("\n✅  Authorization complete! Token saved forever.\n")

    service = googleapiclient.discovery.build(
        "youtube", "v3",
        credentials=creds,
        cache_discovery=False,
    )
    print("✅  YouTube API ready!\n")
    return service


# ── UPLOAD VIA API ───────────────────────────────────────────
def upload_via_api(service, file_path: str, title: str) -> str | None:
    import googleapiclient.http

    print(f"\n📤  Uploading: {title}")
    file_size = os.path.getsize(file_path)

    body = {
        "snippet": {
            "title":       title[:100],
            "description": "",  # Empty description as requested
            "tags":        ["MedOneX", "lecture", "education"],
            "categoryId":  "27",   # Education
        },
        "status": {
            "privacyStatus":           "unlisted",
            "selfDeclaredMadeForKids": False,
        },
    }

    media = googleapiclient.http.MediaFileUpload(
        file_path,
        mimetype  = "video/mp4",
        chunksize = 5 * 1024 * 1024,   # 5 MB
        resumable = True,
    )

    req = service.videos().insert(part="snippet,status", body=body, media_body=media)

    response   = None
    last_pct   = -1
    start_time = time.time()

    while response is None:
        try:
            status, response = req.next_chunk()
        except Exception as e:
            print(f"\n❌  Chunk error: {e}")
            raise

        if status:
            pct        = int(status.progress() * 100)
            elapsed    = max(time.time() - start_time, 0.1)
            done_mb    = (file_size * status.progress()) / 1024 / 1024
            total_mb   = file_size / 1024 / 1024
            speed      = done_mb / elapsed
            if pct != last_pct:
                sys.stdout.write(
                    f"\r📊  {pct}%  ({done_mb:.1f}/{total_mb:.1f} MB)  "
                    f"@ {speed:.1f} MB/s    "
                )
                sys.stdout.flush()
                last_pct = pct

    print(f"\n✅  Upload complete!")
    video_id  = response.get("id")
    video_url = f"https://youtu.be/{video_id}"
    print(f"🎉  Published: {video_url}")

    # ── Upload Thumbnail if available ──
    base_name = os.path.splitext(file_path)[0]
    thumb_path = None
    for ext in [".jpg", ".webp", ".png", ".jpeg"]:
        if os.path.exists(base_name + ext):
            thumb_path = base_name + ext
            break

    if thumb_path:
        try:
            print(f"🖼️  Uploading thumbnail...")
            service.thumbnails().set(
                videoId=video_id,
                media_body=googleapiclient.http.MediaFileUpload(thumb_path)
            ).execute()
            print("✅  Thumbnail uploaded.")
        except Exception as e:
            print(f"⚠️  Could not upload thumbnail: {e}")

    return video_url


# ── DOWNLOAD ─────────────────────────────────────────────────
def download_video(url: str, out_path: str) -> bool:
    print(f"⬇️  Downloading: {url}")
    os.system("pip install -q --upgrade yt-dlp")

    base = ["yt-dlp", "--no-playlist", "--force-overwrites",
            "--retries", "5", "--fragment-retries", "5",
            "--write-thumbnail",   # Download thumbnail automatically
            "--merge-output-format", "mp4", "-o", out_path]

    strategies = []
    
    # YouTube-specific strategies to bypass protections
    if "youtu" in url:
        strategies.extend([
            base + ["--extractor-args", "youtube:player_client=ios",
                    "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best", url],
            base + ["--extractor-args", "youtube:player_client=android",
                    "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best", url],
            base + ["--extractor-args", "youtube:player_client=tv_embedded", url],
        ])
        
    # Default strategy for YouTube fallback AND Telegram / other links
    strategies.append(base + ["-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best", url])
    strategies.append(["yt-dlp", "--no-playlist", "--force-overwrites", "--write-thumbnail", "-o", out_path, url])

    def _find():
        for d in [".", "/tmp", "/content"]:
            if not os.path.isdir(d): continue
            for f in sorted(os.listdir(d)):
                full = os.path.join(d, f)
                if f.endswith((".mp4",".mkv",".webm",".m4v")) and os.path.getsize(full) > 10_000:
                    if full != out_path: shutil.move(full, out_path)
                    print(f"✅  {os.path.getsize(out_path)/1024/1024:.1f} MB")
                    return True
        return False

    for i, cmd in enumerate(strategies, 1):
        print(f"🔄  Strategy {i}/{len(strategies)} …")
        r = subprocess.run(cmd, capture_output=True, text=True)
        if os.path.exists(out_path) and os.path.getsize(out_path) > 10_000:
            print(f"✅  {os.path.getsize(out_path)/1024/1024:.1f} MB"); return True
        if _find(): return True
        print(f"⚠️  {(r.stderr or r.stdout or '')[:250].strip()}")

    print("❌  All download strategies failed.")
    return False


# ── API HELPERS ──────────────────────────────────────────────
def update_job(job_id, status, progress=0, error=None, new_url=None):
    try:
        requests.patch(
            f"{SITE_URL}/api/v1/admin/youtube-sync/{job_id}",
            json={"status": status, "progress": progress,
                  "error": error, "newVideoUrl": new_url},
            timeout=10,
        )
    except Exception:
        pass


def fetch_next_job():
    try:
        r = requests.get(f"{SITE_URL}/api/v1/admin/colab/jobs?colab=true", timeout=10)
        if r.status_code == 200:
            return r.json().get("job")
    except Exception:
        pass
    return None


# ── TELEGRAM ─────────────────────────────────────────────────
async def upload_to_telegram_group(file_path: str, title: str, is_video: bool):
    if not TELEGRAM_BOT_TOKEN or not TG_API_ID:
        return
    
    from pyrogram import Client
    print(f"✈️  Uploading to Telegram: {title}")
    
    app = Client("my_bot", api_id=TG_API_ID, api_hash=TG_API_HASH, bot_token=TELEGRAM_BOT_TOKEN, in_memory=True)
    await app.start()
    
    chat_id = TELEGRAM_CHAT_ID
    if not chat_id:
        print("⚠️  TELEGRAM_CHAT_ID is empty! Let me fetch your recent groups...")
        async for dialog in app.get_dialogs():
            if dialog.chat.type in ["group", "supergroup", "channel"]:
                print(f"    - {dialog.chat.title} | ID: {dialog.chat.id}")
        
        # Try to upload to the first found supergroup if empty, or just fail
        chat_id = -100 # Change manually
        print("Please set TELEGRAM_CHAT_ID manually. Skipping Telegram upload for now.")
        await app.stop()
        return

    try:
        # progress callback
        async def progress(current, total):
            pct = int(current * 100 / total)
            sys.stdout.write(f"\r✈️  Telegram Upload: {pct}% ")
            sys.stdout.flush()

        if is_video:
            await app.send_video(chat_id, video=file_path, caption=title, file_name=title+".mp4", progress=progress)
        else:
            ext = os.path.splitext(file_path)[1] or ".pdf"
            await app.send_document(chat_id, document=file_path, caption=title, file_name=title+ext, progress=progress)
        print("\n✅  Telegram upload successful.")
    except Exception as e:
        print(f"\n❌  Telegram upload failed: {e}")
    finally:
        await app.stop()


# ── JOB PROCESSOR ────────────────────────────────────────────
async def process_job(job: dict, service):
    global SUCCESSFUL_UPLOADS
    job_id    = job["id"]
    video_url = job["sourceUrl"]
    title     = job.get("title", "Synced Video")
    
    metadata = {}
    try:
        if job.get("entityId"):
            metadata = json.loads(job["entityId"])
    except:
        pass
        
    is_video = metadata.get("type", "video") == "video"
    local     = "/tmp/video_upload" + (".mp4" if is_video else ".pdf")

    print(f"\n{'='*55}\n🎬  {title} [{'VIDEO' if is_video else 'FILE'}]\n{'='*55}")
    update_job(job_id, status="DOWNLOADING", progress=10)

    try:
        for ext in [".mp4", ".pdf", ".mkv", ".jpg"]:
            if os.path.exists("/tmp/video_upload" + ext): os.remove("/tmp/video_upload" + ext)

        if not download_video(video_url, local):
            raise RuntimeError("Download failed.")
            
        # Find the actual downloaded file (yt-dlp might change extension)
        actual_local = local
        for ext in [".mp4", ".pdf", ".mkv", ".webm", ".m4a", ".jpg", ".png", ".webp"]:
            if os.path.exists("/tmp/video_upload" + ext):
                actual_local = "/tmp/video_upload" + ext
                break

        update_job(job_id, status="UPLOADING", progress=40)
        
        # 1. Upload to Telegram
        await upload_to_telegram_group(actual_local, title, is_video)
        
        # 2. Upload to YouTube (Only if it's a video)
        new_url = "https://t.me/" # Fallback for files
        if is_video:
            new_url = upload_via_api(service, actual_local, title)
            if not new_url: raise RuntimeError("YouTube Upload returned no URL.")

        update_job(job_id, status="COMPLETED", progress=100, new_url=new_url)
        SUCCESSFUL_UPLOADS += 1
        print(f"✅  Done! ({SUCCESSFUL_UPLOADS}/{BATCH_LIMIT})")

    except Exception as e:
        print(f"❌  {e}")
        update_job(job_id, status="FAILED", error=str(e))
    finally:
        for ext in [".mp4", ".pdf", ".mkv", ".webm", ".m4a", ".jpg", ".png", ".webp"]:
            if os.path.exists("/tmp/video_upload" + ext): os.remove("/tmp/video_upload" + ext)


# ── MAIN LOOP ────────────────────────────────────────────────
async def main():
    global SUCCESSFUL_UPLOADS
    print("🚀  MedOneX API Worker (No Selenium) — starting …\n")
    install_dependencies()
    mount_drive()

    service = authenticate_youtube()

    while True:
        if SUCCESSFUL_UPLOADS >= BATCH_LIMIT:
            print(f"\n🛑  Batch limit ({BATCH_LIMIT}) reached."); break
        job = fetch_next_job()
        if job:
            await process_job(job, service)
        else:
            sys.stdout.write("."); sys.stdout.flush()
        await asyncio.sleep(10)


# ── ENTRY POINT ──────────────────────────────────────────────
if __name__ == "__main__":
    try:
        import nest_asyncio
    except ImportError:
        os.system("pip install -q nest_asyncio"); import nest_asyncio
    nest_asyncio.apply()

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⏹️  Stopped.")
    except Exception as e:
        print(f"\n💥  Critical error: {e}")
