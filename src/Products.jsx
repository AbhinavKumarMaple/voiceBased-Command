import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import MicRecorder from "mic-recorder-to-mp3";
import "./Products.css";

const Products = () => {
  const [data, setData] = useState([]);
  const [updatedFields, setUpdatedFields] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [base64Audio, setBase64Audio] = useState("");
  const [response, setResponse] = useState(null);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState("hi");
  const [asrServiceId, setAsrServiceId] = useState("ai4bharat/conformer-hi-gpu--t4");

  const Mp3Recorder = useRef(new MicRecorder({ bitRate: 128 }));

  const minThreshold = 30;
  const acknowledgedProductsRef = useRef(new Set());

  const [triggerTTS, setTriggerTTS] = useState(null);

  useEffect(() => {
    if (triggerTTS) {
      const text = `${triggerTTS.name} का स्टॉक कम है। केवल ${triggerTTS.inventory} बचे हैं।`;
      speakText(text);
      showAlert(triggerTTS);
    }
  }, [triggerTTS]);

  useEffect(() => {
    // Fetch initial data on component mount
    getData();
    const interval = setInterval(getData, 10000); // Polling interval
    return () => clearInterval(interval); // Clean up interval on unmount
  }, []);

  const handleMicClick = () => {
    if (!isLoading) {
      if (isRecording) {
        handleAudioStop();
      } else {
        handleAudioStart();
      }
    }
  };

  const handleAudioStart = () => {
    Mp3Recorder.current.start()
      .then(() => {
        setIsRecording(true);
      })
      .catch((e) => console.error(e));
  };

  const handleAudioStop = () => {
    Mp3Recorder.current.stop()
      .getMp3()
      .then(([buffer, blob]) => {
        const audioURL = URL.createObjectURL(blob);
        setAudioURL(audioURL);
        convertBlobToBase64(blob).then((base64Audio) => {
          handleAPICall(base64Audio);
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

  const speakText = (text) => {
    // Cancel any ongoing speech synthesis
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.onerror = (e) => console.error("Speech synthesis error:", e);
    speechSynthesis.speak(utterance);
  };

  const showAlert = (product) => {
    const text = `${product.name} का स्टॉक कम है। केवल ${product.inventory} बचे हैं।`;
    alert(text);
    acknowledgedProductsRef.current.add(product._id);
  };

  const getData = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "/api/gemini/allproducts";
      const response = await axios.get(apiUrl);
      const newData = response.data.message;

      const updated = {};
      if (newData) {
        newData.forEach((newProduct) => {
          const oldProduct = data.find(
            (product) => product._id === newProduct._id
          );
          if (oldProduct) {
            const updatedProductFields = {};
            if (oldProduct.name !== newProduct.name)
              updatedProductFields.name = true;
            if (oldProduct.price !== newProduct.price)
              updatedProductFields.price = true;
            if (oldProduct.inventory !== newProduct.inventory)
              updatedProductFields.inventory = true;
            if (oldProduct.lastModified !== newProduct.lastModified)
              updatedProductFields.lastModified = true;

            if (Object.keys(updatedProductFields).length > 0) {
              updated[newProduct._id] = {
                ...updatedProductFields,
                timestamp: Date.now(),
              };
            }

            if (
              newProduct.inventory <= minThreshold &&
              !acknowledgedProductsRef.current.has(newProduct._id)
            ) {
              setTriggerTTS(newProduct);
            }
          }
        });
      }

      setData(newData);
      setUpdatedFields((prev) => ({ ...prev, ...updated }));

      // Clean up old entries in updatedFields after a delay
      setTimeout(() => {
        const now = Date.now();
        setUpdatedFields((prev) => {
          const newUpdatedFields = { ...prev };
          Object.keys(newUpdatedFields).forEach((id) => {
            if (now - newUpdatedFields[id].timestamp > 30000) {
              delete newUpdatedFields[id];
            }
          });
          return newUpdatedFields;
        });
      }, 10000);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="product-dashboard">
      <button className="fetch-button" onClick={getData}>Fetch Products</button>
      <h1>Product List</h1>
      <div className="product-list">
        {data &&
          data.map((product) => (
            <div
              className="product-card"
              key={product._id}
              style={{
                backgroundColor:
                  product.inventory <= minThreshold ? "#b30c00" : "",
              }}
            >
              <div className="product-field">
                <span className="field-label">Name:</span>
                <span className="field-value">{product.name}</span>
              </div>
              <div className="product-field">
                <span className="field-label">Price:</span>
                <span className="field-value">{product.price}</span>
              </div>
              <div className="product-field">
                <span className="field-label">Inventory:</span>
                <span className="field-value">
                  {product.inventory}
                </span>
              </div>
              <div className="product-field">
                <span className="field-label">Last Modified:</span>
                <span className="field-value">
                  {new Date(product.lastModified).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
      </div>
      <div className="mic-container">
        <FontAwesomeIcon
          icon={faMicrophone}
          onClick={handleMicClick}
          className={`mic-button ${isRecording ? "recording" : ""}`}
        />
      </div>
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
  );
};

export default Products;

