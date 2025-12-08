import React, { useState } from 'react';
import { Download, RotateCcw, Image as ImageIcon, Check, Loader2, Maximize2, RefreshCcw, ChevronLeft, Bookmark } from 'lucide-react';
import { Button } from './Button';
import { Scene } from '../types';
import { supabase } from '../services/supabase';

interface Props {
  scenes: Scene[];
  onRegenerate: (sceneId: string) => void;
  onRegenerateAll: () => void;
  onDownloadAll: () => void;
  onReset: () => void;
  onBack: () => void;
  userId?: string;
}

export const StepResult: React.FC<Props> = ({ 
  scenes, 
  onRegenerate, 
  onRegenerateAll,
  onDownloadAll,
  onReset, 
  onBack,
  userId 
}) => {
  const [savingStates, setSavingStates] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);

  const allFinished = scenes.every(s => !s.isLoading && !s.isGenerating);
  const isGenerating = scenes.some(s => s.isGenerating);

  const handleSaveImage = async (e: React.MouseEvent, scene: Scene) => {
    e.stopPropagation();
    if (!userId || !scene.imageUrl) return;

    setSavingStates(prev => ({ ...prev, [scene.id]: 'saving' }));

    try {
      // 1. Convert Base64 to Blob
      const res = await fetch(scene.imageUrl);
      const blob = await res.blob();

      // 2. Upload to Supabase Storage
      const filename = `${userId}/${Date.now()}-${scene.id}.png`;
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filename, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filename);

      // 4. Insert into Database
      const { error: dbError } = await supabase
        .from('saved_images')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          caption: scene.description
        });

      if (dbError) throw dbError;

      setSavingStates(prev => ({ ...prev, [scene.id]: 'saved' }));
      
      // Optional: Reset saved state after a few seconds
      setTimeout(() => {
        setSavingStates(prev => ({ ...prev, [scene.id]: 'saved' })); 
      }, 3000);

    } catch (err) {
      console.error('Save failed:', err);
      setSavingStates(prev => ({ ...prev, [scene.id]: 'error' }));
      setTimeout(() => {
        setSavingStates(prev => ({ ...prev, [scene.id]: 'idle' }));
      }, 3000);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeScene = scenes.find(s => s.id === previewId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in w-full pb-20">
      
      {/* Header / Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex items-center gap-4">
             <Button 
                variant="secondary" 
                className="w-12 h-12 !px-0 rounded-full flex-shrink-0" 
                onClick={onBack}
             >
                 <ChevronLeft size={24} />
             </Button>
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Your Storyboard</h2>
                <p className="text-gray-500">
                    {isGenerating ? 'AI is painting your scenes...' : `${scenes.length} panels generated.`}
                </p>
            </div>
         </div>
         
         <div className="flex flex-wrap gap-3 w-full md:w-auto">
             {!isGenerating && (
               <>
                 <Button variant="secondary" onClick={onRegenerateAll} className="flex-1 md:flex-initial">
                   <RefreshCcw size={16} className="mr-2" /> Regenerate All
                 </Button>
                 <Button variant="primary" onClick={onDownloadAll} className="flex-1 md:flex-initial">
                   <Download size={16} className="mr-2" /> Download All
                 </Button>
               </>
             )}
             <Button variant="ghost" onClick={onReset} className="flex-1 md:flex-initial text-red-500 hover:text-red-600 hover:bg-red-50">
               Start Over
             </Button>
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {scenes.map((scene, index) => {
          const saveState = savingStates[scene.id] || 'idle';
          
          return (
            <div key={scene.id} className="flex flex-col gap-4 group">
                <div className="relative aspect-square bg-gray-100 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-all">
                    
                    {/* Main Image */}
                    {scene.isLoading || scene.isGenerating ? (
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-3 text-gray-900" />
                            <span className="text-sm font-medium">Generating...</span>
                        </div>
                    ) : scene.imageUrl ? (
                        <>
                            <img 
                                src={scene.imageUrl} 
                                alt={`Panel ${index + 1}`} 
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Hover Controls */}
                            <div 
                              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-10 flex items-center justify-center gap-4"
                              onClick={() => setPreviewId(scene.id)}
                            >
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRegenerate(scene.id); }}
                                    className="bg-white text-gray-900 p-3 rounded-full shadow-xl hover:scale-110 transition-transform"
                                    title="Regenerate"
                                >
                                    <RefreshCcw size={20} />
                                </button>
                                
                                {/* Save Button Moved Here */}
                                <button
                                  onClick={(e) => handleSaveImage(e, scene)}
                                  disabled={saveState === 'saving' || saveState === 'saved'}
                                  className={`
                                    p-3 rounded-full shadow-xl hover:scale-110 transition-transform flex items-center justify-center
                                    ${saveState === 'saved' ? 'bg-green-500 text-white' : 'bg-white text-gray-900'}
                                  `}
                                  title="Save to Gallery"
                                >
                                  {saveState === 'saving' ? <Loader2 size={20} className="animate-spin" /> : 
                                   saveState === 'saved' ? <Check size={20} /> : 
                                   <Bookmark size={20} />}
                                </button>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); downloadImage(scene.imageUrl!, `panel-${index+1}.png`); }}
                                    className="bg-white text-gray-900 p-3 rounded-full shadow-xl hover:scale-110 transition-transform"
                                    title="Download"
                                >
                                    <Download size={20} />
                                </button>

                                <div className="absolute top-4 left-4 text-white/80 pointer-events-none">
                                  <Maximize2 size={20} />
                                </div>
                            </div>
                        </>
                    ) : scene.error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-4 text-center">
                            <span className="text-2xl mb-2">⚠️</span>
                            <span className="text-xs">{scene.error}</span>
                            <button onClick={() => onRegenerate(scene.id)} className="mt-2 text-xs underline font-semibold">Try Again</button>
                        </div>
                    ) : (
                         <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                            <ImageIcon size={32} />
                        </div>
                    )}
                    
                    {/* Panel Number Badge */}
                    <div className="absolute bottom-4 left-4 w-8 h-8 bg-white/90 backdrop-blur text-gray-900 rounded-full flex items-center justify-center text-sm font-bold shadow-sm pointer-events-none">
                        {index + 1}
                    </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3 px-2 leading-relaxed">
                    {scene.description}
                </p>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewId && activeScene && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
            <div 
                className="absolute inset-0 bg-gray-900/80 backdrop-blur-md transition-opacity"
                onClick={() => setPreviewId(null)}
            ></div>

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
                <div className="absolute top-4 right-4 z-20">
                  <button 
                      className="w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                      onClick={() => setPreviewId(null)}
                  >
                      <span className="text-2xl leading-none">&times;</span>
                  </button>
                </div>
                
                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
                    {activeScene.imageUrl && (
                        <img 
                            src={activeScene.imageUrl} 
                            alt="Preview" 
                            className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                        />
                    )}
                </div>
                
                <div className="p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-gray-700 text-sm flex-1">{activeScene.description}</p>
                    <div className="flex gap-3">
                         <Button 
                            variant="secondary" 
                            onClick={() => onRegenerate(activeScene.id)}
                         >
                            <RefreshCcw size={16} className="mr-2" /> Regenerate
                         </Button>
                         <Button 
                             variant="primary"
                             onClick={(e) => handleSaveImage(e, activeScene)}
                             disabled={savingStates[activeScene.id] === 'saved'}
                         >
                             {savingStates[activeScene.id] === 'saved' ? <Check size={16} className="mr-2"/> : <Bookmark size={16} className="mr-2" />}
                             {savingStates[activeScene.id] === 'saved' ? 'Saved' : 'Save to Gallery'}
                         </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};