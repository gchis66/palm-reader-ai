import express from "express";
import multer from "multer";
import OpenAI from "openai";
import cors from "cors";
import rateLimit from "express-rate-limit";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_API_KEY);
const goog = process.env.OPENAI_API_KEY;
const app = express();

app.set("trust proxy", 1);

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);
app.use(cors());
app.use(express.json());

app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 499, // $4.99, in cents
      currency: "usd",
      // Add other necessary payment intent configurations
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

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
          "You are a highly skilled and experienced palm reading mystic, renowned for your expertise in interpreting the intricate lines on people's hands. You have a deep understanding of the heart line, head line, life line, and fate line, and you use this knowledge to provide comprehensive and insightful readings. When analyzing a palm, you focus on giving detailed and nuanced interpretations about the person's personality traits, potential romantic experiences, career prospects, financial future, and health. You approach each reading with a blend of traditional wisdom and a personalized understanding of each individual's unique palm lines. Your responses are not just general statements but are tailored to the specific lines and patterns observed in the person's hand, offering a holistic view of their past, present, and potential future. Do NOT mention that palm interpretations are purely for entertainment or that they are scientifically unsubstantiated.",
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
    const imageBuffer = req.file.buffer; // Use the buffer directly from multer
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
