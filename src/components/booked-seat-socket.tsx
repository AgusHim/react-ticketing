import { useBookedSeats } from "@/context/BookedSeatsContext";
import type { SocketMessage } from "@/types/socket-message";
import { useCallback, useEffect, useRef, useState } from "react";

// Define interface for deleted seat message
interface DeletedSeatInfo {
  id: string;
  deleted: boolean;
  seat_id: string;
  show_id: string;
}

type BookedSeatsSocketProps = {
  children: React.ReactNode;
};

export default function BookedSeatsSocket({
  children,
}: BookedSeatsSocketProps) {
  const baseUrl = import.meta.env.VITE_WS_BASE_URL || "ws://127.0.0.1:3000";
  const url = `${baseUrl}/ws`;
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { upsertSeatFromBookedSeat, upsertSelectedSeats, removeBookedSeat } =
    useBookedSeats();

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data: SocketMessage = JSON.parse(event.data);
        if (data.type === "booked_seat") {
          upsertSeatFromBookedSeat(data.message);
        } else if (
          data.type === "seat_locked" ||
          data.type === "seat_unlocked"
        ) {
          upsertSelectedSeats(data.type, data.message);
        } else if (data.type === "booked_seat_deleted") {
          // Handle deleted seat message
          const deleteInfo = data.message as DeletedSeatInfo;
          if (deleteInfo.id && deleteInfo.deleted) {
            removeBookedSeat(deleteInfo.id, true);
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    },
    [upsertSeatFromBookedSeat, upsertSelectedSeats, removeBookedSeat]
  );

  useEffect(() => {
    if (ws.current) return; // ✅ Jangan reconnect
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected:", url);
      setIsConnected(true);
      ws.current?.send(JSON.stringify({ type: "ping", message: "init" }));
    };

    socket.onmessage = handleMessage;

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      setIsConnected(false);
    };

    return () => {
      socket?.close();
      setIsConnected(false);
    };
  }, []);

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isConnected ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {isConnected ? "Online" : "Offline"}
        </span>
      </div>
      {children}
    </>
  );
}
