// AI Secretary Module - KiiKii
// AI鍓┚椹舵牳蹇冩ā鍧?- 浠庤鍔ㄥ伐鍏峰彉涓轰富鍔ㄦ湇鍔?
const AISecretary = {
    name: " KiiKii\,
 
 // 鐢ㄦ埛鐢诲儚鏁版嵁
 userProfile: {
 initialized: false,
 workTypes: [], // 宸ヤ綔绫诲瀷锛氭憚褰便€佹彃鐢汇€佽繍钀ョ瓑
 workSchedule: { // 宸ヤ綔鏃堕棿鍋忓ソ
 preferredHours: [],
 highEfficiencyPeriods: [],
 restDays: []
 },
 incomeStreams: [], // 鏀跺叆鏉ユ簮
 challenges: [], // 鏁堢巼鎸戞垬
 housework: [], // 瀹跺姟瀹夋帓
 ideas: [], // 鏂版兂娉? lastWeeklySetup: null // 涓婃鍛ㄨ缃椂闂? },
 
 // 涓婁笅鏂囪蹇? context: {
 recentTasks: [], // 鏈€杩戞彁鍒扮殑浠诲姟
 recentProjects: {}, // 鏈€杩戠殑椤圭洰锛堝悕绉?>璇︽儏锛? conversationHistory: [], // 瀵硅瘽鍘嗗彶
 todayMood: null, // 浠婃棩蹇冩儏
 pendingFollowups: [] // 寰呰窡杩涗簨椤? },
 
 // 瀛︿範鍒扮殑鐢ㄦ埛涔犳儻
 learnedPatterns: {
 taskDurations: {}, // 浠诲姟绫诲瀷->骞冲潎鑰楁椂
 clientPricing: {}, // 瀹㈡埛->閫氬父浠锋牸
 productivityByHour: {}, // 灏忔椂->鏁堢巼璇勫垎
 commonProcrastination: [],// 甯歌鎷栧欢鍦烘櫙
 preferredBreakdowns: {} // 鍋忓ソ鐨勪换鍔℃媶瑙ｆ柟寮? },
 
 // 鍒濆鍖? init() {
 this.loadUserProfile();
 this.loadContext();
 this.loadLearnedPatterns();
 
 // 妫€鏌ユ槸鍚﹂渶瑕佸懆鍚姩寮曞
 if (this.shouldShowWeeklySetup()) {
 setTimeout(() => this.showWeeklySetup(), 500);
 } else {
 // 鏄剧ず姣忔棩闂€? setTimeout(() => this.showDailyGreeting(), 500);
 }
 },
 
 // 鍔犺浇鐢ㄦ埛鐢诲儚
 loadUserProfile() {
 const saved = Storage.load(\adhd_user_profile\, null);
 if (saved) {
 Object.assign(this.userProfile, saved);
 }
 },
 
 // 淇濆瓨鐢ㄦ埛鐢诲儚
 saveUserProfile() {
 Storage.save(\adhd_user_profile\, this.userProfile);
 },
 
 // 鍔犺浇涓婁笅鏂? loadContext() {
 const saved = Storage.load(\adhd_ai_context\, null);
 if (saved) {
 Object.assign(this.context, saved);
 }
 },
 
 // 淇濆瓨涓婁笅鏂? saveContext() {
 Storage.save(\adhd_ai_context\, this.context);
 },
 
 // 鍔犺浇瀛︿範妯″紡
 loadLearnedPatterns() {
 const saved = Storage.load(\adhd_learned_patterns\, null);
 if (saved) {
 Object.assign(this.learnedPatterns, saved);
 }
 },
 
 // 淇濆瓨瀛︿範妯″紡
 saveLearnedPatterns() {
 Storage.save(\adhd_learned_patterns\, this.learnedPatterns);
 },
 
 // 妫€鏌ユ槸鍚﹂渶瑕佸懆鍚姩
 shouldShowWeeklySetup() {
 if (!this.userProfile.lastWeeklySetup) return true;
 
 const lastSetup = new Date(this.userProfile.lastWeeklySetup);
 const now = new Date();
 const dayOfWeek = now.getDay();
 
 // 鍛ㄤ竴妫€鏌? if (dayOfWeek === 1) {
 const lastSetupWeek = this.getWeekNumber(lastSetup);
 const currentWeek = this.getWeekNumber(now);
 return lastSetupWeek !== currentWeek;
 }
 
 // 棣栨浣跨敤
 return !this.userProfile.initialized;
 },
 
 // 鑾峰彇鍛ㄦ暟
 getWeekNumber(date) {
 const d = new Date(date);
 d.setHours(0, 0, 0, 0);
 d.setDate(d.getDate() + 4 - (d.getDay() || 7));
 const yearStart = new Date(d.getFullYear(), 0, 1);
 return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
 },
 
 // 鏄剧ず鍛ㄥ惎鍔ㄥ紩瀵? showWeeklySetup() {
 const isFirstTime = !this.userProfile.initialized;
 
 const modal = document.createElement(\div\);
 modal.className = \ai-secretary-modal\;
 modal.id = \weeklySetupModal\;
 modal.innerHTML = this.renderWeeklySetupHTML(isFirstTime);
 
 document.body.appendChild(modal);
 setTimeout(() => modal.classList.add(\show\), 10);
 }
};

window.AISecretary = AISecretary;
