import Link from "next/link";

export interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  bannerImage: string;
  university?: string;
  priceLabel?: string;
  isVotingEnabled?: boolean;
}

export function formatEventDate(dateString: string) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const day = d.getDate();

    let hours = d.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = d.getMinutes();
    const timeStr = minutes > 0 ? `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}` : `${hours}:00 ${ampm}`;

    return `${weekday}, ${month} ${day} • ${timeStr}`;
  } catch {
    return dateString;
  }
}

export default function EventCard({
  id,
  title,
  date,
  location,
  category,
  bannerImage,
  university,
  priceLabel = "Get Tickets",
  isVotingEnabled = false,
}: EventCardProps) {
  const formattedDate = formatEventDate(date);

  return (
    <Link href={`/events/${id}`} className="group block h-full no-underline">
      <article className="eb-card h-full flex flex-col justify-between">
        
        {/* Dominant Event Poster */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#f8f7fa]">
          <img
            src={bannerImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {category && (
            <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#39364f] shadow-sm">
              {category}
            </span>
          )}
          {isVotingEnabled && (
            <span className="absolute top-3 right-3 rounded-full bg-[#d1410c] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
              Voting Live
            </span>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div>
            {/* Date line in Eventbrite brand accent */}
            <p className="text-[13px] font-semibold text-[#d1410c] uppercase tracking-tight mb-1">
              {formattedDate}
            </p>

            {/* Event Title */}
            <h3 className="text-[16px] md:text-[18px] font-semibold leading-[22px] text-[#39364f] line-clamp-2 mb-1 group-hover:text-[#d1410c] transition-colors">
              {title}
            </h3>

            {/* Location & Campus */}
            <p className="text-[14px] font-medium text-[#6f7287] line-clamp-1">
              {location} {university ? `• ${university}` : ""}
            </p>
          </div>

          {/* Price & Call to Action Indicator */}
          <div className="pt-2 border-t border-[#e5e7eb] flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#39364f]">
              {priceLabel}
            </span>
            <span className="text-[12px] font-semibold text-[#d1410c] group-hover:underline">
              Tickets &rarr;
            </span>
          </div>
        </div>

      </article>
    </Link>
  );
}
