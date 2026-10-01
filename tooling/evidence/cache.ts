import { mkdir, readFile, readdir, rename, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertDigest, canonicalJson, digestBytes, digestJson, validateIdentity } from './identity.ts';
import type { Digest, Identity, Json } from './identity.ts';

export interface EvidenceArtifact {
  digest: Digest;
  mediaType: string;
  label: string;
}

export interface CompletedEvidence {
  schemaVersion: 1;
  identity: Identity;
  originatingRun: string;
  selectionReceipt: EvidenceArtifact;
  artifacts: EvidenceArtifact[];
  /** Failures remain evidence; lookup does not reinterpret them as reusable passes. */
  outcome: 'passed' | 'failed';
  result: Json;
}

export type CacheLookup =
  | { status: 'hit'; evidence: CompletedEvidence }
  | { status: 'miss'; reason: 'absent' | 'corrupt' | 'failed-evidence' | 'incomplete-selection'; detail: string; evidence?: CompletedEvidence; failedRuns?: string[] };

/** Private local storage. Artifacts and entries become visible only after complete atomic writes. */
export class EvidenceCache {
  directory: string;

  constructor(directory: string) {
    this.directory = directory;
  }

  async storeArtifact(bytes: string | Uint8Array, details: { label: string; mediaType: string }): Promise<EvidenceArtifact> {
    if (!details.label || !details.mediaType) throw new TypeError('Artifact label and media type are required.');
    const digest = digestBytes(bytes);
    await this.#atomic(this.#blobPath(digest), bytes);
    return { digest, ...details };
  }

  async writeCompleted(evidence: CompletedEvidence): Promise<void> {
    this.#validate(evidence);
    await this.#verifyArtifacts(evidence);
    // Per-run entries keep failures/history when another attempt uses the same input identity.
    const receipt = digestJson(evidence);
    const envelope = { schemaVersion: 1, receipt, evidence };
    await this.#atomic(join(this.#historyPath(evidence.identity.digest), `${receipt.slice(7)}.json`), canonicalJson(envelope));
    await this.#atomic(this.#entryPath(evidence.identity.digest), canonicalJson(envelope));
  }

  async lookup(identity: Identity): Promise<CacheLookup> {
    validateIdentity(identity);
    let content: string;
    try {
      content = await readFile(this.#entryPath(identity.digest), 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { status: 'miss', reason: 'absent', detail: 'No completed entry for these inputs.' };
      throw error;
    }
    try {
      const envelope = JSON.parse(content);
      if (envelope.schemaVersion !== 1 || envelope.receipt !== digestJson(envelope.evidence)) throw new Error('Cache receipt integrity mismatch.');
      const evidence = envelope.evidence as CompletedEvidence;
      this.#validate(evidence);
      if (evidence.identity.digest !== identity.digest) throw new Error('Cache entry identity mismatch.');
      await this.#verifyArtifacts(evidence);
      const selection = JSON.parse(await readFile(this.#blobPath(evidence.selectionReceipt.digest), 'utf8'));
      if (selection.gaps.length) {
        return { status: 'miss', reason: 'incomplete-selection', detail: 'Dependency metadata gaps prevent evidence reuse.', evidence };
      }
      const failures: CompletedEvidence[] = [];
      for (const file of await readdir(this.#historyPath(identity.digest))) {
        if (!file.endsWith('.json')) continue;
        const historical = JSON.parse(await readFile(join(this.#historyPath(identity.digest), file), 'utf8'));
        if (historical.schemaVersion !== 1 || historical.receipt !== digestJson(historical.evidence) ||
          historical.evidence.identity.digest !== identity.digest) throw new Error('Historical evidence receipt integrity mismatch.');
        this.#validate(historical.evidence);
        if (historical.evidence.outcome === 'failed') failures.push(historical.evidence);
      }
      if (failures.length) return {
        status: 'miss', reason: 'failed-evidence',
        detail: 'A failure for these same inputs is retained. A later passing retry cannot hide flaky evidence or grant reuse.',
        evidence,
        failedRuns: [...new Set(failures.map(failure => failure.originatingRun))].sort(),
      };
      return { status: 'hit', evidence };
    } catch (error) {
      return { status: 'miss', reason: 'corrupt', detail: error instanceof Error ? error.message : String(error) };
    }
  }

  #validate(evidence: CompletedEvidence): void {
    if (evidence.schemaVersion !== 1) throw new TypeError('Unknown completed-evidence schema.');
    validateIdentity(evidence.identity);
    if (evidence.identity.kind === 'review') throw new TypeError('Review decisions cannot be inferred or adopted by the evidence cache.');
    if (!evidence.originatingRun || !['passed', 'failed'].includes(evidence.outcome)) throw new TypeError('Completed evidence needs a run and outcome.');
    if (!Array.isArray(evidence.artifacts) || !evidence.artifacts.length || !evidence.selectionReceipt) {
      throw new TypeError('Completed evidence requires artifacts and an explicit selection receipt.');
    }
    for (const artifact of [...evidence.artifacts, evidence.selectionReceipt]) {
      assertDigest(artifact.digest);
      if (!artifact.label || !artifact.mediaType) throw new TypeError('Invalid artifact metadata.');
    }
    canonicalJson(evidence.result);
  }

  async #verifyArtifacts(evidence: CompletedEvidence): Promise<void> {
    for (const artifact of [...evidence.artifacts, evidence.selectionReceipt]) {
      const bytes = await readFile(this.#blobPath(artifact.digest));
      if (digestBytes(bytes) !== artifact.digest) throw new Error(`Corrupt evidence artifact: ${artifact.label}`);
    }
    const selection = JSON.parse(await readFile(this.#blobPath(evidence.selectionReceipt.digest), 'utf8'));
    if (selection.schemaVersion !== 1 || !Array.isArray(selection.changed) || !Array.isArray(selection.affected) ||
      !Array.isArray(selection.scenarios) || !Array.isArray(selection.gaps) || !['focused', 'expanded'].includes(selection.mode)) {
      throw new TypeError('Evidence selection receipt is incomplete or uses an unknown schema.');
    }
    assertDigest(selection.graphDigest);
  }

  #blobPath(digest: Digest): string {
    assertDigest(digest);
    return join(this.directory, 'blobs', digest.slice(7));
  }

  #entryPath(digest: Digest): string {
    assertDigest(digest);
    return join(this.directory, 'entries', `${digest.slice(7)}.json`);
  }

  #historyPath(digest: Digest): string {
    assertDigest(digest);
    return join(this.directory, 'history', digest.slice(7));
  }

  async #atomic(file: string, content: string | Uint8Array): Promise<void> {
    const directory = join(file, '..');
    await mkdir(directory, { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, content, { flag: 'wx' });
      await rename(temporary, file);
    } finally {
      await rm(temporary, { force: true });
    }
  }
}
