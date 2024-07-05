import { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../styles/upload.module.sass';
import { Container, Form, Button } from 'react-bootstrap';

const UploadPage = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [name, setName] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedFiles || !employeeId || !name) {
      toast.error('Please fill all the fields and select files');
      return;
    }

    const formData = new FormData();
    formData.append('employeeId', employeeId);
    formData.append('name', name); // Add name to FormData
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }

    try {
      await axios.post('https://studentunion.uz/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    }
  };

  return (
    <Container className={styles.container}>
      <h1>Upload Employee Photos</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group className={styles['form-group']}>
          <Form.Label>Employee ID</Form.Label>
          <Form.Control
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className={styles['form-group']}>
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className={styles['form-group']}>
          <Form.Label>Select Photos</Form.Label>
          <Form.Control
            type="file"
            multiple
            onChange={handleFileChange}
            required
          />
        </Form.Group>
        <Button type="submit">Upload</Button>
      </Form>
      <ToastContainer />
    </Container>
  );
};

export default UploadPage;
