import os, sys, re, time, json, shutil, asyncio, subprocess, requests

# ── CONFIG ──────────────────────────────────────────────────
SITE_URL           = "https://medonex.vercel.app"
BATCH_LIMIT        = 40
EMAIL              = "ahmedahmed9hassan@gmail.com"
PASSWORD           = "Ahmedhassan3112006"
BRAND_CHANNEL_NAME = "Ahmed Hassan"
LOCAL_PROFILE      = "/content/YTBotProfile"
DRIVE_ZIP          = "/content/drive/MyDrive/YTBotProfile.zip"
DRIVE_DIR          = "/content/drive/MyDrive/YTBotProfile"
# ────────────────────────────────────────────────────────────

SUCCESSFUL_UPLOADS = 0
_display = None

# ── SCREENSHOT ──────────────────────────────────────────────
def show_step(driver, msg):
    print(f"📸  {msg}")
    try:
        driver.save_screenshot("/tmp/step.png")
        from IPython.display import display as D, Image
        D(Image("/tmp/step.png"))
    except Exception:
        pass

# ── INSTALL ─────────────────────────────────────────────────
def install_dependencies():
    if not os.path.exists("/content"): return
    print("📦  Installing …")
    for cmd in [
        "apt-get update -qq",
        "apt-get install -y -qq xvfb x11-utils rsync ffmpeg fonts-noto fonts-noto-cjk fonts-noto-color-emoji fonts-hosny-amiri fonts-kacst",
        "wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb",
        "apt-get install -y -qq ./google-chrome-stable_current_amd64.deb",
        "rm -f ./google-chrome-stable_current_amd64.deb",
        "pip install -q --upgrade selenium pyvirtualdisplay yt-dlp nest_asyncio webdriver-manager",
    ]: os.system(cmd)
    print("✅  Done.")

# ── DRIVE ───────────────────────────────────────────────────
def load_drive_session():
    if not os.path.exists("/content"):
        os.makedirs("./YTBotProfile", exist_ok=True)
        return "./YTBotProfile"
    try:
        from google.colab import drive as gd
        if not os.path.ismount("/content/drive"):
            gd.mount("/content/drive", force_remount=False)
        print("✅  Drive mounted.")
    except Exception as e:
        print(f"⚠️  Drive: {e}")
        os.makedirs(LOCAL_PROFILE, exist_ok=True)
        return LOCAL_PROFILE
    os.makedirs(LOCAL_PROFILE, exist_ok=True)
    if os.path.exists(DRIVE_ZIP):
        print("📦  Restoring session …")
        os.system(f"unzip -q -o '{DRIVE_ZIP}' -d /content/")
        nested = os.path.join(LOCAL_PROFILE, "YTBotProfile")
        if os.path.exists(nested):
            for item in os.listdir(nested):
                shutil.move(os.path.join(nested, item), LOCAL_PROFILE)
            shutil.rmtree(nested, ignore_errors=True)
    elif os.path.exists(DRIVE_DIR):
        os.system(f"rsync -a '{DRIVE_DIR}/' '{LOCAL_PROFILE}/'")
    return LOCAL_PROFILE

def save_drive_session():
    if not os.path.exists(LOCAL_PROFILE): return
    try:
        os.makedirs(DRIVE_DIR, exist_ok=True)
        os.system(f"rsync -a '{LOCAL_PROFILE}/' '{DRIVE_DIR}/'")
        print("💾  Session saved to Google Drive.")
    except Exception: pass

# ── SELENIUM DRIVER ─────────────────────────────────────────
def build_driver(profile_dir):
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from webdriver_manager.chrome import ChromeDriverManager
    opts = Options()
    for arg in ["--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
                "--window-size=1920,1080","--disable-blink-features=AutomationControlled",
                "--disable-notifications","--lang=ar"]:
        opts.add_argument(arg)
    opts.add_argument(f"--user-data-dir={profile_dir}")
    opts.add_argument("--profile-directory=Default")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    opts.page_load_strategy = "eager"
    try:
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
    except Exception:
        driver = webdriver.Chrome(options=opts)
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument",
        {"source":"Object.defineProperty(navigator,'webdriver',{get:()=>undefined})"})
    return driver

