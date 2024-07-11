import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { Container, Card } from 'react-bootstrap';
import moment from 'moment-timezone';

const HomePage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [faceBox, setFaceBox] = useState<faceapi.Box | null>(null);
  const [loggedUsers, setLoggedUsers] = useState<{ [key: string]: number }>({});
  const [lastFaceDetectedTime, setLastFaceDetectedTime] = useState<number | null>(null);

  useEffect(() => {
    const loadFaceModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (error) {
        setError('Error loading models');
        console.error('Error loading models:', error);
      }
    };
    loadFaceModels();
  }, []);

  useEffect(() => {
    const detectFace = async () => {
      if (modelsLoaded && videoRef.current && canvasRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
              setFaceBox(detections.detection.box);
              drawFaceRect(detections.detection.box);

              const now = Date.now();
              const match = await verifyFace(detections.descriptor);
              if (match) {
                const { id, name } = match;
                if (!loggedUsers[id] || now - loggedUsers[id] > 60000) { // Check if more than 1 minute has passed
                  setMessage('Face recognized successfully');
                  successAudioRef.current?.play(); // Play success sound
                  await logFaceData(id, name);
                  setLoggedUsers((prev) => ({ ...prev, [id]: now })); // Update logged time for this user
                  setTimeout(() => {
                    setMessage(null);
                    setIsFaceDetected(false);
                  }, 3000);
                }
              } else {
                setMessage('Face not recognized');
                errorAudioRef.current?.play(); // Play error sound
                setTimeout(() => {
                  setMessage(null);
                }, 3000);
              }

              setLastFaceDetectedTime(now); // Update last detected time
            } else {
              setIsFaceDetected(false);
              setFaceBox(null);
              clearCanvas();

              // If no face is detected for more than 3 seconds, clear lastFaceDetectedTime
              if (lastFaceDetectedTime && Date.now() - lastFaceDetectedTime > 3000) {
                setLastFaceDetectedTime(null);
              }
            }
          }, 1000); // Detect every second

          return () => clearInterval(interval);
        } catch (err) {
          setError('Error accessing the webcam');
          console.error('Error accessing the webcam:', err);
        }
      }
    };

    if (modelsLoaded) {
      detectFace();
    }
  }, [modelsLoaded, loggedUsers, lastFaceDetectedTime]);

  const verifyFace = async (descriptor: Float32Array) => {
    try {
      const response = await axios.post('https://studentunion.uz/api/verify', {
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
      await axios.post('https://studentunion.uz/api/log', {
        employeeId,
        name,
        status: 'success',
        timestamp: moment().tz('Asia/Tashkent').toISOString()
      });
      setMessage('Face data logged successfully');
    } catch (error) {
      console.error('Error logging face data:', error);
    }
  };

  const drawFaceRect = (box: faceapi.Box) => {
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
    <Container>
      <Card className="mt-5">
        <Card.Body>
          {error && <p className="text-danger text-center">{error}</p>}
          {modelsLoaded ? (
            <div style={{ position: 'relative' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                style={{ display: 'block', margin: 'auto', width: '100%', height: '100vh' }}
              />
              <canvas ref={canvasRef} style={{ display: 'block', margin: 'auto', width: '100%', height: '100vh' }} />
              {faceBox && message && (
                <div
                  style={{
                    position: 'absolute',
                    top: faceBox.y,
                    left: faceBox.x,
                    width: faceBox.width,
                    backgroundColor: message === 'Face recognized successfully' ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)',
                    color: 'white',
                    padding: '5px',
                    borderRadius: '5px',
                    textAlign: 'center'
                  }}
                >
                  {message}
                </div>
              )}
              <audio ref={successAudioRef} src="/sounds/success.mp3" />
              <audio ref={errorAudioRef} src="/sounds/error.mp3" />
            </div>
          ) : (
            <p className="text-center">Loading models...</p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default HomePage;
