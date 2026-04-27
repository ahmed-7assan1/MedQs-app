import os
import sys
import time
import json
import requests
import asyncio

# --- CONFIGURATION ---
SITE_URL = "https://medonex.vercel.app" 
BATCH_LIMIT = 40 
SUCCESSFUL_UPLOADS = 0

# الكوكيز التي أرسلتها (تم دمجها هنا لتعمل تلقائياً)
MY_COOKIES = [
  {
    "domain": ".youtube.com",
    "expirationDate": 1811182756.357278,
    "hostOnly": False,
    "httpOnly": True,
    "name": "HSID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": False,
    "session": False,
    "storeId": "0",
    "value": "AuBleTbnnXoJ70R0V"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1811182756.357395,
    "hostOnly": False,
    "httpOnly": True,
    "name": "SSID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "AVY0zYbNrG8atFDfs"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1811182756.357488,
    "hostOnly": False,
    "httpOnly": False,
    "name": "APISID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": False,
    "session": False,
    "storeId": "0",
    "value": "tYW7f9BagMscadGt/A81GzwggvIE2ym8_-"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1811182756.357587,
    "hostOnly": False,
    "httpOnly": False,
    "name": "SAPISID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "-lTqkWReKimD_ko7/ApfHdQRsv9gTRMc9N"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1811182756.357695,
    "hostOnly": False,
    "httpOnly": False,
    "name": "__Secure-1PAPISID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "-lTqkWReKimD_ko7/ApfHdQRsv9gTRMc9N"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1811182756.357803,
    "hostOnly": False,
    "httpOnly": False,
    "name": "__Secure-3PAPISID",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "-lTqkWReKimD_ko7/ApfHdQRsv9gTRMc9N"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1811182756.357898,
    "hostOnly": False,
    "httpOnly": False,
    "name": "SID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": False,
    "session": False,
    "storeId": "0",
    "value": "g.a0008QiPKJeoLp3Vq4O1MA-Uou54lAHAEDZuN1uIL7aju7_K5hx8Pv7UQOqrJHABhBF0cDB-gAACgYKAbcSARUSFQHGX2Mip8BB4A71VD3gLdwuQzgOARoVAUF8yKr2eTqToiI8dGTeGjrDYUAW0076"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1811182756.357994,
    "hostOnly": False,
    "httpOnly": True,
    "name": "__Secure-1PSID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "g.a0008QiPKJeoLp3Vq4O1MA-Uou54lAHAEDZuN1uIL7aju7_K5hx8Erfk63QHNNUNmu7tVmj2OQACgYKAe4SARUSFQHGX2MiQYdBFKSfAGW5JZaPj9X5ZRoVAUF8yKo4zcwPzpTmmV5pbIWY3jHO0076"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1811182756.358092,
    "hostOnly": False,
    "httpOnly": True,
    "name": "__Secure-3PSID",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "g.a0008QiPKJeoLp3Vq4O1MA-Uou54lAHAEDZuN1uIL7aju7_K5hx8fjijoY4zAtJ-T6ZEQl6YwgACgYKAZgSARUSFQHGX2MiRi79aL2jlXeoxjKKL0RKdxoVAUF8yKp5ZcalfX3cyhv6vjne4ShC0076"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1809579812.66036,
    "hostOnly": False,
    "httpOnly": True,
    "name": "LOGIN_INFO",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "AFmmF2swRQIgJae9nIk6SPFK6biXGDANyKoWy1xxFsjdvvPQidsyfosCIQDDRLkmc5msnzu4_rBmhiPG1GIUccUh7m4OyDHj-0tgyQ:QUQ3MjNmeGhkbXhqZERwVnN4aWZ3Tk8ybEFaeU1sc25YaDhLVlZiT1hRQ01UVUFuRmN5VEpYS2xtS19LOG4tSnotOGc2SUtHemJIQVEyRTEzOXlEeEI4TndZZTlZUDduZjNyeHVXNFlrX0RyV3FfdUNkQmxHeGRUQmpnQWZic3c2N0REM24yamxibHVJTG5yckZHeTJHZGVQcExNelkxZDh3"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1791156525.74469,
    "hostOnly": False,
    "httpOnly": True,
    "name": "__Secure-BUCKET",
    "path": "/",
    "sameSite": "lax",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "CKoD"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1784949391,
    "hostOnly": False,
    "httpOnly": False,
    "name": "_gcl_au",
    "path": "/",
    "sameSite": "unspecified",
    "secure": False,
    "session": False,
    "storeId": "0",
    "value": "1.1.17164505.1777173392"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1811762809.232336,
    "hostOnly": False,
    "httpOnly": False,
    "name": "PREF",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "tz=Africa.Cairo&f7=150&f5=20000&f6=40000000&f4=4000000&guide_collapsed=true"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1792973683.355726,
    "hostOnly": False,
    "httpOnly": True,
    "name": "NID",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "531=ZE5g-z8MHxYbh846uj5SscE9yE2ef_XPSvUnmL3CJMj7eb3kRUvrAXsYJMt33cYeDc9gszm2DRHgbAE79YsWLc8bBjLKmYb935FUzA3KHLuaI24blKmgGzSlKJzDGoE7rHF4Xog9lWncI04u7Wu3sZ0GNtYXrWbHxZOoROwyE3sB-J2UFuOAjEs3VS3yXPl1KaGZzmSb6FsVNVbfouGPS7SyKb-Tgp8VSLIVU1Ou7ew"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1808738435.561141,
    "hostOnly": False,
    "httpOnly": True,
    "name": "__Secure-1PSIDTS",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "sidts-CjQBhkeRd1KAoCojuVxrjjfi5vHzCfJjh8IGlfxa1XZcZfRwwxuJhsMaOcIM_aJ9sWJb4yfEEAA"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1808738435.561489,
    "hostOnly": False,
    "httpOnly": True,
    "name": "__Secure-3PSIDTS",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "sidts-CjQBhkeRd1KAoCojuVxrjjfi5vHzCfJjh8IGlfxa1XZcZfRwwxuJhsMaOcIM_aJ9sWJb4yfEEAA"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1777203063,
    "hostOnly": False,
    "httpOnly": False,
    "name": "CONSISTENCY",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "AH5K9raQzIloniiOVrZxASt7V7Bpbr7dn51by7Y_NiByp14WFsZpM4WEQ6okeM2fOICtZdfLBKl4AAn-Ft1tvNqXaiQcOh_ESr1Gh7qlwyfwA6nJ3CVTD0g1y1d7HJsrkMu7tmZ0Uzs4AiXjBHMRjmH-YuGRhQ4gGnUmC6ioYWg0DETBumEygQYeZ9cYHPCgzVebFjSyPiu7ehTYC_Cvz4vTjPQ"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1808738811.989002,
    "hostOnly": False,
    "httpOnly": False,
    "name": "SIDCC",
    "path": "/",
    "sameSite": "unspecified",
    "secure": False,
    "session": False,
    "storeId": "0",
    "value": "AKEyXzUniJ59DSqQG6XY6CzJLvzmjBHm5ZYVUpTSO51ZhUMTgKMls0i57DxnKTfyDVKaCOUf_A"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1808738811.98915,
    "hostOnly": False,
    "httpOnly": True,
    "name": "__Secure-1PSIDCC",
    "path": "/",
    "sameSite": "unspecified",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "AKEyXzXQ68udmL3Su9bEmPlxyk_PyRXxYFPoZqAn8fyO1iukBWirm5LHIH8skHfosDW0GAz5Zw"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1808738811.989261,
    "hostOnly": False,
    "httpOnly": True,
    "name": "__Secure-3PSIDCC",
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "AKEyXzURXb07YuMWIynIij9xz7eEYtwfvATUDTH7cmMxsS5eG_quuCBiuP8-iqdsp4l7_AVSfzM"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1792754806.644021,
    "hostOnly": False,
    "httpOnly": True,
    "name": "VISITOR_INFO1_LIVE",
    "partitionKey": {
      "hasCrossSiteAncestor": False,
      "topLevelSite": "https://youtube.com"
    },
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "zYdu5QM00mI"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1792754806.644236,
    "hostOnly": False,
    "httpOnly": True,
    "name": "VISITOR_PRIVACY_METADATA",
    "partitionKey": {
      "hasCrossSiteAncestor": False,
      "topLevelSite": "https://youtube.com"
    },
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "CgJFRxIEGgAgXg%3D%3D"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1792714477.660531,
    "hostOnly": False,
    "httpOnly": True,
    "name": "__Secure-YNID",
    "partitionKey": {
      "hasCrossSiteAncestor": False,
      "topLevelSite": "https://youtube.com"
    },
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "18.YT=tURKDNI0LIpd0rg4Ph06Ql3MXty4fQPWPTkn9J27liT2xakYgfagXccLzQNS-gonVZ93LZvD7SF5bFZNIms7VvLLEo8neGBk1OqTMtauRKEzX6L_mOcJdaVuYW3LeF4smAHsYr6RFl4YhLv851I1XJk8QjQWJnostWFGpHI70-37U0ZKfLVeWTruVjS8Y0JjWhueSRTfJ8yKghS-mUAvwbntxH9X5DSkYKYtO-jzJOIbqndx6170VQ74ueH7zj90uDq1O322jzt2JPGhphFGbMNEWZmO6lU0ninnp6L6FEKRUmUB-NCtn32XDPOYehalZRxf34ialiDdc6R85YRygA"
  },
  {
    "domain": ".youtube.com",
    "expirationDate": 1792714477.661782,
    "hostOnly": False,
    "httpOnly": True,
    "name": "__Secure-ROLLOUT_TOKEN",
    "partitionKey": {
      "hasCrossSiteAncestor": False,
      "topLevelSite": "https://youtube.com"
    },
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": False,
    "storeId": "0",
    "value": "CI-tl--ay7KadxCtzsjho8mMAxjS98mRnoqUAw%3D%3D"
  },
  {
    "domain": ".youtube.com",
    "hostOnly": False,
    "httpOnly": True,
    "name": "YSC",
    "partitionKey": {
      "hasCrossSiteAncestor": False,
      "topLevelSite": "https://youtube.com"
    },
    "path": "/",
    "sameSite": "no_restriction",
    "secure": True,
    "session": True,
    "storeId": "0",
    "value": "dRrC_eHz9p4"
  }
]

