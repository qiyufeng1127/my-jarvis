/**
 * 每日成本检查服务
 * 在应用启动时自动检查并扣除每日生存成本
 */

import { useDriveStore } from '@/stores/driveStore';
import { useGoldStore } from '@/stores/goldStore';

class DailyCostService {
  private hasCheckedToday = false;

  /**
   * 检查并扣除每日成本
   */
  async checkDailyCost(): Promise<{ deducted: number; isBankrupt: boolean }> {
    // 防止重复检查
    if (this.hasCheckedToday) {
      return { deducted: 0, isBankrupt: false };
    }

    const driveStore = useDriveStore.getState();
    const goldStore = useGoldStore.getState();

    console.log('🔍 检查每日生存成本...');

    // 检查并扣除
    const deducted = await driveStore.checkAndDeductDailyCost();

    // 标记今天已检查
    this.hasCheckedToday = true;

    // 检查是否破产
    const isBankrupt = driveStore.dailyCost.isBankrupt;

    if (isBankrupt) {
      console.log('💸 破产！金币余额不足，需要完成紧急任务');
      return { deducted, isBankrupt: true };
    }

    if (deducted > 0) {
      console.log(`💸 已扣除每日生存成本: ${deducted} 金币，当前余额: ${goldStore.balance}`);
    }

    return { deducted, isBankrupt: false };
  }

  /**
   * 重置检查状态（用于测试）
   */
  resetCheckStatus() {
    this.hasCheckedToday = false;
  }

  /**
   * 检查连胜状态
   */
  checkWinStreak() {
    const driveStore = useDriveStore.getState();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 如果昨天没有完成任务，且今天也不是连胜日期，则中断连胜
    if (
      driveStore.winStreak.lastCompletedDate !== today &&
      driveStore.winStreak.lastCompletedDate !== yesterdayStr &&
      driveStore.winStreak.currentStreak > 0
    ) {
      console.log('💔 连胜已中断（昨天未完成任务）');
      driveStore.breakWinStreak();
    }
  }

  /**
   * 启动定时检查
   */
  startPeriodicCheck() {
    // 每小时检查一次
    setInterval(() => {
      this.checkDailyCost();
      this.checkWinStreak();
    }, 60 * 60 * 1000); // 1小时
  }
}

export const dailyCostService = new DailyCostService();

