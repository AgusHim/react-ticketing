export interface SeatCategorySummary {
  total_seats: number;
  booked_seats: number;
  color: string;
}

export type ShowSeatSummary = {
  [category: string]: SeatCategorySummary;
};

export interface GoodieBagGroupSummary {
  total: number;
  claimed: number;
  unclaimed: number;
}

export interface GoodieBagSummary {
  total: number;
  claimed: number;
  unclaimed: number;
  by_category: {
    [category: string]: GoodieBagGroupSummary;
  };
}

export interface BookedSeatsSummary {
  booked_seats: {
    [showId: string]: ShowSeatSummary;
  };
   ticket_summary: TicketSummary;
   goodie_bag: GoodieBagSummary;
}

type TicketSummary = Record<string, Record<string, number>>;