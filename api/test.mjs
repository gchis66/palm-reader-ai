import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

async function askAboutImages(imageFilePaths, prompt) {
  const openai = new OpenAI({
    apiKey: "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",
  });
  const imageAsBase64 = fs.readFileSync(imageFilePaths, "base64");

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
          { type: "text", text: "prompt" },
          {
            type: "image_url",
            image_url: `data:image/jpg;base64,${imageAsBase64}`,
          },
        ],
      },
    ],
    temperature: 1.2,
    max_tokens: 4000,
  });
  console.log("RESPONSE HERE", response.choices[0].message.content);
}
(async () => {
  await askAboutImages(
    "palmtest.jpg",
    "Please read my palm and generate a detailed response of at least 500 words"
  );
})();
