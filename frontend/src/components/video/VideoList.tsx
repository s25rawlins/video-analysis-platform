'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Video } from '@/types';

interface VideoResponse {
  items: Video[];
  metadata: {
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

interface FilterState {
  status: string | undefined;
  search: string;
  minDuration: number | undefined;
  maxDuration: number | undefined;
  minFileSize: number | undefined;
  maxFileSize: number | undefined;
  startDate: Date | undefined;
  endDate: Date | undefined;
  sortBy: 'upload_time' | 'filename' | 'status' | 'processing_duration' | 'transcription_confidence';
  sortOrder: 'asc' | 'desc';
}

export default function VideoList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    status: undefined,
    search: '',
    minDuration: undefined,
    maxDuration: undefined,
    minFileSize: undefined,
    maxFileSize: undefined,
    startDate: undefined,
    endDate: undefined,
    sortBy: 'upload_time',
    sortOrder: 'desc'
  });

  const { data, isLoading, error, isError } = useQuery<VideoResponse>({
    queryKey: ['videos', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.minDuration && { min_duration: filters.minDuration.toString() }),
        ...(filters.maxDuration && { max_duration: filters.maxDuration.toString() }),
        ...(filters.minFileSize && { min_file_size: filters.minFileSize.toString() }),
        ...(filters.maxFileSize && { max_file_size: filters.maxFileSize.toString() }),
        ...(filters.startDate && { start_date: filters.startDate.toISOString() }),
        ...(filters.endDate && { end_date: filters.endDate.toISOString() }),
        order_by: filters.sortBy,
        order: filters.sortOrder
      });
      const response = await axios.get(
        `http://localhost:8000/api/v1/videos?${params}`
      );
      return response.data;
    },
    retry: 2,
    staleTime: 30000 // Consider data fresh for 30 seconds
  });

  const transcribeMutation = useMutation({
    mutationFn: async (videoId: number) => {
      return axios.post(`http://localhost:8000/api/v1/videos/${videoId}/transcribe`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      console.error('Transcription failed:', error);
      // You might want to show a toast notification here
    }
  });

  // Loading States
  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border p-4 rounded-lg shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State 
  if (isError) {
    return (
      <div className="mt-8 p-4 border border-red-300 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-medium">Error Loading Videos</h3>
        <p className="text-red-600 mt-2 text-sm">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}  
        </p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['videos'] })}
          className="mt-4 text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Filters Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text"
            placeholder="Search videos..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          />

          <select
            value={filters.status || ''}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value || undefined }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="uploaded">Uploaded</option>
            <option value="processing">Processing</option>  
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"  
            placeholder="Min Duration (s)"
            value={filters.minDuration || ''}
            onChange={(e) => setFilters(f => ({ ...f, minDuration: e.target.value ? parseFloat(e.target.value) : undefined }))}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="number"
            placeholder="Max Duration (s)"  
            value={filters.maxDuration || ''}
            onChange={(e) => setFilters(f => ({ ...f, maxDuration: e.target.value ? parseFloat(e.target.value) : undefined }))}
            className="px-3 py-2 border rounded-lg" 
          />
          <input 
            type="number"
            placeholder="Min File Size (bytes)"
            value={filters.minFileSize || ''}
            onChange={(e) => setFilters(f => ({ ...f, minFileSize: e.target.value ? parseInt(e.target.value) : undefined }))}  
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="number"
            placeholder="Max File Size (bytes)"
            value={filters.maxFileSize || ''}
            onChange={(e) => setFilters(f => ({ ...f, maxFileSize: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="px-3 py-2 border rounded-lg"  
          />
          <input
            type="date"  
            value={filters.startDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="date"
            value={filters.endDate?.toISOString().split('T')[0] || ''}  
            onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value ? new Date(e.target.value) : undefined }))}
            className="px-3 py-2 border rounded-lg" 
          />
        </div>

        <div className="flex justify-end gap-4">
          <select 
            value={filters.sortBy}
            onChange={(e) => setFilters(f => ({ 
              ...f, 
              sortBy: e.target.value as FilterState['sortBy'] 
            }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="upload_time">Upload Date</option>
            <option value="filename">Filename</option>
            <option value="status">Status</option>  
            <option value="processing_duration">Processing Duration</option>
            <option value="transcription_confidence">Transcription Confidence</option>
          </select>

          <button
            onClick={() => setFilters(f => ({
              ...f,  
              sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc'
            }))}
            className="px-3 py-2 border rounded-lg flex items-center gap-2"
          >
            {filters.sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>

      {/* Videos List */}  
      <div className="space-y-4">
        {data?.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No videos found matching your criteria  
          </div>
        ) : (
          data?.items.map((video) => (
            <div key={video.id} className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold">{video.filename}</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>Status: {video.status}</div>
                <div>Duration: {video.video_metadata?.duration}s</div>
                <div>Resolution: {video.video_metadata?.resolution?.width}x{video.video_metadata?.resolution?.height}</div>
                <div>Size: {(video.video_metadata?.file_size / 1024 / 1024).toFixed(2)} MB</div>
                <div>Processing Time: {video.processing_duration?.toFixed(2)}s</div>
                <div>Confidence: {(video.transcription_confidence * 100).toFixed(1)}%</div>
              </div>

              {video.transcription && (  
                <div className="mt-4">
                  <h4 className="font-medium">Transcription:</h4>  
                  <p className="text-sm mt-1">{video.transcription}</p>
                </div>
              )}

              {video.status === 'uploaded' && (
                <button
                  onClick={() => transcribeMutation.mutate(video.id)}  
                  disabled={transcribeMutation.isPending}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded 
                           hover:bg-blue-600 disabled:bg-gray-300
                           disabled:cursor-not-allowed"
                >
                  {transcribeMutation.isPending ? 'Transcribing...' : 'Start Transcription'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data?.metadata && data.items.length > 0 && (
        <div className="mt-6 flex justify-between items-center">  
          <div className="text-sm text-gray-600">
            Showing {((data.metadata.page - 1) * 10) + 1} to {Math.min(data.metadata.page * 10, data.metadata.total_count)} of {data.metadata.total_count} videos
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={!data.metadata.has_previous}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {data.metadata.page} of {data.metadata.total_pages}  
            </span>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={!data.metadata.has_next}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50" 
            >
              Next  
            </button>
          </div>
        </div>
      )}
    </div>
  );
}