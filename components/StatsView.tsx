import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Search, Trophy, Scale, Calendar as CalendarIcon, Activity, Zap, Clock, Truck, Crown, Timer, MapPin, Mountain, Waves, Rocket } from 'lucide-react';
import { Workout, getBodyPart, calculateOneRepMax, Exercise, UnitSystem } from '../types';
import { Card, SectionHeader } from './UI';

interface StatsViewProps {
  workouts: Workout[];
  customBodyParts?: Record<string, string>;
  unitSystem: UnitSystem;
}

// Muted, earthy/concrete palette
const COLORS = ['#57534e', '#78716c', '#a8a29e', '#d6d3d1', '#e7e5e4', '#44403c']; 

export const StatsView: React.FC<StatsViewProps> = ({ workouts, customBodyParts, unitSystem }) => {
  const [selectedExercise, setSelectedExercise] = useState('Bench Press');
  const [exerciseSearchOpen, setExerciseSearchOpen] = useState(false);
  const [metric, setMetric] = useState<'weight' | '1rm'>('1rm');

  const isMetric = unitSystem === 'metric';

  // --- Calculations ---

  // 1. Lifetime Stats
  const lifetimeStats = useMemo(() => {
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalDistance = 0; // stored units
    let totalCardioTime = 0; // mins
    const distinctExercises = new Set();

    workouts.forEach(w => {
      w.exercises.forEach(e => {
        distinctExercises.add(e.name);
        e.sets.forEach(s => {
          if (e.type === 'cardio') {
             totalDistance += s.distance || 0;
             totalCardioTime += s.duration || 0;
          } else {
             totalVolume += (s.weight || 0) * (s.reps || 0);
             totalReps += s.reps || 0;
          }
          totalSets += 1;
        });
      });
    });

    return {
      volume: totalVolume,
      sets: totalSets,
      reps: totalReps,
      distance: totalDistance,
      cardioTime: totalCardioTime,
      exercisesCount: distinctExercises.size,
      workoutsCount: workouts.length
    };
  }, [workouts]);

  // 2. Volume per Workout (Last 15)
  const volumeData = useMemo(() => {
    return workouts
      .map(w => ({
        date: new Date(w.date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' }),
        fullDate: w.date,
        volume: w.exercises.reduce((acc, ex) => {
          if (ex.type === 'cardio') return acc;
          return acc + ex.sets.reduce((sAcc, s) => sAcc + ((s.weight || 0) * (s.reps || 0)), 0);
        }, 0)
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
      .slice(-15);
  }, [workouts]);

  // 3. Body Part Distribution
  const bodyPartData = useMemo(() => {
    const counts: Record<string, number> = {};
    workouts.forEach(w => {
      w.exercises.forEach(e => {
        const part = e.type === 'cardio' ? 'Cardio' : getBodyPart(e.name, customBodyParts);
        counts[part] = (counts[part] || 0) + e.sets.length; 
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [workouts, customBodyParts]);

  // 4. Exercise Progression
  const availableExercises = useMemo(() => {
    const names = new Set<string>();
    workouts.forEach(w => w.exercises.forEach(e => names.add(e.name)));
    return Array.from(names).sort();
  }, [workouts]);

  const exerciseProgressData = useMemo(() => {
    const data: { date: string; fullDate: string; maxWeight: number; oneRepMax: number }[] = [];
    workouts.forEach(w => {
      const exercise = w.exercises.find(e => e.name.toLowerCase() === selectedExercise.toLowerCase());
      if (exercise && exercise.type !== 'cardio') {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
        const best1RM = Math.max(...exercise.sets.map(s => calculateOneRepMax(s.weight || 0, s.reps || 0)));

        if (maxWeight > 0) {
           data.push({
            date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            fullDate: w.date,
            maxWeight,
            oneRepMax: best1RM
          });
        }
      }
    });
    return data.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [workouts, selectedExercise]);

  // 5. Personal Records (Estimated 1RM)
  const personalRecords = useMemo(() => {
    const records: Record<string, { weight: number, date: string }> = {};
    workouts.forEach(w => {
        w.exercises.forEach(e => {
            if (e.type === 'cardio') return;
            const best1RM = Math.max(...e.sets.map(s => calculateOneRepMax(s.weight || 0, s.reps || 0)));
            if (!records[e.name] || best1RM > records[e.name].weight) {
                records[e.name] = { weight: best1RM, date: w.date };
            }
        });
    });
    // Return top 5 by weight, mostly compounds usually
    return Object.entries(records)
        .sort((a, b) => b[1].weight - a[1].weight)
        .slice(0, 5);
  }, [workouts]);

  // 6. Crazy / Fun Stats
  const crazyStats = useMemo(() => {
    let totalDuration = 0;
    let maxWeight = 0;
    let maxWeightExercise = '';
    const dayCounts: Record<string, number> = {};
    
    workouts.forEach(w => {
      // Duration (default to 60 if missing for estimation)
      totalDuration += w.durationMinutes || 60;

      // Favorite Day
      const dayName = new Date(w.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;

      w.exercises.forEach(e => {
        if (e.type !== 'cardio') {
          e.sets.forEach(s => {
            if ((s.weight || 0) > maxWeight) {
              maxWeight = s.weight || 0;
              maxWeightExercise = e.name;
            }
          });
        }
      });
    });

    const favoriteDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    
    const volume = lifetimeStats.volume; 
    const distance = lifetimeStats.distance; 
    
    // Benchmarks
    // Pyramid Stone: 2500 kg or 5500 lbs
    // T-Rex: 8000 kg or 15000 lbs (approx)
    // Shuttle: 75000 kg or 165000 lbs
    const stoneWeight = isMetric ? 2500 : 5500;
    const tRexWeight = isMetric ? 8000 : 15000;
    const shuttleWeight = isMetric ? 75000 : 165000;

    // Marathon: 42.2 km or 26.2 mi
    // English Channel: 33 km or 21 mi
    // Everest: 8.85 km or 5.5 mi
    const marathonDist = isMetric ? 42.2 : 26.2;
    const channelDist = isMetric ? 33 : 21;
    const everestDist = isMetric ? 8.85 : 5.5;

    return {
      durationHours: (totalDuration / 60).toFixed(1),
      favoriteDay: favoriteDay ? `${favoriteDay[0]} (${favoriteDay[1]})` : 'None',
      heaviestLift: { weight: maxWeight, name: maxWeightExercise },
      // Strength Feats
      pyramidStones: (volume / stoneWeight).toFixed(1),
      tRexs: (volume / tRexWeight).toFixed(2),
      spaceShuttles: (volume / shuttleWeight).toFixed(3),
      // Stamina Feats
      marathons: (distance / marathonDist).toFixed(1),
      englishChannels: (distance / channelDist).toFixed(2),
      everests: (distance / everestDist).toFixed(2)
    };
  }, [workouts, lifetimeStats, isMetric]);


  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-stone-600 font-mono text-sm">
        <p>NO DATA.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <SectionHeader title="Statistics" subtitle="Raw Metrics" />

      {/* Lifetime Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="flex flex-col items-start justify-between h-28 md:h-32 bg-stone-900/50">
           <Activity className="text-stone-600 mb-2" size={20} />
           <div>
             <span className="text-xl md:text-2xl font-bold text-white font-mono block">{lifetimeStats.workoutsCount}</span>
             <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Sessions</span>
           </div>
        </Card>
        <Card className="flex flex-col items-start justify-between h-28 md:h-32 bg-stone-900/50">
           <Scale className="text-stone-600 mb-2" size={20} />
           <div>
             <span className="text-xl md:text-2xl font-bold text-white font-mono block">{(lifetimeStats.volume / 1000).toFixed(1)}k</span>
             <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Vol ({isMetric ? 'kg' : 'lbs'})</span>
           </div>
        </Card>
        <Card className="flex flex-col items-start justify-between h-28 md:h-32 bg-stone-900/50">
           <MapPin className="text-stone-600 mb-2" size={20} />
           <div>
             <span className="text-xl md:text-2xl font-bold text-white font-mono block">{lifetimeStats.distance.toFixed(1)}</span>
             <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">{isMetric ? 'Km' : 'Mi'} Run</span>
           </div>
        </Card>
        <Card className="flex flex-col items-start justify-between h-28 md:h-32 bg-stone-900/50">
           <Timer className="text-stone-600 mb-2" size={20} />
           <div>
             <span className="text-xl md:text-2xl font-bold text-white font-mono block">{lifetimeStats.cardioTime}</span>
             <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Cardio Mins</span>
           </div>
        </Card>
      </div>

      {/* Feats & Outliers */}
      <div className="animate-slideUp delay-100">
        <SectionHeader title="Feats of Legend" subtitle="Mythic & Modern Benchmarks" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Strength Feats */}
           <Card className="bg-stone-950 border-stone-800 text-stone-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                   <h4 className="font-black uppercase tracking-tight text-lg text-white">Feats of Strength</h4>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mt-1">Mass Moved</p>
                </div>
                <Truck size={24} className="text-stone-700" />
              </div>
              <div className="space-y-3 font-mono text-sm">
                 <div className="flex justify-between border-b border-stone-800 pb-1">
                    <span className="text-stone-400">Great Pyramid Stones</span>
                    <span className="font-bold text-stone-200">{crazyStats.pyramidStones}</span>
                 </div>
                 <div className="flex justify-between border-b border-stone-800 pb-1">
                    <span className="text-stone-400">T-Rexs</span>
                    <span className="font-bold text-stone-200">{crazyStats.tRexs}</span>
                 </div>
                 <div className="flex justify-between border-b border-stone-800 pb-1">
                    <span className="text-stone-400">Space Shuttles</span>
                    <span className="font-bold text-stone-200">{crazyStats.spaceShuttles}</span>
                 </div>
              </div>
           </Card>

           {/* Stamina Feats */}
           <Card className="bg-stone-950 border-stone-800 text-stone-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                   <h4 className="font-black uppercase tracking-tight text-lg text-white">Feats of Stamina</h4>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mt-1">Distance Traversed</p>
                </div>
                <Activity size={24} className="text-stone-700" />
              </div>
              <div className="space-y-3 font-mono text-sm">
                 <div className="flex justify-between border-b border-stone-800 pb-1">
                    <span className="text-stone-400">Marathons</span>
                    <span className="font-bold text-stone-200">{crazyStats.marathons}</span>
                 </div>
                 <div className="flex justify-between border-b border-stone-800 pb-1">
                    <span className="text-stone-400">English Channels</span>
                    <span className="font-bold text-stone-200">{crazyStats.englishChannels}</span>
                 </div>
                 <div className="flex justify-between border-b border-stone-800 pb-1">
                    <span className="text-stone-400">Mt. Everests (Distance)</span>
                    <span className="font-bold text-stone-200">{crazyStats.everests}</span>
                 </div>
              </div>
           </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
           {/* Heaviest Lift */}
           <Card className="border-stone-800 bg-stone-950">
              <div className="flex flex-col h-full justify-between gap-4">
                 <div className="flex justify-between items-start">
                    <h4 className="text-stone-500 font-bold uppercase text-[10px] tracking-widest">Heaviest Object</h4>
                    <Crown size={16} className="text-stone-500" />
                 </div>
                 <div className="mt-2">
                    <span className="block text-3xl font-black text-white font-mono">{crazyStats.heaviestLift.weight}</span>
                    <span className="text-stone-400 text-xs font-mono uppercase truncate block mt-1">{crazyStats.heaviestLift.name}</span>
                 </div>
              </div>
           </Card>

           {/* Time & Day */}
           <Card className="border-stone-800 bg-stone-950">
               <div className="flex flex-col h-full justify-between gap-4">
                 <div>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-stone-500 font-bold uppercase text-[10px] tracking-widest">Time in the Iron</h4>
                        <Clock size={16} className="text-stone-500" />
                    </div>
                    <span className="text-2xl font-bold text-white font-mono">{crazyStats.durationHours} <span className="text-sm text-stone-600">HRS</span></span>
                 </div>
                 <div className="pt-4 border-t border-stone-900">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-stone-500 font-bold uppercase text-[10px] tracking-widest">Favorite Day</h4>
                        <Zap size={16} className="text-stone-500" />
                    </div>
                    <span className="text-lg font-bold text-white font-mono uppercase">{crazyStats.favoriteDay}</span>
                 </div>
               </div>
           </Card>
        </div>
      </div>

      {/* Consistency / Volume Chart */}
      <Card>
        <h3 className="text-xs font-bold text-stone-400 mb-6 uppercase tracking-widest">Volume History (Strength)</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeData}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e7e5e4" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#e7e5e4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
              <XAxis dataKey="date" stroke="#57534e" fontSize={10} tickLine={false} axisLine={false} dy={10} fontFamily="monospace" />
              <YAxis stroke="#57534e" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} fontFamily="monospace" />
              <Tooltip 
                cursor={{ stroke: '#57534e', strokeWidth: 1 }}
                contentStyle={{ backgroundColor: '#1c1917', borderColor: '#292524', color: '#e7e5e4', fontFamily: 'monospace', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="volume" stroke="#a8a29e" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Records Table */}
        <Card>
           <h3 className="text-xs font-bold text-stone-400 mb-6 uppercase tracking-widest flex items-center gap-2">
             <Trophy size={14} /> Est. 1RM Records
           </h3>
           <div className="space-y-4">
             {personalRecords.map(([name, data]) => (
               <div key={name} className="flex justify-between items-center border-b border-stone-800 pb-2 last:border-0">
                 <span className="text-sm text-stone-300 font-medium">{name}</span>
                 <div className="text-right">
                   <span className="block text-white font-mono font-bold">{data.weight}</span>
                   <span className="text-[10px] text-stone-600">{new Date(data.date).toLocaleDateString()}</span>
                 </div>
               </div>
             ))}
             {personalRecords.length === 0 && <span className="text-stone-600 text-xs">No records.</span>}
           </div>
        </Card>

        {/* Body Part Split */}
        <Card>
          <h3 className="text-xs font-bold text-stone-400 mb-4 uppercase tracking-widest">Training Split</h3>
          <div className="h-[200px] w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bodyPartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {bodyPartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#292524', color: '#e7e5e4', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  verticalAlign="middle" 
                  align="right" 
                  layout="vertical"
                  iconType="square"
                  formatter={(value) => <span className="text-stone-400 text-[10px] uppercase tracking-wider ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Strength Progress */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Progression</h3>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => setMetric('1rm')}
                className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full transition-colors ${metric === '1rm' ? 'bg-stone-200 text-stone-950' : 'bg-stone-800 text-stone-500 hover:text-stone-300'}`}
              >
                Est. 1RM
              </button>
              <button 
                onClick={() => setMetric('weight')}
                className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full transition-colors ${metric === 'weight' ? 'bg-stone-200 text-stone-950' : 'bg-stone-800 text-stone-500 hover:text-stone-300'}`}
              >
                Raw Weight
              </button>
            </div>
          </div>
          
          <div className="relative w-full md:w-64">
             <div 
               className="w-full bg-stone-950 border border-stone-800 text-stone-300 rounded px-3 py-2 text-sm flex items-center justify-between cursor-pointer hover:border-stone-600 transition-colors"
               onClick={() => setExerciseSearchOpen(!exerciseSearchOpen)}
             >
               <span className="truncate font-mono text-xs">{selectedExercise}</span>
               <Search size={12} className="text-stone-600" />
             </div>
             
             {exerciseSearchOpen && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-stone-900 border border-stone-700 rounded shadow-xl z-10 max-h-60 overflow-y-auto">
                 {availableExercises.map(ex => (
                   <div 
                     key={ex} 
                     className="px-4 py-2 hover:bg-stone-800 cursor-pointer text-xs font-mono text-stone-400 hover:text-white"
                     onClick={() => {
                       setSelectedExercise(ex);
                       setExerciseSearchOpen(false);
                     }}
                   >
                     {ex}
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        <div className="h-[250px] w-full">
           {exerciseProgressData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exerciseProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                <XAxis dataKey="date" stroke="#57534e" fontSize={10} tickLine={false} axisLine={false} dy={10} fontFamily="monospace" />
                <YAxis stroke="#57534e" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 10', 'auto']} fontFamily="monospace" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#292524', color: '#e7e5e4', fontFamily: 'monospace', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey={metric === '1rm' ? 'oneRepMax' : 'maxWeight'} 
                  stroke="#e7e5e4" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#1c1917', strokeWidth: 2, stroke: '#e7e5e4' }}
                  activeDot={{ r: 5, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
           ) : (
             <div className="h-full flex items-center justify-center text-stone-700 font-mono text-xs uppercase">
               No data found for {selectedExercise}
             </div>
           )}
        </div>
      </Card>
    </div>
  );
};