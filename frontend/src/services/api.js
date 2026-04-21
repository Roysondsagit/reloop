import axios from 'axios';

// Automatically points to localhost:8000 in dev
export const API_URL = 'http://127.0.0.1:8000'; 

export const analyzeImage = async (imageSrc, audioBlob) => {
  const res = await fetch(imageSrc);
  const blob = await res.blob();
  
  // 1. Get Location
  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null), // Default if denied
        { timeout: 5000 }
      );
    });
  };

  const loc = await getLocation();

  const formData = new FormData();
  formData.append('image', blob, "capture.jpg");
  
  if (loc) {
    formData.append('lat', loc.lat);
    formData.append('lon', loc.lon);
  }

  // --- FIX: Send as .webm (Matches Browser Recording Format) ---
  if (audioBlob) {
    console.log("🎤 Attaching Audio Blob:", audioBlob.size, "bytes"); // Debug Log
    formData.append('audio', audioBlob, "voice_note.webm");
  } else {
    console.log("⚠️ No Audio Blob to attach");
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