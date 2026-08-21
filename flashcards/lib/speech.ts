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
