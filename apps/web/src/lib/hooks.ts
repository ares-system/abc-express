// ============================================
// ABC Express AIP — React Hooks
// Data fetching, socket, and utility hooks
// ============================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type ApiResponse, type QueryParams, ApiRequestError } from './api-client';
import { io, type Socket } from 'socket.io-client';

// ─── useApi: generic data fetcher ───────────────────────────

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  meta: ApiResponse['meta'] | null;
}

interface UseApiOptions {
  params?: QueryParams;
  enabled?: boolean;
  refreshInterval?: number;
}

export const useApi = <T>(path: string, options: UseApiOptions = {}) => {
  const { params, enabled = true, refreshInterval } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: true,
    error: null,
    meta: null,
  });

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await api.get<T>(path, paramsRef.current);
      setState({ data: res.data, isLoading: false, error: null, meta: res.meta ?? null });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'An error occurred';
      setState((s) => ({ ...s, isLoading: false, error: message }));
    }
  }, [path, enabled]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Polling
  useEffect(() => {
    if (!refreshInterval || !enabled) return;
    const id = setInterval(fetch, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, enabled, fetch]);

  return { ...state, refetch: fetch };
};

// ─── useMutation: POST/PUT/PATCH/DELETE ─────────────────────

interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export const useMutation = <TReq = unknown, TRes = unknown>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: UseMutationOptions<TRes> = {},
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (body?: TReq, pathSuffix?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const fullPath = pathSuffix ? `${path}${pathSuffix}` : path;
        let res: ApiResponse<TRes>;
        switch (method) {
          case 'POST':
            res = await api.post<TRes>(fullPath, body);
            break;
          case 'PUT':
            res = await api.put<TRes>(fullPath, body);
            break;
          case 'PATCH':
            res = await api.patch<TRes>(fullPath, body);
            break;
          case 'DELETE':
            res = await api.delete<TRes>(fullPath);
            break;
        }
        options.onSuccess?.(res.data);
        return res.data;
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : 'An error occurred';
        setError(message);
        options.onError?.(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [method, path, options],
  );

  return { mutate, isLoading, error };
};

// ─── useSocket: Socket.IO connection ────────────────────────

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
let sharedSocket: Socket | null = null;

const getSocket = (): Socket => {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return sharedSocket;
};

export const useSocket = (
  rooms: string[] = [],
  events: Record<string, (data: unknown) => void> = {},
): { socket: Socket | null; connected: boolean } => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) setConnected(true);

    // Join rooms
    for (const room of rooms) {
      socket.emit('join', room);
    }

    // Register event listeners
    for (const [event, handler] of Object.entries(events)) {
      socket.on(event, handler);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      for (const [event, handler] of Object.entries(events)) {
        socket.off(event, handler);
      }
      for (const room of rooms) {
        socket.emit('leave', room);
      }
    };
  }, [rooms.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { socket: socketRef.current, connected };
};

// ─── useDebounce ────────────────────────────────────────────

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// ─── useLocalStorage ────────────────────────────────────────

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or unavailable
    }
  }, [key, value]);

  return [value, setValue] as const;
};
