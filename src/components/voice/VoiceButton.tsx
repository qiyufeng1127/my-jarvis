/**
 * 免手模式按钮 - 右下角悬浮按钮
 * 支持声波动画反馈
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceControl from './VoiceControl';

export default function VoiceButton() {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 监听麦克风音量
  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1); // 归一化到 0-1
        setAudioLevel(normalizedLevel);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('❌ 启动音频监控失败:', error);
    }
  };

  // 停止音频监控
  const stopAudioMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  };

  // 当免手模式开启时，启动音频监控
  useEffect(() => {
    if (isListening) {
      startAudioMonitoring();
    } else {
      stopAudioMonitoring();
    }

    return () => {
      stopAudioMonitoring();
    };
  }, [isListening]);

  // 清理
  useEffect(() => {
    return () => {
      stopAudioMonitoring();
    };
  }, []);

  return (
    <>
      {/* 右下角悬浮按钮 */}
      <motion.button
        onClick={() => setIsVoiceMode(true)}
        className={`fixed bottom-24 right-6 z-40 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          isListening
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* 声波动画 - 仅在监听且有声音时显示 */}
        <AnimatePresence>
          {isListening && audioLevel > 0.1 && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{
                    scale: 1 + audioLevel * i * 0.3,
                    opacity: 0,
                  }}
                  exit={{ scale: 1, opacity: 0 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* 喇叭图标 */}
        <Volume2
          className={`w-8 h-8 text-white transition-transform ${
            isListening && audioLevel > 0.1 ? 'scale-110' : 'scale-100'
          }`}
        />

        {/* 状态指示点 */}
        {isListening && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
            animate={{
              scale: audioLevel > 0.1 ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: audioLevel > 0.1 ? Infinity : 0,
            }}
          />
        )}
      </motion.button>

      {/* 免手模式弹窗 */}
      <VoiceControl
        isOpen={isVoiceMode}
        onClose={() => {
          setIsVoiceMode(false);
          setIsListening(false);
        }}
        onListeningChange={setIsListening}
      />
    </>
  );
}

