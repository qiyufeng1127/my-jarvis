import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件
 * 捕获子组件树中的所有错误，防止整个应用崩溃（白屏）
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误到控制台
    console.error('❌ [ErrorBoundary] 捕获到错误:', error);
    console.error('❌ [ErrorBoundary] 错误堆栈:', errorInfo.componentStack);

    // 保存错误信息到 localStorage，方便调试
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
        },
        componentStack: errorInfo.componentStack,
      };
      
      const existingLogs = localStorage.getItem('error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(errorLog);
      
      // 只保留最近 10 条错误日志
      if (logs.length > 10) {
        logs.shift();
      }
      
      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (logError) {
      console.error('❌ 保存错误日志失败:', logError);
    }

    // 更新状态
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    // 重置错误状态
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // 刷新页面
    window.location.reload();
  };

  render() {
    // 不显示错误界面，只在控制台输出错误，让开发者可以直接看到并修复
    // 即使有错误也继续渲染子组件
    return this.props.children;
  }
}

export default ErrorBoundary;







