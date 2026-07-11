#!/usr/bin/env python3
"""
🤖 Web Interface Auditor (Google Antigravity Style)
PREDATOR Analytics v61.0-ELITE

Автономний агент для тестування веб інтерфейсу з симуляцією реального користувача:
- Автоматична навігація по інтерфейсу
- Кліки на всі елементи
- Заповнення форм тестовими даними
- Тестування клавіатурної навігації
- Збір метрик та звітів
"""

import asyncio
import subprocess
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/Users/Shared/Predator_60/tests/e2e/logs/web_interface.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class SurfaceTestResult:
    """Результат тестування поверхні"""
    timestamp: str
    total_clicks: int
    successful_clicks: int
    failed_clicks: int
    form_interactions: int
    keyboard_interactions: int
    success_rate: float
    errors: List[str]
    duration: float
    visited_urls: List[str]
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict:
        return asdict(self)


class WebInterfaceAuditor:
    """Аудитор веб інтерфейсу з симуляцією користувача"""
    
    def __init__(self, ui_url: str = "http://localhost:3030", timeout: int = 120):
        self.ui_url = ui_url
        self.timeout = timeout
        self.playwright_dir = "/Users/Shared/Predator_60/apps/predator-analytics-ui"
        self.e2e_dir = self.playwright_dir + "/e2e"
        
    async def run_surface_test(self) -> SurfaceTestResult:
        """Запуск тестування поверхні"""
        start_time = asyncio.get_event_loop().time()
        logger.info(f"🤖 Starting surface test for {self.ui_url}")
        
        # Створюємо тестовий файл
        test_file = self._create_surface_test()
        
        # Запускаємо Playwright тест
        result = await self._run_playwright_test(test_file)
        
        duration = asyncio.get_event_loop().time() - start_time
        
        # Парсимо результат
        return self._parse_test_result(result, duration)
    
    def _create_surface_test(self) -> str:
        """Створює Playwright тест файл для поверхні"""
        test_content = '''import { test, expect } from '@playwright/test';

test.describe('🤖 Autonomous Surface Test', () => {
  test('повне тестування поверхні', async ({ page }) => {
    const results = {
      total_clicks: 0,
      successful_clicks: 0,
      failed_clicks: 0,
      form_interactions: 0,
      keyboard_interactions: 0,
      errors: [],
      visited_urls: []
    };
    
    try {
      await page.goto('http://localhost:3030/', { timeout: 10000 });
      
      // Обхід модальних вікон (Onboarding, License)
      await page.evaluate(() => {
        localStorage.setItem('predator_onboarding_completed', 'true');
        localStorage.setItem('admin_license_accepted', 'true');
        localStorage.setItem('predator_auth_token', 'mock_token');
      });
      await page.reload({ timeout: 10000 });
      
      results.visited_urls.push('http://localhost:3030/');
      
      // Чекаємо завантаження
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      
      // Отримуємо всі клікабельні елементи
      const clickableElements = await page.locator('button, a, [role="button"], [onclick], input, select, [tabindex]').all();
      results.total_clicks = clickableElements.length;
      
      console.log(`🔍 Found ${results.total_clicks} interactive elements`);
      
      // Клікаємо на елементи з обмеженням
      const maxClicks = 15;
      for (let i = 0; i < Math.min(clickableElements.length, maxClicks); i++) {
        try {
          const element = clickableElements[i];
          const el = await element.elementHandle();
          if (!el) continue;
          
          // Прокрутка до елемента
          await el.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          
          // Отримуємо тип та інформацію
          const tagName = await el.evaluate(el => el.tagName.toLowerCase());
          const inputType = tagName === 'input' ? await el.evaluate(el => el.type) : '';
          
          if (tagName === 'input' && inputType === 'text') {
            // Заповнюємо текстові поля
            await el.fill('test_data_' + Date.now());
            results.form_interactions++;
          } else if (tagName === 'select') {
            // Клікаємо на селекти
            await el.click();
            await page.waitForTimeout(200);
            await page.keyboard.press('Escape');
            results.form_interactions++;
          } else if (tagName === 'a') {
            // Для посилань клікаємо і повертаємося
            await el.click({ timeout: 5000 });
            await page.waitForTimeout(500);
            const currentUrl = page.url();
            if (currentUrl !== 'http://localhost:3030/') {
              results.visited_urls.push(currentUrl);
              await page.goBack();
              await page.waitForTimeout(500);
            }
          } else {
            // Клікаємо на кнопки
            await el.click({ timeout: 5000 });
            await page.waitForTimeout(300);
          }
          
          results.successful_clicks++;
          console.log(`✅ Element ${i+1}/${maxClicks}: ${tagName} (${results.successful_clicks} succeeded)`);
          
        } catch (error) {
          results.failed_clicks++;
          const errorMsg = error instanceof Error ? error.message : String(error);
          results.errors.push(`Element ${i+1}: ${errorMsg}`);
          console.log(`❌ Element ${i+1}/${maxClicks} failed: ${errorMsg}`);
          
          // Продовжуємо тестування після помилки
          await page.waitForTimeout(300);
        }
      }
      
      // Клавіатурна навігація
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
      results.keyboard_interactions += 5;
      
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
      
      console.log('⌨️  Keyboard navigation tested');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.errors.push(`Main test: ${errorMsg}`);
      console.log(`❌ Test error: ${errorMsg}`);
    }
    
    const successRate = results.total_clicks > 0 
      ? ((results.successful_clicks / results.total_clicks) * 100).toFixed(2) 
      : 0;
    
    console.log(`📊 Results: ${results.successful_clicks}/${results.total_clicks} clicks (${successRate}% success)`);
    
    // Зберігаємо результат в консоль для парсингу
    console.log('TEST_RESULT:', JSON.stringify(results));
  });
});
'''
        
        test_file_path = f"{self.e2e_dir}/surface-autonomous-test.spec.ts"
        
        with open(test_file_path, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        logger.info(f"📝 Created test file: {test_file_path}")
        return test_file_path
    
    async def _run_playwright_test(self, test_file: str) -> str:
        """Запуск Playwright тесту"""
        try:
            result = subprocess.run(
                ['npx', 'playwright', 'test', test_file, '--reporter=json', '--reporter=list', '--headed=false'],
                cwd=self.playwright_dir,
                capture_output=True,
                text=True,
                timeout=self.timeout * 1000
            )
            
            return result.stdout + result.stderr
            
        except subprocess.TimeoutExpired:
            logger.error("❌ Playwright test timeout")
            return "ERROR: Test timeout"
        except Exception as e:
            logger.error(f"❌ Playwright execution error: {e}")
            return f"ERROR: {str(e)}"
    
    def _parse_test_result(self, output: str, duration: float) -> SurfaceTestResult:
        """Парсинг результату тесту"""
        try:
            # Шукаємо JSON результат в виводі
            if 'TEST_RESULT:' in output:
                # Видаляємо JSON з консольного виводу
                json_start = output.find('TEST_RESULT:') + 13
                json_end = output.find('}', json_start) + 1
                
                if json_end > json_start:
                    json_str = output[json_start:json_end]
                    result_data = json.loads(json_str)
                    
                    success_rate = float(result_data.get('successful_clicks', 0)) / max(result_data.get('total_clicks', 1), 1) * 100
                    
                    return SurfaceTestResult(
                        timestamp=datetime.now().isoformat(),
                        total_clicks=result_data.get('total_clicks', 0),
                        successful_clicks=result_data.get('successful_clicks', 0),
                        failed_clicks=result_data.get('failed_clicks', 0),
                        form_interactions=result_data.get('form_interactions', 0),
                        keyboard_interactions=result_data.get('keyboard_interactions', 0),
                        success_rate=round(success_rate, 2),
                        errors=result_data.get('errors', []),
                        duration=round(duration, 2),
                        visited_urls=result_data.get('visited_urls', [])
                    )
            
            # Fallback якщо не вдалося парсити
            return SurfaceTestResult(
                timestamp=datetime.now().isoformat(),
                total_clicks=0,
                successful_clicks=0,
                failed_clicks=0,
                form_interactions=0,
                keyboard_interactions=0,
                success_rate=0.0,
                errors=['Could not parse test result'],
                duration=round(duration, 2),
                visited_urls=[]
            )
            
        except Exception as e:
            logger.error(f"❌ Error parsing test result: {e}")
            return SurfaceTestResult(
                timestamp=datetime.now().isoformat(),
                total_clicks=0,
                successful_clicks=0,
                failed_clicks=0,
                form_interactions=0,
                keyboard_interactions=0,
                success_rate=0.0,
                errors=[f'Parse error: {str(e)}'],
                duration=round(duration, 2),
                visited_urls=[]
            )


# Точка входу для прямого запуску
async def main():
    auditor = WebInterfaceAuditor()
    result = await auditor.run_surface_test()
    
    print("\n📊 SURFACE TEST RESULTS:")
    print("=" * 50)
    print(f"Duration: {result.duration}s")
    print(f"Total Clicks: {result.total_clicks}")
    print(f"Successful: {result.successful_clicks}")
    print(f"Failed: {result.failed_clicks}")
    print(f"Form Interactions: {result.form_interactions}")
    print(f"Keyboard Interactions: {result.keyboard_interactions}")
    print(f"Success Rate: {result.success_rate}%")
    print(f"Visited URLs: {len(result.visited_urls)}")
    
    if result.errors:
        print(f"\n❌ Errors ({len(result.errors)}):")
        for error in result.errors:
            print(f"  - {error}")
    
    print("=" * 50)
    print(f"Status: {'✅ PASSED' if result.success_rate >= 50 else '❌ FAILED'}")


if __name__ == '__main__':
    asyncio.run(main())
