import { useRef, useState } from 'react';
import Card from '../components/Card';
import { Camera, Image, MapPin, Send, Trash2 } from 'lucide-react';

const Report = () => {
  const [hazardType, setHazardType] = useState('');
  const [severity, setSeverity] = useState('Low');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImage(file);
    setPreview(previewUrl);
    setCameraOn(false);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const triggerImageInput = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch (error) {
      console.error('Camera start failed', error);
      alert('Unable to access camera. Please allow camera permission or use the gallery upload.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/png');
    setPreview(photoDataUrl);
    setImage(photoDataUrl);
    stopCamera();
  };

  const handleSubmit = () => {
    if (!image) {
      alert('Upload image');
      return;
    }
    if (!hazardType) {
      alert('Select hazard type');
      return;
    }
    if (!severity) {
      alert('Select severity');
      return;
    }

    console.log({ image, hazardType, severity, description });
    alert('Report submitted!');
  };

  return (
    <div className="p-4 pb-20 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-4">Report Hazard</h1>

      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Image Upload</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-primary/20 rounded-2xl text-white hover:bg-primary/30 transition"
            >
              <Camera size={24} className="text-primary" />
              Take Photo
            </button>
            <button
              type="button"
              onClick={triggerImageInput}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition"
            >
              <Image size={24} className="text-primary" />
              Upload from Gallery
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageUpload}
          />
          {cameraOn && (
            <div className="rounded-3xl overflow-hidden border border-white/20 bg-black/20">
              <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-[4/3] object-cover" />
              <div className="flex gap-3 p-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 rounded-2xl bg-primary py-3 text-black font-semibold"
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex-1 rounded-2xl bg-white/10 py-3 text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {preview && !cameraOn && (
            <div className="relative overflow-hidden rounded-3xl border border-white/20">
              <img src={preview} alt="Preview" className="w-full aspect-[4/3] object-cover" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 rounded-full bg-black/70 p-2 text-white hover:bg-black/90"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <label className="block text-sm font-medium mb-2">Hazard Type</label>
        <select
          value={hazardType}
          onChange={(e) => setHazardType(e.target.value)}
          className="w-full p-2 bg-white/10 rounded-lg text-white"
        >
          <option value="">Select hazard type</option>
          <option value="pothole">Pothole</option>
          <option value="flooding">Flooding</option>
          <option value="speedbump">Speedbump</option>
          <option value="other">Other</option>
        </select>
      </Card>

      <Card>
        <label className="block text-sm font-medium mb-2">Severity</label>
        <div className="flex space-x-2">
          {['Low', 'Medium', 'High'].map((level) => (
            <button
              key={level}
              onClick={() => setSeverity(level)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                severity === level
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the hazard..."
          className="w-full p-2 bg-white/10 rounded-lg text-white resize-none"
          rows={4}
        />
      </Card>

      <Card>
        <div className="flex items-center space-x-2">
          <MapPin className="text-primary" size={20} />
          <span className="text-sm">Location: Auto-filled (Chennai)</span>
        </div>
      </Card>

      <button
        onClick={handleSubmit}
        className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-2xl font-semibold transition-colors flex items-center justify-center space-x-2"
      >
        <Send size={20} />
        <span>Submit Report</span>
      </button>
    </div>
  );
};

export default Report;