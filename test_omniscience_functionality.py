from __future__ import annotations


#!/usr/bin/env python3
"""🧪 Автоматизована перевірка функціональності Omniscience на NVIDIA сервері
Вимагає: pip install selenium requests beautifulsoup4.

Використання: python3 test_omniscience_functionality.py <NVIDIA_SERVER_IP>
"""

import sys
import time

import requests
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class OmniscienceTester:
    def __init__(self, nvidia_ip):
        self.nvidia_ip = nvidia_ip
        self.base_url = f"http://{nvidia_ip}:8092"
        self.api_url = f"http://{nvidia_ip}:8090"
        self.errors = []
        self.success_count = 0
        self.total_tests = 0

        # Налаштування Chrome headless
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")

        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 10)
        except Exception as e:
            print(f"❌ Помилка ініціалізації Selenium: {e}")
            print("💡 Встановіть ChromeDriver або використовуйте альтернативний тест")
            sys.exit(1)

    def log_test(self, test_name, success, message=""):
        self.total_tests += 1
        if success:
            self.success_count += 1
            print(f"✅ {test_name}")
        else:
            self.errors.append(f"❌ {test_name}: {message}")
            print(f"❌ {test_name}: {message}")

    def test_api_endpoints(self):
        """Перевірка API ендпоїнтів."""
        print("\n📋 Перевірка API ендпоїнтів")
        print("=" * 40)

        # Health check
        try:
            response = requests.get(f"{self.api_url}/health", timeout=5)
            self.log_test("Backend Health", response.status_code == 200, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Backend Health", False, str(e))

        # V25 реалтайм метрики
        try:
            response = requests.get(f"{self.api_url}/api/v25/metrics/realtime", timeout=5)
            if response.status_code == 200:
                data = response.json()
                has_required_fields = all(key in data for key in ['ndcg', 'latency', 'throughput', 'error_rate'])
                self.log_test("V25 Metrics", has_required_fields, "Немає всіх полів")
            else:
                self.log_test("V25 Metrics", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("V25 Metrics", False, str(e))

        # Системні метрики
        try:
            response = requests.get(f"{self.api_url}/api/v1/system/metrics", timeout=5)
            self.log_test("System Metrics", response.status_code == 200, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("System Metrics", False, str(e))

        # Агенти
        try:
            response = requests.get(f"{self.api_url}/api/v1/agents", timeout=5)
            self.log_test("Agents API", response.status_code == 200, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Agents API", False, str(e))

    def test_omniscience_ui(self):
        """Перевірка UI Omniscience."""
        print("\n📋 Перевірка Omniscience UI")
        print("=" * 40)

        try:
            # Відкрити Omniscience сторінку
            self.driver.get(f"{self.base_url}/omniscience")
            time.sleep(3)

            # Перевірити заголовок
            try:
                self.wait.until(
                    EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'PREDATOR OMNISCIENCE')]"))
                )
                self.log_test("Omniscience Title", True)
            except TimeoutException:
                self.log_test("Omniscience Title", False, "Заголовок не знайдено")

            # Перевірити індикатор LINK
            try:
                link_indicator = self.driver.find_element(By.XPATH, "//div[contains(text(), 'LINK')]/following-sibling::div")
                link_status = link_indicator.text.strip().lower()
                self.log_test("LINK Indicator", link_status in ['ws', 'polling'], f"Невідомий статус: {link_status}")

                # Перевірити колір індикатора
                link_dot = self.driver.find_element(By.XPATH, "//div[contains(text(), 'LINK')]/preceding-sibling::div")
                dot_class = link_dot.get_attribute("class")
                is_green = "green" in dot_class
                is_cyan = "cyan" in dot_class
                is_red = "red" in dot_class

                if link_status == 'ws' and is_green:
                    self.log_test("LINK WebSocket Color", True)
                elif link_status == 'polling' and is_cyan:
                    self.log_test("LINK Polling Color", True)
                elif link_status == 'offline' and is_red:
                    self.log_test("LINK Offline Color", True)
                else:
                    self.log_test("LINK Color", False, f"Невідповідність кольору: {link_status} -> {dot_class}")

            except Exception as e:
                self.log_test("LINK Indicator", False, str(e))

            # Перевірити метрики
            try:
                metrics_cards = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'panel-3d')]")
                has_metrics = len(metrics_cards) >= 4  # Очікуємо мінімум 4 картки метрик
                self.log_test("Metrics Cards", has_metrics, f"Знайдено {len(metrics_cards)} карток")
            except Exception as e:
                self.log_test("Metrics Cards", False, str(e))

            # Перевірити навігаційні таби
            try:
                nav_tabs = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'tab') or contains(@role, 'tab')]")
                has_tabs = len(nav_tabs) >= 3  # Overview, Agents, Knowledge, Control
                self.log_test("Navigation Tabs", has_tabs, f"Знайдено {len(nav_tabs)} табів")
            except Exception as e:
                self.log_test("Navigation Tabs", False, str(e))

            # Перевірити 3D ефекти та анімації
            try:
                animated_elements = self.driver.find_elements(By.XPATH, "//*[contains(@class, 'gradient-text-animated')]")
                has_animation = len(animated_elements) > 0
                self.log_test("3D Animations", has_animation, f"Знайдено {len(animated_elements)} анімацій")
            except Exception as e:
                self.log_test("3D Animations", False, str(e))

        except Exception as e:
            self.log_test("Omniscience UI Load", False, str(e))

    def test_websocket_functionality(self):
        """Перевірка WebSocket функціональності."""
        print("\n📋 Перевірка WebSocket функціональності")
        print("=" * 40)

        # Перевіряємо WebSocket через JavaScript injection
        try:
            self.driver.get(f"{self.base_url}/omniscience")
            time.sleep(3)

            # Ін'єкція JavaScript для перевірки WebSocket
            ws_test_script = f"""
            return new Promise((resolve) => {{
                try {{
                    const ws = new WebSocket('ws://{self.nvidia_ip}:8090/api/v25/ws/omniscience');
                    ws.onopen = () => resolve({{status: 'connected', error: null}});
                    ws.onerror = (e) => resolve({{status: 'error', error: e.toString()}});
                    ws.onmessage = (e) => resolve({{status: 'message_received', data: e.data}});

                    // Timeout after 5 seconds
                    setTimeout(() => {{
                        if (ws.readyState === WebSocket.CONNECTING) {{
                            resolve({{status: 'timeout', error: 'Connection timeout'}});
                        }}
                    }}, 5000);
                }} catch (e) {{
                    resolve({{status: 'exception', error: e.toString()}});
                }}
            }});
            """

            result = self.driver.execute_script("return " + ws_test_script)

            if result['status'] == 'connected':
                self.log_test("WebSocket Connection", True)
            elif result['status'] == 'message_received':
                self.log_test("WebSocket Data", True)
            else:
                self.log_test("WebSocket Connection", False, result.get('error', 'Unknown error'))

        except Exception as e:
            self.log_test("WebSocket Test", False, str(e))

    def test_responsive_design(self):
        """Перевірка адаптивного дизайну."""
        print("\n📋 Перевірка адаптивного дизайну")
        print("=" * 40)

        # Тест різних розмірів екрану
        screen_sizes = [
            (1920, 1080, "Desktop"),
            (768, 1024, "Tablet"),
            (375, 667, "Mobile")
        ]

        for width, height, name in screen_sizes:
            try:
                self.driver.set_window_size(width, height)
                self.driver.get(f"{self.base_url}/omniscience")
                time.sleep(2)

                # Перевіряємо, чи елементи видимі
                title = self.driver.find_element(By.XPATH, "//h1[contains(text(), 'PREDATOR OMNISCIENCE')]")
                is_visible = title.is_displayed()

                self.log_test(f"Responsive {name}", is_visible, f"Елементи не видимі на {width}x{height}")

            except Exception as e:
                self.log_test(f"Responsive {name}", False, str(e))

    def test_performance(self):
        """Перевірка продуктивності."""
        print("\n📋 Перевірка продуктивності")
        print("=" * 40)

        try:
            start_time = time.time()
            self.driver.get(f"{self.base_url}/omniscience")

            # Чекаємо завантаження основних елементів
            self.wait.until(
                EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'PREDATOR OMNISCIENCE')]"))
            )

            load_time = time.time() - start_time
            is_fast = load_time < 5.0  # Менше 5 секунд

            self.log_test("Page Load Time", is_fast, f"Завантаження зайняло {load_time:.2f}с")

        except Exception as e:
            self.log_test("Page Load Time", False, str(e))

    def run_all_tests(self):
        """Запустити всі тести."""
        print(f"🚀 Починаю автоматичну перевірку Omniscience на {self.nvidia_ip}")
        print("=" * 60)

        self.test_api_endpoints()
        self.test_omniscience_ui()
        self.test_websocket_functionality()
        self.test_responsive_design()
        self.test_performance()

        self.print_results()

    def print_results(self):
        """Вивести результати тестів."""
        print("\n" + "=" * 60)
        print("📊 РЕЗУЛЬТАТИ ПЕРЕВІРКИ")
        print("=" * 60)
        print(f"🔢 Всього тестів: {self.total_tests}")
        print(f"✅ Успішних: {self.success_count}")
        print(f"❌ Помилок: {len(self.errors)}")

        if self.errors:
            print("\n❌ Помилки:")
            for error in self.errors:
                print(f"  {error}")

        if len(self.errors) == 0:
            print("\n🎉 OMNISCIENCE ПРАЦЮЄ ІДЕАЛЬНО!")
            print("✅ Всі функції перевірено і працюють коректно")
            print(f"🌐 Доступ: http://{self.nvidia_ip}:8092/omniscience")
        else:
            print(f"\n⚠️  Виявлено {len(self.errors)} проблем")
            print("🔧 Перевірте логи на NVIDIA сервері:")
            print("   docker-compose logs frontend")
            print("   docker-compose logs backend")

        return len(self.errors) == 0

    def cleanup(self):
        """Очистка ресурсів."""
        if hasattr(self, 'driver'):
            self.driver.quit()

def main():
    if len(sys.argv) != 2:
        print("❌ Помилка: Вкажіть IP адресу NVIDIA сервера")
        print("Використання: python3 test_omniscience_functionality.py <NVIDIA_SERVER_IP>")
        print("Приклад: python3 test_omniscience_functionality.py 192.168.1.100")
        sys.exit(1)

    nvidia_ip = sys.argv[1]
    tester = OmniscienceTester(nvidia_ip)

    try:
        success = tester.run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Тести перервано користувачем")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Критична помилка: {e}")
        sys.exit(1)
    finally:
        tester.cleanup()

if __name__ == "__main__":
    main()
