interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner = ({ className = "w-16 h-16" }: LoadingSpinnerProps) => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <img src="/loading.gif" className={className} alt="Loading..." />
    </div>
  );
};

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;