def setup_selenium():
    print("🔧 Setting up Selenium...")
    # Install dependencies if in Colab
    os.system("apt-get update")
    os.system("apt install -y google-chrome-stable")
    os.system("pip install -q selenium")
    
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    # Load cookies
    driver.get("https://www.youtube.com")
    time.sleep(2)
    for cookie in MY_COOKIES:
        try:
            # Fix partitionKey if present
            if 'partitionKey' in cookie: del cookie['partitionKey']
            driver.add_cookie(cookie)
        except Exception as e:
            # print(f"Skipping cookie {cookie.get('name')}: {e}")
            pass
            
    print("✅ Selenium is Ready.")
    return driver

def upload_to_youtube_selenium(driver, file_path, title, job_id):
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    print(f"📤 Uploading to YouTube: {title}")
    update_job(job_id, status="UPLOADING", progress=30)
    
    driver.get("https://studio.youtube.com")
    time.sleep(3)
    
    try:
        # Click Upload button
        upload_btn = WebDriverWait(driver, 20).until(EC.element_to_be_clickable((By.ID, "upload-icon")))
        upload_btn.click()
        
        # Select file
        file_input = WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.XPATH, "//input[@type='file']")))
        file_input.send_keys(os.path.abspath(file_path))
        
        # Wait for upload to complete and fill title
        time.sleep(5)
        update_job(job_id, status="UPLOADING", progress=60)
        
        # Click Next until Visibility
        for _ in range(3):
            next_btn = WebDriverWait(driver, 20).until(EC.element_to_be_clickable((By.ID, "next-button")))
            next_btn.click()
            time.sleep(2)
            
        # Set Unlisted
        unlisted_radio = WebDriverWait(driver, 20).until(EC.element_to_be_clickable((By.NAME, "UNLISTED")))
        unlisted_radio.click()
        
        # Save
        save_btn = WebDriverWait(driver, 20).until(EC.element_to_be_clickable((By.ID, "done-button")))
        save_btn.click()
        
        time.sleep(5)
        # Get Video Link (usually in the dialog)
        video_url_elem = driver.find_element(By.XPATH, "//a[contains(@class, 'video-url-link')]")
        new_url = video_url_elem.get_attribute("href")
        
        update_job(job_id, status="COMPLETED", progress=100, newVideoUrl=new_url)
        print(f"✅ Success! URL: {new_url}")
        return True
        
    except Exception as e:
        print(f"❌ Selenium Upload Failed: {e}")
        driver.save_screenshot("error_upload.png")
        raise e

