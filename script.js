const video = document.getElementById('video');
const happinessMeter = document.getElementById('meter-fill');
let isLoading = true;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(() => {
  isLoading = false;
  document.getElementById('loader').style.display = 'none';
  startVideo();
});

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    if (!isLoading) {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      
      if (detections && detections[0]) {
        const happiness = detections[0].expressions.happy;
        updateHappinessMeter(happiness);
      }
    }
  }, 0);
});

function updateHappinessMeter(happiness) {
  const maxWidth = 200; // Maximum width of the happiness meter
  const meterFill = document.getElementById('meter-fill');
  let color = '#4caf50'; // Default green color

  if (happiness < 0.2) {
    color = '#f44336'; // Red color for low happiness
  } else if (happiness < 0.4) {
    color = '#ff9800'; // Orange color for moderate happiness
  } else if (happiness < 0.6) {
    color = '#ffc107'; // Yellow color for medium happiness
  }

  happinessMeter.style.width = `${maxWidth * happiness}px`;
  meterFill.style.backgroundColor = color;
}
