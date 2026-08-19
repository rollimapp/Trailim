import React, { useState } from 'react';
import { Upload, Image, Video, Music, CheckCircle, Trash2, Sparkles, Camera, AlertCircle } from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext';

interface MediaUploaderProps {
  label?: string;
  acceptType?: 'image' | 'video' | 'audio' | 'any';
  valueUrl?: string;
  onChange: (url: string) => void;
  helperText?: string;
}

const PRESET_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800'
];

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  label = 'Upload Media Attachment',
  acceptType = 'image',
  valueUrl,
  onChange,
  helperText
}) => {
  const { cameraStatus, requestCameraPermission } = usePermissions();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleTakePhotoClick = () => {
    requestCameraPermission(
      'capture outdoor field evidence photo for station task',
      () => {
        selectPreset(PRESET_SAMPLE_PHOTOS[Math.floor(Math.random() * PRESET_SAMPLE_PHOTOS.length)]);
      },
      (fallbackOption) => {
        if (fallbackOption === 'uploaded_file' || fallbackOption === 'text_alternative') {
          // Fallback chosen
        }
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(20);

    // Simulate progressive upload
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          const mockUrl = URL.createObjectURL(file);
          onChange(mockUrl);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const selectPreset = (url: string) => {
    setUploading(true);
    setProgress(30);
    setTimeout(() => {
      setProgress(100);
      setUploading(false);
      onChange(url);
    }, 300);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>}

      {valueUrl ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-slate-900 group shadow-sm">
          {acceptType === 'video' ? (
            <video src={valueUrl} controls className="w-full h-44 object-cover" />
          ) : acceptType === 'audio' ? (
            <div className="p-4 bg-emerald-950 text-white flex items-center gap-3">
              <Music className="w-8 h-8 text-emerald-400 animate-pulse" />
              <audio src={valueUrl} controls className="w-full" />
            </div>
          ) : (
            <img src={valueUrl} alt="Uploaded media" className="w-full h-44 object-cover" />
          )}

          <div className="absolute top-2 right-2 flex gap-1.5 bg-black/60 backdrop-blur-xs p-1 rounded-lg">
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Attached
            </span>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1 text-rose-300 hover:text-white transition-colors"
              title="Remove media"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 bg-slate-50/70 text-center transition-all">
          {uploading ? (
            <div className="space-y-2 py-3">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-emerald-800">Processing media upload... {progress}%</p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden max-w-xs mx-auto">
                <div className="bg-emerald-600 h-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                {acceptType === 'video' ? (
                  <Video className="w-5 h-5" />
                ) : acceptType === 'audio' ? (
                  <Music className="w-5 h-5" />
                ) : (
                  <Image className="w-5 h-5" />
                )}
              </div>

              <p className="text-xs font-semibold text-slate-700 mb-1">
                Capture live evidence or upload {acceptType} file
              </p>
              <p className="text-[11px] text-slate-400 mb-3">JPG, PNG, MP4 supported</p>

              <div className="flex items-center justify-center gap-2 flex-wrap">
                {acceptType === 'image' && (
                  <button
                    type="button"
                    onClick={handleTakePhotoClick}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] cursor-pointer transition-colors shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Take Photo
                  </button>
                )}

                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-200 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  Choose File
                  <input
                    type="file"
                    accept={acceptType === 'video' ? 'video/*' : acceptType === 'audio' ? 'audio/*' : 'image/*'}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Quick Preset Selector for instant demo testing */}
              {acceptType !== 'audio' && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Quick Prototype Demo Presets:
                  </p>
                  <div className="flex gap-1.5 justify-center overflow-x-auto pb-1">
                    {PRESET_SAMPLE_PHOTOS.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectPreset(img)}
                        className="w-12 h-12 rounded-lg overflow-hidden border border-slate-300 hover:border-emerald-600 transition-all shrink-0 hover:scale-105"
                      >
                        <img src={img} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
    </div>
  );
};
