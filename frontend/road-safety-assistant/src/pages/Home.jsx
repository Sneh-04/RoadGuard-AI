import Card from '../components/Card';
import Badge from '../components/Badge';
import { CloudRain, AlertTriangle, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="p-4 pb-20 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-4">Good Morning, User!</h1>

      <Card>
        <div className="flex items-center space-x-4">
          <CloudRain className="text-teal-400" size={32} />
          <div>
            <div className="text-lg font-semibold">24°C</div>
            <div className="text-sm text-white/70">Rainy, 75% humidity, 10 km/h wind</div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2">Traffic Hotspots</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Anna Salai</span>
            <Badge variant="high">High</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>T. Nagar</span>
            <Badge variant="medium">Medium</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>Adyar</span>
            <Badge variant="low">Low</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2">Hazards Nearby</h2>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-400" size={20} />
            <span>Pothole at 500m</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-yellow-400" size={20} />
            <span>Flooding at 1km</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-orange-400" size={20} />
            <span>Speedbump at 2km</span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2">Community Alerts</h2>
        <div className="flex items-center space-x-2">
          <Users className="text-primary" size={20} />
          <span>1240 users active in your area</span>
        </div>
      </Card>
    </div>
  );
};

export default Home;