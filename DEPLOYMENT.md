# 📦 项目部署指南

## 🚀 阿里云ECS服务器部署方案 (推荐)

### 概述
本方案适用于将React应用部署到阿里云ECS云服务器，提供稳定、高性能的生产环境。

### 服务器要求
- **配置**: 2核4G内存或更高
- **系统**: CentOS 7/8 或 Ubuntu 20.04+
- **硬盘**: 至少40GB SSD
- **带宽**: 5Mbps或更高
- **网络**: 公网IP，开放80、443、22端口

### 快速部署步骤

#### 1. 服务器环境配置
```bash
# 上传服务器配置脚本到服务器并运行
scp scripts/server-setup.sh root@your-server-ip:/root/
ssh root@your-server-ip
chmod +x server-setup.sh
./server-setup.sh
```

#### 2. 应用部署
```bash
# 创建部署用户
adduser deploy
usermod -aG sudo deploy

# 切换到部署用户
su - deploy

# 克隆项目
git clone https://github.com/your-username/your-repo.git /var/www/price-comparison-platform
cd /var/www/price-comparison-platform

# 修改快速部署脚本中的配置
vim scripts/quick-deploy.sh  # 修改REPO_URL和DOMAIN

# 运行快速部署
chmod +x scripts/quick-deploy.sh
./scripts/quick-deploy.sh
```

#### 3. 域名解析
在阿里云域名解析控制台添加A记录：
- 主域名: `your-domain.com` → 服务器IP
- 子域名: `www.your-domain.com` → 服务器IP

#### 4. SSL证书配置
```bash
# 自动配置SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 验证自动续期
sudo systemctl status certbot.timer
```

### 详细配置说明

#### Nginx配置优化
项目提供了两个Nginx配置文件：
- `nginx/nginx.conf` - 完整配置 (HTTPS + 性能优化)
- `nginx/simple.conf` - 简化配置 (仅HTTP)

主要特性：
- GZIP压缩
- 静态资源缓存
- SPA路由支持
- 安全头配置
- SSL/TLS配置

#### PM2进程管理
```bash
# 启动应用
./scripts/pm2-manage.sh start

# 查看状态
./scripts/pm2-manage.sh status

# 重启应用
./scripts/pm2-manage.sh restart

# 查看日志
./scripts/pm2-manage.sh logs
```

#### 自动化部署
```bash
# 完整部署 (更新代码 + 构建 + 重启服务)
./scripts/deploy.sh

# 仅构建
./scripts/deploy.sh build-only

# 健康检查
./scripts/deploy.sh health

# 更新Nginx配置
./scripts/deploy.sh update-nginx
```

### 监控和维护

#### 日志查看
```bash
# Nginx访问日志
sudo tail -f /var/log/nginx/price-comparison-platform.access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/price-comparison-platform.error.log

# PM2应用日志
./scripts/pm2-manage.sh logs
```

#### 性能监控
```bash
# 系统资源使用
htop

# 磁盘使用情况
df -h

# 网络连接状态
netstat -tlnp

# PM2监控
pm2 monit
```

#### 定期维护
```bash
# 清理旧备份 (保留最近5个)
find /var/backups/price-comparison-platform -type d -mtime +7 -exec rm -rf {} \;

# 清理npm缓存
npm cache clean --force

# 更新系统包
sudo apt update && sudo apt upgrade  # Ubuntu
# sudo yum update                    # CentOS
```

### 故障排除

#### 常见问题

1. **页面404错误**
   ```bash
   # 检查Nginx配置
   sudo nginx -t
   # 重启Nginx
   sudo systemctl restart nginx
   ```

2. **SSL证书问题**
   ```bash
   # 检查证书状态
   sudo certbot certificates
   # 手动续期
   sudo certbot renew
   ```

3. **应用无法启动**
   ```bash
   # 检查PM2状态
   ./scripts/pm2-manage.sh status
   # 查看错误日志
   ./scripts/pm2-manage.sh logs
   # 重启应用
   ./scripts/pm2-manage.sh restart
   ```

