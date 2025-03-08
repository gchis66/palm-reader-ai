"use client";

import { useState } from "react";
import Image from "next/image";
import "../style.css";

export default function Home() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setReading(null);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError("Please select an image of your palm");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setReading(data.reading);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to get your palm reading. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header>
        <h1>Palm Reveal</h1>
        <p>Discover Your Destiny Through Palm Reading</p>
      </header>

      <main>
        <section className="intro">
          <h2>Unlock the Secrets in Your Palm</h2>
          <p>
            Your hands hold the map to your life's journey. Our AI-powered palm
            reading analyzes the unique lines and patterns in your palm to
            reveal insights about your personality, relationships, career, and
            future.
          </p>
        </section>

        <section className="upload-section">
          <h2>Upload Your Palm Image</h2>
          <p>Take a clear photo of your palm and upload it below:</p>
          <div className="upload-container">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="palm-image"
                  className="block text-lg font-medium"
                >
                  Upload an image of your palm
                </label>
                <input
                  type="file"
                  id="palm-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                />
              </div>

              {preview && (
                <div className="flex justify-center">
                  <div className="relative w-64 h-64">
                    <img
                      src={preview}
                      alt="Palm preview"
                      className="object-contain w-full h-full rounded-lg"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-70"
              >
                {loading ? "Reading your palm..." : "Reveal My Destiny"}
              </button>
            </form>
          </div>
        </section>

        <section className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Take a Photo</h3>
              <p>
                Capture a clear image of your palm with your smartphone or
                camera.
              </p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Upload</h3>
              <p>Upload your palm image through our secure platform.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Receive Your Reading</h3>
              <p>
                Our AI analyzes your palm and provides a detailed reading within
                seconds.
              </p>
            </div>
          </div>
        </section>

        <div id="myModal" className="modal">
          <div className="modal-content">
            <span className="close">&times;</span>
            <div id="modal-loading" className="loading">
              <div className="spinner"></div>
            </div>
            <div id="modal-text"></div>
            <div id="payment-info-container">
              <div id="payment-info">
                <p>
                  Unlock your complete palm reading for just $4.99 to discover
                  deeper insights about your life path.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-900/50 rounded-lg text-center">
            <p>{error}</p>
          </div>
        )}

        {reading && (
          <div className="mt-8 p-6 bg-indigo-900/50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Your Palm Reading
            </h2>
            <div className="prose prose-invert max-w-none">
              <p>{reading}</p>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2023 Palm Reveal. All rights reserved.</p>
        <p className="disclaimer">
          For entertainment purposes only. Results may vary.
        </p>
      </footer>
    </div>
  );
}
