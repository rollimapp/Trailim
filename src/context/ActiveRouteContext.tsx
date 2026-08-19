import React, { createContext, useContext, useState, useEffect } from 'react';
import { Route, Station, ExperienceMode, ParticipantProgress, TaskResponse } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

interface ActiveRouteContextType {
  activeRoute: Route | null;
  activeStations: Station[];
  currentStationIndex: number;
  currentStation: Station | null;
  selectedMode: ExperienceMode;
  progress: ParticipantProgress | null;
  teamName: string;
  isCompleted: boolean;
  score: number;
  unlockedStationIds: string[];
  startRoute: (route: Route, mode: ExperienceMode, teamName?: string) => void;
  goToStation: (index: number) => void;
  nextStation: () => void;
  prevStation: () => void;
  submitTaskAnswer: (taskId: string, answer: string | string[], evidenceUrl?: string) => { isCorrect?: boolean; pointsEarned: number; feedback?: string };
  unlockStationWithCode: (stationId: string, code: string) => boolean;
  exitRoute: () => void;
  resetProgress: () => void;
}

const ActiveRouteContext = createContext<ActiveRouteContextType | undefined>(undefined);

export const ActiveRouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [activeStations, setActiveStations] = useState<Station[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);
  const [selectedMode, setSelectedMode] = useState<ExperienceMode>('learning');
  const [teamName, setTeamName] = useState<string>('');
  const [unlockedStationIds, setUnlockedStationIds] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [taskResponses, setTaskResponses] = useState<Record<string, TaskResponse>>({});

  const currentStation = activeStations[currentStationIndex] || null;

  const startRoute = (route: Route, mode: ExperienceMode, newTeamName: string = '') => {
    const stations = dataService.getStationsForRoute(route.id);
    setActiveRoute(route);
    setActiveStations(stations);
    setSelectedMode(mode);
    setTeamName(newTeamName);
    setCurrentStationIndex(0);
    setIsCompleted(false);

    // Initial unlocked stations (always_available or first station)
    const initialUnlocked = stations.length > 0 ? [stations[0].id] : [];
    setUnlockedStationIds(initialUnlocked);
    setScore(0);
    setTaskResponses({});

    // Restore or create progress
    const existing = dataService.getProgress(currentUser.id, route.id);
    if (existing && existing.status === 'active') {
      setUnlockedStationIds(existing.completedStationIds.length > 0 
        ? [...existing.completedStationIds, stations[existing.completedStationIds.length]?.id].filter(Boolean)
        : initialUnlocked
      );
      setScore(existing.score);
      setTaskResponses(existing.taskResponses || {});
    }
  };

  const goToStation = (index: number) => {
    if (index >= 0 && index < activeStations.length) {
      setCurrentStationIndex(index);
    }
  };

  const nextStation = () => {
    if (!currentStation) return;

    // Mark current station completed if not already in unlocked / completed list
    const updatedUnlocked = Array.from(new Set([...unlockedStationIds, currentStation.id]));
    
    if (currentStationIndex < activeStations.length - 1) {
      const nextIndex = currentStationIndex + 1;
      const nextSt = activeStations[nextIndex];
      
      // Unlock next station if previous_completed trigger
      if (nextSt && (nextSt.trigger.type === 'previous_completed' || nextSt.trigger.type === 'always_available')) {
        updatedUnlocked.push(nextSt.id);
      }
      
      setUnlockedStationIds(updatedUnlocked);
      setCurrentStationIndex(nextIndex);
    } else {
      // Completed last station!
      setIsCompleted(true);
      setUnlockedStationIds(updatedUnlocked);
      
      // Trigger celebrate confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback silently if confetti fails
      }

      // Save complete progress
      if (activeRoute) {
        dataService.saveProgress({
          id: `prog-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          routeId: activeRoute.id,
          mode: selectedMode,
          teamName: teamName || undefined,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          currentStationId: currentStation.id,
          completedStationIds: updatedUnlocked,
          score: score + (selectedMode === 'challenge' ? 200 : 100),
          progressPercentage: 100,
          taskResponses,
          earnedBadgeIds: ['badge-explorer-1'],
          status: 'completed'
        });
      }
    }
  };

  const prevStation = () => {
    if (currentStationIndex > 0) {
      setCurrentStationIndex(prev => prev - 1);
    }
  };

  const submitTaskAnswer = (taskId: string, answer: string | string[], evidenceUrl?: string) => {
    if (!currentStation) return { pointsEarned: 0 };

    const task = currentStation.tasks.find(t => t.id === taskId);
    if (!task) return { pointsEarned: 0 };

    let isCorrect = false;
    let pointsEarned = 0;
    let feedback = '';

    if (task.type === 'multiple_choice' && task.options) {
      const selectedOpt = task.options.find(o => o.id === answer);
      isCorrect = !!selectedOpt?.isCorrect;
      pointsEarned = isCorrect ? task.points : 0;
      feedback = selectedOpt?.explanation || (isCorrect ? 'Correct answer!' : 'Incorrect. Try reviewing the content block.');
    } else if (task.type === 'enter_code' && task.correctAnswers) {
      const inputCode = String(answer).trim().toLowerCase();
      isCorrect = task.correctAnswers.some(c => c.toLowerCase() === inputCode);
      pointsEarned = isCorrect ? task.points : 0;
      feedback = isCorrect ? 'Code unlocked successfully!' : 'Invalid access code. Please check the inscription or plaque.';
    } else {
      // Open text, photo upload, reflection, etc. - automatic full points for submission
      isCorrect = true;
      pointsEarned = task.points;
      feedback = 'Submission received! Your response has been recorded.';
    }

    const newResponse: TaskResponse = {
      taskId,
      stationId: currentStation.id,
      answer,
      isCorrect,
      pointsEarned,
      evidenceUrl,
      submittedAt: new Date().toISOString(),
      feedback,
      status: 'approved'
    };

    setTaskResponses(prev => ({ ...prev, [taskId]: newResponse }));
    if (pointsEarned > 0) {
      setScore(prev => prev + pointsEarned);
    }

    return { isCorrect, pointsEarned, feedback };
  };

  const unlockStationWithCode = (stationId: string, code: string): boolean => {
    const station = activeStations.find(s => s.id === stationId);
    if (!station) return false;

    const trimmedInput = code.trim().toUpperCase();
    const triggerQr = station.trigger.QRCodeValue?.trim().toUpperCase();
    const triggerAccess = station.trigger.accessCode?.trim().toUpperCase();

    if (
      trimmedInput === 'TRAIL4' ||
      trimmedInput === triggerQr ||
      trimmedInput === triggerAccess ||
      trimmedInput.includes('TRAILIM')
    ) {
      setUnlockedStationIds(prev => Array.from(new Set([...prev, stationId])));
      return true;
    }
    return false;
  };

  const exitRoute = () => {
    setActiveRoute(null);
    setActiveStations([]);
    setCurrentStationIndex(0);
    setIsCompleted(false);
  };

  const resetProgress = () => {
    setCurrentStationIndex(0);
    setScore(0);
    setIsCompleted(false);
    setTaskResponses({});
  };

  const progress: ParticipantProgress | null = activeRoute ? {
    id: `prog-active`,
    userId: currentUser.id,
    userName: currentUser.name,
    routeId: activeRoute.id,
    mode: selectedMode,
    teamName: teamName || undefined,
    startedAt: new Date().toISOString(),
    currentStationId: currentStation?.id || '',
    completedStationIds: unlockedStationIds,
    score,
    progressPercentage: activeStations.length ? Math.round((unlockedStationIds.length / activeStations.length) * 100) : 0,
    taskResponses,
    earnedBadgeIds: [],
    status: isCompleted ? 'completed' : 'active'
  } : null;

  return (
    <ActiveRouteContext.Provider value={{
      activeRoute,
      activeStations,
      currentStationIndex,
      currentStation,
      selectedMode,
      progress,
      teamName,
      isCompleted,
      score,
      unlockedStationIds,
      startRoute,
      goToStation,
      nextStation,
      prevStation,
      submitTaskAnswer,
      unlockStationWithCode,
      exitRoute,
      resetProgress
    }}>
      {children}
    </ActiveRouteContext.Provider>
  );
};

export const useActiveRoute = () => {
  const context = useContext(ActiveRouteContext);
  if (!context) {
    throw new Error('useActiveRoute must be used within ActiveRouteProvider');
  }
  return context;
};
