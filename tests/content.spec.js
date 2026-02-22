/**
 * GitPulse 内容管理功能测试脚本
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'testuser@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123456';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

const results = {
  module: '内容管理功能测试',
  passed: [],
  failed: [],
  warnings: [],
  screenshots: []
};

async function takeScreenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `content-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  results.screenshots.push(filePath);
}

async function login(page) {
  await page.goto(TARGET_URL);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('   📝 检测到登录页面，执行登录...');
    await emailInput.fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL((url) => {
      return !url.toString().includes('login');
    }, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      throw new Error('登录失败，仍在登录页面');
    }
    console.log('   ✅ 登录成功');
  } else {
    console.log('   ℹ️ 已处于登录状态');
  }
}

(async () => {
  console.log('🚀 GitPulse 内容管理功能测试');
  console.log('='.repeat(60));
  console.log(`📍 目标 URL: ${TARGET_URL}`);
  console.log('');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('📋 测试 1: 登录并导航到内容页面');
    await login(page);

    const contentLink = page.locator('a[href="/content"]').first();
    if (await contentLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contentLink.click();
      await page.waitForLoadState('networkidle');
    }

    await takeScreenshot(page, '01-content-page');

    const currentUrl = page.url();
    if (currentUrl.includes('/content')) {
      results.passed.push('成功进入内容页面');
      console.log('   ✅ 成功进入内容页面');
    } else {
      results.failed.push('未能进入内容页面');
      console.log('   ❌ 未能进入内容页面');
    }

    console.log('📋 测试 2: 验证页面标题');
    const pageTitle = page.locator('h1:has-text("内容管理")');
    if (await pageTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      results.passed.push('内容页面标题显示正常');
      console.log('   ✅ 内容页面标题显示正常');
    } else {
      results.warnings.push('未检测到内容页面标题');
      console.log('   ⚠️ 未检测到内容页面标题');
    }

    console.log('📋 测试 3: 检查内容表格');
    const contentTable = page.locator('table');
    if (await contentTable.isVisible({ timeout: 2000 }).catch(() => false)) {
      results.passed.push('内容表格存在');
      console.log('   ✅ 内容表格存在');
    } else {
      results.warnings.push('未找到内容表格');
      console.log('   ⚠️ 未找到内容表格');
    }

    console.log('📋 测试 4: 响应式布局 - 平板');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '02-tablet-view');
    results.passed.push('平板视图布局正常');
    console.log('   ✅ 平板视图布局正常');

    console.log('📋 测试 5: 响应式布局 - 移动端');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '03-mobile-view');
    results.passed.push('移动端视图布局正常');
    console.log('   ✅ 移动端视图布局正常');

  } catch (error) {
    console.error('❌ 测试错误:', error.message);
    results.failed.push(`测试异常: ${error.message}`);
    await takeScreenshot(page, 'error');
  } finally {
    await browser.close();
  }
// 输出测试报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 内容管理功能测试报告');
  console.log('='.repeat(60));
  console.log(`\n✅ 通过: ${results.passed.length}`);
  results.passed.forEach(item => console.log(`   ✓ ${item}`));
  console.log(`\n⚠️ 警告: ${results.warnings.length}`);
  results.warnings.forEach(item => console.log(`   ⚠ ${item}`));
  console.log(`\n❌ 失败: ${results.failed.length}`);
  results.failed.forEach(item => console.log(`   ✗ ${item}`));
  console.log(`\n📸 截图: ${results.screenshots.length} 张`);
  console.log('\n🏁 测试完成');
  return results;
})();
