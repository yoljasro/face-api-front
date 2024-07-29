  import React, { useState } from 'react';
  import axios from 'axios';

  const UploadPage: React.FC = () => {
    const [name, setName] = useState('');
    const [image, setImage] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (name && image) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('image', image);

        try {
          await axios.post('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          alert('Upload successful');
        } catch (error) {
          console.error('Error uploading file:', error);
          alert('Upload failed');
        }
      }
    };

    return (
      <div>
        <h1>Upload User Data</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
          <button type="submit">Upload</button>
        </form>
      </div>
    );
  };

  export default UploadPage;
