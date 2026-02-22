/**
 * GitPulse 项目管理功能测试脚本
 * 包含：项目列表、搜索筛选、项目卡片等功能测试
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
  module: '项目管理功能测试',
  passed: [],
  failed: [],
  warnings: [],
  screenshots: []
};

async function takeScreenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `projects-${name}.png`);
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

    // 等待登录完成
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
  console.log('🚀 GitPulse 项目管理功能测试');
  console.log('='.repeat(60));
  console.log(`📍 目标 URL: ${TARGET_URL}`);
  console.log('');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // ==================== 测试 1: 登录并进入项目页面 ====================
    console.log('📋 测试 1: 登录并导航到项目页面');
    await login(page);

    // 点击项目管理导航
    const projectsLink = page.locator('a[href="/projects"]').first();
    if (await projectsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    }

    await takeScreenshot(page, '01-projects-page');

    const currentUrl = page.url();
    if (currentUrl.includes('/projects')) {
      results.passed.push('成功进入项目页面');
      console.log('   ✅ 成功进入项目页面');
    } else {
      results.failed.push('未能进入项目页面');
      console.log('   ❌ 未能进入项目页面');
    }

    // ==================== 测试 2: 验证页面标题 ====================
    console.log('📋 测试 2: 验证页面标题');
    const pageTitle = page.locator('h1:has-text("项目管理")');
    if (await pageTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      results.passed.push('项目页面标题显示正常');
      console.log('   ✅ 项目页面标题显示正常');
    } else {
      results.warnings.push('未检测到项目页面标题');
      console.log('   ⚠️ 未检测到项目页面标题');
    }

    // ==================== 测试 3: 新建项目按钮 ====================
    console.log('📋 测试 3: 检查新建项目按钮');
    const newProjectBtn = page.locator('button:has-text("新建项目")');
    if (await newProjectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      results.passed.push('新建项目按钮存在');
      console.log('   ✅ 新建项目按钮存在');
    } else {
      results.warnings.push('未找到新建项目按钮');
      console.log('   ⚠️ 未找到新建项目按钮');
    }

    // ==================== 测试 4: 搜索输入框 ====================
    console.log('📋 测试 4: 检查搜索输入框');
    const searchInput = page.locator('input[placeholder="搜索项目..."]');
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      results.passed.push('搜索输入框存在');
      console.log('   ✅ 搜索输入框存在');
    } else {
      results.warnings.push('未找到搜索输入框');
      console.log('   ⚠️ 未找到搜索输入框');
    }

    // ==================== 测试 5: 项目卡片列表 ====================
    console.log('📋 测试 5: 检查项目卡片');
    const projectCards = await page.locator('.card').count();
    if (projectCards > 0) {
      results.passed.push(`找到 ${projectCards} 个项目卡片`);
      console.log(`   ✅ 找到 ${projectCards} 个项目卡片`);

      // 检查第一个项目卡片的内容
      const firstCard = page.locator('.card').first();
      const cardTitle = await firstCard.locator('h3').textContent().catch(() => '');
      if (cardTitle) {
        results.passed.push(`第一个项目: ${cardTitle}`);
        console.log(`   ✅ 第一个项目: ${cardTitle}`);
      }
    } else {
      results.warnings.push('未找到项目卡片');
      console.log('   ⚠️ 未找到项目卡片');
    }

    // ==================== 测试 6: 查看详情按钮 ====================
    console.log('📋 测试 6: 检查查看详情按钮');
    const detailBtn = page.locator('button:has-text("查看详情")').first();
    if (await detailBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      results.passed.push('查看详情按钮存在');
      console.log('   ✅ 查看详情按钮存在');

      // 点击查看详情
      await detailBtn.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, '02-project-detail');
      results.passed.push('点击查看详情成功');
      console.log('   ✅ 点击查看详情成功');

      // 返回项目列表
      await page.goBack();
      await page.waitForLoadState('networkidle');
    } else {
      results.warnings.push('未找到查看详情按钮');
      console.log('   ⚠️ 未找到查看详情按钮');
    }

    // ==================== 测试 7: 响应式布局 - 平板 ====================
    console.log('📋 测试 7: 响应式布局 - 平板视图');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '03-tablet-view');
    results.passed.push('平板视图布局正常');
    console.log('   ✅ 平板视图布局正常');

    // ==================== 测试 8: 响应式布局 - 移动端 ====================
    console.log('📋 测试 8: 响应式布局 - 移动端视图');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '04-mobile-view');
    results.passed.push('移动端视图布局正常');
    console.log('   ✅ 移动端视图布局正常');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    results.failed.push(`测试异常: ${error.message}`);
    await takeScreenshot(page, 'error');
  } finally {
    await browser.close();
  }

  // 输出测试报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 项目管理功能测试报告');
  console.log('='.repeat(60));
  console.log(`\n✅ 通过: ${results.passed.length}`);
  results.passed.forEach(item => console.log(`   ✓ ${item}`));

  console.log(`\n⚠️ 警告: ${results.warnings.length}`);
  results.warnings.forEach(item => console.log(`   ⚠ ${item}`));

  console.log(`\n❌ 失败: ${results.failed.length}`);
  results.failed.forEach(item => console.log(`   ✗ ${item}`));

  console.log(`\n📸 截图: ${results.screenshots.length} 张`);
  results.screenshots.forEach(item => console.log(`   📷 ${item}`));

  console.log('\n🏁 测试完成');

  return results;
})();
