import { createPaymentIntent } from "../utils/stripe.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
