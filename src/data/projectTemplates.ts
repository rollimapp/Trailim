import type { ProjectTemplate } from '../types/projectTemplate';

export const socialSciencesEducationalTourTemplate: ProjectTemplate = {
  schemaVersion: 1,
  id: 'social-sciences-educational-tour-il-v1',
  title: 'סיור לימודי במדעי החברה',
  description:
    'פרויקט מבוסס מקום שבו תלמידים חוקרים נושא, בונים פעילות ותחנות, יוצאים לשטח, מתעדים ממצאים ומסכמים בדוח ובהצגה.',
  subject: 'מדעי החברה',
  audience: 'חטיבה עליונה',
  locale: 'he-IL',
  team: {
    minSize: 1,
    maxSize: 3,
  },
  reportEnabled: true,
  routePublishingRequired: true,
  tags: ['place-based-learning', 'social-sciences', 'alternative-assessment'],
  stages: [
    {
      id: 'topic',
      kind: 'topic',
      order: 1,
      title: 'בחירת נושא',
      description: 'בחירת נושא ייחודי וחיבורו למקום או לתופעה.',
      studentInstruction:
        'בחרו נושא, מושג או תיאוריה מתוך תחום הדעת, חברו אותו למקום והסבירו בקצרה למה החיבור מתאים.',
      approval: {
        required: true,
        reviewer: 'teacher',
        lockNextStageUntilApproved: true,
      },
      requirements: [
        {
          id: 'topic-title',
          kind: 'short_text',
          label: 'נושא הפרויקט',
          required: true,
          reportSection: 'introduction',
        },
        {
          id: 'topic-rationale',
          kind: 'long_text',
          label: 'למה הנושא מתאים למקום?',
          required: true,
          text: { minWords: 40 },
          reportSection: 'introduction',
        },
      ],
    },
    {
      id: 'research',
      kind: 'research',
      order: 2,
      title: 'חקר מקדים',
      description: 'איסוף מקורות והגדרת המושגים שילוו את הפרויקט.',
      studentInstruction:
        'אספו מקורות אמינים, סכמו מה למדתם מהם והסבירו את המושגים או התיאוריות במילים שלכם.',
      approval: {
        required: true,
        reviewer: 'teacher',
        lockNextStageUntilApproved: true,
      },
      requirements: [
        {
          id: 'sources',
          kind: 'source_list',
          label: 'מקורות אמינים',
          required: true,
          count: { min: 2 },
          reportSection: 'bibliography',
        },
        {
          id: 'concepts',
          kind: 'concept_list',
          label: 'מושגים או תיאוריות',
          required: true,
          count: { min: 5 },
          reportSection: 'theoretical_background',
        },
      ],
    },
    {
      id: 'plan',
      kind: 'planning',
      order: 3,
      title: 'תכנון פעילות ותחנות',
      description: 'תכנון הפעילות ובניית התחנות שיחברו בין המקום לתוכן.',
      studentInstruction:
        'תכננו פעילות קבוצתית ובנו תחנות עם מיקום, תצפית, מושג, הסבר ומשימה למשתתפים.',
      approval: {
        required: true,
        reviewer: 'teacher',
        lockNextStageUntilApproved: true,
      },
      requirements: [
        {
          id: 'group-activity',
          kind: 'long_text',
          label: 'הפעילות הקבוצתית',
          required: true,
          reportSection: 'planning',
        },
        {
          id: 'stations',
          kind: 'station_list',
          label: 'תחנות במסלול',
          required: true,
          count: { min: 2, max: 3 },
          reportSection: 'planning',
        },
      ],
    },
    {
      id: 'field',
      kind: 'field_tour',
      order: 4,
      title: 'סיור בשטח',
      description: 'ביצוע הפעילות, אימות התחנות ותיעוד ממצאים.',
      studentInstruction:
        'בכל תחנה ודאו שהמיקום וההנחיות עדיין מתאימים, בצעו את הפעילות ותעדו ממצא או תצפית.',
      approval: {
        required: false,
        reviewer: 'teacher',
        lockNextStageUntilApproved: false,
      },
      fieldVerification: {
        enabled: true,
        requirePhysicalPresence: false,
        requireLocationVerification: true,
        requirePhotoEvidence: false,
        requireInstructionCheck: true,
        requireCorrectionNote: false,
      },
      requirements: [
        {
          id: 'field-findings',
          kind: 'long_text',
          label: 'ממצאים ותצפיות מהשטח',
          required: true,
          reportSection: 'field_findings',
        },
        {
          id: 'field-media',
          kind: 'media',
          label: 'תיעוד מהשטח',
          required: false,
          mediaTypes: ['photo', 'video', 'audio'],
          reportSection: 'appendix',
        },
      ],
    },
    {
      id: 'report',
      kind: 'analysis',
      order: 5,
      title: 'ניתוח, רפלקציה ודוח',
      description: 'חיבור בין התיאוריה לממצאים, רפלקציה אישית ויצירת טיוטת דוח.',
      studentInstruction:
        'נתחו את מה שראיתם בשטח בעזרת המושגים שלמדתם, השלימו רפלקציה אישית ובדקו את טיוטת הדוח שנבנתה מהעבודה שכבר עשיתם.',
      approval: {
        required: true,
        reviewer: 'teacher',
        lockNextStageUntilApproved: true,
      },
      requirements: [
        {
          id: 'analysis',
          kind: 'long_text',
          label: 'ניתוח תיאוריה מול שטח',
          required: true,
          reportSection: 'analysis',
        },
        {
          id: 'individual-reflection',
          kind: 'reflection',
          label: 'רפלקציה אישית',
          required: true,
          individual: true,
          reportSection: 'reflection',
        },
      ],
    },
    {
      id: 'present',
      kind: 'presentation',
      order: 6,
      title: 'הצגה ופרסום',
      description: 'הצגת התוצר, אישור סופי ופרסום המסלול.',
      studentInstruction:
        'הציגו את המסלול והממצאים, קשרו אותם לתיאוריה וענו על שאלות. לאחר אישור המורה המסלול יהיה מוכן לפרסום.',
      approval: {
        required: true,
        reviewer: 'teacher',
        lockNextStageUntilApproved: true,
      },
      requirements: [
        {
          id: 'presentation-ready',
          kind: 'checkbox',
          label: 'ההצגה הושלמה',
          required: true,
        },
      ],
    },
  ],
};

export const projectTemplates: ProjectTemplate[] = [
  socialSciencesEducationalTourTemplate,
];
