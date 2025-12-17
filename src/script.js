document.addEventListener("DOMContentLoaded", function () {
  // Initialize particle effect
  initParticles();

  new Swiper(".swiper-container", {
    loop: true,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
  });

  const stripe = Stripe(
    "pk_live_51LFOR1EGWtwpkkhteYPKdviYKkkFCjoE0DC4ZweTNEUVhsW5gsmIUjaLoC3lK6P2UD6uoaId5fIAc7aWXFUEVn2B00OjikTqmE"
  );

  const style = {
    base: {
      color: "#000",
      fontWeight: 500,
      fontFamily: "Source Code Pro, Consolas, Menlo, monospace",
      fontSize: "16px",
      fontSmoothing: "antialiased",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  };

  const elements = stripe.elements();
  const cardElement = elements.create("card", { style: style });
  cardElement.mount("#card-element");

  const cameraStream = document.getElementById("cameraStream");
  const canvas = document.createElement("canvas");
  const openCameraButton = document.getElementById("openCameraButton");
  const snapButton = document.getElementById("snapButton");
  const preview = document.getElementById("preview");
  const uploadButton = document.getElementById("uploadButton");
  const imageInput = document.getElementById("imageInput");
  const modal = document.getElementById("modal");
  const modalText = document.getElementById("modal-text");
  const modalLoading = document.getElementById("modal-loading");
  const closeSpan = document.getElementsByClassName("close")[0];

  canvas.style.display = "none";
  document.body.appendChild(canvas);

  // Function to lock body scroll
  function lockBodyScroll() {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
  }

  // Function to unlock body scroll
  function unlockBodyScroll() {
    const scrollY = document.body.style.top;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, parseInt(scrollY || "0") * -1);
  }

  // Function to ensure modal content fits viewport
  function adjustModalContent() {
    const modalContent = document.querySelector(".modal-content");
    const windowHeight = window.innerHeight;
    const modalMargin = window.innerWidth <= 480 ? 0 : 40;
    modalContent.style.maxHeight = `${windowHeight - modalMargin}px`;
  }

  // Modal close handler
  closeSpan.addEventListener("click", function () {
    modal.style.display = "none";
    modalText.textContent = "";
    document.getElementById("payment-info-container").style.display = "none";
    unlockBodyScroll();

    // Reset camera elements
    cameraStream.style.display = "none";
    snapButton.style.display = "none";
    if (cameraStream.srcObject) {
      cameraStream.srcObject.getTracks().forEach((track) => track.stop());
    }
  });

  // Function to calculate optimal dimensions while maintaining aspect ratio
  function calculateOptimalDimensions(width, height) {
    const MAX_WIDTH = 1092;
    const MAX_HEIGHT = 1092;
    const MAX_MEGAPIXELS = 1.15;

    let newWidth = width;
    let newHeight = height;

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      if (width > height) {
        newWidth = MAX_WIDTH;
        newHeight = Math.floor((height * MAX_WIDTH) / width);
      } else {
        newHeight = MAX_HEIGHT;
        newWidth = Math.floor((width * MAX_HEIGHT) / height);
      }
    }

    const megapixels = (newWidth * newHeight) / 1000000;
    if (megapixels > MAX_MEGAPIXELS) {
      const scale = Math.sqrt(MAX_MEGAPIXELS / megapixels);
      newWidth = Math.floor(newWidth * scale);
      newHeight = Math.floor(newHeight * scale);
    }

    return { width: newWidth, height: newHeight };
  }

  // Function to process image
  function processImage(sourceCanvas) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const dimensions = calculateOptimalDimensions(img.width, img.height);
        const processedCanvas = document.createElement("canvas");
        processedCanvas.width = dimensions.width;
        processedCanvas.height = dimensions.height;
        const ctx = processedCanvas.getContext("2d");
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
        processedCanvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          0.92
        );
      };
      img.src = sourceCanvas.toDataURL("image/jpeg", 1.0);
    });
  }

  openCameraButton.addEventListener("click", async function () {
    preview.innerHTML = "";
    uploadButton.style.display = "none";
    cameraStream.style.display = "block";
    snapButton.style.display = "inline-block";
    imageInput.value = "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1092 },
          height: { ideal: 1092 },
        },
      });
      cameraStream.srcObject = stream;
      await cameraStream.play();
    } catch (error) {
      console.error("Camera error:", error);
    }
  });

  snapButton.addEventListener("click", async function () {
    canvas.width = cameraStream.videoWidth;
    canvas.height = cameraStream.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(cameraStream, 0, 0);
    const processedBlob = await processImage(canvas);
    const imageUrl = URL.createObjectURL(processedBlob);
    preview.innerHTML = `<img src="${imageUrl}" alt="Captured palm">`;

    if (cameraStream.srcObject) {
      cameraStream.srcObject.getTracks().forEach((track) => track.stop());
    }

    cameraStream.style.display = "none";
    snapButton.style.display = "none";
    uploadButton.style.display = "block";
  });

  imageInput.addEventListener("change", async function () {
    if (imageInput.files.length > 0) {
      const file = imageInput.files[0];
      const img = new Image();
      img.onload = async () => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tempCanvas.getContext("2d").drawImage(img, 0, 0);
        const processedBlob = await processImage(tempCanvas);
        const imageUrl = URL.createObjectURL(processedBlob);
        preview.innerHTML = `<img src="${imageUrl}" alt="Selected palm">`;
        uploadButton.style.display = "block";
      };
      img.src = URL.createObjectURL(file);
    }
  });

  uploadButton.addEventListener("click", async function () {
    const formData = new FormData();
    let imageBlob;

    const previewImg = preview.querySelector("img");
    if (!previewImg) {
      alert("Please select or capture an image first.");
      return;
    }

    try {
      const response = await fetch(previewImg.src);
      imageBlob = await response.blob();

      if (imageBlob.size > 5 * 1024 * 1024) {
        throw new Error(
          "Image size exceeds 5MB limit. Please try again with a smaller image."
        );
      }

      formData.append("palmImage", imageBlob, "palm.jpg");
    } catch (error) {
      alert(error.message);
      return;
    }

    modal.style.display = "block";
    lockBodyScroll();
    adjustModalContent();
    modalLoading.style.display = "block";
    modalText.textContent = "Please wait while your palm is being read...";
    closeSpan.style.pointerEvents = "none";

    try {
      let useBase64Method = false;
      let requestId;

      try {
        // Try the standard multipart form upload first
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed with status: " + response.status);
        }

        const data = await response.json();
        requestId = data.requestId;
      } catch (error) {
        console.log("Standard upload failed, trying base64 method");
        useBase64Method = true;
      }

      if (useBase64Method) {
        requestId = await uploadImageAsBase64();
        if (!requestId) {
          throw new Error("Failed to get request ID from base64 upload");
        }
      }

      // Poll for results
      const result = await pollForResults(
        useBase64Method ? "/api/upload-base64" : "/api/upload",
        requestId
      );

      // Process the palm reading result
      const [previewContent, fullContent] = splitContent(result);
      modalText.innerHTML = previewContent;

      // Add value proposition card
      const valuePropositionCard = document.createElement("div");
      valuePropositionCard.className = "value-proposition-card";
      valuePropositionCard.innerHTML = `
        <div class="blur-overlay">
          <div class="locked-content-preview">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lock-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>
        <h2 class="value-prop-title">Unlock Your Complete Destiny Map</h2>
        <ul class="value-prop-list">
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Full palm analysis (Heart, Head, Life, Fate lines)</span>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Personality insights and hidden talents</span>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Love and relationship guidance</span>
          </li>
          <li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Career and financial outlook</span>
          </li>
        </ul>
        <div class="value-prop-price">
          <span class="price-label">One-time payment:</span>
          <span class="price-amount">$4.99</span>
        </div>
        <div class="value-prop-guarantee">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>No subscription • Money-back guarantee • Instant access</span>
        </div>
      `;
      modalText.appendChild(valuePropositionCard);

      // Show payment info container and add button inside it (after Stripe card element)
      const paymentInfoContainer = document.getElementById("payment-info-container");
      paymentInfoContainer.style.display = "block";

      const paymentButton = document.createElement("button");
      paymentButton.classList.add("paymentbtn");
      paymentButton.textContent = "Unlock My Full Reading →";
      paymentButton.onclick = () =>
        openStripeCheckout(previewContent + fullContent);

      // Add button to payment container (after card element and trust signals)
      paymentInfoContainer.appendChild(paymentButton);
    } catch (error) {
      modalText.textContent =
        error.message || "An error occurred while processing your request.";
    } finally {
      modalLoading.style.display = "none";
      closeSpan.style.pointerEvents = "auto";
    }
  });

  // Handle resize events
  let resizeTimeout;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      if (modal.style.display === "block") {
        adjustModalContent();
      }
    }, 250);
  });

  function splitContent(fullText) {
    const splitIndex = fullText.indexOf("<!-- PAYWALL -->");
    const previewContent = fullText.substring(0, splitIndex);
    const fullContent = fullText.substring(splitIndex);
    return [previewContent, fullContent];
  }

  async function uploadImageAsBase64() {
    const previewImg = preview.querySelector("img");
    if (!previewImg) {
      throw new Error("Please select or capture an image first.");
    }

    try {
      // Fetch the image as a blob
      const response = await fetch(previewImg.src);
      const imageBlob = await response.blob();

      if (imageBlob.size > 5 * 1024 * 1024) {
        throw new Error(
          "Image size exceeds 5MB limit. Please try again with a smaller image."
        );
      }

      // Convert blob to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(imageBlob);
      });

      // Send base64 data to the API
      const apiResponse = await fetch("/api/upload-base64", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!apiResponse.ok) {
        throw new Error(
          apiResponse.status === 413
            ? "The image is too large. Please try again with a smaller image."
            : apiResponse.status === 429
            ? "Too many requests. Please try again later."
            : "An error occurred while processing your request."
        );
      }

      const data = await apiResponse.json();
      return data.requestId;
    } catch (error) {
      throw error;
    }
  }

  // Function to poll for results
  async function pollForResults(
    endpoint,
    requestId,
    maxAttempts = 30,
    interval = 3000
  ) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${endpoint}?requestId=${requestId}`, {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error(`Error checking status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "completed") {
          return data.message;
        } else if (data.status === "error") {
          throw new Error(data.error || "Processing failed");
        }

        // Update loading message with progress stages
        const progressPercent = Math.min(
          Math.round((attempts / maxAttempts) * 100),
          90
        );

        let progressMessage = "Please wait while your palm is being read...";
        if (progressPercent < 25) {
          progressMessage = "Analyzing your life line...";
        } else if (progressPercent < 50) {
          progressMessage = "Reading your heart line...";
        } else if (progressPercent < 75) {
          progressMessage = "Interpreting your head line...";
        } else {
          progressMessage = "Revealing your fate line...";
        }

        modalText.innerHTML = `
          <div class="loading-stage">
            <div class="loading-message">${progressMessage}</div>
            <div class="loading-progress-bar">
              <div class="loading-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <div class="loading-percent">${progressPercent}%</div>
            <div class="loading-subtext">This usually takes 20-30 seconds</div>
          </div>
        `;

        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, interval));
        attempts++;
      } catch (error) {
        console.error("Error polling for results:", error);
        throw error;
      }
    }

    throw new Error("Processing timed out. Please try again later.");
  }

  function openStripeCheckout(completeContent) {
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        return stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });
      })
      .then((result) => {
        if (result.error) {
          console.error(result.error.message);
        } else {
          if (result.paymentIntent.status === "succeeded") {
            document.getElementById("card-element").style.display = "none";
            document.getElementById("modal-text").innerHTML = completeContent;
            adjustModalContent(); // Readjust modal content after updating
          }
        }
      })
      .catch((error) => {
        console.error("Payment failed:", error);
      });
  }

  // Particle background effect
  function initParticles() {
    const canvas = document.getElementById("particle-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    let animationFrameId;

    // Set canvas size
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1.5; // Increased from 2 + 0.5
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.6 + 0.5; // Increased from 0.5 + 0.3
        this.twinkle = Math.random() * 0.02 + 0.01; // Add twinkling effect
        this.twinkleDirection = Math.random() > 0.5 ? 1 : -1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Twinkling effect
        this.opacity += this.twinkle * this.twinkleDirection;
        if (this.opacity >= 1.0 || this.opacity <= 0.5) {
          this.twinkleDirection *= -1;
        }

        // Wrap around screen
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        // Draw glow effect
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
        gradient.addColorStop(0, `rgba(212, 175, 55, ${this.opacity})`);
        gradient.addColorStop(0.5, `rgba(212, 175, 55, ${this.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(212, 175, 55, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.fillStyle = `rgba(255, 215, 100, ${this.opacity})`; // Brighter golden core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create particles
    function createParticles() {
      const particleCount = Math.floor((canvas.width * canvas.height) / 10000); // Increased from 15000
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    // Animation loop with performance optimization
    let lastTime = 0;
    const targetFPS = 60;
    const frameDelay = 1000 / targetFPS;

    function animate(currentTime) {
      animationFrameId = requestAnimationFrame(animate);

      // Throttle to target FPS
      const deltaTime = currentTime - lastTime;
      if (deltaTime < frameDelay) return;
      lastTime = currentTime - (deltaTime % frameDelay);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });
    }

    // Initialize
    createParticles();
    animate(0);

    // Pause animation when page is hidden for performance
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      } else {
        animate(0);
      }
    });

    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    });
  }
});
