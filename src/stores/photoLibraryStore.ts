import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { photoStorage } from '@/utils/photoStorage';

export interface Photo {
  id: string;
  imageUrl: string; // base64 或 blob URL
  keywords: string[];
  timestamp: number;
  folderId: string;
}

export interface PhotoFolder {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

interface PhotoLibraryState {
  folders: PhotoFolder[];
  photos: Photo[];
  isLoaded: boolean;
  
  // 初始化
  loadPhotos: () => Promise<void>;
  
  // 文件夹操作
  createFolder: (name: string, emoji: string) => string;
  deleteFolder: (folderId: string) => Promise<void>;
  updateFolder: (folderId: string, name: string, emoji: string) => void;
  
  // 照片操作
  addPhoto: (imageUrl: string, keywords: string[], folderId: string) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  getPhotosByFolder: (folderId: string) => Photo[];
}

export const usePhotoLibraryStore = create<PhotoLibraryState>()(
  persist(
    (set, get) => ({
      folders: [
        {
          id: 'default',
          name: '默认文件夹',
          emoji: '📁',
          createdAt: Date.now(),
        },
      ],
      photos: [],
      isLoaded: false,
      
      loadPhotos: async () => {
        try {
          const photos = await photoStorage.getAllPhotos();
          set({ photos, isLoaded: true });
        } catch (error) {
          console.error('加载照片失败:', error);
          set({ isLoaded: true });
        }
      },
      
      createFolder: (name: string, emoji: string) => {
        const newFolder: PhotoFolder = {
          id: `folder_${Date.now()}`,
          name,
          emoji,
          createdAt: Date.now(),
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
        return newFolder.id;
      },
      
      deleteFolder: async (folderId: string) => {
        if (folderId === 'default') {
          alert('默认文件夹不能删除');
          return;
        }
        
        try {
          // 删除IndexedDB中的照片
          await photoStorage.deletePhotosByFolder(folderId);
          
          // 更新状态
          set((state) => ({
            folders: state.folders.filter((f) => f.id !== folderId),
            photos: state.photos.filter((p) => p.folderId !== folderId),
          }));
        } catch (error) {
          console.error('删除文件夹失败:', error);
          alert('删除文件夹失败');
        }
      },
      
      updateFolder: (folderId: string, name: string, emoji: string) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId ? { ...f, name, emoji } : f
          ),
        }));
      },
      
      addPhoto: async (imageUrl: string, keywords: string[], folderId: string) => {
        const newPhoto: Photo = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          imageUrl,
          keywords,
          timestamp: Date.now(),
          folderId,
        };
        
        try {
          // 保存到IndexedDB
          await photoStorage.savePhoto(newPhoto);
          
          // 更新状态
          set((state) => ({
            photos: [...state.photos, newPhoto],
          }));
        } catch (error) {
          console.error('保存照片失败:', error);
          alert('保存照片失败，可能是存储空间不足');
        }
      },
      
      deletePhoto: async (photoId: string) => {
        try {
          // 从IndexedDB删除
          await photoStorage.deletePhoto(photoId);
          
          // 更新状态
          set((state) => ({
            photos: state.photos.filter((p) => p.id !== photoId),
          }));
        } catch (error) {
          console.error('删除照片失败:', error);
          alert('删除照片失败');
        }
      },
      
      getPhotosByFolder: (folderId: string) => {
        return get().photos.filter((p) => p.folderId === folderId);
      },
    }),
    {
      name: 'photo-library-storage',
      // 只持久化文件夹信息，照片存在IndexedDB中
      partialize: (state) => ({ 
        folders: state.folders,
        photos: [], // 不在localStorage中存储照片
        isLoaded: false,
      }),
    }
  )
);

