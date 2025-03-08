import { Anthropic } from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

export async function askAboutImages(imageBuffer, prompt) {
  try {
    const imageBase64 = imageBuffer.toString("base64");
    const mediaType = "image/jpeg"; // Adjust based on your image type

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.5,
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
