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
  originalPrice?: string;
  isVotingEnabled?: boolean;
}

export function formatEventDate(dateString: string) {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const month = d.toLocaleDateString("en-US", { month: "short" });
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
  originalPrice,
  isVotingEnabled = false,
}: EventCardProps) {
  const formattedDate = formatEventDate(date);

  return (
    <Link href={`/events/${id}`} className="group block h-full no-underline">
      <article className="grix-card h-full flex flex-col justify-between overflow-hidden transition-all duration-200">
        
        {/* Dominant Poster Artwork */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[8px] bg-[#171717] mb-4">
          <img
            src={bannerImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {category && (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-[#0a0a0a]/90 border border-[#374151] px-2.5 py-0.5 text-[11px] font-medium text-[#fafafa] tracking-wide">
              {category}
            </span>
          )}
          {isVotingEnabled && (
            <span className="absolute top-2.5 right-2.5 rounded-full bg-[#fafafa] text-[#171717] px-2.5 py-0.5 text-[11px] font-medium">
              Voting Active
            </span>
          )}
          {originalPrice && (
            <span className="absolute bottom-2.5 left-2.5 rounded-full bg-emerald-950/90 border border-emerald-700/80 text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
              Discount
            </span>
          )}
        </div>

        {/* Card Metadata & Title */}
        <div className="flex flex-col flex-1 justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[#9ca3af] mb-1">
              {formattedDate}
            </p>

            <h3 className="text-[18px] font-medium leading-[24px] text-[#fafafa] line-clamp-2 mb-1 group-hover:text-white transition-colors">
              {title}
            </h3>

            <p className="text-[14px] font-normal text-[#9ca3af] line-clamp-1">
              {location} {university ? `• ${university}` : ""}
            </p>
          </div>

          <div className="pt-3 border-t border-[#374151] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {originalPrice && (
                <span className="text-[12px] text-gray-500 line-through">
                  {originalPrice}
                </span>
              )}
              <span className={`text-[14px] font-medium ${originalPrice ? 'text-emerald-400 font-bold' : 'text-[#fafafa]'}`}>
                {priceLabel}
              </span>
            </div>
            <span className="text-[13px] font-medium text-[#fafafa] group-hover:underline">
              Tickets &rarr;
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