def start_virtual_display():
    global _display
    try:
        from pyvirtualdisplay import Display
        _display = Display(visible=0, size=(1920,1080))
        _display.start()
        print("🖥️  Virtual display started.")
    except Exception as e:
        print(f"⚠️  Display skipped: {e}")

# ── LOGIN HELPERS ────────────────────────────────────────────
def _get_visible(driver, xpath, timeout=15):
    from selenium.webdriver.common.by import By
    for _ in range(timeout):
        for el in driver.find_elements(By.XPATH, xpath):
            if el.is_displayed(): return el
        time.sleep(1)
    return None

def _is_logged_in(driver):
    from selenium.webdriver.common.by import By
    try:
        avs = driver.find_elements(By.CSS_SELECTOR, "#avatar-btn")
        if any(a.is_displayed() for a in avs): return True
    except Exception: pass
    try:
        src = driver.page_source
        if '"LOGGED_IN":true' in src or EMAIL.split("@")[0].lower() in src.lower():
            return True
    except Exception: pass
    return False

def handle_challenge_loop(driver):
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    waited = 0
    while waited < 180:
        url = driver.current_url
        if "challenge" not in url and "signin/v2" not in url and "rejected" not in url:
            return True
        page = driver.find_element(By.TAG_NAME,"body").text.lower()
        show_step(driver, f"Challenge ({waited}s)")
        if "choose how" in page or "how do you want" in page:
            try:
                btn = driver.find_element(By.XPATH,"//*[contains(.,'Tap Yes')] | //*[@data-challengetype='0']")
                driver.execute_script("arguments[0].click();", btn)
                time.sleep(8); continue
            except Exception: pass
        if "check your phone" in page or "tap yes" in page:
            try:
                nums = re.findall(r'\b\d{2}\b', page)
                if nums: print(f"🔢  Press {nums[-1]} on your phone!")
            except Exception: pass
            print("📱  Waiting for phone approval …")
            for _ in range(30):
                time.sleep(2); waited += 2
                if "challenge" not in driver.current_url: return True
            continue
        if "enter code" in page or "verification code" in page:
            code = input("⌨️  Enter verification code: ").strip()
            try:
                inp = driver.find_element(By.XPATH,"//input[@type='tel' or @name='pin']")
                inp.send_keys(code, Keys.ENTER); time.sleep(6)
            except Exception: pass
            continue
        if "not your computer" in page or "not secure" in page:
            print("❌  Blocked by Google."); return False
        time.sleep(5); waited += 5
    return False

def google_login(driver):
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    print("\n🔐  Checking login …")
    driver.get("https://www.youtube.com"); time.sleep(6)
    show_step(driver, "YouTube homepage")
    if _is_logged_in(driver):
        print("✅  Already logged in!"); return True
    driver.get("https://studio.youtube.com"); time.sleep(6)
    if "accounts.google.com" not in driver.current_url and "signin" not in driver.current_url:
        print("✅  Already logged in via Studio!"); return True
    print("⚠️  Not logged in — auto-login …")
    driver.get("https://accounts.google.com/ServiceLogin?hl=en"); time.sleep(4)
    email_el = _get_visible(driver,"//input[@type='email' or @name='identifier']")
    if not email_el: show_step(driver,"No email field"); return False
    for ch in EMAIL: email_el.send_keys(ch)
    time.sleep(0.5)
    try:
        nb = _get_visible(driver,"//div[@id='identifierNext']//button",timeout=5)
        driver.execute_script("arguments[0].click();",nb) if nb else email_el.send_keys(Keys.ENTER)
    except Exception: email_el.send_keys(Keys.ENTER)
    time.sleep(6); show_step(driver,"After email")
    pass_el = _get_visible(driver,"//input[@type='password']")
    if not pass_el: show_step(driver,"No password field"); return False
    for ch in PASSWORD: pass_el.send_keys(ch)
    time.sleep(0.5)
    try:
        pb = _get_visible(driver,"//div[@id='passwordNext']//button",timeout=5)
        driver.execute_script("arguments[0].click();",pb) if pb else pass_el.send_keys(Keys.ENTER)
    except Exception: pass_el.send_keys(Keys.ENTER)
    time.sleep(8); show_step(driver,"After password")
    ok = handle_challenge_loop(driver)
    if ok: print("✅  Login successful!")
    return ok

