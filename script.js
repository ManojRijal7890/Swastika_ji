// Slideshow images setup
const slideshowContainer = document.querySelector('.slideshow-container');
const slideCount = 10;
let slides = [];

for (let i = 1; i <= slideCount; i++) {
  const img = document.createElement('img');
  img.className = 'slide';
  img.src = `assets/photos/${i}.JPG`;
  img.alt = `Memory slide ${i}`;
  slideshowContainer.appendChild(img);
  slides.push(img);
}

let slideIndex = 0;
function showSlides() {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === slideIndex);
  });
  slideIndex = (slideIndex + 1) % slides.length;
  setTimeout(showSlides, 3500);
}
showSlides();

// Grid image setup (if using a photo grid somewhere else, optional)



// Music toggle
const music = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');

if (music && musicBtn) {
  musicBtn.addEventListener('click', () => {
    if (music.paused) {
      music.play();
      musicBtn.textContent = '⏸ Music';
      musicBtn.setAttribute('aria-label', 'Pause music');
    } else {
      music.pause();
      musicBtn.textContent = '▶️ Music';
      musicBtn.setAttribute('aria-label', 'Play music');
    }
  });
}

// Secret message toggle
const revealBtn = document.getElementById('reveal-btn');
const secretMsg = document.getElementById('secret-message');

if (revealBtn && secretMsg) {
  revealBtn.addEventListener('click', () => {
    const isHidden = secretMsg.style.display === 'none' || secretMsg.style.display === '';
    secretMsg.style.display = isHidden ? 'block' : 'none';
    revealBtn.setAttribute('aria-expanded', isHidden);
    revealBtn.textContent = isHidden ? 'Hide My Heart' : 'Reveal My Heart';
  });
}

// Videos section toggle
const toggleVideosBtn = document.getElementById('toggle-videos');
const videoGrid = document.getElementById('video-grid');

if (toggleVideosBtn && videoGrid) {
  toggleVideosBtn.addEventListener('click', () => {
    const isHidden = videoGrid.style.display === 'none';
    videoGrid.style.display = isHidden ? 'flex' : 'none';
    toggleVideosBtn.textContent = isHidden ? 'Hide Videos' : 'View Videos';
  });

  // Load videos dynamically
  for (let i = 1; i <= 26; i++) {
    const video = document.createElement('video');
    video.src = `assets/videos/${i}.mp4`;
    video.controls = true;
    video.width = 300;
    video.style.borderRadius = '10px';
    video.style.margin = '10px';
    videoGrid.appendChild(video);
  }
}

// Photo section toggle
const togglePhotosBtn = document.getElementById('toggle-photos');
const photoGrid = document.getElementById('photo-grid');
let photosLoaded = false;

if (togglePhotosBtn && photoGrid) {
  togglePhotosBtn.addEventListener('click', () => {
    const isHidden = photoGrid.style.display === 'none';
    photoGrid.style.display = isHidden ? 'flex' : 'none';
    togglePhotosBtn.textContent = isHidden ? 'Hide Photos' : 'View Photos';

    if (!photosLoaded) {
      for (let i = 1; i <= 90; i++) {
        const img = document.createElement('img');
        img.src = `assets/photos/${i}.JPG`;
        img.alt = `Photo ${i}`;
        photoGrid.appendChild(img);
      }
      photosLoaded = true;
    }
  });
}
// Autoplay music if user came from intro page
window.addEventListener('DOMContentLoaded', () => {
  const shouldPlay = sessionStorage.getItem('playMusic');
  const bgMusic = document.getElementById('bg-music');

  if (shouldPlay === 'true' && bgMusic) {
    bgMusic.volume = 0.7;
    bgMusic.play().catch(err => {
      console.warn("Autoplay blocked by browser:", err);
    });
    sessionStorage.removeItem('playMusic');
  }
});
