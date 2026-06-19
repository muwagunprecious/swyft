export type TicketTier = {
  name: string;
  price: number;
  quantity: number;
  sold: number;
};

export type SwyftEvent = {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  date: string;
  time: string;
  location: string;
  university: string;
  faculty: string;
  category: string;
  organizer: string;
  priceLabel: string;
  attendees: number;
  trending?: boolean;
  tickets: TicketTier[];
};

export type Campaign = {
  id: string;
  title: string;
  university: string;
  ends: string;
  votes: number;
  image: string;
  category: string;
  candidates: { name: string; department: string; votes: number; image: string }[];
};

export type Fundraiser = {
  id: string;
  title: string;
  university: string;
  goal: number;
  raised: number;
  image: string;
  backers: number;
  tag: string;
};

export const universities = [
  "OOU",
  "UNILAG",
  "UI",
  "LASU",
  "FUNAAB",
  "OAU",
  "FUTA",
  "UNIBEN",
  "ABU",
  "UNN",
  "Others",
];

export const filters = [
  "All",
  "Tech",
  "Entertainment",
  "Workshop",
  "Hackathon",
  "Dinner",
  "Election",
  "Religious",
  "Sports",
  "Conference",
  "Free",
  "Paid",
  "Today",
  "This Week",
  "Trending",
];

export const events: SwyftEvent[] = [
  {
    id: "tech-summit-oou",
    title: "OOU Campus Tech Summit 2026",
    description:
      "A full-day gathering for builders, designers, founders, and student operators learning how to ship useful products from campus.",
    bannerImage:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80",
    date: "2026-07-04",
    time: "10:00 AM",
    location: "ICT Centre, Ago-Iwoye",
    university: "OOU",
    faculty: "Science",
    category: "Tech",
    organizer: "OOU Developers Circle",
    priceLabel: "From NGN 2,500",
    attendees: 842,
    trending: true,
    tickets: [
      { name: "Student", price: 2500, quantity: 900, sold: 612 },
      { name: "VIP", price: 7500, quantity: 120, sold: 82 },
    ],
  },
  {
    id: "faculty-dinner",
    title: "Faculty of Arts Dinner and Awards",
    description:
      "A polished dinner night with live music, awards, red carpet photos, and faculty alumni guests.",
    bannerImage:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=80",
    date: "2026-07-12",
    time: "6:00 PM",
    location: "Blue Roof Hall, Lagos",
    university: "UNILAG",
    faculty: "Arts",
    category: "Dinner",
    organizer: "Faculty of Arts Association",
    priceLabel: "From NGN 8,000",
    attendees: 420,
    trending: true,
    tickets: [
      { name: "Regular", price: 8000, quantity: 500, sold: 284 },
      { name: "Table", price: 65000, quantity: 30, sold: 18 },
    ],
  },
  {
    id: "founders-workshop",
    title: "Student Founders Workshop",
    description:
      "A practical workshop on idea validation, pricing, payments, and launching your first campus business.",
    bannerImage:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80",
    date: "2026-07-18",
    time: "11:30 AM",
    location: "Innovation Hub, Ibadan",
    university: "UI",
    faculty: "Business",
    category: "Workshop",
    organizer: "Campus Builders Network",
    priceLabel: "Free",
    attendees: 275,
    tickets: [{ name: "Free Pass", price: 0, quantity: 400, sold: 275 }],
  },
  {
    id: "lasu-sports-fest",
    title: "LASU Inter-Department Sports Festival",
    description:
      "Football, basketball, athletics, table tennis, and faculty fan zones across a three-day sports festival.",
    bannerImage:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1400&q=80",
    date: "2026-08-02",
    time: "8:00 AM",
    location: "LASU Sports Complex",
    university: "LASU",
    faculty: "All Faculties",
    category: "Sports",
    organizer: "LASU Sports Council",
    priceLabel: "From NGN 1,000",
    attendees: 1300,
    tickets: [{ name: "Access Band", price: 1000, quantity: 2000, sold: 912 }],
  },
  {
    id: "worship-night",
    title: "Campus Worship Night",
    description:
      "A faith gathering with choirs, spoken word, short teachings, and donation support for outreach projects.",
    bannerImage:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1400&q=80",
    date: "2026-08-09",
    time: "5:00 PM",
    location: "Amphitheatre, OAU",
    university: "OAU",
    faculty: "All Faculties",
    category: "Religious",
    organizer: "OAU Joint Fellowship",
    priceLabel: "Free",
    attendees: 960,
    tickets: [{ name: "Free Seat", price: 0, quantity: 1500, sold: 960 }],
  },
  {
    id: "hack-the-campus",
    title: "Hack The Campus 48-Hour Hackathon",
    description:
      "Teams build tools for hostel life, course registration, voting, payments, and student safety.",
    bannerImage:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80",
    date: "2026-08-21",
    time: "9:00 AM",
    location: "FUTA Computer Lab",
    university: "FUTA",
    faculty: "Technology",
    category: "Hackathon",
    organizer: "FUTA Tech Collective",
    priceLabel: "From NGN 3,000",
    attendees: 510,
    trending: true,
    tickets: [{ name: "Team Slot", price: 3000, quantity: 180, sold: 129 }],
  },
];

export const votingCampaigns: Campaign[] = [
  {
    id: "miss-faculty",
    title: "Miss Faculty of Science",
    university: "OOU",
    ends: "2 days left",
    votes: 18420,
    category: "Pageant",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
    candidates: [
      { name: "Teniola Adeyemi", department: "Microbiology", votes: 6420, image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80" },
      { name: "Ruth Eze", department: "Computer Science", votes: 5980, image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=500&q=80" },
      { name: "Mariam Bello", department: "Chemistry", votes: 4020, image: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&w=500&q=80" },
    ],
  },
  {
    id: "sug-2026",
    title: "SUG Executive Election 2026",
    university: "UNILAG",
    ends: "6 hours left",
    votes: 42110,
    category: "Election",
    image:
      "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?auto=format&fit=crop&w=1200&q=80",
    candidates: [
      { name: "Daniel Okafor", department: "Law", votes: 15200, image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80" },
      { name: "Amaka Nwosu", department: "Mass Communication", votes: 14910, image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80" },
      { name: "Ibrahim Musa", department: "Engineering", votes: 12000, image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80" },
    ],
  },
  {
    id: "talent-show",
    title: "Campus Talent Choice Awards",
    university: "FUNAAB",
    ends: "8 days left",
    votes: 9320,
    category: "Talent",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
    candidates: [
      { name: "The Vibe Crew", department: "Dance", votes: 3780, image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=500&q=80" },
      { name: "Kenny Keys", department: "Music", votes: 3120, image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=500&q=80" },
      { name: "Simi Writes", department: "Poetry", votes: 2420, image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80" },
    ],
  },
];

export const fundraisers: Fundraiser[] = [
  {
    id: "library-renewal",
    title: "Renew the Faculty Library",
    university: "UI",
    goal: 3500000,
    raised: 2410000,
    backers: 386,
    tag: "Education",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "medical-aid",
    title: "Emergency Medical Aid for Students",
    university: "OOU",
    goal: 2000000,
    raised: 1385000,
    backers: 512,
    tag: "Health",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "hack-lab",
    title: "Student Innovation Lab Equipment",
    university: "FUTA",
    goal: 5000000,
    raised: 3210000,
    backers: 204,
    tag: "Technology",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
  },
];

export const formatNaira = (amount: number) =>
  `NGN ${amount.toLocaleString("en-NG")}`;

export const getEvent = (id: string) => events.find((event) => event.id === id) ?? events[0];