def switch_to_brand_channel(driver):
    from selenium.webdriver.common.by import By
    print(f"\n🔄  Switching to '{BRAND_CHANNEL_NAME}' …")
    driver.get("https://www.youtube.com/channel_switcher"); time.sleep(5)
    try:
        for el in driver.find_elements(By.XPATH,f"//*[contains(text(),'{BRAND_CHANNEL_NAME}')]"):
            if el.is_displayed():
                el.click(); print(f"✅  Switched!"); time.sleep(4); return True
    except Exception as e: print(f"⚠️  Switch failed: {e}")
    return False

# ── SETUP ────────────────────────────────────────────────────
def setup_selenium():
    install_dependencies()
    start_virtual_display()
    profile_dir = load_drive_session()
    print("\n🌐  Launching Chrome …")
    driver = build_driver(profile_dir)
    if not google_login(driver):
        driver.quit(); raise RuntimeError("Login failed.")
    save_drive_session()
    switch_to_brand_channel(driver)
    save_drive_session()
    print("\n✅  Worker is ready!\n")
    return driver

# ── VERIFY POPUP ────────────────────────────────────────────
def check_verify_popup(driver):
    from selenium.webdriver.common.by import By
    try:
        src = driver.page_source.lower()
        if "verify it's you" not in src and "إثبات هويتك" not in src: return
        show_step(driver,"🚨 Verify popup!")
        print("\n🚨  Security popup — approve from your phone!")
        try:
            btn = driver.find_element(By.XPATH,
                "//*[translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')='next']"
                " | //*[contains(text(),'التالي')]")
            driver.execute_script("arguments[0].click();",btn)
        except Exception: pass
        for i in range(90,0,-5):
            time.sleep(5)
            if "challenge" not in driver.current_url and "verify" not in driver.current_url.lower():
                print("✅  Popup resolved."); return
            sys.stdout.write(f"\r⏳  {i}s  "); sys.stdout.flush()
        print()
    except Exception: pass

# ── UPLOAD HELPERS ──────────────────────────────────────────
def _click(driver, el):
    try: el.click()
    except Exception: driver.execute_script("arguments[0].click();",el)

def _dismiss_modal(driver):
    """
    Dismiss ONLY actual blocking popups — NOT Skip/Not now which can skip wizard steps.
    Safe targets: 'Continue editing' (leave-page warning), 'Got it', 'Dismiss'.
    """
    from selenium.webdriver.common.by import By

    targets = [
        "الاستمرار في التحرير",
        "استمرار في التحرير",
        "Continue editing",
        "Got it",
        "Dismiss",
    ]

    for phrase in targets:
        try:
            els = driver.find_elements(By.XPATH,
                f"//*[contains(text(),'{phrase}') or contains(.,'{phrase}')]")
            for el in els:
                if el.is_displayed():
                    driver.execute_script("arguments[0].scrollIntoView(true);", el)
                    _click(driver, el)
                    time.sleep(1.5)
                    print(f"   🚪  Dismissed: '{phrase}'")
                    return True
        except Exception:
            pass

    try:
        result = driver.execute_script("""
            var phrases = arguments[0];
            var tags = ['ytcp-button','tp-yt-paper-button','paper-button','button'];
            for (var tag of tags) {
                var btns = Array.from(document.querySelectorAll(tag));
                for (var btn of btns) {
                    var txt = (btn.innerText || btn.textContent || '').trim();
                    for (var p of phrases) {
                        if (txt.includes(p)) {
                            btn.click(); return txt;
                        }
                    }
                }
            }
            return null;
        """, targets)
        if result:
            time.sleep(1.5)
            print(f"   🚪  Dismissed via JS: '{result.strip()}'")
            return True
    except Exception:
        pass

    try:
        for sel in ["ytcp-button#dismiss-button", "#dismiss-button"]:
            for el in driver.find_elements(By.CSS_SELECTOR, sel):
                if el.is_displayed():
                    _click(driver, el); time.sleep(1); return True
    except Exception:
        pass

    return False

