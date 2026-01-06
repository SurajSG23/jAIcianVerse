const GlassLoader = ({ destination }: { destination: string }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Glass Background */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-md backdrop-saturate-150" />

      {/* Loader */}
      <div className="relative flex flex-col items-center justify-center gap-4">
        <div className="flex-col gap-4 w-full flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-transparent text-blue-400 text-4xl animate-spin flex items-center justify-center border-t-blue-400 rounded-full">
            <div className="w-16 h-16 border-4 border-transparent text-red-400 text-2xl animate-spin flex items-center justify-center border-t-red-400 rounded-full" />
          </div>
        </div>

        {/* Optional text */}
        <p className="text-white/80 text-sm tracking-wide">
          Loading {destination}...
        </p>
      </div>
    </div>
  );
};

export default GlassLoader;
