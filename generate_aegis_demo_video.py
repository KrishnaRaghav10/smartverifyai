import os
import sys
import time
import shutil
import cv2
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"d:\SIH 2026\output_videos"
os.makedirs(OUTPUT_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://127.0.0.1:5173"

FINAL_MP4 = r"d:\SIH 2026\AEGIS_Demo_Walkthrough.mp4"
FINAL_WEBM = r"d:\SIH 2026\AEGIS_Demo_Walkthrough.webm"
LEGACY_MP4 = r"d:\SIH 2026\SmartVerifyAI_Demo_Walkthrough.mp4"
LEGACY_WEBM = r"d:\SIH 2026\SmartVerifyAI_Demo_Walkthrough.webm"

# Smooth mouse pointer with subtle click ripple
CURSOR_INJECTION_SCRIPT = """
(function() {
  if (document.getElementById('demo-mouse-cursor')) return;

  const cursor = document.createElement('div');
  cursor.id = 'demo-mouse-cursor';
  cursor.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));">
      <path d="M4 4L11 20L14 13L21 10L4 4Z" fill="#1F3A8A" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
    </svg>
    <div id="click-ring" style="position: absolute; top: -2px; left: -2px; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #F28C28; background: rgba(242, 140, 40, 0.25); pointer-events: none; opacity: 0; transform: scale(0.3); transition: transform 0.25s ease-out, opacity 0.25s ease-out;"></div>
  `;
  cursor.style.position = 'fixed';
  cursor.style.top = '0px';
  cursor.style.left = '0px';
  cursor.style.zIndex = '9999999';
  cursor.style.pointerEvents = 'none';
  cursor.style.transform = 'translate(960px, 540px)';
  document.body.appendChild(cursor);

  // Elegant Narrator Banner Overlay (No Timestamps!)
  const banner = document.createElement('div');
  banner.id = 'demo-narrator-banner';
  banner.style.position = 'fixed';
  banner.style.top = '12px';
  banner.style.left = '50%';
  banner.style.transform = 'translateX(-50%)';
  banner.style.zIndex = '999999';
  banner.style.backgroundColor = 'rgba(15, 27, 61, 0.95)';
  banner.style.color = '#FFFFFF';
  banner.style.padding = '8px 24px';
  banner.style.borderRadius = '999px';
  banner.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  banner.style.boxShadow = '0 8px 32px rgba(15, 27, 61, 0.35)';
  banner.style.fontFamily = "'Inter', sans-serif";
  banner.style.fontSize = '13px';
  banner.style.fontWeight = '600';
  banner.style.display = 'flex';
  banner.style.alignItems = 'center';
  banner.style.gap = '12px';
  banner.style.backdropFilter = 'blur(8px)';
  banner.style.transition = 'all 0.3s ease';
  banner.innerHTML = `
    <span id="banner-badge" style="background: #F28C28; color: #FFF; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em;">AEGIS</span>
    <span id="banner-text">AICTE Approval & Compliance Management System</span>
  `;
  document.body.appendChild(banner);

  window.__cursorPos = { x: 960, y: 540 };

  window.setCursorPos = function(x, y) {
    window.__cursorPos = { x, y };
    cursor.style.transform = `translate(${x}px, ${y}px)`;
  };

  window.triggerClickRipple = function() {
    const ring = document.getElementById('click-ring');
    if (ring) {
      ring.style.opacity = '1';
      ring.style.transform = 'scale(2.0)';
      setTimeout(() => {
        ring.style.opacity = '0';
        ring.style.transform = 'scale(0.3)';
      }, 250);
    }
  };

  window.updateNarrator = function(badge, text, color) {
    const b = document.getElementById('banner-badge');
    const t = document.getElementById('banner-text');
    if (b) {
      b.innerText = badge;
      b.style.background = color || '#F28C28';
    }
    if (t) {
      t.innerText = text;
    }
  };
})();
"""

def ensure_cursor(page):
    try:
        page.evaluate(CURSOR_INJECTION_SCRIPT)
    except Exception:
        pass

def smooth_move(page, target_x, target_y, duration=0.45, steps=18):
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
        locator.scroll_into_view_if_needed(timeout=2000)
        time.sleep(0.1)
        box = locator.bounding_box()
        if box:
            target_x = box['x'] + box['width'] / 2.0
            target_y = box['y'] + box['height'] / 2.0
            smooth_move(page, target_x, target_y, duration=duration)
            page.evaluate("window.triggerClickRipple()")
            time.sleep(0.15)
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

def set_banner(page, badge, text, color="#F28C28"):
    try:
        ensure_cursor(page)
        safe_badge = badge.replace("'", "\\'")
        safe_text = text.replace("'", "\\'")
        page.evaluate(f"window.updateNarrator('{safe_badge}', '{safe_text}', '{color}')")
    except Exception:
        pass

def switch_role_via_header(page, target_role_name):
    try:
        dropdown_btn = page.locator("header button").filter(has_text="Perspective").or_(
            page.locator("header button").filter(has_text="Doctor").or_(
                page.locator("header button").filter(has_text="Er.").or_(
                    page.locator("header button").filter(has_text="Shri").or_(
                        page.locator("header button").filter(has_text="Prof.").or_(
                            page.locator("header button").filter(has_text="Justice")
                        )
                    )
                )
            )
        ).first
        smooth_move_and_click(page, dropdown_btn, duration=0.35)
        time.sleep(0.4)
        option = page.locator("button").filter(has_text=target_role_name).first
        smooth_move_and_click(page, option, duration=0.35)
        time.sleep(0.8)
        ensure_cursor(page)
    except Exception:
        pass

def record_aegis_walkthrough():
    raw_video_dir = os.path.join(OUTPUT_DIR, "raw_capture_aegis")
    if os.path.exists(raw_video_dir):
        shutil.rmtree(raw_video_dir, ignore_errors=True)
    os.makedirs(raw_video_dir, exist_ok=True)

    print("\n[1/3] Launching Full HD Chromium recording session (1920x1080)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=[
                "--start-maximized",
                "--disable-blink-features=AutomationControlled",
                "--hide-scrollbars",
                "--force-device-scale-factor=1"
            ]
        )

        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1,
            record_video_dir=raw_video_dir,
            record_video_size={"width": 1920, "height": 1080}
        )

        page = context.new_page()

        try:
            # =========================================================
            # SCENE 1: LANDING HUB & BRAND INTRODUCTION (~12s)
            # =========================================================
            print("  -> Scene 1: Landing Hub & AEGIS Brand (~12s)...")
            page.goto(f"{BASE_URL}/", wait_until="networkidle")
            time.sleep(1.0)
            ensure_cursor(page)

            set_banner(page, "AEGIS OVERVIEW", "AICTE Approval & Compliance Management System · 10 Specialized Roles", "#1F3A8A")
            point_at(page, 960, 220, duration=0.5, hold=2.5)

            # Move across role cards smoothly
            point_at(page, 280, 560, duration=0.4, hold=1.5)
            point_at(page, 620, 560, duration=0.4, hold=1.5)
            point_at(page, 960, 560, duration=0.4, hold=1.5)

            # Click to Enter Institution Portal
            inst_btn = page.locator("button").filter(has_text="Enter Institution Portal").first
            smooth_move_and_click(page, inst_btn, duration=0.4)
            time.sleep(1.5)
            ensure_cursor(page)

            # =========================================================
            # SCENE 2: ROLE 1 - INSTITUTION PORTAL (~15s)
            # =========================================================
            print("  -> Scene 2: Role 1 - Institution Portal (~15s)...")
            set_banner(page, "ROLE 1: INSTITUTION", "Compliance Health Ring · Live Attention Carousel · Multi-stage Pathway Stepper", "#0A5CD6")
            time.sleep(0.5)

            # Point to Compliance Health Ring (0-100 radial gauge)
            point_at(page, 450, 290, duration=0.4, hold=2.5)

            # Point to Urgent Attention Card (Lease expires in 21 days!)
            point_at(page, 720, 530, duration=0.4, hold=2.5)

            # Point to My Applications Stepper
            point_at(page, 960, 720, duration=0.4, hold=2.0)

            # Switch to "Documents & Lease Vault" Tab
            vault_tab = page.locator("button").filter(has_text="Documents & Lease Vault").first
            smooth_move_and_click(page, vault_tab, duration=0.4)
            time.sleep(1.5)
            ensure_cursor(page)

            # Point to Lease Validity Bar (expiring soon)
            point_at(page, 480, 420, duration=0.4, hold=2.5)

            # =========================================================
            # SCENE 3: TIME MACHINE CLOCK ENGINE (+7d & +30d) (~12s)
            # =========================================================
            print("  -> Scene 3: Time Machine Clock Engine (~12s)...")
            set_banner(page, "TIME MACHINE", "Simulated Clock Engine · Fast-Forwarding Automatically Triggers SLAs & Escalations", "#F28C28")
            time.sleep(0.5)

            # Point to Floating Time Machine Pill in bottom right
            point_at(page, 1820, 1020, duration=0.5, hold=1.5, ripple=True)

            # Click +7 Days quick fast-forward
            plus7_btn = page.locator("button").filter(has_text="+7d").first
            smooth_move_and_click(page, plus7_btn, duration=0.3)
            time.sleep(2.0)
            ensure_cursor(page)

            # Open Notification Drawer to show newly fired alerts
            bell_btn = page.locator("header button").filter(has_text="").nth(2)
            smooth_move_and_click(page, bell_btn, duration=0.3)
            time.sleep(2.0)
            ensure_cursor(page)

            # Close Drawer
            close_drawer_btn = page.locator("button").filter(has_text="").nth(4)
            point_at(page, 1880, 35, duration=0.3, hold=0.5, ripple=True)
            page.keyboard.press("Escape")
            time.sleep(0.8)
            ensure_cursor(page)

            # =========================================================
            # SCENE 4: ROLE 2 - SCRUTINY OFFICER (~15s)
            # =========================================================
            print("  -> Scene 4: Role 2 - Scrutiny Officer (~15s)...")
            page.goto(f"{BASE_URL}/scrutiny", wait_until="networkidle")
            time.sleep(1.0)
            ensure_cursor(page)

            set_banner(page, "ROLE 2: SCRUTINY OFFICER", "Split-Pane Queue with Ageing Heat-Strips · Live Checklist Matrix · Auto-Advance", "#0E8F8A")
            time.sleep(0.5)

            # Point to Queue item with ageing heat strip
            point_at(page, 320, 240, duration=0.4, hold=2.0, ripple=True)

            # Point to Checklist Parameters (Pass / Deficient / NA)
            point_at(page, 950, 420, duration=0.4, hold=2.5)

            # Click Electronic Case Summary
            summary_btn = page.locator("button").filter(has_text="Case Summary").first
            smooth_move_and_click(page, summary_btn, duration=0.3)
            time.sleep(2.0)
            page.keyboard.press("Escape")
            time.sleep(0.5)
            ensure_cursor(page)

            # Point to Complete Scrutiny (C) button
            point_at(page, 1420, 105, duration=0.3, hold=1.5)

            # =========================================================
            # SCENE 5: ROLE 3 - REGIONAL OFFICER (~15s)
            # =========================================================
            print("  -> Scene 5: Role 3 - Regional Officer (~15s)...")
            page.goto(f"{BASE_URL}/regional", wait_until="networkidle")
            time.sleep(1.0)
            ensure_cursor(page)

            set_banner(page, "ROLE 3: REGIONAL OFFICER", "Interactive India Heat Map · Officer Swimlanes · Workload Reassignment", "#F28C28")
            time.sleep(0.5)

            # Click region on India SVG Map
            point_at(page, 720, 480, duration=0.4, hold=2.0, ripple=True)

            # Switch to Workload Board Tab
            workload_tab = page.locator("button").filter(has_text="Workload Board").first
            smooth_move_and_click(page, workload_tab, duration=0.3)
            time.sleep(1.5)
            ensure_cursor(page)

            # Point to Officer Reassign action
            point_at(page, 850, 390, duration=0.4, hold=2.5)

            # =========================================================
            # SCENE 6: ROLE 4 - BUREAU OFFICER (~15s)
            # =========================================================
            print("  -> Scene 6: Role 4 - Bureau Officer (~15s)...")
            page.goto(f"{BASE_URL}/bureau", wait_until="networkidle")
            time.sleep(1.0)
            ensure_cursor(page)

            set_banner(page, "ROLE 4: BUREAU OFFICER", "National Pulse Dashboard · Regional Bar Race · Persistent Live Alerts Rail", "#4F46E5")
            time.sleep(0.5)

            # Point to Region Comparison Bar Chart
            point_at(page, 580, 350, duration=0.4, hold=2.5)

            # Point to Live Alerts Rail on the right
            point_at(page, 1720, 380, duration=0.4, hold=2.5)

            # Click Compare Regions tab
            compare_tab = page.locator("button").filter(has_text="Compare Regions").first
            smooth_move_and_click(page, compare_tab, duration=0.3)
            time.sleep(1.8)
            ensure_cursor(page)

            # =========================================================
            # SCENE 7: ROLE 5 - EVC COORDINATOR (~15s)
            # =========================================================
            print("  -> Scene 7: Role 5 - EVC Coordinator (~15s)...")
            page.goto(f"{BASE_URL}/evc", wait_until="networkidle")
            time.sleep(1.0)
            ensure_cursor(page)

            set_banner(page, "ROLE 5: EVC COORDINATOR", "EVC Inspection Queue · Statutory Delay Banners · Conflict-of-Interest Guard", "#6D4AFF")
            time.sleep(0.5)

            # Highlight Delay Alert Banner at top
            point_at(page, 960, 85, duration=0.4, hold=2.0)

            # Switch to Expert Pool & Conflict Guard Tab
            pool_tab = page.locator("button").filter(has_text="Expert Pool & Conflict Guard").first
            smooth_move_and_click(page, pool_tab, duration=0.3)
            time.sleep(1.5)
            ensure_cursor(page)

            # Point to Conflict Flag Card
            point_at(page, 1150, 420, duration=0.4, hold=2.5)

            # Switch to Inspection Timeline (Gantt)
            gantt_tab = page.locator("button").filter(has_text="Inspection Timeline (Gantt)").first
            smooth_move_and_click(page, gantt_tab, duration=0.3)
            time.sleep(2.0)
            ensure_cursor(page)

            # =========================================================
            # SCENE 8: ROLE 6 - COMMITTEE MEMBER (~15s)
            # =========================================================
            print("  -> Scene 8: Role 6 - Committee Member (~15s)...")
            page.goto(f"{BASE_URL}/committee", wait_until="networkidle")
            time.sleep(1.0)
            ensure_cursor(page)

            set_banner(page, "ROLE 6: COMMITTEE MEMBER", "Dossier Reading Pane · Advisory Safeguards · Conditions Builder", "#8E3B8E")
            time.sleep(0.5)

            # Point to Advisory Safeguard Notice
            point_at(page, 960, 85, duration=0.4, hold=2.0)

            # Point to Central Dossier Reading Pane
            point_at(page, 720, 480, duration=0.4, hold=2.0)

            # Point to Conditions Builder on right
            point_at(page, 1680, 520, duration=0.4, hold=2.5)

            # =========================================================
            # SCENE 9: ROLE 7 - COMPLIANCE OFFICER (~15s)
            # =========================================================
            print("  -> Scene 9: Role 7 - Compliance Officer (~15s)...")
            page.goto(f"{BASE_URL}/compliance", wait_until="networkidle")
            time.sleep(1.0)
            ensure_cursor(page)

            set_banner(page, "ROLE 7: COMPLIANCE OFFICER", "6-Stage Undertakings Kanban · Concentric Expiry Radar · Evidence Verification", "#0F9D58")
            time.sleep(0.5)

            # Point to Kanban Column (Submitted - awaiting verification)
            point_at(page, 820, 360, duration=0.4, hold=2.0, ripple=True)

            # Switch to Lease & Document Radar Tab
            radar_tab = page.locator("button").filter(has_text="Lease & Document Radar").first
            smooth_move_and_click(page, radar_tab, duration=0.3)
            time.sleep(1.8)
            ensure_cursor(page)

            # Point to 0-30 Days Critical Expiry Bucket
            point_at(page, 460, 450, duration=0.4, hold=2.5)

            # =========================================================
            # SCENE 10: ROLE 8 - SENIOR AUTHORITY (~15s)
            # =========================================================
            print("  -> Scene 10: Role 8 - Senior Authority (~15s)...")
            page.goto(f"{BASE_URL}/authority", wait_until="networkidle")
            time.sleep(1.0)
            ensure_cursor(page)

            set_banner(page, "ROLE 8: SENIOR AUTHORITY", "Council Executive Briefing · Decisions Shelf · Sovereign Human-Only Sanctions", "#1F3A8A")
            time.sleep(0.5)

            # Point to 4 Big KPI Counters
            point_at(page, 960, 320, duration=0.4, hold=2.5)

            # Point to Decisions Awaiting Competent Authority
            point_at(page, 960, 620, duration=0.4, hold=2.5)

            # Point to Decide (Sign) button
            point_at(page, 1420, 620, duration=0.3, hold=1.8, ripple=True)

            # =========================================================
            # SCENE 11: ROLE 9 - SYSTEM ADMINISTRATOR (~14s)
            # =========================================================
            print("  -> Scene 11: Role 9 - System Administrator (~14s)...")
            page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
            time.sleep(1.0)
            ensure_cursor(page)

            set_banner(page, "ROLE 9: SYSTEM ADMINISTRATOR", "Visual Node Pathway Designer · SLA Threshold Tuning · Escalation Ladder Setup", "#475569")
            time.sleep(0.5)

            # Point to Visual Workflow Node Graph
            point_at(page, 960, 380, duration=0.4, hold=2.0)

            # Click Test With Sample App
            test_app_btn = page.locator("button").filter(has_text="Test With Sample App").first
            smooth_move_and_click(page, test_app_btn, duration=0.3)
            time.sleep(2.5)
            ensure_cursor(page)

            # Switch to SLA & Timeline Rules Tab
            sla_tab = page.locator("button").filter(has_text="SLA & Timeline Rules").first
            smooth_move_and_click(page, sla_tab, duration=0.3)
            time.sleep(1.8)
            ensure_cursor(page)

            # =========================================================
            # SCENE 12: ROLE 10 - STATUTORY AUDITOR (~16s)
            # =========================================================
            print("  -> Scene 12: Role 10 - Statutory Auditor (~16s)...")
            page.goto(f"{BASE_URL}/auditor", wait_until="networkidle")
            time.sleep(1.0)
            ensure_cursor(page)

            set_banner(page, "ROLE 10: STATUTORY AUDITOR", "Immutable Forensic Ledger · Case Reconstruction Replay Scrubber · SHA-256 Hashes", "#1E293B")
            time.sleep(0.5)

            # Point to Top Read-Only Statutory Ribbon
            point_at(page, 960, 15, duration=0.4, hold=1.5)

            # Point to Case Reconstruction Scrubber
            point_at(page, 1180, 350, duration=0.4, hold=2.0)

            # Click Replay Scrubber
            replay_btn = page.locator("button").filter(has_text="Replay").first
            smooth_move_and_click(page, replay_btn, duration=0.3)
            time.sleep(3.0)
            ensure_cursor(page)

            # Open Command Palette (⌘K) to show universal fuzzy navigation
            page.keyboard.press("Control+K")
            time.sleep(1.5)
            ensure_cursor(page)
            page.keyboard.press("Escape")
            time.sleep(0.5)

            # =========================================================
            # OUTRO & REGULATORY SAFEGUARD WRAP-UP (~8s)
            # =========================================================
            print("  -> Scene 13: Brand Outro & Regulatory Safeguard (~8s)...")
            page.goto(f"{BASE_URL}/", wait_until="networkidle")
            time.sleep(0.8)
            ensure_cursor(page)

            set_banner(page, "AEGIS COMPLIANCE", "Statutory Scrutiny Supported · Sovereign Decisions Preserved · Zero Manual Pendency", "#138808")
            point_at(page, 960, 1040, duration=0.4, hold=3.0)
            time.sleep(1.5)

            print("\n[2/3] Closing recording context...")
            context.close()
            browser.close()

        except Exception as e:
            print(f"Error during walkthrough: {e}")
            try:
                context.close()
                browser.close()
            except Exception:
                pass
            raise e

    # Transcode WebM to MP4 using OpenCV VideoWriter
    print("\n[3/3] Processing captured video and transcoding to Full HD MP4...")
    webm_files = [os.path.join(raw_video_dir, f) for f in os.listdir(raw_video_dir) if f.endswith(".webm")]
    if not webm_files:
        print("Error: No raw webm video found in capture directory!")
        return

    raw_webm = webm_files[0]
    shutil.copy2(raw_webm, FINAL_WEBM)
    shutil.copy2(raw_webm, LEGACY_WEBM)

    cap = cv2.VideoCapture(raw_webm)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1920
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 1080
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    duration = total_frames / fps
    print(f"  -> Total Frames: {total_frames} ({width}x{height} @ {fps:.1f} fps)")
    print(f"  -> Calculated Duration: {duration:.1f}s (~{int(duration//60)}m {int(duration%60):02d}s)")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(FINAL_MP4, fourcc, fps, (width, height))

    count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        out.write(frame)
        count += 1
        if count % 300 == 0:
            print(f"    Progress: {count}/{total_frames} frames ({(count/total_frames)*100:.0f}%)")

    cap.release()
    out.release()
    shutil.copy2(FINAL_MP4, LEGACY_MP4)

    print("\n" + "="*65)
    print("SUCCESS: AEGIS WALKTHROUGH DEMO VIDEO GENERATED!")
    print(f"File Path:   {FINAL_MP4}")
    print(f"WebM Path:   {FINAL_WEBM}")
    print(f"Resolution:  {width}x{height} (Full HD 1080p)")
    print(f"Duration:    {duration:.1f} seconds (~{int(duration//60)}m {int(duration%60):02d}s)")
    print(f"File Size:   {os.path.getsize(FINAL_MP4) / (1024*1024):.2f} MB")
    print("="*65 + "\n")

if __name__ == "__main__":
    record_aegis_walkthrough()
