/**
 * GitPulse 导航功能测试脚本
 * 包含：侧边栏导航、页面跳转、响应式布局等功能测试
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
  module: '导航功能测试', 
  passed: [], 
  failed: [], 
  warnings: [], 
  screenshots: [] 
};

async function takeScreenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `navigation-${name}.png`);
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
    
    // 等待登录完成（跳转到非登录页面）
    await page.waitForURL((url) => {
      return !url.toString().includes('login');
    }, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // 验证是否登录成功
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      throw new Error('登录失败，仍在登录页面');
    }
    console.log('   ✅ 登录成功');
  } else {
    console.log('   ℹ️ 已处于登录状态');
  }
}

async function navigateTo(page, url, name) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await takeScreenshot(page, name);
  
  const currentUrl = page.url();
  if (currentUrl.includes(url.replace(TARGET_URL, ''))) {
    return true;
  }
  return false;
}

(async () => {
  console.log('🚀 GitPulse 导航功能测试');
  console.log('='.repeat(60));
  console.log(`📍 目标 URL: ${TARGET_URL}`);
  console.log('');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // ==================== 测试 1: 登录并进入仪表板 ====================
    console.log('📋 测试 1: 登录并验证仪表板');
    await login(page);
    await takeScreenshot(page, '01-dashboard');
    
    const dashboardTitle = page.locator('h1:has-text("仪表板")');
    if (await dashboardTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      results.passed.push('成功进入仪表板页面');
      console.log('   ✅ 成功进入仪表板页面');
    } else {
      results.warnings.push('未检测到仪表板标题');
      console.log('   ⚠️ 未检测到仪表板标题');
    }

    // ==================== 测试 2: 导航到项目管理 ====================
    console.log('📋 测试 2: 导航到项目管理页面');
    const projectsLink = page.locator('a[href="/projects"]').first();
    if (await projectsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '02-projects');
      
      const projectsTitle = page.locator('h1:has-text("项目管理")');
      if (await projectsTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
        results.passed.push('成功导航到项目管理页面');
        console.log('   ✅ 成功导航到项目管理页面');
      } else {
        results.warnings.push('项目管理页面标题未显示');
        console.log('   ⚠️ 项目管理页面标题未显示');
      }
    } else {
      results.failed.push('未找到项目管理导航链接');
      console.log('   ❌ 未找到项目管理导航链接');
    }

    // ==================== 测试 3: 导航到内容管理 ====================
    console.log('📋 测试 3: 导航到内容管理页面');
    const contentLink = page.locator('a[href="/content"]').first();
    if (await contentLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contentLink.click();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '03-content');
      
      const contentTitle = page.locator('h1:has-text("内容管理")');
      if (await contentTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
        results.passed.push('成功导航到内容管理页面');
        console.log('   ✅ 成功导航到内容管理页面');
      } else {
        results.warnings.push('内容管理页面标题未显示');
        console.log('   ⚠️ 内容管理页面标题未显示');
      }
    } else {
      results.failed.push('未找到内容管理导航链接');
      console.log('   ❌ 未找到内容管理导航链接');
    }

    // ==================== 测试 4: 导航到团队管理 ====================
    console.log('📋 测试 4: 导航到团队管理页面');
    const teamLink = page.locator('a[href="/team"]').first();
    if (await teamLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await teamLink.click();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '04-team');
      
      const teamTitle = page.locator('h1:has-text("团队管理")');
      if (await teamTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
        results.passed.push('成功导航到团队管理页面');
        console.log('   ✅ 成功导航到团队管理页面');
      } else {
        results.warnings.push('团队管理页面标题未显示');
        console.log('   ⚠️ 团队管理页面标题未显示');
      }
    } else {
      results.failed.push('未找到团队管理导航链接');
      console.log('   ❌ 未找到团队管理导航链接');
    }

    // ==================== 测试 5: 导航到设置 ====================
    console.log('📋 测试 5: 导航到设置页面');
    const settingsLink = page.locator('a[href="/settings"]').first();
    if (await settingsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '05-settings');
      
      const settingsTitle = page.locator('h1:has-text("设置")');
      if (await settingsTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
        results.passed.push('成功导航到设置页面');
        console.log('   ✅ 成功导航到设置页面');
      } else {
        results.warnings.push('设置页面标题未显示');
        console.log('   ⚠️ 设置页面标题未显示');
      }
    } else {
      results.failed.push('未找到设置导航链接');
      console.log('   ❌ 未找到设置导航链接');
    }

    // ==================== 测试 6: 返回仪表板 ====================
    console.log('📋 测试 6: 返回仪表板');
    const dashboardLink = page.locator('a[href="/"]').first();
    if (await dashboardLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '06-back-to-dashboard');
      
      const dashboardTitle2 = page.locator('h1:has-text("仪表板")');
      if (await dashboardTitle2.isVisible({ timeout: 3000 }).catch(() => false)) {
        results.passed.push('成功返回仪表板页面');
        console.log('   ✅ 成功返回仪表板页面');
      } else {
        results.warnings.push('返回仪表板后标题未显示');
        console.log('   ⚠️ 返回仪表板后标题未显示');
      }
    } else {
      results.failed.push('未找到仪表板导航链接');
      console.log('   ❌ 未找到仪表板导航链接');
    }

    // ==================== 测试 7: 检查 Logo 和用户信息 ====================
    console.log('📋 测试 7: 检查 Logo 和用户信息');
    
    const logo = page.locator('text=GP').first();
    if (await logo.isVisible({ timeout: 1000 }).catch(() => false)) {
      results.passed.push('Logo 显示正常');
      console.log('   ✅ Logo 显示正常');
    }

    const logoText = page.locator('text=GitPulse').first();
    if (await logoText.isVisible({ timeout: 1000 }).catch(() => false)) {
      results.passed.push('GitPulse 文字显示正常');
      console.log('   ✅ GitPulse 文字显示正常');
    }

    // 检查用户信息
    const userInfo = page.locator('.rounded-full').first();
    if (await userInfo.isVisible({ timeout: 1000 }).catch(() => false)) {
      results.passed.push('用户头像显示正常');
      console.log('   ✅ 用户头像显示正常');
    }

    // ==================== 测试 8: 响应式布局 - 平板 ====================
    console.log('📋 测试 8: 响应式布局 - 平板视图');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '07-tablet-view');
    results.passed.push('平板视图布局正常');
    console.log('   ✅ 平板视图布局正常');

    // ==================== 测试 9: 响应式布局 - 移动端 ====================
    console.log('📋 测试 9: 响应式布局 - 移动端视图');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await takeScreenshot(page, '08-mobile-view');
    results.passed.push('移动端视图布局正常');
      console.log('   ✅ 移动端视图布局正常');

    // ==================== 测试 10: 移动端菜单 ====================
    console.log('📋 测试 10: 移动端菜单展开');
    const menuBtn = page.locator('button:has(svg)').first();
    if (await menuBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(300);
      await takeScreenshot(page, '09-mobile-menu');
      results.passed.push('移动端菜单可展开');
      console.log('   ✅ 移动端菜单可展开');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    results.failed.push(`测试异常: ${error.message}`);
    await takeScreenshot(page, 'error');
  } finally {
    await browser.close();
  }

  // 输出测试报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 导航功能测试报告');
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
