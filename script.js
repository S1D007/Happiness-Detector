const video = document.getElementById('video');
const happinessMeter = document.getElementById('meter-fill');
let isLoading = false;

const loadModels = async () => {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
  ]);
  isLoading = false;
  document.getElementById('loader').style.display = 'none';
  startVideo();
};

const startVideo = () => {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => video.srcObject = stream)
    .catch(err => console.error(err));
};

let animationFrameId;

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  const renderLoop = async () => {
    if (!isLoading) {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (detections && detections[0]) {
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        const happiness = detections[0].expressions.happy;
        updateHappinessMeter(happiness);
      }
    }
    animationFrameId = requestAnimationFrame(renderLoop);
  };
  renderLoop();
});

let imageIndex = 0;
const sidebar = document.getElementById('sidebar');

// Function to add images to the sidebar
const addImageToSidebar = (imgSrc) => {
  const image = document.createElement('img');
  image.src = imgSrc;
  image.classList.add('sidebar-image');
  image.addEventListener('click', () => handleImageClick(imgSrc)); // Register the click event
  sidebar.appendChild(image);
  sidebar.scrollTop = sidebar.scrollHeight;
};

const handleImageClick = (imgSrc) => {
  const activeImageContainer = document.getElementById('active-image-container');
  const activeImage = document.getElementById('active-image');
  const downloadLink = document.getElementById('download-link');

  activeImage.src = imgSrc;
  activeImageContainer.style.display = 'block';

  downloadLink.href = imgSrc;
};

// Function to close the active image view
const closeActiveImage = () => {
  const activeImageContainer = document.getElementById('active-image-container');
  activeImageContainer.style.display = 'none';
};

let isScreenshotTaken = false;

const updateHappinessMeter = (happiness) => {
  const maxWidth = 200; // Maximum width of the happiness meter
  const meterFill = document.getElementById('meter-fill');
  let color = '#4caf50'; // Default green color

  if (happiness < 0.9) {
    isScreenshotTaken = false;
  }

  if (happiness < 0.2) {
    color = '#f44336'; // Red color for low happiness
  } else if (happiness < 0.4) {
    color = '#ff9800'; // Orange color for moderate happiness
  } else if (happiness < 0.6) {
    color = '#ffc107'; // Yellow color for medium happiness
  } else if (happiness < 0.8) {
    color = '#8bc34a';
  } else if (happiness > 0.9 || happiness === 1) {
    !isScreenshotTaken && takeScreenshot();
    isScreenshotTaken = true;
    color = '#4caf50';
  }else {
    color = '#4caf50';
  }

  happinessMeter.style.width = `${maxWidth * happiness}px`;
  meterFill.style.backgroundColor = color;
};

const takeScreenshot = () => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const img = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'happiness_screenshot.png';
  link.href = img;
  link.click();
  addImageToSidebar(img);
  imageIndex++;
};

loadModels();
