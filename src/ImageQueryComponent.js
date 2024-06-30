import React, { useState } from "react";
import axios from "axios";
import MicRecorder from "mic-recorder-to-mp3";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import "./ImageQueryComponent.css";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

function ImageQueryComponent() {
  const [image, setImage] = useState(null);
  const [customQuery, setCustomQuery] = useState("");
  const [result, setResult] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [base64Audio, setBase64Audio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("en-US"); // Default language for speech synthesis
  const [querySent, setQuerySent] = useState(false); // Track if query has been sent

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
    setResult(""); // Reset result when a new image is selected
    console.log("Image selected:", e.target.files[0].name);
  };

  const handleCustomQueryChange = (e) => {
    setCustomQuery(e.target.value);
    setResult(""); // Reset result when custom query changes
    console.log("Custom query changed:", e.target.value);
  };

  const handleQuery = async (queryText) => {
    if (!image) {
      alert("Please upload an image first.");
      return;
    }

    setQuerySent(true); // Query has been sent, show loading icon
    const formData = new FormData();
    formData.append("image", image);
    formData.append("customQuery", queryText);
    formData.append("base64Audio", base64Audio); // Append recorded audio as base64

    try {
      console.log("Sending query with image and custom text...");
      const response = await axios.post(
        "https://invoice-stocksen-hirdesh-mewadas-projects.vercel.app/query-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResult(response.data.result);
      console.log("Query response received:", response.data.result);

      // Speak the result text when received
      speakText(response.data.result, language);
    } catch (error) {
      console.error("Error querying the image:", error);
      setResult("Error querying the image.");
    } finally {
      setQuerySent(false); // Reset query sent state
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      handleAudioStop();
    } else {
      handleAudioStart();
    }
  };

  const handleAudioStart = () => {
    Mp3Recorder.start()
      .then(() => {
        setIsRecording(true);
        console.log("Recording started...");
      })
      .catch((e) => console.error("Error starting recording:", e));
  };

  const handleAudioStop = () => {
    Mp3Recorder.stop()
      .getMp3()
      .then(([buffer, blob]) => {
        const audioURL = URL.createObjectURL(blob);
        setAudioURL(audioURL);
        console.log("Recording stopped.");
        convertBlobToBase64(blob).then((base64Audio) => {
          setBase64Audio(base64Audio);
          console.log("Audio converted to base64:", base64Audio);
          handleSpeechToText(base64Audio); // Convert audio to text
        });
        setIsRecording(false);
      })
      .catch((e) =>
        console.error("Error stopping recording or converting audio:", e)
      );
  };

  const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result.split(",")[1];
        resolve(base64Audio);
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleSpeechToText = async (base64Audio) => {
    if (!base64Audio) {
      console.error("Audio not converted to Base64");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        pipelineTasks: [
          {
            taskType: "asr",
            config: {
              language: {
                sourceLanguage: "hi", // Replace with your source language
              },
              serviceId: "ai4bharat/conformer-hi-gpu--t4", // Replace with your service ID
              audioFormat: "flac",
              samplingRate: 16000,
            },
          },
        ],
        inputData: {
          audio: [{ audioContent: base64Audio }],
        },
      };

      console.log("Sending audio for speech-to-text conversion...");
      const res = await axios.post(
        "https://dhruva-api.bhashini.gov.in/services/inference/pipeline",
        payload,
        {
          headers: {
            Authorization:
              "HAAdDttl-hYhfAlV2sjzG9z7HpLjmgyDJcZVvJwJOaw085g_dMqM1eSVwE8hfywB",
            Accept: " */*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Speech-to-text conversion result:", res.data);

      if (
        res.data &&
        res.data.pipelineResponse &&
        res.data.pipelineResponse.length > 0
      ) {
        const textResult =
          res.data.pipelineResponse[0].output[0].source.toLowerCase();
        setCustomQuery(textResult); // Update the input field with recognized text
        console.log("Converted text:", textResult);
        handleQuery(textResult); // Automatically send the query after converting audio to text
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error converting speech to text:", error);
    }
  };

  const speakText = (text, language) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.onerror = (e) => console.error("Speech synthesis error:", e);
    speechSynthesis.speak(utterance);
  };

  const handleClearResult = () => {
    setResult("");
    console.log("Result cleared.");
  };

  return (
    <div className="ImageQueryComponent">
      <h1 className="image-query-title">Invoice Query using Voice</h1>
      <div className="query-section">
        <p>Step 1: Upload an image to query:</p>
        <div className="file-input-container">
          <label htmlFor="file-upload" className="file-input-label">
            Select Image
          </label>
          <input
            id="file-upload"
            className="file-input"
            type="file"
            onChange={handleImageUpload}
          />
          {image && <span className="file-name">{image.name}</span>}
        </div>
        <p>Step 2: Enter a custom query or use voice</p>
        <input
          className="input-field"
          type="text"
          value={customQuery}
          onChange={handleCustomQueryChange}
        />
        {!querySent ? (
          <button className="query-button" onClick={() => handleQuery(customQuery)}>
            Send Query
          </button>
        ) : (
          <div className="loading-icon">
            <div className="assistant-bubble">
              <div className="dot1" />
              <div className="dot2" />
              <div className="dot3" />
            </div>
          </div>
        )}
        <hr />
        <div className="mic-container">
          {!isLoading && (
            <FontAwesomeIcon
              icon={faMicrophone}
              onClick={handleMicClick}
              className={`mic-button ${isRecording ? "recording" : ""}`}
            />
          )}
          {isLoading && (
            <div className="mic-loading">
              <div className="assistant-bubble">
                <div className="dot1" />
                <div className="dot2" />
                <div className="dot3" />
              </div>
            </div>
          )}
        </div>
        <div className="result-section">
          {result && (
            <div className="result">
              <h2>Result:</h2>
              <pre className="json">{JSON.stringify(result, null, 2)}</pre>
              <button
                onClick={() => speakText(result, language)}
                className="speak-button"
              >
                Speak Result
              </button>
              <button onClick={handleClearResult} className="ok-button">
                OK
              </button>
            </div>
          )}
        </div>
        <div className="language-selector">
          <p>Select Language for voice:</p>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en-US">English (US)</option>
            <option value="hi">Hindi</option>
            <option value="en-GB">English (UK)</option>
            {/* Add more languages as needed */}
          </select>
        </div>
      </div>
    </div>
  );
}

export default ImageQueryComponent;
