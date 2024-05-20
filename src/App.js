import React, { useState, useRef } from "react";
import axios from "axios";
import MicRecorder from "mic-recorder-to-mp3";
import "./App.css";

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
  //ai result in state
  const [Result, setResult] = useState("");

  //loading
  const [isLoading, setIsLoading] = useState(false);

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
        convertBlobToBase64(blob);
        setIsRecording(false);
      })
      .catch((e) => console.error(e));
  };

  const convertBlobToBase64 = (blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result.split(",")[1];
      console.log("Base64 Audio:", base64Audio); // Debug: Log the Base64 audio string
      setBase64Audio(base64Audio);
    };
    reader.readAsDataURL(blob);
  };

  const handleAPICall = async () => {
    if (!audioURL) {
      alert("No audio recorded");
      return;
    }

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

      console.log("Payload:", JSON.stringify(payload, null, 2)); // Debug: Log the payload
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

      // Call the second API with the response from the first API
      if (
        res.data &&
        res.data.pipelineResponse &&
        res.data.pipelineResponse.length > 0
      ) {
        const secondApiPayload = {
          query: res.data.pipelineResponse[0].output[0].source,
        };
        const secondApiResponse = await axios.post(
          "/api/gemini/",
          secondApiPayload
        );

        setResult((prev) => secondApiResponse.data);
        setIsLoading(false);
        console.log("Second API Response:", secondApiResponse.data);
        // Handle the response from the second API as needed
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error making API request:", error);
      console.error("Error details:", error.response?.data);
    }
  };

  return (
    <div className="App">
      <h1>Live Audio Recording App</h1>
      <div className="controls">
        <button
          onClick={handleAudioStart}
          disabled={isRecording}
          className="button"
        >
          Start Recording
        </button>
        <button
          onClick={handleAudioStop}
          disabled={!isRecording}
          className="button"
        >
          Stop Recording
        </button>
      </div>
      <div className="audio-container">
        {audioURL && (
          <div className="audio-player">
            <h2>Recorded Audio:</h2>
            <audio controls src={audioURL}></audio>
          </div>
        )}
      </div>
      <div className="action">
        <button onClick={handleAPICall} className="button action-button">
          Perform Action
        </button>
      </div>
      {isLoading && <div className="loading">Loading....</div>}
      {Result && (
        <div className="result">
          <h2>Question:</h2>
          <pre>
            {JSON.stringify(response.pipelineResponse[0].output[0].source)}
          </pre>
          <h2>Answer:</h2>
          <pre>{JSON.stringify(Result?.message)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
