
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("1. Navigating to Login...")
        page.goto("http://localhost:5173/login")
        page.wait_for_load_state("networkidle")
        
        print("2. Logging in as Admin...")
        page.fill("input[type='email']", "automation@test.com")
        page.fill("input[type='password']", "password123")
        page.click("button[type='submit']")
        
        # Wait for redirect to home or admin
        page.wait_for_url("http://localhost:5173/", timeout=10000)
        print("   Login Successful (Redirected to Home)")
        
        print("3. Navigating to Admin Dashboard...")
        page.goto("http://localhost:5173/admin")
        page.wait_for_selector("text=Gerenciar Produtos", timeout=10000)
        print("   Admin Dashboard Loaded")
        
        # Verify "Novo Produto" button
        if page.is_visible("text=Novo Produto"):
            print("   ✅ 'Novo Produto' button found")
        else:
            print("   ❌ 'Novo Produto' button NOT found")
            
        print("4. Navigating to User Management...")
        page.click("a[href='/admin/users']")
        page.wait_for_url("http://localhost:5173/admin/users")
        page.wait_for_selector("text=Gestão de Usuários")
        print("   User Management Screen Loaded")
        
        # Verify Table Content
        # Wait a bit for data fetch
        time.sleep(2) 
        row_count = page.locator("tbody tr").count()
        print(f"   Rows in User Table: {row_count}")
        
        if row_count > 0:
            print("   ✅ Users list populated")
        else:
            print("   ❌ Users list EMPTY (RLS Issue?)")
            
        # Screenshot
        screenshot_path = "admin_verified.png"
        page.screenshot(path=screenshot_path)
        print(f"5. Screenshot saved to {screenshot_path}")
        
        browser.close()

if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"❌ Test Failed: {e}")
