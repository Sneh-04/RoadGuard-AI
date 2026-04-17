import Card from '../components/Card';
import StatCard from '../components/StatCard';
import { Route, AlertTriangle, FileText, Shield, Users, Clock, MapPin, Calendar } from 'lucide-react';

const Activity = () => {
  return (
    <div className="p-4 pb-20 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-4">Activity Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Roads traveled" value="59 km" icon={Route} />
        <StatCard title="Hazards encountered" value="0" icon={AlertTriangle} />
        <StatCard title="Reports submitted" value="0" icon={FileText} />
        <StatCard title="Safety score" value="84/100" icon={Shield} />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="text-primary" size={24} />
            <span>Community impact</span>
          </div>
          <span className="text-lg font-bold">1240 users</span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="text-primary" size={24} />
            <span>Trip history</span>
          </div>
          <span className="text-lg font-bold">47 km</span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="text-primary" size={24} />
            <span>Best route</span>
          </div>
          <span className="text-lg font-bold">Anna Salai</span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="text-primary" size={24} />
            <span>Next trip</span>
          </div>
          <span className="text-lg font-bold">5am–8am</span>
        </div>
      </Card>
    </div>
  );
};

export default Activity;