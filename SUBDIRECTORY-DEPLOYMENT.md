# 子目录部署指南

## 🎯 部署目标
- 访问地址：`http://your-server-ip/price-comparison/`
- 支持SPA路由
- 便于未来添加更多项目

## 📋 部署步骤

### 1. 准备服务器环境

#### 安装Nginx (CentOS)
```bash
# 检查是否已安装Nginx
nginx -v

# 如果未安装，则安装
yum install nginx -y

# 启动服务
systemctl start nginx
systemctl enable nginx
```

#### 安装Nginx (Ubuntu)
```bash
# 检查是否已安装Nginx
nginx -v

# 如果未安装，则安装
apt update
apt install nginx -y

# 启动服务
systemctl start nginx
systemctl enable nginx
```

### 2. 创建项目目录

```bash
# 创建项目目录
mkdir -p /var/www/html/price-comparison

# 设置权限
chown -R www-data:www-data /var/www/html/price-comparison
chmod -R 755 /var/www/html/price-comparison
```

### 3. 上传构建文件

#### 方法一：直接上传整个dist目录
```bash
# 在本地电脑执行
scp -r dist/ root@your-server-ip:/var/www/html/price-comparison/
```

#### 方法二：使用压缩包上传
```bash
# 本地打包
tar -czf price-comparison.tar.gz dist/

# 上传压缩包
scp price-comparison.tar.gz root@your-server-ip:/tmp/

# 服务器上解压
ssh root@your-server-ip
cd /var/www/html/price-comparison
rm -rf *
tar -xzf /tmp/price-comparison.tar.gz --strip-components=1
rm /tmp/price-comparison.tar.gz
```

### 4. 配置Nginx

#### 备份原配置
```bash
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.backup
```

#### 使用完整配置
```bash
# 上传配置文件
scp nginx/subdirectory.conf root@your-server-ip:/etc/nginx/conf.d/

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
```

#### 或手动编辑配置
```bash
# 编辑Nginx配置
vim /etc/nginx/conf.d/default.conf

# 替换为以下内容：
server {
    listen 80 default_server;
    root /var/www/html;
    index index.html;

    location /price-comparison/ {
        alias /var/www/html/price-comparison/;
        try_files $uri $uri/ /price-comparison/index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### 5. 验证部署

#### 检查文件结构
```bash
# 服务器上检查
ls -la /var/www/html/price-comparison/
# 应该看到：index.html 和 assets/ 目录
```

#### 检查Nginx状态
```bash
# 检查Nginx状态
systemctl status nginx

# 检查错误日志
tail -f /var/log/nginx/error.log
```

#### 测试访问
在浏览器访问：`http://your-server-ip/price-comparison/`

### 6. 故障排除

#### 404错误
```bash
# 检查文件是否存在
ls -la /var/www/html/price-comparison/index.html

# 检查Nginx配置
nginx -t

# 重启Nginx
systemctl restart nginx
```

#### 静态资源404
```bash
# 检查assets目录
ls -la /var/www/html/price-comparison/assets/

# 检查权限
chown -R www-data:www-data /var/www/html/price-comparison
```

#### SPA路由问题
确保Nginx配置中有：
```nginx
try_files $uri $uri/ /price-comparison/index.html;
```

## 🚀 添加更多项目

### 示例：添加另一个项目
```bash
# 创建新项目目录
mkdir -p /var/www/html/another-project

# 上传构建文件
scp -r another-project-dist/* root@your-server-ip:/var/www/html/another-project/

# 更新Nginx配置
vim /etc/nginx/conf.d/default.conf

# 添加新的location块
location /another-project/ {
    alias /var/www/html/another-project/;
    try_files $uri $uri/ /another-project/index.html;
}

# 重启Nginx
systemctl restart nginx
```

## 📊 访问地址

完成部署后，可以通过以下地址访问：
- 主页面：`http://your-server-ip/price-comparison/`
- 子页面：`http://your-server-ip/price-comparison/dashboard`
- 其他页面：`http://your-server-ip/price-comparison/任意路由`

## 📁 最终目录结构

```
/var/www/html/
├── price-comparison/
│   ├── index.html
│   └── assets/
│       ├── index-xxxx.js
│       ├── index-xxxx.css
│       └── ...
└── other-projects/           # 未来项目
```

## 🔒 安全建议

1. **设置防火墙**
```bash
# CentOS
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# Ubuntu
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

2. **配置SSL（可选）**
```bash
# 安装certbot
yum install certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d your-domain.com
```

## 🎉 部署完成

如果一切顺利，您现在应该可以通过 `http://your-server-ip/price-comparison/` 访问您的应用了！