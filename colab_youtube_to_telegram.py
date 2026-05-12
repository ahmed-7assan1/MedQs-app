"""
╔══════════════════════════════════════════════════════════════════════════════╗
║       MedOneX — YouTube → Telegram Video Migration Engine                  ║
║       Version: 3.0 | For Google Colab                                       ║
║                                                                              ║
║  الوظيفة: نقل جميع فيديوهات YouTube من قاعدة البيانات إلى مجموعة Telegram  ║
║  وتحديث روابطها تلقائياً في الموقع بعد النقل                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

# ════════════════════════════════════════════════════════════════════
# CELL 1: تثبيت المكتبات المطلوبة
# ════════════════════════════════════════════════════════════════════

# !pip install -q yt-dlp telethon requests psycopg2-binary python-dotenv tqdm

print("✅ تم تثبيت جميع المكتبات بنجاح")


# ════════════════════════════════════════════════════════════════════
# CELL 2: الإعدادات — أدخل بياناتك هنا
# ════════════════════════════════════════════════════════════════════

# ─── إعدادات قاعدة البيانات ───────────────────────────────────────
DATABASE_URL = "postgresql://neondb_owner:npg_Czpu9n0bKVOr@ep-fragrant-breeze-ag45pn3j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# ─── إعدادات Telegram API ─────────────────────────────────────────
# من: https://my.telegram.org/apps
TELEGRAM_API_ID   = 34818218
TELEGRAM_API_HASH = "37f1c08f94e73484142b168165623df7"
TELEGRAM_PHONE    = ""  # ← أدخل رقم هاتفك (مثال: +201012345678)

# معرف المجموعة التي سترفع إليها الفيديوهات (مثال: -1003146628517)
TARGET_GROUP_ID   = -1003146628517

# String Session موجود بالفعل في .env — ضعه هنا مباشرة
TELEGRAM_STRING_SESSION = "1BAAOMTQ5LjE1NC4xNjcuOTEAUK4Fwj+3FqWXQbISlYd59pcyCPhG5Bd8DMfmjRFPZnl6ZXS3tiRc57HEw25q+L0kKtUuoIf1fZKKgSjALYKaiFUpRMI93QPvsYnZ72Q+YMBoM7dHgC5KDOWWn3TkbgzDq6Kgf9Ayf0zz3J1O1yFzDaYgXiqKAb5vZjbawJyNgBw1UT3BGz3gYJQ8ilgRDoXqbsOaGAAOAVqi2ZtcWrhb7jiPRVbjVgyQoF8yihdS6r+tQ8POfeF3DN9ALd56S1xSrxDjAUobsXqqZEuW0N0IK3QYD+YuMfFVFl070Ca099ML6lXyLWUojLZYFra4scDKbYX+j5AlHbTQVRamMctZIaw="

# ─── إعدادات الموقع (لتحديث الروابط بعد الرفع) ──────────────────
# رابط API الموقع لتحديث الفيديو بعد الرفع
SITE_API_URL     = "https://your-vercel-app.vercel.app"  # ← غيّر هذا
SITE_BOT_TOKEN   = ""  # اختياري — TELEGRAM_BOT_TOKEN من .env

# ─── فلاتر (اتركها فارغة لنقل الكل) ────────────────────────────
# مثال: "semester-uuid-here" لنقل سمستر محدد فقط
FILTER_SEMESTER_ID = ""  # اتركه فارغاً للكل

# الحد الأقصى لعدد الفيديوهات (0 = بلا حد)
MAX_VIDEOS = 0

# ─── إعدادات ملف الكوكيز (لحل مشكلة حظر YouTube) ─────────────────
# قم بتصدير ملف cookies.txt من متصفحك وضعه في المجلد الرئيسي
COOKIES_FILE = "cookies.txt"  # اتركه فارغاً إذا لم تكن تحتاجه

print("✅ تم تحميل الإعدادات")


# ════════════════════════════════════════════════════════════════════
# CELL 3: الاتصال بقاعدة البيانات وجلب الفيديوهات
# ════════════════════════════════════════════════════════════════════

import psycopg2
import psycopg2.extras
import json

def get_db_connection():
    """إنشاء اتصال بقاعدة البيانات"""
    return psycopg2.connect(DATABASE_URL)

def fetch_youtube_videos():
    """
    جلب جميع فيديوهات YouTube من قاعدة البيانات مع البيانات الكاملة:
    عنوان المحاضرة، المادة، المدرس، الجامعة، رقم السمستر
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    semester_filter = ""
    params = []

    if FILTER_SEMESTER_ID:
        semester_filter = "AND sem.id = %s"
        params.append(FILTER_SEMESTER_ID)

    query = f"""
        SELECT
            lv.id            AS video_id,
            lv.title         AS video_title,
            lv.url           AS video_url,
            lv."sourceType"  AS source_type,
            lv."telegramMessageId" AS tg_msg_id,
            lv."telegramFileId"    AS tg_file_id,

            lec.id           AS lecture_id,
            lec.title        AS lecture_title,

            sub.id           AS subject_id,
            sub.name         AS subject_name,

            mod.name         AS module_name,

            sem.id           AS semester_id,
            sem.name         AS semester_name,

            ay."yearNumber"  AS year_number,

            uni.id           AS university_id,
            uni.name         AS university_name,
            uni.abbr         AS university_abbr,

            fac.name         AS faculty_name

        FROM "LectureVideo" lv
        JOIN "Lecture"      lec ON lec.id = lv."lectureId"
        JOIN "Subject"      sub ON sub.id = lec."subjectId"
        LEFT JOIN "Module"  mod ON mod.id = sub."moduleId"
        LEFT JOIN "Semester" sem ON sem.id = sub."semesterId" OR sem.id = mod."semesterId"
        LEFT JOIN "AcademicYear" ay ON ay.id = sem."academicYearId"
        LEFT JOIN "University"   uni ON uni.id = ay."universityId"
        LEFT JOIN "Faculty"      fac ON fac.id = ay."facultyId"

        WHERE (
            lv.url ILIKE '%youtube.com%'
            OR lv.url ILIKE '%youtu.be%'
        )
        AND (lv."telegramFileId" IS NULL OR lv."telegramFileId" = '')
        {semester_filter}

        ORDER BY uni.name, sem.name, sub.name, lec."order", lv."sortOrder"
    """

    cur.execute(query, params)
    videos = cur.fetchall()
    cur.close()
    conn.close()

    print(f"\n🎬 تم العثور على {len(videos)} فيديو YouTube لم يتم نقله بعد\n")

    # عرض ملخص
    if videos:
        unis = set(v['university_name'] for v in videos if v['university_name'])
        sems = set(v['semester_name'] for v in videos if v['semester_name'])
        subs = set(v['subject_name'] for v in videos)
        print(f"   📊 الجامعات: {', '.join(unis) if unis else 'غير محدد'}")
        print(f"   📅 الفصول الدراسية: {', '.join(sems) if sems else 'غير محدد'}")
        print(f"   📚 المواد: {len(subs)} مادة")
        print(f"   🎥 إجمالي الفيديوهات: {len(videos)}")

    return [dict(v) for v in videos]

