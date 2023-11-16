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

  // Show loading animation
  document.getElementById("loading").classList.remove("hidden");

  // Send request to backend
  fetch("http://localhost:3000/api/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("loading").classList.add("hidden");
      document.getElementById("result").textContent = data.message;
    })
    .catch((error) => {
      document.getElementById("loading").classList.add("hidden");
      console.error("Error:", error);
      alert("An error occurred while processing your request.");
    });
});
