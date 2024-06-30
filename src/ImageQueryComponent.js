import React, { useState } from 'react';
import axios from 'axios';
import './ImageQueryComponent.css';

function ImageQueryComponent() {
  const [image, setImage] = useState(null);
  const [customQuery, setCustomQuery] = useState('');
  const [result, setResult] = useState('');

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);
    setResult(''); // Reset result when a new image is selected
  };

  const handleCustomQueryChange = (e) => {
    setCustomQuery(e.target.value);
  };

  const handleQuery = async () => {
    if (!image) {
      alert('Please upload an image first.');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('customQuery', customQuery);

    try {
      const response = await axios.post('http://localhost:5000/query-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data.result);
    } catch (error) {
      console.error('Error querying the image:', error);
      setResult('Error querying the image.');
    }
  };

  const handleRemoveResult = () => {
    setResult(''); // Clear the result state
  };

  return (
    <div className="ImageQueryComponent">
      <h1 className="image-query-title">Gemini Image Query</h1>
      <div className="query-section">
        <p>Upload an image to query:</p>
        <input type="file" onChange={handleImageUpload} />
        <p>Enter a custom query:</p>
        <input type="text" value={customQuery} onChange={handleCustomQueryChange} />
        <button className="query-button" onClick={handleQuery}>Query Image</button>
        <br />
        <hr />

        {result && (
          <div className="result">
            <h2>Result:</h2>
            <div>{result}</div>
            <button className="query-button" onClick={handleRemoveResult}>OK</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageQueryComponent;
