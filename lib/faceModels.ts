let loadPromise: Promise<typeof import("face-api.js")> | null = null;

// Chỉ load model 1 lần cho toàn phiên trình duyệt, dù FaceCapture mount lại nhiều lần.
export function loadFaceModels() {
  if (!loadPromise) {
    loadPromise = (async () => {
      const faceapi = await import("face-api.js");
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      return faceapi;
    })();
  }
  return loadPromise;
}
