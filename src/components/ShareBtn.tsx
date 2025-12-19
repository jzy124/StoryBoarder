import React, { useState } from 'react';
import { Share2, Check, Link as LinkIcon } from 'lucide-react';
import { Button } from './Button';

interface Props {
  id: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  size?: 'sm' | 'md';
}

export const ShareBtn: React.FC<Props> = ({ id, variant = 'secondary', className = '', size = 'md' }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Construct standalone URL
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/gallery/${id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <Button 
        variant={variant} 
        size={size}
        onClick={handleShare}
        className={`${copied ? 'bg-green-50 text-green-600 border-green-200' : ''} ${className}`}
        title="Copy Link to Clipboard"
    >
        {copied ? <Check size={16} className="mr-2" /> : <LinkIcon size={16} className="mr-2" />}
        {copied ? 'Copied Link' : 'Share Link'}
    </Button>
  );
};