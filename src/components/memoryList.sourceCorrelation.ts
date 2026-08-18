const responseWorkspaceEpoch = (body: unknown): number => {
  if (!body || typeof body !== 'object') return 0;
  return Number((body as { workspaceEpoch?: unknown }).workspaceEpoch);
};

export const matchesMemoryWorkspaceEpoch = (
  body: unknown,
  expectedWorkspaceEpoch: number,
): boolean => expectedWorkspaceEpoch <= 0
  || responseWorkspaceEpoch(body) === expectedWorkspaceEpoch;

export const matchesMemorySourceCommand = (
  body: unknown,
  expectedWorkspaceEpoch: number,
  expectedOwnerEpoch: string,
): boolean => {
  if (!expectedOwnerEpoch || !body || typeof body !== 'object') return false;
  const commandOwnerEpoch = String(
    (body as { ownerEpoch?: unknown }).ownerEpoch ?? '',
  );
  return commandOwnerEpoch === expectedOwnerEpoch
    && matchesMemoryWorkspaceEpoch(body, expectedWorkspaceEpoch);
};
