import React, { useState } from 'react';
import { Workout } from '../types';
import { Card, SectionHeader, Button } from './UI';
import { getCoachFeedback } from '../services/geminiService';

interface AICoachProps {
  workouts: Workout[];
}

const COACHES = [
  { name: "Mike Mentzer", style: "High Intensity / Logic", initials: "MM", color: "bg-blue-900/20 text-blue-400 border-blue-900" },
  { name: "Arnold Schwarzenegger", style: "Volume / Pump", initials: "AS", color: "bg-amber-900/20 text-amber-500 border-amber-900" },
  { name: "Dorian Yates", style: "Blood & Guts", initials: "DY", color: "bg-stone-800 text-stone-300 border-stone-600" },
  { name: "David Goggins", style: "Mental Suffering", initials: "DG", color: "bg-green-900/20 text-green-500 border-green-900" },
  { name: "Ronnie Coleman", style: "Heavy Weight", initials: "RC", color: "bg-yellow-900/20 text-yellow-400 border-yellow-800" }
];

export const AICoach: React.FC<AICoachProps> = ({ workouts }) => {
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEvaluate = async () => {
    if (!selectedCoach) return;
    setLoading(true);
    setFeedback(null);

    // Prepare data
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const recentWorkouts = workouts.filter(w => new Date(w.date) >= twoWeeksAgo);
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const lastTwoMonthsWorkouts = workouts.filter(w => new Date(w.date) >= twoMonthsAgo);
    
    const monthStats = {
      totalWorkouts: lastTwoMonthsWorkouts.length,
      volume: lastTwoMonthsWorkouts.reduce((acc, w) => acc + w.exercises.reduce((eAcc, e) => eAcc + e.sets.reduce((sAcc, s) => sAcc + ((s.weight || 0) * (s.reps || 0)), 0), 0), 0),
      consistency: lastTwoMonthsWorkouts.length > 16 ? "High" : lastTwoMonthsWorkouts.length > 8 ? "Moderate" : "Low"
    };

    try {
      const result = await getCoachFeedback(selectedCoach, recentWorkouts, monthStats);
      setFeedback(result || "Coach is silent today.");
    } catch (e) {
      console.error(e);
      setFeedback("Communication failure. The gym gods are displeased.");
    } finally {
      setLoading(false);
    }
  };

  const currentCoach = COACHES.find(c => c.name === selectedCoach);

  // --- Lightweight Markdown Parser ---
  const parseInline = (text: string) => {
    // Split by bold syntax **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g); 
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-stone-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue; // Skip empty lines, margin handled by CSS

      // Handle Lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const listItems = [];
        // Capture consecutive list items
        listItems.push(line.substring(2));
        
        // Peek forward
        while(i + 1 < lines.length && (lines[i+1].trim().startsWith('- ') || lines[i+1].trim().startsWith('* '))) {
           i++;
           listItems.push(lines[i].trim().substring(2));
        }

        elements.push(
          <ul key={`list-${i}`} className="list-disc pl-5 mb-4 space-y-1 marker:text-stone-400">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm md:text-base font-mono leading-relaxed font-medium">
                {parseInline(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        // Paragraphs
        elements.push(
          <p key={`p-${i}`} className="text-sm md:text-base font-mono leading-relaxed mb-4 last:mb-0 font-medium">
            {parseInline(line)}
          </p>
        );
      }
    }
    return elements;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fadeIn">
      <SectionHeader title="Evaluation" subtitle="Choose your judge. Expect no mercy." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {COACHES.map((coach) => (
          <button
            key={coach.name}
            onClick={() => { setSelectedCoach(coach.name); setFeedback(null); }}
            className={`
              relative p-6 rounded border text-left transition-all duration-300 group
              ${selectedCoach === coach.name 
                ? 'bg-stone-200 text-stone-950 border-stone-200' 
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-600 hover:text-stone-200'}
            `}
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                 <h3 className="font-black uppercase tracking-tight text-lg mb-2 font-mono">{coach.name}</h3>
                 <p className="text-xs uppercase tracking-widest opacity-70">
                   {coach.style}
                 </p>
              </div>
              {selectedCoach === coach.name && (
                <div className="mt-4 h-1 w-full bg-stone-950/20 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-950 w-full animate-pulse" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center pt-8">
        <Button 
          disabled={!selectedCoach || loading}
          onClick={handleEvaluate}
          variant="contrast"
          className="w-full max-w-md"
        >
          {loading ? "Analyzing Weakness..." : "Summon Coach"}
        </Button>
      </div>

      {feedback && currentCoach && (
        <div className="animate-slideUp mt-16 flex flex-col md:flex-row gap-8 items-start">
          {/* Coach Avatar Representation */}
          <div className="shrink-0 flex flex-col items-center gap-3 mx-auto md:mx-0">
             <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center shadow-xl ${currentCoach.color} bg-opacity-10 backdrop-blur-sm`}>
                <span className="text-3xl font-black tracking-tighter">{currentCoach.initials}</span>
             </div>
             <div className="text-center">
               <div className="text-stone-300 font-bold text-xs uppercase tracking-wider">{currentCoach.name.split(' ')[0]}</div>
               <div className="text-stone-600 text-[10px] uppercase font-mono">Coach</div>
             </div>
          </div>

          {/* Speech Bubble */}
          <div className="relative flex-1 bg-stone-200 text-stone-900 p-8 rounded-2xl shadow-2xl">
            {/* Speech bubble tail for desktop */}
            <div className="hidden md:block absolute top-8 -left-3 w-6 h-6 bg-stone-200 transform rotate-45" />
            {/* Speech bubble tail for mobile */}
            <div className="md:hidden absolute -top-3 left-1/2 -ml-3 w-6 h-6 bg-stone-200 transform rotate-45" />
            
            <h4 className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-4 border-b border-stone-300 pb-2">
               Critique
            </h4>
            
            <div className="prose prose-stone max-w-none">
                {renderMarkdown(feedback)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};