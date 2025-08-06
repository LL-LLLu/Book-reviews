import { useState } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';

export default function TestAvatarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const testUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      console.log('Testing avatar upload...');
      console.log('Token exists:', !!token);
      console.log('File:', file.name, file.size, file.type);
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('BASE URL:', process.env.NEXT_PUBLIC_BASE_URL);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/avatar`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            // Let axios set Content-Type with boundary
          }
        }
      );

      console.log('Upload success:', res.data);
      setResponse(res.data);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || err.message);
      setResponse(err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Avatar Upload Test</h1>
        
        <div className="space-y-6">
          {/* Environment Info */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
            <h2 className="font-bold mb-2">Environment Variables:</h2>
            <p>API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
            <p>BASE URL: {process.env.NEXT_PUBLIC_BASE_URL || 'Not set'}</p>
          </div>

          {/* File Input */}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-4"
            />
          </div>

          {/* Preview */}
          {preview && (
            <div>
              <h3 className="font-bold mb-2">Preview:</h3>
              <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded" />
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={testUpload}
            disabled={!file || loading}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Test Upload'}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded">
              <h3 className="font-bold">Error:</h3>
              <p>{error}</p>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="bg-green-100 text-green-700 p-4 rounded">
              <h3 className="font-bold">Response:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-100 text-blue-700 p-4 rounded">
            <h3 className="font-bold mb-2">Debug Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open browser DevTools (F12)</li>
              <li>Go to Network tab</li>
              <li>Select a file and click Test Upload</li>
              <li>Check the request details in Network tab</li>
              <li>Look for any errors in Console tab</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}