/**
 * 登录流程测试脚本
 * 测试用户认证相关功能
 */

const { chromium } = require('playwright');

// 目标 URL - 可配置
const TARGET_URL = 'http://localhost:3000';

(async () => {
  console.log('🚀 启动浏览器测试...');
  
  // 启动浏览器（可见模式）
  const browser = await chromium.launch({ 
    headless: false,  // 显示浏览器窗口
    slowMo: 100       // 放慢操作速度便于观察
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 步骤 1: 访问首页
    console.log('📍 步骤 1: 访问首页...');
    await page.goto(TARGET_URL);
    await page.waitForLoadState('networkidle');
    
    // 截图保存首页状态
    await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true });
    console.log('   ✅ 首页加载完成');
    console.log(`   📄 页面标题: ${await page.title()}`);
    
    // 步骤 2: 查找登录入口
    console.log('📍 步骤 2: 查找登录入口...');
    
    // 尝试多种可能的登录链接选择器
    const loginSelectors = [
      'a[href*="login"]',
      'a[href*="signin"]',
      'a[href*="auth"]',
      'button:has-text("登录")',
      'button:has-text("Login")',
      'a:has-text("登录")',
      'a:has-text("Login")',
      'a:has-text("Sign in")',
      '[data-testid="login-button"]',
    ];
    
    let loginFound = false;
    for (const selector of loginSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`   🔗 找到登录入口: ${selector}`);
          await element.click();
          loginFound = true;
          break;
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }
    
    if (!loginFound) {
      // 尝试直接访问登录页面
      console.log('   ⚠️ 未找到登录链接，尝试直接访问登录页面...');
      await page.goto(`${TARGET_URL}/login`);
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/02-login-page.png', fullPage: true });
    console.log('   ✅ 登录页面加载完成');
    
    // 步骤 3: 检查登录表单
    console.log('📍 步骤 3: 检查登录表单...');
    
    // 查找邮箱/用户名输入框
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="邮箱"]',
      'input[placeholder*="email"]',
      'input[id*="email"]',
      'input[name="username"]',
      'input[name="user"]',
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          emailInput = element;
          console.log(`   📧 找到邮箱输入框: ${selector}`);
          break;
        }
      } catch (e) {
        // 继续
      }
    }
    
    // 查找密码输入框
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="密码"]',
      'input[placeholder*="password"]',
      'input[id*="password"]',
    ];
    
    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          passwordInput = element;
          console.log(`   🔒 找到密码输入框: ${selector}`);
          break;
        }
      } catch (e) {
        // 继续
      }
    }
    
    // 查找提交按钮
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("登录")',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'input[type="submit"]',
      '[data-testid="submit-button"]',
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          submitButton = element;
          console.log(`   🔘 找到提交按钮: ${selector}`);
          break;
        }
      } catch (e) {
        // 继续
      }
    }
    
    // 步骤 4: 填写测试数据
    if (emailInput && passwordInput) {
      console.log('📍 步骤 4: 填写测试数据...');
      
      const testEmail = 'test@example.com';
      const testPassword = 'TestPassword123!';
      
      await emailInput.fill(testEmail);
      console.log(`   ✅ 已填写邮箱: ${testEmail}`);
      
      await passwordInput.fill(testPassword);
      console.log('   ✅ 已填写密码');
      
      await page.screenshot({ path: 'test-results/03-filled-form.png', fullPage: true });
    } else {
      console.log('   ⚠️ 未找到完整的登录表单');
    }
    
    // 步骤 5: 提交表单
    if (submitButton) {
      console.log('📍 步骤 5: 提交登录表单...');
      await submitButton.click();
      
      // 等待页面跳转或响应
      try {
        await page.waitForURL('**/dashboard**', { timeout: 5000 });
        console.log('   ✅ 登录成功，跳转到仪表板');
      } catch (e) {
        // 检查是否有错误消息
        const errorSelectors = [
          '.error',
          '.alert-error',
          '[role="alert"]',
          '.message-error',
        ];
        
        let hasError = false;
        for (const selector of errorSelectors) {
          try {
            const errorElement = page.locator(selector).first();
            if (await errorElement.isVisible({ timeout: 1000 })) {
              const errorText = await errorElement.textContent();
              console.log(`   ⚠️ 登录失败: ${errorText}`);
              hasError = true;
              break;
            }
          } catch (e2) {
            // 继续
          }
        }
        
        if (!hasError) {
          console.log('   ℹ️ 登录请求已发送，等待响应...');
        }
      }
      
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/04-after-submit.png', fullPage: true });
      console.log(`   📄 当前 URL: ${page.url()}`);
    }
    
    // 步骤 6: 检查登录结果
    console.log('📍 步骤 6: 检查登录结果...');
    
    // 检查是否跳转到仪表板或其他页面
    const currentUrl = page.url();
    if (currentUrl.includes('dashboard') || currentUrl.includes('home')) {
      console.log('   ✅ 登录流程完成 - 已跳转到主页面');
    } else if (currentUrl.includes('login') || currentUrl.includes('signin')) {
      console.log('   ⚠️ 仍在登录页面 - 可能登录失败或需要验证');
    } else {
      console.log(`   ℹ️ 当前页面: ${currentUrl}`);
    }
    
    // 输出测试摘要
    console.log('\n📊 测试摘要:');
    console.log('   - 首页访问: ✅');
    console.log(`   - 登录页面: ${loginFound || currentUrl.includes('login') ? '✅' : '⚠️'}`);
    console.log(`   - 登录表单: ${emailInput && passwordInput ? '✅' : '⚠️'}`);
    console.log(`   - 表单提交: ${submitButton ? '✅' : '⚠️'}`);
    console.log('\n📸 截图已保存到 test-results/ 目录');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    await page.screenshot({ path: 'test-results/error-screenshot.png', fullPage: true });
  } finally {
    // 关闭浏览器
    console.log('\n🏁 测试完成，关闭浏览器...');
    await browser.close();
  }
})();
