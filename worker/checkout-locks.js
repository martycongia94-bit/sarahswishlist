// Staged helpers. Not wired into live checkout until rules and migration are tested.
export async function commitCheckoutLocks(env, token, ids, attempt, operation) {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 10 ||
      new Set(ids).size !== ids.length ||
      !ids.every(id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id)) ||
      typeof attempt !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(attempt) ||
      !['acquire', 'paid', 'release'].includes(operation)) {
    throw new Error('Invalid lock operation');
  }
  const database = 'projects/' + env.FIREBASE_PROJECT_ID + '/databases/' + env.FIREBASE_DATABASE_ID;
  const base = 'https://firestore.googleapis.com/v1/' + database + '/documents';
  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  const writes = await Promise.all(ids.map(async id => {
    const name = database + '/documents/checkout_locks/' + id;
    if (operation === 'acquire') {
      const existing = await fetch(base + '/checkout_locks/' + id, { headers });
      if (existing.ok) {
        const lock = await existing.json();
        if (lock.fields?.attempt?.stringValue === attempt &&
            ['pending', 'paid'].includes(lock.fields?.status?.stringValue)) return null;
        throw new Error('Existing lock belongs to another attempt');
      }
      if (existing.status !== 404) throw new Error('Lock read failed');
      return {
        update: { name, fields: { attempt: { stringValue: attempt }, status: { stringValue: 'pending' } } },
        currentDocument: { exists: false },
        updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }]
      };
    }
    const response = await fetch(base + '/checkout_locks/' + id, { headers });
    if (response.status === 404 && operation === 'release') return null;
    if (!response.ok) throw new Error('Lock read failed');
    const lock = await response.json();
    if (operation === 'paid' && lock.fields?.attempt?.stringValue === attempt && lock.fields?.status?.stringValue === 'paid') return null;
    if (lock.fields?.attempt?.stringValue !== attempt || lock.fields?.status?.stringValue !== 'pending' || !lock.updateTime) {
      throw new Error('Lock ownership or state mismatch');
    }
    const currentDocument = { updateTime: lock.updateTime };
    if (operation === 'release') return { delete: name, currentDocument };
    return {
      update: { name, fields: { status: { stringValue: 'paid' } } },
      updateMask: { fieldPaths: ['status'] },
      updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
      currentDocument
    };
  }));
  const pendingWrites = writes.filter(Boolean);
  if (!pendingWrites.length) return true;
  const response = await fetch(base + ':commit', {
    method: 'POST', headers, body: JSON.stringify({ writes: pendingWrites })
  });
  if (!response.ok) throw new Error('Lock commit failed: HTTP ' + response.status);
  return true;
}
