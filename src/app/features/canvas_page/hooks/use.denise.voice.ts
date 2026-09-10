'use client';

/**
 * Streams Denise’s Cartesia PCM and plays with low latency.
 * Text can appear while audio for early sentences is already playing.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeakMode = 'roast' | 'help';
type SpeakPhase = 'interview' | 'fixes';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

class PcmStreamPlayer {
  private ctx: AudioContext | null = null;
  private nextTime = 0;
  private sampleRate = 44100;
  private sources: AudioBufferSourceNode[] = [];
  private endedTimer: ReturnType<typeof setTimeout> | null = null;
  onIdle: (() => void) | null = null;

  async ensure(sampleRate: number) {
    this.sampleRate = sampleRate;
    if (!this.ctx || this.ctx.state === 'closed') {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctx({ sampleRate });
      this.nextTime = 0;
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  enqueue(pcm: ArrayBuffer, sampleRate = this.sampleRate) {
    void this.ensure(sampleRate).then(() => {
      const ctx = this.ctx;
      if (!ctx) return;

      const int16 = new Int16Array(pcm);
      if (!int16.length) return;
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = (int16[i] ?? 0) / 32768;
      }

      const buffer = ctx.createBuffer(1, float32.length, sampleRate);
      buffer.copyToChannel(float32, 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const startAt = Math.max(ctx.currentTime + 0.04, this.nextTime);
      source.start(startAt);
      this.nextTime = startAt + buffer.duration;
      this.sources.push(source);

      source.onended = () => {
        this.sources = this.sources.filter((s) => s !== source);
        this.armIdleWatch();
      };
      this.armIdleWatch();
    });
  }

  private armIdleWatch() {
    if (this.endedTimer) clearTimeout(this.endedTimer);
    const ctx = this.ctx;
    if (!ctx) return;
    const remainingMs = Math.max(0, (this.nextTime - ctx.currentTime) * 1000) + 80;
    this.endedTimer = setTimeout(() => {
      if (this.sources.length === 0) this.onIdle?.();
    }, remainingMs);
  }

  stop() {
    if (this.endedTimer) {
      clearTimeout(this.endedTimer);
      this.endedTimer = null;
    }
    for (const source of this.sources) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
    this.nextTime = 0;
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
    }
  }
}

export function useDeniseVoice() {
  const playerRef = useRef<PcmStreamPlayer | null>(null);
  const requestIdRef = useRef(0);
  const streamActiveRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPlayer = useCallback(() => {
    if (!playerRef.current) {
      playerRef.current = new PcmStreamPlayer();
      playerRef.current.onIdle = () => {
        if (streamActiveRef.current) setIsSpeaking(false);
      };
    }
    return playerRef.current;
  }, []);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    streamActiveRef.current = false;
    playerRef.current?.stop();
    playerRef.current = null;
    setIsSpeaking(false);
  }, []);

  const pushPcm = useCallback(
    (base64: string, sampleRate: number) => {
      if (!streamActiveRef.current) return;
      setIsSpeaking(true);
      setError(null);
      getPlayer().enqueue(base64ToArrayBuffer(base64), sampleRate);
    },
    [getPlayer],
  );

  /** Fallback: speak a full finished reply (non-stream). */
  const speak = useCallback(
    async (
      text: string,
      mode: SpeakMode,
      phase?: SpeakPhase | null,
    ) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const requestId = ++requestIdRef.current;
      streamActiveRef.current = false;
      playerRef.current?.stop();
      playerRef.current = null;
      setError(null);
      setIsSpeaking(true);

      try {
        const res = await fetch('/api/denise/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, mode, phase: phase ?? null }),
        });
        if (requestId !== requestIdRef.current) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || 'Couldn’t play Denise’s voice.');
        }
        const buffer = await res.arrayBuffer();
        if (requestId !== requestIdRef.current) return;

        const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }));
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (requestId === requestIdRef.current) setIsSpeaking(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          if (requestId === requestIdRef.current) {
            setError('Couldn’t play Denise’s voice.');
            setIsSpeaking(false);
          }
        };
        await audio.play();
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setIsSpeaking(false);
        setError(err instanceof Error ? err.message : 'Couldn’t play Denise’s voice.');
      }
    },
    [],
  );

  useEffect(() => () => stop(), [stop]);

  return {
    speak,
    pushPcm,
    stop,
    beginStreamSpeak: () => {
      stop();
      streamActiveRef.current = true;
      setError(null);
      setIsSpeaking(true);
      getPlayer();
    },
    isSpeaking,
    error,
    clearError: () => setError(null),
    noteVoiceError: (message: string) => setError(message),
  };
}
