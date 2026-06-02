export interface Trip {
  id: number;
  code: string;
  destination: string;
  capacity: number;
  default_price: number;
  start_date: string;
  end_date: string;
  image?: string;
  booked_seats?: number;
  remaining_seats?: number;
  reservations_revenue?: number;
  trip_expenses?: number;
  net_profit?: number;
  deleted: boolean;
}

export interface Client {
  id: number;
  ref: string;
  full_name: string;
  phone?: string;
  email?: string;
  document_number?: string;
  document_expiry?: string;
  deleted: boolean;
}

export interface Reservation {
  id: number;
  reservation_code: string;
  client_id: number;
  trip_id: number;
  seats: number;
  hotel?: string;
  room_type?: string;
  program?: string;
  profit?: number;
  airline?: string;
  agreed_price: number;
  source?: string;
  status: 'En attente' | 'Confirmée' | 'Annulée-Restituée' | 'Annulée-Non-Restituée';
  notes?: string;
  paid?: number;
  remain?: number;
  client?: Client;
  trip_code?: string;
  trip_name?: string;
  deleted: boolean;
}

export interface Expense {
  id: number;
  date: string;
  type: 'Fixe' | 'Variable';
  description: string;
  amount: number;
  trip_id?: number | null;
  trip_code?: string;
  deleted: boolean;
}

export interface CashJournal {
  id: number;
  date: string;
  receipt_ref: string;
  entity: string;
  type: 'Encaissement' | 'Décaissement';
  amount: number;
  payment_method: string;
  currency: string;
  entity_type?: string;
  entity_id?: string;
  solde_cumule?: number;
}
