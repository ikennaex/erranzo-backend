// verify_syntax.js
const fs = require('fs');
const cp = require('child_process');

const files = [
  './index.js',
  './controllers/callController.js',
  './routes/callRoutes.js',
  './services/callSocketHandler.js',
  './utils/callUtils.js',
  './config/socket.js'
];

let allPassed = true;

for (const file of files) {
  try {
    cp.execSync(`node -c ${file}`, { stdio: 'ignore' });
    console.log(`[PASS] ${file}`);
  } catch (err) {
    console.error(`[FAIL] ${file}`);
    console.error(err.message);
    allPassed = false;
  }
}

if (allPassed) {
  console.log("All syntax checks passed!");
  process.exit(0);
} else {
  process.exit(1);
}
