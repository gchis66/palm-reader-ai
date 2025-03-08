import { askAboutImages } from "../../utils/anthropic.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image data provided." });
    }

    // Convert base64 string to buffer
    const imageBuffer = Buffer.from(imageBase64, "base64");

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
