import { useBookedSeats } from "@/context/BookedSeatsContext";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { FormBookedSeatDialog } from "./dialog/form-booked-seat-dialog";
import { useState, useMemo } from "react";
import { useSidebar } from "./ui/sidebar";

interface BookedSeatsProps {
  rows: number; // kept for compatibility but ignored for rendering
  cols: number; // kept for compatibility but ignored for rendering
  seatSize?: number;
}

export const BookedSeats: React.FC<BookedSeatsProps> = ({ }) => {
  const {
    seats,
    authSelectedSeats,
    anotherAuthSelectedSeats,
    bookedSeats,
    toggleSeat,
    selectedCategory,
    setBookedSeat,
  } = useBookedSeats();

  const [openDialog, setOpenDialog] = useState(false);
  const { open } = useSidebar();

  const layoutBounds = useMemo(() => {
    if (!seats.length) return { minX: 0, maxX: 1000, minY: 0, maxY: 1000, width: 1000, height: 1000 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    seats.forEach(seat => {
      let x = seat.x ?? 0;
      let y = seat.y ?? 0;

      if (seat.x === undefined || seat.y === undefined) {
        if (seat.position && seat.position.includes('-')) {
          const [r, c] = seat.position.split('-');
          x = parseInt(c) * 50; // CELL_SIZE
          y = parseInt(r) * 50;
        }
      }

      const w = seat.width || 48; // CELL_SIZE - 2
      const h = seat.height || 48;

      if (x < minX) minX = x;
      if (x + w > maxX) maxX = x + w;
      if (y < minY) minY = y;
      if (y + h > maxY) maxY = y + h;
    });
    const padding = 100;
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minY: minY - padding,
      maxY: maxY + padding,
      width: maxX - minX + (padding * 2),
      height: maxY - minY + (padding * 2)
    };
  }, [seats]);

  const initialScale = useMemo(() => {
    if (typeof window === 'undefined' || layoutBounds.width === 0) return 0.5;
    const scaleX = window.innerWidth / layoutBounds.width;
    const scaleY = (window.innerHeight - 100) / layoutBounds.height;
    let scale = Math.min(scaleX, scaleY) * 0.95;
    return Math.max(0.1, Math.min(scale, 1.5));
  }, [layoutBounds]);

  return (
    <div
      className={`${open ? "w-[83vw]" : "w-[99vw]"
        } h-[80vh] relative overflow-hidden bg-slate-900 rounded-xl`}
    >
      <TransformWrapper
        key={`transform-${layoutBounds.width}-${initialScale}`}
        minScale={0.1}
        maxScale={4}
        initialScale={initialScale}
        centerOnInit={true}
        wheel={{ step: 0.05 }}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%", overflow: "hidden" }}
        >
          <div
            className="relative origin-top-left"
            style={{
              width: layoutBounds.width,
              height: layoutBounds.height,
            }}
          >
            {seats.map((seatData) => {
              const isSelectedSeat = Boolean(authSelectedSeats.find((as) => as.seat_id === seatData.id));
              const isLocked = Boolean(anotherAuthSelectedSeats.find((as) => as.seat_id === seatData.id));
              const bookedData = bookedSeats.find((bs) => bs.seat_id === seatData.id);
              const isBooked = Boolean(bookedData);
              const isStage = seatData.category === 'STAGE';

              const status = isBooked ? 'booked' : isLocked ? 'locked' : isSelectedSeat ? 'mine' : 'available';

              const isAllowed = selectedCategory === "all" || seatData.category === selectedCategory || isStage;
              const isClickable = !isStage && isAllowed && (status === 'available' || status === 'mine' || status === 'booked');

              const color = isStage ? (seatData.color || '#1e293b') : (status === 'mine' ? '#4ade80' : status === 'locked' ? '#eab308' : status === 'booked' ? '#64748b' : (seatData.color || '#3b82f6'));

              let x = seatData.x ?? 0;
              let y = seatData.y ?? 0;

              if (seatData.x === undefined || seatData.y === undefined) {
                if (seatData.position && seatData.position.includes('-')) {
                  const [r, c] = seatData.position.split('-');
                  x = parseInt(c) * 50;
                  y = parseInt(r) * 50;
                }
              }

              x -= layoutBounds.minX;
              y -= layoutBounds.minY;

              const seatWidth = seatData.width || 48;
              const seatHeight = seatData.height || 48;
              const rotation = seatData.rotation ?? 0;

              return (
                <div
                  key={seatData.id}
                  style={{
                    position: 'absolute',
                    top: y,
                    left: x,
                    width: seatWidth,
                    height: seatHeight,
                    backgroundColor: color,
                    border: status === 'mine' ? '2px solid #4ade80' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: isStage ? '8px' : '4px',
                    boxSizing: 'border-box',
                    cursor: isClickable ? 'pointer' : (isStage ? 'default' : 'not-allowed'),
                    opacity: status === 'booked' ? 0.7 : (!isAllowed ? 0.2 : 1),
                    transition: 'all 0.2s ease',
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'top left',
                  }}
                  onClick={
                    isClickable
                      ? () => {
                        if (status === 'booked' && bookedData) {
                          setBookedSeat(bookedData);
                          setOpenDialog(true);
                        } else if (status === 'available' || status === 'mine') {
                          toggleSeat(seatData.id!, seatData);
                        }
                      }
                      : undefined
                  }
                >
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    {isStage ? (
                      <p className="text-xl font-bold text-white tracking-widest">{seatData.name || 'STAGE'}</p>
                    ) : (
                      <>
                        <p className="text-[12px] font-bold text-white">
                          {status === 'booked' ? '✕' : status === 'locked' ? '🔒' : seatData.name}
                        </p>
                        {status === 'booked' && <p className="text-[8px] text-white/80 font-bold">{seatData.name}</p>}
                        {seatData.gender && seatData.gender !== 'both' && (
                          <div className={`absolute top-0 right-0 w-3 h-3 rounded-bl-sm flex items-center justify-center text-[7px] font-bold ${seatData.gender === 'male' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'
                            }`}>
                            {seatData.gender === 'male' ? 'L' : 'P'}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>
      <FormBookedSeatDialog isOpen={openDialog} onOpenChange={setOpenDialog} />
    </div>
  );
};

export default BookedSeats;
