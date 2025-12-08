import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Loader2, Calendar, ArrowLeft, Trash2, Maximize2, Download, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface GalleryProps {
  userId: string;
  onBack: () => void;
  onCreate: () => void;
}

interface SavedImage {
  id: string;
  created_at: string;
  image_url: string;
  caption: string;
}

export const Gallery: React.FC<GalleryProps> = ({ userId, onBack, onCreate }) => {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<SavedImage | null>(null);
  
  // State for custom delete confirmation modal
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (err: any) {
      console.error('Error fetching gallery:', err);
      setError('Failed to load your gallery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchImages();
    }
  }, [userId]);

  const onRequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageToDelete(id);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('saved_images')
        .delete()
        .eq('id', imageToDelete);

      if (error) throw error;
      
      // Optimistic update
      setImages(prev => prev.filter(img => img.id !== imageToDelete));
      
      // If we were previewing the image we just deleted, close the preview
      if (previewImage?.id === imageToDelete) {
        setPreviewImage(null);
      }
      
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image.');
    } finally {
      setIsDeleting(false);
      setImageToDelete(null);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12 w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Gallery</h2>
          <p className="text-gray-500">Your collection of saved storyboard moments.</p>
        </div>
        <Button variant="secondary" onClick={onBack} className="self-start md:self-auto">
          <ArrowLeft size={16} className="mr-2" /> Back to Editor
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-gray-900 mb-4" size={32} />
          <p className="text-gray-500">Loading your masterpiece archive...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-100">
          {error}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[32px] border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No images saved yet</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Generate a storyboard and click the save icon on any panel to add it here.
          </p>
          <Button onClick={onCreate}>Start Creating</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div 
              key={image.id} 
              className="group relative aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setPreviewImage(image)}
            >
              <img 
                src={image.image_url} 
                alt="Saved Scene" 
                className="w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                 
                 {/* Centered Buttons */}
                 <div className="absolute inset-0 flex items-center justify-center gap-3">
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDownload(image.image_url, `saved-${image.id}.png`); 
                        }}
                        className="bg-white text-gray-900 p-3 rounded-full shadow-xl hover:scale-110 transition-transform"
                        title="Download"
                    >
                        <Download size={20} />
                    </button>
                    <button 
                        onClick={(e) => onRequestDelete(image.id, e)}
                        className="bg-white text-red-600 p-3 rounded-full shadow-xl hover:scale-110 transition-transform hover:bg-red-50"
                        title="Delete"
                    >
                        <Trash2 size={20} />
                    </button>
                 </div>

                 {/* Top Right Maximize Icon (Visual hint) */}
                 <div className="absolute top-3 right-3 text-white/80 pointer-events-none">
                     <Maximize2 size={18} />
                 </div>
                 
                 {/* Bottom Info */}
                 <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none text-left">
                     <p className="text-white text-xs font-medium line-clamp-2 mb-1 drop-shadow-md">
                        {image.caption}
                     </p>
                     <div className="flex items-center text-white/80 text-[10px] gap-1 drop-shadow-md">
                        <Calendar size={10} /> {formatDate(image.created_at)}
                     </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Screen Modal */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
            <div 
                className="absolute inset-0 bg-gray-900/90 backdrop-blur-md transition-opacity"
                onClick={() => setPreviewImage(null)}
            ></div>

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar size={14} /> {formatDate(previewImage.created_at)}
                    </div>
                    <button 
                        onClick={() => setPreviewImage(null)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <span className="text-2xl leading-none block">&times;</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
                    <img 
                        src={previewImage.image_url} 
                        alt="Full View" 
                        className="max-w-full max-h-[70vh] object-contain shadow-lg rounded-md" 
                    />
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                    <p className="flex-1 text-gray-800 text-sm leading-relaxed">
                        {previewImage.caption}
                    </p>
                    <div className="flex gap-3">
                         <Button 
                             onClick={() => handleDownload(previewImage.image_url, `saved-image-${previewImage.id}.png`)}
                             variant="primary"
                         >
                             <Download size={16} className="mr-2" /> Download
                         </Button>
                         <Button 
                             onClick={(e) => onRequestDelete(previewImage.id, e)}
                             variant="secondary"
                             className="text-red-600 hover:bg-red-50 hover:border-red-100"
                         >
                             <Trash2 size={16} />
                         </Button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {imageToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setImageToDelete(null)}
            ></div>
            
            <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up border border-gray-100">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <AlertTriangle size={24} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Are you sure?</h3>
                <p className="text-gray-500 mb-6 text-center leading-relaxed">
                    The image will disappear after you click 'Delete' in this pop-up window. This action cannot be undone.
                </p>
                
                <div className="flex gap-3">
                    <Button 
                        variant="secondary" 
                        onClick={() => setImageToDelete(null)} 
                        className="flex-1"
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={confirmDelete} 
                        className="flex-1 bg-red-600 hover:bg-red-700 border-transparent text-white shadow-red-200"
                        isLoading={isDeleting}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};