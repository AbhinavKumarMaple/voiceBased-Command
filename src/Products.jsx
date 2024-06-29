import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Products.css"; // Import CSS file for styling

const Products = () => {
  const [data, setData] = useState([]);
  const [updatedFields, setUpdatedFields] = useState({});
  const [triggerTTS, setTriggerTTS] = useState(null);
  const previousDataRef = useRef([]);
  const acknowledgedProductsRef = useRef(new Set());

  const minThreshold = 30;

  const getData = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "/api/gemini/allproducts";
      const response = await axios.get(apiUrl);
      const newData = response.data.message;

      const updated = {};
      if (newData) {
        newData.forEach((newProduct) => {
          const oldProduct = previousDataRef.current.find(
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

      previousDataRef.current = newData;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    getData();
    const interval = setInterval(getData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (triggerTTS) {
      const text = `${triggerTTS.name} का स्टॉक कम है। केवल ${triggerTTS.inventory} बचे हैं।`;
      speakText(text);
      showAlert(triggerTTS);
    }
  }, [triggerTTS]);

  const speakText = (text) => {
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

  const getHighlightStyle = (productId, field) => {
    if (field === "inventory") {
      return updatedFields[productId] && updatedFields[productId][field]
        ? { color: "red" }
        : {};
    }
    return {};
  };

  const getCardStyle = (product) => {
    return product.inventory <= minThreshold
      ? { backgroundColor: "#ffcccc" }
      : {};
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
              style={getCardStyle(product)}
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
                <span
                  className="field-value"
                  style={
                    product.inventory <= minThreshold
                      ? { color: "red" }
                      : getHighlightStyle(product._id, "inventory")
                  }
                >
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
    </div>
  );
};

export default Products;
