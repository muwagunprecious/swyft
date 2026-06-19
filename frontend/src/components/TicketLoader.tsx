export default function TicketLoader({ size = 48, className = '' }: { size?: number, className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Spinning Outer Gradient Ring */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3.5px solid rgba(240, 85, 55, 0.06)',
            borderTopColor: '#f05537',
            borderRightColor: '#ff8a65',
            animation: 'spin 1s linear infinite',
            boxShadow: '0 0 16px rgba(240, 85, 55, 0.12)'
          }}
        />

        {/* Pulsing Inner Glowing Backdrop */}
        <div 
          style={{
            position: 'absolute',
            inset: '8px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240,85,55,0.1) 0%, transparent 70%)',
            animation: 'pulseGlow 1.5s ease-in-out infinite'
          }}
        />

        {/* Bouncing/Scaling Swyft Logo Chevron */}
        <div 
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'bounceLogo 1.5s ease-in-out infinite'
          }}
        >
          <svg 
            width={size * 0.42} 
            height={size * 0.42} 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-[#f05537] drop-shadow-[0_0_8px_rgba(240,85,55,0.35)]"
          >
            <path
              d="M4 4.7c0-.8.9-1.3 1.6-.9l13 7.5c.7.4.7 1.4 0 1.8l-13 7.5c-.7.4-1.6-.1-1.6-.9v-5.1l5.4-2.4L4 9.8V4.7Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes bounceLogo {
          0%, 100% { transform: scale(0.95); }
          50% { transform: scale(1.08); }
        }
      `}} />
    </div>
  );
}
