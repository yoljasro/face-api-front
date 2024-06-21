import { useState } from 'react';
import axios from 'axios';

const UploadPage = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFiles || !employeeId) {
      alert('Please select files and enter employee ID');
      return;
    }

    const formData = new FormData();
    formData.append('employeeId', employeeId);
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }

    try {
      await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    }
  };

  return (
    <div>
      <h1>Upload Employee Photos</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Employee ID:
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Select Photos:
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              required
            />
          </label>
        </div>
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default UploadPage;
