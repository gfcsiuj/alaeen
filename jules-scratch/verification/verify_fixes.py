import time
from playwright.sync_api import sync_playwright, Page, expect

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        base_url = "http://localhost:5173"

        # Log in
        page.goto(f"{base_url}/") # Start at the root, which should redirect to login

        # Wait for the login page to load
        expect(page.get_by_placeholder("كلمة المرور")).to_be_visible()

        page.get_by_placeholder("كلمة المرور").fill("بادي الضلع؟")
        page.get_by_role("button", name="دخول").click()

        # Wait for navigation to complete to the main page by looking for a known element
        expect(page.get_by_role("button", name="الطلبات")).to_be_visible()
        print("Login successful.")

        # 1. Verify Settings page
        print("Verifying Settings page...")
        page.get_by_role("button", name="الإعدادات").click()
        # Verify that the settings page is loaded by checking for a unique element
        expect(page.get_by_role("heading", name="الإعدادات")).to_be_visible()
        time.sleep(1) # wait for animations
        page.screenshot(path="jules-scratch/verification/settings_page.png")
        print("Settings page screenshot captured.")

        # 2. Verify Order List page
        print("Verifying Order List page...")
        page.get_by_role("button", name="الطلبات").click()
        expect(page.get_by_role("heading", name="الطلبات السابقة")).to_be_visible()
        time.sleep(1)
        page.screenshot(path="jules-scratch/verification/order_list_page.png")
        print("Order List page screenshot captured.")

        # 3. Verify Add Order page
        print("Verifying Add Order page...")
        page.get_by_role("button", name="إضافة طلب").click()
        expect(page.get_by_role("heading", name="إضافة طلب جديد")).to_be_visible()
        time.sleep(1)
        page.screenshot(path="jules-scratch/verification/add_order_page.png")
        print("Add Order page screenshot captured.")

        # 4. Verify Analytics page
        print("Verifying Analytics page...")
        page.get_by_role("button", name="التحليلات").click()
        expect(page.get_by_role("heading", name="تحليلات الأداء")).to_be_visible()
        time.sleep(1)
        page.screenshot(path="jules-scratch/verification/analytics_page.png")
        print("Analytics page screenshot captured.")

        browser.close()

if __name__ == "__main__":
    main()