def update_job(job_id, status, progress=0, error=None, newVideoUrl=None):
    try:
        requests.patch(
            f"{SITE_URL}/api/admin/youtube-sync/{job_id}",
            json={"status": status, "progress": progress, "error": error, "newVideoUrl": newVideoUrl},
            timeout=10
        )
    except Exception as e: print(f"⚠️ Failed to update site: {e}")

async def process_job(job, driver):
    global SUCCESSFUL_UPLOADS
    job_id = job["id"]
    video_url = job["sourceUrl"]
    title = job.get("title", "Synced Video")
    
    print(f"\n🎬 Processing: {title}")
    update_job(job_id, status="DOWNLOADING", progress=10)
    
    local_file = "video.mp4"
    
    try:
        # Step 1: Actual Download using yt-dlp
        print(f"📥 Downloading from: {video_url}")
        # Build cookies for yt-dlp to bypass bot check
        with open("yt_cookies.txt", "w") as f:
            # Simple Netscape format for yt-dlp
            f.write("# Netscape HTTP Cookie File\n")
            for c in MY_COOKIES:
                domain = c['domain']
                path = c['path']
                secure = "TRUE" if c['secure'] else "FALSE"
                expires = str(int(c.get('expirationDate', 0)))
                name = c['name']
                value = c['value']
                f.write(f"{domain}\tTRUE\t{path}\t{secure}\t{expires}\t{name}\t{value}\n")

        os.system(f"yt-dlp --cookies yt_cookies.txt -f best -o {local_file} \"{video_url}\"")
        
        if not os.path.exists(local_file):
            raise Exception("Download failed - File not found.")

        # Step 2: Upload to YouTube via Selenium
        upload_to_youtube_selenium(driver, local_file, title, job_id)
        SUCCESSFUL_UPLOADS += 1

    except Exception as e: 
        print(f"❌ Error: {e}")
        update_job(job_id, status="FAILED", error=str(e))
    finally:
        if os.path.exists(local_file): os.remove(local_file)
        if os.path.exists("yt_cookies.txt"): os.remove("yt_cookies.txt")

async def main():
    global SUCCESSFUL_UPLOADS
    print(f"🚀 MedOneX Selenium Worker ONLINE.")
    
    driver = setup_selenium()

    while True:
        if SUCCESSFUL_UPLOADS >= BATCH_LIMIT:
            print(f"\n🛑 BATCH LIMIT REACHED ({BATCH_LIMIT} Videos)! Restart to continue.")
            break

        try:
            res = requests.get(f"{SITE_URL}/api/v1/admin/colab/jobs?colab=true", timeout=10)
            if res.status_code == 200:
                job = res.json().get("job")
                if job: await process_job(job, driver)
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
        asyncio.run(main())
    except Exception as e:
        print(f"Critical error: {e}")
