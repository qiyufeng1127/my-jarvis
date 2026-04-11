import { useState, useCallback, useEffect, useRef } from 'react';

interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceMode?: 'system' | 'edge';
  edgeVoiceName?: string;
}

interface SpeakHandlers {
  onEnd?: () => void;
  onError?: () => void;
}

export type SpeechPlaybackSource = 'system' | 'edge';

const DEFAULT_EDGE_VOICE = 'zh-CN-XiaoxiaoNeural';

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const {
    lang = 'zh-CN',
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    voiceMode = 'system',
    edgeVoiceName = DEFAULT_EDGE_VOICE,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => 'speechSynthesis' in window);
  const [isEdgeVoiceConfigured] = useState(() => Boolean(import.meta.env.VITE_EDGE_TTS_ENDPOINT || '/api/edge-tts'));
  const [playbackSource, setPlaybackSource] = useState<SpeechPlaybackSource>('system');
  const [didFallbackToSystem, setDidFallbackToSystem] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    if (isSupported) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
  }, [isSupported]);

  useEffect(() => () => stop(), [stop]);

  const speakWithSystemVoice = useCallback((text: string, handlers?: SpeakHandlers, fallbackFromEdge = false) => {
    if (!isSupported) {
      console.warn('当前浏览器不支持语音合成');
      handlers?.onError?.();
      return;
    }

    window.speechSynthesis.cancel();
    setPlaybackSource('system');
    setDidFallbackToSystem(fallbackFromEdge);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      handlers?.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('语音合成错误:', event);
      setIsSpeaking(false);
      handlers?.onError?.();
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, lang, rate, pitch, volume]);

  const speakWithEdgeVoice = useCallback(async (text: string, handlers?: SpeakHandlers) => {
    const endpoint = import.meta.env.VITE_EDGE_TTS_ENDPOINT || '/api/edge-tts';

    try {
      stop();
      setPlaybackSource('edge');
      setDidFallbackToSystem(false);
      setIsSpeaking(true);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: edgeVoiceName,
          rate,
          pitch,
          volume,
          lang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Edge TTS 请求失败: ${response.status}`);
      }

      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audio.src);
        audioRef.current = null;
        setIsSpeaking(false);
        handlers?.onEnd?.();
      };

      audio.onerror = () => {
        if (audio.src) {
          URL.revokeObjectURL(audio.src);
        }
        audioRef.current = null;
        setIsSpeaking(false);
        handlers?.onError?.();
      };

      await audio.play();
    } catch (error) {
      console.error('Edge 语音播报失败，自动回退系统语音:', error);
      setIsSpeaking(false);
      speakWithSystemVoice(text, handlers, true);
    }
  }, [edgeVoiceName, lang, pitch, rate, speakWithSystemVoice, stop, volume]);

  const speak = useCallback((text: string, handlers?: SpeakHandlers) => {
    if (voiceMode === 'edge') {
      void speakWithEdgeVoice(text, handlers);
      return;
    }

    speakWithSystemVoice(text, handlers, false);
  }, [voiceMode, speakWithEdgeVoice, speakWithSystemVoice]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      return;
    }

    if (isSupported) {
      window.speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (audioRef.current) {
      void audioRef.current.play();
      return;
    }

    if (isSupported) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    isEdgeVoiceConfigured,
    playbackSource,
    didFallbackToSystem,
    speak,
    stop,
    pause,
    resume,
  };
}
