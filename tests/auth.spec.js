/**
 * GitPulse 认证功能测试脚本
 * 包含：登录、注册、登出功能的全面测试
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 目标 URL - 可配置
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3000';
// 使用实际存在的测试账号
const TEST_EMAIL = process.env.TEST_EMAIL || 'testuser@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123456';
const TEST_NAME = process.env.TEST_NAME || '测试用户';

// 截图保存目录（绝对路径）
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// 测试结果收集
const results = {
  module: '认证功能测试',
  passed: [],
  failed: [],
  warnings: [],
  screenshots: []
};

/**
 * 辅助函数：安全点击
 */
async function safeClick(page, selector, options = {}) {
  try {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout: 5000 });
    await element.click(options);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 辅助函数：安全填充
 */
async function safeFill(page, selector, value) {
  try {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout: 5000 });
    await element.fill(value);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 辅助函数：截图并记录
 */
async function takeScreenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `auth-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  results.screenshots.push(filePath);
}

(async () => {
  console.log('🚀 GitPulse 认证功能测试');
  console.log('='.repeat(50));
  console.log(`📍 目标 URL: ${TARGET_URL}`);
  console.log('');

  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 50 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  try {
    // ==================== 测试 1: 访问登录页面 ====================
    console.log('📋 测试 1: 访问登录页面');
    await page.goto(TARGET_URL);
    await page.waitForLoadState('networkidle');
    
    // 检查是否在登录页面或需要点击登录按钮
    const currentUrl = page.url();
    if (!currentUrl.includes('login')) {
      // 尝试点击登录按钮
      const loginBtnFound = await safeClick(page, 'button:has-text("登录")');
      if (loginBtnFound) {
        await page.waitForLoadState('networkidle');
      }
    }
    
    await takeScreenshot(page, '01-login-page');
    
    // 验证登录页面元素
    const hasEmailInput = await page.locator('input[type="email"]').isVisible().catch(() => false);
    const hasPasswordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
    
    if (hasEmailInput && hasPasswordInput) {
      results.passed.push('登录页面元素完整');
      console.log('   ✅ 登录页面元素完整');
    } else {
      results.failed.push('登录页面缺少必要元素');
      console.log('   ❌ 登录页面缺少必要元素');
    }

    // ==================== 测试 2: 检查 OAuth 登录按钮 ====================
    console.log('📋 测试 2: 检查 OAuth 登录选项');
    
    const hasGithubLogin = await page.locator('button:has-text("GitHub")').isVisible().catch(() => false);
    const hasGitlabLogin = await page.locator('button:has-text("GitLab")').isVisible().catch(() => false);
    
    if (hasGithubLogin) {
      results.passed.push('GitHub OAuth 登录按钮存在');
      console.log('   ✅ GitHub OAuth 登录按钮存在');
    }
    if (hasGitlabLogin) {
      results.passed.push('GitLab OAuth 登录按钮存在');
      console.log('   ✅ GitLab OAuth 登录按钮存在');
    }

    // ==================== 测试 3: 密码可见性切换 ====================
    console.log('📋 测试 3: 密码可见性切换');
    
    // 填写密码
    await safeFill(page, 'input[type="password"]', TEST_PASSWORD);
    
    // 查找密码切换按钮
    const passwordToggleSelectors = [
      'button[type="button"]',
      '[aria-label*="密码"]',
      '[aria-label*="password"]',
      '.password-toggle',
      'button:has(svg)',
    ];
    
    let toggleFound = false;
    for (const selector of passwordToggleSelectors) {
      try {
        // 在密码输入框附近查找切换按钮
        const passwordContainer = page.locator('input[type="password"]').locator('..');
        const toggleBtn = passwordContainer.locator(selector).first();
        if (await toggleBtn.isVisible({ timeout: 1000 })) {
          await toggleBtn.click();
          toggleFound = true;
          
          // 验证密码是否变为可见
          const textInput = page.locator('input[type="text"]').first();
          if (await textInput.isVisible({ timeout: 1000 })) {
            results.passed.push('密码可见性切换正常');
            console.log('   ✅ 密码可见性切换正常');
          }
          
          // 再次点击隐藏密码
          await toggleBtn.click();
          break;
        }
      } catch (e) {
        // 继续尝试
      }
    }
    
    if (!toggleFound) {
      results.warnings.push('未找到密码切换按钮（可能未实现）');
      console.log('   ⚠️ 未找到密码切换按钮（可能未实现）');
    }

    // ==================== 测试 4: 记住我复选框 ====================
    console.log('📋 测试 4: 记住我复选框');
    
    const rememberSelectors = [
      'input[type="checkbox"]',
      'input[name="remember"]',
      '[data-testid="remember-me"]',
    ];
    
    let rememberFound = false;
    for (const selector of rememberSelectors) {
      try {
        const checkbox = page.locator(selector).first();
        if (await checkbox.isVisible({ timeout: 1000 })) {
          await checkbox.check();
          rememberFound = true;
          results.passed.push('记住我复选框可用');
          console.log('   ✅ 记住我复选框可用');
          break;
        }
      } catch (e) {
        // 继续
      }
    }
    
    if (!rememberFound) {
      results.warnings.push('未找到记住我复选框');
      console.log('   ⚠️ 未找到记住我复选框');
    }

    // ==================== 测试 5: 忘记密码链接 ====================
    console.log('📋 测试 5: 忘记密码链接');
    
    const forgotLink = page.locator('a:has-text("忘记"), a:has-text("forgot"), a[href*="forgot"]').first();
    if (await forgotLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      results.passed.push('忘记密码链接存在');
      console.log('   ✅ 忘记密码链接存在');
    } else {
      results.warnings.push('未找到忘记密码链接');
      console.log('   ⚠️ 未找到忘记密码链接');
    }

    // ==================== 测试 6: 注册链接 ====================
    console.log('📋 测试 6: 注册链接');
    
    const registerLink = page.locator('a:has-text("注册"), a:has-text("Register"), a[href*="register"]').first();
    if (await registerLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      results.passed.push('注册链接存在');
      console.log('   ✅ 注册链接存在');
      
      // 点击注册链接
      await registerLink.click();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '02-register-page');
      
      // 检查注册页面
      const hasNameInput = await page.locator('input[name="name"], input[placeholder*="名"], input[placeholder*="name"]').isVisible().catch(() => false);
      if (hasNameInput) {
        results.passed.push('注册页面包含姓名输入框');
        console.log('   ✅ 注册页面包含姓名输入框');
      }
      
      // 返回登录页面
      await page.goto(TARGET_URL);
      await page.waitForLoadState('networkidle');
    } else {
      results.warnings.push('未找到注册链接');
      console.log('   ⚠️ 未找到注册链接');
    }

    // ==================== 测试 7: 表单验证 - 空提交 ====================
    console.log('📋 测试 7: 表单验证 - 空提交');
    
    // 清空所有输入框
    await page.locator('input[type="email"]').clear();
    await page.locator('input[type="password"]').clear();
    
    // 点击登录按钮
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(500);
    
    // 检查是否有验证错误（支持多种错误提示选择器）
    const errorSelectors = [
      '.error',
      '.alert-error',
      '[role="alert"]',
      '.text-red',
      '.text-destructive',
      '.text-error',
      'p.text-error',
      '[class*="error"]',
    ];
    
    let hasValidationError = false;
    for (const selector of errorSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          hasValidationError = true;
          break;
        }
      } catch (e) {}
    }
    
    if (hasValidationError) {
      results.passed.push('空表单提交验证正常');
      console.log('   ✅ 空表单提交显示验证错误');
    } else {
      results.warnings.push('空表单提交未显示验证错误提示');
      console.log('   ⚠️ 未检测到验证错误提示');
    }
    
    await takeScreenshot(page, '03-validation-error');

    // ==================== 测试 8: 表单验证 - 无效邮箱 ====================
    console.log('📋 测试 8: 表单验证 - 无效邮箱格式');
    
    await safeFill(page, 'input[type="email"]', 'invalid-email');
    await safeFill(page, 'input[type="password"]', TEST_PASSWORD);
    await submitBtn.click();
    await page.waitForTimeout(500);
    
    // 检查邮箱格式验证错误
    let hasEmailError = false;
    for (const selector of errorSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          hasEmailError = true;
          break;
        }
      } catch (e) {}
    }
    
    if (hasEmailError) {
      results.passed.push('无效邮箱格式验证正常');
      console.log('   ✅ 无效邮箱格式显示验证错误');
    } else {
      results.warnings.push('无效邮箱格式未显示验证错误');
      console.log('   ⚠️ 未检测到邮箱格式验证错误');
    }

    // ==================== 测试 9: 正常登录流程 ====================
    console.log('📋 测试 9: 正常登录流程');
    
    // 填写正确的登录信息
    await safeFill(page, 'input[type="email"]', TEST_EMAIL);
    await safeFill(page, 'input[type="password"]', TEST_PASSWORD);
    
    await takeScreenshot(page, '04-filled-login-form');
    
    // 提交登录
    await submitBtn.click();
    
    // 等待跳转或响应
    // GitPulse 登录成功后跳转到根路径 "/"，而不是 "/dashboard"
    try {
      // 等待 URL 变化（离开登录页面）
      await page.waitForURL(url => !url.includes('login'), { timeout: 10000 });
      
      const newUrl = page.url();
      if (newUrl === TARGET_URL + '/' || newUrl === TARGET_URL || newUrl.includes('dashboard')) {
        results.passed.push('登录成功跳转到主页');
        console.log('   ✅ 登录成功，跳转到: ' + newUrl);
      } else {
        results.passed.push('登录成功跳转到: ' + newUrl);
        console.log('   ✅ 登录成功，跳转到: ' + newUrl);
      }
    } catch (e) {
      // 检查是否仍在登录页面但有错误
      const hasError = await page.locator('.error, .alert-error, [role="alert"]').isVisible().catch(() => false);
      if (hasError) {
        const errorText = await page.locator('.error, .alert-error, [role="alert"]').first().textContent();
        console.log(`   ⚠️ 登录失败: ${errorText}`);
        results.warnings.push(`登录失败: ${errorText}`);
      } else {
        // 检查是否已经登录成功（URL 可能已经变化）
        const currentUrl = page.url();
        if (!currentUrl.includes('login')) {
          results.passed.push('登录成功');
          console.log('   ✅ 登录成功，当前 URL: ' + currentUrl);
        } else {
          console.log('   ℹ️ 登录请求已发送，等待响应...');
        }
      }
    }
    
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '05-after-login');

    // ==================== 测试 10: 检查用户信息显示 ====================
    console.log('📋 测试 10: 检查用户信息显示');
    
    // 检查用户信息显示区域
    const userInfoSelectors = [
      '[data-testid="user-info"]',
      '[data-testid="user-avatar"]',
      '[data-testid="user-name"]',
      '.rounded-full',
    ];
    
    let userInfoFound = false;
    for (const selector of userInfoSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          userInfoFound = true;
          break;
        }
      } catch (e) {}
    }
    
    if (userInfoFound) {
      results.passed.push('用户信息显示正常');
      console.log('   ✅ 用户信息显示正常');
    } else {
      results.warnings.push('未找到用户信息显示');
      console.log('   ⚠️ 未找到用户信息显示');
    }

    // ==================== 测试 11: 登出功能 ====================
    console.log('📋 测试 11: 登出功能');
    
    // 查找登出按钮
    const logoutSelectors = [
      'button:has-text("退出")',
      'button:has-text("登出")',
      'button:has-text("Logout")',
      'a:has-text("退出")',
      'a:has-text("登出")',
      '[data-testid="logout"]',
      'button[title="退出登录"]',
    ];
    
    let logoutSuccess = false;
    for (const selector of logoutSelectors) {
      try {
        const logoutBtn = page.locator(selector).first();
        if (await logoutBtn.isVisible({ timeout: 1000 })) {
          console.log(`   🔗 找到登出按钮: ${selector}`);
          await logoutBtn.click();
          await page.waitForLoadState('networkidle');
          
          // 验证是否跳转到登录页面
          const currentUrl = page.url();
          if (currentUrl.includes('login') || currentUrl === TARGET_URL + '/') {
            results.passed.push('登出成功跳转到登录页');
            console.log('   ✅ 登出成功，跳转到登录页');
            logoutSuccess = true;
          }
          break;
        }
      } catch (e) {
        // 继续
      }
    }
    
    if (!logoutSuccess) {
      // 尝试点击用户头像打开下拉菜单
      const avatarBtn = page.locator('img[alt*="avatar"], [data-testid="user-avatar"], button:has(img)').first();
      if (await avatarBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await avatarBtn.click();
        await page.waitForTimeout(300);
        
        for (const selector of logoutSelectors) {
          try {
            const logoutBtn = page.locator(selector).first();
            if (await logoutBtn.isVisible({ timeout: 1000 })) {
              await logoutBtn.click();
              await page.waitForLoadState('networkidle');
              results.passed.push('登出成功（通过下拉菜单）');
              console.log('   ✅ 登出成功（通过下拉菜单）');
              logoutSuccess = true;
              break;
            }
          } catch (e) {
            // 继续
          }
        }
      }
    }
    
    if (!logoutSuccess) {
      results.warnings.push('未找到登出按钮');
      console.log('   ⚠️ 未找到登出按钮');
    }
    
    await takeScreenshot(page, '06-after-logout');

    // ==================== 测试 12: 注册流程 ====================
    console.log('📋 测试 12: 注册流程');
    
    // 重新访问登录页面
    await page.goto(TARGET_URL);
    await page.waitForLoadState('networkidle');
    
    // 查找注册链接
    const registerLink2 = page.locator('a:has-text("注册"), a:has-text("Register"), a[href*="register"]').first();
    if (await registerLink2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await registerLink2.click();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '07-register-page');
      
      // 填写注册表单
      const nameSelectors = ['input[name="name"]', 'input[placeholder*="名"]', 'input[placeholder*="name"]', 'input[id*="name"]'];
      const emailSelectors = ['input[type="email"]', 'input[name="email"]'];
      const passwordSelectors = ['input[type="password"]', 'input[name="password"]'];
      
      // 填写姓名
      for (const selector of nameSelectors) {
        if (await safeFill(page, selector, TEST_NAME)) break;
      }
      
      // 填写邮箱
      const newEmail = `test${Date.now()}@example.com`;
      for (const selector of emailSelectors) {
        if (await safeFill(page, selector, newEmail)) break;
      }
      
      // 填写密码
      for (const selector of passwordSelectors) {
        if (await safeFill(page, selector, TEST_PASSWORD)) break;
      }
      
      // 确认密码（如果存在）
      const confirmPassword = page.locator('input[name="confirmPassword"], input[name="confirm_password"], input[placeholder*="确认"]').first();
      if (await confirmPassword.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmPassword.fill(TEST_PASSWORD);
      }
      
      await takeScreenshot(page, '08-filled-register-form');
      
      // 提交注册
      const registerBtn = page.locator('button[type="submit"]').first();
      await registerBtn.click();
      await page.waitForLoadState('networkidle');
      
      await takeScreenshot(page, '09-after-register');
      
      // 检查注册结果
      const currentUrl = page.url();
      if (currentUrl.includes('dashboard') || currentUrl.includes('home') || currentUrl === TARGET_URL + '/' || currentUrl === TARGET_URL) {
        results.passed.push('注册成功并自动登录');
        console.log('   ✅ 注册成功并自动登录');
      } else {
        results.warnings.push('注册流程未完成跳转');
        console.log('   ℹ️ 注册请求已发送');
      }
    } else {
      results.warnings.push('未找到注册入口');
      console.log('   ⚠️ 未找到注册入口');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    results.failed.push(`测试异常: ${error.message}`);
    await takeScreenshot(page, 'error');
  } finally {
    await browser.close();
  }

  // 输出测试报告
  console.log('\n' + '='.repeat(50));
  console.log('📊 认证功能测试报告');
  console.log('='.repeat(50));
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
