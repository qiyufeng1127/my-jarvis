import { useState, useEffect } from 'react';

interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
) {
  const serializer = options?.serializer ?? JSON.stringify;
  const deserializer = options?.deserializer ?? JSON.parse;

  // 从 localStorage 读取初始值
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? deserializer(item) : initialValue;
    } catch (error) {
      console.warn(`读取 localStorage 键 "${key}" 失败:`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 更新 localStorage 和状态
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, serializer(valueToStore));
      }
    } catch (error) {
      console.warn(`设置 localStorage 键 "${key}" 失败:`, error);
    }
  };

  // 监听其他标签页的变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(deserializer(e.newValue));
        } catch (error) {
          console.warn(`解析 localStorage 键 "${key}" 失败:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]); // 移除 deserializer 依赖，避免无限循环

  return [storedValue, setValue] as const;
}

