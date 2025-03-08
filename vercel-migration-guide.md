# Step-by-Step Guide to Migrate Express Backend to Vercel Serverless Functions

This guide will help you migrate your Palm Reader application's backend from Render.com to Vercel serverless functions without converting to Next.js.

## 1. Project Structure Changes

Create the following new directories and files in your project:

```
/api
  /upload.js
  /create-payment-intent.js
/utils
  /anthropic.js
  /stripe.js
vercel.json
```

## 2. Install Required Dependencies

Run the following commands to install the necessary dependencies:

```bash
npm install --save @vercel/node formidable-serverless buffer-from form-data dotenv
```

## 3. Create Vercel Configuration File

Create a `vercel.json` file in the project root with the following content:

```json
{
  "version": 2,
  "builds": [
    { "src": "api/**/*.js", "use": "@vercel/node" },
    { "src": "index.html", "use": "@vercel/static" },
    { "src": "style.css", "use": "@vercel/static" },
    { "src": "src/**/*", "use": "@vercel/static" },
    { "src": "images/**/*", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/$1" }
  ],
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic_api_key",
    "STRIPE_API_KEY": "@stripe_api_key"
  }
}
```

## 4. Create Utility Files

### Step 4.1: Create Anthropic Utility File

Create `/utils/anthropic.js` with the following content:

```javascript
import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

export async function askAboutImages(imageBuffer, prompt) {
  try {
    const imageBase64 = imageBuffer.toString('base64');
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
```

### Step 4.2: Create Stripe Utility File

Create `/utils/stripe.js` with the following content:

```javascript
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_API_KEY);

export async function createPaymentIntent(amount = 499, currency = 'usd') {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}
```

## 5. Create API Endpoints

### Step 5.1: Create Upload Endpoint

Create `/api/upload.js` with the following content:

```javascript
import { buffer } from 'micro';
import { askAboutImages } from '../utils/anthropic.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body buffer
    const rawBody = await buffer(req);
    
    // Process multipart form data manually
    const boundary = req.headers['content-type'].split('boundary=')[1];
    
    // Extract image buffer from multipart form data
    const imageBuffer = extractFileBuffer(rawBody, boundary, 'palmImage');
    
    if (!imageBuffer) {
      return res.status(400).json({ error: 'No file uploaded.' });
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
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Error processing image.' });
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
  const contentTypeIndex = bufferString.indexOf('Content-Type:', filePartIndex);
  if (contentTypeIndex === -1) {
    return null;
  }
  
  // Find the end of the headers
  const headersEndIndex = bufferString.indexOf('\r\n\r\n', contentTypeIndex);
  if (headersEndIndex === -1) {
    return null;
  }
  
  // Find the start of the file content
  const fileContentStartIndex = headersEndIndex + 4;
  
  // Find the end of the file content
  const nextBoundaryIndex = bufferString.indexOf(boundaryString, fileContentStartIndex);
  if (nextBoundaryIndex === -1) {
    return null;
  }
  
  // Extract the file content
  const fileContentEndIndex = nextBoundaryIndex - 2; // Subtract 2 for the '\r\n'
  
  // Extract the file content as buffer
  return buffer.slice(fileContentStartIndex, fileContentEndIndex);
}
```

### Step 5.2: Create Alternative Upload Endpoint with Formidable

In case the manual extraction approach above has issues, here's an alternative using formidable. Create `/api/upload-formidable.js`:

```javascript
import formidable from 'formidable-serverless';
import { askAboutImages } from '../utils/anthropic.js';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  
  try {
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    if (!files.palmImage) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Read file from disk
    const imageBuffer = fs.readFileSync(files.palmImage.path);

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
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Error processing image.' });
  }
}
```

### Step 5.3: Create Payment Intent Endpoint

Create `/api/create-payment-intent.js` with the following content:

```javascript
import { createPaymentIntent } from '../utils/stripe.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const paymentIntent = await createPaymentIntent();
    console.log("Payment Intent created:", paymentIntent);
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error in create-payment-intent:", error);
    res.status(500).json({ error: error.message });
  }
}
```

## 6. Update Frontend Code

### Step 6.1: Update API Endpoints in `script.js`

Find and replace all references to the Render URL with the new API endpoints:

Open `src/script.js` and replace:

```javascript
const response = await fetch(
  "https://palm-reader-app.onrender.com/api/upload",
  {
    method: "POST",
    body: formData,
  }
);
```

With:

```javascript
const response = await fetch(
  "/api/upload",
  {
    method: "POST",
    body: formData,
  }
);
```

And replace:

```javascript
fetch("https://palm-reader-app.onrender.com/create-payment-intent", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
})
```

With:

```javascript
fetch("/api/create-payment-intent", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
})
```

## 7. Configure Environment Variables in Vercel

When deploying to Vercel, you'll need to set up the following environment variables:

1. ANTHROPIC_API_KEY - Your Anthropic API key
2. STRIPE_API_KEY - Your Stripe API key

