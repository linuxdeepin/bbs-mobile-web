import Taro from "@tarojs/taro";

export const SEND_COOLDOWN_MS = 10_000;
export const DUPLICATE_WINDOW_MS = 60_000;
export const REPLY_MAX_LENGTH = 1000;
export const THREAD_MAX_LENGTH = 5000;

interface History {
  lastSentAt: number;
  entries: { fingerprint: string; sentAt: number }[];
}

interface Storage {
  get(key: string): unknown;
  set(key: string, value: History): void;
}

export function submissionFingerprint(context: string, text: string, images: string[]) {
  const value = JSON.stringify([context, text.replace(/\r\n?/g, "\n").trim(), images]);
  let first = 2166136261;
  let second = 5381;
  for (let i = 0; i < value.length; i++) {
    first = Math.imul(first ^ value.charCodeAt(i), 16777619);
    second = Math.imul(second, 33) ^ value.charCodeAt(i);
  }
  return `${value.length}:${first >>> 0}:${second >>> 0}`;
}

/** Only successful sends consume the cooldown. Failed sends can be retried with the same draft. */
export function createSubmissionGuard(storage: Storage, now = Date.now) {
  const active = new Set<number>();
  const cache = new Map<number, History>();
  const key = (userId: number) => `posting/history/${userId}`;
  const read = (userId: number): History => {
    let stored: unknown;
    try { stored = storage.get(key(userId)); } catch { /* use the in-memory history */ }
    const local = cache.get(userId);
    const candidate = stored as Partial<History> | null;
    const history = candidate && typeof candidate === "object" &&
      typeof candidate.lastSentAt === "number" && Number.isFinite(candidate.lastSentAt) && Array.isArray(candidate.entries)
      ? candidate as History : local || { lastSentAt: 0, entries: [] };
    const latest = local && local.lastSentAt > history.lastSentAt ? local : history;
    return {
      lastSentAt: latest.lastSentAt,
      entries: latest.entries.filter(entry => entry && typeof entry === "object" && typeof entry.fingerprint === "string" &&
        Number.isFinite(entry.sentAt) && now() - entry.sentAt < DUPLICATE_WINDOW_MS),
    };
  };
  const remainingSeconds = (userId: number, timestamp = now()) => {
    const last = read(userId).lastSentAt;
    return last ? Math.max(0, Math.ceil((last + SEND_COOLDOWN_MS - timestamp) / 1000)) : 0;
  };
  const check = (userId: number, fingerprint: string) => {
    if (!userId) throw new Error("请先登录账号");
    if (active.has(userId)) throw new Error("正在发送，请勿重复点击");
    if (read(userId).entries.some(entry => entry.fingerprint === fingerprint)) {
      throw new Error("请勿在60秒内重复发送相同内容");
    }
    const remaining = remainingSeconds(userId);
    if (remaining) throw new Error(`发送太频繁，请${remaining}秒后再试`);
  };
  const begin = (userId: number, fingerprint: string) => {
    check(userId, fingerprint);
    active.add(userId);
    let finished = false;
    return (success: boolean) => {
      if (finished) return;
      finished = true;
      active.delete(userId);
      if (!success) return;
      const timestamp = now();
      const history = read(userId);
      history.lastSentAt = timestamp;
      history.entries.push({ fingerprint, sentAt: timestamp });
      cache.set(userId, history);
      try { storage.set(key(userId), history); } catch { /* retain the in-memory history */ }
    };
  };
  return { check, begin, remainingSeconds };
}

export const submissionGuard = createSubmissionGuard({
  get: key => Taro.getStorageSync(key),
  set: (key, data) => Taro.setStorageSync(key, data),
});
