// ============================================
// 设备唯一标识服务
// ============================================

/**
 * 设备信息接口
 */
export interface DeviceIdentity {
  deviceId: string; // 设备唯一ID
  deviceName: string; // 设备名称（可自定义）
  deviceType: 'mobile' | 'desktop'; // 设备类型
  browser: string; // 浏览器类型
  avatar: string; // 默认头像（Emoji）
  createdAt: string; // 创建时间
  lastAccessAt: string; // 最后访问时间
}

/**
 * 设备唯一标识服务
 * 
 * 核心功能：
 * 1. 为每个设备生成唯一且永久的标识
 * 2. 标识基于浏览器指纹，确保同一设备同一浏览器的ID不变
 * 3. 不同设备或不同浏览器会生成不同的ID
 */
export class DeviceIdentityService {
  private static readonly STORAGE_KEY = 'device_identity';
  private static readonly AVATAR_POOL = [
    '🦊', '🐱', '🐶', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸',
    '🐵', '🐔', '🐧', '🐦', '🦄', '🦋', '🐝', '🐢', '🦖', '🦕',
    '🌸', '🌺', '🌻', '🌷', '🌹', '🍀', '🌿', '🍁', '🍂', '🌾',
    '⭐', '🌟', '✨', '💫', '🌙', '☀️', '🌈', '🔥', '💧', '⚡',
  ];

  /**
   * 获取或创建设备标识
   * 如果设备已有标识，直接返回；否则创建新标识
   */
  static getOrCreateDeviceIdentity(): DeviceIdentity {
    // 尝试从 localStorage 读取现有标识
    const existing = this.loadFromStorage();
    
    if (existing) {
      // 更新最后访问时间
      existing.lastAccessAt = new Date().toISOString();
      this.saveToStorage(existing);
      console.log('✅ 设备标识已存在:', existing.deviceId);
      return existing;
    }
    
    // 创建新标识
    const newIdentity = this.createNewIdentity();
    this.saveToStorage(newIdentity);
    console.log('🆕 创建新设备标识:', newIdentity.deviceId);
    return newIdentity;
  }

  /**
   * 创建新的设备标识
   */
  private static createNewIdentity(): DeviceIdentity {
    const deviceId = this.generateDeviceId();
    const deviceType = this.detectDeviceType();
    const browser = this.detectBrowser();
    const avatar = this.getRandomAvatar();
    const deviceName = this.generateDefaultName(deviceType, browser);
    
    return {
      deviceId,
      deviceName,
      deviceType,
      browser,
      avatar,
      createdAt: new Date().toISOString(),
      lastAccessAt: new Date().toISOString(),
    };
  }

  /**
   * 生成设备唯一ID
   * 基于浏览器指纹，确保同一设备同一浏览器的ID永久不变
   */
  private static generateDeviceId(): string {
    // 收集浏览器指纹信息
    const fingerprint = this.collectBrowserFingerprint();
    
    // 使用简单的哈希算法生成ID
    const hash = this.simpleHash(fingerprint);
    
    // 格式化为易读的ID（如：DEVICE-A1B2C3D4）
    return `DEVICE-${hash.toUpperCase()}`;
  }

  /**
   * 收集浏览器指纹信息
   */
  private static collectBrowserFingerprint(): string {
    const parts: string[] = [];
    
    // 1. User Agent
    parts.push(navigator.userAgent);
    
    // 2. 屏幕分辨率
    parts.push(`${screen.width}x${screen.height}`);
    parts.push(`${screen.colorDepth}`);
    
    // 3. 时区
    parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // 4. 语言
    parts.push(navigator.language);
    
    // 5. 平台
    parts.push(navigator.platform);
    
    // 6. 硬件并发数
    parts.push(String(navigator.hardwareConcurrency || 0));
    
    // 7. 设备内存（如果可用）
    if ('deviceMemory' in navigator) {
      parts.push(String((navigator as any).deviceMemory));
    }
    
    // 8. Canvas 指纹（简化版）
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device Fingerprint', 2, 2);
        parts.push(canvas.toDataURL().slice(0, 100));
      }
    } catch (e) {
      // Canvas 指纹可能被阻止
    }
    
    return parts.join('|');
  }

  /**
   * 简单哈希算法
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // 转换为8位十六进制字符串
    return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8);
  }

  /**
   * 检测设备类型
   */
  private static detectDeviceType(): 'mobile' | 'desktop' {
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    return isMobile ? 'mobile' : 'desktop';
  }

  /**
   * 检测浏览器类型
   */
  private static detectBrowser(): string {
    const ua = navigator.userAgent;
    
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    
    return 'Unknown';
  }

  /**
   * 获取随机头像
   */
  private static getRandomAvatar(): string {
    const index = Math.floor(Math.random() * this.AVATAR_POOL.length);
    return this.AVATAR_POOL[index];
  }

  /**
   * 生成默认设备名称
   */
  private static generateDefaultName(deviceType: string, browser: string): string {
    const typeLabel = deviceType === 'mobile' ? '手机' : '电脑';
    return `我的${typeLabel} (${browser})`;
  }

  /**
   * 从 localStorage 加载设备标识
   */
  private static loadFromStorage(): DeviceIdentity | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;
      
      const identity = JSON.parse(data) as DeviceIdentity;
      
      // 验证数据完整性
      if (!identity.deviceId || !identity.deviceName) {
        console.warn('⚠️ 设备标识数据不完整，将重新创建');
        return null;
      }
      
      return identity;
    } catch (error) {
      console.error('❌ 读取设备标识失败:', error);
      return null;
    }
  }

  /**
   * 保存设备标识到 localStorage
   */
  private static saveToStorage(identity: DeviceIdentity): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(identity));
    } catch (error) {
      console.error('❌ 保存设备标识失败:', error);
    }
  }

  /**
   * 更新设备名称
   */
  static updateDeviceName(newName: string): void {
    const identity = this.loadFromStorage();
    if (!identity) {
      console.error('❌ 设备标识不存在');
      return;
    }
    
    identity.deviceName = newName;
    identity.lastAccessAt = new Date().toISOString();
    this.saveToStorage(identity);
    console.log('✅ 设备名称已更新:', newName);
  }

  /**
   * 更新设备头像
   */
  static updateDeviceAvatar(newAvatar: string): void {
    const identity = this.loadFromStorage();
    if (!identity) {
      console.error('❌ 设备标识不存在');
      return;
    }
    
    identity.avatar = newAvatar;
    identity.lastAccessAt = new Date().toISOString();
    this.saveToStorage(identity);
    console.log('✅ 设备头像已更新:', newAvatar);
  }

  /**
   * 获取当前设备标识
   */
  static getCurrentIdentity(): DeviceIdentity | null {
    return this.loadFromStorage();
  }

  /**
   * 清除设备标识（仅用于测试或用户主动清除）
   */
  static clearDeviceIdentity(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ 设备标识已清除');
    } catch (error) {
      console.error('❌ 清除设备标识失败:', error);
    }
  }

  /**
   * 获取所有可用头像
   */
  static getAvatarPool(): string[] {
    return [...this.AVATAR_POOL];
  }
}






