"use client";



export const CinematicBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background transition-colors duration-500">
      {/* High-Performance Gradient Glows (No Blur Filters) */}
      <div className="absolute inset-0 overflow-hidden opacity-30 dark:opacity-20 pointer-events-none">
        <div 
          className="absolute -top-[20%] -left-[10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(44,53,175,0.3)_0%,transparent_70%)]" 
        />
        <div 
          className="absolute -bottom-[20%] -right-[10%] h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle,rgba(79,95,255,0.1)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(79,95,255,0.2)_0%,transparent_70%)]" 
        />
      </div>

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03]" 
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Static Grain Texture (Performance friendly) */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
    </div>
  );
};
