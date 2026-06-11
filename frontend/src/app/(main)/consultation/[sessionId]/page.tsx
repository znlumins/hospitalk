'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mic, MicOff, Send, Video, VideoOff, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SpeechToTextService } from '@/lib/speech-to-text';
import { SignLanguageDetector } from '@/lib/sign-language/detector';
import styles from './consultation.module.css';

export default function ConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sttRef = useRef<any>(null);
  const detectorRef = useRef<SignLanguageDetector | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAIActive, setIsAIActive] = useState(false);

  const [detectedText, setDetectedText] = useState('');
  const [detectedConfidence, setDetectedConfidence] = useState(0);
  const [modelType, setModelType] = useState<'bisindo' | 'sibi'>('bisindo');
  const [isAIReady, setIsAIReady] = useState(false);

  // Initialize Sign Language Detector
  useEffect(() => {
    const detector = new SignLanguageDetector();
    detectorRef.current = detector;

    const checkInterval = setInterval(() => {
      if (detector.isModelLoaded) {
        setIsAIReady(true);
        clearInterval(checkInterval);
      }
    }, 250);

    return () => clearInterval(checkInterval);
  }, []);

  // Sync detector's active model with state
  useEffect(() => {
    if (detectorRef.current) {
      detectorRef.current.activeModel = modelType;
    }
  }, [modelType]);

  // Clear canvas when AI is deactivated
  useEffect(() => {
    if (!isAIActive && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [isAIActive]);

  // Initialize Speech to Text
  useEffect(() => {
    if (isMicOn) {
      sttRef.current = new SpeechToTextService((text: string) => {
        setInputValue(prev => {
          const spacing = prev.trim() ? ' ' : '';
          return prev + spacing + text;
        });
      });
      sttRef.current.start();
    } else {
      if (sttRef.current) {
        sttRef.current.stop();
        sttRef.current = null;
      }
    }

    return () => {
      if (sttRef.current) {
        sttRef.current.stop();
        sttRef.current = null;
      }
    };
  }, [isMicOn]);

  // Initialize Camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isCameraOn) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => console.error("Error accessing camera:", err));
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn]);

  // Real-time AI detection loop
  useEffect(() => {
    let active = true;
    let timeoutId: NodeJS.Timeout;

    const detectFrame = async () => {
      if (!active) return;
      if (isCameraOn && isAIActive && videoRef.current && detectorRef.current) {
        try {
          const result = await detectorRef.current.detectSign(videoRef.current, canvasRef.current);
          if (result && active) {
            setDetectedText(result.text);
            setDetectedConfidence(result.confidence);
            
            // Add translation into the chat log if confidence is solid
            if (result.confidence >= 0.70) {
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.content === result.text && lastMsg.sender_type === 'patient') {
                  return prev; // prevent duplicated logs
                }
                return [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    sender_type: 'patient',
                    content: result.text,
                    timestamp: new Date().toLocaleTimeString(),
                  }
                ];
              });
            }
          }
        } catch (e) {
          console.error("AI frame detection failed:", e);
        }
      }
      
      if (active && isCameraOn && isAIActive) {
        timeoutId = setTimeout(detectFrame, 40); // Poll at ~25 FPS for smooth tracking
      }
    };

    if (isCameraOn && isAIActive) {
      detectFrame();
    }

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [isCameraOn, isAIActive]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender_type: 'doctor', // assuming we are the doctor for now
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
  };

  const handleEndSession = () => {
    // In real app, call API to end session
    router.push(`/consultation/${sessionId}/transcript-review`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sesi Konsultasi: {sessionId.substring(0,8)}...</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="active">Sedang Berlangsung</Badge>
            <span className="text-muted text-sm">Pasien: Budi Santoso</span>
          </div>
        </div>
        <Button variant="danger" icon={<CheckCircle size={18} />} onClick={handleEndSession}>
          Akhiri Sesi
        </Button>
      </div>

      <div className={styles.splitScreen}>
        {/* Left Side: Patient Camera & AI */}
        <div className={styles.cameraSection}>
          <Card className={styles.videoCard}>
            <div className={styles.videoWrapper}>
              {isCameraOn ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={styles.video}
                  />
                  <canvas
                    ref={canvasRef}
                    className={styles.canvas}
                  />
                </>
              ) : (
                <div className={styles.videoPlaceholder}>
                  <VideoOff size={48} className="text-muted" />
                  <p className="mt-2 text-muted">Kamera Nonaktif</p>
                </div>
              )}
              
              {/* AI Overlay Overlay */}
              {isCameraOn && isAIActive && (
                <div className={styles.aiOverlay}>
                  <div className={styles.aiBox}>
                    <span className={styles.aiPulse}></span>
                    {detectedText ? `Terjemahan: ${detectedText} (${Math.round(detectedConfidence * 100)}%)` : 'AI Mendeteksi Isyarat...'}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.controls}>
              <div className={styles.toggleGroup}>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${modelType === 'bisindo' ? styles.toggleBtnActive : ''}`}
                  onClick={() => setModelType('bisindo')}
                >
                  BISINDO
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${modelType === 'sibi' ? styles.toggleBtnActive : ''}`}
                  onClick={() => setModelType('sibi')}
                >
                  SIBI
                </button>
              </div>

              <Button 
                variant={isCameraOn ? 'secondary' : 'primary'} 
                onClick={() => setIsCameraOn(!isCameraOn)}
                icon={isCameraOn ? <Video size={18}/> : <VideoOff size={18}/>}
              >
                {isCameraOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
              </Button>
              <Button 
                variant={isAIActive ? 'primary' : 'secondary'} 
                onClick={() => setIsAIActive(!isAIActive)}
                disabled={!isCameraOn || !isAIReady}
              >
                {isAIActive ? 'AI Aktif' : isAIReady ? 'Aktifkan AI Isyarat' : 'Memuat Model AI...'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Side: Transcript & Chat */}
        <div className={styles.chatSection}>
          <Card className={styles.chatCard}>
            <div className={styles.chatHeader}>
              <h3>Transkrip Percakapan</h3>
            </div>
            
            <div className={styles.messageList}>
              {messages.length === 0 ? (
                <div className={styles.emptyChat}>Belum ada percakapan.</div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`${styles.message} ${styles[msg.sender_type]}`}>
                    <div className={styles.messageContent}>
                      {msg.content}
                    </div>
                    <div className={styles.messageMeta}>
                      {msg.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form className={styles.inputArea} onSubmit={handleSendMessage}>
              <button 
                type="button" 
                className={`${styles.micBtn} ${isMicOn ? styles.micActive : ''}`}
                onClick={() => setIsMicOn(!isMicOn)}
                title="Speech to Text"
              >
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ketik pesan atau gunakan suara..."
                className={styles.input}
              />
              <Button type="submit" icon={<Send size={18} />}>Kirim</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
