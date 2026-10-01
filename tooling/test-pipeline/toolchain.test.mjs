import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

for (const [line, version] of [['current', 'v26.10.0'], ['lts', 'v24.21.0']]) {
  test(`${line} selects its Node release and the same pinned npm, Python and certificate CLI`, () => {
    for (const [command, expected] of [['node', version], ['npm', '12.1.0'], ['python3', 'Python 3.14.7']]) {
      const result = spawnSync('tooling/test-pipeline/with-toolchain.sh', [command, '--version'], {
        env: { ...process.env, EN_TEST_NODE_LINE: line }, encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout.trim(), expected);
    }
    const certificateCLI = spawnSync('tooling/test-pipeline/with-toolchain.sh', ['openssl', 'version'], {
      env: { ...process.env, EN_TEST_NODE_LINE: line }, encoding: 'utf8',
    });
    assert.equal(certificateCLI.status, 0, certificateCLI.stderr);
    assert.match(certificateCLI.stdout, /^OpenSSL 4\.0\.2(?:\s|$)/);
  });
}
