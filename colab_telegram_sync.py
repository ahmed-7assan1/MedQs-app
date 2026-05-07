# ╔══════════════════════════════════════════════════════════════╗
# ║        MedOneX — Telegram Group Content Sync                ║
# ║   Uploads all module content to Group Topics automatically  ║
# ╚══════════════════════════════════════════════════════════════╝

# ─── Cell 1: Install Dependencies ───────────────────────────────────────────
# !pip install requests tqdm yt-dlp -q  # Uncomment if running in Google Colab

# ─── Cell 2: Configuration ──────────────────────────────────────────────────
import requests, os, time, json, re
from pathlib import Path
from tqdm import tqdm

# ── Fill these in ──
BOT_TOKEN    = "8730612796:AAEgChDIg9OU7-uSTffYeb_sjsE5kXGg9eY"   # Your bot token
GROUP_ID     = -1003146628517   # Your supergroup ID (negative number, must have Topics enabled)
API_BASE_URL = "https://medonex.vercel.app"                         # Your platform URL
SEMESTER_ID  = "PASTE_SEMESTER_ID_HERE"                             # Target semester ID
ADMIN_SECRET = ""   # Optional: admin API key if your routes require auth

WORK_DIR = "/content/medonex_files"
os.makedirs(WORK_DIR, exist_ok=True)

TG = f"https://api.telegram.org/bot{BOT_TOKEN}"
RATE_LIMIT_DELAY = 1.5   # seconds between Telegram API calls (avoid 429)

print("✅ Config loaded. Group:", GROUP_ID)

