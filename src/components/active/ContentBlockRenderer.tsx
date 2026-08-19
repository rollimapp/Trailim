import React from 'react';
import { ContentBlock } from '../../types';
import { HelpCircle, AlertTriangle, Lightbulb, Quote, BookOpen, Film, Image as ImageIcon, Music, MapPin, UserCheck } from 'lucide-react';

interface ContentBlockRendererProps {
  block: ContentBlock;
}

export const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ block }) => {
  switch (block.type) {
    case 'heading':
      return (
        <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-200 pb-1.5 mt-2">
          {block.content}
        </h3>
      );

    case 'text':
    case 'rich_text':
      return (
        <p className="text-xs text-slate-700 leading-relaxed">
          {block.content}
        </p>
      );

    case 'historical_source':
      return (
        <div className="bg-amber-50/80 border-l-4 border-amber-600 p-3.5 rounded-r-xl space-y-1 my-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-amber-900 tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            {block.title || 'Primary Historical Source'}
          </div>
          <p className="text-xs italic text-amber-950 leading-relaxed font-serif">
            "{block.content}"
          </p>
        </div>
      );

    case 'quote':
      return (
        <blockquote className="bg-slate-100/90 border-l-4 border-[#1B4332] p-3 rounded-r-xl italic text-xs text-slate-800 my-2">
          <Quote className="w-4 h-4 text-emerald-700 mb-1" />
          {block.content}
        </blockquote>
      );

    case 'tip':
      return (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2 text-xs text-emerald-900 my-2">
          <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-[11px] uppercase text-emerald-800">{block.title || 'Explorer Tip'}</span>
            <p className="text-[11px] text-emerald-950 mt-0.5">{block.content}</p>
          </div>
        </div>
      );

    case 'warning':
      return (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2 text-xs text-rose-900 my-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-[11px] uppercase text-rose-800">{block.title || 'Warning'}</span>
            <p className="text-[11px] text-rose-950 mt-0.5">{block.content}</p>
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="space-y-1 my-3">
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900">
            <img src={block.mediaUrl} alt={block.altText || 'Station media'} className="w-full h-48 sm:h-56 object-cover" />
          </div>
          {block.caption && (
            <p className="text-[10px] text-slate-500 italic text-center px-2">{block.caption}</p>
          )}
        </div>
      );

    case 'video':
    case 'embedded_video':
      return (
        <div className="space-y-1 my-3">
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-black">
            <video src={block.mediaUrl} controls className="w-full h-48 object-cover" />
          </div>
          {block.caption && (
            <p className="text-[10px] text-slate-500 italic text-center px-2">{block.caption}</p>
          )}
        </div>
      );

    case 'creator_credit':
      return (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2 my-2">
          <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <div>
            <span className="font-bold text-slate-800 block">{block.title || 'Creator Credit'}</span>
            <span>{block.content}</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-2 text-xs text-slate-700">
          {block.content}
        </div>
      );
  }
};
