import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, LayoutGrid, ChevronDown, MessageSquare, CreditCard, Sparkles } from 'lucide-react';
import { createCheckoutSession } from '../services/paymentService';

interface UserMenuProps {
  email: string;
  points: number | null;
  onLogout: () => void;
  onOpenGallery: () => void;
}

// vvvvvvvvvvvv  唯一的修改在这里 vvvvvvvvvvvv
export const UserMenu: React.FC<UserMenuProps> = ({ email, points, onLogout, onOpenGallery }) => {
// ^^^^^^^^^^^^  唯一的修改在这里 ^^^^^^^^^^^^
  const [isOpen, setIsOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handlePurchase = async () => {
      setIsRedirecting(true);
      try {
          const { url } = await createCheckoutSession();
          window.location.href = url;
      } catch (error) {
          alert('创建支付链接失败，请稍后重试。');
          setIsRedirecting(false);
      }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
      >
        <div className="w-8 h-8 bg-gradient-to-tr from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold">
          {email.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block max-w-[150px] truncate">{email}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in-up origin-top-right">
          <div className="px-4 py-2 border-b border-gray-50 mb-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Account</p>
            <p className="text-sm text-gray-900 truncate font-medium">{email}</p>
          </div>
          
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenGallery();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <LayoutGrid size={16} className="text-gray-500" />
            My Gallery
          </button>
          
          <a
            href="mailto:storyboarder.feedback@gmail.com?subject=StoryBoard AI Feedback (V1.1)"
            onClick={() => setIsOpen(false)}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <MessageSquare size={16} className="text-gray-500" />
            Feedback
          </a>

          <div className="px-4 py-3 border-t border-b border-gray-50">
            <p className="text-xs text-gray-400">Credits</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-gray-900 flex items-center gap-1">
                <Sparkles size={16} className="text-blue-500" />
                {points !== null ? `${points} points remaining` : 'Loading...'}
              </p>
              <button onClick={handlePurchase} disabled={isRedirecting} className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50">
                {isRedirecting ? 'Redirecting...' : 'Buy Credits'}
              </button>
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};