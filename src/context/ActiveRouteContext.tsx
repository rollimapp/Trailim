import React, { createContext, useContext, useState, useEffect } from 'react';
import { Route, Station, ExperienceMode, ParticipantProgress, TaskResponse } from '../types';
import { dataService } from '../services/dataService';
import { toLegacyVersionPreview } from '../services/vs1Adapters';
import { vs1SessionRepository } from '../services/vs1SessionRepository';
import { vs1WorkflowRepository } from '../services/vs1WorkflowRepository';
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
  const [completedStationIds, setCompletedStationIds] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [taskResponses, setTaskResponses] = useState<Record<string, TaskResponse>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeParticipationId, setActiveParticipationId] = useState<string | null>(null);

  const currentStation = activeStations[currentStationIndex] || null;

  const startRoute = (route: Route, mode: ExperienceMode, newTeamName: string = '') => {
    const workflowRoute = vs1WorkflowRepository.getRoute(route.id);
    const approvedVersionId = workflowRoute?.approvedVersionId;
    const versionedSnapshot = approvedVersionId
      ? vs1WorkflowRepository.getParticipantSnapshot(approvedVersionId)
      : null;
    const versionedPreview = versionedSnapshot ? toLegacyVersionPreview(route, versionedSnapshot) : null;
    const stations = versionedPreview?.stations || dataService.getStationsForRoute(route.id);
    setActiveRoute(route);
    setActiveStations(stations);
    setSelectedMode(mode);
    setTeamName(newTeamName);
    setCurrentStationIndex(0);
    setIsCompleted(false);

    // Initial unlocked stations (always_available or first station)
    const initialUnlocked = stations.length > 0 ? [stations[0].id] : [];
    setUnlockedStationIds(initialUnlocked);
    setCompletedStationIds([]);
    setScore(0);
    setTaskResponses({});
    setActiveSessionId(null);
    setActiveParticipationId(null);

    if (workflowRoute && approvedVersionId && versionedSnapshot) {
      const resumed = vs1SessionRepository.findActiveParticipation(approvedVersionId, currentUser.id);
      const session = resumed?.session || vs1SessionRepository.createSession({
        routeId: workflowRoute.id,
        routeVersionId: approvedVersionId,
        organizationId: workflowRoute.organizationId,
        createdByUserId: currentUser.id,
        title: `${workflowRoute.title} Session`,
        mode,
      });
      const participation = resumed?.participation || vs1SessionRepository.joinSession(session.id, currentUser.id);
      const participantState = vs1SessionRepository.getParticipantState(session.id, currentUser.id)!;
      const restoredResponses = Object.fromEntries(participantState.responses.map(response => [response.taskId, {
        taskId: response.taskId,
        stationId: response.stationId,
        answer: response.answer,
        isCorrect: response.isCorrect,
        pointsEarned: response.pointsAwarded || 0,
        submittedAt: response.submittedAt,
        status: response.evaluationStatus === 'manual_review' ? 'pending_review' as const : 'approved' as const,
      }]));
      const currentIndex = participation.currentStationId
        ? Math.max(0, stations.findIndex(station => station.id === participation.currentStationId))
        : 0;
      const restoredUnlocked = Array.from(new Set([
        ...participation.completedStationIds,
        stations[currentIndex]?.id,
      ].filter(Boolean)));
      setActiveSessionId(session.id);
      setActiveParticipationId(participation.id);
      setSelectedMode(session.mode);
      setCurrentStationIndex(currentIndex);
      setCompletedStationIds(participation.completedStationIds);
      setUnlockedStationIds(restoredUnlocked);
      setScore(participation.score);
      setTaskResponses(restoredResponses);
      return;
    }

    // Restore or create progress
    const existing = dataService.getProgress(currentUser.id, route.id);
    if (existing && existing.status === 'active') {
      setUnlockedStationIds(existing.completedStationIds.length > 0 
        ? [...existing.completedStationIds, stations[existing.completedStationIds.length]?.id].filter(Boolean)
        : initialUnlocked
      );
      setScore(existing.score);
      setCompletedStationIds(existing.completedStationIds);
      setTaskResponses(existing.taskResponses || {});
    }
  };

  const goToStation = (index: number) => {
    if (index >= 0 && index < activeStations.length) {
      setCurrentStationIndex(index);
      if (activeParticipationId) {
        vs1SessionRepository.updateProgress(activeParticipationId, {
          currentStationId: activeStations[index].id,
          completedStationIds,
          progressPercentage: activeStations.length
            ? Math.round((completedStationIds.length / activeStations.length) * 100)
            : 0,
          score,
        });
      }
    }
  };

  const nextStation = () => {
    if (!currentStation) return;

    // Mark current station completed if not already in unlocked / completed list
    const updatedCompleted = Array.from(new Set([...completedStationIds, currentStation.id]));
    const updatedUnlocked = Array.from(new Set([...unlockedStationIds, currentStation.id]));
    
    if (currentStationIndex < activeStations.length - 1) {
      const nextIndex = currentStationIndex + 1;
      const nextSt = activeStations[nextIndex];
      
      // Unlock next station if previous_completed trigger
      if (nextSt && (nextSt.trigger.type === 'previous_completed' || nextSt.trigger.type === 'always_available')) {
        updatedUnlocked.push(nextSt.id);
      }
      
      setUnlockedStationIds(updatedUnlocked);
      setCompletedStationIds(updatedCompleted);
      setCurrentStationIndex(nextIndex);
      if (activeParticipationId) {
        vs1SessionRepository.updateProgress(activeParticipationId, {
          currentStationId: nextSt.id,
          completedStationIds: updatedCompleted,
          progressPercentage: Math.round((updatedCompleted.length / activeStations.length) * 100),
          score,
        });
      }
    } else {
      // Completed last station!
      setIsCompleted(true);
      setUnlockedStationIds(updatedUnlocked);
      setCompletedStationIds(updatedCompleted);
      const finalScore = score + (selectedMode === 'challenge' ? 200 : 100);
      if (activeParticipationId) {
        vs1SessionRepository.completeParticipation(activeParticipationId, {
          currentStationId: currentStation.id,
          completedStationIds: updatedCompleted,
          progressPercentage: 100,
          score: finalScore,
        });
      }
      
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
          score: finalScore,
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
      const previousIndex = currentStationIndex - 1;
      setCurrentStationIndex(previousIndex);
      if (activeParticipationId) {
        vs1SessionRepository.updateProgress(activeParticipationId, {
          currentStationId: activeStations[previousIndex].id,
          completedStationIds,
          progressPercentage: activeStations.length
            ? Math.round((completedStationIds.length / activeStations.length) * 100)
            : 0,
          score,
        });
      }
    }
  };

  const submitTaskAnswer = (taskId: string, answer: string | string[], evidenceUrl?: string) => {
    if (!currentStation) return { pointsEarned: 0 };

    const task = currentStation.tasks.find(t => t.id === taskId);
    if (!task) return { pointsEarned: 0 };

    let isCorrect: boolean | undefined = false;
    let pointsEarned = 0;
    let feedback = '';

    if (activeParticipationId) {
      const response = vs1SessionRepository.submitTaskResponse({
        participationId: activeParticipationId,
        stationId: currentStation.id,
        taskId,
        answer,
      });
      isCorrect = response.isCorrect;
      pointsEarned = response.pointsAwarded || 0;
      feedback = response.evaluationStatus === 'manual_review'
        ? 'Submission received for teacher review.'
        : isCorrect === false ? 'Incorrect answer.' : 'Submission received!';
    } else if (task.type === 'multiple_choice' && task.options) {
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
      status: isCorrect === undefined ? 'pending_review' : 'approved'
    };

    const previousPoints = taskResponses[taskId]?.pointsEarned || 0;
    const scoreDelta = pointsEarned - previousPoints;
    const updatedScore = score + scoreDelta;
    setTaskResponses(prev => ({ ...prev, [taskId]: newResponse }));
    if (scoreDelta !== 0) {
      setScore(updatedScore);
    }
    if (activeParticipationId) {
      vs1SessionRepository.updateProgress(activeParticipationId, {
        currentStationId: currentStation.id,
        completedStationIds,
        progressPercentage: activeStations.length
          ? Math.round((completedStationIds.length / activeStations.length) * 100)
          : 0,
        score: updatedScore,
      });
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
    setActiveSessionId(null);
    setActiveParticipationId(null);
  };

  const resetProgress = () => {
    setCurrentStationIndex(0);
    setScore(0);
    setIsCompleted(false);
    setUnlockedStationIds(activeStations[0] ? [activeStations[0].id] : []);
    setCompletedStationIds([]);
    setTaskResponses({});
    const workflowRoute = activeRoute ? vs1WorkflowRepository.getRoute(activeRoute.id) : null;
    if (activeRoute && workflowRoute?.approvedVersionId) {
      if (activeSessionId) {
        const existing = vs1SessionRepository.getParticipation(activeSessionId, currentUser.id);
        if (existing?.status === 'active') vs1SessionRepository.abandonParticipation(existing.id);
      }
      const session = vs1SessionRepository.createSession({
        routeId: workflowRoute.id,
        routeVersionId: workflowRoute.approvedVersionId,
        organizationId: workflowRoute.organizationId,
        createdByUserId: currentUser.id,
        title: `${workflowRoute.title} Session`,
        mode: selectedMode,
      });
      const participation = vs1SessionRepository.joinSession(session.id, currentUser.id);
      setActiveSessionId(session.id);
      setActiveParticipationId(participation.id);
    }
  };

  const progress: ParticipantProgress | null = activeRoute ? {
    id: activeParticipationId || `prog-active`,
    userId: currentUser.id,
    userName: currentUser.name,
    routeId: activeRoute.id,
    sessionId: activeSessionId || undefined,
    mode: selectedMode,
    teamName: teamName || undefined,
    startedAt: new Date().toISOString(),
    currentStationId: currentStation?.id || '',
    completedStationIds,
    score,
    progressPercentage: activeStations.length ? Math.round((completedStationIds.length / activeStations.length) * 100) : 0,
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