Set these in the Vercel dashboard under your project settings > Environment Variables.

## 8. Handle Serverless Function Limitations

### Step 8.1: Add Base64 Encoding Option

Since serverless functions can have issues with direct file uploads, let's add an alternative approach. Update your frontend to convert the image to base64 before sending:

Create a new file `src/base64-utils.js`:

```javascript
// Convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // The result includes the data URL prefix (e.g., "data:image/jpeg;base64,")
      // which we need to remove
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}
```

Now create another API endpoint for base64 uploads in `/api/upload-base64.js`:

```javascript
import { askAboutImages } from '../utils/anthropic.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    // Convert base64 string to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');

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
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Error processing image.' });
  }
}
```

### Step 8.2: Modify Frontend to Support Base64 Upload

Add a new function to your `script.js` that can use the base64 upload method as a fallback:

```javascript
async function uploadImageAsBase64() {
  const previewImg = preview.querySelector("img");
  if (!previewImg) {
    alert("Please select or capture an image first.");
    return;
  }

  modal.style.display = "block";
  lockBodyScroll();
  adjustModalContent();
  modalLoading.style.display = "block";
  modalText.textContent = "Please wait while your palm is being read...";
  closeSpan.style.pointerEvents = "none";

  try {
    // Fetch the image as a blob
    const response = await fetch(previewImg.src);
    const imageBlob = await response.blob();

    if (imageBlob.size > 5 * 1024 * 1024) {
      throw new Error(
        "Image size exceeds 5MB limit. Please try again with a smaller image."
      );
    }

    // Convert blob to base64
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(imageBlob);
    });

    // Send base64 data to the API
    const apiResponse = await fetch("/api/upload-base64", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64: base64 }),
    });

    if (!apiResponse.ok) {
      throw new Error(
        apiResponse.status === 413
          ? "The image is too large. Please try again with a smaller image."
          : apiResponse.status === 429
          ? "Too many requests. Please try again later."
          : "An error occurred while processing your request."
      );
    }

    const data = await apiResponse.json();
    const [previewContent, fullContent] = splitContent(data.message);
    modalText.innerHTML = previewContent;
    document.getElementById("payment-info-container").style.display = "block";

    const paymentButton = document.createElement("button");
    paymentButton.classList.add("paymentbtn");
    paymentButton.textContent = "Unlock Full Reading for $4.99";
    paymentButton.onclick = () =>
      openStripeCheckout(previewContent + fullContent);
    modalText.appendChild(paymentButton);
  } catch (error) {
    modalText.textContent = error.message;
  } finally {
    modalLoading.style.display = "none";
    closeSpan.style.pointerEvents = "auto";
  }
}
```

Modify the existing `uploadButton` event listener in `script.js` to try the standard upload method first, then fall back to the base64 method if needed:

```javascript
uploadButton.addEventListener("click", async function () {
  const formData = new FormData();
  let imageBlob;

  const previewImg = preview.querySelector("img");
  if (!previewImg) {
    alert("Please select or capture an image first.");
    return;
  }

  try {
    const response = await fetch(previewImg.src);
    imageBlob = await response.blob();

    if (imageBlob.size > 5 * 1024 * 1024) {
      throw new Error(
        "Image size exceeds 5MB limit. Please try again with a smaller image."
      );
    }

    formData.append("palmImage", imageBlob, "palm.jpg");
  } catch (error) {
    alert(error.message);
    return;
  }

  modal.style.display = "block";
  lockBodyScroll();
  adjustModalContent();
  modalLoading.style.display = "block";
  modalText.textContent = "Please wait while your palm is being read...";
  closeSpan.style.pointerEvents = "none";

  try {
    let response;
    let useBase64Method = false;
    
    try {
      // Try the standard multipart form upload first
      response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      // If that fails, switch to base64 method
      console.log("Standard upload failed, trying base64 method");
      useBase64Method = true;
    }
    
    if (useBase64Method || !response || !response.ok) {
      // Use the base64 upload method as fallback
      await uploadImageAsBase64();
      return; // uploadImageAsBase64 handles all the UI updates
    }

    const data = await response.json();
    const [previewContent, fullContent] = splitContent(data.message);
    modalText.innerHTML = previewContent;
    document.getElementById("payment-info-container").style.display = "block";

    const paymentButton = document.createElement("button");
    paymentButton.classList.add("paymentbtn");
    paymentButton.textContent = "Unlock Full Reading for $4.99";
    paymentButton.onclick = () =>
      openStripeCheckout(previewContent + fullContent);
    modalText.appendChild(paymentButton);
  } catch (error) {
    modalText.textContent = error.message;
  } finally {
    modalLoading.style.display = "none";
    closeSpan.style.pointerEvents = "auto";
  }
});
```



## 9. Clean Up

Once everything is working correctly on Vercel:

Update any documentation or references to the old backend URL

## Conclusion

You've now successfully prepared your Palm Reader application for migration from Render.com to Vercel serverless functions! Once deployed, the application should run more cost-effectively on Vercel's generous free tier.
