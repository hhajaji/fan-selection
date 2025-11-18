import React from 'react';

interface HeaderProps {
  showHomeButton?: boolean;
  onGoHome?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showHomeButton, onGoHome }) => {
  return (
    <header className="bg-white shadow-md no-print">
      <div className="container mx-auto px-4 py-4 md:px-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.485 2 2 6.485 2 12C2 17.515 6.485 22 12 22C17.515 22 22 17.515 22 12C22 6.485 17.515 2 12 2ZM11.999 20C7.588 20 4 16.412 4 12C4 7.588 7.588 4 12 4C16.412 4 20 7.588 20 12C20 16.411 16.411 20 11.999 20Z" />
            <path d="M12 17.5C9.514 17.5 7.5 15.486 7.5 13C7.5 12.861 7.516 12.723 7.545 12.588C8.145 13.518 9.222 14.204 10.5 14.441V16.5C10.5 16.776 10.724 17 11 17H13C13.276 17 13.5 16.776 13.5 16.5V14.441C14.778 14.204 15.855 13.518 16.455 12.588C16.484 12.723 16.5 12.861 16.5 13C16.5 15.486 14.486 17.5 12 17.5Z" />
            <path d="M12 11.5C10.621 11.5 9.5 10.379 9.5 9C9.5 7.621 10.621 6.5 12 6.5C13.379 6.5 14.5 7.621 14.5 9C14.5 10.379 13.379 11.5 12 11.5Z" />
          </svg>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">سیستم هوشمند انتخاب فن صنعتی</h1>
            <p className="text-sm text-slate-500">انتخاب، محاسبه و مانیتورینگ</p>
          </div>
        </div>
        {showHomeButton && (
            <button
                onClick={onGoHome}
                className="py-2 px-4 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors flex items-center gap-2 text-sm font-medium"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l4.293 4.293a1 1 0 001.414-1.414l-7-7z" transform="rotate(-90 10 10)" />
                </svg>
                <span>بازگشت به صفحه اصلی</span>
            </button>
        )}
      </div>
    </header>
  );
};

export default Header;
