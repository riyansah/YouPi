interface TimedStatusItem {
  id: string;
}

export async function syncTimedStatusChanges<T extends TimedStatusItem>(
  current: readonly T[],
  normalized: readonly T[],
  pendingIds: Set<string>,
  persist: (item: T) => Promise<unknown>,
  recover: (id: string) => Promise<unknown>
) {
  const currentById = new Map(current.map((item) => [item.id, item]));
  const changed = normalized.filter((item) => currentById.get(item.id) !== item);

  await Promise.all(
    changed.map(async (item) => {
      if (pendingIds.has(item.id)) {
        return;
      }

      pendingIds.add(item.id);
      try {
        await persist(item);
      } catch {
        await recover(item.id).catch(() => undefined);
      } finally {
        pendingIds.delete(item.id);
      }
    })
  );
}
