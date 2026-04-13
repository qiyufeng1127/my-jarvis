import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NavigationParsedRules, NavigationPreferences } from '@/types/navigation';

const DEFAULT_CUSTOM_PROMPT = `我是一个infp，摩羯座，adhd的自由职业女生，我尤其的启动困难，所以第一个步骤一定要无痛快速启动！！！
一个任务至少十个步骤以上，并且启动超级简单。
1.每次有相关区域的任务的时候，帮我多加一些顺手的步骤，比如说
有去厨房的活动就提醒我看看有没有厨房的任务需要做(比如把厨房的东西顺手带过去，倒猫粮，铲粑粑，整理厨房等等)
开始做任何工作之前先提醒我把我的工作区整理一下，保持干净整洁的工作环境
有要从卧室下楼的相关的任务，就提醒我把要洗的衣服带进厕所，把不属于卧室的东西带出去
有上楼睡觉的任务提醒吃安眠药，还有把洗好的衣服拿上楼
出门时记得把垃圾带上丢掉
上楼睡觉时第二天要穿的衣服准备好
总之就是多在日常的日程中多做一些一举两得的小事情
出门了准备回家的时候买大的桶装水回家，拿快递

我尤其的起床困难！！所以当我说我不想起床或者需要起床的时候，给我一些下楼具有诱惑力的选项，并且把这个诱惑力放在最开头来刺激我开始任务，如果我没有提到起床 或者是没有提到不想起床的话就不要给我拆解以上的步骤
最近可以让我开心的事：
把热水袋充好电，放在怀里，放一个电视剧在旁边听，开始做我最想做的工作

我还非常难出门，所以当要出门时给我一些诱惑力的事情
我也很难做饭，当我要做饭时，给我一个可以五分钟做好的有营养的餐食

小事顺手做，大事分块做，动线顺滑，心情愉悦！

为了方便优化我的动线，我家里的格局是：loft公寓，楼上是卧室和拍摄间，楼下是厕所进门区客厅厨房工作区(工作基本都在这儿完成)，你的设计要符合日常动线的合理性，不能自相矛盾，我要无缝衔接高效率的生活

结合行为心理学，时间管理方法，以及顺手任务`;

const DEFAULT_PARSED_RULES: NavigationParsedRules = {
  easyStartRequired: true,
  preferMinSteps: 10,
  addContextualSideTasks: true,
  workspaceResetBeforeWork: true,
  carryLaundryWhenGoingDownstairs: true,
  takeTrashWhenGoingOut: true,
  prepareTomorrowClothesBeforeSleep: true,
  useTemptationWhenWakeupMentioned: true,
  useTemptationWhenGoingOut: true,
  suggestQuickNutritiousMealWhenCooking: true,
};

const DEFAULT_HOME_LAYOUT = '楼上：卧室、拍摄间。楼下：厕所、进门区、客厅、厨房、工作区（工作基本都在楼下完成）。';

const createDefaultPreferences = (): NavigationPreferences => ({
  customPrompt: DEFAULT_CUSTOM_PROMPT,
  granularity: 'ultra_fine',
  easyStartMode: 'gentle',
  sideTaskIntensity: 'rich',
  tone: 'gentle',
  homeLayout: DEFAULT_HOME_LAYOUT,
  parsedRules: DEFAULT_PARSED_RULES,
  updatedAt: new Date().toISOString(),
});

interface NavigationPreferenceState {
  preferences: NavigationPreferences;
  updatePreferences: (updates: Partial<NavigationPreferences>) => void;
  setCustomPrompt: (prompt: string) => void;
  setParsedRules: (rules: Partial<NavigationParsedRules>) => void;
  resetPreferences: () => void;
}

export const useNavigationPreferenceStore = create<NavigationPreferenceState>()(
  persist(
    (set) => ({
      preferences: createDefaultPreferences(),
      updatePreferences: (updates) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        }));
      },
      setCustomPrompt: (prompt) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            customPrompt: prompt,
            updatedAt: new Date().toISOString(),
          },
        }));
      },
      setParsedRules: (rules) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            parsedRules: {
              ...state.preferences.parsedRules,
              ...rules,
            },
            updatedAt: new Date().toISOString(),
          },
        }));
      },
      resetPreferences: () => {
        set({
          preferences: createDefaultPreferences(),
        });
      },
    }),
    {
      name: 'manifestos-navigation-preferences',
      version: 1,
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);