videos_to_migrate = fetch_youtube_videos()


# ════════════════════════════════════════════════════════════════════
# CELL 4: تهيئة Telegram Client
# ════════════════════════════════════════════════════════════════════

from telethon.sync import TelegramClient
from telethon.sessions import StringSession
from telethon import types
import asyncio

# استخدام String Session مباشرة (لا يحتاج رقم هاتف مرة أخرى)
client = TelegramClient(
    StringSession(TELEGRAM_STRING_SESSION),
    TELEGRAM_API_ID,
    TELEGRAM_API_HASH
)

async def test_telegram_connection():
    await client.start()
    me = await client.get_me()
    print(f"✅ تم الاتصال بـ Telegram بنجاح!")
    print(f"   👤 الحساب: {me.first_name} {me.last_name or ''}")
    print(f"   📱 الهاتف: {me.phone}")

    # التحقق من المجموعة المستهدفة
    try:
        entity = await client.get_entity(TARGET_GROUP_ID)
        print(f"   📢 المجموعة المستهدفة: {entity.title}")
    except Exception as e:
        print(f"   ⚠️ تحذير: لم يتم التعقق من المجموعة: {e}")

    await client.disconnect()

asyncio.get_event_loop().run_until_complete(test_telegram_connection())


# ════════════════════════════════════════════════════════════════════
# CELL 5: أدوات التحميل والرفع
# ════════════════════════════════════════════════════════════════════

