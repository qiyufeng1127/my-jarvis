/**
 * 金币历史记录修复工具
 * 用于清理重复扣币记录并补偿金币
 */

import { useGoldStore } from '@/stores/goldStore';
import type { GoldTransaction } from '@/stores/goldStore';

export interface DuplicateGroup {
  type: GoldTransaction['type'];
  taskId: string;
  taskTitle: string;
  reason: string;
  amount: number;
  count: number;
  transactions: GoldTransaction[];
}

export type DuplicateFixMode = 'strict' | 'strong';

const DEDUP_TYPES: GoldTransaction['type'][] = ['penalty', 'spend'];
const STRICT_DUPLICATE_WINDOW_MS = 60_000;
const STRONG_DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const normalizeText = (value?: string) => (value || '').trim();

const normalizeReasonForStrongMode = (reason?: string) => {
  const text = normalizeText(reason);

  if (!text) return '';
  if (text.includes('启动超时')) return '启动超时';
  if (text.includes('完成超时')) return '完成超时';
  if (text.includes('启动拖延')) return '启动拖延';
  if (text.includes('验证失败')) return '验证失败';
  if (text.includes('验证异常')) return '验证异常';
  if (text.includes('每日生存成本')) return '每日生存成本';

  return text.replace(/（第\d+次）/g, '').replace(/\d+/g, '#').trim();
};

const isSameDuplicateGroup = (
  a: GoldTransaction,
  b: GoldTransaction,
  mode: DuplicateFixMode
) => {
  const timeDiff = Math.abs(
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (!DEDUP_TYPES.includes(a.type) || a.type !== b.type) {
    return false;
  }

  if (mode === 'strict') {
    return (
      normalizeText(a.taskId) === normalizeText(b.taskId) &&
      normalizeText(a.taskTitle) === normalizeText(b.taskTitle) &&
      normalizeText(a.reason) === normalizeText(b.reason) &&
      a.amount === b.amount &&
      timeDiff < STRICT_DUPLICATE_WINDOW_MS
    );
  }

  const sameTask =
    normalizeText(a.taskId) !== '' &&
    normalizeText(a.taskId) === normalizeText(b.taskId);

  const sameTitle =
    normalizeText(a.taskTitle) !== '' &&
    normalizeText(a.taskTitle) === normalizeText(b.taskTitle);

  const sameReason =
    normalizeReasonForStrongMode(a.reason) === normalizeReasonForStrongMode(b.reason);

  const amountGap = Math.abs(a.amount - b.amount);
  const similarAmount = amountGap <= Math.max(5, Math.round(a.amount * 0.1));

  return (
    (sameTask || sameTitle) &&
    sameReason &&
    similarAmount &&
    timeDiff < STRONG_DUPLICATE_WINDOW_MS
  );
};

export function detectDuplicateTransactions(mode: DuplicateFixMode = 'strict'): DuplicateGroup[] {
  const store = useGoldStore.getState();
  const transactions = store.transactions.filter((t) => DEDUP_TYPES.includes(t.type));

  const duplicateGroups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < transactions.length; i++) {
    const current = transactions[i];

    if (processed.has(current.id)) continue;

    const similar = transactions.filter((t, idx) => {
      if (idx <= i || processed.has(t.id)) return false;
      return isSameDuplicateGroup(current, t, mode);
    });

    if (similar.length > 0) {
      duplicateGroups.push({
        type: current.type,
        taskId: current.taskId || '',
        taskTitle: current.taskTitle || '',
        reason: current.reason,
        amount: current.amount,
        count: similar.length + 1,
        transactions: [current, ...similar],
      });

      processed.add(current.id);
      similar.forEach((t) => processed.add(t.id));
    }
  }

  return duplicateGroups;
}

export function fixDuplicateTransactions(mode: DuplicateFixMode = 'strict'): {
  removedCount: number;
  compensatedGold: number;
  groups: DuplicateGroup[];
} {
  const duplicates = detectDuplicateTransactions(mode);

  if (duplicates.length === 0) {
    return {
      removedCount: 0,
      compensatedGold: 0,
      groups: [],
    };
  }

  const store = useGoldStore.getState();
  let removedCount = 0;
  let compensatedGold = 0;
  const idsToRemove = new Set<string>();

  duplicates.forEach((group) => {
    for (let i = 1; i < group.transactions.length; i++) {
      idsToRemove.add(group.transactions[i].id);
      compensatedGold += group.transactions[i].amount;
      removedCount++;
    }
  });

  const filteredTransactions = store.transactions.filter(
    (t) => !idsToRemove.has(t.id)
  );

  const updates: Partial<ReturnType<typeof useGoldStore.getState>> = {
    transactions: filteredTransactions,
    balance: store.balance + compensatedGold,
  };

  const today = new Date().toDateString();
  if (store.lastResetDate === today && compensatedGold > 0) {
    updates.todayEarned = store.todayEarned + compensatedGold;
  }

  if (compensatedGold > 0) {
    const compensationTransaction: GoldTransaction = {
      id: crypto.randomUUID(),
      type: 'earn',
      amount: compensatedGold,
      reason: `系统补偿：${mode === 'strong' ? '强力' : '常规'}修复重复扣币记录（${removedCount}条）`,
      taskId: 'system',
      taskTitle: '系统补偿',
      timestamp: new Date(),
    };

    updates.transactions = [compensationTransaction, ...filteredTransactions];
  }

  useGoldStore.setState(updates);

  console.log(`✅ ${mode === 'strong' ? '强力' : '常规'}修复完成：删除${removedCount}条重复记录，补偿${compensatedGold}金币`);

  return {
    removedCount,
    compensatedGold,
    groups: duplicates,
  };
}

export function generateFixReport(
  groups: DuplicateGroup[],
  mode: DuplicateFixMode = 'strict'
): string {
  if (groups.length === 0) {
    return mode === 'strong'
      ? '✅ 强力模式下未发现可疑重复扣币记录'
      : '✅ 未发现重复扣币记录';
  }

  let report = `${mode === 'strong' ? '🚨 强力模式' : '🔍 常规模式'}发现 ${groups.length} 组重复扣币记录：\n\n`;

  groups.forEach((group, index) => {
    report += `${index + 1}. ${group.taskTitle || '未知任务'}\n`;
    report += `   类型：${group.type === 'penalty' ? '惩罚扣币' : '消费扣币'}\n`;
    report += `   原因：${group.reason}\n`;
    report += `   金额：-${group.amount} 金币\n`;
    report += `   重复次数：${group.count} 次\n`;
    report += `   时间：${new Date(group.transactions[0].timestamp).toLocaleString('zh-CN')}\n`;
    report += `   应补偿：${group.transactions.slice(1).reduce((sum, item) => sum + item.amount, 0)} 金币\n\n`;
  });

  const totalCompensation = groups.reduce(
    (sum, g) => sum + g.transactions.slice(1).reduce((groupSum, item) => groupSum + item.amount, 0),
    0
  );

  report += `💰 总计应补偿：${totalCompensation} 金币`;
  if (mode === 'strong') {
    report += '\n⚠️ 强力模式会按更宽松规则归并相似扣费，确认前请检查报告。';
  }

  return report;
}
