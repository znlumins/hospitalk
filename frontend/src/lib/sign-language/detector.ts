/**
 * Integrasi TensorFlow.js dan MediaPipe Hand Landmark Detection untuk client-side prediction.
 */

let tf: any = null;

function calculateDistances(landmarks: any[]): number[] {
  if (landmarks.length !== 21) {
    return new Array(210).fill(0.0);
  }
  const points = landmarks.map(lm => [lm.x, lm.y, lm.z]);
  const distances: number[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p1 = points[i];
      const p2 = points[j];
      const dist = Math.sqrt(
        Math.pow(p1[0] - p2[0], 2) +
        Math.pow(p1[1] - p2[1], 2) +
        Math.pow(p1[2] - p2[2], 2)
      );
      distances.push(dist);
    }
  }
  const maxDist = distances.length > 0 ? Math.max(...distances) : 1;
  return distances.map(d => d / maxDist);
}

export class SignLanguageDetector {
  public isModelLoaded = false;
  private handsInstance: any = null;
  private latestResults: any = null;
  private isProcessing = false;
  
  public activeModel: 'bisindo' | 'sibi' = 'bisindo';
  private tfjsModels: {
    bisindo: { model: any; classes: string[] } | null;
    sibi: { model: any; classes: string[] } | null;
  } = { bisindo: null, sibi: null };

  constructor() {
    this.initModel();
  }

