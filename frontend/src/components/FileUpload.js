import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('File upload failed', response.status, text);
        alert('Upload failed');
        return;
      }

      const data = await response.json();

      // Persist to sessionStorage so refresh on /results still works
      sessionStorage.setItem('sellall_upload_result', JSON.stringify(data));

      // Navigate to the results page, also pass state for immediate render
      navigate('/results', { state: { uploadResult: data } });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Upload error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <div
        className={`dropzone ${dragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            document.getElementById('file-input')?.click();
          }
        }}
      >
        <div className="dropzone-inner">
          {/* <div className="dropzone-icon">⬆️</div> */}
          <div className="dropzone-text">
            <strong>Drag & drop</strong> your CSV here, or click to browse
          </div>
          {file && <div className="file-name">Selected: {file.name}</div>}
        </div>
        <input
          id="file-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
      <div
        className="upload-actions"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
      >
        <button type="submit" className="btn btn-primary">Upload</button>
        <span className="privacy-note" style={{ textAlign: 'center' }}>
          We do not store your file. It is deleted immediately after processing.
        </span>
      </div>
    </form>
  );
}

export default FileUpload;