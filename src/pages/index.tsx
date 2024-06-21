import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const HomePage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.loadTinyFaceDetectorModel("https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json");
        await faceapi.loadFaceLandmarkModel("https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json");
        await faceapi.loadFaceRecognitionModel("https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json");
        setModelsLoaded(true);
      } catch (err) {
        setError('Failed to load models');
        console.error('Failed to load models', err);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (modelsLoaded && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          videoRef.current!.srcObject = stream;
          videoRef.current!.play();
        })
        .catch(err => {
          setError('Error accessing the webcam');
          console.error('Error accessing the webcam:', err);
        });
    }
  }, [modelsLoaded]);

  const handleVideoPlay = () => {
    if (videoRef.current) {
      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(
          videoRef.current!,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptors();

        console.log(detections);
      }, 100);
    }
  };

  return (
    <div>
      <h1>Face Recognition App</h1>
      {error && <p>{error}</p>}
      {modelsLoaded ? (
        <video
          ref={videoRef}
          onPlay={handleVideoPlay}
          autoPlay
          muted
          width="720"
          height="560"
          style={{ display: 'block', margin: 'auto' }}
        />
      ) : (
        <p>Loading models...</p>
      )}
    </div>
  );
};

export default HomePage;
