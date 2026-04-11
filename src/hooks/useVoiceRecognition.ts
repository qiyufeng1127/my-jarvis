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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const onListeningChangeRef = useRef(onListeningChange);
  const restartOnEndRef = useRef(restartOnEnd);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
    onListeningChangeRef.current = onListeningChange;
    restartOnEndRef.current = restartOnEnd;
  }, [onResult, onError, onListeningChange, restartOnEnd]);

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
      isListeningRef.current = true;
      setIsListening(true);
      onListeningChangeRef.current?.(true);
    };

    recognitionInstance.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      onListeningChangeRef.current?.(false);
      if (restartOnEndRef.current) {
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

      if (lastResult.isFinal) {
        onResultRef.current?.(transcriptText);
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('语音识别错误:', event.error);
      isListeningRef.current = false;
      setIsListening(false);
      onListeningChangeRef.current?.(false);
      onErrorRef.current?.(event.error);
    };

    recognitionRef.current = recognitionInstance;

    return () => {
      recognitionRef.current = null;
      recognitionInstance.abort();
    };
  }, [lang, continuous, interimResults]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!autoStart || !recognition || isListeningRef.current) return;
    try {
      recognition.start();
    } catch (error) {
      console.error('启动语音识别失败:', error);
    }
  }, [autoStart]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition && !isListeningRef.current) {
      try {
        recognition.start();
      } catch (error) {
        console.error('启动语音识别失败:', error);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition && isListeningRef.current) {
      recognition.stop();
    }
  }, []);

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
