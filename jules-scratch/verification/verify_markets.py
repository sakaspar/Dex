import re
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Navigates to the Markets page and verifies that it loads data.
    """
    # 1. Navigate to the markets page
    page.goto("http://localhost:5173/markets")

    # 2. Wait for the table to be populated
    # We expect the table body to have at least one row within a generous timeout
    # The `tr` elements are the rows in the table body
    expect(page.locator("tbody tr")).to_have_count(1, timeout=60000)

    # 3. Take a screenshot
    page.screenshot(path="jules-scratch/verification/markets_verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
