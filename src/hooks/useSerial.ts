import { useState, useRef, useCallback, useEffect } from 'react';
import { LineBuffer } from '../utils/parser';

interface UseSerialOptions {
  onLine: (line: string) => void;
  onError?: (err: string) => void;
}

export function useSerial({ onLine, onError }: UseSerialOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [portName, setPortName] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // References to keep serial port resources
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const isReadingRef = useRef<boolean>(false);
  const lineBufferRef = useRef<LineBuffer>(new LineBuffer());

  // Check if browser supports Web Serial API
  useEffect(() => {
    const supported = typeof navigator !== 'undefined' && 'serial' in navigator;
    setIsSupported(supported);
  }, []);

  // Listen for hardware disconnect events
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serial' in navigator)) return;

    const handleDisconnect = (e: any) => {
      if (portRef.current && e.target === portRef.current) {
        disconnect();
        onError?.('Hardware disconnected');
      }
    };

    (navigator as any).serial.addEventListener('disconnect', handleDisconnect);
    return () => {
      (navigator as any).serial?.removeEventListener('disconnect', handleDisconnect);
    };
  }, [onError]);

  // Read loop
  const readLoop = async (port: any) => {
    const decoder = new TextDecoder();
    isReadingRef.current = true;

    try {
      while (port.readable && isReadingRef.current) {
        const reader = port.readable.getReader();
        readerRef.current = reader;

        try {
          while (isReadingRef.current) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }
            if (value) {
              const textChunk = decoder.decode(value, { stream: true });
              const lines = lineBufferRef.current.push(textChunk);
              for (const line of lines) {
                if (line.trim().length > 0) {
                  onLine(line);
                }
              }
            }
          }
        } catch (readError: any) {
          if (isReadingRef.current) {
            console.error('Serial read error:', readError);
            onError?.(readError.message || 'Error reading from serial port');
          }
        } finally {
          reader.releaseLock();
          readerRef.current = null;
        }
      }
    } catch (err: any) {
      if (isReadingRef.current) {
        console.error('Serial stream error:', err);
      }
    }
  };

  // Connect
  const connect = useCallback(async () => {
    if (!isSupported) {
      onError?.('Web Serial is not supported in this browser. Please use Chrome, Edge, or Opera.');
      return;
    }

    try {
      setIsConnecting(true);
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });

      portRef.current = port;
      setPortName('Arduino USB Serial (9600 baud)');
      setIsConnected(true);
      setIsConnecting(false);

      // Start asynchronous read loop
      readLoop(port);
    } catch (err: any) {
      setIsConnecting(false);
      // User cancelled port picker or error occurred
      if (err.name !== 'NotFoundError') {
        const msg = err.message || 'Failed to open serial port';
        onError?.(msg);
      }
    }
  }, [isSupported, onError, onLine]);

  // Disconnect
  const disconnect = useCallback(async () => {
    isReadingRef.current = false;

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        // Ignore cancel errors
      }
      readerRef.current = null;
    }

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
      portRef.current = null;
    }

    lineBufferRef.current.clear();
    setIsConnected(false);
    setIsConnecting(false);
    setPortName(null);
  }, []);

  // Send Command
  const sendCommand = useCallback(async (command: string): Promise<boolean> => {
    if (!portRef.current || !portRef.current.writable) {
      onError?.('Serial port is not connected or writable');
      return false;
    }

    try {
      const writer = portRef.current.writable.getWriter();
      const encoder = new TextEncoder();
      const formatted = command.endsWith('\n') ? command : `${command}\n`;
      await writer.write(encoder.encode(formatted));
      writer.releaseLock();
      return true;
    } catch (err: any) {
      console.error('Serial send error:', err);
      onError?.(err.message || 'Failed to send command to serial port');
      return false;
    }
  }, [onError]);

  return {
    isConnected,
    isConnecting,
    isSupported,
    portName,
    connect,
    disconnect,
    sendCommand,
  };
}