def _safe_next(driver, timeout=20):
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    next_xpaths = [
        "//ytcp-button[@id='next-button'][not(@disabled)]",
        "//div[@id='next-button'][not(@disabled)]",
        "//*[@id='next-button'][not(@disabled)]",
        "//ytcp-button[.//*[contains(text(),'Next') or contains(text(),'التالي')]]",
    ]

    for attempt in range(3):
        _dismiss_modal(driver)
        time.sleep(1)

        for xp in next_xpaths:
            try:
                el = WebDriverWait(driver, timeout).until(
                    EC.element_to_be_clickable((By.XPATH, xp)))
                _click(driver, el)
                time.sleep(2)
                _dismiss_modal(driver)
                print(f"   ✅  Next clicked (attempt {attempt+1})")
                return True
            except Exception:
                pass

        print(f"   ⚠️  Next not found on attempt {attempt+1}, checking for modal …")
        _dismiss_modal(driver)
        time.sleep(3)

    return False

# ── UPLOAD 4-STEP WIZARD ─────────────────────────────────────
def upload_to_youtube(driver, file_path, title, job_id):
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException

    print(f"\n📤  Uploading: {title}")
    update_job(job_id, status="UPLOADING", progress=30)

    # Open Studio
    try: driver.get("https://studio.youtube.com")
    except Exception: driver.get("https://studio.youtube.com")
    time.sleep(6); show_step(driver,"Studio home")
    check_verify_popup(driver)
    if "accounts.google.com" in driver.current_url or "signin" in driver.current_url:
        raise RuntimeError("Session expired.")
    _dismiss_modal(driver)

    # Find upload button
    upload_btn = None
    for bid in ("upload-icon","create-icon"):
        try:
            upload_btn = WebDriverWait(driver,8).until(EC.element_to_be_clickable((By.ID,bid))); break
        except TimeoutException: pass
    if not upload_btn:
        try:
            upload_btn = WebDriverWait(driver,5).until(EC.element_to_be_clickable(
                (By.XPATH,"//ytcp-button[contains(@id,'upload')] | //*[contains(@aria-label,'Upload')]")))
        except TimeoutException: pass
    if not upload_btn:
        show_step(driver,"No upload button"); raise RuntimeError("Upload button not found.")

    _click(driver, upload_btn); show_step(driver,"Clicked upload btn")

    # Select file
    fi = WebDriverWait(driver,30).until(EC.presence_of_element_located((By.XPATH,"//input[@type='file']")))
    fi.send_keys(os.path.abspath(file_path))
    print("✅  File selected."); show_step(driver,"File selected")

    # ── Step 0: Wait for upload % ──
    print("\n⏳  [0] Waiting for upload to finish …")
    deadline = time.time() + 3600
    last = ""
    while time.time() < deadline:
        check_verify_popup(driver); _dismiss_modal(driver)
        try:
            done = False
            for el in driver.find_elements(By.XPATH,
                "//*[contains(@class,'progress-label') or contains(@class,'progress-title')]"):
                txt = el.text.strip()
                if txt and txt != last:
                    last = txt
                    sys.stdout.write(f"\r📊  {txt}   "); sys.stdout.flush()
                if any(k in txt.lower() for k in ["upload complete","processing","checks","اكتمل","100%"]):
                    done = True
            if done: print("\n✅  Uploaded to servers."); break
        except Exception: pass
        time.sleep(4)
    time.sleep(5)

    # ── Step 1: Details — Title & Not for kids ──
    print("\n📝  [1] Details …"); show_step(driver,"Step 1"); _dismiss_modal(driver)
    
    # Explicitly set title (Supporting Arabic natively via JS)
    from selenium.webdriver.common.keys import Keys
    try:
        title_box = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//*[@id='title-textarea']//*[@id='textbox']"))
        )
        title_box.click(); time.sleep(0.5)
        title_box.send_keys(Keys.CONTROL + "a"); time.sleep(0.2)
        title_box.send_keys(Keys.BACKSPACE); time.sleep(0.5)
        
        # Clean title to avoid any weird characters, max 100 chars
        clean_title = title[:95] if title else "Video Upload"
        
        # Inject text via JS to ensure exact Arabic string layout (no keyboard simulation)
        driver.execute_script("""
            arguments[0].textContent = arguments[1];
            arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
            arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
        """, title_box, clean_title)
        
        # Send a space to force YouTube UI to register the change visually
        title_box.send_keys(" ")
        time.sleep(1)
        
        print(f"   ✅  Title explicitly set: {clean_title}")
    except Exception as e:
        print(f"   ⚠️  Could not set title explicitly.")
    
    kids_xpaths = [
        "//tp-yt-paper-radio-button[@name='VIDEO_MADE_FOR_KIDS_NOT_MFK']",
        "//*[@name='VIDEO_MADE_FOR_KIDS_NOT_MFK']",
        "//*[contains(@id,'not-mfk')]",
        "//ytcp-ve[@id='not-mfk-radiobutton']"
    ]
    
    clicked_kids = False
    for xp in kids_xpaths:
        try:
            el = WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, xp)))
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el); time.sleep(0.5)
            _click(driver, el); print("   ✅  'Not for kids' selected via XPath."); clicked_kids = True; break
        except Exception: pass

    if not clicked_kids:
        try:
            result = driver.execute_script("""
                var radios = document.querySelectorAll('tp-yt-paper-radio-button, paper-radio-button');
                for (var r of radios) {
                    var n = r.getAttribute('name') || '';
                    var t = (r.innerText || r.textContent || '').trim();
                    if (n === 'VIDEO_MADE_FOR_KIDS_NOT_MFK' || t.includes('ليس مخصص') || t.includes('Not for kids')) {
                        r.click(); return 'clicked';
                    }
                }
                return null;
            """)
            if result:
                print("   ✅  'Not for kids' selected via JS."); clicked_kids = True
        except Exception: pass
        
    if not clicked_kids:
        print("   ⚠️  WARNING: Could not select 'Not for kids'. Save button might be disabled later!")

    time.sleep(2)
    print("   ➡️  Next (1→2) …")
    if not _safe_next(driver, 15): raise RuntimeError("Next failed at Step 1.")
    time.sleep(4)

    # ── Step 2: Elements ──
    print("\n🖼️  [2] Elements …"); show_step(driver,"Step 2"); _dismiss_modal(driver); time.sleep(3)
    print("   ➡️  Next (2→3) …")
    if not _safe_next(driver, 15): raise RuntimeError("Next failed at Step 2.")
    time.sleep(4)

    # ── Step 3: Checks ──
    print("\n✅  [3] Checks — keep trying Next until it's clickable …")
    show_step(driver, "Step 3"); _dismiss_modal(driver)

    next_xpaths = [
        "//ytcp-button[@id='next-button'][not(@disabled)]",
        "//div[@id='next-button'][not(@disabled)]",
        "//*[@id='next-button'][not(@disabled)]",
        "//ytcp-button[.//*[contains(text(),'Next') or contains(text(),'التالي')]]",
    ]

    clicked_next = False
    deadline_checks = time.time() + 300   # max 5 minutes
    attempt = 0
    while time.time() < deadline_checks:
        attempt += 1
        _dismiss_modal(driver)

        for xp in next_xpaths:
            try:
                el = WebDriverWait(driver, 4).until(EC.element_to_be_clickable((By.XPATH, xp)))
                driver.execute_script("arguments[0].click();", el)
                time.sleep(2)
                _dismiss_modal(driver)
                print(f"\n   ✅  Next (3→4) clicked on attempt {attempt}!")
                clicked_next = True
                break
            except Exception:
                pass

        if clicked_next:
            break

        sys.stdout.write(f"\r   ⏳  Waiting for checks … {int(deadline_checks - time.time())}s left  ")
        sys.stdout.flush()
        time.sleep(5)

    print()
    if not clicked_next:
        show_step(driver, "Step 3 timeout")
        raise RuntimeError("Could not click Next at Step 3 after 5 minutes.")

    # ── Step 4: Visibility → Unlisted → Save ──
    print("\n👁️  [4] Visibility — waiting for page to load …")
    time.sleep(8)
    show_step(driver, "Step 4: Visibility")
    _dismiss_modal(driver)

    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.XPATH,
                "//*[@name='UNLISTED' or @name='PUBLIC' or @name='PRIVATE' or contains(@id,'visibility')]"
            )))
        print("   ✅  Visibility page loaded.")
    except Exception:
        print("   ⚠️  Visibility page load timeout — trying anyway …")
        show_step(driver, "Visibility load timeout")

    time.sleep(2)
    _dismiss_modal(driver)

    unlisted_xpaths = [
        "//tp-yt-paper-radio-button[@name='UNLISTED']",
        "//*[@name='UNLISTED']",
        "//ytcp-ve[@id='unlisted-radio-button']",
        "//*[contains(@id,'unlisted')]",
        "//*[contains(text(),'Unlisted') or contains(text(),'غير مدرج')]"
        "/ancestor-or-self::*[@role='radio' or contains(@class,'radio')]",
    ]

    clicked_unlisted = False
    for xp in unlisted_xpaths:
        try:
            el = WebDriverWait(driver, 6).until(EC.presence_of_element_located((By.XPATH, xp)))
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", el)
            time.sleep(0.5)
            _click(driver, el)
            print("   ✅  Unlisted selected.")
            clicked_unlisted = True
            break
        except Exception:
            pass

    if not clicked_unlisted:
        try:
            result = driver.execute_script("""
                var radios = document.querySelectorAll('tp-yt-paper-radio-button, paper-radio-button');
                for (var r of radios) {
                    var n = r.getAttribute('name') || '';
                    var t = (r.innerText || r.textContent || '').trim();
                    if (n === 'UNLISTED' || t.includes('Unlisted') || t.includes('غير مدرج')) {
                        r.click(); return 'clicked:' + (n || t);
                    }
                }
                return null;
            """)
            if result:
                print(f"   ✅  Unlisted via JS: {result}")
                clicked_unlisted = True
        except Exception:
            pass

    if not clicked_unlisted:
        print("   ⚠️  Could not select Unlisted — saving as-is (may be Public)")

    time.sleep(3)
    show_step(driver, "After Unlisted selection")

    print("   💾  Waiting for Save button to become enabled (YouTube might be processing) …")
    save_xpaths = [
        "//ytcp-button[@id='done-button'][not(@disabled)]",
        "//*[@id='done-button'][not(@disabled)]",
        "//div[@id='done-button'][not(@disabled)]",
        "//ytcp-button[not(@disabled)][.//*[contains(translate(text(), 'PUBLISH', 'publish'), 'publish') or contains(text(),'Save') or contains(text(),'حفظ') or contains(text(),'نشر')]]",
    ]
    
    saved = False
    deadline_save = time.time() + 180  # Wait up to 3 minutes for YouTube to finish "Working on video"
    attempt = 0
    while time.time() < deadline_save:
        attempt += 1
        for xp in save_xpaths:
            try:
                el = driver.find_element(By.XPATH, xp)
                if el.is_displayed():
                    _click(driver, el)
                    print(f"\n   ✅  Clicked Save! (Attempt {attempt})")
                    saved = True
                    break
            except Exception:
                pass
        
        if saved:
            break
            
        sys.stdout.write(f"\r   ⏳  Save disabled (YouTube is processing). {int(deadline_save - time.time())}s left...  ")
        sys.stdout.flush()
        time.sleep(5)
    print()

    if not saved:
        try:
            result = driver.execute_script("""
                var btns = document.querySelectorAll('ytcp-button:not([disabled]), button:not([disabled])');
                for (var b of btns) {
                    var id  = b.id || '';
                    var txt = (b.innerText || b.textContent || '').trim().toLowerCase();
                    if (id === 'done-button' || txt.includes('save') || txt.includes('حفظ') || txt.includes('نشر') || txt.includes('publish')) {
                        b.click(); return txt || id;
                    }
                }
                return null;
            """)
            if result:
                print(f"   ✅  Saved via JS: {result}")
                saved = True
        except Exception:
            pass

    if not saved:
        show_step(driver, "Save button NOT found")
        raise RuntimeError("Could not click Save at Step 4.")

    show_step(driver, "✅ RIGHT AFTER clicking Save")
    print("\n⏳  Waiting for YouTube publish dialog …")

    new_url = None
    for wait_sec in range(0, 30, 3):
        time.sleep(3)
        show_step(driver, f"Post-save check {wait_sec+3}s")

        try:
            u = driver.execute_script(
                "var u=[];function w(n){if(!n)return;"
                "if(n.href&&typeof n.href==='string'&&"
                "(n.href.includes('youtu.be/')||n.href.includes('watch?v='))){u.push(n.href);}"
                "if(n.shadowRoot)w(n.shadowRoot);"
                "for(var c of n.children)w(c);}w(document.body);"
                "return u.length>0?u[0]:null;")
            if u and "channel" not in u and "studio" not in u:
                new_url = u; break
        except Exception: pass

        try:
            src = driver.page_source
            matches = re.findall(r'"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"', src)
            if matches:
                new_url = f"https://youtu.be/{matches[0]}"; break
        except Exception: pass

        try:
            m = re.search(r'video_id=([A-Za-z0-9_-]{11})', driver.current_url)
            if m:
                new_url = f"https://youtu.be/{m.group(1)}"; break
        except Exception: pass

        _dismiss_modal(driver)

    show_step(driver, "🏁 Final state after Save")

    if not new_url:
        try:
            src = driver.page_source
            m = re.search(r'youtu\.be/([A-Za-z0-9_-]{11})', src)
            if m: new_url = f"https://youtu.be/{m.group(1)}"
        except Exception: pass

    if not new_url:
        new_url = driver.current_url

    print(f"🎉  Video URL: {new_url}")
    return new_url

