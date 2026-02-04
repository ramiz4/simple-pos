const fs = require('fs');
const path = require('path');
const os = require('os');

const identifier = 'com.simple.pos';
const dbName = 'simple-pos.db';

let dbDir;

// Determine path based on OS logic used by Tauri
switch (process.platform) {
  case 'darwin': // macOS
    dbDir = path.join(os.homedir(), 'Library', 'Application Support', identifier);
    break;
  case 'win32': // Windows
    dbDir = path.join(os.homedir(), 'AppData', 'Local', identifier);
    break;
  default: // Linux and others
    dbDir = path.join(os.homedir(), '.local', 'share', identifier);
    break;
}

const filesToDelete = [dbName, `${dbName}-shm`, `${dbName}-wal`];

filesToDelete.forEach((file) => {
  const filePath = path.join(dbDir, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${filePath}`);
    } catch (err) {
      console.error(`Error deleting ${filePath}:`, err.message);
    }
  } else {
    // Optional: Log if file was not found, or keep silent to avoid noise
    // console.log(`File not found: ${filePath}`);
  }
});

console.log('Database reset process finished.');
