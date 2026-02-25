# 读取文件
with open('src/components/calendar/NewTimelineView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 新的布局代码（从1804行开始替换到1878行）
new_layout = '''                    {/* 新布局：左右分栏 - 左侧信息 + 右侧大图 */}
                    <div className={`flex ${isMobile ? 'gap-2' : 'gap-3'}`}>
                      {/* 左侧：所有信息 */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        {/* 顶部：标题 + 表情 + 编辑按钮 */}
                        <div className={`flex items-start justify-between ${isMobile ? 'mb-1' : 'mb-1.5'}`}>
                          <div className="flex-1 min-w-0">
                            <div className={`flex items-center ${isMobile ? 'gap-1 mb-0.5' : 'gap-1.5 mb-1'}`}>
                              <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold ${block.isCompleted ? 'line-through' : ''} truncate`}>
                                {block.title}
                              </h3>
                              <span className={`${isMobile ? 'text-base' : 'text-lg'} flex-shrink-0`}>{block.emoji}</span>
                            </div>
                            
                            {/* 等级 + 进度条 */}
                            <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                              <div className={`${isMobile ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'} bg-yellow-400 text-yellow-900 font-bold rounded flex items-center gap-0.5`}>
                                🏆 Lv.1
                              </div>
                              <div className="flex-1 flex items-center gap-1">
                                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                                    style={{ width: '0%' }}
                                  />
                                </div>
                                <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-bold whitespace-nowrap opacity-80`}>
                                  0/200
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* 编辑按钮 */}
                          <button
                            onClick={() => setEditingTask(block.id)}
                            className={`${isMobile ? 'p-0.5' : 'p-1'} rounded-full hover:bg-white/20 transition-colors flex-shrink-0 ml-1`}
                            title="编辑任务"
                          >
                            <Edit2 className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                          </button>
                        </div>
                        
                        {/* 底部：拖拽 + 标签 + 时长 */}
                        <div className={`flex items-center justify-between ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                          <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                            <div
                              className="cursor-move p-0.5 rounded hover:bg-white/20 transition-colors flex-shrink-0"
                              onMouseDown={(e) => handleDragStart(e, block.id, block.startTime)}
                              onTouchStart={(e) => handleDragStart(e, block.id, block.startTime)}
                            >
                              <GripVertical className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} opacity-60`} />
                            </div>
                            {block.tags.map((tag, idx) => (
                              <span 
                                key={idx}
                                className={`${isMobile ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'} font-semibold rounded-full`}
                                style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold flex-shrink-0`} style={{ color: '#ff69b4' }}>
                            ⏱{block.duration} min
                          </div>
                        </div>
                      </div>
                      
                      {/* 右侧：超大图片 */}
                      <div 
                        onClick={() => handleOpenImagePicker(block.id)}
                        className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-2xl flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 hover:scale-105 transition-all relative shadow-lg`}
                        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                        title="点击上传图片（支持多选）"
                      >
                        {taskImages[block.id] && taskImages[block.id].length > 0 ? (
                          <img 
                            src={taskImages[block.id][0].url} 
                            alt="任务"
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          <Camera className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} opacity-50`} />
                        )}
                        {uploadingImage === block.id && (
                          <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                            <span className={`text-white ${isMobile ? 'text-[10px]' : 'text-xs'} font-medium`}>上传中</span>
                          </div>
                        )}
                        {taskImages[block.id] && taskImages[block.id].length > 1 && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                            {taskImages[block.id].length}
                          </div>
                        )}
                      </div>
                    </div>

                      {/* 标题 + 表情 + 目标文本 */}
'''

# 替换第1803行到第1878行（索引1802到1877）
new_lines = lines[:1803] + [new_layout] + lines[1878:]

# 写回文件
with open('src/components/calendar/NewTimelineView.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("布局重构完成！")
print(f"删除了 {1878-1803} 行旧代码")
print(f"添加了新的左右分栏布局")








