const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const backendDir = path.resolve(__dirname, '..');
const envExamplePath = path.join(backendDir, '.env.example');
const envPath = path.join(backendDir, '.env');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: backendDir,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('Created backend/.env from backend/.env.example');
}

run('npm', ['run', 'db:generate']);
run('npm', ['run', 'db:push']);

console.log('Backend setup complete. Add GOOGLE_BOOKS_API_KEY to backend/.env for higher Google Books quota if needed.');