# ── API HELPERS ──────────────────────────────────────────────
def update_job(job_id, status, progress=0, error=None, new_url=None):
    try:
        requests.patch(f"{SITE_URL}/api/v1/admin/youtube-sync/{job_id}",
            json={"status":status,"progress":progress,"error":error,"newVideoUrl":new_url},
            timeout=10)
    except Exception: pass

def fetch_next_job():
    try:
        r = requests.get(f"{SITE_URL}/api/v1/admin/colab/jobs?colab=true", timeout=10)
        if r.status_code == 200: return r.json().get("job")
    except Exception: pass
    return None

# ── DOWNLOAD ─────────────────────────────────────────────────
def download_video(url, out_path):
    print(f"⬇️  Downloading: {url}")
    os.system("pip install -q --upgrade yt-dlp")
    base = ["yt-dlp","--no-playlist","--force-overwrites","--retries","5",
            "--fragment-retries","5","--merge-output-format","mp4","-o",out_path]
    strategies = [
        base+["--extractor-args","youtube:player_client=ios",
              "-f","bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",url],
        base+["--extractor-args","youtube:player_client=android",
              "-f","bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",url],
        base+["--extractor-args","youtube:player_client=tv_embedded",url],
        base+["-f","bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",url],
        ["yt-dlp","--no-playlist","--force-overwrites","-o",out_path,url],
    ]
    def _find():
        for d in [".","  /tmp","/content"]:
            if not os.path.isdir(d): continue
            for f in sorted(os.listdir(d)):
                full = os.path.join(d,f)
                if f.endswith((".mp4",".mkv",".webm",".m4v")) and os.path.getsize(full)>10_000:
                    if full != out_path: shutil.move(full,out_path)
                    print(f"✅  {os.path.getsize(out_path)/1024/1024:.1f} MB"); return True
        return False
    for i,cmd in enumerate(strategies,1):
        print(f"🔄  Strategy {i}/{len(strategies)} …")
        r = subprocess.run(cmd, capture_output=True, text=True)
        if os.path.exists(out_path) and os.path.getsize(out_path)>10_000:
            print(f"✅  {os.path.getsize(out_path)/1024/1024:.1f} MB"); return True
        if _find(): return True
        print(f"⚠️  {(r.stderr or r.stdout or '')[:200].strip()}")
    print("❌  All strategies failed."); return False

