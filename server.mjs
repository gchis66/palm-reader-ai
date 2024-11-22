// server.mjs
import express from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";
import cors from "cors";
import rateLimit from "express-rate-limit";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_API_KEY);
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const app = express();

app.set("trust proxy", 1);

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

async function askAboutImages(imageBuffer, prompt) {
  try {
    const imageBase64 = imageBuffer.toString("base64");
    const mediaType = "image/jpeg"; // Adjust based on your image type

    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      temperature: 1.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      system:
        "You are a highly skilled and experienced palm reading mystic, renowned for your expertise in interpreting the intricate lines on people's hands. You have a deep understanding of the heart line, head line, life line, and fate line, and you use this knowledge to provide comprehensive and insightful readings. When analyzing a palm, you focus on giving detailed and nuanced interpretations about the person's personality traits, potential romantic experiences, career prospects, financial future, and health. You approach each reading with a blend of traditional wisdom and a personalized understanding of each individual's unique palm lines. Your responses are not just general statements but are tailored to the specific lines and patterns observed in the person's hand, offering a holistic view of their past, present, and potential future. Do NOT mention that palm interpretations are purely for entertainment or that they are scientifically unsubstantiated.",
    });

    return response.content[0].text;
  } catch (error) {
    console.error("Error in askAboutImages:", error);
    throw error;
  }
}

app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 499,
      currency: "usd",
    });
    console.log("Payment Intent created:", paymentIntent);
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error in create-payment-intent:", error);
    res.status(500).send({ error: error.message });
  }
});

app.post("/api/upload", upload.single("palmImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    const imageBuffer = req.file.buffer;
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
    res.json({ message: palmReading });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing image.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
