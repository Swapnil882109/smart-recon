const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');

async function initRepo() {
  const repoDir = path.resolve(__dirname, '../../');
  console.log('Initializing git repository in:', repoDir);

  // 1. Initialize .git
  await git.init({ fs, dir: repoDir, defaultBranch: 'main' });
  console.log('✓ Git repository initialized (.git created on branch main)');

  // 2. Helper to scan all files respecting .gitignore
  const ignorePatterns = [
    'node_modules',
    '.git',
    '.sqlite',
    '.sqlite-journal',
    'uploads',
    '.DS_Store',
    'Thumbs.db'
  ];

  function getFiles(dir, base = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const relPath = path.posix.join(base, entry.name);
      if (ignorePatterns.some(pat => entry.name === pat || relPath.includes(pat))) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(getFiles(fullPath, relPath));
      } else {
        files.push(relPath);
      }
    }
    return files;
  }

  const allFiles = getFiles(repoDir);
  console.log(`Staging ${allFiles.length} files...`);

  for (const file of allFiles) {
    await git.add({ fs, dir: repoDir, filepath: file });
  }
  console.log('✓ Staged all project files');

  // 3. Create initial commit
  const sha = await git.commit({
    fs,
    dir: repoDir,
    message: 'Initial commit: Smart Recon — Automated Invoice Reconciliation System',
    author: {
      name: 'Smart Recon System',
      email: 'admin@smartrecon.io'
    }
  });

  console.log('✓ Created initial commit:', sha);
  console.log('\nRepository is ready with full commit history on branch: main');
}

initRepo().catch(err => {
  console.error('Git error:', err);
  process.exit(1);
});
