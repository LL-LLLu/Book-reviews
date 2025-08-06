import { useState } from 'react';
import axios from 'axios';

export default function DebugUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);
    
    const token = localStorage.getItem('token');
    
    try {
      console.log('Testing upload...');
      console.log('File:', file);
      console.log('FormData entries:');
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(`  ${key}:`, value);
      });

      // Test with auth
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/avatar`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            // Let axios set Content-Type automatically
          }
        }
      );

      setResult(response.data);
      setError('');
      console.log('Success:', response.data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.message || err.message);
      setResult(err.response?.data || null);
    }
  };

  const testUploadNoAuth = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      console.log('Testing upload without auth...');
      
      // Test without auth
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/test-upload`,
        formData
      );

      setResult(response.data);
      setError('');
      console.log('Success (no auth):', response.data);
    } catch (err: any) {
      console.error('Error (no auth):', err);
      setError(err.response?.data?.message || err.message);
      setResult(err.response?.data || null);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Debug Avatar Upload</h1>
      
      <div className="space-y-4">
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-black dark:text-white
                       file:mr-4 file:py-2 file:px-4
                       file:rounded file:border-0
                       file:text-sm file:font-semibold
                       file:bg-gray-100 file:text-gray-700
                       hover:file:bg-gray-200"
          />
        </div>

        <div className="space-x-4">
          <button
            onClick={testUpload}
            disabled={!file}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Test Upload (With Auth)
          </button>
          
          <button
            onClick={testUploadNoAuth}
            disabled={!file}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            Test Upload (No Auth)
          </button>
        </div>

        {file && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <h3 className="font-semibold">File Info:</h3>
            <p>Name: {file.name}</p>
            <p>Size: {file.size} bytes</p>
            <p>Type: {file.type}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
            <h3 className="font-semibold">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
            <h3 className="font-semibold">Result:</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}