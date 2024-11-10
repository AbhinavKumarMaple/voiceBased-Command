import React, { useState } from "react";
import axios from "axios";
import "./ImageQueryComponent.css";

function ImageQueryComponent() {
    const [image, setImage] = useState(null);
    const [customQuery, setCustomQuery] = useState("");
    const [result, setResult] = useState(null);
    const [querySent, setQuerySent] = useState(false);

    const handleImageUpload = (e) => {
        setImage(e.target.files[0]);
        setResult(null); // Reset result on new image upload
    };

    const handleCustomQueryChange = (e) => {
        setCustomQuery(e.target.value);
        setResult(null); // Reset result on new query input
    };

    const handleQuery = async (queryText) => {
        if (!image) {
            alert("Please upload an image first.");
            return;
        }

        setQuerySent(true);
        const formData = new FormData();
        formData.append("image", image);
        formData.append("customQuery", queryText);

        try {
            const response = await axios.post(
                "https://invoice-stocksen-hirdesh-mewadas-projects.vercel.app/query-image",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            if (response.data && response.data.result) {
                setResult(response.data.result);
            } else {
                setResult({ error: "Unexpected response format." });
            }
        } catch (error) {
            console.error("Error querying the image:", error);
            setResult({ error: "Error querying the image." });
        } finally {
            setQuerySent(false);
        }
    };

    const renderResultTable = (resultData) => {
        if (!resultData || !resultData.product_metadata || resultData.product_metadata.length === 0) {
            return <p>No product data available.</p>;
        }

        const product = resultData.product_metadata[0];
        const keys = Object.keys(product);

        return (
            <div className="product-details">
                <h2>Product Details</h2>
                <div className="result-flex">
                    <div className="result-image">
                        <img
                            src={URL.createObjectURL(image)}
                            alt="Product"
                            className="product-image"
                        />
                    </div>
                    <div className="result-content">
                        <div className="result-grid">
                            {keys.map((key, index) => (
                                <div key={index} className="result-item">
                                    <span>{key.replace("_", " ").toUpperCase()}</span>
                                    <span>{product[key] || "Not available"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="ImageQueryComponent">
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
                    {image && (
                        <div className="image-preview">
                            <img
                                src={URL.createObjectURL(image)}
                                alt="Uploaded"
                                className="uploaded-image"
                            />
                        </div>
                    )}
                    {image && <span className="file-name">{image.name}</span>}
                </div>
                <p>Step 2: Enter a custom query</p>
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
            </div>
            <div className="result-section">
                {result && (
                    <div className="result">
                        {result.error ? <p>{result.error}</p> : renderResultTable(result)}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ImageQueryComponent;
