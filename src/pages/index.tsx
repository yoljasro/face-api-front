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
  const [message, setMessage] = useState<string | null>(null);
  const [faceBox, setFaceBox] = useState<faceapi.Box | null>(null);
  const [loggedUsers, setLoggedUsers] = useState<{ [key: string]: number }>({});
  const [lastFaceDetectedTime, setLastFaceDetectedTime] = useState<number | null>(null);
  const [isWriting, setIsWriting] = useState(false); // Flag to check if writing to the database

  useEffect(() => {
    const loadFaceModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json');
        await faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json');
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
              setFaceBox(detections.detection.box);
              const match = await verifyFace(detections.descriptor);

              if (match) {
                const { employeeId, name, role } = match;
                const now = Date.now();
                if (!loggedUsers[employeeId] || now - loggedUsers[employeeId] > 8000) { // Check if more than 8 seconds have passed
                  if (!isWriting) { // Check if writing is not in progress
                    setIsWriting(true);
                    setMessage('Face recognized successfully');
                    successAudioRef.current?.play(); // Play success sound
                    await logFaceData(employeeId, name, role, canvasRef.current.toDataURL());
                    setLoggedUsers((prev) => ({ ...prev, [employeeId]: now })); // Update logged time for this user
                    setIsWriting(false);
                  }
                  setTimeout(() => {
                    setMessage(null);
                    setFaceBox(null); // Clear face box after message
                  }, 3000);
                }
              } else {
                setMessage('Face not recognized');
                errorAudioRef.current?.play(); // Play error sound
                setTimeout(() => {
                  setMessage(null);
                }, 3000);
              }

              setLastFaceDetectedTime(Date.now()); // Update last detected time
            } else {
              setFaceBox(null);
              clearCanvas();

              // If no face is detected for more than 3 seconds, clear lastFaceDetectedTime
              if (lastFaceDetectedTime && Date.now() - lastFaceDetectedTime > 3000) {
                setLastFaceDetectedTime(null);
              }
            }
            drawFaceRect();
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
  }, [modelsLoaded, loggedUsers, lastFaceDetectedTime, isWriting]);

  const verifyFace = async (descriptor: Float32Array) => {
    try {
      const response = await axios.post('http://localhost:4000/api/verify', {
        descriptor: Array.from(descriptor)
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying face:', error);
      return null;
    }
  };

  const logFaceData = async (employeeId: string, name: string, role: string, image: string) => {
    try {
      await axios.post('http://localhost:4000/api/log', {
        employeeId,
        name,
        role,
        image,
        timestamp: moment().tz('Asia/Tashkent').toISOString()
      });
      setMessage('Face data logged successfully');
    } catch (error) {
      console.error('Error logging face data:', error);
    }
  };

  const drawFaceRect = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  
      if (faceBox) {
        const { x, y, width, height } = faceBox;
        // Default rang ko'k bo'ladi, success uchun yashil va error uchun qizil
        ctx.strokeStyle = message === 'Face recognized successfully' ? 'green' : 
                          message === 'Face not recognized' ? 'red' : 
                          'blue'; // Default rang ko'k
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
      }
    }
  };
  
  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <Container fluid style={{ padding: 0, height: '100vh', margin: 0 }}>
      <Card className="mt-0" style={{ border: 'none', height: '100%' }}>
        <Card.Body style={{ padding: 0, height: '100%' }}>
          {error && <p className="text-danger text-center">{error}</p>}
          {modelsLoaded ? (
            <div style={{ position: 'relative', height: '100%', width: '100%' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
              {faceBox && message && (
                <div
                  style={{
                    position: 'absolute',
                    top: faceBox.y,
                    left: faceBox.x,
                    width: faceBox.width,
                    backgroundColor: message === 'Face recognized successfully' ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)',
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
