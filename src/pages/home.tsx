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

  // 🔐 Bu yerda o'zingizning bot token va chat_id'nizni kiriting
  const ADMIN_CHAT_ID = 1847596793
  const BOT_TOKEN = "7440125833:AAFrWVjkQTTMO991fbR9uWmeEzh7BFR8rE0"

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
        const labeledDescriptors = await Promise.all(
          userInfo.map(async (user) => {
            const img = await faceapi.fetchImage(user.imageUrl);
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            if (detections) {
              return new faceapi.LabeledFaceDescriptors(user.name, [detections.descriptor]);
            } else {
              return null;
            }
          }).filter(Boolean)
        );

        if (labeledDescriptors.length === 0) {
          console.error('No labeled descriptors found');
          return;
        }

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors as faceapi.LabeledFaceDescriptors[]);

        setInterval(async () => {
          const currentTime = Date.now();
          if (currentTime - lastCheckTimeRef.current < 10000) return;

          if (videoRef.current) {
            const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptors();

            if (detections.length > 0) {
              const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);
              lastCheckTimeRef.current = currentTime;

              if (bestMatch.label === 'unknown') {
                if (errorAudioRef.current) errorAudioRef.current.play();
                toast.error('Error: User not recognized!', {
                  position: "top-right",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                });
              } else {
                if (successAudioRef.current) successAudioRef.current.play();
                toast.success(`Success: User ${bestMatch.label} recognized!`, {
                  position: "top-right",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                });

                // ✅ Telegramga yuborish
                try {
                  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    chat_id: ADMIN_CHAT_ID,
                    text: `✅ Foydalanuvchi *${bestMatch.label}* tanildi!\n🕒 Vaqt: ${new Date().toLocaleString()}`,
                    parse_mode: 'Markdown'
                  });
                } catch (error) {
                  console.error('Telegramga yuborishda xatolik:', error);
                }

                setRecognizedUsers(prev => [
                  ...prev,
                  { name: bestMatch.label, recognizedAt: new Date().toISOString() }
                ]);
              }
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
