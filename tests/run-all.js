/**
 * GitPulse 全部测试运行脚本
 * 直接运行测试脚本
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

const testScripts = [
  { name: '认证功能测试', file: 'auth.spec.js', icon: '🔐' },
  { name: '仪表板功能测试', file: 'dashboard.spec.js', icon: '📊' },
  { name: '项目管理功能测试', file: 'projects.spec.js', icon: '📁' },
  { name: '内容管理功能测试', file: 'content.spec.js', icon: '📝' },
  { name: '团队管理功能测试', file: 'team.spec.js', icon: '👥' },
  { name: '设置功能测试', file: 'settings.spec.js', icon: '⚙️' },
  { name: '导航功能测试', file: 'navigation.spec.js', icon: '🧭' },
];

const allResults = {
  startTime: new Date().toLocaleString(),
  endTime: '',
  modules: [],
  totalPassed: 0,
  totalWarnings: 0,
  totalFailed: 0,
  totalScreenshots: 0,
};

console.log('🚀 GitPulse 全部功能测试');
console.log('='.repeat(60));
console.log(`📅 测试时间: ${allResults.startTime}`);
console.log(`📍 目标 URL: ${process.env.TARGET_URL || 'http://localhost:3000'}`);
console.log('');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

for (const test of testScripts) {
  console.log('\n' + '-'.repeat(60));
  console.log(`${test.icon} 运行: ${test.name}`);
  console.log('-'.repeat(60));
  
  const testPath = path.join(__dirname, test.file);
  
  if (!fs.existsSync(testPath)) {
    console.log(`⚠️ 测试文件不存在: ${test.file}`);
    continue;
  }
  
  try {
    const output = execSync(`node "${testPath}"`, {
      encoding: 'utf-8',
      env: process.env,
      timeout: 120000,
    });
    
    console.log(output);
    
    const passed = parseResults(output, '✅ 通过:', '✓');
    const warnings = parseResults(output, '⚠️ 警告:', '⚠');
    const failed = parseResults(output, '❌ 失败:', '✗');
    const screenshots = parseScreenshots(output);
    
    allResults.modules.push({
      name: test.name,
      icon: test.icon,
      status: failed.length > 0 ? 'failed' : 'passed',
      passed,
      warnings,
      failed,
      screenshots,
    });
    
    allResults.totalPassed += passed.length;
    allResults.totalWarnings += warnings.length;
    allResults.totalFailed += failed.length;
    allResults.totalScreenshots += screenshots.length;
    
  } catch (error) {
    const output = error.stdout || error.stderr || error.message;
    console.log(output);
    
    const passed = parseResults(output, '✅ 通过:', '✓');
    const warnings = parseResults(output, '⚠️ 警告:', '⚠');
    const failed = parseResults(output, '❌ 失败:', '✗');
    const screenshots = parseScreenshots(output);
    
    allResults.modules.push({
      name: test.name,
      icon: test.icon,
      status: 'failed',
      passed,
      warnings,
      failed,
      screenshots,
    });
    
    allResults.totalPassed += passed.length;
    allResults.totalWarnings += warnings.length;
    allResults.totalFailed += failed.length;
    allResults.totalScreenshots += screenshots.length;
  }
}

allResults.endTime = new Date().toLocaleString();

generateReport();

console.log('\n' + '='.repeat(60));
console.log('📊 测试汇总报告');
console.log('='.repeat(60));
console.log(`\n总测试模块: ${allResults.modules.length}`);
console.log(`✅ 通过项: ${allResults.totalPassed}`);
console.log(`⚠️ 警告项: ${allResults.totalWarnings}`);
console.log(`❌ 失败项: ${allResults.totalFailed}`);
console.log(`📸 截图总数: ${allResults.totalScreenshots}`);
console.log(`\n📄 详细报告已生成: ${path.join(__dirname, 'test-report.md')}`);
console.log('\n🏁 全部测试完成');

function parseResults(output, header, marker) {
  const results = [];
  const lines = output.split('\n');
  let collecting = false;
  
  for (const line of lines) {
    if (line.includes(header)) {
      collecting = true;
      continue;
    }
    if (collecting && line.trim().startsWith(marker)) {
      const item = line.trim().substring(1).trim();
      if (item) results.push(item);
    }
    if (collecting && (line.includes('📸') || line.includes('🏁') || line.includes('====='))) {
      collecting = false;
    }
  }
  
  return results;
}

function parseScreenshots(output) {
  const screenshots = [];
  const lines = output.split('\n');
  let collecting = false;
  
  for (const line of lines) {
    if (line.includes('📸 截图:')) {
      collecting = true;
      continue;
    }
    if (collecting && line.trim().startsWith('📷')) {
      const item = line.trim().substring(1).trim();
      if (item) screenshots.push(item);
    }
    if (collecting && line.includes('🏁')) {
      collecting = false;
    }
  }
  
  return screenshots;
}

function generateReport() {
  const reportPath = path.join(__dirname, 'test-report.md');
  
  let md = `# GitPulse 浏览器自动化测试报告

## 测试概览

| 项目 | 值 |
|------|-----|
| 测试时间 | ${allResults.startTime} - ${allResults.endTime} |
| 目标 URL | ${process.env.TARGET_URL || 'http://localhost:3000'} |
| 测试模块数 | ${allResults.modules.length} |
| ✅ 通过项 | ${allResults.totalPassed} |
| ⚠️ 警告项 | ${allResults.totalWarnings} |
| ❌ 失败项 | ${allResults.totalFailed} |
| 📸 截图数 | ${allResults.totalScreenshots} |

## 测试结果汇总

| 模块 | 通过 | 警告 | 失败 | 状态 |
|------|------|------|------|------|
`;

  for (const module of allResults.modules) {
    const status = module.failed.length > 0 ? '❌' : (module.warnings.length > 0 ? '⚠️' : '✅');
    md += `| ${module.icon} ${module.name} | ${module.passed.length} | ${module.warnings.length} | ${module.failed.length} | ${status} |\n`;
  }

  md += `\n---\n\n## 详细问题列表\n\n`;

  if (allResults.totalFailed > 0) {
    md += `### ❌ 失败项\n\n`;
    for (const module of allResults.modules) {
      if (module.failed.length > 0) {
        md += `#### ${module.icon} ${module.name}\n\n`;
        for (const item of module.failed) {
          md += `- ${item}\n`;
        }
        md += '\n';
      }
    }
  }

  if (allResults.totalWarnings > 0) {
    md += `### ⚠️ 警告项\n\n`;
    for (const module of allResults.modules) {
      if (module.warnings.length > 0) {
        md += `#### ${module.icon} ${module.name}\n\n`;
        for (const item of module.warnings) {
          md += `- ${item}\n`;
        }
        md += '\n';
      }
    }
  }

  md += `### ✅ 通过项\n\n`;
  for (const module of allResults.modules) {
    if (module.passed.length > 0) {
      md += `#### ${module.icon} ${module.name}\n\n`;
      for (const item of module.passed) {
        md += `- ${item}\n`;
      }
      md += '\n';
    }
  }

  md += `---\n\n## 📸 测试截图\n\n`;
  
  if (fs.existsSync(SCREENSHOT_DIR)) {
    const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).sort();
    if (files.length > 0) {
      md += `| 截图文件 | 对应测试 |\n`;
      md += `|----------|----------|\n`;
      
      const moduleMap = {
        'auth': '认证功能测试',
        'dashboard': '仪表板功能测试',
        'projects': '项目管理功能测试',
        'content': '内容管理功能测试',
        'team': '团队管理功能测试',
        'settings': '设置功能测试',
        'navigation': '导航功能测试',
      };
      
      for (const file of files) {
        const prefix = file.split('-')[0];
        const moduleName = moduleMap[prefix] || '未知';
        md += `| ${file} | ${moduleName} |\n`;
      }
    }
  }

  md += `---\n\n*报告生成时间: ${new Date().toLocaleString()}*\n`;

  fs.writeFileSync(reportPath, md, 'utf-8');
}
