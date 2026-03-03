import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 头像集合
export interface AvatarCollection {
  id: string;
  title: string; // 例如："BLACKPINK"
  emoji: string; // 例如："💖"
  avatars: Array<{
    id: string;
    imageUrl: string;
    unlocked: boolean;
    requiredExp: number; // 解锁所需经验值
    unlockedAt?: Date;
  }>;
  collapsed: boolean; // 是否折叠
  createdAt: Date;
}

interface AvatarState {
  collections: AvatarCollection[];
  currentAvatarUrl: string | null;
  
  // Actions
  addCollection: (title: string, emoji: string, imageUrls: string[]) => void;
  removeCollection: (collectionId: string) => void;
  toggleCollapse: (collectionId: string) => void;
  unlockAvatar: (collectionId: string, avatarId: string) => void;
  setCurrentAvatar: (imageUrl: string) => void;
  checkAndUnlockAvatars: (currentExp: number) => void;
}

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set, get) => ({
      collections: [],
      currentAvatarUrl: null,
      
      // 添加新的头像集合
      addCollection: (title, emoji, imageUrls) => {
        const newCollection: AvatarCollection = {
          id: `collection-${Date.now()}`,
          title,
          emoji,
          avatars: imageUrls.map((url, index) => ({
            id: `avatar-${Date.now()}-${index}`,
            imageUrl: url,
            unlocked: index === 0, // 第一个默认解锁
            requiredExp: index === 0 ? 0 : 200 + index * 200, // 200, 400, 600, 800, 1000
          })),
          collapsed: false,
          createdAt: new Date(),
        };
        
        set((state) => ({
          collections: [...state.collections, newCollection],
        }));
      },
      
      // 删除集合
      removeCollection: (collectionId) => {
        set((state) => ({
          collections: state.collections.filter(c => c.id !== collectionId),
        }));
      },
      
      // 切换折叠状态
      toggleCollapse: (collectionId) => {
        set((state) => ({
          collections: state.collections.map(c =>
            c.id === collectionId ? { ...c, collapsed: !c.collapsed } : c
          ),
        }));
      },
      
      // 解锁头像
      unlockAvatar: (collectionId, avatarId) => {
        set((state) => ({
          collections: state.collections.map(c =>
            c.id === collectionId
              ? {
                  ...c,
                  avatars: c.avatars.map(a =>
                    a.id === avatarId
                      ? { ...a, unlocked: true, unlockedAt: new Date() }
                      : a
                  ),
                }
              : c
          ),
        }));
      },
      
      // 设置当前头像
      setCurrentAvatar: (imageUrl) => {
        set({ currentAvatarUrl: imageUrl });
      },
      
      // 检查并自动解锁头像（根据经验值）
      checkAndUnlockAvatars: (currentExp) => {
        set((state) => ({
          collections: state.collections.map(collection => ({
            ...collection,
            avatars: collection.avatars.map(avatar => {
              if (!avatar.unlocked && currentExp >= avatar.requiredExp) {
                return { ...avatar, unlocked: true, unlockedAt: new Date() };
              }
              return avatar;
            }),
          })),
        }));
      },
    }),
    {
      name: 'avatar-storage',
    }
  )
);

