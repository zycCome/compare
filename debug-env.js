// 环境变量检测脚本
console.log("=== 环境变量检测 ===");
console.log("NODE_ENV:", import.meta.env.NODE_ENV);
console.log("MODE:", import.meta.env.MODE);
console.log("PROD:", import.meta.env.PROD);
console.log("DEV:", import.meta.env.DEV);
console.log("VITE_VERCEL:", import.meta.env.VITE_VERCEL);
console.log("BASE_URL:", import.meta.env.BASE_URL);

// 计算basename
const basename = import.meta.env.PROD && !import.meta.env.VITE_VERCEL ? "/price-comparison" : "/";
console.log("计算出的basename:", basename);

// 显示所有环境变量
console.log("\n=== 所有环境变量 ===");
Object.keys(import.meta.env).forEach(key => {
    if (key.startsWith('VITE_') || ['NODE_ENV', 'MODE', 'PROD', 'DEV', 'SSR', 'BASE_URL'].includes(key)) {
        console.log(`${key}: ${import.meta.env[key]}`);
    }
});