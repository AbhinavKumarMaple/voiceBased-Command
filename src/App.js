import React, { useState, useEffect } from "react";
import axios from "axios";
import MicRecorder from "mic-recorder-to-mp3";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Products from "./Products";
import About from "./components/About";
import "./App.css";
import ImageQueryComponent from "./ImageQueryComponent";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

function App() {
  const [sourceLanguage, setSourceLanguage] = useState("hi");
  const [asrServiceId, setAsrServiceId] = useState(
    "ai4bharat/conformer-hi-gpu--t4"
  );
  const [audioURL, setAudioURL] = useState("");
  const [base64Audio, setBase64Audio] = useState("");
  const [response, setResponse] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (result?.message) {
      console.log("Speaking the text:", result.message);
      speakText(result.message, sourceLanguage);
    }
  }, [result, sourceLanguage]);

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
      })
      .catch((e) => console.error(e));
  };

  const handleAudioStop = () => {
    Mp3Recorder.stop()
      .getMp3()
      .then(([buffer, blob]) => {
        const audioURL = URL.createObjectURL(blob);
        setAudioURL(audioURL);
        convertBlobToBase64(blob).then((base64Audio) => {
          handleAPICall(base64Audio); // Call API with current audio data
        });
        setIsRecording(false);
      })
      .catch((e) => console.error(e));
  };

  const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result.split(",")[1];
        setBase64Audio(base64Audio);
        resolve(base64Audio);
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleAPICall = async (base64Audio) => {
    if (!base64Audio) {
      alert("Audio not converted to Base64");
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
                sourceLanguage: sourceLanguage,
              },
              serviceId: asrServiceId,
              audioFormat: "flac",
              samplingRate: 16000,
            },
          },
        ],
        inputData: {
          audio: [{ audioContent: base64Audio }],
        },
      };

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
      setResponse(res.data);

      if (
        res.data &&
        res.data.pipelineResponse &&
        res.data.pipelineResponse.length > 0
      ) {
        const secondApiPayload = {
          query: res.data.pipelineResponse[0].output[0].source.toLowerCase(),
        };

        const secondApiResponse = await axios.post(
          "/api/gemini",
          secondApiPayload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        setResult(secondApiResponse.data);
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error making API request:", error);
      console.error("Error details:", error.response?.data);
    }
  };

  const speakText = (text, language) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.onerror = (e) => console.error("Speech synthesis error:", e);
    speechSynthesis.speak(utterance);
  };

  return (
    <>
      <Header />
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              <div className="content">
              <div className="content-heading">Streamlined Inventory Management with Voice Commands</div>
               <hr/>
              <div className="content-description">
                <p>
                  Manually managing inventory is time-consuming and error-prone, especially for small businesses with limited resources and expertise. Existing solutions often require manual data entry, hindering efficiency and accuracy.
                </p>
                <p>
                  Our product integrates advanced voice command technology and image detection to offer a seamless solution for sellers. It allows real-time inventory checks and updates using voice commands in multiple languages, reducing the need for manual data entry and improving operational efficiency.
                </p>
                <p>
                  Key features include receiving voice-based alerts and notifications when stock levels reach predefined thresholds, facilitating proactive inventory management. The customizable voice commands streamline specific inventory tasks, enhancing overall productivity and reducing workload.
                </p>
              </div>
                {response && (
                  <div className="result">
                    <h2>Question:</h2>
                    <pre className="json">
                      {JSON.stringify(
                        response.pipelineResponse[0].output[0].source,
                        null,
                        2
                      )}
                    </pre>
                    <h2>Answer:</h2>
                    <pre className="json">
                      {JSON.stringify(result?.message, null, 2)}
                    </pre>
                  </div>
                )}
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
              </div>
            }
          />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/image-query" element={<ImageQueryComponent />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
