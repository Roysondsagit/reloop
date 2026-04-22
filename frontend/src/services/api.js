import axios from 'axios';

// API URL:
// - In development (Vite dev server): uses proxy config in vite.config.js
// - In production (served by FastAPI): same origin, so empty string works
// - Override via VITE_API_URL environment variable for custom deployments
export const API_URL = import.meta.env.VITE_API_URL || '';

export const analyzeImage = async (imageSrc, audioBlob) => {
  const res = await fetch(imageSrc);
  const blob = await res.blob();

  // Get user geolocation (optional)
  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  };

  const loc = await getLocation();

  const formData = new FormData();
  formData.append('image', blob, 'capture.jpg');

  if (loc) {
    formData.append('lat', loc.lat);
    formData.append('lon', loc.lon);
  }

  if (audioBlob) {
    console.log('🎤 Attaching Audio Blob:', audioBlob.size, 'bytes');
    formData.append('audio', audioBlob, 'voice_note.webm');
  } else {
    console.log('⚠️ No Audio Blob to attach');
  }

  const response = await axios.post(`${API_URL}/analyze-image`, formData);
  return response.data;
};

export const uploadManifest = async (file) => {
  const formData = new FormData();
  formData.append('pdf', file);
  const response = await axios.post(`${API_URL}/upload-manifest`, formData);
  return response.data;
};