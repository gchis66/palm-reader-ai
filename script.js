document.getElementById("imageInput").addEventListener("change", function () {
  const imageInput = document.getElementById("imageInput");
  const uploadButton = document.getElementById("uploadButton");
  const preview = document.getElementById("preview");

  if (imageInput.files.length > 0) {
    // Show preview
    preview.innerHTML = "";
    const img = document.createElement("img");
    img.src = URL.createObjectURL(imageInput.files[0]);
    preview.appendChild(img);

    // Display the upload button
    uploadButton.style.display = "inline-block";
  } else {
    // Hide the upload button if no image is selected
    uploadButton.style.display = "none";
  }
});

document.getElementById("uploadButton").addEventListener("click", function () {
  const imageInput = document.getElementById("imageInput");
  const formData = new FormData();
  formData.append("palmImage", imageInput.files[0]);
  const modal = document.getElementById("modal");
  const modalText = document.getElementById("modal-text");
  const modalLoading = document.getElementById("modal-loading");
  const closeSpan = document.getElementsByClassName("close")[0];

  // Show the modal with the loading animation
  modal.style.display = "block";
  modalLoading.style.display = "block";
  modalText.textContent = "Please wait while your palm is being read...";
  closeSpan.style.pointerEvents = "none";

  // Send request to backend
  fetch("http://localhost:3000/api/upload", {
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
      modalText.innerHTML = data.message; // Display the response
      modalLoading.style.display = "none"; // Hide loader
      closeSpan.style.pointerEvents = "auto"; // Enable close button
    })
    .catch((error) => {
      modalText.textContent = error.message; // Display error message
      modalLoading.style.display = "none"; // Hide loader
      closeSpan.style.pointerEvents = "auto"; // Enable close button
    });
});

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  document.getElementById("modal").style.display = "none";
};
