'use client';

import { useState, useCallback, useRef } from 'react';
import { VOICE_SUGGESTIONS } from '@/lib/mock-data';

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

// ============================================================
// Hook para captura de voz — Web Speech API com fallback mock
// ============================================================
export function useVoiceInput(
  onResult: (text: string) => void
): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    setTranscript('');
    setIsListening(true);

    if (isSupported) {
      // Web Speech API real
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        onResult(text);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        // Fallback para mock em caso de erro
        simulateVoiceInput();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      // Simulação para browsers sem suporte
      simulateVoiceInput();
    }

    function simulateVoiceInput() {
      mockTimerRef.current = setTimeout(() => {
        const mockText =
          VOICE_SUGGESTIONS[
            Math.floor(Math.random() * VOICE_SUGGESTIONS.length)
          ];
        setTranscript(mockText);
        onResult(mockText);
        setIsListening(false);
      }, 2000);
    }
  }, [isSupported, onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mockTimerRef.current) {
      clearTimeout(mockTimerRef.current);
    }
    setIsListening(false);
  }, []);

  return { isListening, transcript, startListening, stopListening, isSupported };
}
