import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')

        # Go to the local HTML file
        page.goto(f'file://{file_path}')

        # Wait for the main hex UI container to be visible
        expect(page.locator("#main-hex-svg")).to_be_visible(timeout=10000)

        # Wait for the category hexes to be rendered
        expect(page.locator("#category-hex-0")).to_be_visible()
        expect(page.locator("#category-hex-5")).to_be_visible()

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run_verification()
