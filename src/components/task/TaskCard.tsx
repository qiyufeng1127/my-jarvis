import { Clock, Calendar, Zap } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { TASK_TYPE_CONFIG } from '@/constants';
import { formatTime, minutesToHours } from '@/utils';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const typeConfig = TASK_TYPE_CONFIG[task.taskType];
  
  const statusColors = {
    pending: 'bg-neutral-100 text-neutral-700',
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-green-100 text-green-700',
    completed: 'bg-success-100 text-success-700',
    failed: 'bg-red-100 text-red-700',
  };

  const statusLabels = {
    pending: '待安排',
    scheduled: '已安排',
    waiting_start: '待开始',
    verifying_start: '验证中',
    in_progress: '进行中',
    verifying_complete: '验证完成',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  };

  return (
    <Card
      padding="md"
      hover
      className="cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        {/* 左侧内容 */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">{typeConfig.icon}</span>
            <h3 className="font-semibold text-neutral-900">{task.title}</h3>
          </div>

          {task.description && (
            <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center space-x-4 text-sm text-neutral-500">
            {task.scheduledStart && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatTime(task.scheduledStart)}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{minutesToHours(task.durationMinutes)}</span>
            </div>

            {task.priority <= 2 && (
              <div className="flex items-center space-x-1 text-warning-600">
                <Zap className="w-4 h-4" />
                <span>{task.priority === 1 ? '最高优先级' : '高优先级'}</span>
              </div>
            )}
          </div>

          {/* 成长维度标签 */}
          {Object.keys(task.growthDimensions).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(task.growthDimensions).map(([dimId, points]) => (
                <Badge key={dimId} variant="primary" size="sm">
                  +{points} 成长值
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 右侧状态和金币 */}
        <div className="flex flex-col items-end space-y-2 ml-4">
          <Badge variant="default" size="sm">
            {statusLabels[task.status]}
          </Badge>
          
          {task.goldEarned > 0 && (
            <div className="flex items-center space-x-1 text-warning-600 font-semibold">
              <span>💰</span>
              <span>{task.goldEarned}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

