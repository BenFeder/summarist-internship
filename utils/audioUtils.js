// Utility function to get audio duration from URL
export const getAudioDuration = (audioUrl) => {
  return new Promise((resolve, reject) => {
    if (!audioUrl) {
      resolve(null);
      return;
    }

    const audio = new Audio();
    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };

    audio.onerror = () => {
      reject(new Error("Failed to load audio"));
    };

    audio.src = audioUrl;
  });
};

// Format seconds into mm:ss format
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) {
    return "N/A";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
