import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Products = () => {
  console.log("products");
  const [data, setData] = useState([]);
  const [updatedFields, setUpdatedFields] = useState({});
  const [triggerTTS, setTriggerTTS] = useState(null);
  const previousDataRef = useRef([]);
  const acknowledgedProductsRef = useRef(new Set());

  // Define minimum threshold for product value
  const minThreshold = 30;

  const getData = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "/api/gemini/allproducts";
      console.log("API URL:", apiUrl);

      const response = await axios.get(apiUrl);
      console.log("Fetched data:", response.data);
      const newData = response.data.message;

      const updated = {};
      if (newData) {
        newData?.forEach((newProduct) => {
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

            // Check if product value falls below the threshold and hasn't been acknowledged
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

      // Remove highlight after 10 seconds
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

      // Update previous data reference
      previousDataRef.current = newData;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    getData(); // Initial fetch
    const interval = setInterval(getData, 10000); // Fetch data every 10 seconds

    // Cleanup interval on component unmount
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
    utterance.lang = "hi-IN"; // Set the language to Hindi
    utterance.onerror = (e) => console.error("Speech synthesis error:", e);
    speechSynthesis.speak(utterance);
  };

  const showAlert = (product) => {
    const text = `${product.name} का स्टॉक कम है। केवल ${product.inventory} बचे हैं।`;
    alert(text);
    acknowledgedProductsRef.current.add(product._id);
  };

  const getHighlightStyle = (productId, field) => {
    return updatedFields[productId] && updatedFields[productId][field]
      ? { color: "red" }
      : {};
  };

  return (
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flex: 1,
        flexDirection: "column",
      }}
    >
      <button onClick={getData}>Fetch Products</button>
      <h1>Product List</h1>
      <table>
        <thead>
          <tr>
            <th style={{ color: "red" }}>Name</th>
            <th style={{ color: "red" }}>Price</th>
            <th style={{ color: "red" }}>Inventory</th>
            <th style={{ color: "red" }}>Last Modified</th>
          </tr>
        </thead>
        <tbody>
          {data &&
            data?.map((product) => (
              <tr
                key={product._id}
                style={
                  product.inventory <= minThreshold
                    ? { color: "red" }
                    : {}
                }
              >
                <td style={getHighlightStyle(product._id, "name")}>
                  {product.name}
                </td>
                <td style={getHighlightStyle(product._id, "price")}>
                  {product.price}
                </td>
                <td style={getHighlightStyle(product._id, "inventory")}>
                  {product.inventory}
                </td>
                <td style={getHighlightStyle(product._id, "lastModified")}>
                  {new Date(product.lastModified).toLocaleString()}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default Products;