# ── JOB PROCESSOR ────────────────────────────────────────────
async def process_job(job, driver):
    global SUCCESSFUL_UPLOADS
    job_id = job["id"]; video_url = job["sourceUrl"]
    title = job.get("title","Synced Video"); local = "/tmp/video_upload.mp4"
    print(f"\n{'='*55}\n🎬  {title}\n{'='*55}")
    update_job(job_id, status="DOWNLOADING", progress=10)
    try:
        if os.path.exists(local): os.remove(local)
        if not download_video(video_url, local):
            raise RuntimeError("Download failed.")
        update_job(job_id, status="UPLOADING", progress=25)
        new_url = upload_to_youtube(driver, local, title, job_id)
        update_job(job_id, status="COMPLETED", progress=100, new_url=new_url)
        SUCCESSFUL_UPLOADS += 1
        print(f"✅  Done! ({SUCCESSFUL_UPLOADS}/{BATCH_LIMIT})")
    except Exception as e:
        print(f"❌  {e}"); update_job(job_id, status="FAILED", error=str(e))
    finally:
        if os.path.exists(local): os.remove(local)

# ── MAIN LOOP ────────────────────────────────────────────────
async def main():
    global SUCCESSFUL_UPLOADS
    print("🚀  MedOneX Colab Worker — starting …\n")
    driver = setup_selenium()
    while True:
        if SUCCESSFUL_UPLOADS >= BATCH_LIMIT:
            print(f"\n🛑  Batch limit reached."); break
        job = fetch_next_job()
        if job:
            await process_job(job, driver)
            save_drive_session()
        else:
            sys.stdout.write("."); sys.stdout.flush()
        await asyncio.sleep(10)

# ── ENTRY ────────────────────────────────────────────────────
if __name__ == "__main__":
    try:
        import nest_asyncio
    except ImportError:
        os.system("pip install -q nest_asyncio"); import nest_asyncio
    nest_asyncio.apply()
    try: asyncio.run(main())
    except KeyboardInterrupt: print("\n⏹️  Stopped.")
    except Exception as e: print(f"\n💥  {e}")
    finally:
        if _display:
            try: _display.stop()
            except Exception: pass
