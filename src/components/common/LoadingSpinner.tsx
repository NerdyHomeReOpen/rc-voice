import React from 'react';
import { Flex } from '@radix-ui/themes';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner = ({
  className = 'w-16 h-16',
}: LoadingSpinnerProps) => {
  return (
    <Flex className={`items-center justify-center w-full h-full`}>
      <img src="/loading.gif" className={className} alt="Loading..." />
    </Flex>
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
