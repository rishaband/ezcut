import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Download, 
  Eye, 
  Play,
  Search,
  Filter,
  Calendar,
  MoreVertical,
  Trash2,
  Upload,
  FileVideo,
  Scissors
} from 'lucide-react';
import { api } from '../api/client';

interface HistoryItem {
  id: string;
  title: string;
  fileName: string;
  processedAt: string;
  status: 'completed' | 'processing' | 'failed';
  fileSize: number;
  totalDuration: number;
  keyframeCount: number;
  transcriptSegments: number;
  progress?: number;
}

const HistoryTab: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [loading, setLoading] = useState(true);

  // Load job history from API
  useEffect(() => {
    loadJobHistory();
  }, []);

  const loadJobHistory = async () => {
    try {
      setLoading(true);
      const response = await api.listJobs();
      
      // Convert API jobs to HistoryItem format
      const historyItems: HistoryItem[] = response.jobs.map(job => ({
        id: job.job_id,
        title: `Processing Job ${job.job_id.slice(0, 8)}`,
        fileName: 'Multiple Files', // API doesn't provide file names in list
        processedAt: job.created_at,
        status: job.status === 'completed' ? 'completed' : 
                job.status === 'error' ? 'failed' : 'processing',
        fileSize: 0, // Not available from API
        totalDuration: 0, // Not available from API
        keyframeCount: 0, // Not available from API
        transcriptSegments: 0, // Not available from API
        progress: job.progress
      }));
      
      setHistoryItems(historyItems);
    } catch (error) {
      console.error('Failed to load job history:', error);
      // Fall back to mock data if API fails
      setHistoryItems(getMockHistoryData());
    } finally {
      setLoading(false);
    }
  };

  // Mock data as fallback
  const getMockHistoryData = (): HistoryItem[] => {
    return [
      {
        id: '1',
        title: 'Meeting Recording Q4 2024',
        fileName: 'meeting_q4_2024.mp4',
        processedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'completed',
        fileSize: 125.4 * 1024 * 1024, // 125.4 MB
        totalDuration: 3600, // 1 hour
        keyframeCount: 120,
        transcriptSegments: 234
      },
      {
        id: '2',
        title: 'Product Demo Video',
        fileName: 'product_demo.mov',
        processedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        status: 'completed',
        fileSize: 89.2 * 1024 * 1024, // 89.2 MB
        totalDuration: 1800, // 30 minutes
        keyframeCount: 60,
        transcriptSegments: 156
      },
      {
        id: '3',
        title: 'Training Session',
        fileName: 'training_session.mp4',
        processedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        status: 'processing',
        fileSize: 204.8 * 1024 * 1024, // 204.8 MB
        totalDuration: 5400, // 1.5 hours
        keyframeCount: 0,
        transcriptSegments: 0
      }
    ];
  };

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-900 text-green-300';
      case 'processing': return 'bg-yellow-900 text-yellow-300';
      case 'failed': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const handleReprocess = async (item: HistoryItem) => {
    // TODO: Implement reprocessing functionality
    console.log('Reprocess item:', item.id);
  };

  const handleDelete = async (item: HistoryItem) => {
    try {
      await api.deleteJob(item.id);
      await loadJobHistory(); // Reload the list
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.clearAllJobs();
      await loadJobHistory(); // Reload the list
    } catch (error) {
      console.error('Failed to clear all jobs:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-100 flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-400" />
              <span>Processing History</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {historyItems.length} total items • {historyItems.filter(i => i.status === 'completed').length} completed
            </p>
          </div>
          
          <div className="flex space-x-3">
            {/* Clear All Button */}
            {historyItems.length > 0 && (
              <button
                onClick={handleClearAll}
                className="btn-secondary text-sm flex items-center space-x-1"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            )}
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-64"
              />
            </div>
            
            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input w-32"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Items */}
      {filteredItems.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="space-y-3">
            <FileVideo className="h-12 w-12 text-gray-500 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-gray-300">No videos found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Upload and process your first video to see it here'
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="card p-6 hover:bg-gray-700 transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* File Icon */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                    <FileVideo className="h-6 w-6 text-blue-400" />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-gray-100 truncate">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          {item.fileName}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">File Size</p>
                        <p className="text-sm text-gray-300">{formatFileSize(item.fileSize)}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm text-gray-300">{formatDuration(item.totalDuration)}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Keyframes</p>
                        <p className="text-sm text-gray-300">{item.keyframeCount}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Transcript</p>
                        <p className="text-sm text-gray-300">{item.transcriptSegments} segments</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Processed {formatDate(item.processedAt)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {item.status === 'completed' && (
                          <>
                            <button className="btn-secondary text-xs flex items-center space-x-1 px-3 py-1">
                              <Eye className="h-3 w-3" />
                              <span>View</span>
                            </button>
                            <button className="btn-secondary text-xs flex items-center space-x-1 px-3 py-1">
                              <Download className="h-3 w-3" />
                              <span>Export</span>
                            </button>
                          </>
                        )}
                        
                        {item.status === 'failed' && (
                          <button 
                            onClick={() => handleReprocess(item)}
                            className="btn-primary text-xs flex items-center space-x-1 px-3 py-1"
                          >
                            <Scissors className="h-3 w-3" />
                            <span>Retry</span>
                          </button>
                        )}
                        
                        <div className="relative">
                          <button className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {/* Dropdown menu would go here */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination could go here */}
      {filteredItems.length > 10 && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {filteredItems.length} of {historyItems.length} items
            </p>
            <div className="flex space-x-2">
              <button className="btn-secondary text-sm">Previous</button>
              <button className="btn-secondary text-sm">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTab; 