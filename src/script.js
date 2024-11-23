document.addEventListener("DOMContentLoaded", function () {
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

  canvas.style.display = "none";
  document.body.appendChild(canvas);

  // Function to calculate optimal dimensions while maintaining aspect ratio
  function calculateOptimalDimensions(width, height) {
    const MAX_WIDTH = 1092; // Maximum width for 1:1 aspect ratio per Anthropic docs
    const MAX_HEIGHT = 1092; // Maximum height for 1:1 aspect ratio per Anthropic docs
    const MAX_MEGAPIXELS = 1.15; // Maximum recommended megapixels

    let newWidth = width;
    let newHeight = height;

    // Check if dimensions exceed maximum allowed
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      if (width > height) {
        newWidth = MAX_WIDTH;
        newHeight = Math.floor((height * MAX_WIDTH) / width);
      } else {
        newHeight = MAX_HEIGHT;
        newWidth = Math.floor((width * MAX_HEIGHT) / height);
      }
    }

    // Check if megapixels exceed maximum
    const megapixels = (newWidth * newHeight) / 1000000;
    if (megapixels > MAX_MEGAPIXELS) {
      const scale = Math.sqrt(MAX_MEGAPIXELS / megapixels);
      newWidth = Math.floor(newWidth * scale);
      newHeight = Math.floor(newHeight * scale);
    }

    return { width: newWidth, height: newHeight };
  }

  // Function to compress and format image
  function processImage(sourceCanvas) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Calculate optimal dimensions
        const dimensions = calculateOptimalDimensions(img.width, img.height);

        // Create a new canvas with optimal dimensions
        const processedCanvas = document.createElement("canvas");
        processedCanvas.width = dimensions.width;
        processedCanvas.height = dimensions.height;

        // Draw and compress image
        const ctx = processedCanvas.getContext("2d");
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

        // Convert to Blob with specific settings
        processedCanvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          0.92
        ); // Using JPEG format with 92% quality
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
          width: { ideal: 1092 }, // Match Anthropic's recommended max width
          height: { ideal: 1092 }, // Match Anthropic's recommended max height
        },
      });
      cameraStream.srcObject = stream;
      await cameraStream.play();
    } catch (error) {
      console.error("Camera error:", error);
    }
  });

  snapButton.addEventListener("click", async function () {
    // Set canvas dimensions to match video feed
    canvas.width = cameraStream.videoWidth;
    canvas.height = cameraStream.videoHeight;

    // Capture the image
    const ctx = canvas.getContext("2d");
    ctx.drawImage(cameraStream, 0, 0);

    // Process the captured image
    const processedBlob = await processImage(canvas);
    const imageUrl = URL.createObjectURL(processedBlob);

    // Display processed image in preview
    preview.innerHTML = `<img src="${imageUrl}" alt="Captured palm">`;

    // Stop camera stream
    if (cameraStream.srcObject) {
      cameraStream.srcObject.getTracks().forEach((track) => track.stop());
    }

    cameraStream.style.display = "none";
    snapButton.style.display = "none";
    uploadButton.style.display = "block";
  });

  // Update file input handler to use same processing
  imageInput.addEventListener("change", async function () {
    if (imageInput.files.length > 0) {
      const file = imageInput.files[0];

      // Create temporary canvas to process uploaded file
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

    // Get the current preview image
    const previewImg = preview.querySelector("img");
    if (!previewImg) {
      alert("Please select or capture an image first.");
      return;
    }

    // Convert the preview image URL to a blob
    try {
      const response = await fetch(previewImg.src);
      imageBlob = await response.blob();

      // Verify blob size
      if (imageBlob.size > 5 * 1024 * 1024) {
        // 5MB limit
        throw new Error(
          "Image size exceeds 5MB limit. Please try again with a smaller image."
        );
      }

      formData.append("palmImage", imageBlob, "palm.jpg");
    } catch (error) {
      alert(error.message);
      return;
    }

    const modal = document.getElementById("modal");
    const modalText = document.getElementById("modal-text");
    const modalLoading = document.getElementById("modal-loading");
    const closeSpan = document.getElementsByClassName("close")[0];

    modal.style.display = "block";
    modalLoading.style.display = "block";
    modalText.textContent = "Please wait while your palm is being read...";
    closeSpan.style.pointerEvents = "none";

    try {
      const response = await fetch(
        "https://palm-reader-app.onrender.com/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 413
            ? "The image is too large. Please try again with a smaller image."
            : response.status === 429
            ? "Too many requests. Please try again later."
            : "An error occurred while processing your request."
        );
      }

      const data = await response.json();
      const [previewContent, fullContent] = splitContent(data.message);
      modalText.innerHTML = previewContent;
      document.getElementById("payment-info-container").style.display = "block";

      const paymentButton = document.createElement("button");
      paymentButton.classList.add("paymentbtn");
      paymentButton.textContent = "Unlock Full Reading for $4.99";
      paymentButton.onclick = () =>
        openStripeCheckout(previewContent + fullContent);
      modalText.appendChild(paymentButton);
    } catch (error) {
      modalText.textContent = error.message;
    } finally {
      modalLoading.style.display = "none";
      closeSpan.style.pointerEvents = "auto";
    }
  });

  function splitContent(fullText) {
    const splitIndex = fullText.indexOf("<!-- PAYWALL -->");
    const previewContent = fullText.substring(0, splitIndex);
    const fullContent = fullText.substring(splitIndex);
    return [previewContent, fullContent];
  }

  function openStripeCheckout(completeContent) {
    fetch("https://palm-reader-app.onrender.com/create-payment-intent", {
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
          }
        }
      })
      .catch((error) => {
        console.error("Payment failed:", error);
      });
  }
});
