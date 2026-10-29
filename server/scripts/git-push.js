const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

async function pushRepo() {
  const args = process.argv.slice(2);
  const repoUrl = args[0];
  const token = args[1];

  if (!repoUrl) {
    console.log('\nUsage: node scripts/git-push.js <GITHUB_REPO_URL> [GITHUB_TOKEN]');
    console.log('Example: node scripts/git-push.js https://github.com/myusername/smart-recon.git ghp_xxxx\n');
    process.exit(1);
  }

  const repoDir = path.resolve(__dirname, '../../');
  console.log(`Setting remote origin: ${repoUrl}`);

  try {
    await git.addRemote({
      fs,
      dir: repoDir,
      remote: 'origin',
      url: repoUrl,
      force: true
    });
  } catch (e) {
    // If remote exists, update it
  }

  console.log('Pushing to GitHub branch main...');
  const pushResult = await git.push({
    fs,
    http,
    dir: repoDir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({
      username: token || 'git',
      password: token || ''
    })
  });

  console.log('✓ Successfully pushed to GitHub!', pushResult);
}

pushRepo().catch(err => {
  console.error('\nPush failed:', err.message);
  process.exit(1);
});
