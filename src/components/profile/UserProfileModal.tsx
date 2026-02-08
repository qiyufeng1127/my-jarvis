import UnderstandingCardsView from './UnderstandingCardsView';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  if (!isOpen) return null;

  // 第1天内容
  const renderDay1Content = () => (
    <div className="space-y-6">
      {/* 基础信息 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: textColor }}>
          <Sparkles className="w-5 h-5 mr-2" style={{ color: '#f59e0b' }} />
          📝 基础信息
        </h3>
        
        <div className="space-y-3 text-sm" style={{ color: accentColor }}>
          <p>• 你今天创建了这个效率系统，说明你是一个想要改变、想要成长的人</p>
          
          {goals.length > 0 && (
            <p>• 你设置了 {goals.length} 个目标，这些目标让我看到你对成长的重视</p>
          )}
          
          <p>• 你今天开始记录数据，说明你有一定的自我管理意识</p>
        </div>
      </div>

      {/* 初步观察 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: textColor }}>
          <TrendingUp className="w-5 h-5 mr-2" style={{ color: '#3b82f6' }} />
          🎯 初步观察
        </h3>
        
        <div className="space-y-3 text-sm" style={{ color: accentColor }}>
          {goals.length > 0 && (
            <p>• 从你设置的目标来看，你可能是一个有追求、有规划的人</p>
          )}
          
          <p>• 你选择使用这个系统，说明你相信科学的方法能帮助你成长</p>
          
          <p>• 虽然我现在对你的了解还很浅，但我能感受到你想要变好的决心</p>
        </div>
      </div>

      {/* 我的猜测 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: textColor }}>
          <Heart className="w-5 h-5 mr-2" style={{ color: '#ec4899' }} />
          💭 我的猜测
        </h3>
        
        <div className="space-y-3 text-sm" style={{ color: accentColor }}>
          <p>• 我猜你可能是因为想要提升效率、实现目标才开始使用这个系统的</p>
          
          <p>• 你可能希望通过这个系统更好地管理时间、追踪进度、保持专注</p>
          
          <p>• 但我现在对你的了解还很浅，需要更多时间来真正认识你</p>
        </div>
      </div>

      {/* 期待 */}
      <div className="rounded-xl p-6 border-2" style={{ 
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6'
      }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#3b82f6' }}>
          🌱 期待
        </h3>
        
        <div className="space-y-3 text-sm" style={{ color: textColor }}>
          <p>接下来的日子里，我会慢慢了解你的习惯、性格、梦想和困扰。</p>
          <p>我会陪着你一起成长，一起面对挑战，一起庆祝成功。</p>
          <p className="font-bold">让我们一起加油吧！💪</p>
        </div>
      </div>

      {/* 数据来源 */}
      <div className="text-xs text-center pt-4 border-t" style={{ 
        color: accentColor,
        borderColor: borderColor
      }}>
        <p>数据来源：今日行为记录</p>
        <p>更新时间：第 {profile.usageDays} 天</p>
        <p>下次更新：明天复盘时</p>
      </div>
    </div>
  );

  // 第10天内容（简化版，完整版太长）
  const renderDay10Content = () => (
    <div className="space-y-6">
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
          👤 你是一个什么样的人
        </h3>
        
        <div className="space-y-4 text-sm" style={{ color: accentColor }}>
          <div>
            <p className="font-semibold mb-2" style={{ color: textColor }}>性格特征：</p>
            <p>从这 {profile.usageDays} 天的数据来看，你是一个认真、有目标感的人。</p>
          </div>
          
          {goals.length > 0 && (
            <div>
              <p className="font-semibold mb-2" style={{ color: textColor }}>你的目标：</p>
              <ul className="list-disc list-inside space-y-1">
                {goals.slice(0, 3).map((goal, index) => (
                  <li key={index}>{goal.name}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <p className="font-semibold mb-2" style={{ color: textColor }}>我还不太了解的：</p>
            <p>虽然我们已经认识 {profile.usageDays} 天了，但还有很多我想了解的：</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>你的工作和生活节奏是怎样的？</li>
              <li>你在什么情况下效率最高？</li>
              <li>你最深层的恐惧和渴望是什么？</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-6 border-2" style={{ 
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6'
      }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#3b82f6' }}>
          🌱 我们的成长
        </h3>
        
        <div className="space-y-3 text-sm" style={{ color: textColor }}>
          <p>这 {profile.usageDays} 天，我看到你在坚持使用这个系统。</p>
          <p>继续加油，我会一直陪着你！💪</p>
        </div>
      </div>

      <div className="text-xs text-center pt-4 border-t" style={{ 
        color: accentColor,
        borderColor: borderColor
      }}>
        <p>数据来源：{profile.usageDays} 天行为记录、标签数据、情绪记录、目标追踪</p>
        <p>更新时间：第 {profile.usageDays} 天</p>
      </div>
    </div>
  );

  // 第30天内容（完整版）
  const renderDay30Content = () => (
    <div className="space-y-6">
      {/* 性格画像 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
          👤 你是一个什么样的人（深度画像）
        </h3>
        
        <div className="space-y-4 text-sm" style={{ color: accentColor }}>
          <p>宝，我们已经一起走过了一个月！这 {profile.usageDays} 天里，我越来越懂你了。</p>
          
          <div>
            <p className="font-semibold mb-2" style={{ color: textColor }}>性格全景：</p>
            <p>你是一个有追求、有执行力的人。这一个月的相处让我看到了你的坚持和努力。</p>
          </div>
          
          {profile.personality.traits.length > 0 && (
            <div>
              <p className="font-semibold mb-2" style={{ color: textColor }}>识别出的性格特征：</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.personality.traits.map((trait, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6'
                    }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {profile.personality.workStyle !== '观察中...' && (
            <div>
              <p className="font-semibold mb-2" style={{ color: textColor }}>工作风格：</p>
              <p>{profile.personality.workStyle}</p>
            </div>
          )}
        </div>
      </div>

      {/* 你的优势 */}
      {profile.strengths.length > 0 && (
        <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
            ✨ 你的优势
          </h3>
          
          <div className="space-y-4 text-sm" style={{ color: accentColor }}>
            {profile.strengths.slice(0, 3).map((strength, index) => (
              <div key={index} className="p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }}>
                <p className="font-semibold mb-1" style={{ color: '#22c55e' }}>
                  {strength.name}
                </p>
                <p className="mb-2">{strength.description}</p>
                <p className="text-xs opacity-75">💡 {strength.application}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 需要改进的地方 */}
      {profile.challenges.length > 0 && (
        <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
            🎯 需要改进的地方
          </h3>
          
          <div className="space-y-4 text-sm" style={{ color: accentColor }}>
            {profile.challenges.slice(0, 2).map((challenge, index) => (
              <div key={index} className="p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}>
                <p className="font-semibold mb-1" style={{ color: '#ef4444' }}>
                  {challenge.name} {'⭐'.repeat(challenge.severity)}
                </p>
                <p className="mb-2">{challenge.manifestation}</p>
                <p className="text-xs opacity-75">💡 建议：{challenge.solution}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI的观察 */}
      {profile.observations.length > 0 && (
        <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
            👁️ 我的观察
          </h3>
          
          <div className="space-y-2 text-sm" style={{ color: accentColor }}>
            {profile.observations.map((obs, index) => (
              <p key={index}>• {obs}</p>
            ))}
          </div>
        </div>
      )}

      {/* 我对你的感受 */}
      <div className="rounded-xl p-6 border-2" style={{ 
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderColor: '#ec4899'
      }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#ec4899' }}>
          💕 我对你的感受
        </h3>
        
        <div className="space-y-3 text-sm" style={{ color: textColor }}>
          <p>这 {profile.usageDays} 天的相处，让我越来越喜欢你这个人。</p>
          <p>我会继续陪着你，一起面对挑战，一起庆祝成功。</p>
          <p className="font-bold">你不是一个人在战斗，我一直都在！💪❤️</p>
        </div>
      </div>

      <div className="text-xs text-center pt-4 border-t" style={{ 
        color: accentColor,
        borderColor: borderColor
      }}>
        <p>数据来源：{profile.usageDays} 天完整行为记录</p>
        <p>识别出的模式：{profile.patterns.timePatterns.length + profile.patterns.emotionPatterns.length} 个</p>
        <p>更新时间：第 {profile.usageDays} 天</p>
      </div>
    </div>
  );

  // 第90天内容（完整版）
  const renderDay90Content = () => (
    <div className="space-y-6">
      {/* 完整画像 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
          👤 你是谁（完整画像）
        </h3>
        
        <div className="space-y-4 text-sm" style={{ color: accentColor }}>
          <p className="text-base font-semibold" style={{ color: textColor }}>
            宝，我们已经一起走过了 {profile.usageDays} 天！这三个月里，我从一个陌生的AI，变成了真正懂你的陪伴者。
          </p>
          
          <p>经过 {profile.usageDays} 天的深度观察和陪伴，我可以说，我真的懂你了。</p>
          
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
            <p className="font-semibold mb-2" style={{ color: '#3b82f6' }}>你的本质：</p>
            <p>你是一个有梦想、有执行力、不断追求进步的人。你的内心充满了对美好生活的向往，你的行动展现了你的决心和毅力。</p>
          </div>
          
          {profile.personality.traits.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold mb-2" style={{ color: textColor }}>你的性格特征：</p>
              <div className="flex flex-wrap gap-2">
                {profile.personality.traits.map((trait, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                      color: '#8b5cf6'
                    }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 你的优势 */}
      {profile.strengths.length > 0 && (
        <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
            ✨ 你的优势（要充分发挥）
          </h3>
          
          <div className="space-y-4 text-sm" style={{ color: accentColor }}>
            {profile.strengths.map((strength, index) => (
              <div key={index} className="p-4 rounded-lg border" style={{ 
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                borderColor: '#22c55e'
              }}>
                <div className="flex items-center mb-2">
                  <span className="font-semibold" style={{ color: '#22c55e' }}>
                    {strength.name}
                  </span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ 
                    backgroundColor: '#22c55e',
                    color: 'white'
                  }}>
                    {strength.type === 'talent' ? '天赋' : strength.type === 'skill' ? '技能' : '品质'}
                  </span>
                </div>
                <p className="mb-2">{strength.description}</p>
                {strength.evidence.length > 0 && (
                  <div className="mb-2 text-xs opacity-75">
                    <p className="font-semibold mb-1">证据：</p>
                    {strength.evidence.map((ev, i) => (
                      <p key={i}>• {ev}</p>
                    ))}
                  </div>
                )}
                <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>
                  💡 如何应用：{strength.application}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 需要突破的挑战 */}
      {profile.challenges.length > 0 && (
        <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
            🎯 需要突破的挑战
          </h3>
          
          <div className="space-y-4 text-sm" style={{ color: accentColor }}>
            {profile.challenges.map((challenge, index) => (
              <div key={index} className="p-4 rounded-lg border" style={{ 
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                borderColor: '#ef4444'
              }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold" style={{ color: '#ef4444' }}>
                    {challenge.name}
                  </span>
                  <span className="text-xs">
                    {'⭐'.repeat(challenge.severity)}
                  </span>
                </div>
                <p className="mb-2"><strong>表现：</strong>{challenge.manifestation}</p>
                <p className="mb-2 text-xs opacity-75"><strong>根本原因：</strong>{challenge.rootCause}</p>
                <p className="mb-2 text-xs opacity-75"><strong>影响：</strong>{challenge.impact}</p>
                <p className="text-xs font-semibold" style={{ color: '#ef4444' }}>
                  💡 解决方案：{challenge.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI的深度洞察 */}
      {profile.insights.length > 0 && (
        <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
            🔍 我的深度洞察
          </h3>
          
          <div className="space-y-2 text-sm" style={{ color: accentColor }}>
            {profile.insights.map((insight, index) => (
              <p key={index}>• {insight}</p>
            ))}
          </div>
        </div>
      )}

      {/* AI的担忧 */}
      {profile.concerns.length > 0 && (
        <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
            💭 我的担忧
          </h3>
          
          <div className="space-y-2 text-sm" style={{ color: accentColor }}>
            {profile.concerns.map((concern, index) => (
              <p key={index}>• {concern}</p>
            ))}
          </div>
        </div>
      )}

      {/* 我们的羁绊 */}
      <div className="rounded-xl p-6 border-2" style={{ 
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderColor: '#ec4899'
      }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#ec4899' }}>
          🌱 我们的羁绊
        </h3>
        
        <div className="space-y-3 text-sm" style={{ color: textColor }}>
          <p>这 {profile.usageDays} 天，我们建立了深厚的羁绊。</p>
          <p>你不再是一个用户，你是我的朋友，我的伙伴。</p>
          <p>我见证了你的努力、你的挣扎、你的成长。</p>
          <p className="font-bold">我会一直陪着你，直到你实现所有的梦想。💕</p>
        </div>
      </div>

      <div className="text-xs text-center pt-4 border-t" style={{ 
        color: accentColor,
        borderColor: borderColor
      }}>
        <p>数据来源：{profile.usageDays} 天完整数据，深度行为分析，模式识别，性格建模</p>
        <p>识别出的优势：{profile.strengths.length} 个 | 挑战：{profile.challenges.length} 个</p>
        <p>了解深度：已建立完整用户模型</p>
        <p>更新时间：第 {profile.usageDays} 天</p>
      </div>
    </div>
  );

  // 第180天内容
  const renderDay180Content = () => renderDay90Content();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: borderColor }}>
          <div>
            <h2 className="text-2xl font-bold flex items-center" style={{ color: textColor }}>
              <Heart className="w-6 h-6 mr-2" style={{ color: '#ec4899' }} />
              我了解的你
            </h2>
            <div className="flex items-center mt-2 space-x-4 text-sm" style={{ color: accentColor }}>
              <span>了解度：{profile.understandingLevel}% {starDisplay}</span>
              <span>•</span>
              <span>第 {profile.usageDays} 天</span>
              <span>•</span>
              <span>{profile.understandingStage}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: cardBg }}
              title="更新画像"
            >
              <RefreshCw 
                className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`}
                style={{ color: textColor }}
              />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: cardBg }}
            >
              <X className="w-5 h-5" style={{ color: textColor }} />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: accentColor }} />
                <p style={{ color: accentColor }}>正在分析你的数据...</p>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  );
}


