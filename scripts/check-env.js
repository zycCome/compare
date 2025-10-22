// 环境检测脚本
// 使用方法：node scripts/check-env.js

console.log("🔍 部署环境检测工具");
console.log("==================");

// 模拟不同环境
const environments = [
  {
    name: "本地开发环境",
    env: { NODE_ENV: "development", VITE_VERCEL: undefined }
  },
  {
    name: "Vercel生产环境",
    env: { NODE_ENV: "production", VITE_VERCEL: "true" }
  },
  {
    name: "服务器生产环境",
    env: { NODE_ENV: "production", VITE_VERCEL: undefined }
  }
];

environments.forEach(({ name, env }) => {
  console.log(`\n📍 ${name}:`);
  console.log(`   NODE_ENV: ${env.NODE_ENV}`);
  console.log(`   VITE_VERCEL: ${env.VITE_VERCEL}`);

  // 模拟判断逻辑
  const isProd = env.NODE_ENV === "production";
  const isVercel = env.VITE_VERCEL === "true";
  const isDev = env.NODE_ENV === "development";

  let basename;
  if (isDev) {
    basename = "/";
  } else if (isProd && isVercel) {
    basename = "/";
  } else if (isProd && !isVercel) {
    basename = "/price-comparison";
  } else {
    basename = "/";
  }

  console.log(`   ↳ basename: "${basename}"`);
  console.log(`   ↳ 访问地址: http://your-domain${basename}`);
});

console.log("\n📋 判断逻辑说明:");
console.log("1. 开发环境 (NODE_ENV=development): 使用根路径 '/'");
console.log("2. Vercel环境 (VITE_VERCEL=true): 使用根路径 '/'");
console.log("3. 服务器环境 (NODE_ENV=production): 使用子目录 '/price-comparison'");

console.log("\n🚀 部署测试:");
console.log("1. 本地测试: npm run dev");
console.log("2. Vercel部署: 推送到Git，自动部署");
console.log("3. 服务器部署: 上传dist目录到服务器");