/** File constraints are selection-time UX checks, never server validation. */
export interface FileSelectionConstraints {
  readonly accept: string;
  readonly multiple: boolean;
  readonly maxFileSize?: number;
}
export type FileRejectionReason = 'accept' | 'max-file-size' | 'multiple';
export interface FileRejection {
  readonly file: File;
  readonly reason: FileRejectionReason;
}
export interface FileRejectionDetail {
  readonly files: readonly File[];
  readonly rejections: readonly FileRejection[];
}

/** Unknown/invalid accept tokens do not accidentally prohibit every selection. */
export function acceptsFile(file: Pick<File, 'name' | 'type'>, accept: string): boolean {
  const tokens = accept.toLowerCase().split(',').map((token) => token.trim()).filter((token) =>
    /^\.[^\s,/]+$/.test(token) || /^[\w!#$&^.+-]+\/(?:[\w!#$&^.+-]+|\*)$/.test(token));
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => token.startsWith('.') ? name.endsWith(token) :
    token.endsWith('/*') ? type.startsWith(token.slice(0, -1)) : type === token);
}

/** Reject the complete batch so a partially accepted selection is never silent. */
export function fileRejections(files: readonly File[], constraints: FileSelectionConstraints): readonly FileRejection[] {
  const rejections: FileRejection[] = [];
  for (const file of files) {
    if (!constraints.multiple && files.length > 1) rejections.push(Object.freeze({ file, reason: 'multiple' }));
    if (!acceptsFile(file, constraints.accept)) rejections.push(Object.freeze({ file, reason: 'accept' }));
    if (Number.isFinite(constraints.maxFileSize) && constraints.maxFileSize! >= 0 && file.size > constraints.maxFileSize!) {
      rejections.push(Object.freeze({ file, reason: 'max-file-size' }));
    }
  }
  return Object.freeze(rejections);
}
