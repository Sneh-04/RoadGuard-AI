import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useRealTime } from '../context/RealTimeContext.jsx';

export default function UploadPage() {
  const { addHazard } = useRealTime();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-cyan-500', 'bg-slate-700/50');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('border-cyan-500', 'bg-slate-700/50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-cyan-500', 'bg-slate-700/50');
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(droppedFiles[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/api/predict-video-frame", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      console.log('✅ Response from backend:', data);
      setResult(data);
      setFile(null);
      setPreview(null);

      if (data.event) {
        console.log('📍 Adding hazard to real-time updates');
        addHazard(data.event);
      }

      setTimeout(() => {
        setResult(null);
      }, 5000);
    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Upload Hazard Image</h2>
          <p className="text-slate-400 mt-2">
            Upload road images to detect hazards using AI vision analysis
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer bg-slate-900/50"
          >
            <Upload size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-100 font-semibold">Click to upload or drag & drop</p>
            <p className="text-slate-400 text-sm mt-2">PNG, JPG, GIF up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover max-h-80"
              />
            </div>
          )}
        </div>

        {/* Selected File Info */}
        {file && (
          <div className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-200 font-semibold">📎 {file.name}</p>
              <p className="text-slate-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-400">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {result && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
            <div className="flex gap-3 mb-4">
              <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-400">✅ Analysis Complete</p>
                <p className="text-green-300 text-sm">Image processed and saved to database</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {result.detections && result.detections.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-200">
                    Found {result.detections.length} hazard(s):
                  </p>
                  {result.detections.map((detection, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-700/50 rounded p-3 text-sm text-slate-300"
                    >
                      <p className="font-medium">
                        {detection.label || 'Hazard'} - ID: {detection.id || 'N/A'}
                      </p>
                      <p className="text-slate-400">
                        Confidence: {((detection.confidence || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  ))}
                  <p className="text-xs text-slate-400 mt-2">
                    📍 Hazard(s) have been added to the map and admin dashboard
                  </p>
                </div>
              ) : (
                <p className="text-slate-300">No hazards detected in the image</p>
              )}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={20} className="animate-spin" />
              Processing Image...
            </>
          ) : (
            <>
              <Upload size={20} />
              Upload & Analyze
            </>
          )}
        </button>

        {/* Info Box */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
          <p className="text-sm text-slate-300">
            <strong>💡 How it works:</strong> Upload a road image, the AI model will detect hazards (potholes, speed breakers) and automatically add them to the map and admin dashboard for review.
          </p>
        </div>
      </div>
    </div>
  );
}
