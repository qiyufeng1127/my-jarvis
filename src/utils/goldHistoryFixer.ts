/**
 * 金币历史记录修复工具
 * 用于清理重复扣币记录并补偿金币
 */

import { useGoldStore } from '@/stores/goldStore';
import type { GoldTransaction } from '@/stores/goldStore';

interface DuplicateGroup {
  taskId: string;
  taskTitle: string;
  reason: string;
  amount: number;
  count: number;
  transactions: GoldTransaction[];
}

/**
 * 检测重复的扣币记录
 * 规则：同一个任务、同一个原因、同一时间（1分钟内）、相同金额
 */
export function detectDuplicateTransactions(): DuplicateGroup[] {
  const store = useGoldStore.getState();
  const transactions = store.transactions;
  
  // 只检查惩罚类型的交易
  const penalties = transactions.filter(t => t.type === 'penalty');
  
  const duplicateGroups: DuplicateGroup[] = [];
  const processed = new Set<string>();
  
  for (let i = 0; i < penalties.length; i++) {
    const current = penalties[i];
    
    if (processed.has(current.id)) continue;
    
    // 查找与当前记录相似的其他记录
    const similar = penalties.filter((t, idx) => {
      if (idx <= i || processed.has(t.id)) return false;
      
      // 检查是否为同一任务、同一原因、相同金额
      const sameTask = t.taskId === current.taskId;
      const sameReason = t.reason === current.reason;
      const sameAmount = t.amount === current.amount;
      
      // 检查时间是否在1分钟内
      const timeDiff = Math.abs(
        new Date(t.timestamp).getTime() - new Date(current.timestamp).getTime()
      );
      const withinOneMinute = timeDiff < 60000;
      
      return sameTask && sameReason && sameAmount && withinOneMinute;
    });
    
    if (similar.length > 0) {
      // 找到重复记录
      const group: DuplicateGroup = {
        taskId: current.taskId || '',
        taskTitle: current.taskTitle || '',
        reason: current.reason,
        amount: current.amount,
        count: similar.length + 1,
        transactions: [current, ...similar]
      };
      
      duplicateGroups.push(group);
      
      // 标记为已处理
      processed.add(current.id);
      similar.forEach(t => processed.add(t.id));
    }
  }
  
  return duplicateGroups;
}

/**
 * 修复重复扣币记录
 * 1. 删除重复的交易记录
 * 2. 补偿多扣的金币
 */
export function fixDuplicateTransactions(): {
  removedCount: number;
  compensatedGold: number;
  groups: DuplicateGroup[];
} {
  const duplicates = detectDuplicateTransactions();
  
  if (duplicates.length === 0) {
    return {
      removedCount: 0,
      compensatedGold: 0,
      groups: []
    };
  }
  
  const store = useGoldStore.getState();
  let removedCount = 0;
  let compensatedGold = 0;
  
  // 获取所有要删除的交易ID
  const idsToRemove = new Set<string>();
  
  duplicates.forEach(group => {
    // 保留第一条记录，删除其余的
    for (let i = 1; i < group.transactions.length; i++) {
      idsToRemove.add(group.transactions[i].id);
      compensatedGold += group.amount;
      removedCount++;
    }
  });
  
  // 过滤掉重复的交易记录
  const newTransactions = store.transactions.filter(
    t => !idsToRemove.has(t.id)
  );
  
  // 更新store
  useGoldStore.setState({
    transactions: newTransactions,
    balance: store.balance + compensatedGold
  });
  
  // 添加一条补偿记录
  if (compensatedGold > 0) {
    store.addGold(
      compensatedGold,
      `系统补偿：修复重复扣币记录（${removedCount}条）`,
      'system',
      '系统补偿'
    );
  }
  
  console.log(`✅ 修复完成：删除${removedCount}条重复记录，补偿${compensatedGold}金币`);
  
  return {
    removedCount,
    compensatedGold,
    groups: duplicates
  };
}

/**
 * 生成修复报告
 */
export function generateFixReport(groups: DuplicateGroup[]): string {
  if (groups.length === 0) {
    return '✅ 未发现重复扣币记录';
  }
  
  let report = `🔍 发现 ${groups.length} 组重复扣币记录：\n\n`;
  
  groups.forEach((group, index) => {
    report += `${index + 1}. ${group.taskTitle || '未知任务'}\n`;
    report += `   原因：${group.reason}\n`;
    report += `   金额：-${group.amount} 金币\n`;
    report += `   重复次数：${group.count} 次\n`;
    report += `   时间：${new Date(group.transactions[0].timestamp).toLocaleString('zh-CN')}\n`;
    report += `   应补偿：${group.amount * (group.count - 1)} 金币\n\n`;
  });
  
  const totalCompensation = groups.reduce(
    (sum, g) => sum + g.amount * (g.count - 1),
    0
  );
  
  report += `💰 总计应补偿：${totalCompensation} 金币`;
  
  return report;
}

