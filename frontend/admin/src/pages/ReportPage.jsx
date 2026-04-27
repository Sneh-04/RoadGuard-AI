import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';
import { Camera, UploadCloud, MapPin } from 'lucide-react';

const hazardTypes = ['Pothole', 'Speedbump', 'Flooding', 'Debris'];
const severities = ['Low', 'Medium', 'High'];

export default function ReportPage() {
  return (
    <div className="space-y-6 pb-28">
      <Card title="Help protect the next driver" subtitle="Report road hazards in just a few taps">
        <div className="grid gap-4 sm:grid-cols-2">
          <button className="flex items-center justify-center gap-3 rounded-[1.75rem] border border-cyan-300/15 bg-white/5 px-5 py-4 text-left transition duration-300 hover:border-cyan-300/30 hover:bg-white/10">
            <Camera className="h-6 w-6 text-teal-200" />
            <div>
              <p className="font-semibold text-slate-100">Take Photo</p>
              <p className="text-sm text-slate-400">Capture the hazard instantly</p>
            </div>
          </button>

          <button className="flex items-center justify-center gap-3 rounded-[1.75rem] border border-teal-300/15 bg-white/5 px-5 py-4 text-left transition duration-300 hover:border-teal-300/30 hover:bg-white/10">
            <UploadCloud className="h-6 w-6 text-teal-200" />
            <div>
              <p className="font-semibold text-slate-100">Upload from Gallery</p>
              <p className="text-sm text-slate-400">Choose an existing image</p>
            </div>
          </button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Hazard type" className="p-6">
          <div className="grid gap-3">
            {hazardTypes.map((type) => (
              <button key={type} className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-100 transition duration-300 hover:bg-white/10">
                {type}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Severity" className="p-6">
          <div className="flex flex-wrap gap-3">
            {severities.map((level) => (
              <Badge key={level} label={level} variant={level.toLowerCase()} className="cursor-pointer" />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card title="Description" className="p-6">
          <textarea
            className="min-h-[160px] w-full rounded-[1.5rem] border border-white/10 bg-[#081b1a] p-4 text-slate-100 outline-none transition duration-300 focus:border-teal-300/40 focus:ring-4 focus:ring-teal-300/10"
            placeholder="Describe the hazard in detail..."
          />
        </Card>

        <Card title="Location" className="p-6">
          <div className="flex items-center gap-3 rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-4">
            <MapPin className="h-5 w-5 text-teal-200" />
            <div>
              <p className="font-semibold text-slate-100">Markapur</p>
              <p className="text-sm text-slate-400">Auto-filled from your current position</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-center">
        <button className="inline-flex items-center justify-center rounded-[2rem] bg-[#00c9a7] px-8 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,201,167,0.24)] transition duration-300 hover:bg-[#00b89a]">
          Report Hazard
        </button>
      </div>
    </div>
  );
}
