import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Loader2, StopCircle } from 'lucide-react';
import { Workout } from '../types';
import { SectionHeader, Button } from './UI';
import { getCoachFeedback, generateCoachAudio } from '../services/geminiService';

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

// Helper to decode raw PCM data from Gemini
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const AICoach: React.FC<AICoachProps> = ({ workouts }) => {
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Audio State
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleEvaluate = async () => {
    if (!selectedCoach) return;
    stopAudio();
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

  const handlePlayAudio = async () => {
    if (!feedback || !selectedCoach) return;

    // 1. Initialize AudioContext immediately on user interaction
    if (!audioContextRef.current) {
      // Allow browser to choose sample rate (usually 44.1k or 48k)
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    // Ensure context is running (mobile browsers often suspend it)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (isPlaying) {
      stopAudio();
      return;
    }

    setAudioLoading(true);

    try {
      const base64Audio = await generateCoachAudio(feedback, selectedCoach);
      if (!base64Audio) throw new Error("No audio generated");

      // 2. Decode Base64 to Uint8Array
      const pcmData = decode(base64Audio);
      
      // 3. Convert to Int16Array safely
      // Ensure we are byte-aligned. If length is odd, slice off the last byte.
      const byteLength = pcmData.length;
      const alignedLength = byteLength % 2 === 0 ? byteLength : byteLength - 1;
      
      // Create a view on the buffer (or a copy if needed)
      // Note: We use the buffer of the Uint8Array. 
      // Ensure we start at the correct offset if pcmData was a slice (unlikely here as decode creates new)
      const dataInt16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, alignedLength / 2);

      // 4. Create AudioBuffer
      // Gemini TTS is 24kHz Mono. We explicitly tell createBuffer the source rate is 24000.
      // The AudioContext (ctx) will handle resampling if it's running at 48k.
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);

      // 5. Convert Int16 PCM to Float32 [-1.0, 1.0]
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      // 6. Play
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      sourceRef.current = source;
      
      source.start();
      setIsPlaying(true);

    } catch (e) {
      console.error("Audio Playback Error", e);
      alert("Failed to play audio. Please check your connection.");
    } finally {
      setAudioLoading(false);
    }
  };

  const currentCoach = COACHES.find(c => c.name === selectedCoach);

  // --- Lightweight Markdown Parser ---
  const parseInline = (text: string) => {
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
      if (!line) continue;

      if (line.startsWith('- ') || line.startsWith('* ')) {
        const listItems = [];
        listItems.push(line.substring(2));
        
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
            onClick={() => { setSelectedCoach(coach.name); setFeedback(null); stopAudio(); }}
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
             <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center shadow-xl ${currentCoach.color} bg-opacity-10 backdrop-blur-sm transition-transform ${isPlaying ? 'scale-110' : 'scale-100'}`}>
                <span className="text-3xl font-black tracking-tighter">{currentCoach.initials}</span>
             </div>
             <div className="text-center">
               <div className="text-stone-300 font-bold text-xs uppercase tracking-wider">{currentCoach.name.split(' ')[0]}</div>
               <div className="text-stone-600 text-[10px] uppercase font-mono">Coach</div>
             </div>
          </div>

          {/* Speech Bubble */}
          <div className="relative flex-1 bg-stone-200 text-stone-900 p-8 rounded-2xl shadow-2xl">
            {/* Desktop Tail */}
            <div className="hidden md:block absolute top-8 -left-3 w-6 h-6 bg-stone-200 transform rotate-45" />
            {/* Mobile Tail */}
            <div className="md:hidden absolute -top-3 left-1/2 -ml-3 w-6 h-6 bg-stone-200 transform rotate-45" />
            
            <div className="flex justify-between items-center mb-4 border-b border-stone-300 pb-2">
               <h4 className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                  Critique
               </h4>
               
               <button 
                 onClick={handlePlayAudio}
                 disabled={audioLoading}
                 className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${isPlaying ? 'bg-stone-950 text-white shadow-lg scale-105' : 'bg-stone-300 text-stone-600 hover:bg-stone-400'}`}
               >
                 {audioLoading ? (
                   <Loader2 size={14} className="animate-spin" />
                 ) : isPlaying ? (
                   <>
                     <span className="relative flex h-3 w-3">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                     </span>
                     <span>Stop</span>
                   </>
                 ) : (
                   <>
                     <Volume2 size={14} />
                     <span>Listen</span>
                   </>
                 )}
               </button>
            </div>
            
            <div className="prose prose-stone max-w-none">
                {renderMarkdown(feedback)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};