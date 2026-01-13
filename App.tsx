import React, { useState, useEffect } from 'react';
import { 
  Grip, 
  Calendar as CalendarIcon, 
  Dumbbell,
  Edit2
} from 'lucide-react';
import { Workout, View, DEFAULT_EXERCISES, UnitSystem, getBodyPart, Exercise, WorkoutSet } from './types';
import { Button, Card } from './components/UI';
import { WorkoutLogger } from './components/WorkoutLogger';
import { StatsView } from './components/StatsView';
import { Calendar } from './components/Calendar';
import { SideMenu } from './components/SideMenu';
import { AICoach } from './components/AICoach';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to convert minutes to H:MM:SS
const minutesToTimeStr = (minutes: number | undefined): string => {
  if (!minutes) return '';
  const totalSeconds = Math.round(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  if (hours > 0) {
      return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Helper to convert H:MM:SS or MM:SS to minutes
const timeStrToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  // HH:MM:SS
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  }
  // MM:SS
  if (parts.length === 2) {
    return parts[0] + parts[1] / 60;
  }
  return 0;
};

const App: React.FC = () => {
  // Update view type to include 'coach'
  const [view, setView] = useState<View | 'coach'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  const [customBodyParts, setCustomBodyParts] = useState<Record<string, string>>({});
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

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

  // Load Custom Exercises & Body Parts & Units
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
    const savedUnit = localStorage.getItem('fitwise_unit_system');
    if (savedUnit === 'metric' || savedUnit === 'imperial') {
      setUnitSystem(savedUnit);
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

  const toggleUnitSystem = () => {
    const newSystem = unitSystem === 'metric' ? 'imperial' : 'metric';
    setUnitSystem(newSystem);
    localStorage.setItem('fitwise_unit_system', newSystem);
  };

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

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Map header names to indices
      const dateIdx = headers.findIndex(h => h === 'date');
      const exerciseIdx = headers.findIndex(h => h === 'exercise');
      const categoryIdx = headers.findIndex(h => h === 'category');
      const weightIdx = headers.findIndex(h => h === 'weight');
      const repsIdx = headers.findIndex(h => h === 'reps');
      const distIdx = headers.findIndex(h => h === 'distance');
      const timeIdx = headers.findIndex(h => h === 'time');

      if (dateIdx === -1 || exerciseIdx === -1) {
        alert("Invalid CSV format. Missing Date or Exercise column.");
        return;
      }

      const tempWorkouts: Record<string, Workout> = {};
      const newCustomExercises = new Set(customExercises);
      const newCustomBodyParts = { ...customBodyParts };

      // Process rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle CSV splitting
        // Note: Simple split. If your data contains commas inside quotes, this needs a regex parser.
        const cols = line.split(',');
        
        const dateStr = cols[dateIdx]?.trim();
        const exerciseName = cols[exerciseIdx]?.trim();
        if (!dateStr || !exerciseName) continue;

        // Populate metadata
        const category = cols[categoryIdx]?.trim();
        if (category && !DEFAULT_EXERCISES.includes(exerciseName)) {
           newCustomExercises.add(exerciseName);
           if (category) newCustomBodyParts[exerciseName] = category;
        }

        // Create/Get Workout
        // Date format assumed YYYY-MM-DD from sample
        if (!tempWorkouts[dateStr]) {
           const d = new Date(dateStr);
           // Adjust for timezone if necessary, assuming CSV dates are local
           // d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
           
           tempWorkouts[dateStr] = {
             id: generateId(),
             date: d.toISOString(),
             name: `Workout on ${d.toLocaleDateString()}`,
             exercises: []
           };
        }
        
        const workout = tempWorkouts[dateStr];
        let exercise = workout.exercises.find(e => e.name === exerciseName);
        
        const weightVal = parseFloat(cols[weightIdx]) || 0;
        const distVal = parseFloat(cols[distIdx]) || 0;
        const type = (distVal > 0 || category === 'Cardio' || getBodyPart(exerciseName, newCustomBodyParts) === 'Cardio') ? 'cardio' : 'strength';

        if (!exercise) {
          exercise = {
            id: generateId(),
            name: exerciseName,
            type: type,
            sets: []
          };
          workout.exercises.push(exercise);
        }

        const reps = parseFloat(cols[repsIdx]) || 0;
        const duration = timeStrToMinutes(cols[timeIdx]?.trim());

        const set: WorkoutSet = {
          id: generateId(),
          completed: true,
          weight: weightVal,
          reps: reps,
          distance: distVal,
          duration: duration,
        };
        
        exercise.sets.push(set);
      }

      const importedWorkouts = Object.values(tempWorkouts);
      
      // Merge Strategy: Add all imported workouts.
      setWorkouts(prev => [...prev, ...importedWorkouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setCustomExercises(Array.from(newCustomExercises));
      setCustomBodyParts(newCustomBodyParts);
      alert(`Imported ${importedWorkouts.length} workouts successfully.`);
    };
    reader.readAsText(file);
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
      // Header matching the requested format
      const header = ['Date', 'Exercise', 'Category', 'Weight', 'Weight Unit', 'Reps', 'Distance', 'Distance Unit', 'Time'];
      const rows = [header.join(',')];

      workouts.forEach(w => {
        const dateStr = w.date.split('T')[0]; // YYYY-MM-DD
        
        w.exercises.forEach(e => {
          const category = getBodyPart(e.name, customBodyParts);
          
          e.sets.forEach((s) => {
            const weightUnit = unitSystem === 'metric' ? 'kgs' : 'lbs';
            const distUnit = unitSystem === 'metric' ? 'km' : 'mi';
            
            // Format Time HH:MM:SS or MM:SS
            const timeStr = minutesToTimeStr(s.duration);

            const row = [
              dateStr,
              `"${e.name}"`, // Quote name to be safe
              category,
              s.weight || '',
              s.weight ? weightUnit : '',
              s.reps || '',
              s.distance || '',
              s.distance ? distUnit : '',
              timeStr
            ];
            
            rows.push(row.join(','));
          });
        });
      });

      const csvContent = rows.join('\n');
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
          unitSystem={unitSystem}
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
                        <span className="text-[10px] ml-0.5 text-stone-600 uppercase">{unitSystem === 'metric' ? 'kg' : 'lbs'}</span>
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
        onImport={handleImportCSV}
        unitSystem={unitSystem}
        onToggleUnitSystem={toggleUnitSystem}
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
        
        {view === 'stats' && <StatsView workouts={workouts} customBodyParts={customBodyParts} unitSystem={unitSystem} />}
        {view === 'coach' && <AICoach workouts={workouts} unitSystem={unitSystem} />}
      </main>
    </div>
  );
};

export default App;