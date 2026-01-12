import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Workout } from '../types';

interface CalendarProps {
  workouts: Workout[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ workouts, selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const hasWorkout = (date: Date) => {
    return workouts.some(w => {
      const wDate = new Date(w.date);
      return wDate.getDate() === date.getDate() && 
             wDate.getMonth() === date.getMonth() && 
             wDate.getFullYear() === date.getFullYear();
    });
  };

  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-8 px-2">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-stone-900 rounded-full text-stone-500 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white tracking-widest uppercase font-mono">
          {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-stone-900 rounded-full text-stone-500 hover:text-white transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4 text-center text-[10px] font-bold text-stone-600 uppercase tracking-widest">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="aspect-square" />;
          
          const active = hasWorkout(date);
          const selected = isSelected(date);
          const today = isToday(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`
                aspect-square rounded flex flex-col items-center justify-center relative transition-all duration-200 border
                ${selected ? 'bg-stone-200 text-stone-950 border-stone-200' : 'bg-stone-900 text-stone-500 border-stone-800 hover:border-stone-600 hover:text-stone-300'}
                ${today && !selected ? 'border-stone-500' : ''}
              `}
            >
              <span className={`text-sm font-mono ${selected ? 'font-bold' : ''}`}>{date.getDate()}</span>
              {active && !selected && (
                <div className="mt-1 w-1 h-1 rounded-full bg-stone-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};