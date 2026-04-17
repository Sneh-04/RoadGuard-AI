import { useState } from 'react';
import Card from '../components/Card';
import ToggleSwitch from '../components/ToggleSwitch';
import { User, Mail, Phone, MapPin, FileText, CheckCircle, Lock, Bell, Moon, Server } from 'lucide-react';

const Profile = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [backendUrl, setBackendUrl] = useState('https://api.roadsafety.com');

  return (
    <div className="p-4 pb-20 space-y-4">
      <Card className="text-center">
        <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <User size={40} className="text-white" />
        </div>
        <h2 className="text-xl font-bold">John Doe</h2>
        <div className="flex items-center justify-center space-x-1 text-white/70">
          <Mail size={16} />
          <span>john@example.com</span>
        </div>
        <div className="flex items-center justify-center space-x-1 text-white/70">
          <Phone size={16} />
          <span>+91 9876543210</span>
        </div>
        <div className="flex items-center justify-center space-x-1 text-white/70">
          <MapPin size={16} />
          <span>Markapur • Bike</span>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-primary">46</div>
          <div className="text-sm text-white/70">Reports</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-primary">18</div>
          <div className="text-sm text-white/70">Active</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-primary">1240</div>
          <div className="text-sm text-white/70">Users helped</div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Achievements</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <CheckCircle className="text-green-400" size={20} />
            <span>First Report</span>
          </div>
          <div className="flex items-center space-x-2 opacity-50">
            <Lock className="text-white/50" size={20} />
            <span>Safety Champion</span>
          </div>
          <div className="flex items-center space-x-2 opacity-50">
            <Lock className="text-white/50" size={20} />
            <span>Community Hero</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
        <div className="space-y-4">
          <ToggleSwitch
            checked={notifications}
            onChange={setNotifications}
            label="Notifications"
          />
          <ToggleSwitch
            checked={darkMode}
            onChange={setDarkMode}
            label="Dark Mode"
          />
          <div>
            <label className="block text-sm font-medium mb-2">Backend URL</label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="w-full p-2 bg-white/10 rounded-lg text-white"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;