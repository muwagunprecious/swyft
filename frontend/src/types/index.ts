export interface Ticket {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  date: string;
  location: string;
  category: string;
  organizer: {
    name: string;
  };
  tickets: Ticket[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ORGANIZER' | 'ADMIN';
}
