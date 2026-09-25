import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from 'firebase/ai';
import type { ProjectTemplate, TeacherProjectWizardAnswers } from '../../types/projectTemplate';
import { getFirebaseServices } from './firebaseClient';

const projectTemplateSchema = Schema.object({
  properties: {
    schemaVersion: Schema.number(),
    id: Schema.string(),
    title: Schema.string(),
    description: Schema.string(),
    subject: Schema.string(),
    audience: Schema.string(),
    locale: Schema.enumString({ enum: ['he-IL', 'en-US'] }),
    team: Schema.object({
      properties: {
        minSize: Schema.number(),
        maxSize: Schema.number(),
      },
    }),
    reportEnabled: Schema.boolean(),
    routePublishingRequired: Schema.boolean(),
    tags: Schema.array({ items: Schema.string() }),
    stages: Schema.array({
      items: Schema.object({
        properties: {
          id: Schema.string(),
          kind: Schema.enumString({
            enum: [
              'topic',
              'research',
              'planning',
              'field_check',
              'field_tour',
              'analysis',
              'reflection',
              'report',
              'presentation',
              'publish',
              'custom',
            ],
          }),
          order: Schema.number(),
          title: Schema.string(),
          description: Schema.string(),
          studentInstruction: Schema.string(),
          approval: Schema.object({
            properties: {
              required: Schema.boolean(),
              reviewer: Schema.enumString({ enum: ['teacher'] }),
              lockNextStageUntilApproved: Schema.boolean(),
            },
          }),
          requirements: Schema.array({
            items: Schema.object({
              properties: {
                id: Schema.string(),
                kind: Schema.enumString({
                  enum: [
                    'short_text',
                    'long_text',
                    'number',
                    'source_list',
                    'concept_list',
                    'station_list',
                    'media',
                    'location',
                    'reflection',
                    'checkbox',
                    'custom',
                  ],
                }),
                label: Schema.string(),
                required: Schema.boolean(),
              },
            }),
          }),
        },
      }),
    }),
  },
  optionalProperties: ['subject', 'audience'],
});

const buildPrompt = (answers: TeacherProjectWizardAnswers) => `
You are the project setup assistant inside Trailim, a place-based learning platform.

Create a teacher-editable ProjectTemplate draft from the teacher's answers below.

Rules:
- Return only data that fits the provided schema.
- Prefer a clear, age-appropriate guided workflow.
- Scaffold the process, not the student's thinking.
- Do not provide students with factual answers, analysis, findings, or reflection content.
- Reuse student-authored work instead of asking them to write the same content twice.
- Add teacher approval gates only where they are useful.
- If field verification before the official tour is requested, add a dedicated field_check stage before field_tour.
- If field verification is not requested, do not add a separate mandatory field_check stage.
- Keep stage titles and instructions concise and in Hebrew unless the teacher's context clearly requires English.
- The template must remain generic enough to be edited by the teacher before publishing.

Teacher answers:
${JSON.stringify(answers, null, 2)}
`;

export const generateProjectTemplateWithAI = async (
  answers: TeacherProjectWizardAnswers,
): Promise<ProjectTemplate> => {
  const { app } = getFirebaseServices();
  const ai = getAI(app, { backend: new GoogleAIBackend() });

  const model = getGenerativeModel(ai, {
    model: import.meta.env.VITE_FIREBASE_AI_MODEL || 'gemini-3.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: projectTemplateSchema,
    },
  });

  const result = await model.generateContent(buildPrompt(answers));
  const text = result.response.text();
  const parsed = JSON.parse(text) as ProjectTemplate;

  return {
    ...parsed,
    schemaVersion: 1,
  };
};
