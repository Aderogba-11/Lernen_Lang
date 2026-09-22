"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionAlternativeLike = { transcript: string };
type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
};
type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return typeof ctor === "function" ? (ctor as new () => RecognitionLike) : null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function listenForSpeech(lang: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const ctor = getRecognitionCtor();
    if (!ctor) {
      reject(new Error("unsupported"));
      return;
    }

    const recognition = new ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    let finalText = "";
    let settled = false;

    const finish = (fn: () => void) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };

    recognition.onresult = (event) => {
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        }
      }
    };
    recognition.onerror = (event) => {
      finish(() => reject(new Error(event?.error ?? "speech-error")));
    };
    recognition.onend = () => {
      finish(() => {
        if (finalText.trim()) {
          resolve(finalText.trim());
        } else {
          reject(new Error("no-speech"));
        }
      });
    };

    try {
      recognition.start();
    } catch {
      finish(() => reject(new Error("start-failed")));
    }
  });
}

export type AudioStatus = "idle" | "loading" | "playing";

export function usePronunciation(
  text: string,
  langCode: string,
  audioUrl: string | null,
) {
  const [status, setStatus] = useState<AudioStatus>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakWithTts = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("idle");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.85;
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utterance);
    setStatus("playing");
  }, [text, langCode]);

  const play = useCallback(() => {
    if (typeof window === "undefined") return;
    stop();

    if (audioUrl) {
      setStatus("loading");
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      const onPlaying = () => setStatus("playing");
      const onEnded = () => {
        setStatus("idle");
        audioRef.current = null;
      };
      const onError = () => {
        audio.removeEventListener("playing", onPlaying);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("error", onError);
        audio.pause();
        audioRef.current = null;
        speakWithTts();
      };

      audio.addEventListener("playing", onPlaying);
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("error", onError);

      audio.play().catch(() => {
        onError();
      });
      return;
    }

    speakWithTts();
  }, [audioUrl, speakWithTts, stop]);

  return { status, play, stop };
}