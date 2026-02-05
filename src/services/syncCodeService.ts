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
      console.log('🔗 [1/5] 开始加入同步码:', syncCode);
      
      // 查找同步组
      console.log('🔗 [2/5] 查询同步组...');
      const { data: group, error: groupError } = await supabase
        .from('sync_groups')
        .select('*')
        .eq('sync_code', syncCode)
        .maybeSingle();
      
      console.log('查询结果:', { group, groupError });
      
      if (groupError) {
        console.error('❌ 查询同步组失败:', groupError);
        throw new Error('查询失败: ' + groupError.message);
      }
      
      if (!group) {
        console.error('❌ 同步码不存在');
        throw new Error('同步码不存在，请检查是否输入正确');
      }
      
      console.log('✅ 找到同步组:', group.id);
      
      // 将当前设备加入同步组
      const deviceId = getDeviceId();
      const deviceName = getDeviceName();
      
      console.log('🔗 [3/5] 设备信息:', { deviceId, deviceName, groupId: group.id });
      
      // 先检查设备是否已加入其他同步组
      console.log('🔗 [4/5] 检查设备是否已存在...');
      const { data: existingDevice, error: checkError } = await supabase
        .from('sync_devices')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();
      
      console.log('设备检查结果:', { existingDevice, checkError });
      
      if (checkError) {
        console.error('❌ 检查设备失败:', checkError);
        throw new Error('检查设备失败: ' + checkError.message);
      }
      
      if (existingDevice) {
        console.log('🔗 [5/5] 设备已存在，更新同步组...');
        const { error: updateError } = await supabase
          .from('sync_devices')
          .update({ 
            sync_group_id: group.id,
            device_name: deviceName,
            last_active_at: new Date().toISOString(),
          })
          .eq('device_id', deviceId);
        
        if (updateError) {
          console.error('❌ 更新设备失败:', updateError);
          throw new Error('更新设备失败: ' + updateError.message);
        }
        console.log('✅ 设备更新成功');
      } else {
        console.log('🔗 [5/5] 新设备，插入记录...');
        const { error: insertError } = await supabase
          .from('sync_devices')
          .insert({
            sync_group_id: group.id,
            device_id: deviceId,
            device_name: deviceName,
          });
        
        if (insertError) {
          console.error('❌ 插入设备失败:', insertError);
          throw new Error('插入设备失败: ' + insertError.message);
        }
        console.log('✅ 设备插入成功');
      }
      
      // 保存同步码到本地
      localStorage.setItem('sync_code', syncCode);
      localStorage.setItem('sync_group_id', group.id);
      
      console.log('✅ 加入同步组成功！');
      return true;
      
    } catch (error: any) {
      console.error('❌ 加入同步码失败:', error);
      throw new Error(error.message || '加入失败，请重试');
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