import yt_dlp
import os
import time
import re
from pathlib import Path
from tqdm import tqdm

DOWNLOAD_DIR = "/content/videos_temp"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def extract_youtube_id(url: str) -> str:
    """استخراج معرف الفيديو من رابط YouTube"""
    patterns = [
        r'(?:v=|youtu\.be/|embed/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return ""

def build_caption(video: dict) -> str:
    """بناء الرسالة النصية المصاحبة للفيديو"""
    youtube_id = extract_youtube_id(video['video_url'])

    lines = [
        f"🎓 **{video['video_title']}**",
        "",
    ]

    if video.get('lecture_title') and video['lecture_title'] != video['video_title']:
        lines.append(f"📖 المحاضرة: {video['lecture_title']}")

    if video.get('subject_name'):
        lines.append(f"📚 المادة: {video['subject_name']}")

    if video.get('module_name'):
        lines.append(f"🗂️ الوحدة: {video['module_name']}")

    if video.get('semester_name'):
        year = f" — السنة {video['year_number']}" if video.get('year_number') else ""
        lines.append(f"📅 الفصل الدراسي: {video['semester_name']}{year}")

    if video.get('faculty_name'):
        lines.append(f"🏫 الكلية: {video['faculty_name']}")

    if video.get('university_name'):
        abbr = f" ({video['university_abbr']})" if video.get('university_abbr') else ""
        lines.append(f"🏛️ الجامعة: {video['university_name']}{abbr}")

    lines.extend([
        "",
        f"🆔 Video ID: `{video['video_id']}`",
        f"▶️ YouTube ID: `{youtube_id}`",
        "",
        "━━━━━━━━━━━━━━━━━━━━━",
        "🔗 MedOneX Platform | منصة ميدوان إكس",
    ])

    return "\n".join(lines)

def download_youtube_video(url: str, video_id: str) -> str | None:
    """تحميل فيديو من YouTube بأعلى جودة متاحة (max 720p)"""
    output_path = os.path.join(DOWNLOAD_DIR, f"{video_id}.%(ext)s")

    ydl_opts = {
        'format': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]',
        'outtmpl': output_path,
        'merge_output_format': 'mp4',
        'quiet': True,
        'no_warnings': True,
        'retries': 3,
        'fragment_retries': 3,
        'http_chunk_size': 10485760,  # 10MB chunks
        'postprocessors': [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }],
    }

    # إضافة ملف الكوكيز إذا وجد لحل مشكلة الحظر
    if COOKIES_FILE and os.path.exists(COOKIES_FILE):
        ydl_opts['cookiefile'] = COOKIES_FILE
        # print("      🍪 تم استخدام ملف الكوكيز لتجاوز الحظر")

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            # تأكد من الامتداد mp4
            mp4_path = filename.replace('.webm', '.mp4').replace('.mkv', '.mp4')
            if os.path.exists(mp4_path):
                return mp4_path
            # البحث عن الملف
            for f in Path(DOWNLOAD_DIR).glob(f"{video_id}.*"):
                return str(f)
    except Exception as e:
        print(f"      ❌ فشل تحميل الفيديو: {e}")
        return None

def cleanup_file(filepath: str):
    """حذف الملف المؤقت بعد الرفع"""
    try:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
    except:
        pass


# ════════════════════════════════════════════════════════════════════
# CELL 6: تحديث قاعدة البيانات بعد الرفع
# ════════════════════════════════════════════════════════════════════

