import os
import sys
import time
import subprocess
from playwright.sync_api import sync_playwright

OUTPUT_DIR = r"d:\SIH 2026\output_videos"
os.makedirs(OUTPUT_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
FFMPEG_PATH = r"C:\Users\Krishna Raghav\AppData\Local\ms-playwright\ffmpeg-1013\ffmpeg-win64.exe"

HUD_INJECTION_SCRIPT = """
(function() {
  if (document.getElementById('demo-guide-hud')) return;

  // 1. Injected Custom Mouse Pointer
  const cursor = document.createElement('div');
  cursor.id = 'demo-mouse-cursor';
  cursor.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));">
      <path d="M4 4L11 20L14 13L21 10L4 4Z" fill="#0F172A" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>
    <div id="click-ring" style="position: absolute; top: 0px; left: 0px; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #E8890C; background: rgba(232, 137, 12, 0.2); pointer-events: none; opacity: 0; transform: scale(0.4); transition: transform 0.3s ease-out, opacity 0.3s ease-out;"></div>
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
      }, 300);
    }
  };

  // 2. Injected Narration Guide HUD
  const hud = document.createElement('div');
  hud.id = 'demo-guide-hud';
  hud.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #E8890C; box-shadow: 0 0 8px #E8890C;"></span>
        <span id="hud-step" style="font-size: 11px; font-weight: 800; color: #E8890C; letter-spacing: 0.08em; text-transform: uppercase;">
          STEP 1 OF 8 · AUTHENTICATION
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 10px; font-weight: 700; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(148, 163, 184, 0.2); padding: 2px 7px; border-radius: 4px; color: #94A3B8;">
          LIVE DEMO WALKTHROUGH
        </span>
        <span id="hud-time" style="font-size: 11px; font-family: monospace; font-weight: 700; color: #E2E8F0;">
          0:00 / 1:50
        </span>
      </div>
    </div>

    <div id="hud-title" style="font-size: 15px; font-weight: 700; color: #FFFFFF; line-height: 1.25; margin-bottom: 4px;">
      Welcome to SmartVerifyAI (AICTE EoA Verification)
    </div>

    <div id="hud-desc" style="font-size: 12px; color: #CBD5E1; line-height: 1.45;">
      Loading demo sequence...
    </div>

    <div style="width: 100%; height: 3px; background: rgba(51, 65, 85, 0.6); border-radius: 2px; margin-top: 10px; overflow: hidden;">
      <div id="hud-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #E8890C, #FBBF24); border-radius: 2px; transition: width 0.3s ease;"></div>
    </div>
  `;

  hud.style.position = 'fixed';
  hud.style.bottom = '22px';
  hud.style.left = '50%';
  hud.style.transform = 'translateX(-50%)';
  hud.style.width = '840px';
  hud.style.maxWidth = '92%';
  hud.style.background = 'rgba(15, 23, 42, 0.94)';
  hud.style.backdropFilter = 'blur(16px)';
  hud.style.border = '1px solid rgba(232, 137, 12, 0.4)';
  hud.style.borderRadius = '10px';
  hud.style.padding = '12px 20px 10px 20px';
  hud.style.boxShadow = '0 20px 35px -5px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05)';
  hud.style.zIndex = '9999998';
  hud.style.fontFamily = "'Noto Sans', sans-serif";
  hud.style.pointerEvents = 'none';

  document.body.appendChild(hud);

  window.updateHUD = function(step, title, desc, time, progress) {
    document.getElementById('hud-step').innerText = step;
    document.getElementById('hud-title').innerText = title;
    document.getElementById('hud-desc').innerText = desc;
    document.getElementById('hud-time').innerText = time;
    document.getElementById('hud-progress').style.width = progress + '%';
  };
})();
"""

def smooth_move(page, start_x, start_y, end_x, end_y, duration=0.8, steps=25):
    """Interpolates mouse position smoothly from start to end."""
    for i in range(1, steps + 1):
        t = i / steps
        ease = t * t * (3.0 - 2.0 * t)
        curr_x = int(start_x + (end_x - start_x) * ease)
        curr_y = int(start_y + (end_y - start_y) * ease)
        page.evaluate(f"window.setCursorPos({curr_x}, {curr_y})")
        page.mouse.move(curr_x, curr_y)
        time.sleep(duration / steps)
    return end_x, end_y

def click_coords(page, x, y):
    """Simulates realistic click with visual ripple."""
    page.evaluate("window.triggerClickRipple()")
    page.mouse.click(x, y)
    time.sleep(0.3)

def ensure_hud(page):
    """Ensures HUD is injected in case of navigation."""
    page.evaluate(HUD_INJECTION_SCRIPT)

def update_narration(page, step, title, desc, timer_str, pct):
    ensure_hud(page)
    step_safe = step.replace("'", "\\'")
    title_safe = title.replace("'", "\\'")
    desc_safe = desc.replace("'", "\\'")
    page.evaluate(f"window.updateHUD('{step_safe}', '{title_safe}', '{desc_safe}', '{timer_str}', {pct})")

def smooth_move_to_element(page, locator, duration=0.8):
    loc = locator if hasattr(locator, 'bounding_box') else page.locator(locator).first
    loc.scroll_into_view_if_needed()
    time.sleep(0.2)
    box = loc.bounding_box()
    if box:
        target_x = int(box["x"] + box["width"] / 2)
        target_y = int(box["y"] + box["height"] / 2)
        curr_x = page.evaluate("window.__cursorPos ? window.__cursorPos.x : 960")
        curr_y = page.evaluate("window.__cursorPos ? window.__cursorPos.y : 540")
        smooth_move(page, curr_x, curr_y, target_x, target_y, duration=duration)
        return target_x, target_y
    return 960, 540

def smooth_move_and_click(page, locator, duration=0.8):
    loc = locator if hasattr(locator, 'bounding_box') else page.locator(locator).first
    loc.scroll_into_view_if_needed()
    time.sleep(0.2)
    box = loc.bounding_box()
    if box:
        target_x = int(box["x"] + box["width"] / 2)
        target_y = int(box["y"] + box["height"] / 2)
        curr_x = page.evaluate("window.__cursorPos ? window.__cursorPos.x : 960")
        curr_y = page.evaluate("window.__cursorPos ? window.__cursorPos.y : 540")
        smooth_move(page, curr_x, curr_y, target_x, target_y, duration=duration)
        click_coords(page, target_x, target_y)
        return target_x, target_y
    else:
        loc.click()
        return 960, 540

def run_recording():
    print("[1/5] Initializing Playwright browser recording context (1920x1080)...")
    raw_video_dir = os.path.join(OUTPUT_DIR, "raw_capture")
    os.makedirs(raw_video_dir, exist_ok=True)

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

        print("[2/5] Navigating to Pramaan application at http://localhost:5173...")
        page.goto("http://localhost:5173", wait_until="networkidle")
        time.sleep(1)
        ensure_hud(page)

        # -------------------------------------------------------------
        # SCENE 1: LOGIN & ROLE ARCHITECTURE (0:00 -> 0:14 | 14s)
        # -------------------------------------------------------------
        print("  -> Recording Scene 1: Role-Based Login & Access Architecture...")
        update_narration(
            page,
            "STEP 1 OF 8 · GOVERNMENT PORTAL AUTHENTICATION",
            "1. Role-Based Login & Access Architecture",
            "Welcome to SmartVerifyAI. Built for AICTE to pre-check Extension of Approval (EoA) applications. We start by selecting our primary demo role: Scrutiny Officer.",
            "0:04 / 1:50",
            4
        )
        time.sleep(3.5)

        # Move to Scrutiny Officer card and click
        card = page.locator("button").filter(has_text="Scrutiny Officer").first
        smooth_move_and_click(page, card, duration=1.0)
        time.sleep(1.5)

        update_narration(
            page,
            "STEP 1 OF 8 · GOVERNMENT PORTAL AUTHENTICATION",
            "1. Role-Based Login & Access Architecture",
            "One-click role switching loads demo credentials for Scrutiny Officer, Senior Officer, Institution, and Auditor. Click Sign In to enter the workspace.",
            "0:09 / 1:50",
            8
        )
        # Move to Sign In button and click
        submit_btn = page.locator("#btn-login-submit").first
        smooth_move_and_click(page, submit_btn, duration=1.2)
        time.sleep(2.0)

        # Page re-renders into Dashboard
        page.wait_for_selector("text=Latest Applications", timeout=5000)
        ensure_hud(page)
        time.sleep(4.0)

        # -------------------------------------------------------------
        # SCENE 2: EXECUTIVE DASHBOARD & AI METRICS (0:14 -> 0:34 | 20s)
        # -------------------------------------------------------------
        print("  -> Recording Scene 2: Executive Dashboard & Intelligence Pulse...")
        update_narration(
            page,
            "STEP 2 OF 8 · EXECUTIVE DASHBOARD & INTELLIGENCE",
            "2. Instant Regulatory Pulse: 5 Status States & Prototype Metrics",
            "5 count cards provide an instant pulse of all 15 dossiers: Clean (Green), Needs Review (Amber), Deficient (Red), and Verification Pending (Blue).",
            "0:18 / 1:50",
            16
        )
        # Hover across Clean, Needs Review, Deficient cards
        smooth_move_to_element(page, page.locator("text=Clean Applications").first, duration=1.2)
        time.sleep(2.0)
        smooth_move_to_element(page, page.locator("text=Needs Review").first, duration=1.0)
        time.sleep(2.0)
        smooth_move_to_element(page, page.locator("text=Deficient Applications").first, duration=1.0)
        time.sleep(2.0)

        update_narration(
            page,
            "STEP 2 OF 8 · EXECUTIVE DASHBOARD & INTELLIGENCE",
            "2. Critical Alerts & Real-Time Performance Benchmarks",
            "'Needs Your Attention' alerts officers to missing or expired certificates. Prototype metrics track 98.4% OCR accuracy and 1.2s average verification speed.",
            "0:26 / 1:50",
            24
        )
        # Hover down to alerts panel
        smooth_move_to_element(page, page.locator("text=Needs Your Attention").first, duration=1.2)
        time.sleep(3.0)
        # Hover down to prototype metrics
        smooth_move_to_element(page, page.locator("text=Prototype Performance Metrics").first, duration=1.5)
        time.sleep(3.0)
        # Scroll up slightly
        page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
        time.sleep(2.5)

        # -------------------------------------------------------------
        # SCENE 3: CENTRAL APPLICATIONS REGISTRY (0:34 -> 0:50 | 16s)
        # -------------------------------------------------------------
        print("  -> Recording Scene 3: Applications Central Registry...")
        update_narration(
            page,
            "STEP 3 OF 8 · CENTRAL APPLICATIONS REGISTRY",
            "3. Search, Filter & Identify Discrepancies Early",
            "Navigate to the full registry of 15 institutional dossiers. Officers can search by Institute Name or AICTE ID, or filter by regulatory category.",
            "0:36 / 1:50",
            33
        )
        # Move to sidebar 'Applications' link and click
        aside_apps = page.locator("aside button").filter(has_text="Applications").first
        smooth_move_and_click(page, aside_apps, duration=1.2)
        page.wait_for_selector("text=APP-2026-004", timeout=5000)
        ensure_hud(page)
        time.sleep(2.0)

        update_narration(
            page,
            "STEP 3 OF 8 · CENTRAL APPLICATIONS REGISTRY",
            "3. Highlighting High-Risk Dossiers for Immediate Scrutiny",
            "Application APP-2026-004 (Apex Engineering Academy) is tagged 'Deficient' due to a missing statutory filing. Let's inspect the dossier.",
            "0:42 / 1:50",
            39
        )
        # Move to search input
        search_box = page.locator("input[placeholder*='Search by ID']").first
        smooth_move_to_element(page, search_box, duration=1.0)
        time.sleep(1.5)

        # Move to row APP-2026-004 and click Open Dossier
        open_dossier_btn = page.locator("tr").filter(has_text="APP-2026-004").locator("button").filter(has_text="Open Dossier").first
        smooth_move_and_click(page, open_dossier_btn, duration=1.2)
        page.wait_for_selector("textarea", timeout=8000)
        ensure_hud(page)
        time.sleep(2.5)

        # -------------------------------------------------------------
        # SCENE 4: DOSSIER INSPECTION & CHECKLIST (0:50 -> 1:10 | 20s)
        # -------------------------------------------------------------
        print("  -> Recording Scene 4: Dossier Inspection & Automated Checklist...")
        update_narration(
            page,
            "STEP 4 OF 8 · DOSSIER & AUTOMATED CHECKLIST",
            "4. Automated Checklist Selection (APH 2026-27 Norms)",
            "Pramaan detects the category (Extension of Approval) and automatically loads statutory requirements from APH Chapter 4. Let's examine the checklist.",
            "0:52 / 1:50",
            48
        )
        time.sleep(3.0)

        # Click Checklist tab
        tab_chk = page.locator("button").filter(has_text="Checklist").first
        smooth_move_and_click(page, tab_chk, duration=1.0)
        time.sleep(2.0)
        ensure_hud(page)

        update_narration(
            page,
            "STEP 4 OF 8 · DOSSIER & AUTOMATED CHECKLIST",
            "4. Immediate Discrepancy Detection: Missing Fire Safety NOC",
            "Affiliation Letter and Land Deed are 'Present' (Green). Fire Safety Certificate is flagged 'Missing' (Red) with zero manual data entry needed.",
            "0:59 / 1:50",
            54
        )
        # Hover over Missing badge on Fire Safety Certificate
        missing_row = page.locator("text=Fire Safety Certificate").first
        smooth_move_to_element(page, missing_row, duration=1.2)
        time.sleep(3.5)

        # Click Documents tab
        tab_docs = page.locator("button").filter(has_text="Documents").first
        smooth_move_and_click(page, tab_docs, duration=1.0)
        time.sleep(2.0)
        ensure_hud(page)

        update_narration(
            page,
            "STEP 4 OF 8 · DOSSIER & AUTOMATED CHECKLIST",
            "4. Document OCR Extractions & Cryptographic Hash Fingerprint",
            "Documents tab displays uploaded PDFs, cryptographic SHA-256 digests, and OCR-extracted fields: Reference numbers, validity dates, and issuing bodies.",
            "1:05 / 1:50",
            60
        )
        # Hover over OCR extracted fields box
        ocr_box = page.locator("text=OCR Extracted Fields").first
        smooth_move_to_element(page, ocr_box, duration=1.2)
        time.sleep(4.0)

        # -------------------------------------------------------------
        # SCENE 5: SOURCE VERIFICATION AT ISSUING AUTHORITIES (1:10 -> 1:26 | 16s)
        # -------------------------------------------------------------
        print("  -> Recording Scene 5: Source Verification at Issuing Authorities...")
        update_narration(
            page,
            "STEP 5 OF 8 · EXTERNAL SOURCE VERIFICATION",
            "5. Zero Guesswork: Direct Issuing-Authority Check",
            "Pramaan queries issuing authorities directly: University Portals, NBA/NAAC, State Land Records, and Fire Services. Results store immutable timestamps.",
            "1:12 / 1:50",
            66
        )
        # Click Verification tab
        tab_ver = page.locator("button").filter(has_text="Source Verification").first
        smooth_move_and_click(page, tab_ver, duration=1.0)
        time.sleep(2.0)
        ensure_hud(page)

        # Hover over verification section header
        ver_header = page.locator("h2").filter(has_text="External Issuing-Authority").first
        smooth_move_to_element(page, ver_header, duration=1.2)
        time.sleep(3.0)

        update_narration(
            page,
            "STEP 5 OF 8 · EXTERNAL SOURCE VERIFICATION",
            "5. Live Re-querying: Verified, Mismatch, or Expired Statuses",
            "Clicking 'Re-query Source' triggers a real-time call to the issuing authority registry, verifying the certificate and returning the official JSON payload.",
            "1:18 / 1:50",
            72
        )
        # Move to 'Re-query Source' button and click
        requery_btn = page.locator("button").filter(has_text="Re-query Source").first
        smooth_move_and_click(page, requery_btn, duration=1.2)
        time.sleep(3.5)

        # -------------------------------------------------------------
        # SCENE 6: FORENSICS & INFRASTRUCTURE NORMS (1:26 -> 1:38 | 12s)
        # -------------------------------------------------------------
        print("  -> Recording Scene 6: Forensics & Physical Norms...")
        update_narration(
            page,
            "STEP 6 OF 8 · FORENSIC ANOMALY DETECTION & INFRASTRUCTURE",
            "6. Digital Tampering Forensics & Physical Norms Check",
            "Forensics uncover duplicate hashes across institutions, date alterations, and editing tool metadata. Notice the disclaimer: AI assists, humans verify.",
            "1:28 / 1:50",
            80
        )
        # Click Flags tab
        tab_flg = page.locator("button").filter(has_text="Anomaly Flags").first
        smooth_move_and_click(page, tab_flg, duration=1.0)
        time.sleep(2.0)
        ensure_hud(page)

        # Hover over forensic section header
        flags_header = page.locator("h2").filter(has_text="Forensic Anomaly Flags").first
        smooth_move_to_element(page, flags_header, duration=1.2)
        time.sleep(3.5)

        update_narration(
            page,
            "STEP 6 OF 8 · FORENSIC ANOMALY DETECTION & INFRASTRUCTURE",
            "6. Campus Infrastructure: Carpet Area & Laboratory Sufficiency",
            "The Infrastructure tab validates built-up instructional area (norm 4.5 sq.m/student) and equipment ratios, producing advisory recommendations.",
            "1:34 / 1:50",
            86
        )
        # Click Infrastructure tab
        tab_infra = page.locator("button").filter(has_text="Infrastructure Check").first
        smooth_move_and_click(page, tab_infra, duration=1.0)
        time.sleep(2.0)
        ensure_hud(page)

        # Hover over stat cards
        infra_header = page.locator("h2").filter(has_text="Campus Physical Infrastructure").first
        smooth_move_to_element(page, infra_header, duration=1.0)
        time.sleep(2.5)

        # -------------------------------------------------------------
        # SCENE 7: HUMAN ADJUDICATION (OFFICER ACTION) (1:38 -> 1:47 | 9s)
        # -------------------------------------------------------------
        print("  -> Recording Scene 7: Human in the Loop: Officer Adjudication...")
        update_narration(
            page,
            "STEP 7 OF 8 · OFFICER ADJUDICATION",
            "7. Human in the Loop: Officer Takes the Regulatory Call",
            "AI only assists. The Scrutiny Officer selects 'Request Clarification', types specific instructions for the institution, and submits the decision.",
            "1:39 / 1:50",
            91
        )
        # Click 'Request Clarification' radio
        radio_req = page.locator("input[type='radio'][value='Request Clarification']").first
        smooth_move_and_click(page, radio_req, duration=1.0)
        time.sleep(1.0)

        # Move to remarks textarea and fill
        txt = page.locator("textarea").first
        smooth_move_and_click(page, txt, duration=0.8)
        txt.fill("Mandatory Fire Safety NOC missing. Please submit valid clearance from State Fire Services within 7 working days.")
        time.sleep(1.2)

        # Move to Submit Decision button and click
        sub_btn = page.locator("button").filter(has_text="Submit Decision").first
        smooth_move_and_click(page, sub_btn, duration=0.8)
        time.sleep(2.0)
        ensure_hud(page)

        # -------------------------------------------------------------
        # SCENE 8: AUDIT TRAIL & BILINGUAL LOCALIZATION (1:47 -> 1:51 | 4s)
        # -------------------------------------------------------------
        print("  -> Recording Scene 8: Immutable Audit Trail & Hindi Localization...")
        update_narration(
            page,
            "STEP 8 OF 8 · AUDIT LEDGER & LOCALIZATION",
            "8. Tamper-Proof Audit Trail & Full Hindi (हिन्दी) Localization",
            "Every action is permanently sealed in the audit ledger with CSV export. Toggle between English and Hindi with full Devanagari typography.",
            "1:48 / 1:50",
            98
        )
        # Move to sidebar 'Audit Trail' and click
        aside_audit = page.locator("aside button").filter(has_text="Audit Trail").first
        smooth_move_and_click(page, aside_audit, duration=1.0)
        page.wait_for_selector("text=Immutable Regulatory Ledger", timeout=5000)
        time.sleep(1.8)
        ensure_hud(page)

        # Move to header language toggle (EN | हिं) and click
        hindi_toggle = page.locator("header button").filter(has_text="हिन्दी").first
        smooth_move_and_click(page, hindi_toggle, duration=1.0)
        time.sleep(2.0)
        ensure_hud(page)

        update_narration(
            page,
            "COMPLETE · SMARTVERIFYAI AICTE 2026",
            "SmartVerifyAI: Check early. Verify at source. Decide with evidence.",
            "Prototype ready for Smart India Hackathon 2026 · Problem Statement 26261 · Regulation Bureau, AICTE.",
            "1:50 / 1:50",
            100
        )
        time.sleep(2.5)

        print("[3/5] Finalizing video recording...")
        context.close()
        browser.close()

    # Find the recorded webm file
    webm_files = [os.path.join(raw_video_dir, f) for f in os.listdir(raw_video_dir) if f.endswith(".webm")]
    if not webm_files:
        print("Error: No raw video file recorded!")
        return

    raw_webm = webm_files[0]
    final_webm = r"d:\SIH 2026\SmartVerifyAI_Demo_Walkthrough.webm"
    final_mp4 = r"d:\SIH 2026\SmartVerifyAI_Demo_Walkthrough.mp4"
    alt_webm = r"d:\SIH 2026\Pramaan_Demo_Walkthrough.webm"
    alt_mp4 = r"d:\SIH 2026\Pramaan_Demo_Walkthrough.mp4"

    # Copy / rename final webm
    import shutil
    shutil.copy2(raw_webm, final_webm)
    shutil.copy2(raw_webm, alt_webm)
    os.remove(raw_webm)

    print(f"[4/5] WebM Master Video saved to: {final_webm} ({os.path.getsize(final_webm) / (1024*1024):.2f} MB)")

    # Transcode to MP4 using OpenCV for universal cross-platform playback
    print("[5/5] Generating MP4 format using OpenCV VideoWriter...")
    import cv2
    cap = cv2.VideoCapture(final_webm)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1920
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 1080
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"  -> Transcoding {total_frames} frames ({width}x{height} @ {fps:.1f} fps) to MP4...")

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(final_mp4, fourcc, fps, (width, height))

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        out.write(frame)
        frame_count += 1

    cap.release()
    out.release()

    # Also duplicate to alt_mp4
    shutil.copy2(final_mp4, alt_mp4)

    duration_sec = frame_count / fps
    print(f"\n=======================================================")
    print(f"SUCCESS! Demo video generated successfully!")
    print(f"Total Video Duration: {duration_sec:.1f} seconds (~1 min {int(duration_sec%60)} sec)")
    print(f"MP4 Output:  {final_mp4} ({os.path.getsize(final_mp4) / (1024*1024):.2f} MB)")
    print(f"WebM Output: {final_webm} ({os.path.getsize(final_webm) / (1024*1024):.2f} MB)")
    print(f"=======================================================")

if __name__ == "__main__":
    run_recording()