  /**
   * Helper to load scripts dynamically in the browser
   */
  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  }

  /**
   * Loads a TensorFlow.js model from JSON weights
   */
  private async loadTFJSModel(modelName: 'bisindo' | 'sibi', numFeatures: number) {
    try {
      if (typeof window === 'undefined') return null;
      if (!tf) {
        tf = await import('@tensorflow/tfjs');
      }

      console.log(`Loading TensorFlow.js weights for ${modelName.toUpperCase()}...`);
      const response = await fetch(`/model/model_${modelName}_tfjs.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch /model/model_${modelName}_tfjs.json`);
      }

      const data = await response.json();
      const classes = data.classes;
      const w1 = data.w1;
      const b1 = data.b1;
      const w2 = data.w2;
      const b2 = data.b2;
      const w3 = data.w3;
      const b3 = data.b3;

      const numClasses = classes.length;
      
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [numFeatures] }));
      model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
      model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

      // Load weights into the layers
      model.layers[0].setWeights([tf.tensor2d(w1), tf.tensor1d(b1)]);
      model.layers[1].setWeights([tf.tensor2d(w2), tf.tensor1d(b2)]);
      model.layers[2].setWeights([tf.tensor2d(w3), tf.tensor1d(b3)]);

      console.log(`TensorFlow.js model for ${modelName.toUpperCase()} loaded and initialized successfully.`);
      return { model, classes };
    } catch (e) {
      console.error(`Failed to load TFJS weights for ${modelName}:`, e);
      return null;
    }
  }

  /**
   * Inisialisasi model MediaPipe & TensorFlow.js di browser client-side
   */
  private async initModel() {
    if (typeof window === 'undefined') return;
    try {
      console.log('Waiting for MediaPipe Hands to be available...');

      // Poll to wait for window.Hands to be fully evaluated/loaded
      let retries = 50;
      while (!(window as any).Hands && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries--;
      }

      const mpHands = (window as any).Hands;
      if (!mpHands) {
        throw new Error('MediaPipe Hands is not loaded on window object');
      }

      this.handsInstance = new mpHands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.handsInstance.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.handsInstance.onResults((results: any) => {
        this.latestResults = results;
      });

      // Load TF.js models in background
      const [bisindoData, sibiData] = await Promise.all([
        this.loadTFJSModel('bisindo', 420),
        this.loadTFJSModel('sibi', 210)
      ]);

      this.tfjsModels.bisindo = bisindoData;
      this.tfjsModels.sibi = sibiData;

      // Warm up / set loaded
      this.isModelLoaded = true;
      console.log('MediaPipe Hands and TF.js models initialized successfully.');
    } catch (error) {
      console.error('Failed to load sign language model:', error);
    }
  }

  public async detectSign(
    videoElement: HTMLVideoElement, 
    canvasElement?: HTMLCanvasElement | null
  ): Promise<{ text: string; confidence: number } | null> {
    if (!this.isModelLoaded || !this.handsInstance) return null;

    if (this.isProcessing) return null;

    try {
      this.isProcessing = true;
      // Send the current frame to MediaPipe Hands for tracking
      await this.handsInstance.send({ image: videoElement });

      if (!this.latestResults) return null;

      const landmarksList = this.latestResults.multiHandLandmarks;
      const handednessList = this.latestResults.multiHandedness;

      // Draw hand skeleton overlay on canvas if provided
      if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        if (ctx) {
          // Clear previous frame drawing
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          
          if (videoElement.videoWidth && canvasElement.width !== videoElement.videoWidth) {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
          }

          if (landmarksList && landmarksList.length > 0) {
            const width = canvasElement.width;
            const height = canvasElement.height;

            // Draw connections (skeleton lines)
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#00E5FF'; // neon cyan
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00E5FF';

            const HAND_CONNECTIONS = [
              [0, 1], [1, 2], [2, 3], [3, 4],
              [0, 5], [5, 6], [6, 7], [7, 8],
              [5, 9], [9, 10], [10, 11], [11, 12],
              [9, 13], [13, 14], [14, 15], [15, 16],
              [13, 17], [17, 18], [18, 19], [19, 20],
              [0, 17]
            ];

            for (const landmarks of landmarksList) {
              for (const connection of HAND_CONNECTIONS) {
                const p1 = landmarks[connection[0]];
                const p2 = landmarks[connection[1]];
                if (p1 && p2) {
                  ctx.beginPath();
                  ctx.moveTo(p1.x * width, p1.y * height);
                  ctx.lineTo(p2.x * width, p2.y * height);
                  ctx.stroke();
                }
              }
            }
            ctx.restore();

            // Draw joint dots
            ctx.save();
            for (const landmarks of landmarksList) {
              for (let i = 0; i < landmarks.length; i++) {
                const lm = landmarks[i];
                ctx.beginPath();
                ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
                
                if (i === 4 || i === 8 || i === 12 || i === 16 || i === 20) {
                  ctx.fillStyle = '#FF3D00'; // neon red/orange for fingertips
                  ctx.shadowBlur = 6;
                  ctx.shadowColor = '#FF3D00';
                } else {
                  ctx.fillStyle = '#FFFFFF'; // white for joints
                  ctx.shadowBlur = 4;
                  ctx.shadowColor = '#00E5FF';
                }
                ctx.fill();
              }
            }
            ctx.restore();
          }
        }
      }

      if (!landmarksList || landmarksList.length === 0) {
        return null; // No hand tracked in the current frame
      }

      // Preprocessing landmarks into features
      let features: number[];
      const modelType = this.activeModel;
      const modelData = this.tfjsModels[modelType];

      if (!modelData) {
        console.warn(`Model ${modelType.toUpperCase()} is not loaded yet.`);
        return null;
      }

      if (modelType === 'sibi') {
        // SIBI uses single hand (210 features)
        features = calculateDistances(landmarksList[0]);
      } else {
        // BISINDO uses two hands (420 features)
        features = new Array(420).fill(0.0);
        for (let idx = 0; idx < landmarksList.length; idx++) {
          if (idx >= handednessList.length) break;
          const label = handednessList[idx].label;
          const dists = calculateDistances(landmarksList[idx]);
          
          if (label === 'Left' || label === 'left') {
            for (let i = 0; i < 210; i++) {
              features[i] = dists[i];
            }
          } else {
            for (let i = 0; i < 210; i++) {
              features[210 + i] = dists[i];
            }
          }
        }
      }

      // Run inference in TensorFlow.js
      if (!tf) {
        tf = await import('@tensorflow/tfjs');
      }

      const inputTensor = tf.tensor2d([features]);
      const predictionTensor = modelData.model.predict(inputTensor) as any;
      const predictionData = await predictionTensor.data();
      
      // Clean up tensors immediately to avoid WebGL memory leak
      inputTensor.dispose();
      predictionTensor.dispose();

      // Find ArgMax (highest probability class)
      let maxIdx = 0;
      let maxVal = -1;
      for (let i = 0; i < predictionData.length; i++) {
        if (predictionData[i] > maxVal) {
          maxVal = predictionData[i];
          maxIdx = i;
        }
      }

      const predictedText = modelData.classes[maxIdx] || '--';
      const confidenceScore = maxVal;

      if (predictedText === '--' || predictedText === 'Model Error' || predictedText === 'Error') {
        return null;
      }

      // Poin PRD: Penyimpanan Fallback Media jika confidence rendah
      if (confidenceScore < 0.70) {
        this.triggerFallbackMediaUpload(videoElement);
      }

      return {
        text: predictedText,
        confidence: confidenceScore
      };
    } catch (e) {
      console.error('Error during hand landmark detection/prediction:', e);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Menangani perekaman video 1-3 detik jika AI ragu, lalu upload ke Supabase.
   */
  private triggerFallbackMediaUpload(videoElement: HTMLVideoElement) {
    console.warn("Low confidence detected. Capturing fallback media...");
    
    try {
      const stream = (videoElement as any).captureStream ? (videoElement as any).captureStream() : null;
      if (!stream) {
        console.error("Browser does not support captureStream()");
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const fileName = `fallback_${Date.now()}.webm`;
        const file = new File([blob], fileName, { type: 'video/webm' });

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileName', fileName);

          const response = await fetch('/api/fallback-upload', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            const errResult = await response.json();
            throw new Error(errResult.error || 'Upload failed');
          }

          const result = await response.json();
          console.log(`Fallback media successfully uploaded via API: ${result.path}`);
        } catch (uploadError) {
          console.error("Failed to upload fallback media via API:", uploadError);
        }
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 2000);

    } catch (e) {
      console.error("Failed to initialize MediaRecorder for fallback:", e);
    }
  }
}
