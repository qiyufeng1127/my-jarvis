import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 宠物类型
export type PetType = 'cat' | 'dog' | 'rabbit' | 'hamster' | 'bird' | 'dragon';

// 宠物状态
export type PetStatus = 'happy' | 'normal' | 'hungry' | 'sad' | 'sick' | 'dead';

// 宠物数据
export interface Pet {
  id: string;
  name: string;
  type: PetType;
  emoji: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  hunger: number; // 0-100，0=饿死
  happiness: number; // 0-100
  health: number; // 0-100
  status: PetStatus;
  goldBonus: number; // 金币加成倍率（1.0 = 无加成，1.5 = 50%加成）
  lastFedTime: Date;
  lastPlayedTime: Date;
  createdAt: Date;
  deathTime?: Date;
}

// 食物类型
export interface Food {
  id: string;
  name: string;
  emoji: string;
  hungerRestore: number; // 恢复饥饿值
  happinessBonus: number; // 快乐值加成
  price: number; // 金币价格
}

// 玩具类型
export interface Toy {
  id: string;
  name: string;
  emoji: string;
  happinessBonus: number; // 快乐值加成
  price: number;
}

// 宠物商店物品
export interface ShopItem {
  id: string;
  type: 'pet' | 'food' | 'toy';
  name: string;
  emoji: string;
  description: string;
  price: number;
  data?: any;
}

interface PetState {
  currentPet: Pet | null;
  ownedPets: Pet[];
  foods: Food[];
  toys: Toy[];
  shopItems: ShopItem[];
  
  // Actions - 宠物管理
  adoptPet: (type: PetType, name: string) => boolean;
  switchPet: (petId: string) => void;
  deletePet: (petId: string) => void;
  
  // Actions - 宠物互动
  feedPet: (foodId: string) => boolean;
  playWithPet: (toyId?: string) => boolean;
  healPet: () => boolean;
  
  // Actions - 宠物状态更新
  updatePetStatus: () => void;
  gainExp: (amount: number) => void;
  
  // Actions - 商店
  buyItem: (itemId: string) => boolean;
  initializeShop: () => void;
  
  // Getters
  getPetStatus: (pet: Pet) => PetStatus;
  canAdoptPet: () => boolean;
}

// 预设食物
const DEFAULT_FOODS: Food[] = [
  { id: 'food_1', name: '普通食物', emoji: '🍖', hungerRestore: 30, happinessBonus: 5, price: 10 },
  { id: 'food_2', name: '美味食物', emoji: '🍗', hungerRestore: 50, happinessBonus: 10, price: 20 },
  { id: 'food_3', name: '豪华大餐', emoji: '🍱', hungerRestore: 80, happinessBonus: 20, price: 50 },
  { id: 'food_4', name: '零食', emoji: '🍪', hungerRestore: 10, happinessBonus: 15, price: 5 },
];

// 预设玩具
const DEFAULT_TOYS: Toy[] = [
  { id: 'toy_1', name: '小球', emoji: '⚽', happinessBonus: 10, price: 20 },
  { id: 'toy_2', name: '飞盘', emoji: '🥏', happinessBonus: 15, price: 30 },
  { id: 'toy_3', name: '玩具鼠', emoji: '🐭', happinessBonus: 20, price: 50 },
];

