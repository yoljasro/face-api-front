import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const HomePage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [userInfo, setUserInfo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recognizedUsers, setRecognizedUsers] = useState<any[]>([]);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastCheckTimeRef = useRef<number>(0);

  // Fetch user info from the server

  const ADMIN_CHAT_ID =1847596793
  const BOT_TOKEN="7440125833:AAFrWVjkQTTMO991fbR9uWmeEzh7BFR8rE0"

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('/api/users');
      setUserInfo(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    successAudioRef.current = new Audio('/sounds/success.mp3');
    errorAudioRef.current = new Audio('/sounds/error.mp3');

    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json'),
        faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json')
      ]);

      // getUserMedia function check
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        console.error("getUserMedia is not supported by this browser.");
      }
    };

    loadModels();
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (videoRef.current && !loading) {
      videoRef.current.addEventListener('play', async () => {
        // … model yuklash va faceMatcher tayyorlash …

        setInterval(async () => {
          // … detection logikasi …

          if (bestMatch.label !== 'unknown') {
            // … toast, audio ijro …

            // Xabarni shaxsiy chatga yuboramiz
            try {
              await axios.post(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                {
                  chat_id: ADMIN_CHAT_ID,
                  text: `✅ User *${bestMatch.label}* recognized at ${new Date().toLocaleString()}!`,
                  parse_mode: 'Markdown'
                }
              );
            } catch (err) {
              console.error('Telegram API xatosi:', err);
            }
          }
        }, 3000);
      });
    }
  }, [loading, userInfo]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%' }} />
      <ToastContainer />
      <div style={{ position: 'absolute', bottom: 0, left: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white', padding: '10px' }}>
        <ul>
          {recognizedUsers.map((user, index) => (
            <li key={index}>{user.name} - {new Date(user.recognizedAt).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HomePage;