def update_video_in_db(video_id: str, tg_message_id: int, tg_chat_id: str, tg_file_id: str):
    """
    تحديث سجل الفيديو في قاعدة البيانات:
    - حفظ معرف رسالة Telegram
    - حفظ معرف ملف Telegram (للتشغيل المباشر)
    - تغيير sourceType إلى 'telegram'
    """
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            UPDATE "LectureVideo"
            SET
                "telegramMessageId" = %s,
                "telegramChatId"    = %s,
                "telegramFileId"    = %s,
                "sourceType"        = 'telegram',
                "isBroadcasted"     = true,
                "updatedAt"         = NOW()
            WHERE id = %s
        """, (tg_message_id, tg_chat_id, tg_file_id, video_id))

        conn.commit()
        print(f"      ✅ تم تحديث قاعدة البيانات")
    except Exception as e:
        conn.rollback()
        print(f"      ⚠️ خطأ في تحديث قاعدة البيانات: {e}")
    finally:
        cur.close()
        conn.close()

def update_lecture_video_url(video_id: str, lecture_id: str):
    """
    تحديث رابط الفيديو في Lecture.videoUrl أيضاً (إذا كان هذا الفيديو هو الرئيسي)
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # التحقق إذا كان الفيديو الوحيد للمحاضرة
        cur.execute("""
            SELECT COUNT(*) FROM "LectureVideo" WHERE "lectureId" = %s
        """, (lecture_id,))
        count = cur.fetchone()[0]

        if count == 1:
            # تحديث videoUrl في Lecture للإشارة إلى Telegram
            cur.execute("""
                UPDATE "Lecture"
                SET "videoUrl" = NULL
                WHERE id = %s AND ("videoUrl" ILIKE '%youtube%' OR "videoUrl" ILIKE '%youtu.be%')
            """, (lecture_id,))
            conn.commit()
    except Exception as e:
        conn.rollback()
    finally:
        cur.close()
        conn.close()


# ════════════════════════════════════════════════════════════════════
# CELL 7: محرك النقل الرئيسي
# ════════════════════════════════════════════════════════════════════

import asyncio
from telethon.tl.types import DocumentAttributeVideo

# سجل العمليات
migration_log = {
    "total": 0,
    "success": 0,
    "failed": 0,
    "skipped": 0,
    "errors": []
}

async def upload_video_to_telegram(client, video: dict, filepath: str) -> dict | None:
    """
    رفع الفيديو إلى مجموعة Telegram وإرجاع معلومات الرسالة
    """
    caption = build_caption(video)

    try:
        print(f"      📤 جاري الرفع إلى Telegram...")

        # رفع الفيديو مع بيانات الوصفية
        message = await client.send_file(
            TARGET_GROUP_ID,
            filepath,
            caption=caption,
            parse_mode='md',
            supports_streaming=True,
            attributes=[
                DocumentAttributeVideo(
                    duration=0,
                    w=1280,
                    h=720,
                    supports_streaming=True
                )
            ],
            progress_callback=lambda current, total: print(
                f"\r      📊 {current/1024/1024:.1f} MB / {total/1024/1024:.1f} MB ({100*current//total}%)",
                end='', flush=True
            ) if total > 0 else None
        )

        print()  # سطر جديد بعد progress bar

        # استخراج File ID من الرسالة
        file_id = ""
        if message.document:
            file_id = str(message.document.id)

        return {
            "message_id": message.id,
            "chat_id": str(TARGET_GROUP_ID),
            "file_id": file_id,
        }

    except Exception as e:
        print(f"\n      ❌ فشل رفع الفيديو: {e}")
        return None

