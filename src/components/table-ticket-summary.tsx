import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TicketSummary = Record<string, Record<string, number>>;

interface TicketSummaryTableProps {
  ticketSummary: TicketSummary;
}

export const TicketSummaryTable: React.FC<TicketSummaryTableProps> = ({ ticketSummary }) => {
  return (
    <Card className="m-4 w-auto lg:w-1/2">
      <CardHeader>
        <CardTitle>Ringkasan Tiket</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Show ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Total Tickets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(ticketSummary).map(([showId, categories]) =>
              Object.entries(categories).map(([category, count]) => (
                <TableRow key={`${showId}-${category}`}>
                  <TableCell>{showId}</TableCell>
                  <TableCell>{category}</TableCell>
                  <TableCell className="text-right">{count}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
