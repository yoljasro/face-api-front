import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';

const HomePage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        setModelsLoaded(true);
      } catch (err) {
        setError('Failed to load models');
        console.error('Failed to load models', err);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    const detectFace = async () => {
      if (modelsLoaded && videoRef.current && canvasRef.current) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
              const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
              faceapi.matchDimensions(canvasRef.current, displaySize);

              const interval = setInterval(async () => {
                const detections = await faceapi.detectSingleFace(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
                  .withFaceLandmarks()
                  .withFaceDescriptor();

                if (detections) {
                  setIsFaceDetected(true);
                  drawFaceRect(detections.detection.box);
                  try {
                    const match = await verifyFace(detections.descriptor);
                    if (match) {
                      setMessage('Face recognized successfully');
                      await logFaceData(match.id, match.name);
                      clearInterval(interval);
                    }
                  } catch (error) {
                    console.error('Error verifying face:', error);
                  }
                } else {
                  setIsFaceDetected(false);
                  clearCanvas();
                }
              }, 5000); // Detect every 5 seconds
            }
          })
          .catch(err => {
            setError('Error accessing the webcam');
            console.error('Error accessing the webcam:', err);
          });
      }
    };

    detectFace();
  }, [modelsLoaded]);

  const verifyFace = async (descriptor: Float32Array) => {
    try {
      const response = await axios.post('http://localhost:5000/api/verify', {
        descriptor: Array.from(descriptor)
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying face:', error);
      return null;
    }
  };

  const logFaceData = async (employeeId: string, name: string) => {
    try {
      await axios.post('http://localhost:5000/api/log', {
        employeeId,
        name,
        status: 'success',
        timestamp: new Date().toISOString()
      });
      setMessage('Face data logged successfully');
    } catch (error) {
      console.error('Error logging face data:', error);
    }
  };

  const drawFaceRect = (box: faceapi.Rect) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.strokeStyle = isFaceDetected ? 'green' : 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div>
      <h1>Face Recognition App</h1>
      {error && <p>{error}</p>}
      {modelsLoaded ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            width="100%"
            height="800"
            style={{ display: 'block', margin: 'auto' }}
          />
          <canvas ref={canvasRef} width="100%" height="800" style={{ display: 'block', margin: 'auto' }} />
        </>
      ) : (
        <p>Loading models...</p>
      )}
      {message && <p style={{ color: isFaceDetected ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
};

export default HomePage;
