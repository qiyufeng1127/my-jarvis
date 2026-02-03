import { useState } from 'react';
import { baiduImageRecognition } from '@/services/baiduImageRecognition';

export default function BaiduAITest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [keywords, setKeywords] = useState('洗漱台, 牙刷, 洗面奶');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleRecognize = async () => {
    if (!selectedFile) {
      alert('请先选择图片！');
      return;
    }

    setRecognizing(true);
    setResult(null);

    try {
      // 测试通用识别
      const recognizedKeywords = await baiduImageRecognition.recognizeGeneral(selectedFile);
      
      // 测试验证
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
      const verifyResult = await baiduImageRecognition.verifyImage(
        selectedFile,
        keywordList,
        0.3
      );

      setResult({
        recognizedKeywords,
        verifyResult,
      });
    } catch (error) {
      console.error('识别失败:', error);
      setResult({
        error: error instanceof Error ? error.message : '识别失败',
      });
    } finally {
      setRecognizing(false);
    }
  };

  const isConfigured = baiduImageRecognition.isConfigured();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">百度AI图像识别测试</h1>
          <p className="text-gray-600 mb-6">测试百度AI是否配置成功</p>

          {/* 配置状态 */}
          <div className={`p-4 rounded-lg mb-6 ${isConfigured ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{isConfigured ? '✅' : '❌'}</span>
              <div>
                <p className={`font-bold ${isConfigured ? 'text-green-700' : 'text-red-700'}`}>
                  {isConfigured ? '百度AI已配置' : '百度AI未配置'}
                </p>
                {!isConfigured && (
                  <p className="text-sm text-red-600 mt-1">
                    请在 .env 文件中配置 VITE_BAIDU_API_KEY 和 VITE_BAIDU_SECRET_KEY
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 图片选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. 选择测试图片
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-50 file:text-purple-700
                hover:file:bg-purple-100"
            />
          </div>

          {/* 图片预览 */}
          {previewUrl && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片预览
              </label>
              <img
                src={previewUrl}
                alt="预览"
                className="max-w-md rounded-lg shadow-md"
              />
            </div>
          )}

          {/* 关键词输入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. 输入验证关键词（用逗号分隔）
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="例如：洗漱台, 牙刷, 洗面奶"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              系统会检查图片中是否包含这些内容
            </p>
          </div>

          {/* 识别按钮 */}
          <button
            onClick={handleRecognize}
            disabled={!selectedFile || recognizing || !isConfigured}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg
              hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all transform hover:scale-105 active:scale-95"
          >
            {recognizing ? '识别中...' : '3. 开始识别'}
          </button>

          {/* 识别结果 */}
          {result && (
            <div className="mt-6 space-y-4">
              {result.error ? (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-red-700 font-bold">❌ 识别失败</p>
                  <p className="text-red-600 text-sm mt-1">{result.error}</p>
                </div>
              ) : (
                <>
                  {/* 识别到的内容 */}
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <p className="text-blue-700 font-bold mb-2">🔍 识别到的内容：</p>
                    <div className="flex flex-wrap gap-2">
                      {result.recognizedKeywords.map((keyword: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                    {result.recognizedKeywords.length === 0 && (
                      <p className="text-blue-600 text-sm">未识别到任何内容</p>
                    )}
                  </div>

                  {/* 验证结果 */}
                  <div className={`p-4 rounded-lg border-2 ${
                    result.verifyResult.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`font-bold mb-2 ${
                      result.verifyResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.verifyResult.success ? '✅ 验证通过' : '❌ 验证失败'}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">需要的关键词：</span>
                        <span className="ml-2">{keywords}</span>
                      </div>
                      
                      <div>
                        <span className="font-medium">匹配的关键词：</span>
                        <span className="ml-2">
                          {result.verifyResult.matchedKeywords.length > 0
                            ? result.verifyResult.matchedKeywords.join('、')
                            : '无'}
                        </span>
                      </div>
                      
                      <div>
                        <span className="font-medium">匹配率：</span>
                        <span className="ml-2">
                          {result.verifyResult.matchedKeywords.length} / {keywords.split(',').length} = {
                            Math.round((result.verifyResult.matchedKeywords.length / keywords.split(',').length) * 100)
                          }%
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 说明 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>💡 使用说明：</strong>
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
              <li>选择一张包含物体的照片（例如：洗漱台、书桌、厨房等）</li>
              <li>输入你想验证的关键词（用逗号分隔）</li>
              <li>点击"开始识别"按钮</li>
              <li>系统会显示识别到的所有内容，以及是否匹配你的关键词</li>
              <li>匹配率 ≥ 30% 即为验证通过</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

