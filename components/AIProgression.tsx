import React, { useState, useMemo } from 'react';
import { Sparkles, ArrowRight, BrainCircuit } from 'lucide-react';
import { Workout } from '../types';
import { Card, SectionHeader, Button } from './UI';
import { getProgressionInsight } from '../services/geminiService';

interface AIProgressionProps {
  workouts: Workout[];
}

export const AIProgression: React.FC<AIProgressionProps> = ({ workouts }) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<{
    suggestedWeight: number;
    suggestedReps: string;
    reasoning: string;
    tip: string;
  } | null>(null);

  const availableExercises = useMemo(() => {
    const counts: Record<string, number> = {};
    workouts.forEach(w => w.exercises.forEach(e => {
      counts[e.name] = (counts[e.name] || 0) + 1;
    }));
    // Only show exercises with at least 2 sessions for meaningful prediction
    return Object.keys(counts).filter(k => counts[k] >= 2).sort();
  }, [workouts]);

  const handlePredict = async () => {
    if (!selectedExercise) return;
    setLoading(true);
    setInsight(null);

    // Prepare history data for context
    const history = workouts
      .map(w => {
        const ex = w.exercises.find(e => e.name === selectedExercise);
        if (!ex) return null;
        return {
          date: w.date.split('T')[0],
          maxWeight: Math.max(...ex.sets.map(s => s.weight)),
          totalVolume: ex.sets.reduce((acc, s) => acc + (s.reps * s.weight), 0),
          reps: ex.sets.map(s => s.reps).join(',') // Rough string rep of sets
        };
      })
      .filter(Boolean)
      .slice(-5); // Last 5 sessions

    try {
      const result = await getProgressionInsight(selectedExercise, history as any);
      setInsight(result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate insight. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <SectionHeader 
        title="Smart Coach" 
        subtitle="AI-powered analysis to determine your next move." 
        action={<Sparkles className="text-amber-400" />}
      />

      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-indigo-500/30">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-300">
            Select an exercise to analyze progression:
          </label>
          <div className="flex gap-2">
            <select 
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Choose Exercise --</option>
              {availableExercises.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
            <Button 
              disabled={!selectedExercise || loading}
              onClick={handlePredict}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Predict'}
            </Button>
          </div>
          
          {availableExercises.length === 0 && (
             <p className="text-xs text-yellow-500">
               * You need at least 2 logs of an exercise to use prediction.
             </p>
          )}
        </div>
      </Card>

      {insight && (
        <div className="mt-8 space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            <BrainCircuit className="text-indigo-400" />
            <h3 className="text-xl font-bold text-white">Coach Recommendation</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-indigo-900/20 border-indigo-500/50 flex flex-col items-center justify-center py-8">
              <span className="text-slate-400 text-sm uppercase tracking-wider mb-2">Target Weight</span>
              <span className="text-4xl font-black text-white">{insight.suggestedWeight} <span className="text-lg text-slate-400 font-normal">lbs/kg</span></span>
            </Card>
            <Card className="bg-indigo-900/20 border-indigo-500/50 flex flex-col items-center justify-center py-8">
               <span className="text-slate-400 text-sm uppercase tracking-wider mb-2">Target Reps</span>
               <span className="text-4xl font-black text-white">{insight.suggestedReps}</span>
            </Card>
          </div>

          <Card className="border-l-4 border-l-indigo-500">
            <h4 className="font-bold text-indigo-400 mb-2">Why this?</h4>
            <p className="text-slate-300 leading-relaxed mb-4">
              {insight.reasoning}
            </p>
            <div className="bg-slate-950/50 p-3 rounded-lg flex gap-3 items-start">
              <Sparkles size={16} className="text-amber-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-400 italic">"{insight.tip}"</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};