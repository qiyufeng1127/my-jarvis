/**
 * 修复手机拍照图片的 EXIF 旋转问题
 * PWA 手机拍照时，图片可能带有 EXIF 旋转信息，导致识别失败
 */

/**
 * 从文件中读取 EXIF 旋转信息
 */
function getOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(1); // 不是 JPEG，返回默认方向
        return;
      }
      
      const length = view.byteLength;
      let offset = 2;
      
      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) {
          resolve(1);
          return;
        }
        const marker = view.getUint16(offset, false);
        offset += 2;
        
        if (marker === 0xFFE1) {
          const little = view.getUint16(offset + 8, false) === 0x4949;
          offset += view.getUint16(offset, false);
          const tags = view.getUint16(offset, little);
          offset += 2;
          
          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + (i * 12), little) === 0x0112) {
              resolve(view.getUint16(offset + (i * 12) + 8, little));
              return;
            }
          }
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }
      resolve(1);
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 修复图片旋转（带超时保护）
 * @param file 原始图片文件
 * @returns 修复后的 Blob
 */
export async function fixImageOrientation(file: File): Promise<Blob> {
  // 🔥 添加5秒超时保护，超时直接返回原文件
  const timeoutPromise = new Promise<Blob>((resolve) => {
    setTimeout(() => {
      console.warn('⚠️ 图片旋转处理超时，使用原文件');
      resolve(file);
    }, 5000);
  });

  const processPromise = new Promise<Blob>(async (resolve, reject) => {
    try {
      console.log('🔄 开始处理图片旋转');
      
      // 1. 获取 EXIF 旋转信息（带超时）
      const orientationPromise = getOrientation(file);
      const orientationTimeout = new Promise<number>((resolve) => {
        setTimeout(() => resolve(1), 2000);
      });
      
      const orientation = await Promise.race([orientationPromise, orientationTimeout]);
      console.log('📐 图片方向:', orientation);
      
      // 2. 如果方向正常，直接返回
      if (orientation === 1) {
        console.log('✅ 图片方向正常，无需处理');
        resolve(file);
        return;
      }
      
      console.log('🔧 需要旋转图片，方向值:', orientation);
      
      // 3. 读取图片
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            console.log('🖼️ 图片加载完成，开始旋转');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              console.error('❌ 无法创建Canvas');
              resolve(file); // 失败时返回原文件
              return;
            }
            
            // 4. 根据旋转信息设置 canvas 尺寸
            if (orientation > 4 && orientation < 9) {
              canvas.width = img.height;
              canvas.height = img.width;
            } else {
              canvas.width = img.width;
              canvas.height = img.height;
            }
            
            // 5. 应用旋转变换
            switch (orientation) {
              case 2:
                ctx.transform(-1, 0, 0, 1, img.width, 0);
                break;
              case 3:
                ctx.transform(-1, 0, 0, -1, img.width, img.height);
                break;
              case 4:
                ctx.transform(1, 0, 0, -1, 0, img.height);
                break;
              case 5:
                ctx.transform(0, 1, 1, 0, 0, 0);
                break;
              case 6:
                ctx.transform(0, 1, -1, 0, img.height, 0);
                break;
              case 7:
                ctx.transform(0, -1, -1, 0, img.height, img.width);
                break;
              case 8:
                ctx.transform(0, -1, 1, 0, 0, img.width);
                break;
              default:
                break;
            }
            
            // 6. 绘制图片
            ctx.drawImage(img, 0, 0);
            
            // 7. 转换为 Blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  console.log('✅ 图片旋转完成');
                  resolve(blob);
                } else {
                  console.error('❌ 无法生成Blob');
                  resolve(file); // 失败时返回原文件
                }
              },
              'image/jpeg',
              0.9
            );
          } catch (error) {
            console.error('❌ 旋转处理异常:', error);
            resolve(file); // 失败时返回原文件
          }
        };
        
        img.onerror = () => {
          console.error('❌ 图片加载失败');
          resolve(file); // 失败时返回原文件
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        console.error('❌ 文件读取失败');
        resolve(file); // 失败时返回原文件
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ 图片处理异常:', error);
      resolve(file); // 失败时返回原文件
    }
  });

  // 使用 Promise.race 实现超时保护
  return Promise.race([processPromise, timeoutPromise]);
}

