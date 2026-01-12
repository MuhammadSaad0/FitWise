import React, { useState, useEffect } from 'react';
import { 
  Grip, 
  Calendar as CalendarIcon, 
  Dumbbell,
  Edit2
} from 'lucide-react';
import { Workout, View, DEFAULT_EXERCISES } from './types';
import { Button, Card } from './components/UI';
import { WorkoutLogger } from './components/WorkoutLogger';
import { StatsView } from './components/StatsView';
import { Calendar } from './components/Calendar';
import { SideMenu } from './components/SideMenu';
import { AICoach } from './components/AICoach';

const App: React.FC = () => {
  // Update view type to include 'coach'
  const [view, setView] = useState<View | 'coach'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  const [customBodyParts, setCustomBodyParts] = useState<Record<string, string>>({});

  // Load Workouts
  useEffect(() => {
    const saved = localStorage.getItem('fitwise_workouts');
    if (saved) {
      try {
        setWorkouts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse workouts", e);
      }
    }
  }, []);

  // Load Custom Exercises & Body Parts
  useEffect(() => {
    const savedEx = localStorage.getItem('fitwise_exercises');
    if (savedEx) {
      try {
        setCustomExercises(JSON.parse(savedEx));
      } catch (e) {
        console.error("Failed to parse exercises", e);
      }
    }
    const savedBP = localStorage.getItem('fitwise_bodyparts');
    if (savedBP) {
      try {
        setCustomBodyParts(JSON.parse(savedBP));
      } catch (e) {
        console.error("Failed to parse body parts", e);
      }
    }
  }, []);

  // Save Workouts
  useEffect(() => {
    localStorage.setItem('fitwise_workouts', JSON.stringify(workouts));
  }, [workouts]);

  // Save Custom Exercises
  useEffect(() => {
    localStorage.setItem('fitwise_exercises', JSON.stringify(customExercises));
  }, [customExercises]);

  // Save Body Parts
  useEffect(() => {
    localStorage.setItem('fitwise_bodyparts', JSON.stringify(customBodyParts));
  }, [customBodyParts]);

  const handleSaveWorkout = (workout: Workout) => {
    const filtered = workouts.filter(w => w.id !== workout.id);
    setWorkouts([...filtered, workout].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsEditing(false);
    setView('day');
  };

  const handleAddCustomExercise = (name: string, bodyPart: string) => {
    if (!customExercises.includes(name) && !DEFAULT_EXERCISES.includes(name)) {
      setCustomExercises([...customExercises, name]);
    }
    // Always update body part mapping if provided, even if exercise exists (allows correction)
    if (bodyPart) {
      setCustomBodyParts(prev => ({ ...prev, [name]: bodyPart }));
    }
  };

  const getWorkoutForSelectedDate = () => {
    return workouts.find(w => {
      const wDate = new Date(w.date);
      return wDate.getDate() === selectedDate.getDate() && 
             wDate.getMonth() === selectedDate.getMonth() && 
             wDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  const exportData = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(workouts, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitwise_export.json`;
      a.click();
    } else {
      const rows = [['Date', 'Workout Name', 'Exercise', 'Set', 'Weight', 'Reps', 'RPE']];
      workouts.forEach(w => {
        w.exercises.forEach(e => {
          e.sets.forEach((s, idx) => {
            rows.push([
              w.date,
              `"${w.name}"`,
              `"${e.name}"`,
              (idx + 1).toString(),
              s.weight.toString(),
              s.reps.toString(),
              (s.rpe || '').toString()
            ]);
          });
        });
      });
      const csvContent = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitwise_export.csv`;
      a.click();
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const currentWorkout = getWorkoutForSelectedDate();
  const allExercises = [...DEFAULT_EXERCISES, ...customExercises].sort();

  // --- Views ---

  const renderDayView = () => {
    if (isEditing) {
      return (
        <WorkoutLogger 
          initialWorkout={currentWorkout} 
          targetDate={selectedDate}
          onSave={handleSaveWorkout} 
          onCancel={() => setIsEditing(false)}
          availableExercises={allExercises}
          onAddExercise={handleAddCustomExercise}
          customBodyParts={customBodyParts}
        />
      );
    }

    return (
      <div className="max-w-xl mx-auto space-y-6 pt-4 pb-20 animate-fadeIn">
        <div className="text-center mb-12">
           <p className="text-stone-500 uppercase tracking-[0.2em] text-[10px] font-bold mb-3">
             {isToday(selectedDate) ? "TODAY" : selectedDate.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase()}
           </p>
           <h1 className="text-6xl font-black text-stone-100 tracking-tighter uppercase font-mono">
             {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}
           </h1>
        </div>

        {currentWorkout ? (
          <Card className="border-l-4 border-l-stone-400 bg-stone-900/50">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{currentWorkout.name}</h2>
                <p className="text-stone-500 font-mono text-xs mt-2 tracking-wide">{currentWorkout.exercises.length} MOVEMENTS • {currentWorkout.durationMinutes || 0} MIN</p>
              </div>
              <Button variant="ghost" onClick={() => setIsEditing(true)} icon={Edit2}>Edit</Button>
            </div>

            <div className="space-y-4">
              {currentWorkout.exercises.map(e => (
                <div key={e.id} className="bg-stone-950 p-5 rounded border border-stone-800">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-stone-200 text-sm uppercase tracking-wide">{e.name}</span>
                    <span className="text-[10px] font-bold text-stone-600 border border-stone-800 px-2 py-0.5 rounded uppercase">{e.sets.length} sets</span>
                  </div>
                  <div className="text-sm text-stone-400 font-mono">
                    {e.sets.map((s, i) => (
                      <span key={s.id} className="inline-block mr-4 mb-1">
                        <span className="text-white font-bold">{s.weight}</span>
                        <span className="text-[10px] ml-0.5 text-stone-600">LB</span>
                        <span className="text-stone-700 mx-1">/</span>
                        <span className="text-stone-300">{s.reps}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-stone-800 rounded bg-stone-900/20">
            <div className="bg-stone-900 p-6 rounded-full mb-6 border border-stone-800">
              <Dumbbell size={32} className="text-stone-500" />
            </div>
            <h3 className="text-xl font-bold text-stone-300 mb-2 uppercase tracking-wide">No Workout</h3>
            <p className="text-stone-600 mb-8 text-center max-w-xs text-sm font-mono">No data for this date.</p>
            <Button onClick={() => setIsEditing(true)} variant="contrast" className="px-8 py-4">
              Log Workout
            </Button>
          </div>
        )}
      </div>
    );
  };

  const getPageTitle = () => {
    switch(view) {
      case 'stats': return 'Statistics';
      case 'calendar': return 'History';
      case 'coach': return 'Evaluation';
      default: return (<span>Fit<span className="text-stone-500">Wise</span></span>);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans selection:bg-stone-200 selection:text-stone-950">
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onNavigate={(v) => { 
          if (v === 'home') setView('day');
          else setView(v); 
          setIsEditing(false);
        }}
        onExport={exportData}
      />

      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-stone-950/80 backdrop-blur-sm border-b border-stone-900 flex items-center justify-between px-6 z-40">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 text-stone-500 hover:text-white transition-colors">
          <Grip size={24} />
        </button>
        
        <div className="font-black text-lg tracking-widest text-white flex items-center gap-1 uppercase italic">
          {getPageTitle()}
        </div>

        <button 
          onClick={() => {
            if (view === 'calendar') setView('day');
            else {
              setView('calendar');
              setIsEditing(false);
            }
          }} 
          className={`p-2 rounded-full transition-all ${view === 'calendar' ? 'bg-stone-200 text-stone-950' : 'text-stone-500 hover:text-white'}`}
        >
          <CalendarIcon size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-10">
        {view === 'day' && renderDayView()}
        
        {view === 'calendar' && (
          <Calendar 
            workouts={workouts} 
            selectedDate={selectedDate} 
            onSelectDate={(date) => {
              setSelectedDate(date);
              setView('day');
              setIsEditing(false);
            }} 
          />
        )}
        
        {view === 'stats' && <StatsView workouts={workouts} customBodyParts={customBodyParts} />}
        {view === 'coach' && <AICoach workouts={workouts} />}
      </main>
    </div>
  );
};

export default App;