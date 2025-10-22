#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 开始GitHub Pages部署...');

try {
  // 1. 构建项目
  console.log('📦 构建项目...');
  execSync('npx vite build --config vite.config.gh-pages.js', { stdio: 'inherit' });

  // 2. 创建临时目录
  console.log('📁 创建临时目录...');
  const tempDir = join(__dirname, 'temp-deploy');
  execSync(`rm -rf ${tempDir}`, { stdio: 'inherit' });
  execSync(`mkdir -p ${tempDir}`, { stdio: 'inherit' });

  // 3. 复制构建文件到临时目录
  console.log('📋 复制构建文件...');
  execSync(`cp -r dist/* ${tempDir}/`, { stdio: 'inherit' });

  // 4. 添加.nojekyll文件
  writeFileSync(join(tempDir, '.nojekyll'), '');

  // 5. 初始化临时Git仓库
  console.log('🔧 初始化Git仓库...');
  execSync(`cd ${tempDir} && git init`, { stdio: 'inherit' });
  execSync(`cd ${tempDir} && git add .`, { stdio: 'inherit' });
  execSync(`cd ${tempDir} && git commit -m "Deploy to GitHub Pages"`, { stdio: 'inherit' });

  // 6. 强制推送到gh-pages分支
  console.log('📤 推送到GitHub...');
  execSync(`cd ${tempDir} && git branch -M gh-pages`, { stdio: 'inherit' });
  execSync(`cd ${tempDir} && git push https://github.com/baowwa/react-cp.git gh-pages --force`, { stdio: 'inherit' });

  // 7. 清理临时目录
  console.log('🧹 清理临时文件...');
  execSync(`rm -rf ${tempDir}`, { stdio: 'inherit' });

  console.log('✅ 部署成功！');
  console.log('🌐 网站地址：https://baowwa.github.io/react-cp/');
  console.log('⏳ 等待2-3分钟后生效...');

} catch (error) {
  console.error('❌ 部署失败:', error.message);
  process.exit(1);
}