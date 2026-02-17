const { spawnSync } = require('node:child_process');

const BASE_CANDIDATES = ['origin/main', 'main', 'master'];
const DATABASE_URL_FALLBACK = 'postgresql://CONFIGURE_ME:CONFIGURE_ME@localhost:5432/CONFIGURE_ME';

function resolveBase() {
  for (const candidate of BASE_CANDIDATES) {
    const result = spawnSync('git', ['rev-parse', '--verify', '--quiet', candidate], {
      encoding: 'utf8',
    });

    if (result.status === 0) {
      const sha = result.stdout.trim();
      if (sha) {
        return sha;
      }
    }
  }

  return 'HEAD~1';
}

function run() {
  const base = resolveBase();
  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || DATABASE_URL_FALLBACK,
  };

  const nxCommand = process.platform === 'win32' ? 'nx.cmd' : 'nx';
  const result = spawnSync(
    nxCommand,
    ['affected', '-t', 'test', '--run', '--parallel=3', `--base=${base}`],
    { stdio: 'inherit', env },
  );

  process.exit(result.status ?? 1);
}

run();
