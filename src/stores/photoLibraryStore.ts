import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  
  // 文件夹操作
  createFolder: (name: string, emoji: string) => string;
  deleteFolder: (folderId: string) => void;
  updateFolder: (folderId: string, name: string, emoji: string) => void;
  
  // 照片操作
  addPhoto: (imageUrl: string, keywords: string[], folderId: string) => void;
  deletePhoto: (photoId: string) => void;
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
      
      deleteFolder: (folderId: string) => {
        if (folderId === 'default') {
          alert('默认文件夹不能删除');
          return;
        }
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== folderId),
          photos: state.photos.filter((p) => p.folderId !== folderId),
        }));
      },
      
      updateFolder: (folderId: string, name: string, emoji: string) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId ? { ...f, name, emoji } : f
          ),
        }));
      },
      
      addPhoto: (imageUrl: string, keywords: string[], folderId: string) => {
        const newPhoto: Photo = {
          id: `photo_${Date.now()}`,
          imageUrl,
          keywords,
          timestamp: Date.now(),
          folderId,
        };
        set((state) => ({
          photos: [...state.photos, newPhoto],
        }));
      },
      
      deletePhoto: (photoId: string) => {
        set((state) => ({
          photos: state.photos.filter((p) => p.id !== photoId),
        }));
      },
      
      getPhotosByFolder: (folderId: string) => {
        return get().photos.filter((p) => p.folderId === folderId);
      },
    }),
    {
      name: 'photo-library-storage',
    }
  )
);

