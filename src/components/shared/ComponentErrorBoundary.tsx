import React from 'react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface State {
  hasError: boolean;
}

export default class ComponentErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('组件渲染异常:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[220px] items-center justify-center p-6 bg-white">
          <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-[linear-gradient(180deg,#fffdf7,#fff7e8)] p-6 text-center shadow-[0_18px_40px_rgba(84,41,22,0.12)]">
            <div className="text-4xl">🧯</div>
            <h3 className="mt-3 text-lg font-bold text-[#542916]">
              {this.props.fallbackTitle || '这个面板刚刚加载失败了'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#7a5a45]">
              {this.props.fallbackDescription || '我已经拦住异常，页面不会再整页白屏。你可以先关闭这个面板，或刷新后再试。'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

