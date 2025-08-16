import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the HTML file
        file_path = os.path.abspath('index.html')

        # Go to the local HTML file
        page.goto(f'file://{file_path}')

        # Wait for the main hex UI to be rendered
        page.wait_for_selector('#main-hex-svg')

        # Take a screenshot of the initial state
        page.screenshot(path='jules-scratch/verification/initial_state.png')

        # Find the "Buy SaaS Server" draggable element
        saas_server_draggable = page.locator('.server-draggable.saas-server-buy')

        # Find the first category hexagon dropzone
        first_category_hex = page.locator('#category-hex-0')

        # Perform the drag and drop
        saas_server_draggable.drag_to(first_category_hex, force=True)

        # Wait for the UI to update
        page.wait_for_timeout(500)

        # Take a screenshot of the final state
        page.screenshot(path='jules-scratch/verification/final_state.png')

        browser.close()

if __name__ == "__main__":
    run_verification()
