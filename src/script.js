document.getElementById("uploadButton").addEventListener("click", function () {
  const canvas = document.getElementById("canvas");
  const imageInput = document.getElementById("imageInput");
  const formData = new FormData();

  if (imageInput.files.length > 0) {
    const imageData = imageInput.files[0];
    formData.append("palmImage", imageData);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  } else if (canvas.toDataURL() !== "data:,") {
    const imageData = dataURItoBlob(canvas.toDataURL());
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
      modalText.innerHTML = data.message;
      modalLoading.style.display = "none";
      closeSpan.style.pointerEvents = "auto";
      document.body.style.overflowY = "hidden"; // Disable scrolling
    })
    .catch((error) => {
      modalText.textContent = error.message;
      modalLoading.style.display = "none";
      closeSpan.style.pointerEvents = "auto";
    });
});

var span = document.getElementsByClassName("close")[0];
span.onclick = function () {
  document.getElementById("modal").style.display = "none";
  document.body.style.overflowY = "auto"; // Enable scrolling
};

document.getElementById("imageInput").addEventListener("change", function () {
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

document
  .getElementById("openCameraButton")
  .addEventListener("click", function () {
    const cameraStream = document.getElementById("cameraStream");
    const canvas = document.getElementById("canvas");
    const snapButton = document.getElementById("snapButton");
    const preview = document.getElementById("preview");
    const uploadButton = document.getElementById("uploadButton");
    const imageInput = document.getElementById("imageInput");

    imageInput.value = "";
    uploadButton.style.display = "none";
    preview.innerHTML = "";
    cameraStream.style.display = "block";
    snapButton.style.display = "inline-block";

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
        .then(function (stream) {
          cameraStream.srcObject = stream;
        })
        .catch(function (error) {
          console.log("Something went wrong opening the camera.");
        });
    }
  });

document.getElementById("snapButton").addEventListener("click", function () {
  const cameraStream = document.getElementById("cameraStream");
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  const snapButton = document.getElementById("snapButton");

  context.drawImage(cameraStream, 0, 0, canvas.width, canvas.height);
  cameraStream.srcObject.getVideoTracks().forEach((track) => track.stop());

  const dataURL = canvas.toDataURL("image/png");
  const preview = document.getElementById("preview");
  preview.innerHTML = '<img src="' + dataURL + '">';

  const uploadButton = document.getElementById("uploadButton");
  uploadButton.style.display = "block";

  cameraStream.style.display = "none";
  snapButton.style.display = "none";
});

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
