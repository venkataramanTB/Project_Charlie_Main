import { openDB } from 'idb';
const DB_NAME = 'SourceKeysDB';
const STORE_NAME = 'sourceKeys';

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function setSourceKey(componentName, data) {
  const db = await getDB();
  await db.put(STORE_NAME, data, componentName);
}

export async function getSourceKey(componentName) {
  const db = await getDB();
  return await db.get(STORE_NAME, componentName);
}

export async function deleteSourceKey(componentName) {
  const db = await getDB();
  await db.delete(STORE_NAME, componentName);
}

export async function getAllSourceKeys() {
  const db = await getDB();
  const all = {};
  for await (const cursor of db.transaction(STORE_NAME).store) {
    all[cursor.key] = cursor.value;
  }
  return all;
}
