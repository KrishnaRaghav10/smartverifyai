import os
import sys
import time
import shutil
import subprocess
import cv2
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"d:\SIH 2026\output_videos"
os.makedirs(OUTPUT_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 8000
BASE_URL = f"http://127.0.0.1:{PORT}"

FINAL_MP4 = r"d:\SIH 2026\SmartVerifyAI_Demo_Walkthrough.mp4"
FINAL_WEBM = r"d:\SIH 2026\SmartVerifyAI_Demo_Walkthrough.webm"
ALT_MP4 = r"d:\SIH 2026\Pramaan_Demo_Walkthrough.mp4"
ALT_WEBM = r"d:\SIH 2026\Pramaan_Demo_Walkthrough.webm"

# Clean mouse pointer injection WITHOUT ANY bottom HUD or timestamp popups
CURSOR_INJECTION_SCRIPT = """
(function() {
  if (document.getElementById('demo-mouse-cursor')) return;

  const cursor = document.createElement('div');
  cursor.id = 'demo-mouse-cursor';
  cursor.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.45));">
      <path d="M4 4L11 20L14 13L21 10L4 4Z" fill="#1B3A6B" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>
    <div id="click-ring" style="position: absolute; top: 0px; left: 0px; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #E8890C; background: rgba(232, 137, 12, 0.25); pointer-events: none; opacity: 0; transform: scale(0.4); transition: transform 0.22s ease-out, opacity 0.22s ease-out;"></div>
  `;
  cursor.style.position = 'fixed';
  cursor.style.top = '0px';
  cursor.style.left = '0px';
  cursor.style.zIndex = '9999999';
  cursor.style.pointerEvents = 'none';
  cursor.style.transform = 'translate(960px, 540px)';
  document.body.appendChild(cursor);

  window.__cursorPos = { x: 960, y: 540 };

  window.setCursorPos = function(x, y) {
    window.__cursorPos = { x, y };
    cursor.style.transform = `translate(${x}px, ${y}px)`;
  };

  window.triggerClickRipple = function() {
    const ring = document.getElementById('click-ring');
    if (ring) {
      ring.style.opacity = '1';
      ring.style.transform = 'scale(1.8)';
      setTimeout(() => {
        ring.style.opacity = '0';
        ring.style.transform = 'scale(0.4)';
      }, 220);
    }
  };
})();
"""

def ensure_cursor(page):
    try:
        page.evaluate(CURSOR_INJECTION_SCRIPT)
    except Exception:
        pass

def smooth_move(page, target_x, target_y, duration=0.45, steps=15):
    try:
        ensure_cursor(page)
        pos = page.evaluate("window.__cursorPos || {x: 960, y: 540}")
        start_x, start_y = pos['x'], pos['y']
        sleep_step = duration / steps
        for i in range(1, steps + 1):
            t = i / steps
            ease_t = t * t * (3 - 2 * t)
            cur_x = start_x + (target_x - start_x) * ease_t
            cur_y = start_y + (target_y - start_y) * ease_t
            page.evaluate(f"window.setCursorPos({cur_x}, {cur_y})")
            time.sleep(sleep_step)
    except Exception:
        pass

def point_at(page, x, y, duration=0.45, hold=1.2, ripple=False):
    smooth_move(page, x, y, duration=duration)
    if ripple:
        try:
            page.evaluate("window.triggerClickRipple()")
        except Exception:
            pass
    time.sleep(hold)

def smooth_move_and_click(page, locator, duration=0.45):
    try:
        locator.scroll_into_view_if_needed(timeout=1500)
        time.sleep(0.1)
        box = locator.bounding_box()
        if box:
            target_x = box['x'] + box['width'] / 2.0
            target_y = box['y'] + box['height'] / 2.0
            smooth_move(page, target_x, target_y, duration=duration)
            page.evaluate("window.triggerClickRipple()")
            time.sleep(0.1)
            locator.click()
            return target_x, target_y
        else:
            locator.click()
            return 960, 540
    except Exception:
        try:
            locator.click()
        except Exception:
            pass
        return 960, 540

def switch_role_via_header(page, target_role_name):
    user_btn = page.locator("header button").filter(has_text="Doctor").or_(
        page.locator("header button").filter(has_text="Smt.")
    ).or_(
        page.locator("header button").filter(has_text="Shri")
    ).or_(
        page.locator("header button").filter(has_text="Institution")
    ).or_(
        page.locator("header button").filter(has_text="Scrutiny")
    ).or_(
        page.locator("header button").filter(has_text="Senior")
    ).or_(
        page.locator("header button").filter(has_text="Auditor")
    ).first

    smooth_move_and_click(page, user_btn, duration=0.35)
    time.sleep(0.4)

    role_option = page.locator("header div").filter(has_text="Switch Active Demo Role").locator("..").locator("button").filter(has_text=target_role_name).first
    smooth_move_and_click(page, role_option, duration=0.35)
    time.sleep(0.8)
    ensure_cursor(page)

def record_walkthrough():
    raw_video_dir = os.path.join(OUTPUT_DIR, "raw_capture_role")
    if os.path.exists(raw_video_dir):
        shutil.rmtree(raw_video_dir, ignore_errors=True)
    os.makedirs(raw_video_dir, exist_ok=True)

    print(f"[1/4] Starting FastAPI backend on port {PORT}...")
    server = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", str(PORT), "--app-dir", "backend"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    time.sleep(2.5)

    try:
        print("[2/4] Starting Playwright in 1920x1080 (clean 1080p)...")
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path=CHROME_PATH,
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--hide-scrollbars",
                    "--force-device-scale-factor=1"
                ]
            )
            context = browser.new_context(
                record_video_dir=raw_video_dir,
                record_video_size={"width": 1920, "height": 1080},
                viewport={"width": 1920, "height": 1080}
            )
            page = context.new_page()

            page.goto(f"{BASE_URL}/login", wait_until="networkidle")
            time.sleep(1.0)
            ensure_cursor(page)

            # =========================================================
            # SCENE 1: LOGIN & ROLE SELECTION (~22 seconds)
            # =========================================================
            print("  Recording Scene 1: Login & Role Selection (~22s)...")
            # Point to SmartVerifyAI Shield Logo and title
            point_at(page, 960, 200, duration=0.5, hold=1.5)
            # Point to subtitle
            point_at(page, 960, 265, duration=0.35, hold=1.2)

            # Point to each of the 4 demo role presets with human pacing
            point_at(page, 780, 395, duration=0.45, hold=1.3) # Institution inst01
            point_at(page, 1140, 395, duration=0.4, hold=1.3) # Scrutiny Officer scrutiny01
            point_at(page, 780, 480, duration=0.4, hold=1.3) # Senior Officer senior01
            point_at(page, 1140, 480, duration=0.4, hold=1.3) # Auditor auditor01

            # Select inst01
            inst_card = page.locator("button").filter(has_text="inst01").first
            smooth_move_and_click(page, inst_card, duration=0.4)
            time.sleep(0.8)

            # Point to prefilled password & security badge
            point_at(page, 960, 560, duration=0.35, hold=1.0)

            # Click Sign In
            signin_btn = page.locator("#btn-login-submit").first
            smooth_move_and_click(page, signin_btn, duration=0.35)
            page.wait_for_url("**/institution/home", timeout=8000)
            ensure_cursor(page)
            time.sleep(1.0)

            # =========================================================
            # SCENE 2: INSTITUTION PORTAL (~27 seconds)
            # =========================================================
            print("  Recording Scene 2: Institution Portal (Submit & Fix) (~27s)...")
            # Point to green top strip and role badge
            point_at(page, 960, 10, duration=0.35, hold=0.8)
            point_at(page, 320, 65, duration=0.4, hold=1.5)

            # Point to 3 count cards
            point_at(page, 380, 185, duration=0.4, hold=1.8, ripple=True) # Open Applications
            point_at(page, 750, 185, duration=0.4, hold=1.8, ripple=True) # Deficiencies to Fix
            point_at(page, 1100, 185, duration=0.4, hold=1.8, ripple=True) # Official Messages

            # Trace 4-stage lifecycle tracker
            point_at(page, 410, 350, duration=0.35, hold=1.2)  # 1. Submitted
            point_at(page, 660, 350, duration=0.35, hold=1.2)  # 2. Scrutiny
            point_at(page, 910, 350, duration=0.35, hold=1.5, ripple=True)  # 3. Clarification
            point_at(page, 1160, 350, duration=0.35, hold=1.2) # 4. Decided

            # Scroll down to Active Dossier
            page.evaluate("window.scrollTo({top: 480, behavior: 'smooth'})")
            time.sleep(0.6)
            ensure_cursor(page)

            # Point to plain-language deficiency (Missing Fire Safety Certificate)
            point_at(page, 650, 535, duration=0.4, hold=2.2)

            # Point to statutory checklist table
            point_at(page, 650, 680, duration=0.4, hold=1.8)

            # Click Upload / Replace Document
            upload_btn = page.locator("button").filter(has_text="Upload / Replace Document").first
            smooth_move_and_click(page, upload_btn, duration=0.35)
            time.sleep(1.0) # Show modal

            # Inside upload modal: point to doc select & drag zone
            point_at(page, 960, 445, duration=0.35, hold=1.4)
            point_at(page, 960, 530, duration=0.35, hold=1.4)

            # Close upload modal
            cancel_btn = page.locator("button").filter(has_text="Cancel").last
            smooth_move_and_click(page, cancel_btn, duration=0.3)
            time.sleep(0.5)

            # Scroll back up
            page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
            time.sleep(0.6)
            ensure_cursor(page)

            # =========================================================
            # SCENE 3: SCRUTINY OFFICER PORTAL (~27 seconds)
            # =========================================================
            print("  Recording Scene 3: Scrutiny Officer (Review & Recommend) (~27s)...")
            switch_role_via_header(page, "Scrutiny Officer")
            page.wait_for_url("**/scrutiny/queue", timeout=8000)
            ensure_cursor(page)
            time.sleep(0.8)

            # Point to Navy strip & badge
            point_at(page, 280, 65, duration=0.35, hold=1.0)

            # Quick glance at work queue row (do NOT linger!)
            point_at(page, 620, 260, duration=0.35, hold=1.2)

            # Immediately click "Review Dossier" for APP-2026-004
            review_btn = page.locator("button").filter(has_text="Review Dossier").first
            smooth_move_and_click(page, review_btn, duration=0.35)
            time.sleep(1.0)
            ensure_cursor(page)

            # Left side: PDF Document Viewer
            point_at(page, 450, 420, duration=0.45, hold=2.5)

            # Right side: Source Verification Gateway
            point_at(page, 1300, 230, duration=0.4, hold=1.5)

            # Click Re-verify / Run Check to trigger live source API call
            recheck_btn = page.locator("button").filter(has_text="Re-verify").or_(page.locator("button").filter(has_text="Run Check")).first
            smooth_move_and_click(page, recheck_btn, duration=0.3)
            time.sleep(1.8) # Show live status updating

            # Scroll down right pane to AI Forensic Tamper Detection
            page.evaluate("window.scrollTo({top: 380, behavior: 'smooth'})")
            time.sleep(0.6)
            ensure_cursor(page)

            # Point to Forensic AI Anomaly Flags (ELA Tampering score & Stamp check)
            point_at(page, 1300, 420, duration=0.4, hold=2.0)
            point_at(page, 1300, 520, duration=0.35, hold=1.8)

            # Point to physical norms checklist
            point_at(page, 1300, 640, duration=0.35, hold=1.8)

            # Scroll up to action button
            page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
            time.sleep(0.5)
            ensure_cursor(page)

            # Escalate / Recommend to Senior Officer
            rec_btn = page.locator("button").filter(has_text="Escalate / Recommend to Senior").first
            smooth_move_and_click(page, rec_btn, duration=0.35)
            time.sleep(1.0) # Show recommend modal

            # Point to remarks textarea
            point_at(page, 960, 540, duration=0.35, hold=1.4)

            # Close recommend modal
            rec_cancel = page.locator("button").filter(has_text="Cancel").last
            smooth_move_and_click(page, rec_cancel, duration=0.3)
            time.sleep(0.5)

            # =========================================================
            # SCENE 4: SENIOR OFFICER PORTAL (~27 seconds)
            # =========================================================
            print("  Recording Scene 4: Senior Officer (Oversee & Decide) (~27s)...")
            switch_role_via_header(page, "Senior Officer")
            page.wait_for_url("**/senior/overview", timeout=8000)
            ensure_cursor(page)
            time.sleep(0.8)

            # Point to Saffron top strip and role badge
            point_at(page, 960, 10, duration=0.35, hold=0.8)
            point_at(page, 280, 65, duration=0.35, hold=1.2)

            # Point across Executive Overview metric cards
            point_at(page, 320, 185, duration=0.35, hold=1.2, ripple=True) # Total Dossiers
            point_at(page, 540, 185, duration=0.35, hold=1.2, ripple=True) # High Risk
            point_at(page, 760, 185, duration=0.35, hold=1.2, ripple=True) # Pending Decision
            point_at(page, 980, 185, duration=0.35, hold=1.2, ripple=True) # Approved

            # Point to Deficiencies Distribution Bar Chart
            point_at(page, 780, 310, duration=0.4, hold=2.2)

            # Scroll down to Pinned Final Decision Panel
            page.evaluate("window.scrollTo({top: 440, behavior: 'smooth'})")
            time.sleep(0.6)
            ensure_cursor(page)

            # Point to Scrutiny Officer's recommendation note
            point_at(page, 1350, 480, duration=0.4, hold=2.0)

            # Point to Final Decision Action Buttons
            point_at(page, 1350, 600, duration=0.3, hold=1.2, ripple=True) # Approve
            point_at(page, 1350, 640, duration=0.3, hold=1.2, ripple=True) # Return for Correction
            point_at(page, 1350, 680, duration=0.3, hold=1.2, ripple=True) # Recommend Rejection

            # Scroll back up and click sidebar "Rules"
            page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
            time.sleep(0.5)
            ensure_cursor(page)

            rules_nav = page.locator("aside button").filter(has_text="Rules").first
            smooth_move_and_click(page, rules_nav, duration=0.35)
            page.wait_for_url("**/senior/rules", timeout=5000)
            ensure_cursor(page)
            time.sleep(0.8)

            # Point to regulatory handbook rule toggles
            point_at(page, 600, 210, duration=0.4, hold=1.5) # Mandatory Fire NOC
            point_at(page, 1400, 210, duration=0.35, hold=1.5, ripple=True) # Toggle switch
            point_at(page, 600, 290, duration=0.35, hold=1.5) # Student Built-up area norm

            # =========================================================
            # SCENE 5: AUDITOR PORTAL (~26 seconds)
            # =========================================================
            print("  Recording Scene 5: Auditor Portal (Observe & Report) (~26s)...")
            switch_role_via_header(page, "Auditor")
            page.wait_for_url("**/audit/logs", timeout=8000)
            ensure_cursor(page)
            time.sleep(0.8)

            # Point to Grey strip & explicit "Read-only access" tag
            point_at(page, 960, 10, duration=0.35, hold=0.8)
            point_at(page, 1300, 65, duration=0.4, hold=2.0, ripple=True)

            # Point to Search bar & Filter controls
            point_at(page, 450, 185, duration=0.35, hold=1.5)

            # Point to Immutable Audit Ledger entries with SHA-256 integrity hashes
            point_at(page, 750, 310, duration=0.4, hold=2.0) # Decision entry
            point_at(page, 750, 380, duration=0.35, hold=2.0) # Access denied entry
            point_at(page, 750, 450, duration=0.35, hold=2.0) # Document upload entry

            # Scroll table smoothly
            page.evaluate("window.scrollTo({top: 260, behavior: 'smooth'})")
            time.sleep(0.6)
            ensure_cursor(page)

            point_at(page, 750, 520, duration=0.4, hold=2.0)

            # Scroll back up
            page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
            time.sleep(0.5)
            ensure_cursor(page)

            # Point to "Export Audit Log (CSV)" button with ripple
            point_at(page, 1380, 120, duration=0.35, hold=2.0, ripple=True)

            # =========================================================
            # SCENE 6: BRAND WRAP-UP (~6 seconds)
            # =========================================================
            print("  Recording Scene 6: Brand Wrap-up (~6s)...")
            # Point to SmartVerifyAI Shield Logo in the header
            point_at(page, 220, 50, duration=0.45, hold=3.0)
            time.sleep(2.0)

            print("[3/4] Finalizing raw capture...")
            context.close()
            browser.close()

    finally:
        server.terminate()
        server.wait()

    # Transcode WebM to MP4 using OpenCV VideoWriter
    print("[4/4] Transcoding to 1080p MP4...")
    webm_files = [os.path.join(raw_video_dir, f) for f in os.listdir(raw_video_dir) if f.endswith(".webm")]
    if not webm_files:
        print("Error: No raw webm video found!")
        return

    raw_webm = webm_files[0]
    shutil.copy2(raw_webm, FINAL_WEBM)
    shutil.copy2(raw_webm, ALT_WEBM)

    cap = cv2.VideoCapture(raw_webm)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1920
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 1080
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"  -> Transcoding {total_frames} frames ({width}x{height} @ {fps:.1f} fps) to MP4...")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(FINAL_MP4, fourcc, fps, (width, height))

    count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        out.write(frame)
        count += 1
        if count % 250 == 0:
            print(f"    Progress: {count}/{total_frames} frames ({(count/total_frames)*100:.0f}%)")

    cap.release()
    out.release()
    shutil.copy2(FINAL_MP4, ALT_MP4)

    duration = total_frames / fps
    print("\n" + "="*60)
    print("SUCCESS: 1080p MP4 DEMO VIDEO GENERATED!")
    print(f"File Path:   {FINAL_MP4}")
    print(f"Resolution:  {width}x{height} (Full HD 1080p)")
    print(f"Duration:    {duration:.1f} seconds (~{int(duration//60)}m {int(duration%60):02d}s)")
    print(f"File Size:   {os.path.getsize(FINAL_MP4) / (1024*1024):.2f} MB")
    print("="*60 + "\n")

if __name__ == "__main__":
    record_walkthrough()
