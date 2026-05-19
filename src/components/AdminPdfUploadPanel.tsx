import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';

export function AdminPdfUploadPanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append(
        'pdf',
        selectedFile
      );

      const response = await fetch(
        'http://localhost:5000/upload',
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();

      console.log('Upload response:', data);

      alert(`Uploaded: ${data.filename}`);

      setSelectedFile(null);

    } catch (error) {
      console.error('Upload error:', error);

      alert('Failed to upload PDF');
    }

    setUploading(false);
  };

  return (
    <div className="p-6">

      <div className="bg-white rounded-xl border border-gray-200 p-6">

        <div className="flex items-center gap-3 mb-6">

          <div className="bg-blue-100 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>

          <div>
            <h2 className="text-lg font-bold">
              PDF Upload
            </h2>

            <p className="text-sm text-gray-600">
              Upload documents into chatbot knowledge base
            </p>
          </div>

        </div>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) =>
            setSelectedFile(
              e.target.files?.[0] || null
            )
          }
          className="mb-4"
        />

        {selectedFile && (
          <div className="mb-4 text-sm text-gray-600">
            Selected:
            {' '}
            {selectedFile.name}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300"
        >
          <Upload className="w-4 h-4" />

          {uploading
            ? 'Uploading...'
            : 'Upload PDF'}
        </button>

      </div>

    </div>
  );
}