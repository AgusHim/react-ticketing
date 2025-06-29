
import { useBookedSeats } from '@/context/BookedSeatsContext';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { FormBookedSeatDialog } from './dialog/form-booked-seat-dialog';
import { useState } from 'react';

interface BookedSeatsProps {
    rows: number;
    cols: number;
    seatSize?: number;
}

export const BookedSeats: React.FC<BookedSeatsProps> = ({
    rows,
    cols,
    seatSize = 50,
}) => {
    const {
        seats, authSelectedSeats,
        anotherAuthSelectedSeats, bookedSeats, toggleSeat,
        selectedCategory, setBookedSeat,
    } = useBookedSeats();
    const [openDialog, setOpenDialog] = useState(false);
    return (
        <div
            className="w-screen h-[80vh] overflow-auto relative"
        >
            <TransformWrapper
                minScale={0.1}
                initialScale={0.25}
                wheel={{ step: 0.05 }}
                doubleClick={{ disabled: true }}
            >
                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>

                    <div
                        style={{
                            width: cols * seatSize,
                            height: rows * seatSize,
                            position: "relative",
                        }}
                    >
                        {[...Array(rows)].flatMap((_, rowIndex) =>
                            [...Array(cols)].map((_, colIndex) => {
                                const index = rowIndex * cols + colIndex;
                                const key = `${rowIndex}-${colIndex}`;
                                const seatData = seats.find((s) => s.id === key);
                                const isSelectedSeat = Boolean(authSelectedSeats.find((s) => s.seat_id === key));
                                const isLocked = Boolean(anotherAuthSelectedSeats.find((s) => s.seat_id === key));
                                const isBooked = Boolean(bookedSeats.find((s) => s.seat_id === key));
                                if (seatData?.category != selectedCategory && selectedCategory != "all" && seatData?.category != "STAGE") {
                                    return (<div
                                        key={index}
                                        style={{
                                            position: "absolute",
                                            top: rowIndex * seatSize,
                                            left: colIndex * seatSize,
                                            width: seatSize - 2,
                                            height: seatSize - 2,
                                            backgroundColor: seatData ? "grey" : "white",
                                            border: "1px solid white",
                                            boxSizing: "border-box",
                                            fontSize: 10,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                        }}
                                    >
                                    </div>);
                                }
                                return (
                                    <div
                                        key={index}
                                        style={{
                                            position: "absolute",
                                            top: rowIndex * seatSize,
                                            left: colIndex * seatSize,
                                            width: seatSize - 2,
                                            height: seatSize - 2,
                                            backgroundColor: isBooked || isLocked ? "black" : isSelectedSeat ? 'orangered' : seatData ? seatData.color : "white",
                                            border: isSelectedSeat ? "3px solid black" : "1px solid white",
                                            boxSizing: "border-box",
                                            fontSize: 10,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                        }}
                                        onClick={seatData?.category == "STAGE" ? undefined : isBooked ? () => {
                                            const data = bookedSeats.find((s) => s.seat_id === key);
                                            if (data) {
                                                setBookedSeat(data);
                                                setOpenDialog(true);
                                            }
                                        } : seatData ? () => {
                                            toggleSeat(key, seatData);
                                        } : undefined}
                                    >
                                        {isBooked ? 'Booked' : isLocked ? 'Locked' : seatData?.name}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </TransformComponent>
            </TransformWrapper>
            <FormBookedSeatDialog isOpen={openDialog} onOpenChange={setOpenDialog} />
        </div>
    )
}

export default BookedSeats