# ─── Cell 3: Telegram API Helper ────────────────────────────────────────────
def tg_call(method: str, data: dict = {}, files: dict = None, retry: int = 3):
    """Call Telegram Bot API with automatic retry on rate limits."""
    for attempt in range(retry):
        try:
            if files:
                r = requests.post(f"{TG}/{method}", data=data, files=files, timeout=120)
            else:
                r = requests.post(f"{TG}/{method}", json=data, timeout=30)
            
            result = r.json()
            if result.get('ok'):
                return result['result']
            
            # Handle rate limit
            if result.get('error_code') == 429:
                wait = result.get('parameters', {}).get('retry_after', 10)
                print(f"  ⏳ Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            
            # Other error
            print(f"  ⚠️ TG Error [{method}]: {result.get('description')}")
            return None
        except Exception as e:
            print(f"  ❌ Request failed: {e}")
            time.sleep(3)
    return None

def create_topic(name: str, color: int = 0x6FB9F0):
    """Create a forum topic in the group."""
    result = tg_call("createForumTopic", {
        "chat_id": GROUP_ID,
        "name": name[:128],  # Telegram limit
        "icon_color": color
    })
    if result:
        print(f"  📌 Topic created: '{name}' (thread_id={result['message_thread_id']})")
        return result['message_thread_id']
    return None

def send_text(thread_id: int, text: str, parse_mode: str = "Markdown"):
    time.sleep(RATE_LIMIT_DELAY)
    return tg_call("sendMessage", {
        "chat_id": GROUP_ID,
        "message_thread_id": thread_id,
        "text": text[:4096],
        "parse_mode": parse_mode,
        "disable_web_page_preview": True
    })

def send_file_to_tg(thread_id: int, file_path: str, caption: str = "", as_video: bool = False):
    """Upload a local file to a Telegram topic."""
    time.sleep(RATE_LIMIT_DELAY)
    method = "sendVideo" if as_video else "sendDocument"
    key    = "video"    if as_video else "document"
    
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if file_size_mb > 49:
        print(f"    ⚠️ File too large ({file_size_mb:.1f}MB), sending as link instead: {file_path}")
        return None
    
    with open(file_path, 'rb') as f:
        result = tg_call(method,
            data={"chat_id": GROUP_ID, "message_thread_id": thread_id, "caption": caption[:1024]},
            files={key: f}
        )
    return result

print("✅ Telegram helpers ready.")

# ─── Cell 4: Download Helper ─────────────────────────────────────────────────
def download_url(url: str, dest_path: str) -> bool:
    """Download any file from a URL to a local path."""
    if not url or url.strip() == "":
        return False
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    try:
        r = requests.get(url, stream=True, timeout=90, headers=headers)
        r.raise_for_status()
        
        total = int(r.headers.get('content-length', 0))
        with open(dest_path, 'wb') as f, tqdm(
            total=total, unit='B', unit_scale=True,
            desc=f"  ⬇️ {Path(dest_path).name}", leave=False
        ) as bar:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
                bar.update(len(chunk))
        return True
    except Exception as e:
        print(f"    ❌ Download failed [{url[:60]}...]: {e}")
        return False

def download_video_ytdlp(url: str, dest_dir: str, title: str) -> str | None:
    """Download video using yt-dlp (handles YouTube, Vimeo, etc.)"""
    import subprocess, glob
    safe_title = re.sub(r'[^\w\s-]', '', title)[:50]
    out_template = os.path.join(dest_dir, f"{safe_title}.%(ext)s")
    
    cmd = [
        "yt-dlp",
        "-f", "bestvideo[height<=720]+bestaudio/best[height<=720]/best",
        "--merge-output-format", "mp4",
        "-o", out_template,
        "--no-playlist",
        "--quiet", "--no-warnings",
        url
    ]
    try:
        subprocess.run(cmd, timeout=300, check=True)
        files = glob.glob(os.path.join(dest_dir, f"{safe_title}.*"))
        return files[0] if files else None
    except Exception as e:
        print(f"    ⚠️ yt-dlp failed for [{url[:50]}]: {e}")
        return None

print("✅ Download helpers ready.")

# ─── Cell 5: MedOneX API Fetcher ────────────────────────────────────────────
def api_get(path: str, params: dict = {}):
    """Fetch data from MedOneX API."""
    headers = {}
    if ADMIN_SECRET:
        headers['Authorization'] = f"Bearer {ADMIN_SECRET}"
    
    r = requests.get(f"{API_BASE_URL}{path}", params=params, headers=headers, timeout=30)
    if r.status_code == 200:
        return r.json()
    print(f"  ❌ API Error [{path}]: {r.status_code} — {r.text[:200]}")
    return None

def api_patch(path: str, data: dict):
    """Update data on MedOneX API."""
    headers = {'Content-Type': 'application/json'}
    if ADMIN_SECRET:
        headers['Authorization'] = f"Bearer {ADMIN_SECRET}"
    
    r = requests.patch(f"{API_BASE_URL}{path}", json=data, headers=headers, timeout=30)
    if r.status_code == 200:
        return r.json()
    print(f"  ❌ API Patch Error [{path}]: {r.status_code} — {r.text[:200]}")
    return None

def fetch_modules_with_content(semester_id: str):
    """Fetch all modules → subjects → lectures with files for a semester."""
    print(f"📡 Fetching modules for semester: {semester_id}")
    
    # Fetch modules
    modules_data = api_get("/api/v1/modules", {"semesterId": semester_id})
    if not modules_data:
        print("❌ Failed to fetch modules. Check your SEMESTER_ID and API.")
        return []
    
    modules = modules_data if isinstance(modules_data, list) else modules_data.get('modules', [])
    print(f"  Found {len(modules)} modules.")
    
    full_modules = []
    for mod in modules:
        mod_id = mod.get('id')
        mod_name = mod.get('name', 'Unknown Module')
        
        # Fetch subjects for this module
        subjects_data = api_get("/api/v1/subjects", {"moduleId": mod_id})
        subjects = subjects_data if isinstance(subjects_data, list) else (subjects_data or {}).get('subjects', [])
        
        full_subjects = []
        for sub in subjects:
            sub_id = sub.get('id')
            sub_name = sub.get('name', 'Unknown Subject')
            
            # Fetch lectures for this subject
            lectures_data = api_get("/api/v1/lectures", {"subjectId": sub_id})
            lectures = lectures_data if isinstance(lectures_data, list) else (lectures_data or {}).get('lectures', [])
            
            full_subjects.append({
                'id': sub_id,
                'name': sub_name,
                'lectures': lectures
            })
        
        full_modules.append({
            'id': mod_id,
            'name': mod_name,
            'subjects': full_subjects
        })
        print(f"  ✅ Module '{mod_name}': {len(subjects)} subjects")
    
    return full_modules

# Fetch all content
modules = fetch_modules_with_content(SEMESTER_ID)
print(f"\n✅ Total modules loaded: {len(modules)}")

# ─── Cell 6: Main Sync Engine ────────────────────────────────────────────────
# Icon colors for topics (cycles through)
TOPIC_COLORS = [0x6FB9F0, 0xFFD67E, 0xCB86DB, 0x8EEE98, 0xFF93B2, 0xFB6F5F]

def process_lecture(thread_id: int, lecture: dict, lec_num: int, mod_dir: str):
    """Download and upload all content of a single lecture."""
    lec_title = lecture.get('title', f'Lecture {lec_num}')
    lec_id    = lecture.get('id', '')
    
    # Fetch full lecture details if needed
    lec_detail = api_get(f"/api/v1/lectures/{lec_id}") if lec_id else lecture
    if not lec_detail:
        lec_detail = lecture
    
    videos  = lec_detail.get('videos', [])
    records = lec_detail.get('records', [])
    files   = lec_detail.get('files', [])
    
    lec_dir = os.path.join(mod_dir, re.sub(r'[^\w\s-]', '', lec_title)[:40])
    os.makedirs(lec_dir, exist_ok=True)
    
    print(f"    📚 Lecture: {lec_title}")
    
    # ── Send lecture header ──
    header = f"📝 *Lecture {lec_num}: {lec_title}*"
    send_text(thread_id, header)
    
    # ── Process Videos ──
    if videos:
        for i, vid in enumerate(videos):
            vid_title = vid.get('title', f'Video {i+1}')
            vid_url   = vid.get('url', '')
            
            print(f"      🎬 Video: {vid_title}")
            
            # Try yt-dlp first (handles YouTube, Vimeo, etc.)
            local_path = download_video_ytdlp(vid_url, lec_dir, vid_title)
            
            # If yt-dlp failed, try direct download
            if not local_path:
                ext = vid_url.split('.')[-1][:4] if '.' in vid_url else 'mp4'
                local_path_try = os.path.join(lec_dir, f"vid_{i+1}.{ext}")
                if download_url(vid_url, local_path_try):
                    local_path = local_path_try
            
            if local_path and os.path.exists(local_path):
                result = send_file_to_tg(thread_id, local_path, caption=f"🎬 {vid_title}", as_video=True)
                if not result:
                    # File too large — send link instead
                    send_text(thread_id, f"🎬 *{vid_title}*\n[Watch Video]({vid_url})")
                try:
                    os.remove(local_path)  # Free space
                except:
                    pass
            else:
                # Can't download — send link
                send_text(thread_id, f"🎬 *{vid_title}*\n[Watch Video]({vid_url})")
    
    # ── Process Records (Audio) ──
    if records:
        for i, rec in enumerate(records):
            rec_title = rec.get('title', f'Record {i+1}')
            rec_url   = rec.get('url', '')
            
            print(f"      🎙 Record: {rec_title}")
            
            ext = 'mp3'
            local_path = os.path.join(lec_dir, f"rec_{i+1}.{ext}")
            
            if download_url(rec_url, local_path):
                result = send_file_to_tg(thread_id, local_path, caption=f"🎙 {rec_title}")
                if not result:
                    send_text(thread_id, f"🎙 *{rec_title}*\n[Listen]({rec_url})")
                try:
                    os.remove(local_path)
                except:
                    pass
            else:
                send_text(thread_id, f"🎙 *{rec_title}*\n[Listen]({rec_url})")
    
    # ── Process Files (PDFs, Docs) ──
    if files:
        for i, fil in enumerate(files):
            fil_name = fil.get('name', f'File {i+1}')
            fil_url  = fil.get('url', '')
            
            print(f"      📄 File: {fil_name}")
            
            # Determine extension from URL or mimeType
            mime = fil.get('mimeType', '')
            if 'pdf' in mime or fil_url.lower().endswith('.pdf'):
                ext = 'pdf'
            elif 'word' in mime or fil_url.lower().endswith('.docx'):
                ext = 'docx'
            elif 'powerpoint' in mime or fil_url.lower().endswith('.pptx'):
                ext = 'pptx'
            else:
                ext = fil_url.split('.')[-1].split('?')[0][:5] or 'bin'
            
            local_path = os.path.join(lec_dir, f"{re.sub(r'[^\w]', '_', fil_name)[:30]}.{ext}")
            
            if download_url(fil_url, local_path):
                result = send_file_to_tg(thread_id, local_path, caption=f"📄 {fil_name}")
                if not result:
                    send_text(thread_id, f"📄 *{fil_name}*\n[Download]({fil_url})")
                try:
                    os.remove(local_path)
                except:
                    pass
            else:
                send_text(thread_id, f"📄 *{fil_name}*\n[Download]({fil_url})")
    
    if not videos and not records and not files:
        send_text(thread_id, "_No attachments for this lecture._")
    
    send_text(thread_id, "─" * 20)  # Divider

def sync_module_to_group(module: dict, color: int):
    """Create a topic for a module and upload all its content."""
    mod_name = module['name']
    subjects  = module.get('subjects', [])
    
    print(f"\n{'='*60}")
    print(f"📦 Module: {mod_name} ({len(subjects)} subjects)")
    
    # Create topic
    thread_id = create_topic(mod_name, color)
    if not thread_id:
        print(f"  ❌ Failed to create topic for '{mod_name}'. Skipping.")
        return
    
    time.sleep(1)
    
    # Module intro message
    intro = f"📦 *{mod_name}*\n\n"
    intro += f"This topic contains all content for the {mod_name} module.\n"
    intro += f"📚 Subjects: {len(subjects)}\n"
    total_lec = sum(len(s.get('lectures', [])) for s in subjects)
    intro += f"📝 Total Lectures: {total_lec}\n\n"
    intro += "_Content uploaded automatically by MedOneX Bot 🤖_"
    send_text(thread_id, intro)
    
    # Create module directory
    mod_dir = os.path.join(WORK_DIR, re.sub(r'[^\w\s-]', '', mod_name)[:30])
    os.makedirs(mod_dir, exist_ok=True)
    
    for sub in subjects:
        sub_name = sub['name']
        lectures = sub.get('lectures', [])
        
        print(f"\n  📖 Subject: {sub_name} ({len(lectures)} lectures)")
        
        # Subject header
        sub_header = f"\n\n📖 *{sub_name}*\n{'─'*30}\n"
        if lectures:
            sub_header += "\n".join([f"  {i+1}. {lec.get('title','Lecture')}" for i, lec in enumerate(lectures)])
        send_text(thread_id, sub_header)
        
        for i, lec in enumerate(lectures):
            process_lecture(thread_id, lec, i+1, mod_dir)
    
    print(f"\n✅ Module '{mod_name}' synced successfully!")

# ─── Cell 7: Real-time Migration Worker ───────────────────────────────────────
def run_migration_worker():
    """Polls the API for pending YouTube migration tasks and processes them."""
    print(f"\n{'='*60}")
    print("🤖 STARTING REAL-TIME MIGRATION WORKER")
    print(f"📡 API: {API_BASE_URL}")
    print(f"📢 Target Group: {GROUP_ID}")
    print("='*60}\n")

    while True:
        try:
            # 1. Fetch pending tasks
            tasks = api_get("/api/v1/admin/migration-tasks", {"status": "PENDING"})
            if not tasks or len(tasks) == 0:
                print("  💤 No pending tasks. Waiting 30s...")
                time.sleep(30)
                continue

            for task in tasks:
                task_id = task['id']
                title = task.get('title', 'Video')
                url = task['sourceUrl']

                print(f"🚀 Processing Task: {title} ({url})")
                
                # 2. Mark as processing
                api_patch("/api/v1/admin/migration-tasks", {"id": task_id, "status": "PROCESSING"})

                # 3. Download from YouTube
                local_path = download_video_ytdlp(url, WORK_DIR, title)
                
                if local_path and os.path.exists(local_path):
                    # 4. Upload to Telegram
                    # Note: We send to the main chat or a specific thread if needed.
                    # Defaulting to thread 1 (General) if not specified
                    result = send_file_to_tg(1, local_path, caption=f"🎬 {title}", as_video=True)
                    
                    if result:
                        print(f"  ✅ Uploaded to Telegram! Msg ID: {result['message_id']}")
                        # 5. Update task as completed
                        api_patch("/api/v1/admin/migration-tasks", {
                            "id": task_id, 
                            "status": "COMPLETED",
                            "telegramMessageId": result['message_id'],
                            "telegramChatId": str(GROUP_ID)
                        })
                    else:
                        print("  ❌ Telegram upload failed.")
                        api_patch("/api/v1/admin/migration-tasks", {"id": task_id, "status": "FAILED", "error": "Telegram upload failed (likely too large)"})
                    
                    try: os.remove(local_path)
                    except: pass
                else:
                    print("  ❌ YouTube download failed.")
                    api_patch("/api/v1/admin/migration-tasks", {"id": task_id, "status": "FAILED", "error": "YouTube download failed (yt-dlp error)"})
                
                time.sleep(2)
        
        except Exception as e:
            print(f"💥 Worker Crash: {e}")
            time.sleep(60)

# To run the worker, uncomment the line below:
# run_migration_worker()

# ─── Cell 8: Legacy Full Sync (Run once) ─────────────────────────────────────
def run_full_sync():
    print("🚀 Starting MedOneX → Telegram Group Full Sync...")
    for idx, module in enumerate(modules):
        color = TOPIC_COLORS[idx % len(TOPIC_COLORS)]
        sync_module_to_group(module, color)
        time.sleep(2)
    print("\n🎉 FULL SYNC COMPLETE!")

# run_full_sync()