4. **域名解析问题**
   ```bash
   # 检查DNS解析
   nslookup your-domain.com
   # 检查hosts文件
   cat /etc/hosts
   ```

#### 性能优化

1. **启用缓存**
   - Nginx配置已包含静态资源缓存
   - 可根据需要调整缓存时间

2. **压缩优化**
   - GZIP压缩已启用
   - 建议使用CDN进一步优化

3. **数据库优化**
   - 如果使用数据库，建议配置连接池
   - 定期备份数据

### 安全配置

#### 防火墙设置
```bash
# Ubuntu (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

#### SSH安全
```bash
# 禁用root登录
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
# 使用密钥登录
# 修改SSH端口 (可选)
sudo systemctl restart sshd
```

#### 定期备份
```bash
# 创建备份脚本
cat > /home/deploy/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/price-comparison-platform"
APP_DIR="/var/www/price-comparison-platform"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/app-backup-$DATE.tar.gz -C $APP_DIR dist nginx
EOF

chmod +x /home/deploy/backup.sh

# 添加到定时任务
echo "0 2 * * * /home/deploy/backup.sh" | crontab -
```

---

## 🚀 快速部署到公网 (免费方案)

### 方案一：Vercel (推荐 - 免费)

#### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
```

#### 3. 部署项目
```bash
# 在项目根目录执行
vercel

# 按提示操作：
# - Set up and deploy? [Y/n] y
# - Which scope do you want to deploy to? 选择你的账号
# - Link to existing project? [y/N] n
# - What's your project's name? price-comparison-platform
# - In which directory is your code located? ./
# - Want to override the settings? [y/N] n
```

#### 4. 获取公网地址
部署成功后，你会得到一个类似这样的地址：
```
✅ Production: https://price-comparison-platform.vercel.app
```

### 方案二：Netlify (免费)

#### 1. 构建项目
```bash
npm run build
```

#### 2. 上传到 Netlify
- 访问 [netlify.com](https://netlify.com)
- 拖拽 `dist` 文件夹到页面
- 获得公网地址

### 方案三：GitHub Pages (免费)

#### 1. 安装 gh-pages
```bash
npm install --save-dev gh-pages
```

#### 2. 修改 package.json
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

#### 3. 部署
```bash
npm run deploy
```

### 方案四：Cloudflare Pages (免费)

1. 访问 [pages.cloudflare.com](https://pages.cloudflare.com)
2. 连接 GitHub 账号
3. 选择此仓库
4. 设置构建命令：`npm run build`
5. 设置输出目录：`dist`
6. 部署完成

## 📋 部署前检查清单

- [ ] 项目构建成功：`npm run build`
- [ ] 没有构建错误和警告
- [ ] 路由配置正确 (React Router)
- [ ] 静态资源路径正确
- [ ] 环境变量配置 (如需要)

## 🛠️ 故障排除

### 构建错误
```bash
# 清理缓存重新构建
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

### 路由问题
如果部署后页面刷新404，确保配置了重写规则：
- Vercel：已配置 `vercel.json`
- Netlify：需要创建 `_redirects` 文件

### 性能优化
当前项目较大 (3.4MB)，可以考虑：
- 代码分割
- 图片优化
- Tree shaking
- 压缩优化

## 📊 部署后测试

部署完成后，测试以下功能：
- [ ] 页面正常加载
- [ ] 路由跳转正常
- [ ] 分组管理功能
- [ ] 报表查看功能
- [ ] 日志查看功能
- [ ] 分享功能
- [ ] 移动端适配

## 🌐 推荐选择

| 平台 | 价格 | 速度 | 易用性 | 推荐度 |
|------|------|------|--------|--------|
| Vercel | 免费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 🥇 |
| Netlify | 免费 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 🥈 |
| Cloudflare Pages | 免费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 🥉 |
| GitHub Pages | 免费 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ |

**推荐使用 Vercel**，因为它专为现代前端应用优化，部署简单，全球CDN速度快。