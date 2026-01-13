import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Search, X, Activity, Dumbbell, ChevronLeft, ArrowRight } from 'lucide-react';
import { Workout, Exercise, WorkoutSet, DEFAULT_CARDIO_EXERCISES, VALID_BODY_PARTS, getBodyPart, UnitSystem } from '../types';
import { Button, Input, Card } from './UI';

interface WorkoutLoggerProps {
  initialWorkout?: Workout;
  targetDate: Date;
  onSave: (workout: Workout) => void;
  onCancel: () => void;
  availableExercises: string[];
  onAddExercise: (name: string, bodyPart: string) => void;
  customBodyParts?: Record<string, string>;
  unitSystem: UnitSystem;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({ 
  initialWorkout, 
  targetDate, 
  onSave, 
  onCancel,
  availableExercises,
  onAddExercise,
  customBodyParts,
  unitSystem
}) => {
  const [name, setName] = useState(initialWorkout?.name || '');
  const [exercises, setExercises] = useState<Exercise[]>(initialWorkout?.exercises || []);
  const [startTime] = useState(Date.now());
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);

  useEffect(() => {
    // Optional initialization logic
  }, []);

  const handleAddExerciseData = (name: string, type: 'strength' | 'cardio', initialSet: WorkoutSet) => {
      const newId = generateId();
      setExercises([
          ...exercises,
          {
              id: newId,
              name: name,
              type: type,
              sets: [initialSet]
          }
      ]);
      setExercisePickerOpen(false);
      setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
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

  const distLabel = unitSystem === 'metric' ? 'km' : 'mi';
  const weightLabel = unitSystem === 'metric' ? 'kg' : 'lbs';

  return (
    <div className="max-w-3xl mx-auto pb-48 animate-slideUp relative">
      <div className="sticky top-20 -mt-4 mb-6 z-30 bg-stone-950/95 backdrop-blur border-b border-stone-800 py-4 -mx-4 px-4 shadow-xl">
        <div className="flex items-center justify-between">
           <div>
             <h2 className="text-xl font-bold text-white tracking-widest uppercase font-mono">{initialWorkout ? "Edit" : "Log"}</h2>
             <p className="text-stone-500 text-[10px] font-medium tracking-wide">
                 {targetDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
             </p>
           </div>
           <div className="flex gap-2">
             <Button variant="ghost" onClick={onCancel} className="text-stone-400 hover:text-white text-xs">Cancel</Button>
             <Button variant="contrast" icon={Save} onClick={handleSave} className="text-xs px-4 py-2">Save</Button>
           </div>
        </div>
      </div>

      <div className="space-y-6">
        <Input 
          placeholder="Session Name (e.g. Strength A)" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-lg font-bold bg-stone-900 border-stone-800 focus:border-stone-500"
        />

        <Button 
          variant="secondary" 
          onClick={() => setExercisePickerOpen(true)} 
          className="w-full py-4 border border-dashed border-stone-800 bg-transparent hover:bg-stone-900 hover:border-stone-600 hover:text-stone-300 transition-all text-xs tracking-widest uppercase"
        >
          <Plus size={16} className="mr-2" /> Add Movement
        </Button>

        {exercises.map((exercise, index) => (
          <Card key={exercise.id} className="relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 mr-4">
                 <h3 className="text-lg md:text-xl font-bold text-stone-200 flex items-center gap-2 font-mono truncate">
                   {exercise.name} 
                 </h3>
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
              <div className="col-span-3">{exercise.type === 'cardio' ? `Dist (${distLabel})` : `Load (${weightLabel})`}</div>
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

      {exercisePickerOpen && (
        <ExercisePicker 
          onClose={() => setExercisePickerOpen(false)}
          exercises={[...DEFAULT_CARDIO_EXERCISES, ...availableExercises]}
          customBodyParts={customBodyParts}
          onComplete={handleAddExerciseData}
          onAddExercise={onAddExercise}
          unitSystem={unitSystem}
        />
      )}
    </div>
  );
};

interface ExercisePickerProps { 
  onClose: () => void; 
  exercises: string[]; 
  customBodyParts?: Record<string, string>;
  onComplete: (name: string, type: 'strength' | 'cardio', initialSet: WorkoutSet) => void;
  onAddExercise: (name: string, bodyPart: string) => void;
  unitSystem: UnitSystem;
}

const ExercisePicker: React.FC<ExercisePickerProps> = ({ onClose, exercises, customBodyParts, onComplete, onAddExercise, unitSystem }) => {
  const [step, setStep] = useState<'bodyPart' | 'exercise' | 'data'>('bodyPart');
  const [selectedPart, setSelectedPart] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [search, setSearch] = useState('');
  
  // Data State
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [rpe, setRpe] = useState<string>('');
  const [distance, setDistance] = useState<string>(''); 
  const [duration, setDuration] = useState<string>(''); 

  // Fix: Explicitly type Array.from to string[] to avoid unknown[] inference error
  const uniqueExercises: string[] = Array.from<string>(new Set(exercises)).sort();
  
  const filteredExercises = uniqueExercises.filter(ex => {
    const part = getBodyPart(ex, customBodyParts);
    if (part !== selectedPart) return false;
    if (search && !ex.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isCardio = selectedPart === 'Cardio';

  const handleFinish = () => {
    const initialSet: WorkoutSet = {
        id: generateId(),
        completed: false,
        weight: parseFloat(weight) || 0,
        reps: parseFloat(reps) || 0,
        rpe: parseFloat(rpe) || undefined,
        distance: parseFloat(distance) || 0,
        duration: parseFloat(duration) || 0
    };
    const type = isCardio ? 'cardio' : 'strength';
    onComplete(selectedExercise, type, initialSet);
  };

  const handleCreateNew = () => {
      onAddExercise(search, selectedPart);
      setSelectedExercise(search);
      setStep('data');
  };

  const distLabel = unitSystem === 'metric' ? 'km' : 'mi';
  const weightLabel = unitSystem === 'metric' ? 'kg' : 'lbs';

  return (
    // FULL SCREEN CONTAINER: Fixed, Inset 0, Z-Index High, Flex Col, Dynamic Height
    <div className="fixed inset-0 z-[100] bg-stone-950 flex flex-col h-[100dvh] animate-slideUp">
      
      {/* 1. HEADER: Fixed Height, Navigation & Close Actions */}
      <div className="shrink-0 flex items-center justify-between px-4 py-4 border-b border-stone-800 bg-stone-950 text-white">
        <div className="w-20">
          {step !== 'bodyPart' && (
            <button 
              onClick={() => setStep(step === 'data' ? 'exercise' : 'bodyPart')} 
              className="flex items-center gap-1 text-stone-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="text-xs font-bold uppercase">Back</span>
            </button>
          )}
        </div>
        
        <h3 className="font-bold uppercase tracking-widest text-sm truncate flex-1 text-center">
            {step === 'bodyPart' && "Select Muscle"}
            {step === 'exercise' && selectedPart}
            {step === 'data' && "Log Set"}
        </h3>
        
        <div className="w-20 flex justify-end">
          <button 
            onClick={onClose} 
            className="p-1 -mr-2 text-stone-600 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* 2. SUB-HEADER: Search Bar (Only for Exercise Step) */}
      {step === 'exercise' && (
         <div className="shrink-0 p-3 bg-stone-900 border-b border-stone-800 animate-fadeIn">
           <div className="flex items-center gap-2 bg-stone-800 px-3 py-2 rounded border border-stone-700">
             <Search className="text-stone-500" size={16} />
             <input 
               autoFocus
               className="flex-1 bg-transparent text-white placeholder-stone-500 focus:outline-none text-sm font-mono"
               placeholder={`Search ${selectedPart}...`}
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
           </div>
         </div>
      )}
      
      {/* 3. CONTENT AREA: Flex-1, Scrollable */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Step 1: Body Part Grid */}
        {step === 'bodyPart' && (
          <div className="p-4 grid grid-cols-2 gap-3 pb-safe-bottom">
             {VALID_BODY_PARTS.map(part => (
               <button
                 key={part}
                 onClick={() => { setSelectedPart(part); setSearch(''); setStep('exercise'); }}
                 className="aspect-video flex items-center justify-center bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded border border-stone-800 hover:border-stone-600 font-bold uppercase tracking-wider text-sm transition-all active:scale-95 duration-150"
               >
                 {part}
               </button>
             ))}
          </div>
        )}

        {/* Step 2: Exercise List */}
        {step === 'exercise' && (
          <div className="pb-safe-bottom">
             {filteredExercises.map(ex => (
               <button
                 key={ex}
                 onClick={() => { setSelectedExercise(ex); setStep('data'); }}
                 className="w-full text-left px-5 py-5 border-b border-stone-800 hover:bg-stone-900 text-stone-300 font-mono text-sm flex justify-between items-center group active:bg-stone-800"
               >
                 {ex}
                 <ArrowRight size={16} className="text-stone-600 opacity-50" />
               </button>
             ))}
             
             {filteredExercises.length === 0 && search && (
               <div className="p-8 text-center">
                  <p className="text-stone-500 text-xs mb-4">No exercise found.</p>
                  <Button variant="contrast" size="sm" onClick={handleCreateNew} className="w-full">
                     Create "{search}"
                  </Button>
               </div>
             )}
          </div>
        )}

        {/* Step 3: Data Form */}
        {step === 'data' && (
          <div className="p-6 flex flex-col min-h-full pb-safe-bottom">
             <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedExercise}</h2>
                <div className="inline-block px-3 py-1 rounded bg-stone-900 text-xs text-stone-400 uppercase tracking-widest font-bold">Set 1 Target</div>
             </div>

             <div className="space-y-6 flex-1">
               {isCardio ? (
                 <>
                   <Input 
                     label={`Distance (${distLabel})`}
                     type="number" 
                     placeholder="0" 
                     value={distance}
                     onChange={e => setDistance(e.target.value)}
                     className="text-lg bg-stone-900"
                     autoFocus
                   />
                   <Input 
                     label="Duration (min)"
                     type="number" 
                     placeholder="0" 
                     value={duration}
                     onChange={e => setDuration(e.target.value)}
                     className="text-lg bg-stone-900"
                   />
                 </>
               ) : (
                 <>
                   <Input 
                     label={`Weight (${weightLabel})`}
                     type="number" 
                     placeholder="0" 
                     value={weight}
                     onChange={e => setWeight(e.target.value)}
                     className="text-lg bg-stone-900"
                     autoFocus
                   />
                   <Input 
                     label="Reps"
                     type="number" 
                     placeholder="0" 
                     value={reps}
                     onChange={e => setReps(e.target.value)}
                     className="text-lg bg-stone-900"
                   />
                   <Input 
                     label="RPE (1-10)"
                     type="number" 
                     placeholder="-" 
                     max={10}
                     value={rpe}
                     onChange={e => setRpe(e.target.value)}
                     className="text-lg bg-stone-900"
                   />
                 </>
               )}
             </div>
             
             <div className="pt-8 mt-auto">
               <Button onClick={handleFinish} variant="contrast" className="w-full py-4 text-base tracking-widest">
                 ADD EXERCISE
               </Button>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}