// 宠物类型配置
const PET_CONFIGS: Record<PetType, { emoji: string; name: string; price: number; goldBonus: number }> = {
  cat: { emoji: '🐱', name: '小猫', price: 1000, goldBonus: 1.1 },
  dog: { emoji: '🐶', name: '小狗', price: 1000, goldBonus: 1.1 },
  rabbit: { emoji: '🐰', name: '兔子', price: 800, goldBonus: 1.05 },
  hamster: { emoji: '🐹', name: '仓鼠', price: 500, goldBonus: 1.05 },
  bird: { emoji: '🐦', name: '小鸟', price: 600, goldBonus: 1.08 },
  dragon: { emoji: '🐉', name: '神龙', price: 5000, goldBonus: 1.5 },
};

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      currentPet: null,
      ownedPets: [],
      foods: DEFAULT_FOODS,
      toys: DEFAULT_TOYS,
      shopItems: [],
      
      // 领养宠物
      adoptPet: (type, name) => {
        const config = PET_CONFIGS[type];
        
        // 检查金币是否足够
        const { useGoldStore } = require('@/stores/goldStore');
        const goldStore = useGoldStore.getState();
        
        if (goldStore.balance < config.price) {
          console.log('❌ 金币不足，无法领养宠物');
          return false;
        }
        
        // 扣除金币
        goldStore.penaltyGold(config.price, `领养宠物: ${name}`);
        
        // 创建宠物
        const newPet: Pet = {
          id: crypto.randomUUID(),
          name,
          type,
          emoji: config.emoji,
          level: 1,
          exp: 0,
          expToNextLevel: 100,
          hunger: 100,
          happiness: 100,
          health: 100,
          status: 'happy',
          goldBonus: config.goldBonus,
          lastFedTime: new Date(),
          lastPlayedTime: new Date(),
          createdAt: new Date(),
        };
        
        set((state) => ({
          ownedPets: [...state.ownedPets, newPet],
          currentPet: state.currentPet || newPet, // 如果没有当前宠物，设置为新宠物
        }));
        
        console.log(`🎉 成功领养宠物: ${name} (${config.name})`);
        return true;
      },
      
      // 切换当前宠物
      switchPet: (petId) => {
        const pet = get().ownedPets.find(p => p.id === petId);
        if (pet && pet.status !== 'dead') {
          set({ currentPet: pet });
          console.log(`🔄 切换到宠物: ${pet.name}`);
        }
      },
      
      // 删除宠物
      deletePet: (petId) => {
        set((state) => {
          const newOwnedPets = state.ownedPets.filter(p => p.id !== petId);
          const newCurrentPet = state.currentPet?.id === petId 
            ? (newOwnedPets[0] || null) 
            : state.currentPet;
          
          return {
            ownedPets: newOwnedPets,
            currentPet: newCurrentPet,
          };
        });
      },
      
      // 喂食宠物
      feedPet: (foodId) => {
        const pet = get().currentPet;
        if (!pet || pet.status === 'dead') {
          console.log('❌ 没有可喂食的宠物');
          return false;
        }
        
        const food = get().foods.find(f => f.id === foodId);
        if (!food) {
          console.log('❌ 食物不存在');
          return false;
        }
        
        // 检查金币
        const { useGoldStore } = require('@/stores/goldStore');
        const goldStore = useGoldStore.getState();
        
        if (goldStore.balance < food.price) {
          console.log('❌ 金币不足');
          return false;
        }
        
        // 扣除金币
        goldStore.penaltyGold(food.price, `喂食宠物: ${food.name}`);
        
        // 更新宠物状态
        const newHunger = Math.min(100, pet.hunger + food.hungerRestore);
        const newHappiness = Math.min(100, pet.happiness + food.happinessBonus);
        
        const updatedPet = {
          ...pet,
          hunger: newHunger,
          happiness: newHappiness,
          lastFedTime: new Date(),
        };
        
        set((state) => ({
          currentPet: updatedPet,
          ownedPets: state.ownedPets.map(p => p.id === pet.id ? updatedPet : p),
        }));
        
        console.log(`🍖 喂食成功: ${food.name}`);
        return true;
      },
      
      // 陪宠物玩
      playWithPet: (toyId) => {
        const pet = get().currentPet;
        if (!pet || pet.status === 'dead') {
          console.log('❌ 没有可玩耍的宠物');
          return false;
        }
        
        let happinessBonus = 10; // 默认快乐值
        let cost = 0;
        
        if (toyId) {
          const toy = get().toys.find(t => t.id === toyId);
          if (!toy) {
            console.log('❌ 玩具不存在');
            return false;
          }
          
          // 检查金币
          const { useGoldStore } = require('@/stores/goldStore');
          const goldStore = useGoldStore.getState();
          
          if (goldStore.balance < toy.price) {
            console.log('❌ 金币不足');
            return false;
          }
          
          goldStore.penaltyGold(toy.price, `使用玩具: ${toy.name}`);
          happinessBonus = toy.happinessBonus;
          cost = toy.price;
        }
        
        // 更新宠物状态
        const newHappiness = Math.min(100, pet.happiness + happinessBonus);
        
        const updatedPet = {
          ...pet,
          happiness: newHappiness,
          lastPlayedTime: new Date(),
        };
        
        set((state) => ({
          currentPet: updatedPet,
          ownedPets: state.ownedPets.map(p => p.id === pet.id ? updatedPet : p),
        }));
        
        console.log(`🎾 玩耍成功，快乐值 +${happinessBonus}`);
        return true;
      },
      
      // 治疗宠物
      healPet: () => {
        const pet = get().currentPet;
        if (!pet || pet.status === 'dead') {
          console.log('❌ 没有可治疗的宠物');
          return false;
        }
        
        const HEAL_COST = 100;
        
        // 检查金币
        const { useGoldStore } = require('@/stores/goldStore');
        const goldStore = useGoldStore.getState();
        
        if (goldStore.balance < HEAL_COST) {
          console.log('❌ 金币不足');
          return false;
        }
        
        goldStore.penaltyGold(HEAL_COST, '治疗宠物');
        
        // 恢复健康
        const updatedPet = {
          ...pet,
          health: 100,
          status: 'happy' as PetStatus,
        };
        
        set((state) => ({
          currentPet: updatedPet,
          ownedPets: state.ownedPets.map(p => p.id === pet.id ? updatedPet : p),
        }));
        
        console.log('💊 治疗成功');
        return true;
      },
      
      // 更新宠物状态（定时调用）
      updatePetStatus: () => {
        const pet = get().currentPet;
        if (!pet || pet.status === 'dead') return;
        
        const now = new Date();
        
        // 计算距离上次喂食的时间（小时）
        const hoursSinceLastFed = (now.getTime() - pet.lastFedTime.getTime()) / (1000 * 60 * 60);
        
        // 每小时减少10点饥饿值
        const hungerDecrease = Math.floor(hoursSinceLastFed * 10);
        const newHunger = Math.max(0, pet.hunger - hungerDecrease);
        
        // 计算距离上次玩耍的时间（小时）
        const hoursSinceLastPlayed = (now.getTime() - pet.lastPlayedTime.getTime()) / (1000 * 60 * 60);
        
        // 每小时减少5点快乐值
        const happinessDecrease = Math.floor(hoursSinceLastPlayed * 5);
        const newHappiness = Math.max(0, pet.happiness - happinessDecrease);
        
        // 根据饥饿和快乐值计算健康值
        let newHealth = pet.health;
        if (newHunger < 20 || newHappiness < 20) {
          newHealth = Math.max(0, newHealth - 5);
        }
        
        // 判断状态
        let newStatus: PetStatus = 'normal';
        if (newHealth === 0) {
          newStatus = 'dead';
        } else if (newHealth < 30) {
          newStatus = 'sick';
        } else if (newHunger < 30) {
          newStatus = 'hungry';
        } else if (newHappiness < 30) {
          newStatus = 'sad';
        } else if (newHappiness > 80 && newHunger > 80) {
          newStatus = 'happy';
        }
        
        const updatedPet = {
          ...pet,
          hunger: newHunger,
          happiness: newHappiness,
          health: newHealth,
          status: newStatus,
          deathTime: newStatus === 'dead' ? now : pet.deathTime,
        };
        
        set((state) => ({
          currentPet: updatedPet,
          ownedPets: state.ownedPets.map(p => p.id === pet.id ? updatedPet : p),
        }));
        
        console.log(`🐾 宠物状态更新: ${newStatus}`);
      },
      
      // 获得经验值
      gainExp: (amount) => {
        const pet = get().currentPet;
        if (!pet || pet.status === 'dead') return;
        
        const newExp = pet.exp + amount;
        let newLevel = pet.level;
        let remainingExp = newExp;
        let expToNextLevel = pet.expToNextLevel;
        
        // 升级逻辑
        while (remainingExp >= expToNextLevel) {
          remainingExp -= expToNextLevel;
          newLevel++;
          expToNextLevel = newLevel * 100; // 每级需要的经验值递增
        }
        
        // 计算新的金币加成
        const basebonus = PET_CONFIGS[pet.type].goldBonus;
        const levelBonus = (newLevel - 1) * 0.05; // 每级增加5%
        const newGoldBonus = basebonus + levelBonus;
        
        const updatedPet = {
          ...pet,
          level: newLevel,
          exp: remainingExp,
          expToNextLevel,
          goldBonus: newGoldBonus,
        };
        
        set((state) => ({
          currentPet: updatedPet,
          ownedPets: state.ownedPets.map(p => p.id === pet.id ? updatedPet : p),
        }));
        
        if (newLevel > pet.level) {
          console.log(`🎉 宠物升级！等级: ${newLevel}，金币加成: ${(newGoldBonus * 100).toFixed(0)}%`);
        }
      },
      
      // 购买商店物品
      buyItem: (itemId) => {
        const item = get().shopItems.find(i => i.id === itemId);
        if (!item) return false;
        
        const { useGoldStore } = require('@/stores/goldStore');
        const goldStore = useGoldStore.getState();
        
        if (goldStore.balance < item.price) {
          console.log('❌ 金币不足');
          return false;
        }
        
        goldStore.penaltyGold(item.price, `购买: ${item.name}`);
        
        // 根据类型处理
        if (item.type === 'pet') {
          // 领养宠物的逻辑已在 adoptPet 中处理
        }
        
        console.log(`✅ 购买成功: ${item.name}`);
        return true;
      },
      
      // 初始化商店
      initializeShop: () => {
        const shopItems: ShopItem[] = [
          // 宠物
          ...Object.entries(PET_CONFIGS).map(([type, config]) => ({
            id: `pet_${type}`,
            type: 'pet' as const,
            name: config.name,
            emoji: config.emoji,
            description: `金币加成: +${((config.goldBonus - 1) * 100).toFixed(0)}%`,
            price: config.price,
            data: { type },
          })),
          // 食物
          ...DEFAULT_FOODS.map(food => ({
            id: food.id,
            type: 'food' as const,
            name: food.name,
            emoji: food.emoji,
            description: `饥饿 +${food.hungerRestore}, 快乐 +${food.happinessBonus}`,
            price: food.price,
          })),
          // 玩具
          ...DEFAULT_TOYS.map(toy => ({
            id: toy.id,
            type: 'toy' as const,
            name: toy.name,
            emoji: toy.emoji,
            description: `快乐 +${toy.happinessBonus}`,
            price: toy.price,
          })),
        ];
        
        set({ shopItems });
      },
      
      // 获取宠物状态
      getPetStatus: (pet) => {
        if (pet.health === 0) return 'dead';
        if (pet.health < 30) return 'sick';
        if (pet.hunger < 30) return 'hungry';
        if (pet.happiness < 30) return 'sad';
        if (pet.happiness > 80 && pet.hunger > 80) return 'happy';
        return 'normal';
      },
      
      // 检查是否可以领养宠物
      canAdoptPet: () => {
        return get().ownedPets.length < 5; // 最多5只宠物
      },
    }),
    {
      name: 'manifestos-pet-storage',
      version: 1,
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            
            // 恢复日期对象
            if (parsed?.state) {
              if (parsed.state.currentPet) {
                parsed.state.currentPet.lastFedTime = new Date(parsed.state.currentPet.lastFedTime);
                parsed.state.currentPet.lastPlayedTime = new Date(parsed.state.currentPet.lastPlayedTime);
                parsed.state.currentPet.createdAt = new Date(parsed.state.currentPet.createdAt);
                if (parsed.state.currentPet.deathTime) {
                  parsed.state.currentPet.deathTime = new Date(parsed.state.currentPet.deathTime);
                }
              }
              if (parsed.state.ownedPets) {
                parsed.state.ownedPets = parsed.state.ownedPets.map((pet: any) => ({
                  ...pet,
                  lastFedTime: new Date(pet.lastFedTime),
                  lastPlayedTime: new Date(pet.lastPlayedTime),
                  createdAt: new Date(pet.createdAt),
                  deathTime: pet.deathTime ? new Date(pet.deathTime) : undefined,
                }));
              }
            }
            
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取宠物存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('❌ 保存宠物存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除宠物存储失败:', error);
          }
        },
      },
    }
  )
);

