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

  // Camera functionality
  const cameraStream = document.getElementById("cameraStream");
  const canvas = document.createElement("canvas");
  const openCameraButton = document.getElementById("openCameraButton");
  const snapButton = document.getElementById("snapButton");
  const preview = document.getElementById("preview");
  const uploadButton = document.getElementById("uploadButton");
  const imageInput = document.getElementById("imageInput");

  canvas.style.display = "none";
  document.body.appendChild(canvas);

  openCameraButton.addEventListener("click", function () {
    preview.innerHTML = "";
    uploadButton.style.display = "none";
    cameraStream.style.display = "block";
    snapButton.style.display = "inline-block";
    imageInput.value = "";

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then(function (stream) {
          cameraStream.srcObject = stream;
          cameraStream.play();
        })
        .catch(function (error) {
          console.error("Camera error:", error);
        });
    }
  });

  snapButton.addEventListener("click", function () {
    canvas.width = cameraStream.videoWidth;
    canvas.height = cameraStream.videoHeight;
    canvas.getContext("2d").drawImage(cameraStream, 0, 0);
    const imageDataURL = canvas.toDataURL("image/jpeg");
    preview.innerHTML = `<img src="${imageDataURL}" alt="Captured palm">`;

    if (cameraStream.srcObject) {
      cameraStream.srcObject.getTracks().forEach((track) => track.stop());
    }

    cameraStream.style.display = "none";
    snapButton.style.display = "none";
    uploadButton.style.display = "block";
  });

  imageInput.addEventListener("change", function () {
    const imageInput = document.getElementById("imageInput");
    const uploadButton = document.getElementById("uploadButton");
    const cameraStream = document.getElementById("cameraStream");
    const snapButton = document.getElementById("snapButton");

    cameraStream.style.display = "none";
    snapButton.style.display = "none";

    if (imageInput.files.length > 0) {
      const preview = document.getElementById("preview");
      preview.innerHTML =
        '<img src="' + URL.createObjectURL(imageInput.files[0]) + '">';
      uploadButton.style.display = "block";
    }
  });

  uploadButton.addEventListener("click", function () {
    const formData = new FormData();
    let imageData;

    if (imageInput.files.length > 0) {
      imageData = imageInput.files[0];
      formData.append("palmImage", imageData);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    } else if (canvas.toDataURL() !== "data:,") {
      imageData = dataURItoBlob(canvas.toDataURL());
      formData.append("palmImage", imageData, "palmImage.png");
    } else {
      alert("Please select an image to upload.");
      return;
    }

    const modal = document.getElementById("modal");
    const modalText = document.getElementById("modal-text");
    const modalLoading = document.getElementById("modal-loading");
    const closeSpan = document.getElementsByClassName("close")[0];

    modal.style.display = "block";
    modalLoading.style.display = "block";
    modalText.textContent = "Please wait while your palm is being read...";

    fetch("https://palm-reader-app.onrender.com/api/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 413) {
            throw new Error(
              "The image is too large. Please upload an image smaller than 20MB."
            );
          }
          if (response.status === 429) {
            throw new Error("Too many requests. Please try again later.");
          }
          throw new Error("An error occurred while processing your request.");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data.message);
        const [previewContent, fullContent] = splitContent(data.message);
        modalText.innerHTML = previewContent;
        document.getElementById("payment-info-container").style.display =
          "block";
        const paymentButton = document.createElement("button");
        paymentButton.classList.add("paymentbtn");
        paymentButton.textContent = "Unlock Full Reading for $4.99";
        paymentButton.onclick = () =>
          openStripeCheckout(previewContent + fullContent);
        modalText.appendChild(paymentButton);
        modalLoading.style.display = "none";
        closeSpan.style.pointerEvents = "auto";
        document.body.style.overflowY = "hidden";
      })
      .catch((error) => {
        modalText.textContent = error.message;
        modalLoading.style.display = "none";
        closeSpan.style.pointerEvents = "auto";
      });
  });

  const closeSpan = document.getElementsByClassName("close")[0];
  closeSpan.onclick = function () {
    document.getElementById("modal").style.display = "none";
    document.body.style.overflowY = "auto";
  };

  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeString });
  }

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
