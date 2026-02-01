import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface HelpButtonProps {
  title: string;
  content: string | string[];
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function HelpButton({ title, content, position = 'bottom' }: HelpButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex items-center justify-center"
        title="查看帮助"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {showTooltip && (
        <div
          className={`absolute z-50 w-64 bg-white rounded-lg shadow-xl border-2 border-blue-200 p-4 ${positionClasses[position]} animate-scale-in`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="font-bold text-gray-900 mb-2 flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>{title}</span>
          </div>
          {Array.isArray(content) ? (
            <ul className="space-y-1 text-sm text-gray-600">
              {content.map((item, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 font-semibold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">{content}</p>
          )}
        </div>
      )}
    </div>
  );
}

