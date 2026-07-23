import * as React from 'react'
import { useSeats } from '@/context/SeatsContext';
import { FormSeatDialog } from './dialog/form-seat-dialog';
import { useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

interface SeatVirtualizerFixedProps {
    rows: number;
    cols: number;
    seatSize?: number;
}

export const SeatVirtualizerFixed: React.FC<SeatVirtualizerFixedProps> = ({
    rows,
    cols,
    seatSize = 50,
}) => {
    const [openDialog, setOpenDialog] = useState(false);
    const { seats, setSeatConfig } = useSeats();

    return (
        <>
            <div className="neo-dots neo-surface relative h-[75vh] w-full overflow-auto">
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
                                    const seatData = seats.find((s) => s.position === key);

                                    return (
                                        <div
                                            key={index}
                                            className="absolute flex cursor-pointer items-center justify-center rounded-lg border-2 border-neo-border bg-white text-sm shadow-[2px_2px_0_#1a1a1a] hover:-translate-y-0.5"
                                            style={{
                                                position: "absolute",
                                                top: rowIndex * seatSize,
                                                left: colIndex * seatSize,
                                                width: seatSize - 2,
                                                height: seatSize - 2,
                                                backgroundColor: seatData ? seatData.color : "white",
                                                boxSizing: "border-box",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: seatData?.color == "#000000"?"white":"black",
                                            }}
                                            onClick={seatData ? () => {
                                                if (seatData) {
                                                    setSeatConfig(seatData);
                                                    setOpenDialog(true);
                                                }
                                            } : undefined}
                                        >
                                            <div className="flex flex-col justify-center items-center text-center">
                                                <p className="text-[15px] font-bold">{seatData?.name}</p>
                                                <p className="text-[10px]">{seatData?.category}</p>
                                            </div>

                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </TransformComponent>
                </TransformWrapper>
            </div>
            <FormSeatDialog isOpen={openDialog} onOpenChange={setOpenDialog} />
        </>
    )
}

export default SeatVirtualizerFixed
