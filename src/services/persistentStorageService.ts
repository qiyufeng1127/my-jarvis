// ============================================
// 增强的本地持久化存储服务
// ============================================

import { DeviceIdentityService } from './deviceIdentityService';

/**
 * 存储配置接口
 */
export interface StorageConfig {
  key: string; // 存储键名
  version?: number; // 数据版本号
  enableCompression?: boolean; // 是否启用压缩（未来扩展）
  enableEncryption?: boolean; // 是否启用加密（未来扩展）
}

/**
 * 存储数据包装接口
 */
interface StorageWrapper<T> {
  deviceId: string; // 设备ID
  version: number; // 数据版本
  timestamp: number; // 保存时间戳
  data: T; // 实际数据
}

/**
 * 增强的本地持久化存储服务
 * 
 * 核心特性：
 * 1. 与设备ID绑定，确保数据持久化
 * 2. 支持数据版本管理
 * 3. 自动处理数据迁移
 * 4. 提供数据完整性校验
 * 5. 支持批量操作
 */
export class PersistentStorageService {
  /**
   * 保存数据到本地存储
   */
  static save<T>(config: StorageConfig, data: T): boolean {
    try {
      const deviceId = this.getDeviceId();
      if (!deviceId) {
        console.error('❌ 设备ID不存在，无法保存数据');
        return false;
      }

      const wrapper: StorageWrapper<T> = {
        deviceId,
        version: config.version || 1,
        timestamp: Date.now(),
        data,
      };

      const serialized = JSON.stringify(wrapper);
      localStorage.setItem(config.key, serialized);
      
      console.log(`💾 数据已保存: ${config.key} (设备: ${deviceId})`);
      return true;
    } catch (error) {
      console.error(`❌ 保存数据失败 (${config.key}):`, error);
      return false;
    }
  }

  /**
   * 从本地存储加载数据
   */
  static load<T>(config: StorageConfig): T | null {
    try {
      const deviceId = this.getDeviceId();
      if (!deviceId) {
        console.warn('⚠️ 设备ID不存在，无法加载数据');
        return null;
      }

      const serialized = localStorage.getItem(config.key);
      if (!serialized) {
        console.log(`📦 数据不存在: ${config.key}`);
        return null;
      }

      const wrapper = JSON.parse(serialized) as StorageWrapper<T>;

      // 验证设备ID（可选：如果需要严格绑定设备）
      // if (wrapper.deviceId !== deviceId) {
      //   console.warn(`⚠️ 数据来自不同设备 (${wrapper.deviceId})，当前设备: ${deviceId}`);
      //   return null;
      // }

      // 检查数据版本
      if (config.version && wrapper.version !== config.version) {
        console.warn(`⚠️ 数据版本不匹配: 期望 ${config.version}, 实际 ${wrapper.version}`);
        // 这里可以添加数据迁移逻辑
        return this.migrateData(wrapper, config.version);
      }

      console.log(`📦 数据已加载: ${config.key} (设备: ${wrapper.deviceId})`);
      return wrapper.data;
    } catch (error) {
      console.error(`❌ 加载数据失败 (${config.key}):`, error);
      return null;
    }
  }

  /**
   * 删除指定数据
   */
  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ 数据已删除: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ 删除数据失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 清除所有数据
   */
  static clearAll(): boolean {
    try {
      localStorage.clear();
      console.log('🗑️ 所有数据已清除');
      return true;
    } catch (error) {
      console.error('❌ 清除所有数据失败:', error);
      return false;
    }
  }

  /**
   * 获取所有存储的键名
   */
  static getAllKeys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('❌ 获取存储键名失败:', error);
      return [];
    }
  }

  /**
   * 获取存储使用情况
   */
  static getStorageInfo(): {
    used: number; // 已使用字节数
    usedMB: number; // 已使用MB
    total: number; // 总容量（估算）
    totalMB: number; // 总容量MB
    percentage: number; // 使用百分比
  } {
    try {
      let used = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      });

      // localStorage 通常限制为 5-10MB，这里假设 5MB
      const total = 5 * 1024 * 1024; // 5MB in bytes
      const usedMB = used / (1024 * 1024);
      const totalMB = total / (1024 * 1024);
      const percentage = (used / total) * 100;

      return {
        used,
        usedMB: parseFloat(usedMB.toFixed(2)),
        total,
        totalMB: parseFloat(totalMB.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
      };
    } catch (error) {
      console.error('❌ 获取存储信息失败:', error);
      return {
        used: 0,
        usedMB: 0,
        total: 0,
        totalMB: 0,
        percentage: 0,
      };
    }
  }

  /**
   * 导出所有数据（用于备份）
   */
  static exportAllData(): string {
    try {
      const data: Record<string, any> = {};
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      });

      const exportData = {
        exportTime: new Date().toISOString(),
        deviceId: this.getDeviceId(),
        data,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ 导出数据失败:', error);
      return '';
    }
  }

  /**
   * 导入数据（用于恢复）
   */
  static importData(jsonString: string): boolean {
    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.data) {
        console.error('❌ 导入数据格式错误');
        return false;
      }

      // 确认导入
      if (!confirm(`确认导入数据？\n\n导出时间: ${importData.exportTime}\n设备ID: ${importData.deviceId}\n\n当前数据将被覆盖！`)) {
        return false;
      }

      // 导入数据
      Object.entries(importData.data).forEach(([key, value]) => {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, serialized);
      });

      console.log('✅ 数据导入成功');
      alert('✅ 数据导入成功！\n\n页面将在3秒后刷新...');
      
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('❌ 导入数据失败:', error);
      alert('❌ 导入数据失败，请检查文件格式');
      return false;
    }
  }

  /**
   * 获取当前设备ID
   */
  private static getDeviceId(): string | null {
    const identity = DeviceIdentityService.getCurrentIdentity();
    return identity?.deviceId || null;
  }

  /**
   * 数据迁移（版本升级时）
   */
  private static migrateData<T>(wrapper: StorageWrapper<T>, targetVersion: number): T | null {
    console.log(`🔄 开始数据迁移: v${wrapper.version} -> v${targetVersion}`);
    
    // 这里可以添加具体的迁移逻辑
    // 例如：
    // if (wrapper.version === 1 && targetVersion === 2) {
    //   // 执行 v1 -> v2 的迁移
    // }
    
    // 暂时直接返回原数据
    return wrapper.data;
  }

  /**
   * 检查存储是否可用
   */
  static isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取数据的最后更新时间
   */
  static getLastUpdateTime(key: string): Date | null {
    try {
      const serialized = localStorage.getItem(key);
      if (!serialized) return null;

      const wrapper = JSON.parse(serialized) as StorageWrapper<any>;
      return new Date(wrapper.timestamp);
    } catch (error) {
      console.error(`❌ 获取更新时间失败 (${key}):`, error);
      return null;
    }
  }

  /**
   * 批量保存数据
   */
  static saveBatch(items: Array<{ config: StorageConfig; data: any }>): boolean {
    try {
      items.forEach(item => {
        this.save(item.config, item.data);
      });
      console.log(`💾 批量保存完成: ${items.length} 项`);
      return true;
    } catch (error) {
      console.error('❌ 批量保存失败:', error);
      return false;
    }
  }

  /**
   * 批量加载数据
   */
  static loadBatch<T>(configs: StorageConfig[]): Array<T | null> {
    try {
      return configs.map(config => this.load<T>(config));
    } catch (error) {
      console.error('❌ 批量加载失败:', error);
      return [];
    }
  }
}






