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
 * 修复图片旋转
 * @param file 原始图片文件
 * @returns 修复后的 Blob
 */
export async function fixImageOrientation(file: File): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. 获取 EXIF 旋转信息
      const orientation = await getOrientation(file);
      
      // 2. 如果方向正常，直接返回
      if (orientation === 1) {
        resolve(file);
        return;
      }
      
      // 3. 读取图片
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('无法创建 Canvas 上下文'));
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
                resolve(blob);
              } else {
                reject(new Error('无法生成图片 Blob'));
              }
            },
            'image/jpeg',
            0.9
          );
        };
        
        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };
        
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

