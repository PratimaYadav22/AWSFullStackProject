import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Import a CSS file for styling 

const App = () => {
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState(''); // State for input text

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleTextInputChange = (e) => {
    setInputText(e.target.value);
  };

  const getPresignedUrl = async () => {
    try {
      const response = await axios({
        method: 'POST',
        url: process.env.REACT_APP_API_URL,
        headers: {
          'Content-Type': 'text/plain',
        },
        data: {
          fileName: file.name,
          contentType: file.type,
        },
      });
      return response.data.preSignedUrl;
    } catch (error) {
      console.error('Error getting presigned URL', error);
      throw error;
    }
  };

  const uploadFileToS3 = async (preSignedUrl) => {
      const result = await axios.put(preSignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });
      if (result.status === 200) {
        alert('File upload successful');
        console.log('DYNAMODB_URL:', process.env.REACT_APP_DYNAMODB_URL);
        alert('Input File saved in dynamoDB.');
        const response = await axios({
          method: 'POST',
          url: process.env.REACT_APP_DYNAMODB_URL,
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            inputText: inputText,
            inputFilePath: `${process.env.REACT_APP_S3_BUCKET_NAME}/${file.name}` // Assuming `file` is the file that was uploaded
          },
        });
        console.log('Data saved in DynamoDB:', response.data);
      } else {
        throw new Error('File not uploaded successfully');
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !inputText) {
      alert('Please select a file and enter some text to upload');
      return;
    }
    try {
      const preSignedUrl = await getPresignedUrl();
      await uploadFileToS3(preSignedUrl);
    } catch (error) {
      console.error('Error during file upload', error);
    }
  };

  return (
    <div className="App">
      <h1>Upload File and Text to S3</h1>
      <input type="text" placeholder="Enter some text" value={inputText} onChange={handleTextInputChange} />
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleSubmit}>Upload</button>
    </div>
  );
};

export default App;
