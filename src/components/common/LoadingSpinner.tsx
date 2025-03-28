import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(
  ({ className }) => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <img src="/loading.gif" className={className} alt="Loading..." />
      </div>
    );
  },
);

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
