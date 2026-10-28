import { spawn } from 'node:child_process';
import path from 'node:path';

// If Render still executes 'node generate_diagrams.js', forward to the actual backend server
console.log('🎬 Starting CineMoments API Server...');
const serverPath = path.resolve('backend', 'src', 'server.js');
const child = spawn(process.execPath, [serverPath], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
