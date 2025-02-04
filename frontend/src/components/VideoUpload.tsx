// src/components/VideoUpload.tsx
'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export default function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return axios.post('http://localhost:8000/api/v1/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      // Invalidate and refetch videos list
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setFile(null);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    mutation.mutate(file);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="video-upload" 
            className="block text-sm font-medium text-gray-700"
          >
            Choose Video
          </label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
          />
        </div>
        
        <button
          type="submit"
          disabled={!file || mutation.isPending}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded
                   hover:bg-blue-600 disabled:bg-gray-300
                   disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Uploading...' : 'Upload Video'}
        </button>

        {mutation.isSuccess && (
          <div className="text-green-600">
            Video uploaded successfully!
          </div>
        )}

        {mutation.isError && (
          <div className="text-red-600">
            Upload failed. Please try again.
          </div>
        )}
      </form>
    </div>
  );
}