import Link from "next/link";

type BaseEventShape = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  bannerImage: string;
  organizer?: { name: string } | string;
  time?: string;
  university?: string;
  faculty?: string;
  priceLabel?: string;
  attendees?: number;
  tickets?: { price: number; quantity: number; sold: number }[];
  Ticket?: { price: number; quantity: number; sold: number }[];
};

type EventCardProps = BaseEventShape & {
  compact?: boolean;
};

export default function EventCard({
  id,
  title,
  date,
  time,
  location,
  university,
  category,
  bannerImage,
  priceLabel,
  attendees,
  compact,
}: EventCardProps) {
  const displayUniversity = university ?? "Campus";
  const displayTime = time ?? new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const displayPrice = priceLabel ?? "Get Tickets";
  const displayAttendees = attendees ?? 0;
  const day = new Date(date).toLocaleDateString("en-US", { day: "2-digit" });
  const month = new Date(date).toLocaleDateString("en-US", { month: "short" });

  return (
    <Link href={`/events/${id}`} className="group block h-full no-underline">
      <article className="card h-full overflow-hidden transition duration-200 group-hover:-translate-y-1 group-hover:shadow-xl">
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          <img
            src={bannerImage}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 rounded-lg bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-[0.68rem] font-black uppercase text-[#FF6B00]">{month}</p>
            <p className="text-lg font-black leading-none text-gray-950">{day}</p>
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-white backdrop-blur">
            {category}
          </span>
        </div>

        <div className={compact ? "p-4" : "p-5"}>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-gray-500">
            <span>{displayUniversity}</span>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span>{displayTime}</span>
          </div>
          <h3 className="line-clamp-2 text-lg font-black leading-snug text-gray-950">
            {title}
          </h3>
          <p className="mt-2 line-clamp-1 text-sm font-semibold text-gray-500">
            {location}
          </p>
          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm font-black text-gray-950">{displayPrice}</span>
            <span className="text-xs font-black text-[#1565FF]">{displayAttendees.toLocaleString()} going</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
