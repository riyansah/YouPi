export function formatHistoryMetadata(metadata: string | null) {
  if (!metadata) {
    return "-";
  }

  try {
    return JSON.stringify(JSON.parse(metadata), null, 2);
  } catch {
    return metadata;
  }
}
