import { useBookedSeats } from "@/context/BookedSeatsContext";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { FormBookedSeatDialog } from "./dialog/form-booked-seat-dialog";
import { useState } from "react";
import { useSidebar } from "./ui/sidebar";

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
    seats,
    authSelectedSeats,
    anotherAuthSelectedSeats,
    bookedSeats,
    toggleSeat,
    selectedCategory,
    setBookedSeat,
    selectedShow,
  } = useBookedSeats();
  const [openDialog, setOpenDialog] = useState(false);
  const { open } = useSidebar();
  return (
    <div
      className={`${
        open ? "w-[83vw]" : "w-[99vw]"
      } h-[80vh] relative overflow-hidden`}
    >
      <TransformWrapper
        minScale={0.1}
        initialScale={0.25}
        wheel={{ step: 0.05 }}
        doubleClick={{ disabled: true }}
        limitToBounds={true}
        centerOnInit={true}
      >
        <TransformComponent
          wrapperStyle={{ width: "100vw", height: "80vh", overflow: "hidden" }}
        >
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
                const id = `${selectedShow}-${rowIndex}-${colIndex}`;
                const seatData = seats.find((s) => s.position === key);
                const isSelectedSeat = seatData
                  ? Boolean(
                      authSelectedSeats.find((s) => s.seat_id === seatData!.id)
                    )
                  : false;
                const isLocked = seatData
                  ? Boolean(
                      anotherAuthSelectedSeats.find(
                        (s) => s.seat_id === seatData!.id
                      )
                    )
                  : false;
                const isBooked = seatData
                  ? Boolean(bookedSeats.find((s) => s.seat_id === seatData!.id))
                  : false;
                if (
                  seatData?.category != selectedCategory &&
                  selectedCategory != "all" &&
                  seatData?.category != "STAGE"
                ) {
                  return (
                    <div
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
                    ></div>
                  );
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
                      backgroundColor:
                        isBooked || isLocked
                          ? "black"
                          : isSelectedSeat
                          ? "#758694"
                          : seatData
                          ? seatData.color
                          : "white",
                      border: isSelectedSeat
                        ? "3px solid black"
                        : "1px solid white",
                      boxSizing: "border-box",
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color:
                        isLocked || isBooked || seatData?.color == "#000000"
                          ? "white"
                          : "black",
                    }}
                    onClick={
                      seatData?.category == "STAGE"
                        ? undefined
                        : isBooked
                        ? () => {
                            const data = bookedSeats.find(
                              (s) => s.seat_id === id
                            );
                            console.log("BookedSeat", data);
                            if (data) {
                              setBookedSeat(data);
                              setOpenDialog(true);
                            }
                          }
                        : seatData
                        ? () => {
                            toggleSeat(seatData!.id!, seatData);
                          }
                        : undefined
                    }
                  >
                    <div className="flex flex-col justify-center items-center text-center">
                      <p className="text-[15px] font-bold">
                        {isBooked
                          ? "Booked"
                          : isLocked
                          ? "Locked"
                          : seatData?.name}
                      </p>
                      <p className="text-[10px]">{seatData?.category}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="absolute top-0 left-400 bg-transparent">
            <p className="font-bold text-[200px] uppercase">{selectedShow}</p>
            <p className="text-[150px] uppercase">
              {selectedCategory == "all" ? "Semua Category" : selectedCategory}
            </p>
          </div>
          <div className="absolute top-0 right-300 bg-transparent">
            <p className="font-bold text-[200px] uppercase">{selectedShow}</p>
            <p className="text-[150px] uppercase">
              {selectedCategory == "all" ? "Semua Category" : selectedCategory}
            </p>
          </div>
        </TransformComponent>
      </TransformWrapper>
      <FormBookedSeatDialog isOpen={openDialog} onOpenChange={setOpenDialog} />
    </div>
  );
};

export default BookedSeats;
