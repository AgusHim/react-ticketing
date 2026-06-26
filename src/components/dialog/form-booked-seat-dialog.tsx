import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useBookedSeats } from "@/context/BookedSeatsContext";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface FormBookedSeatDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FormBookedSeatDialog({ isOpen, onOpenChange }: FormBookedSeatDialogProps) {
    const { user } = useAuth();
    const { bookedSeat, removeBookedSeat } = useBookedSeats();

    const handleDelete = async () => {
        if (user?.id !== bookedSeat?.admin_id) {
            toast.error("Anda bukan admin yang membuat bookingan seat");
            return;
        }
        removeBookedSeat(bookedSeat?.id ?? '');
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form>
                    <DialogHeader>
                        <DialogTitle>Booked Seat</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col mt-4 gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="id">Seat Number</Label>
                            <Input id="id" name="id" value={bookedSeat?.seat?.name} readOnly />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="ticket_id">Ticket Darisini</Label>
                            <Input id="ticket_id" name="ticket_id" value={bookedSeat?.ticket?.ticket_id ?? '-'} readOnly />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="show_id">Show</Label>
                            <Input id="show_id" name="show_id" value={bookedSeat?.event_id ?? ''} readOnly />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" value={bookedSeat?.name} readOnly />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="admin">Admin</Label>
                            <Input id="admin" name="admin" value={bookedSeat?.admin_id} readOnly />
                        </div>
                        {bookedSeat?.created_at === undefined ? <></> : <div className="grid gap-3">
                            <Label htmlFor="created_at">Tgl Booking</Label>
                            <Input id="created_at" name="created_at" value={formatDate(bookedSeat!.created_at!)} readOnly />
                        </div>}
                    </div>
                    {user?.id === bookedSeat?.admin_id ? (<DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        </DialogClose>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Anda yakin ingin menghapus data ini?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Akan menghapus {bookedSeat?.name} dengan ID Tiket {bookedSeat?.ticket_id}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DialogFooter>) : <></>}
                </form>
            </DialogContent>
        </Dialog >
    )
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
}
