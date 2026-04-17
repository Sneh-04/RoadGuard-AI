import { useState } from 'react';
import Card from '../components/Card';
import { Camera, Image, MapPin, Send } from 'lucide-react';

const Report = () => {
  const [hazardType, setHazardType] = useState('');
  const [severity, setSeverity] = useState('Low');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    // Handle submit
    alert('Report submitted!');
  };

  return (
    <div className="p-4 pb-20 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-4">Report Hazard</h1>

      <Card>
        <h2 className="text-lg font-semibold mb-2">Upload Image</h2>
        <div className="flex space-x-4">
          <button className="flex flex-col items-center p-4 bg-primary/20 rounded-lg hover:bg-primary/30 transition-colors">
            <Camera size={32} className="text-primary mb-2" />
            <span className="text-sm">Camera</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-primary/20 rounded-lg hover:bg-primary/30 transition-colors">
            <Image size={32} className="text-primary mb-2" />
            <span className="text-sm">Gallery</span>
          </button>
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