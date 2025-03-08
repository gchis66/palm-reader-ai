import { buffer } from "micro";
import { askAboutImages } from "../utils/anthropic.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get raw body buffer
    const rawBody = await buffer(req);

    // Process multipart form data manually
    const boundary = req.headers["content-type"].split("boundary=")[1];

    // Extract image buffer from multipart form data
    const imageBuffer = extractFileBuffer(rawBody, boundary, "palmImage");

    if (!imageBuffer) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const prompt = `Please read my palm and generate a detailed response of at least 600 words in the following format: 
      
    <h2>Palm Reading Analysis</h2>

<p>put your introduction here where you briefly describe what you notice about the palm</p>

<!-- PAYWALL -->

<h3>Health and Physical Vitality</h3>
<p>put your palm reading findings in regards to health and physical vitality here</p>

<h3>Love and Emotion</h3>
<p>put your palm reading findings in regards to love and emotion here</p>

<h3>Intelligence and Mentality</h3>
<p>put your palm reading findings in regards to intelligence and mentality here</p>

<h3>Career and Luck</h3>
<p>put your palm reading findings in regards to career and luck here</p>

<h3>Final Thoughts</h3>
<p>put a recap of the important details here and end with a comprehensive conclusion about their palm and their future and destiny</p> 
    `;

    const palmReading = await askAboutImages(imageBuffer, prompt);

    res.status(200).json({ message: palmReading });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Error processing image." });
  }
}

// Helper function to extract file buffer from multipart form data
function extractFileBuffer(buffer, boundary, fieldName) {
  const boundaryString = `--${boundary}`;
  const bufferString = buffer.toString();

  // Find the start of the file part
  const filePartIndex = bufferString.indexOf(`name="${fieldName}"`);
  if (filePartIndex === -1) {
    return null;
  }

  // Find the content type line
  const contentTypeIndex = bufferString.indexOf("Content-Type:", filePartIndex);
  if (contentTypeIndex === -1) {
    return null;
  }

  // Find the end of the headers
  const headersEndIndex = bufferString.indexOf("\r\n\r\n", contentTypeIndex);
  if (headersEndIndex === -1) {
    return null;
  }

  // Find the start of the file content
  const fileContentStartIndex = headersEndIndex + 4;

  // Find the end of the file content
  const nextBoundaryIndex = bufferString.indexOf(
    boundaryString,
    fileContentStartIndex
  );
  if (nextBoundaryIndex === -1) {
    return null;
  }

  // Extract the file content
  const fileContentEndIndex = nextBoundaryIndex - 2; // Subtract 2 for the '\r\n'

  // Extract the file content as buffer
  return buffer.slice(fileContentStartIndex, fileContentEndIndex);
}
