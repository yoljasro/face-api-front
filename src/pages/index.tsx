import { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

const Home: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startVideo = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    };

    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    };

    const recognizeFaces = async () => {
      const labeledDescriptors = await loadLabeledImages();
      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

      if (videoRef.current) {
        videoRef.current.addEventListener('play', async () => {
          const canvas = faceapi.createCanvasFromMedia(videoRef.current!);
          document.body.append(canvas);

          const displaySize = { width: videoRef.current!.width, height: videoRef.current!.height };
          faceapi.matchDimensions(canvas, displaySize);

          setInterval(async () => {
            const detections = await faceapi.detectAllFaces(videoRef.current!, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
            const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
            results.forEach((result, i) => {
              const box = resizedDetections[i].detection.box;
              const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
              drawBox.draw(canvas);

              if (result.label !== 'unknown') {
                saveLog(result.label, 'success');
              } else {
                saveLog('unknown', 'fail');
              }
            });
          }, 100);
        });
      }
    };

    const saveLog = async (employeeId: string, status: string) => {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, status }),
      });
      if (response.ok) {
        console.log('Log saved successfully');
      } else {
        console.error('Failed to save log');
      }
    };

    loadModels().then(startVideo).then(recognizeFaces);
  }, []);

  const loadLabeledImages = async () => {
    const response = await fetch('/api/employees');
    const employees = await response.json();

    return Promise.all(
      employees.map(async (employee: any) => {
        const descriptions: Float32Array[] = [];
        for (const image of employee.images) {
          const img = await faceapi.fetchImage(`/uploads/${employee.id}/${image}`);
          const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
          if (detections) {
            descriptions.push(detections.descriptor);
          }
        }
        return new faceapi.LabeledFaceDescriptors(employee.id, descriptions);
      })
    );
  };

  return (
    <div>
      <h1>Face Recognition System</h1>
      <video ref={videoRef} width="720" height="560" autoPlay muted />
    </div>
  );
};

export default Home;
