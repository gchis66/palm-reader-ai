import fs from "fs";
import express from "express";
import multer from "multer";
import OpenAI from "openai";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables manually using dotenv
dotenv.config();
const goog = process.env.OPENAI_API_KEY;
const app = express();
const upload = multer({ dest: "/api/uploads/" }); // You could also add file size limits and other options here.
app.use(cors());
app.use(express.json());

async function askAboutImages(imageBuffer, prompt) {
  const openai = new OpenAI({
    apiKey: goog,
  });
  const imageAsBase64 = imageBuffer.toString("base64");

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "system",
        content:
          "You are a highly skilled and experienced palm reading mystic, renowned for your expertise in interpreting the intricate lines on people's hands. You have a deep understanding of the heart line, head line, life line, and fate line, and you use this knowledge to provide comprehensive and insightful readings. When analyzing a palm, you focus on giving detailed and nuanced interpretations about the person's personality traits, potential romantic experiences, career prospects, financial future, and health. You approach each reading with a blend of traditional wisdom and a personalized understanding of each individual's unique palm lines. Your responses are not just general statements but are tailored to the specific lines and patterns observed in the person's hand, offering a holistic view of their past, present, and potential future.Do NOT mention that palm interpretations are purely for entertainment or that they are scientifically unsubstantiated.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: `data:image/jpg;base64,${imageAsBase64}`,
          },
        ],
      },
    ],
    temperature: 1.1,
    max_tokens: 4000,
  });

  return response.choices[0].message.content;
}

app.post("/api/upload", upload.single("palmImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    const imageBuffer = fs.readFileSync(req.file.path);
    const prompt =
      "Please read my palm and generate a detailed response of at least 500 words";
    const palmReading = await askAboutImages(imageBuffer, prompt);

    res.json({ message: palmReading });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing image.");
  } finally {
    // Delete the uploaded file after processing
    fs.unlinkSync(req.file.path);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});