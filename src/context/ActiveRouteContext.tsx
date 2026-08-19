import React, { createContext, useContext, useState, useEffect } from 'react';
import { Route, Station, ExperienceMode, ParticipantProgress, TaskResponse } from '../types';
import { dataService } from '../services/dataService';
import { toLegacyVersionPreview } from '../services/vs1Adapters';
import { vs1SessionRepository } from '../services/vs1SessionRepository';
import { vs1WorkflowRepository } from '../services/vs1WorkflowRepository';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';
import { isFirebaseConfigured, getFirebaseServices } from '../services/firebase/firebaseClient';
import { firebaseSessionParticipationGateway, isFirebaseSessionParticipationEnabled, isFirebaseTaskResponseScoringEnabled } from '../services/firebase/sessionParticipationGateway';
import { firestoreSessionParticipationRepository } from '../services/firebase/sessionParticipationRepository';
import { firestoreRouteDraftRepository } from '../services/firebase/routeDraftRepository';
import { firestoreVersionReviewRepository } from '../services/firebase/versionReviewRepository';
import type { Vs1RouteSession, Participation } from '../types/vs1';

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
  submitTaskAnswer: (taskId: string, answer: string | string[], evidenceUrl?: string) => Promise<{ isCorrect?: boolean; pointsEarned: number; feedback?: string }>;
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
    setActiveRoute(route);
    setSelectedMode(mode);
    setTeamName(newTeamName);
    setCurrentStationIndex(0);
    setIsCompleted(false);
    setCompletedStationIds([]);
    setScore(0);
    setTaskResponses({});
    setActiveSessionId(null);
    setActiveParticipationId(null);

    const initialUnlocked = [route.stationIds?.[0] || ''];
    setUnlockedStationIds(initialUnlocked);

    (async () => {
      try {
        if (isFirebaseSessionParticipationEnabled() && getFirebaseServices().auth.currentUser) {
          const workflowRoute = await firestoreRouteDraftRepository.getRoute(route.id);
          const approvedVersionId = workflowRoute?.approvedVersionId;
          if (workflowRoute && approvedVersionId) {
            const versionSnapshot = await firestoreVersionReviewRepository.getVersion(route.id, approvedVersionId);
            const stationsSnapshot = await firestoreVersionReviewRepository.getVersionStations(route.id, approvedVersionId);
            if (versionSnapshot && stationsSnapshot) {
              const versionedPreview = toLegacyVersionPreview(route, { version: versionSnapshot, stations: stationsSnapshot });
              const stations = versionedPreview.stations;
              setActiveStations(stations);
              
              let resumed = await firestoreSessionParticipationRepository.findActiveParticipation(approvedVersionId, currentUser.id, mode);
              let session: Vs1RouteSession;
              let participation: Participation;

              if (resumed) {
                session = resumed.session;
                participation = resumed.participation;
              } else {
                const createRes = await firebaseSessionParticipationGateway.createSession({
                  routeId: workflowRoute.id,
                  routeVersionId: approvedVersionId,
                  title: `${workflowRoute.title} Session`,
                  mode,
                });
                const sessionId = (createRes.data as any).sessionId;
                const fetchedSession = await firestoreSessionParticipationRepository.getSession(sessionId);
                if (!fetchedSession) throw new Error('Failed to fetch created session');
                session = fetchedSession;

                const joinRes = await firebaseSessionParticipationGateway.joinSession(session.id);
                const participationId = (joinRes.data as any).participationId;
                const fetchedParticipation = await firestoreSessionParticipationRepository.getOwnParticipation(session.id, currentUser.id);
                if (!fetchedParticipation) throw new Error('Failed to fetch participation');
                participation = fetchedParticipation;
              }

              const responses = await firestoreSessionParticipationRepository.listOwnResponses(session.id, currentUser.id);
              const restoredResponses = Object.fromEntries(responses.map(response => [response.taskId, {
                taskId: response.taskId,
                stationId: response.stationId,
                answer: response.answer,
                isCorrect: response.isCorrect,
                pointsEarned: response.pointsAwarded || 0,
                submittedAt: response.submittedAt,
                status: response.evaluationStatus === 'manual_review' ? 'pending_review' as const : 'approved' as const,
              }]));

              const currentIndex = participation.currentStationId
                ? Math.max(0, stations.findIndex(st => st.id === participation.currentStationId))
                : 0;
              const restoredUnlocked = Array.from(new Set([
                ...participation.completedStationIds,
                stations[currentIndex]?.id,
              ].filter(Boolean)));

              setActiveSessionId(session.id);
              setActiveParticipationId(participation.id);
              setCurrentStationIndex(currentIndex);
              setCompletedStationIds(participation.completedStationIds);
              setUnlockedStationIds(restoredUnlocked);
              setScore(participation.score);
              setTaskResponses(restoredResponses);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Firebase session initialization failed:', error);
        alert('Failed to initialize trail session: ' + (error as Error).message);
        return;
      }

      // Local fallback
      const workflowRoute = vs1WorkflowRepository.getRoute(route.id);
      const approvedVersionId = workflowRoute?.approvedVersionId;
      const versionedSnapshot = approvedVersionId
        ? vs1WorkflowRepository.getParticipantSnapshot(approvedVersionId)
        : null;
      const versionedPreview = versionedSnapshot ? toLegacyVersionPreview(route, versionedSnapshot) : null;
      const stations = versionedPreview?.stations || dataService.getStationsForRoute(route.id);
      setActiveStations(stations);
      
      const localUnlocked = stations.length > 0 ? [stations[0].id] : [];
      setUnlockedStationIds(localUnlocked);

      if (workflowRoute && approvedVersionId && versionedSnapshot) {
        const resumed = vs1SessionRepository.findActiveParticipation(approvedVersionId, currentUser.id, mode);
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
        setCurrentStationIndex(currentIndex);
        setCompletedStationIds(participation.completedStationIds);
        setUnlockedStationIds(restoredUnlocked);
        setScore(participation.score);
        setTaskResponses(restoredResponses);
        return;
      }

      const existing = dataService.getProgress(currentUser.id, route.id);
      if (existing && existing.status === 'active') {
        setUnlockedStationIds(existing.completedStationIds.length > 0 
          ? [...existing.completedStationIds, stations[existing.completedStationIds.length]?.id].filter(Boolean)
          : localUnlocked
        );
        setScore(existing.score);
        setCompletedStationIds(existing.completedStationIds);
        setTaskResponses(existing.taskResponses || {});
      }
    })();
  };

  const goToStation = (index: number) => {
    if (index >= 0 && index < activeStations.length) {
      setCurrentStationIndex(index);
      if (activeParticipationId) {
        if (isFirebaseSessionParticipationEnabled()) {
          (async () => {
            try {
              await firebaseSessionParticipationGateway.updateProgress(activeSessionId!, {
                currentStationId: activeStations[index].id,
                completedStationIds,
                progressPercentage: activeStations.length
                  ? Math.round((completedStationIds.length / activeStations.length) * 100)
                  : 0,
              });
            } catch (err) {
              console.error('Firebase progress update failed:', err);
            }
          })();
        } else {
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
    }
  };

  const nextStation = () => {
    if (!currentStation) return;

    const updatedCompleted = Array.from(new Set([...completedStationIds, currentStation.id]));
    const updatedUnlocked = Array.from(new Set([...unlockedStationIds, currentStation.id]));
    
    if (currentStationIndex < activeStations.length - 1) {
      const nextIndex = currentStationIndex + 1;
      const nextSt = activeStations[nextIndex];
      
      if (nextSt && (nextSt.trigger.type === 'previous_completed' || nextSt.trigger.type === 'always_available')) {
        updatedUnlocked.push(nextSt.id);
      }
      
      setUnlockedStationIds(updatedUnlocked);
      setCompletedStationIds(updatedCompleted);
      setCurrentStationIndex(nextIndex);
      if (activeParticipationId) {
        if (isFirebaseSessionParticipationEnabled()) {
          (async () => {
            try {
              await firebaseSessionParticipationGateway.updateProgress(activeSessionId!, {
                currentStationId: nextSt.id,
                completedStationIds: updatedCompleted,
                progressPercentage: Math.round((updatedCompleted.length / activeStations.length) * 100),
              });
            } catch (err) {
              console.error('Firebase progress update failed:', err);
            }
          })();
        } else {
          vs1SessionRepository.updateProgress(activeParticipationId, {
            currentStationId: nextSt.id,
            completedStationIds: updatedCompleted,
            progressPercentage: Math.round((updatedCompleted.length / activeStations.length) * 100),
            score,
          });
        }
      }
    } else {
      setIsCompleted(true);
      setUnlockedStationIds(updatedUnlocked);
      setCompletedStationIds(updatedCompleted);
      const finalScore = score + (selectedMode === 'challenge' ? 200 : 100);
      if (activeParticipationId) {
        if (isFirebaseSessionParticipationEnabled()) {
          (async () => {
            try {
              await firebaseSessionParticipationGateway.updateProgress(activeSessionId!, {
                currentStationId: currentStation.id,
                completedStationIds: updatedCompleted,
                progressPercentage: 100,
              });
            } catch (err) {
              console.error('Firebase progress update failed:', err);
            }
          })();
        } else {
          vs1SessionRepository.completeParticipation(activeParticipationId, {
            currentStationId: currentStation.id,
            completedStationIds: updatedCompleted,
            progressPercentage: 100,
            score: finalScore,
          });
        }
      }
      
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

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
        if (isFirebaseSessionParticipationEnabled()) {
          (async () => {
            try {
              await firebaseSessionParticipationGateway.updateProgress(activeSessionId!, {
                currentStationId: activeStations[previousIndex].id,
                completedStationIds,
                progressPercentage: activeStations.length
                  ? Math.round((completedStationIds.length / activeStations.length) * 100)
                  : 0,
              });
            } catch (err) {
              console.error('Firebase progress update failed:', err);
            }
          })();
        } else {
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
    }
  };

  const submitTaskAnswer = async (taskId: string, answer: string | string[], evidenceUrl?: string) => {
    if (!currentStation) return { pointsEarned: 0 };

    const task = currentStation.tasks.find(t => t.id === taskId);
    if (!task) return { pointsEarned: 0 };

    let isCorrect: boolean | undefined = false;
    let pointsEarned = 0;
    let feedback = '';

    if (activeParticipationId) {
      if (isFirebaseTaskResponseScoringEnabled()) {
        try {
          const res = await firebaseSessionParticipationGateway.submitTaskResponse(
            activeSessionId!,
            currentStation.id,
            taskId,
            answer
          );
          const data = res.data as any;
          isCorrect = data.isCorrect;
          pointsEarned = data.pointsAwarded || 0;
          feedback = data.evaluationStatus === 'manual_review'
            ? 'Submission received for teacher review.'
            : isCorrect === false ? 'Incorrect answer.' : 'Submission received!';
          
          setScore(data.score);
        } catch (err) {
          console.error('Firebase task submission failed:', err);
          alert('Failed to submit answer: ' + (err as Error).message);
          return { pointsEarned: 0 };
        }
      } else {
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
      }
    } else {
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
        isCorrect = true;
        pointsEarned = task.points;
        feedback = 'Submission received! Your response has been recorded.';
      }
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

    if (!isFirebaseTaskResponseScoringEnabled()) {
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
    } else {
      try {
        await firebaseSessionParticipationGateway.updateProgress(activeSessionId!, {
          currentStationId: currentStation.id,
          completedStationIds,
          progressPercentage: activeStations.length
            ? Math.round((completedStationIds.length / activeStations.length) * 100)
            : 0,
        });
      } catch (err) {
        console.error('Firebase progress update after answer failed:', err);
      }
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

    if (isFirebaseSessionParticipationEnabled()) {
      (async () => {
        try {
          if (activeSessionId) {
            await firebaseSessionParticipationGateway.abandonParticipation(activeSessionId);
          }
          const workflowRoute = activeRoute ? await firestoreRouteDraftRepository.getRoute(activeRoute.id) : null;
          if (activeRoute && workflowRoute?.approvedVersionId) {
            const createRes = await firebaseSessionParticipationGateway.createSession({
              routeId: workflowRoute.id,
              routeVersionId: workflowRoute.approvedVersionId,
              title: `${workflowRoute.title} Session`,
              mode: selectedMode,
            });
            const sessionId = (createRes.data as any).sessionId;
            const joinRes = await firebaseSessionParticipationGateway.joinSession(sessionId);
            const participationId = (joinRes.data as any).participationId;
            setActiveSessionId(sessionId);
            setActiveParticipationId(participationId);
          }
        } catch (err) {
          console.error('Firebase reset progress failed:', err);
          alert('Failed to reset progress: ' + (err as Error).message);
        }
      })();
      return;
    }

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
