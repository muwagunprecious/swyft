import TicketLoader from '@/components/TicketLoader';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center min-h-screen">
      <TicketLoader size={72} />
      <p className="mt-5 text-[13px] font-black tracking-[0.15em] text-[#f05537] uppercase animate-pulse">
        Loading...
      </p>
    </div>
  );
}