async def run_migration():
    """تشغيل عملية النقل الكاملة"""
    global migration_log

    videos = videos_to_migrate
    if MAX_VIDEOS > 0:
        videos = videos[:MAX_VIDEOS]

    migration_log["total"] = len(videos)

    print("=" * 65)
    print(f"🚀 بدء نقل {len(videos)} فيديو من YouTube إلى Telegram")
    print("=" * 65)

    await client.start()

    for idx, video in enumerate(videos, 1):
        video_url = video['video_url']
        video_id  = video['video_id']
        yt_id     = extract_youtube_id(video_url)

        print(f"\n[{idx}/{len(videos)}] 🎬 {video['video_title'][:60]}")
        print(f"   📚 {video.get('subject_name', '—')} | 🏛️ {video.get('university_name', '—')}")
        print(f"   🔗 {video_url[:60]}...")

        # تخطي إذا كان الفيديو محمياً أو مقيداً
        if not yt_id:
            print(f"   ⚠️ تعذر استخراج YouTube ID — تخطي")
            migration_log["skipped"] += 1
            continue

        # ─── تحميل الفيديو من YouTube ───────────────────────────
        print(f"   ⬇️ جاري التحميل من YouTube...")
        filepath = download_youtube_video(video_url, video_id)

        if not filepath:
            print(f"   ❌ فشل التحميل — تخطي")
            migration_log["failed"] += 1
            migration_log["errors"].append({
                "video_id": video_id,
                "title": video['video_title'],
                "error": "Download failed"
            })
            continue

        file_size_mb = os.path.getsize(filepath) / 1024 / 1024
        print(f"   ✅ تم التحميل ({file_size_mb:.1f} MB)")

        # ─── رفع الفيديو إلى Telegram ───────────────────────────
        tg_result = await upload_video_to_telegram(client, video, filepath)

        # ─── حذف الملف المؤقت فوراً لتوفير المساحة ──────────────
        cleanup_file(filepath)

        if tg_result:
            # ─── تحديث قاعدة البيانات ───────────────────────────
            update_video_in_db(
                video_id=video_id,
                tg_message_id=tg_result["message_id"],
                tg_chat_id=tg_result["chat_id"],
                tg_file_id=tg_result["file_id"]
            )
            update_lecture_video_url(video_id, video['lecture_id'])

            migration_log["success"] += 1
            print(f"   🎉 نجح النقل! Message ID: {tg_result['message_id']}")
        else:
            migration_log["failed"] += 1
            migration_log["errors"].append({
                "video_id": video_id,
                "title": video['video_title'],
                "error": "Telegram upload failed"
            })

        # تأخير بين الفيديوهات
        if idx < len(videos):
            print(f"   ⏳ انتظار {DELAY_BETWEEN_UPLOADS} ثوانٍ...")
            await asyncio.sleep(DELAY_BETWEEN_UPLOADS)

    await client.disconnect()

    # ─── ملخص نهائي ────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("📊 ملخص عملية النقل:")
    print("=" * 65)
    print(f"   ✅ ناجح:   {migration_log['success']} فيديو")
    print(f"   ❌ فاشل:   {migration_log['failed']} فيديو")
    print(f"   ⏭️ متخطي:  {migration_log['skipped']} فيديو")
    print(f"   📊 الإجمالي: {migration_log['total']} فيديو")

    if migration_log['errors']:
        print(f"\n⚠️ قائمة الأخطاء ({len(migration_log['errors'])}):")
        for err in migration_log['errors']:
            print(f"   - [{err['video_id'][:8]}...] {err['title'][:50]}: {err['error']}")

    print("\n🎉 اكتملت عملية النقل!")

# ─── تشغيل المحرك ────────────────────────────────────────────────
asyncio.get_event_loop().run_until_complete(run_migration())


# ════════════════════════════════════════════════════════════════════
# CELL 8: التحقق من النتائج (بعد الانتهاء)
# ════════════════════════════════════════════════════════════════════

def verify_migration():
    """التحقق من نجاح العملية وعرض إحصائيات"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # عدد الفيديوهات التي تم نقلها
    cur.execute("""
        SELECT COUNT(*) as migrated
        FROM "LectureVideo"
        WHERE "sourceType" = 'telegram'
          AND "telegramFileId" IS NOT NULL
          AND "telegramFileId" != ''
    """)
    migrated = cur.fetchone()['migrated']

    # عدد الفيديوهات المتبقية على YouTube
    cur.execute("""
        SELECT COUNT(*) as remaining
        FROM "LectureVideo"
        WHERE (url ILIKE '%youtube%' OR url ILIKE '%youtu.be%')
          AND ("telegramFileId" IS NULL OR "telegramFileId" = '')
    """)
    remaining = cur.fetchone()['remaining']

    cur.close()
    conn.close()

    print("\n" + "=" * 65)
    print("📈 حالة قاعدة البيانات:")
    print("=" * 65)
    print(f"   ✅ فيديوهات منقولة إلى Telegram: {migrated}")
    print(f"   ⏳ فيديوهات YouTube متبقية:       {remaining}")
    print(f"   📊 نسبة الإنجاز: {migrated/(migrated+remaining)*100:.1f}%" if (migrated+remaining) > 0 else "")

verify_migration()
