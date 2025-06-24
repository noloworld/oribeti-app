import React from 'react';

interface FeedbackProps {
  message: string;
  type?: 'success' | 'error';
}

export default function Feedback({ message, type = 'success' }: FeedbackProps) {
  if (!message) return null;
  return (
    <div className={`rounded p-2 text-center mb-2 ${type === 'success' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
      {message}
    </div>
  );
} 