/* eslint-disable @next/next/no-img-element */
import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner = ({
  className = 'w-16 h-16',
}: LoadingSpinnerProps) => {
  return (
    <div className={`items-center justify-center w-full h-full`}>
      <img src="/loading.gif" className={className} alt="Loading..." />
    </div>
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
