import type { AnswerValidation } from './vs1';

export interface ProtectedTaskInput {
  stationId: string;
  taskId: string;
  validation: AnswerValidation;
  pointsAwarded: number;
  attemptLimit?: number;
  allowRetry: boolean;
  penaltyPerAttempt: number;
  explanationByOptionId?: Record<string, string>;
}

export interface ProtectedTriggerInput {
  stationId: string;
  triggerType: 'qr_code' | 'access_code';
  secret: string;
}

export interface ProtectedSubmissionInput {
  answerKeys: ProtectedTaskInput[];
  triggers?: ProtectedTriggerInput[];
}
