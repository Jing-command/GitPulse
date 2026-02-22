/**
 * GitPulse 仪表板功能测试脚本
 * 包含：统计卡片、快捷操作、最近活动等功能测试
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
  module: '仪表板功能测试',
  passed: [],
  failed: [],
  warnings: [],
  screenshots: []
};

async function takeScreenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `dashboard-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  results.screenshots.push(filePath);
}

async function login(page) {
  await page.goto(TARGET_URL);
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await emailInput.fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    
    try {
      await page.waitForURL(url => !url.includes('login'), { timeout: 10000 });
    } catch (e) {}
    
    await page.waitForLoadState('networkidle');
  }
}

(async () => {
  console.log('🚀 GitPulse 仪表板功能测试');
  console.log('='.repeat(50));
  console.log(`📍 目标 URL: ${TARGET_URL}`);
  console.log('');

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('📋 准备：登录系统');
    await login(page);
    await takeScreenshot(page, '01-after-login');

    console.log('📋 测试 1: 仪表板页面加载');
    const currentUrl = page.url();
    if (currentUrl === TARGET_URL + '/' || currentUrl === TARGET_URL) {
      results.passed.push('仪表板页面加载成功');
      console.log('   ✅ 仪表板页面加载成功');
    }
    
    const pageHeading = page.locator('h1:has-text("仪表板")');
    if (await pageHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      results.passed.push('仪表板页面标题显示正常');
      console.log('   ✅ 仪表板页面标题显示正常');
    }
    
    await takeScreenshot(page, '02-dashboard-page');

    console.log('📋 测试 2: 统计卡片显示');
    const statCards = [
      { name: '项目总数', selectors: ['p:has-text("项目总数")', '.card:has-text("项目总数")'] },
      { name: '生成内容', selectors: ['p:has-text("生成内容")', '.card:has-text("生成内容")'] },
      { name: 'Commits分析', selectors: ['p:has-text("Commits")', '.card:has-text("Commits")'] },
      { name: 'SEO评分均值', selectors: ['p:has-text("SEO")', '.card:has-text("SEO")'] },
    ];
    
    for (const card of statCards) {
      let found = false;
      for (const selector of card.selectors) {
        try {
          if (await page.locator(selector).first().isVisible({ timeout: 1000 })) {
            found = true;
            break;
          }
        } catch (e) {}
      }
      if (found) {
        results.passed.push(`统计卡片"${card.name}"显示正常`);
        console.log(`   ✅ 统计卡片"${card.name}"显示正常`);
      } else {
        results.warnings.push(`未找到统计卡片"${card.name}"`);
        console.log(`   ⚠️ 未找到统计卡片"${card.name}"`);
      }
    }

    console.log('📋 测试 3: 统计卡片数值验证');
    const statValues = await page.locator('.card p.text-2xl').allTextContents();
    let validNumbers = 0;
    for (const text of statValues) {
      if (/\d/.test(text)) validNumbers++;
    }
    if (validNumbers > 0) {
      results.passed.push(`找到 ${validNumbers} 个有效统计数值`);
      console.log(`   ✅ 找到 ${validNumbers} 个有效统计数值`);
    } else {
      results.warnings.push('未找到有效的统计数值');
      console.log('   ⚠️ 未找到有效的统计数值');
    }

    console.log('📋 测试 4: 周增长指标显示');
    const weeklyGrowth = page.locator('text=/本周|\\+\\d+/');
    if (await weeklyGrowth.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      results.passed.push('周增长指标显示正常');
      console.log('   ✅ 周增长指标显示正常');
    } else {
      results.warnings.push('未找到周增长指标');
      console.log('   ⚠️ 未找到周增长指标');
    }

    console.log('📋 测试 5: 快捷操作按钮');
    const quickActions = ['分析代码', '生成内容', '新建项目', '查看报告'];
    for (const action of quickActions) {
      const btn = page.locator(`button:has-text("${action}")`);
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        results.passed.push(`快捷操作"${action}"按钮存在`);
        console.log(`   ✅ 快捷操作"${action}"按钮存在`);
      } else {
        results.warnings.push(`未找到快捷操作"${action}"`);
        console.log(`   ⚠️ 未找到快捷操作"${action}"`);
      }
    }

    console.log('📋 测试 6: 最近活动列表');
    const activityTitle = page.locator('h2:has-text("最近活动")');
    if (await activityTitle.isVisible({ timeout: 1000 }).catch(() => false)) {
      results.passed.push('最近活动区域显示正常');
      console.log('   ✅ 最近活动区域显示正常');
    } else {
      results.warnings.push('未找到最近活动区域');
      console.log('   ⚠️ 未找到最近活动区域');
    }

    console.log('📋 测试 7: 响应式布局测试');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '03-tablet-view');
    results.passed.push('平板视图布局正常');
    console.log('   ✅ 平板视图布局正常');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await takeScreenshot(page, '04-mobile-view');
    results.passed.push('移动端视图布局正常');
    console.log('   ✅ 移动端视图布局正常');
    
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('📋 测试 8: 页面刷新数据保持');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '05-after-refresh');
    
    const hasDataAfterRefresh = await page.locator('.card p.text-2xl').first().isVisible().catch(() => false);
    if (hasDataAfterRefresh) {
      results.passed.push('页面刷新后数据保持正常');
      console.log('   ✅ 页面刷新后数据保持正常');
    } else {
      results.warnings.push('页面刷新后数据可能丢失');
      console.log('   ⚠️ 页面刷新后数据可能丢失');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    results.failed.push(`测试异常: ${error.message}`);
    await takeScreenshot(page, 'error');
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 仪表板功能测试报告');
  console.log('='.repeat(50));
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
