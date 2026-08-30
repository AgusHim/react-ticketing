import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TicketSummary = Record<string, number>;

interface TicketSummaryTableProps {
  ticketSummary: TicketSummary;
}

export const TicketSummaryTable: React.FC<TicketSummaryTableProps> = ({ ticketSummary }) => {
  return (
    <Card className="m-4 w-auto lg:w-1/2">
      <CardHeader>
        <CardTitle>Ringkasan Tiket per Kategori</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Jumlah Tiket</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(ticketSummary)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <TableRow key={category}>
                  <TableCell className="capitalize">{category}</TableCell>
                  <TableCell className="text-right">{count}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
