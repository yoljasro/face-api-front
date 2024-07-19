import React, { useState } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap CSS is imported

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
    <Container className="my-5">
      <Card className="shadow-lg rounded border-0">
        <Card.Body>
          <h2 className="text-center mb-4">Xodimni qo'shish</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Xodim ID</Form.Label>
              <Form.Control
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Xodim ID-ni kiriting"
                isInvalid={!employeeId}
              />
              <Form.Control.Feedback type="invalid">
                Xodim ID-ni kiriting.
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ism</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ismingizni kiriting"
                isInvalid={!name}
              />
              <Form.Control.Feedback type="invalid">
                Ismni kiriting.
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Roll</Form.Label>
              <Form.Control
                as="select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                isInvalid={!role}
              >
                <option value="">Tanlang...</option>
                <option value="Chef">Chef</option>
                <option value="Waiter">Waiter</option>
              </Form.Control>
              <Form.Control.Feedback type="invalid">
                Rollni tanlang.
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rasm fayllari</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileChange}
                multiple
                isInvalid={!selectedFiles}
              />
              <Form.Control.Feedback type="invalid">
                Kamida bitta rasm fayli tanlang.
              </Form.Control.Feedback>
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}
            <Button variant="primary" type="submit" className="w-100">
              Yuklash
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UploadPage;
