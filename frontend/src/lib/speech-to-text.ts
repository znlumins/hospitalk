/**
 * Wrapper untuk Web Speech API / Google Speech-to-Text
 */

export class SpeechToTextService {
  private recognition: any = null;
  private isListening = false;

  constructor(private onResult: (text: string) => void) {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'id-ID';

        this.recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            this.onResult(finalTranscript);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
        };
      } else {
        console.warn('Speech Recognition API not supported in this browser.');
      }
    }
  }

  public start() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
