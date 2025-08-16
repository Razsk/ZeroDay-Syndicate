import os
from playwright.sync_api import sync_playwright, expect

def verify_game_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the full path to the index.html file
        file_path = f"file://{os.getcwd()}/index.html"
        page.goto(file_path)

        # Wait for the main hex UI to be rendered to ensure the game has loaded
        expect(page.locator("#main-hex-svg")).to_be_visible(timeout=10000)

        # Give a little extra time for all the dynamic elements to render
        page.wait_for_timeout(2000)

        # Take a screenshot of the entire page
        page.screenshot(path="jules-scratch/verification/game_state.png")

        browser.close()

if __name__ == "__main__":
    verify_game_ui()
