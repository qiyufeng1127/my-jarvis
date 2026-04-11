import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseVoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  autoStart?: boolean;
  restartOnEnd?: boolean;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onListeningChange?: (listening: boolean) => void;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const {
    lang = 'zh-CN',
    continuous = false,
    interimResults = false,
    autoStart = false,
    restartOnEnd = false,
    onResult,
    onError,
    onListeningChange,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setIsSupported(false);
      console.warn('当前浏览器不支持语音识别');
      return;
    }

    setIsSupported(true);
    const recognitionInstance = new RecognitionCtor();
    recognitionInstance.continuous = continuous;
    recognitionInstance.interimResults = interimResults;
    recognitionInstance.lang = lang;

    recognitionInstance.onstart = () => {
      setIsListening(true);
      onListeningChange?.(true);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      onListeningChange?.(false);
      if (restartOnEnd) {
        window.setTimeout(() => {
          try {
            recognitionInstance.start();
          } catch (error) {
            console.error('重启语音识别失败:', error);
          }
        }, 180);
      }
    };

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcriptText = lastResult[0].transcript.trim();

      setTranscript(transcriptText);

      if (onResult && lastResult.isFinal) {
        onResult(transcriptText);
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('语音识别错误:', event.error);
      setIsListening(false);
      onListeningChange?.(false);
      onError?.(event.error);
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.abort();
    };
  }, [lang, continuous, interimResults, onResult, onError, onListeningChange, restartOnEnd]);

  useEffect(() => {
    if (!autoStart || !recognition || isListening) return;
    try {
      recognition.start();
    } catch (error) {
      console.error('启动语音识别失败:', error);
    }
  }, [autoStart, recognition, isListening]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
      } catch (error) {
        console.error('启动语音识别失败:', error);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  };
}
