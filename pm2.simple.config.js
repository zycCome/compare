module.exports = {
  apps: [
    {
      name: 'price-comparison-platform',
      script: 'serve',
      args: '-s dist -l 3000',
      cwd: '/var/www/price-comparison-platform',

      // 环境配置
      env: {
        NODE_ENV: 'production'
      },

      // 基础配置
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // 日志配置
      log_file: '/var/log/price-comparison-platform/combined.log',
      out_file: '/var/log/price-comparison-platform/out.log',
      error_file: '/var/log/price-comparison-platform/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true
    }
  ]
};