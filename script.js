/* script.js */
"use strict";

/**
 * Asset counts & timings
 * - Photos: assets/photos/1.JPG ... 93.JPG
 * - Videos: assets/videos/1.mp4 ... 32.mp4
 * - Music : assets/music/meri-banogi-kya.mp3 (already in your HTML)
 */
const CONFIG = {
  PHOTO_START: 1,
  PHOTO_MAX: 127,
  VIDEO_START: 1,
  VIDEO_MAX: 39,
  SLIDE_INTERVAL_MS: 2000 // 2 seconds (mini slideshow)
};

document.addEventListener("DOMContentLoaded", () => {
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ===== Music Toggle + Autoplay-from-index ===== */
  const bgMusic  = $("#bg-music");
  const musicBtn = $("#music-btn");

  const updateMusicUI = () => {
    if (!musicBtn || !bgMusic) return;
    musicBtn.textContent = (bgMusic.paused ? "▶" : "⏸") + " Music";
    musicBtn.setAttribute("aria-pressed", String(!bgMusic.paused));
  };

  if (bgMusic && musicBtn) {
    // Button toggles
    musicBtn.addEventListener("click", () => {
      if (bgMusic.paused) bgMusic.play().catch(()=>{});
      else bgMusic.pause();
    });
    bgMusic.addEventListener("play", updateMusicUI);
    bgMusic.addEventListener("pause", updateMusicUI);
  }

  // NEW: try to autoplay if user chose "Enter with Sound" on index.html
  (async function tryAutoplayFromIndex(){
    if (!bgMusic) return;

    bgMusic.volume = 0.7;

    let want = false;
    try { want = sessionStorage.getItem("playMusic") === "true"; } catch {}
    // Clear so refresh doesn't force play
    try { sessionStorage.removeItem("playMusic"); } catch {}

    if (!want) { updateMusicUI(); return; }

    // 1) Try immediately (often works on desktop after navigation)
    const ok = await bgMusic.play().then(()=>true).catch(()=>false);
    if (ok) { updateMusicUI(); return; }

    // 2) If blocked, unlock on first user interaction on THIS page
    const unlock = async () => {
      const ok2 = await bgMusic.play().then(()=>true).catch(()=>false);
      if (ok2) { cleanup(); updateMusicUI(); }
    };
    const cleanup = () =>
      ["pointerdown","keydown","touchstart","click"]
        .forEach(ev => document.removeEventListener(ev, unlock, true));

    ["pointerdown","keydown","touchstart","click"]
      .forEach(ev => document.addEventListener(ev, unlock, { once:true, capture:true }));

    updateMusicUI();
  })();

  updateMusicUI();

  /* ===== Mini slideshow (center/sticky) — #mini-slide ===== */
  (function initMiniSlideshow(){
    const img = $("#mini-slide");
    if (!img) return;

    let i = CONFIG.PHOTO_START;
    const swap = () => {
      i = (i >= CONFIG.PHOTO_MAX) ? CONFIG.PHOTO_START : i + 1;
      const preload = new Image();
      preload.onload = () => {
        img.style.opacity = "0.4";
        requestAnimationFrame(() => {
          img.src = preload.src;
          img.addEventListener("load", () => { img.style.opacity = "1"; }, { once:true });
        });
      };
      preload.src = `assets/photos/${i}.JPG`;
    };
    setInterval(swap, CONFIG.SLIDE_INTERVAL_MS);
  })();

  /* ===== Gallery (uniform tiles) ===== */
  (function initGallery(){
    const grid = $("#gallery-grid");
    const toggleBtn = $("#toggle-gallery");
    if (!grid) return;

    for (let n = CONFIG.PHOTO_START; n <= CONFIG.PHOTO_MAX; n++) {
      const img = document.createElement("img");
      img.alt = `Photo ${n}`;
      img.loading = "lazy";
      img.src = `assets/photos/${n}.JPG`;
      img.addEventListener("error", () => img.remove(), { once: true });
      grid.appendChild(img);
    }

    if (toggleBtn) {
      const update = () => {
        const hidden = grid.style.display === "none";
        toggleBtn.textContent = hidden ? "Show photos" : "Hide photos";
        toggleBtn.setAttribute("aria-expanded", String(!hidden));
      };
      toggleBtn.addEventListener("click", () => {
        grid.style.display = (grid.style.display === "none") ? "grid" : "none";
        update();
      });
      update();
    }
  })();

  /* ===== Videos — real thumbnail from SAME video + hover play + click to unmute ===== */
  (function initVideos(){
    const grid = $("#video-grid");
    const toggleBtn = $("#toggle-videos");
    if (!grid) return;

    // Helper: capture a frame from the video file and set as poster
    const makePosterFromVideo = (videoEl, captureTime = 0.15) =>
      new Promise((resolve) => {
        const tmp = document.createElement("video");
        tmp.src = videoEl.currentSrc || videoEl.src;
        tmp.muted = true;
        tmp.playsInline = true;
        tmp.preload = "auto";
        tmp.crossOrigin = "anonymous";     // same-origin is fine
        tmp.style.position = "fixed";
        tmp.style.left = "-99999px";
        tmp.style.top = "-99999px";
        document.body.appendChild(tmp);

        const cleanup = () => { tmp.pause(); tmp.remove(); };

        const draw = () => {
          const w = tmp.videoWidth || 640;
          const h = tmp.videoHeight || 360;
          if (w && h) {
            const cv = document.createElement("canvas");
            cv.width = w; cv.height = h;
            const ctx = cv.getContext("2d");
            try {
              ctx.drawImage(tmp, 0, 0, w, h);
              const dataURL = cv.toDataURL("image/jpeg", 0.85);
              videoEl.setAttribute("poster", dataURL);
            } catch (_) {
              /* If canvas fails (CORS), silently skip; browser default remains. */
            }
          }
          cleanup(); resolve();
        };

        tmp.addEventListener("loadeddata", () => {
          let t = Math.min(captureTime, (tmp.duration || 1) - 0.05);
          if (t < 0.05) t = 0.05;
          const onSeeked = () => { tmp.removeEventListener("seeked", onSeeked); draw(); };
          tmp.addEventListener("seeked", onSeeked);
          tmp.currentTime = t;
        });

        tmp.addEventListener("error", () => { cleanup(); resolve(); });
        tmp.load();
      });

    for (let n = CONFIG.VIDEO_START; n <= CONFIG.VIDEO_MAX; n++) {
      const v = document.createElement("video");
      v.className = "video-card";
      v.src = `assets/videos/${n}.mp4`;
      v.muted = true;           // required for hover autoplay
      v.loop = true;
      v.preload = "metadata";   // fetch metadata/first frame fast
      v.playsInline = true;
      v.controls = false;       // show controls only when unmuted

      // Create poster from THIS video’s own frame
      v.addEventListener("loadedmetadata", () => {
        makePosterFromVideo(v, 0.15);
      }, { once:true });

      // Hover to preview (muted)
      v.addEventListener("mouseenter", () => v.play().catch(()=>{}));
      v.addEventListener("mouseleave", () => {
        v.pause();
        v.currentTime = 0; // return to poster frame
      });

      // Click / tap to unmute & show controls (play with sound)
      const unmuteAndPlay = () => {
        const bg = $("#bg-music");
        if (bg && !bg.paused) bg.pause();  // optional: pause bg music

        v.muted = false;
        v.removeAttribute("muted"); // Safari quirk
        v.volume = 1.0;
        v.controls = true;
        v.play().catch(()=>{});
      };
      v.addEventListener("click", unmuteAndPlay);
      v.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "touch") unmuteAndPlay();
      });

      grid.appendChild(v);
    }

    if (toggleBtn) {
      const update = () => {
        const hidden = grid.style.display === "none";
        toggleBtn.textContent = hidden ? "Show videos" : "Hide videos";
        toggleBtn.setAttribute("aria-expanded", String(!hidden));
      };
      toggleBtn.addEventListener("click", () => {
        grid.style.display = (grid.style.display === "none") ? "grid" : "none";
        update();
      });
      update();
    }
  })();
  /* ===== Letters (assets/letters/1.JPG..12.JPG) ===== */
(function initLetters(){
    const grid = document.getElementById("letters-grid");
    const toggleBtn = document.getElementById("toggle-letters");
    if (!grid) return;
  
    for (let i = 1; i <= 12; i++) {
      const img = new Image();
      img.alt = `Letter ${i}`;
      img.loading = "lazy";
      img.src = `assets/letters/${i}.JPG`;
      img.addEventListener("error", () => img.remove(), { once:true });
      grid.appendChild(img);
    }
  
    if (toggleBtn) {
      const update = () => {
        const hidden = grid.style.display === "none";
        toggleBtn.textContent = hidden ? "Show letters" : "Hide letters";
        toggleBtn.setAttribute("aria-expanded", String(!hidden));
      };
      toggleBtn.addEventListener("click", () => {
        grid.style.display = (grid.style.display === "none") ? "grid" : "none";
        update();
      });
      update();
    }
  })();
  
});
