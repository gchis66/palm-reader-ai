document.getElementById("uploadButton").addEventListener("click", function () {
  const imageInput = document.getElementById("imageInput");
  if (imageInput.files.length === 0) {
    alert("Please select an image to upload.");
    return;
  }

  const formData = new FormData();
  formData.append("palmImage", imageInput.files[0]);

  // Show preview
  const preview = document.getElementById("preview");
  preview.innerHTML = "";
  const img = document.createElement("img");
  img.src = URL.createObjectURL(imageInput.files[0]);
  preview.appendChild(img);

  // Show the modal with the loading animation
  const modal = document.getElementById("modal");
  const modalText = document.getElementById("modal-text");
  const modalLoading = document.getElementById("modal-loading");
  modal.style.display = "block";
  modalLoading.style.display = "block"; // Show loader
  modalText.textContent = "Please wait while your palm is being read..."; // Set loading text

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
    })
    .catch((error) => {
      modalText.textContent = error.message; // Display error message
      modalLoading.style.display = "none"; // Hide loader
    });
});

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  document.getElementById("modal").style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
