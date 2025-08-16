import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')
        page.goto(f'file://{file_path}')

        # 1. Check for initial UI elements
        expect(page.locator('#player-tile')).to_be_visible()
        expect(page.locator('#ai-tile')).to_be_visible()
        expect(page.locator('.controls')).to_be_visible()
        expect(page.locator('#log-box')).to_be_visible()

        # Check initial server counts immediately after load
        # Player: 2 saas + 1 research + 0 dev + 2 unallocated = 5
        # AI: 3 saas + 1 research + 0 dev + 1 unallocated = 5
        expect(page.locator('#player-srvTotal')).to_have_text('5')
        expect(page.locator('#ai-srvTotal')).to_have_text('5')

        # Take a screenshot of the initial state
        page.screenshot(path='jules-scratch/verification/initial_state.png')

        # 2. Simulate buying a server
        buy_button = page.locator('#btn-buy-server')
        buy_button.click()

        # 3. Assert that the player's server count has changed
        # The player should now have 5 + 1 = 6 servers
        expect(page.locator('#player-srvTotal')).to_have_text('6')

        # 4. Take a final screenshot
        page.screenshot(path='jules-scratch/verification/final_state.png')

        browser.close()

if __name__ == '__main__':
    # First, install playwright if it's not installed
    try:
        import playwright
    except ImportError:
        os.system('pip install playwright')
        os.system('playwright install')
    run_verification()
