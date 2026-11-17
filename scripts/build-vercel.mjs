import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';

console.log('[roosterly-build] Starting Vercel full-stack monorepo build...');

// 1. Build backend TypeScript to verify types
console.log('[roosterly-build] Compiling backend workspace (@roosterly/backend)...');
try {
  execSync('npm run build --workspace=@roosterly/backend', { stdio: 'inherit' });
} catch (err) {
  console.error('[roosterly-build] Backend compilation failed:', err);
  process.exit(1);
}

// 2. Build frontend via TanStack Start / Nitro
console.log('[roosterly-build] Building frontend workspace (@roosterly/frontend)...');
try {
  execSync('npm run build --workspace=@roosterly/frontend', { stdio: 'inherit' });
} catch (err) {
  console.error('[roosterly-build] Frontend compilation failed:', err);
  process.exit(1);
}

// 3. Locate Nitro output
const frontendOutput = path.resolve('apps/frontend/.vercel/output');
const rootOutput = path.resolve('.vercel/output');

if (!fs.existsSync(frontendOutput)) {
  console.error(`[roosterly-build] Error: ${frontendOutput} was not generated!`);
  process.exit(1);
}

// 4. Copy frontend output to root .vercel/output
console.log('[roosterly-build] Synchronizing frontend output to root .vercel/output...');
fs.mkdirSync(rootOutput, { recursive: true });
fs.cpSync(frontendOutput, rootOutput, { recursive: true });

// 5. Bundle API function (Express Backend) for Vercel Serverless Function
console.log('[roosterly-build] Bundling Express backend for Vercel Serverless Function...');
const apiFuncDir = path.join(rootOutput, 'functions', 'api.func');
fs.mkdirSync(apiFuncDir, { recursive: true });

// Detect Node.js runtime from frontend SSR config or fallback to nodejs20.x
let runtime = 'nodejs20.x';
const serverConfigPath = path.join(rootOutput, 'functions', '__server.func', '.vc-config.json');
if (fs.existsSync(serverConfigPath)) {
  try {
    const serverConfig = JSON.parse(fs.readFileSync(serverConfigPath, 'utf8'));
    if (serverConfig.runtime) {
      runtime = serverConfig.runtime;
    }
  } catch {
    // Keep fallback
  }
}
console.log(`[roosterly-build] Using runtime ${runtime} for api.func`);

// Bundle api/index.ts into api.func/index.mjs
esbuild.buildSync({
  entryPoints: ['api/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: path.join(apiFuncDir, 'index.mjs'),
});

// Write .vc-config.json for api.func
const vcConfig = {
  runtime,
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  shouldAddHelpers: false,
};
fs.writeFileSync(path.join(apiFuncDir, '.vc-config.json'), JSON.stringify(vcConfig, null, 2));

// 6. Update .vercel/output/config.json with API routing rule
console.log('[roosterly-build] Configuring routing rules in .vercel/output/config.json...');
const configPath = path.join(rootOutput, 'config.json');
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.routes = config.routes || [];

  // Remove existing /api routes if any to prevent duplicates
  config.routes = config.routes.filter(
    (r) => r.dest !== '/api' && (!r.src || !r.src.includes('/api'))
  );

  // Define API routing rule mapping all /api requests to api.func
  const apiRoute = {
    src: '^/api(?:/(.*))?$',
    dest: '/api',
  };

  // Find index of frontend fallback route or append before it
  const fallbackIndex = config.routes.findIndex(
    (r) => r.dest === '/__server' || r.src === '/(.*)'
  );
  if (fallbackIndex >= 0) {
    config.routes.splice(fallbackIndex, 0, apiRoute);
  } else {
    config.routes.push(apiRoute);
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

console.log('[roosterly-build] Build completed successfully! Ready for Vercel deployment.');
