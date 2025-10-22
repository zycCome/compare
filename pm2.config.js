module.exports = {
  apps: [
    {
      name: 'price-comparison-platform',
      script: 'serve',
      args: '-s dist -l 3000',
      cwd: '/var/www/price-comparison-platform',

      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },

      // 生产环境
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },

      // 实例数量
      instances: 1,

      // 自动重启
      autorestart: true,

      // 监听文件变化
      watch: false,

      // 内存限制
      max_memory_restart: '500M',

      // 日志配置
      log_file: '/var/log/price-comparison-platform/combined.log',
      out_file: '/var/log/price-comparison-platform/out.log',
      error_file: '/var/log/price-comparison-platform/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // 进程管理
      kill_timeout: 5000,
      restart_delay: 5000,

      // 运行用户
      user: 'www-data',

      // 合并日志
      merge_logs: true,

      // 其他配置
      source_map_support: true,
      disable_logs: false,

      // 健康检查
      health_check_grace_period: 3000,

      // 延迟启动
      wait_ready: true,
      listen_timeout: 10000
    }
  ],

  // 部署配置
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/your-repo.git',
      path: '/var/www/price-comparison-platform',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },

    staging: {
      user: 'deploy',
      host: 'your-staging-server-ip',
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/your-repo.git',
      path: '/var/www/price-comparison-platform-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
};