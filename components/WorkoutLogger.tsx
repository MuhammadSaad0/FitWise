import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Search, X, Check, Activity, Dumbbell } from 'lucide-react';
import { Workout, Exercise, WorkoutSet, DEFAULT_CARDIO_EXERCISES } from '../types';
import { Button, Input, Card, SectionHeader } from './UI';

interface WorkoutLoggerProps {
  initialWorkout?: Workout;
  targetDate: Date;
  onSave: (workout: Workout) => void;
  onCancel: () => void;
  availableExercises: string[];
  onAddExercise: (name: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ 
  initialWorkout, 
  targetDate, 
  onSave, 
  onCancel,
  availableExercises,
  onAddExercise
}) => {
  const [name, setName] = useState(initialWorkout?.name || '');
  const [exercises, setExercises] = useState<Exercise[]>(initialWorkout?.exercises || []);
  const [startTime] = useState(Date.now());
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [currentExerciseIdForPicker, setCurrentExerciseIdForPicker] = useState<string | null>(null);

  useEffect(() => {
    if (exercises.length === 0 && !initialWorkout) {
      addExercise();
    }
  }, []);

  const addExercise = () => {
    const newId = generateId();
    setExercises([
      ...exercises,
      {
        id: newId,
        name: '',
        type: 'strength',
        sets: [{ id: generateId(), reps: 0, weight: 0, completed: false }]
      }
    ]);
    // Do not open picker immediately
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const updateExerciseName = (id: string, newName: string) => {
    const isCardio = DEFAULT_CARDIO_EXERCISES.includes(newName);
    setExercises(exercises.map(e => e.id === id ? { 
      ...e, 
      name: newName,
      type: isCardio ? 'cardio' : 'strength' 
    } : e));
  };

  const toggleExerciseType = (id: string) => {
    setExercises(exercises.map(e => e.id === id ? {
      ...e,
      type: e.type === 'strength' ? 'cardio' : 'strength'
    } : e));
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(e => {
      if (e.id === exerciseId) {
        const lastSet = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [
            ...e.sets,
            { 
              id: generateId(), 
              reps: lastSet?.reps || 0, 
              weight: lastSet?.weight || 0,
              distance: lastSet?.distance || 0,
              duration: lastSet?.duration || 0,
              completed: false 
            }
          ]
        };
      }
      return e;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(e => {
      if (e.id === exerciseId) {
        return { ...e, sets: e.sets.filter(s => s.id !== setId) };
      }
      return e;
    }));
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => {
    setExercises(exercises.map(e => {
      if (e.id === exerciseId) {
        return {
          ...e,
          sets: e.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return e;
    }));
  };

  const handleSave = () => {
    const validExercises = exercises.filter(e => e.name.trim() !== '' && e.sets.length > 0);
    
    if (validExercises.length === 0) {
      alert("Please add at least one valid exercise.");
      return;
    }

    let finalDate = targetDate.toISOString();
    if (initialWorkout) {
        finalDate = initialWorkout.date;
    } else {
        const now = new Date();
        const d = new Date(targetDate);
        d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        finalDate = d.toISOString();
    }

    const workout: Workout = {
      id: initialWorkout?.id || generateId(),
      date: finalDate,
      name: name || `Workout on ${targetDate.toLocaleDateString()}`,
      exercises: validExercises,
      durationMinutes: initialWorkout?.durationMinutes || Math.round((Date.now() - startTime) / 60000)
    };
    onSave(workout);
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-slideUp relative">
      <SectionHeader 
        title={initialWorkout ? "Edit Workout" : "Log Workout"}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button variant="contrast" icon={Save} onClick={handleSave}>Save</Button>
          </div>
        }
      />

      <div className="mb-6">
        <Input 
          placeholder="Session Name (e.g. Strength A)" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-lg font-bold bg-stone-900 border-stone-800 focus:border-stone-500"
        />
      </div>

      <div className="space-y-6">
        {exercises.map((exercise, index) => (
          <Card key={exercise.id} className="relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4">
              <div 
                className="flex-1 mr-4 cursor-pointer" 
                onClick={() => {
                  setCurrentExerciseIdForPicker(exercise.id);
                  setExercisePickerOpen(true);
                }}
              >
                 {exercise.name ? (
                   <h3 className="text-lg md:text-xl font-bold text-stone-200 flex items-center gap-2 font-mono truncate">
                     {exercise.name} <span className="hidden md:inline text-stone-600 text-[10px] font-normal border border-stone-700 px-1 rounded uppercase tracking-wider">Change</span>
                   </h3>
                 ) : (
                   <div className="text-stone-500 font-bold italic border-b border-stone-800 pb-1 w-full flex items-center gap-2 hover:text-stone-300 transition-colors">
                     <Search size={16} /> SELECT MOVEMENT
                   </div>
                 )}
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => toggleExerciseType(exercise.id)}
                  className="p-2 text-stone-600 hover:text-stone-300 transition-colors"
                  title={exercise.type === 'cardio' ? "Switch to Strength" : "Switch to Cardio"}
                >
                  {exercise.type === 'cardio' ? <Activity size={18} /> : <Dumbbell size={18} />}
                </button>
                <Button 
                  variant="ghost" 
                  onClick={() => removeExercise(exercise.id)}
                  className="text-stone-600 hover:text-red-400 p-2"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-10 gap-1 md:gap-2 mb-2 text-[8px] md:text-[10px] text-stone-500 uppercase font-bold tracking-widest text-center">
              <div className="col-span-1">#</div>
              <div className="col-span-3">{exercise.type === 'cardio' ? 'Dist (km)' : 'Load'}</div>
              <div className="col-span-3">{exercise.type === 'cardio' ? 'Time (min)' : 'Reps'}</div>
              <div className="col-span-2">RPE</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-2">
              {exercise.sets.map((set, setIndex) => (
                <div key={set.id} className="grid grid-cols-10 gap-1 md:gap-2 items-center">
                  <div className="col-span-1 flex justify-center">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-stone-800 flex items-center justify-center text-[10px] md:text-xs text-stone-400 font-mono font-bold">
                      {setIndex + 1}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Input 
                      type="number" 
                      value={exercise.type === 'cardio' ? (set.distance || '') : (set.weight || '')} 
                      onChange={(e) => updateSet(exercise.id, set.id, exercise.type === 'cardio' ? 'distance' : 'weight', parseFloat(e.target.value))}
                      placeholder="-"
                      className="text-center font-mono px-1 py-2 text-sm md:text-base md:px-4 md:py-3"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input 
                      type="number" 
                      value={exercise.type === 'cardio' ? (set.duration || '') : (set.reps || '')} 
                      onChange={(e) => updateSet(exercise.id, set.id, exercise.type === 'cardio' ? 'duration' : 'reps', parseFloat(e.target.value))}
                      placeholder="-"
                      className="text-center font-mono px-1 py-2 text-sm md:text-base md:px-4 md:py-3"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      max={10}
                      value={set.rpe || ''} 
                      onChange={(e) => updateSet(exercise.id, set.id, 'rpe', parseFloat(e.target.value))}
                      placeholder="-"
                      className="text-center font-mono px-1 py-2 text-sm md:text-base md:px-4 md:py-3"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                     <button 
                      onClick={() => removeSet(exercise.id, set.id)}
                      className="text-stone-700 hover:text-stone-500 transition-colors p-1"
                     >
                       <X size={14} />
                     </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-stone-800/50 flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => addSet(exercise.id)} className="text-stone-500 hover:text-stone-300 w-full md:w-auto">
                <Plus size={16} className="mr-1" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="secondary" onClick={addExercise} className="w-full py-4 border border-dashed border-stone-800 bg-transparent hover:bg-stone-900 hover:border-stone-600 hover:text-stone-300 transition-all text-xs tracking-widest uppercase">
          <Plus size={16} className="mr-2" /> Add Movement
        </Button>
      </div>

      {/* Exercise Picker Modal */}
      {exercisePickerOpen && (
        <ExercisePicker 
          onClose={() => setExercisePickerOpen(false)}
          exercises={[...DEFAULT_CARDIO_EXERCISES, ...availableExercises]}
          onSelect={(name) => {
            if (currentExerciseIdForPicker) {
              updateExerciseName(currentExerciseIdForPicker, name);
            }
            setExercisePickerOpen(false);
          }}
          onCreateNew={(name) => {
             onAddExercise(name);
             if (currentExerciseIdForPicker) {
               updateExerciseName(currentExerciseIdForPicker, name);
             }
             setExercisePickerOpen(false);
          }}
        />
      )}
    </div>
  );
};

const ExercisePicker: React.FC<{ 
  onClose: () => void; 
  exercises: string[]; 
  onSelect: (name: string) => void;
  onCreateNew: (name: string) => void;
}> = ({ onClose, exercises, onSelect, onCreateNew }) => {
  const [search, setSearch] = useState('');
  
  // Deduplicate and sort
  const uniqueExercises: string[] = (Array.from(new Set(exercises)) as string[]).sort();
  const filtered = uniqueExercises.filter(e => e.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-lg shadow-2xl flex flex-col max-h-[80vh] animate-slideUp">
        <div className="p-4 border-b border-stone-800 flex items-center gap-3">
          <Search className="text-stone-500" size={20} />
          <input 
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-stone-600 focus:outline-none text-lg font-mono"
            placeholder="FIND MOVEMENT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={onClose} className="text-stone-600 hover:text-stone-400"><X size={24} /></button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2">
           {search && !uniqueExercises.some(e => e.toLowerCase() === search.toLowerCase()) && (
             <button 
               onClick={() => onCreateNew(search)}
               className="w-full text-left px-4 py-3 rounded bg-stone-800 text-stone-200 hover:bg-stone-700 mb-2 flex items-center justify-between"
             >
               <span className="font-mono text-sm">Create "{search}"</span>
               <Plus size={16} />
             </button>
           )}
           
           {filtered.map(ex => (
             <button
               key={ex}
               onClick={() => onSelect(ex)}
               className="w-full text-left px-4 py-3 rounded text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors font-mono text-sm"
             >
               {ex}
             </button>
           ))}

           {filtered.length === 0 && !search && (
             <div className="text-center py-8 text-stone-600 font-mono text-xs">TYPE TO SEARCH</div>
           )}
        </div>
      </div>
    </div>
  )
}
