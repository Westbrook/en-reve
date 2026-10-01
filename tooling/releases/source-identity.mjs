import {execFileSync, spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const sha = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const included = file => file && !file.startsWith('artifacts/') && !/(^|\/)(node_modules|dist|artifacts|results)\//.test(file);

function sourceFiles(root) {
  return new Promise((resolveFiles, reject) => {
    const child = spawn('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const files = [];
    let pending = '', stderr = '';
    // Stream the NUL-delimited paths: frozen evidence can exceed execFile's
    // default output limit, and paths can span chunks or contain newlines.
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      const paths = (pending + chunk).split('\0');
      pending = paths.pop();
      for (const file of paths) if (included(file)) files.push(file);
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-65536); });
    child.once('error', reject);
    child.stdout.once('error', reject);
    child.stderr.once('error', reject);
    child.once('close', (code, signal) => {
      if (code !== 0) {
        reject(new Error(`git ls-files failed (${signal ?? code}): ${stderr.trim()}`));
        return;
      }
      if (included(pending)) files.push(pending);
      resolveFiles(files.sort());
    });
  });
}

export async function sourceIdentity(root, {digestFile = async path => sha(await readFile(path))} = {}) {
  const files = await sourceFiles(root);
  const entries = new Array(files.length);
  let next = 0;
  // Bound disk reads while retaining the sorted input order in the digest.
  await Promise.all(Array.from({length: Math.min(8, files.length)}, async () => {
    while (next < files.length) {
      const index = next++;
      const file = files[index];
      try { entries[index] = [file, await digestFile(resolve(root, file))]; }
      catch (error) {
        if (error.code !== 'ENOENT') throw error;
        entries[index] = [file, null];
      }
    }
  }));
  return {
    head: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
    sourceDigest: sha(JSON.stringify(entries)),
    files: entries.length,
  };
}
