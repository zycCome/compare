import { fileURLToPath, URL } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

const plugins = [react()];

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Vercel 部署配置 - 根路径
    base: '/',

    server: {
      host: '::',
      port: '8080',
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      ...plugins,
      // 打包分析插件
      mode === 'analyze' && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    build: {
      outDir: 'dist',
      // 生产环境优化
      target: 'es2015',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // 将React相关库单独打包
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // 将UI库单独打包
            'ui-vendor': ['antd', '@antv/g2', '@antv/s2', '@antv/s2-react'],
            // 将工具库单独打包
            'utils-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
          },
        },
      },
      // 启用gzip压缩
      reportCompressedSize: true,
      // 增加chunk大小警告限制
      chunkSizeWarningLimit: 1000,
    },
    resolve: {
      alias: [
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
        {
          find: 'lib',
          replacement: resolve(__dirname, 'lib'),
        },
      ],
    },
    // CSS配置
    css: {
      devSourcemap: false,
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            // 可以在这里自定义Ant Design主题
          },
        },
      },
    },
    // 环境变量处理
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    // 优化依赖预构建
    optimizeDeps: {
      include: ['react', 'react-dom', 'antd', 'lucide-react'],
    },
  };
});
