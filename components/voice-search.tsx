"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, X, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceSearchProps {
  /** Called with the final transcript. Second arg (response) is optional. */
  onResult: (command: string, response?: string) => void;
  className?: string;
  /** Compact mode renders just a mic icon button -- good for embedding in inputs */
  compact?: boolean;
}

export function VoiceSearch({ onResult, className, compact = false }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const processResult = useCallback(async (finalText: string) => {
    if (!finalText.trim()) return;

    if (compact) {
      // In compact mode, just pass the transcript directly -- no API call
      onResult(finalText);
      setTranscript("");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/voice/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: finalText }),
      });
      const data = await res.json();
      const response = data.response || "Command processed";
      setLastResponse(response);
      onResult(finalText, response);
    } catch {
      setError("Failed to process voice command");
    } finally {
      setIsProcessing(false);
    }
  }, [compact, onResult]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition not supported");
      return;
    }

    setError(null);
    setTranscript("");
    setLastResponse(null);
    transcriptRef.current = "";

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      const current = finalTranscript || interimTranscript;
      setTranscript(current);
      transcriptRef.current = current;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (event.error !== "aborted") {
        setError(`Recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalText = transcriptRef.current;
      processResult(finalText);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, processResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const dismiss = useCallback(() => {
    setTranscript("");
    setLastResponse(null);
    setError(null);
  }, []);

  // Compact mode -- just a mic icon button
  if (compact) {
    return (
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing || !isSupported}
        className={cn(
          "flex items-center justify-center rounded-md transition-colors",
          isListening
            ? "animate-pulse text-destructive"
            : "text-muted-foreground hover:text-foreground",
          !isSupported && "cursor-not-allowed opacity-30",
          className
        )}
        aria-label={isListening ? "Stop listening" : "Voice search"}
        title={isListening ? "Listening... click to stop" : "Search by voice"}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>
    );
  }

  // Full mode -- button + transcript + response
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing || !isSupported}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
            isListening
              ? "animate-pulse bg-destructive/20 text-destructive ring-2 ring-destructive/30"
              : isProcessing
                ? "cursor-wait bg-primary/10 text-primary"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary"
          )}
          aria-label={isListening ? "Stop listening" : "Start voice command"}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isProcessing ? "Processing..." : isListening ? "Listening..." : "Voice"}
          </span>
        </button>

        {(isListening || transcript) && (
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-1.5">
            {isListening && (
              <Volume2 className="h-3 w-3 shrink-0 animate-pulse text-primary" />
            )}
            <p className="flex-1 truncate text-xs text-foreground">
              {transcript || "Speak now..."}
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {lastResponse && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-xs text-foreground">{lastResponse}</p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
