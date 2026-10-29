import time
import subprocess
import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 8008
BASE_URL = f"http://127.0.0.1:{PORT}"

def run_ui_verification():
    print(f"Starting server on port {PORT}...")
    server = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", str(PORT), "--app-dir", "backend"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    try:
        time.sleep(3) # Wait for server boot
        print("Launching Playwright headless browser...")
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
            page = browser.new_page()

            # 1. INSTITUTION LOGIN & LANDING TEST
            print("Testing Institution login (inst01)...")
            page.goto(f"{BASE_URL}/login")
            page.wait_for_selector("text=Select Authorized Demo Role")

            # Click inst01 button
            page.click("text=inst01")
            page.click("#btn-login-submit")
            
            # Verify lands on /institution/home
            page.wait_for_url("**/institution/home", timeout=8000)
            assert "/institution/home" in page.url, f"Expected /institution/home but got {page.url}"
            print("[OK] Institution landed on /institution/home")

            # Check menu items
            page.wait_for_selector("text=My Applications")
            page.wait_for_selector("text=New Application")
            page.wait_for_selector("text=Deficiencies")
            page.wait_for_selector("text=Messages")
            print("[OK] Institution sidebar verified: My Applications, New Application, Deficiencies, Messages")

            # Verify Institution sees ONLY its own applications
            inst_text = page.locator("body").inner_text()
            assert "INST-01" in inst_text, "Expected INST-01 to be displayed"
            assert "INST-02" not in inst_text, "INST-02 should NOT be visible to inst01"
            print("[OK] Institution data isolation verified (sees only INST-01)")

            # Check that anomaly flags are NOT visible
            assert "Forensic AI Anomaly Flags" not in inst_text
            print("[OK] Institution does not see anomaly flags")

            # 2. ACCESS DENIED TEST: inst01 visits /senior/overview
            print("Testing Access Denied: inst01 typing /senior/overview...")
            page.goto(f"{BASE_URL}/senior/overview")
            time.sleep(1)
            main_text = page.locator("main").inner_text()
            print("Main Text on /senior/overview:", repr(main_text))
            assert "access denied" in main_text.lower()
            print("[OK] Access Denied displayed for unauthorized route traversal")

            # 3. SCRUTINY OFFICER LOGIN TEST
            print("Testing Scrutiny Officer login (scrutiny01)...")
            page.goto(f"{BASE_URL}/login")
            page.wait_for_selector("text=Select Authorized Demo Role")
            page.click("text=scrutiny01")
            page.click("#btn-login-submit")

            page.wait_for_url("**/scrutiny/queue", timeout=8000)
            assert "/scrutiny/queue" in page.url
            print("[OK] Scrutiny Officer landed on /scrutiny/queue")

            page.wait_for_selector("text=My Queue")
            page.wait_for_selector("text=All Applications")
            page.wait_for_selector("text=Alerts")
            page.wait_for_selector("text=My Activity")
            print("[OK] Scrutiny sidebar verified: My Queue, All Applications, Alerts, My Activity")

            # Verify Scrutiny Officer does NOT see final decision button
            scrutiny_text = page.locator("body").inner_text()
            assert "Approve Extension of Approval" not in scrutiny_text
            print("[OK] Scrutiny Officer cannot open decision buttons")

            # 4. SENIOR OFFICER LOGIN TEST
            print("Testing Senior Officer login (senior01)...")
            page.goto(f"{BASE_URL}/login")
            page.wait_for_selector("text=Select Authorized Demo Role")
            page.click("text=senior01")
            page.click("#btn-login-submit")

            page.wait_for_url("**/senior/overview", timeout=8000)
            assert "/senior/overview" in page.url
            print("[OK] Senior Officer landed on /senior/overview")

            page.wait_for_selector("text=Overview")
            page.wait_for_selector("text=Escalated Cases")
            page.wait_for_selector("text=Decisions")
            page.wait_for_selector("text=Assign")
            page.wait_for_selector("text=Rules")
            page.wait_for_selector("text=Reports")
            print("[OK] Senior Officer sidebar verified: Overview, Escalated Cases, Decisions, Assign, Rules, Reports")

            # Verify decision panel
            page.wait_for_selector("text=Final Regulatory Decision Panel")
            print("[OK] Senior Officer has final decision panel")

            # 5. AUDITOR LOGIN TEST
            print("Testing Auditor login (auditor01)...")
            page.goto(f"{BASE_URL}/login")
            page.wait_for_selector("text=Select Authorized Demo Role")
            page.click("text=auditor01")
            page.click("#btn-login-submit")

            page.wait_for_url("**/audit/logs", timeout=8000)
            assert "/audit/logs" in page.url
            print("[OK] Auditor landed on /audit/logs")

            page.wait_for_selector("text=Read-only access")
            page.wait_for_selector("text=Audit Log")
            page.wait_for_selector("text=Applications (view)")
            page.wait_for_selector("text=Rule History")
            page.wait_for_selector("text=Export")
            print("[OK] Auditor sidebar and 'Read-only access' tag verified")

            browser.close()
            print("ALL UI & ROLE SPECIFICATION TESTS PASSED SUCCESSFULLY!")

    finally:
        server.terminate()
        server.wait()

if __name__ == "__main__":
    run_ui_verification()
