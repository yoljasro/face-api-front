import React, { useState } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button } from 'react-bootstrap';

const UploadPage = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!employeeId || !name || !role || !selectedFiles) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }

    const formData = new FormData();
    formData.append('employeeId', employeeId);
    formData.append('name', name);
    formData.append('role', role);

    Array.from(selectedFiles).forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await axios.post('http://localhost:4000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`Foydalanuvchi muvaffaqiyatli qo'shildi: ${response.data.name}`);
      setError(null);
    } catch (error) {
      setError('Foydalanuvchini yuklashda xatolik');
      setMessage(null);
    }
  };

  return (
    <Container>
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Xodim ID</Form.Label>
              <Form.Control
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Ism</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Roll</Form.Label>
              <Form.Control
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Rasm fayllari</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} multiple />
            </Form.Group>
            {error && <Card.Text className="text-danger">{error}</Card.Text>}
            {message && <Card.Text className="text-success">{message}</Card.Text>}
            <Button variant="primary" type="submit">
              Yuklash
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UploadPage;
