import { supabase, TABLES } from './client';
import type { GoldTransaction, TransactionType } from '@/types';

/**
 * 获取用户金币余额
 */
export async function getGoldBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from(TABLES.GOLD_TRANSACTIONS)
      .select('balance_after')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return 0; // 没有交易记录
      throw error;
    }

    return data.balance_after;
  } catch (error) {
    console.error('获取金币余额失败:', error);
    return 0;
  }
}

/**
 * 创建金币交易
 */
export async function createGoldTransaction(
  userId: string,
  amount: number,
  type: TransactionType,
  category: string,
  description: string,
  relatedTaskId?: string,
  relatedHabitId?: string
): Promise<GoldTransaction> {
  try {
    // 获取当前余额
    const currentBalance = await getGoldBalance(userId);
    const newBalance = currentBalance + amount;

    // 创建交易记录
    const { data, error } = await supabase
      .from(TABLES.GOLD_TRANSACTIONS)
      .insert({
        user_id: userId,
        amount,
        transaction_type: type,
        category,
        description,
        balance_after: newBalance,
        related_task_id: relatedTaskId,
        related_habit_id: relatedHabitId,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      amount: data.amount,
      transactionType: data.transaction_type,
      category: data.category,
      description: data.description,
      balanceAfter: data.balance_after,
      relatedTaskId: data.related_task_id,
      relatedHabitId: data.related_habit_id,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error('创建金币交易失败:', error);
    throw error;
  }
}

/**
 * 获取金币交易历史
 */
export async function getGoldTransactions(
  userId: string,
  limit: number = 50
): Promise<GoldTransaction[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.GOLD_TRANSACTIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      amount: item.amount,
      transactionType: item.transaction_type,
      category: item.category,
      description: item.description,
      balanceAfter: item.balance_after,
      relatedTaskId: item.related_task_id,
      relatedHabitId: item.related_habit_id,
      metadata: item.metadata || {},
      createdAt: new Date(item.created_at),
    }));
  } catch (error) {
    console.error('获取金币交易历史失败:', error);
    throw error;
  }
}

/**
 * 获取指定时间段的金币统计
 */
export async function getGoldStats(userId: string, startDate: Date, endDate: Date) {
  try {
    const { data, error } = await supabase
      .from(TABLES.GOLD_TRANSACTIONS)
      .select('amount, transaction_type')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const stats = {
      earned: data
        .filter((t) => t.transaction_type === 'earn' || t.transaction_type === 'bonus')
        .reduce((sum, t) => sum + t.amount, 0),
      spent: data
        .filter((t) => t.transaction_type === 'spend')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      penalty: data
        .filter((t) => t.transaction_type === 'penalty')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    };

    return stats;
  } catch (error) {
    console.error('获取金币统计失败:', error);
    throw error;
  }
}

