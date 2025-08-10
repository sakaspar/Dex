import re
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Navigates to the app, performs a scan, and takes a screenshot.
    """
    # 1. Navigate to the app
    page.goto("http://localhost:5173/")

    # 2. Find the input for the token address and fill it
    token_input = page.get_by_label("Token Address or Symbol")
    expect(token_input).to_be_visible()
    token_input.fill("UNI")

    # 3. Click the scan button
    scan_button = page.get_by_role("button", name="Scan Now")
    scan_button.click()

    # 4. Wait for the scan to complete and results to appear
    # We'll wait for the status message to show "Scan complete"
    expect(page.locator("text=/Scan complete/")).to_be_visible(timeout=60000)

    # Also wait for the results header to be visible
    results_header = page.get_by_role("heading", name=re.compile(r"Results \(\d+\)"))
    expect(results_header).to_be_visible()

    # 5. Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
