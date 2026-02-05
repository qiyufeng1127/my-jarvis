import { supabase } from '@/lib/supabase';

// 生成设备唯一ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// 获取设备名称
const getDeviceName = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'iPhone/iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  return '未知设备';
};

export const syncCodeService = {
  // 1. 生成同步码
  async generateSyncCode(): Promise<string> {
    try {
      console.log('🔑 生成同步码...');
      
      // 调用数据库函数生成同步码
      const { data, error } = await supabase.rpc('generate_sync_code');
      
      if (error) throw error;
      
      const syncCode = data as string;
      
      // 创建同步组
      const { data: group, error: groupError } = await supabase
        .from('sync_groups')
        .insert({ sync_code: syncCode })
        .select()
        .single();
      
      if (groupError) throw groupError;
      
      // 将当前设备加入同步组
      const deviceId = getDeviceId();
      const deviceName = getDeviceName();
      
      await supabase.from('sync_devices').insert({
        sync_group_id: group.id,
        device_id: deviceId,
        device_name: deviceName,
      });
      
      // 保存同步码到本地
      localStorage.setItem('sync_code', syncCode);
      localStorage.setItem('sync_group_id', group.id);
      
      console.log('✅ 同步码生成成功:', syncCode);
      return syncCode;
      
    } catch (error) {
      console.error('❌ 生成同步码失败:', error);
      throw error;
    }
  },

  // 2. 加入同步码
  async joinSyncCode(syncCode: string): Promise<boolean> {
    try {
      console.log('🔗 加入同步码:', syncCode);
      
      // 查找同步组
      const { data: group, error: groupError } = await supabase
        .from('sync_groups')
        .select('*')
        .eq('sync_code', syncCode)
        .single();
      
      if (groupError || !group) {
        throw new Error('同步码不存在');
      }
      
      // 将当前设备加入同步组
      const deviceId = getDeviceId();
      const deviceName = getDeviceName();
      
      // 先检查设备是否已加入
      const { data: existingDevice } = await supabase
        .from('sync_devices')
        .select('*')
        .eq('device_id', deviceId)
        .single();
      
      if (existingDevice) {
        // 更新设备的同步组
        await supabase
          .from('sync_devices')
          .update({ 
            sync_group_id: group.id,
            last_active_at: new Date().toISOString(),
          })
          .eq('device_id', deviceId);
      } else {
        // 新增设备
        await supabase.from('sync_devices').insert({
          sync_group_id: group.id,
          device_id: deviceId,
          device_name: deviceName,
        });
      }
      
      // 保存同步码到本地
      localStorage.setItem('sync_code', syncCode);
      localStorage.setItem('sync_group_id', group.id);
      
      console.log('✅ 加入同步组成功');
      return true;
      
    } catch (error) {
      console.error('❌ 加入同步码失败:', error);
      throw error;
    }
  },

  // 3. 获取当前同步码
  getCurrentSyncCode(): string | null {
    return localStorage.getItem('sync_code');
  },

  // 4. 获取同步组ID
  getSyncGroupId(): string | null {
    return localStorage.getItem('sync_group_id');
  },

  // 5. 检查是否已加入同步组
  isInSyncGroup(): boolean {
    return !!this.getSyncGroupId();
  },

  // 6. 退出同步组
  async leaveSyncGroup(): Promise<void> {
    try {
      const deviceId = getDeviceId();
      
      // 从数据库删除设备
      await supabase
        .from('sync_devices')
        .delete()
        .eq('device_id', deviceId);
      
      // 清除本地存储
      localStorage.removeItem('sync_code');
      localStorage.removeItem('sync_group_id');
      
      console.log('✅ 已退出同步组');
      
    } catch (error) {
      console.error('❌ 退出同步组失败:', error);
      throw error;
    }
  },

  // 7. 上传数据到同步组
  async uploadData(dataType: string, dataId: string, dataContent: any): Promise<void> {
    const syncGroupId = this.getSyncGroupId();
    if (!syncGroupId) return;

    try {
      await supabase
        .from('sync_data')
        .upsert({
          sync_group_id: syncGroupId,
          data_type: dataType,
          data_id: dataId,
          data_content: dataContent,
        }, {
          onConflict: 'sync_group_id,data_type,data_id'
        });
      
      console.log(`📤 上传数据: ${dataType}/${dataId}`);
      
    } catch (error) {
      console.error('❌ 上传数据失败:', error);
    }
  },

  // 8. 下载同步组的所有数据
  async downloadAllData(): Promise<Record<string, any[]>> {
    const syncGroupId = this.getSyncGroupId();
    if (!syncGroupId) return {};

    try {
      console.log('📥 下载同步数据...');
      
      const { data, error } = await supabase
        .from('sync_data')
        .select('*')
        .eq('sync_group_id', syncGroupId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // 按数据类型分组
      const grouped: Record<string, any[]> = {};
      
      data?.forEach((item) => {
        if (!grouped[item.data_type]) {
          grouped[item.data_type] = [];
        }
        grouped[item.data_type].push({
          id: item.data_id,
          ...item.data_content,
        });
      });
      
      console.log('✅ 下载完成:', Object.keys(grouped).length, '种数据类型');
      return grouped;
      
    } catch (error) {
      console.error('❌ 下载数据失败:', error);
      return {};
    }
  },

  // 9. 获取同步组的设备列表
  async getDevices(): Promise<any[]> {
    const syncGroupId = this.getSyncGroupId();
    if (!syncGroupId) return [];

    try {
      const { data, error } = await supabase
        .from('sync_devices')
        .select('*')
        .eq('sync_group_id', syncGroupId)
        .order('last_active_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      console.error('❌ 获取设备列表失败:', error);
      return [];
    }
  },

  // 10. 更新设备活跃时间
  async updateDeviceActivity(): Promise<void> {
    const deviceId = getDeviceId();
    
    try {
      await supabase
        .from('sync_devices')
        .update({ last_active_at: new Date().toISOString() })
        .eq('device_id', deviceId);
    } catch (error) {
      console.error('❌ 更新设备活跃时间失败:', error);
    }
  },
};

