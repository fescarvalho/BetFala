import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, X } from 'lucide-react';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (data: any) => void;
}

export default function VoiceRecorderModal({ isOpen, onClose, onResult }: VoiceRecorderModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopRecording(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setElapsedTime(0);

      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Limita a gravação a 20 segundos
      timerRef.current = setTimeout(() => {
        stopRecording(true);
      }, 20000);
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = (process = true) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      if (!process) {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        const res = await fetch('/api/parse-print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64Audio }),
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Erro ao processar áudio');
          setIsProcessing(false);
          return;
        }

        onResult(data);
        setIsProcessing(false);
        onClose();
      };
    } catch (err) {
      console.error('Error processing audio', err);
      alert('Erro ao processar áudio');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-neutral-900 rounded-3xl p-8 max-w-sm w-full border border-neutral-800 shadow-2xl flex flex-col items-center text-center" style={{ padding: '20px' }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-2 rounded-full hover:bg-neutral-800"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-white mb-8" style={{ marginBottom: '20px' }}>
          {isProcessing ? 'Analisando áudio...' : isRecording ? 'Gravando...' : 'Gravação de Voz'}
        </h3>

        <div className="relative flex items-center justify-center mb-8">
          {/* ONDAS DE VOZ (Pulse effect) */}
          {isRecording && (
            <>
              <div className="absolute w-32 h-32 bg-violet-600/30 rounded-full animate-ping" />
              <div className="absolute w-40 h-40 bg-violet-600/20 rounded-full animate-pulse" />
            </>
          )}

          {/* BOTÃO CENTRAL */}
          <button
            onClick={isRecording ? () => stopRecording(true) : startRecording}
            disabled={isProcessing}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg 
              ${isProcessing ? 'bg-neutral-800 text-violet-500' :
                isRecording ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/50' :
                  'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-600/50'
              }`}
          >
            {isProcessing ? (
              <Loader2 size={32} className="animate-spin" />
            ) : isRecording ? (
              <Square size={28} className="fill-current" />
            ) : (
              <Mic size={32} />
            )}
          </button>
        </div>

        {isRecording && (
          <div className="text-violet-400 font-mono text-lg mb-4">
            00:{String(elapsedTime).padStart(2, '0')} / 00:20
          </div>
        )}

        <p className="text-neutral-400 text-sm" style={{ marginTop: '20px' }}>
          Diga algo como: "Apostei 50 reais no Flamengo, odd 1.80, e deu Green!"
        </p>
      </div>
    </div>
  );
}
