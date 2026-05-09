export function formatBytes(bytes: number): string {
  return bytes > 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${bytes} B`;
}
