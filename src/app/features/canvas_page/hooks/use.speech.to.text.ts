'use client';

/**
 * Live voice input via Deepgram WebSocket (PCM stream).
 * Works in Brave / Chromium / Firefox on Linux.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

type DeepgramAlternative = { transcript?: string };
type DeepgramMessage = {
  type?: string;
  is_final?: boolean;
  channel?: { alternatives?: DeepgramAlternative[] };
};

function floatTo16BitPCM(float32: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i] ?? 0));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

async function fetchLiveKey(): Promise<string> {
  const res = await fetch('/api/transcribe/token', { method: 'POST' });
  const data = (await res.json().catch(() => ({}))) as {
    key?: string;
    error?: string;
  };
  if (!res.ok || !data.key) {
    throw new Error(data.error || 'Couldn’t start voice session.');
  }
  return data.key;
}

function buildListenUrl(sampleRate: number): string {
  const url = new URL('wss://api.deepgram.com/v1/listen');
  url.searchParams.set('model', 'nova-2');
  url.searchParams.set('encoding', 'linear16');
  url.searchParams.set('sample_rate', String(sampleRate));
  url.searchParams.set('channels', '1');
  url.searchParams.set('interim_results', 'true');
  url.searchParams.set('punctuate', 'true');
  url.searchParams.set('smart_format', 'true');
  url.searchParams.set('language', 'en');
  return url.toString();
}

export function useSpeechToText(options?: {
  lang?: string;
  onTranscript?: (fullText: string) => void;
}) {
  const onTranscriptRef = useRef(options?.onTranscript);
  onTranscriptRef.current = options?.onTranscript;

  const [isSupported] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof AudioContext !== 'undefined',
  );
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const prefixRef = useRef('');
  const finalsRef = useRef('');
  const interimRef = useRef('');
  const wantListenRef = useRef(false);

  const publishTranscript = useCallback(() => {
    const spoken = `${finalsRef.current} ${interimRef.current}`
      .replace(/\s+/g, ' ')
      .trim();
    const full = [prefixRef.current, spoken].filter(Boolean).join(' ').trim();
    onTranscriptRef.current?.(full);
  }, []);

  const teardownAudio = useCallback(() => {
    try {
      processorRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    try {
      sourceRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    processorRef.current = null;
    sourceRef.current = null;

    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const teardownSocket = useCallback(() => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (!ws) return;
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'CloseStream' }));
      }
      ws.close();
    } catch {
      /* ignore */
    }
  }, []);

  const stop = useCallback(() => {
    wantListenRef.current = false;
    teardownAudio();
    teardownSocket();
    setIsListening(false);
    setIsTranscribing(false);
  }, [teardownAudio, teardownSocket]);

  const start = useCallback(
    async (existingText = '') => {
      setError(null);
      if (!isSupported) {
        setError('Voice input isn’t supported in this browser.');
        return false;
      }

      stop();
      wantListenRef.current = true;
      prefixRef.current = existingText.trim();
      finalsRef.current = '';
      interimRef.current = '';
      setIsTranscribing(true);

      let liveKey: string;
      try {
        liveKey = await fetchLiveKey();
      } catch (err) {
        setIsTranscribing(false);
        setError(err instanceof Error ? err.message : 'Couldn’t start voice session.');
        return false;
      }

      if (!wantListenRef.current) {
        setIsTranscribing(false);
        return false;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 1,
          },
        });
      } catch {
        setIsTranscribing(false);
        setError('Microphone access was blocked. Allow the mic to dictate to Denise.');
        return false;
      }

      if (!wantListenRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        setIsTranscribing(false);
        return false;
      }

      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const sampleRate = audioCtx.sampleRate;
      const wsUrl = buildListenUrl(sampleRate);

      // Deepgram browser auth: Sec-WebSocket-Protocol ["token", apiKey]
      // (JWTs are invalid as subprotocols — we mint a short-lived API key instead)
      const ws = new WebSocket(wsUrl, ['token', liveKey]);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      try {
        await new Promise<void>((resolve, reject) => {
          const onOpen = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error('Couldn’t connect to speech service.'));
          };
          const cleanup = () => {
            ws.removeEventListener('open', onOpen);
            ws.removeEventListener('error', onError);
          };
          ws.addEventListener('open', onOpen);
          ws.addEventListener('error', onError);
        });
      } catch (err) {
        wantListenRef.current = false;
        teardownAudio();
        teardownSocket();
        setIsTranscribing(false);
        setError(err instanceof Error ? err.message : 'Couldn’t connect to speech service.');
        return false;
      }

      if (!wantListenRef.current || wsRef.current !== ws) {
        teardownAudio();
        teardownSocket();
        setIsTranscribing(false);
        return false;
      }

      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') return;
        let msg: DeepgramMessage;
        try {
          msg = JSON.parse(event.data) as DeepgramMessage;
        } catch {
          return;
        }
        if (msg.type && msg.type !== 'Results') return;
        const piece = msg.channel?.alternatives?.[0]?.transcript ?? '';
        if (msg.is_final) {
          if (piece.trim()) {
            finalsRef.current = `${finalsRef.current} ${piece}`.replace(/\s+/g, ' ').trim();
          }
          interimRef.current = '';
        } else {
          interimRef.current = piece;
        }
        publishTranscript();
      };

      ws.onerror = () => {
        if (!wantListenRef.current) return;
        setError('Voice connection glitched. Tap Done or try again.');
      };

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
      };

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      // 4096 buffer — ScriptProcessor is deprecated but reliable cross-browser
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!wantListenRef.current) return;
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        try {
          wsRef.current.send(floatTo16BitPCM(input));
        } catch {
          /* socket closing */
        }
      };

      const mute = audioCtx.createGain();
      mute.gain.value = 0;
      source.connect(processor);
      processor.connect(mute);
      mute.connect(audioCtx.destination);

      setIsTranscribing(false);
      setIsListening(true);
      return true;
    },
    [isSupported, publishTranscript, stop, teardownAudio, teardownSocket],
  );

  /**
   * Stop streaming and return the best transcript so far.
   */
  const finish = useCallback(async (): Promise<string | null> => {
    if (!wantListenRef.current && !isListening) {
      stop();
      return null;
    }

    setIsListening(false);
    setIsTranscribing(true);
    wantListenRef.current = false;

    // Stop mic first so no more audio is sent
    teardownAudio();

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'CloseStream' }));
      } catch {
        /* ignore */
      }
      // Brief wait for final Results after CloseStream
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(() => resolve(), 600);
        const prev = ws.onmessage;
        ws.onmessage = (event) => {
          if (typeof prev === 'function') prev.call(ws, event);
          if (typeof event.data !== 'string') return;
          try {
            const msg = JSON.parse(event.data) as DeepgramMessage;
            if (msg.is_final) {
              const piece = msg.channel?.alternatives?.[0]?.transcript ?? '';
              if (piece.trim()) {
                finalsRef.current = `${finalsRef.current} ${piece}`
                  .replace(/\s+/g, ' ')
                  .trim();
              }
              interimRef.current = '';
              publishTranscript();
            }
          } catch {
            /* ignore */
          }
        };
        ws.addEventListener('close', () => {
          window.clearTimeout(timeout);
          resolve();
        });
      });
    }

    teardownSocket();

    const spoken = `${finalsRef.current} ${interimRef.current}`
      .replace(/\s+/g, ' ')
      .trim();
    const full = [prefixRef.current, spoken].filter(Boolean).join(' ').trim();

    setIsTranscribing(false);

    if (!full || !spoken) {
      setError('Couldn’t catch that — try speaking again a bit louder.');
      return null;
    }

    onTranscriptRef.current?.(full);
    return full;
  }, [isListening, publishTranscript, stop, teardownAudio, teardownSocket]);

  useEffect(() => () => stop(), [stop]);

  return {
    isSupported,
    isListening,
    isTranscribing,
    error,
    clearError: () => setError(null),
    start,
    stop,
    finish,
  };
}
