from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        print("Navigating...")
        page.goto("http://localhost:5173/admin/consolidated")

        # Wait for page load
        time.sleep(3)

        # Take screenshot of main page (likely showing error or empty)
        page.screenshot(path="verification_main_dummy.png")
        print("Main view screenshot saved.")

        # Click "Nuevo Votante"
        print("Clicking 'Nuevo Votante'...")
        try:
            # The button should be visible even if data fetch fails
            page.get_by_role("button", name="Nuevo Votante").click()
            time.sleep(1)
            page.screenshot(path="verification_modal_dummy.png")
            print("Modal screenshot saved.")
        except Exception as e:
            print(f"Error opening modal: {e}")
            page.screenshot(path="verification_error.png")

        browser.close()

if __name__ == "__main__":
    run()
