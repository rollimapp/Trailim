import React from 'react';
import { StationType, TriggerType } from '../../types';
import { 
  Info, Eye, CheckSquare, MessageSquareText, Film, Camera, 
  Volume2, QrCode, MapPin, Zap, Flag, FileText, X, Sparkles 
} from 'lucide-react';

interface StationTemplateModalProps {
  onSelectTemplate: (template: StationTemplate) => void;
  onClose: () => void;
}

export interface StationTemplate {
  id: string;
  name: string;
  stationType: StationType;
  icon: React.ElementType;
  description: string;
  defaultTitle: string;
  defaultInstructions: string;
  defaultTrigger: TriggerType;
  defaultBlocks: Array<{ type: string; content: string }>;
  defaultTasks: Array<{ type: string; prompt: string; points: number }>;
}

export const STATION_TEMPLATES: StationTemplate[] = [
  {
    id: 'info',
    name: 'Information Station',
    stationType: 'info',
    icon: Info,
    description: 'Provide context, historical background, or introductory reading.',
    defaultTitle: 'Historical Overview',
    defaultInstructions: 'Read the summary below and inspect your immediate surroundings.',
    defaultTrigger: 'always_available',
    defaultBlocks: [
      { type: 'heading', content: 'Key Historical Facts' },
      { type: 'text', content: 'Insert primary source details, historical quotes, or community context here.' }
    ],
    defaultTasks: []
  },
  {
    id: 'observation',
    name: 'Observation Challenge',
    stationType: 'observation',
    icon: Eye,
    description: 'Prompt participants to observe an architectural detail or physical landmark.',
    defaultTitle: 'Look Closer Challenge',
    defaultInstructions: 'Examine the physical structure directly in front of you.',
    defaultTrigger: 'previous_completed',
    defaultBlocks: [
      { type: 'heading', content: 'Architectural Details' },
      { type: 'text', content: 'Compare the stonework pattern with the archival photo above.' }
    ],
    defaultTasks: [
      { type: 'observation', prompt: 'What material or inscription do you notice on the foundation stone?', points: 20 }
    ]
  },
  {
    id: 'multiple_choice',
    name: 'Multiple-Choice Question',
    stationType: 'question',
    icon: CheckSquare,
    description: 'Test knowledge with instant feedback & explanations.',
    defaultTitle: 'Knowledge Check',
    defaultInstructions: 'Answer the question based on evidence at this location.',
    defaultTrigger: 'previous_completed',
    defaultBlocks: [
      { type: 'heading', content: 'Station Quiz' },
      { type: 'text', content: 'Read the plaque and choose the correct answer below.' }
    ],
    defaultTasks: [
      { type: 'multiple_choice', prompt: 'Why was this site significant during the early trade era?', points: 20 }
    ]
  },
  {
    id: 'reflection',
    name: 'Reflection & Discussion',
    stationType: 'reflection',
    icon: MessageSquareText,
    description: 'Encourage critical thinking and group discussion.',
    defaultTitle: 'Community Reflection',
    defaultInstructions: 'Reflect on how this location connects to modern community life.',
    defaultTrigger: 'previous_completed',
    defaultBlocks: [
      { type: 'heading', content: 'Voices & Perspectives' },
      { type: 'text', content: 'Consider how neighborhood changes have impacted local residents over time.' }
    ],
    defaultTasks: [
      { type: 'short_reflection', prompt: 'What is one lesson from this site that applies to our community today?', points: 15 }
    ]
  },
  {
    id: 'video_story',
    name: 'Video Story Station',
    stationType: 'media',
    icon: Film,
    description: 'Embed short interviews, archival video clips, or student presentations.',
    defaultTitle: 'Oral History Video Excerpt',
    defaultInstructions: 'Watch the 1-minute video clip before continuing.',
    defaultTrigger: 'previous_completed',
    defaultBlocks: [
      { type: 'heading', content: 'Watch Oral Interview' },
      { type: 'video', content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }
    ],
    defaultTasks: [
      { type: 'short_reflection', prompt: 'What key memory did the merchant describe in the video clip?', points: 15 }
    ]
  },
  {
    id: 'photo_evidence',
    name: 'Photo Evidence Mission',
    stationType: 'evidence',
    icon: Camera,
    description: 'Have participants submit a photo of a specific landmark or detail.',
    defaultTitle: 'Field Photography Mission',
    defaultInstructions: 'Locate the landmark detail and capture a clear photo.',
    defaultTrigger: 'previous_completed',
    defaultBlocks: [
      { type: 'heading', content: 'Capture Field Evidence' },
      { type: 'text', content: 'Find the original cast-iron or stone symbol outside the doorway.' }
    ],
    defaultTasks: [
      { type: 'photo_upload', prompt: 'Take a photo showing the historic symbol or maker mark.', points: 25 }
    ]
  },
  {
    id: 'qr_checkpoint',
    name: 'QR / Code Checkpoint',
    stationType: 'checkpoint',
    icon: QrCode,
    description: 'Requires scanning a QR code or entering a passcode on-site.',
    defaultTitle: 'On-Site QR Verification',
    defaultInstructions: 'Scan the station QR code or enter code "TRAIL4" to unlock.',
    defaultTrigger: 'qr_code',
    defaultBlocks: [
      { type: 'heading', content: 'On-Site Verification' },
      { type: 'text', content: 'Look for the Trailim QR badge posted near the entrance.' }
    ],
    defaultTasks: [
      { type: 'observation', prompt: 'Confirm arrival at station.', points: 10 }
    ]
  },
  {
    id: 'challenge',
    name: 'Timed Challenge Station',
    stationType: 'challenge',
    icon: Zap,
    description: 'Fast-paced quest for Challenge Mode with extra points.',
    defaultTitle: 'Speed Cipher Quest',
    defaultInstructions: 'Decode the secret symbol quickly to earn maximum points.',
    defaultTrigger: 'previous_completed',
    defaultBlocks: [
      { type: 'heading', content: 'Team Speed Challenge' },
      { type: 'text', content: 'Count the arches on the facade and multiply by 4.' }
    ],
    defaultTasks: [
      { type: 'multiple_choice', prompt: 'What is the correct cipher sum for this archway?', points: 30 }
    ]
  },
  {
    id: 'final',
    name: 'Route Conclusion',
    stationType: 'final',
    icon: Flag,
    description: 'Wrap up the route, award badges, and collect feedback.',
    defaultTitle: 'Route Conclusion & Reflection',
    defaultInstructions: 'Submit final reflections to earn your badge and view your results.',
    defaultTrigger: 'previous_completed',
    defaultBlocks: [
      { type: 'heading', content: 'Congratulations on Completing the Trail!' },
      { type: 'text', content: 'Review your findings and view your team score summary.' }
    ],
    defaultTasks: [
      { type: 'short_reflection', prompt: 'What was the most memorable stop on this route?', points: 15 }
    ]
  },
  {
    id: 'blank',
    name: 'Custom Blank Station',
    stationType: 'info',
    icon: FileText,
    description: 'Start from scratch with total freedom.',
    defaultTitle: 'New Station',
    defaultInstructions: 'Follow station instructions.',
    defaultTrigger: 'previous_completed',
    defaultBlocks: [],
    defaultTasks: []
  }
];

export const StationTemplateModal: React.FC<StationTemplateModalProps> = ({
  onSelectTemplate,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 space-y-4 border border-slate-200 shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-emerald-800 tracking-wider">Station Template Selector</span>
            <h3 className="font-display font-bold text-lg text-slate-900">Select Starting Template</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {STATION_TEMPLATES.map(tmpl => {
            const Icon = tmpl.icon;
            return (
              <button
                key={tmpl.id}
                onClick={() => onSelectTemplate(tmpl)}
                className="p-3 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-500 rounded-2xl text-left space-y-1.5 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#1B4332] flex items-center justify-center group-hover:bg-[#1B4332] group-hover:text-white transition-all shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-950">{tmpl.name}</h4>
                </div>
                <p className="text-[11px] text-slate-500 group-hover:text-slate-700 leading-snug">
                  {tmpl.description}
                </p>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
