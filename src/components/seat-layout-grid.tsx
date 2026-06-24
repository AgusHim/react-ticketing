import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Transformer } from 'react-konva';
import { useSeats } from '@/context/SeatsContext';
import Konva from 'konva';

interface SeatGridProps {
  rows: number;
  cols: number;
  seatSize?: number;
}

export const SeatGrid: React.FC<SeatGridProps> = ({
  seatSize = 50,
}) => {
  const { seats, setSeatConfig, updateMultipleSeatCoordinates, removeSeat, selectedIds, setSelectedIds } = useSeats();
  const trRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const dragStateRef = useRef<{ id: string, startX: number, startY: number, initialPositions: { [id: string]: { x: number, y: number } } } | null>(null);

  // Panning & Zooming states
  const [stageScale, setStageScale] = useState(0.8);
  const [stageX, setStageX] = useState(50);
  const [stageY, setStageY] = useState(50);

  // Selection Box states
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number; active: boolean } | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    const nodes = selectedIds.map((id) => stageRef.current!.findOne(`#seat-${id}`));
    const validNodes = nodes.filter((node) => node !== undefined);
    trRef.current.nodes(validNodes as Konva.Node[]);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedIds, seats]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();

    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setStageScale(newScale);
    setStageX(-(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale);
    setStageY(-(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale);
  };

  const onMouseDown = (e: any) => {
    const isBackground = e.target === e.target.getStage();

    // If shift is pressed, we want to draw a selection box instead of panning
    if (isBackground && (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)) {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();

      // Convert screen coordinates to stage coordinates
      const x = (pointerPos.x - stage.x()) / stage.scaleX();
      const y = (pointerPos.y - stage.y()) / stage.scaleY();

      selectionStartRef.current = { x, y };
      setSelectionBox({ x, y, width: 0, height: 0, active: true });

      // Disable stage dragging while selecting
      stage.draggable(false);
    } else if (isBackground) {
      setSelectedIds([]);
    }
  };

  const onMouseMove = (e: any) => {
    if (!selectionBox || !selectionBox.active || !selectionStartRef.current) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const x = (pointerPos.x - stage.x()) / stage.scaleX();
    const y = (pointerPos.y - stage.y()) / stage.scaleY();

    setSelectionBox({
      x: Math.min(selectionStartRef.current.x, x),
      y: Math.min(selectionStartRef.current.y, y),
      width: Math.abs(x - selectionStartRef.current.x),
      height: Math.abs(y - selectionStartRef.current.y),
      active: true
    });
  };

  const onMouseUp = (e: any) => {
    if (selectionBox && selectionBox.active) {
      // Calculate intersection
      const newSelectedIds: string[] = [];

      seats.forEach(seat => {
        const seatX = seat.x ?? 0;
        const seatY = seat.y ?? 0;
        // Simple bounding box check (assuming width=seatSize, height=seatSize)
        if (
          seatX >= selectionBox.x &&
          seatX <= selectionBox.x + selectionBox.width &&
          seatY >= selectionBox.y &&
          seatY <= selectionBox.y + selectionBox.height
        ) {
          newSelectedIds.push(seat.id!);
        }
      });

      // Add to selection instead of replacing
      setSelectedIds(prev => Array.from(new Set([...prev, ...newSelectedIds])));

      setSelectionBox(null);
      selectionStartRef.current = null;

      // Re-enable stage drag
      e.target.getStage().draggable(true);
    }
  };

  const onClickSeat = (e: any, seatId: string) => {
    const seatData = seats.find((s) => s.id === seatId);
    if (seatData) {
      setSeatConfig({ ...seatData });
    }

    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
    const isSelected = selectedIds.includes(seatId);

    if (!metaPressed && !isSelected) {
      setSelectedIds([seatId]);
    } else if (metaPressed && isSelected) {
      setSelectedIds(selectedIds.filter((id) => id !== seatId));
    } else if (metaPressed && !isSelected) {
      setSelectedIds([...selectedIds, seatId]);
    }
  };

  const onDragStart = (e: any, seatId: string) => {
    if (selectedIds.includes(seatId) && selectedIds.length > 1) {
      const initialPositions: { [id: string]: { x: number, y: number } } = {};
      selectedIds.forEach(id => {
        const seatNode = stageRef.current?.findOne(`#seat-${id}`);
        if (seatNode) {
          initialPositions[id] = { x: seatNode.x(), y: seatNode.y() };
        }
      });

      dragStateRef.current = {
        id: seatId,
        startX: e.target.x(),
        startY: e.target.y(),
        initialPositions
      };
    } else {
      dragStateRef.current = null;
    }
  };

  const onDragMove = (e: any, seatId: string) => {
    if (dragStateRef.current && dragStateRef.current.id === seatId) {
      const deltaX = e.target.x() - dragStateRef.current.startX;
      const deltaY = e.target.y() - dragStateRef.current.startY;

      selectedIds.forEach(id => {
        if (id !== seatId) {
          const seatNode = stageRef.current?.findOne(`#seat-${id}`);
          const initPos = dragStateRef.current?.initialPositions[id];
          if (seatNode && initPos) {
            seatNode.x(initPos.x + deltaX);
            seatNode.y(initPos.y + deltaY);
          }
        }
      });
    }
  };

  const onDragEnd = (e: any, seatId: string) => {
    if (dragStateRef.current && dragStateRef.current.id === seatId) {
      // Multi-drag end: save all selected nodes
      const updates: any[] = [];
      selectedIds.forEach(id => {
        const seatNode = stageRef.current?.findOne(`#seat-${id}`);
        if (seatNode) {
          updates.push({
            id,
            x: seatNode.x(),
            y: seatNode.y(),
            rotation: seatNode.rotation()
          });
        }
      });

      updateMultipleSeatCoordinates(updates);
      dragStateRef.current = null;
    } else {
      // Single drag end
      const node = e.target;
      updateMultipleSeatCoordinates([{ id: seatId, x: node.x(), y: node.y(), rotation: node.rotation() }]);
    }
  };

  const onTransformEnd = () => {
    const nodes = trRef.current?.nodes();
    if (nodes) {
      const updates: any[] = [];
      nodes.forEach(node => {
        const id = node.id().replace('seat-', '');

        // If the node was resized, its scale changes. We convert scale to width/height, then reset scale to 1.
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        let newWidth = undefined;
        let newHeight = undefined;

        if (scaleX !== 1 || scaleY !== 1) {
          const seatData = seats.find(s => s.id === id);
          if (seatData) {
            newWidth = Math.max(10, (seatData.width || (seatSize - 2)) * scaleX);
            newHeight = Math.max(10, (seatData.height || (seatSize - 2)) * scaleY);
          }

          node.scaleX(1);
          node.scaleY(1);
        }

        updates.push({
          id,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: newWidth,
          height: newHeight
        });
      });

      updateMultipleSeatCoordinates(updates);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedIds.length > 0) {
          selectedIds.forEach(id => {
            const seat = seats.find(s => s.id === id);
            if (seat && seat.position) {
              removeSeat(seat.position);
            }
          });
          setSelectedIds([]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, seats, removeSeat, setSelectedIds]);

  // Determine if resizing should be enabled (only if all selected are STAGE)
  const isResizeEnabled = selectedIds.length > 0 && selectedIds.every(id => {
    const s = seats.find(seat => seat.id === id);
    return s?.category === 'STAGE';
  });

  const getSelectionBounds = () => {
    if (selectedIds.length <= 1) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedIds.forEach(id => {
      const seat = seats.find(s => s.id === id);
      if (seat) {
        const x = seat.x ?? 0;
        const y = seat.y ?? 0;
        const w = seat.width || seatSize - 2;
        const h = seat.height || seatSize - 2;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }
    });

    if (minX === Infinity) return null;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const bounds = getSelectionBounds();

  return (
    <div className="w-full h-[100vh] border-l border-slate-700 relative bg-slate-900 cursor-grab active:cursor-grabbing">
      <Stage
        width={window.innerWidth - 600}
        height={window.innerHeight}
        onWheel={handleWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onMouseDown}
        onTouchMove={onMouseMove}
        onTouchEnd={onMouseUp}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stageX}
        y={stageY}
        draggable
        ref={stageRef}
      >
        <Layer>
          {seats.map((seat) => {
            let x = seat.x ?? 0;
            let y = seat.y ?? 0;

            if (seat.x === undefined || seat.y === undefined) {
              if (seat.position && seat.position.includes('-')) {
                const [r, c] = seat.position.split('-');
                x = parseInt(c) * seatSize;
                y = parseInt(r) * seatSize;
              }
            }

            const seatWidth = seat.width || seatSize - 2;
            const seatHeight = seat.height || seatSize - 2;
            const isStage = seat.category === 'STAGE';
            const isMultiSelected = selectedIds.length > 1 && selectedIds.includes(seat.id!);

            return (
              <Group
                key={seat.id}
                id={`seat-${seat.id}`}
                name={isStage ? 'stage' : 'seat'}
                x={x}
                y={y}
                rotation={seat.rotation ?? 0}
                draggable={!isMultiSelected}
                dragBoundFunc={(pos) => {
                  return {
                    x: Math.round(pos.x / 10) * 10,
                    y: Math.round(pos.y / 10) * 10
                  };
                }}
                onClick={(e) => onClickSeat(e, seat.id!)}
                onTap={(e) => onClickSeat(e, seat.id!)}
                onDragStart={(e) => onDragStart(e, seat.id!)}
                onDragMove={(e) => onDragMove(e, seat.id!)}
                onDragEnd={(e) => onDragEnd(e, seat.id!)}
              >
                <Rect
                  width={seatWidth}
                  height={seatHeight}
                  fill={seat.color || "white"}
                  stroke={selectedIds.includes(seat.id!) ? "#3B82F6" : "#475569"}
                  strokeWidth={selectedIds.includes(seat.id!) ? 3 : 1}
                  cornerRadius={isStage ? 8 : 4}
                />

                {isStage ? (
                  <Text
                    text={seat.name || 'STAGE'}
                    fontSize={24}
                    fontStyle="bold"
                    fill={seat.color === "#000000" ? "white" : "white"}
                    align="center"
                    verticalAlign="middle"
                    width={seatWidth}
                    height={seatHeight}
                  />
                ) : (
                  <>

                    <Text
                      text={seat.name || ''}
                      fontSize={14}
                      fontStyle="bold"
                      fill={seat.color === "#000000" ? "white" : "black"}
                      align="center"
                      verticalAlign="middle"
                      width={seatWidth}
                      height={seatHeight}
                    />
                    <Text
                      text={seat.category || ''}
                      fontSize={8}
                      fill={seat.color === "#000000" ? "white" : "black"}
                      align="center"
                      verticalAlign="bottom"
                      width={seatWidth}
                      height={seatHeight}
                      y={-4}
                    />
                  </>
                )}
              </Group>
            );
          })}

          <Transformer
            ref={trRef}
            rotationSnaps={[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345]}
            resizeEnabled={isResizeEnabled}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) {
                return oldBox;
              }
              return newBox;
            }}
            onTransformEnd={onTransformEnd}
          />

          {/* Multi-Selection Drag Handle */}
          {bounds && (
            <Group
              x={bounds.x}
              y={bounds.y}
              draggable
              dragBoundFunc={(pos) => ({
                x: Math.round(pos.x / 10) * 10,
                y: Math.round(pos.y / 10) * 10
              })}
              onDragStart={(e) => {
                const initialPositions: { [id: string]: { x: number, y: number } } = {};
                selectedIds.forEach(id => {
                  const seatNode = stageRef.current?.findOne(`#seat-${id}`);
                  if (seatNode) {
                    initialPositions[id] = { x: seatNode.x(), y: seatNode.y() };
                  }
                });
                dragStateRef.current = { id: 'group_handle', startX: e.target.x(), startY: e.target.y(), initialPositions };
              }}
              onDragMove={(e) => {
                if (!dragStateRef.current || dragStateRef.current.id !== 'group_handle') return;
                const deltaX = e.target.x() - dragStateRef.current.startX;
                const deltaY = e.target.y() - dragStateRef.current.startY;

                selectedIds.forEach(id => {
                  const seatNode = stageRef.current?.findOne(`#seat-${id}`);
                  const initPos = dragStateRef.current?.initialPositions[id];
                  if (seatNode && initPos) {
                    seatNode.x(initPos.x + deltaX);
                    seatNode.y(initPos.y + deltaY);
                  }
                });
                // Force transformer to update its position
                trRef.current?.forceUpdate();
              }}
              onDragEnd={(e) => {
                if (!dragStateRef.current || dragStateRef.current.id !== 'group_handle') return;
                const updates: any[] = [];
                selectedIds.forEach(id => {
                  const seatNode = stageRef.current?.findOne(`#seat-${id}`);
                  if (seatNode) {
                    updates.push({ id, x: seatNode.x(), y: seatNode.y(), rotation: seatNode.rotation() });
                  }
                });
                updateMultipleSeatCoordinates(updates);
                dragStateRef.current = null;

                // Reset group handle to calculated bounds (it acts as a relative drag source)
                e.target.x(bounds.x);
                e.target.y(bounds.y);
              }}
            >
              {/* Visual Drag Tab */}
              <Group x={bounds.width / 2 - 40} y={-30}>
                <Rect
                  width={80}
                  height={25}
                  fill="#3B82F6"
                  cornerRadius={[6, 6, 0, 0]}
                  shadowColor="black"
                  shadowBlur={4}
                  shadowOpacity={0.3}
                  shadowOffsetY={2}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'move';
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'grab';
                  }}
                />
                <Text
                  text="✥ DRAG"
                  width={80}
                  height={25}
                  align="center"
                  verticalAlign="middle"
                  fill="white"
                  fontSize={12}
                  fontStyle="bold"
                />
              </Group>
            </Group>
          )}

          {selectionBox && selectionBox.active && (
            <Rect
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3B82F6"
              strokeWidth={1}
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      {/* Help Overlay */}
      <div className="absolute top-4 left-4 bg-slate-800/80 p-3 rounded-lg text-xs text-slate-300 pointer-events-none backdrop-blur-sm border border-slate-700">
        <p className="font-bold text-white mb-1">CAD Controls:</p>
        <ul className="space-y-1">
          <li>• <b>Pan</b>: Drag background</li>
          <li>• <b>Zoom</b>: Mouse Wheel</li>
          <li>• <b>Select</b>: Click seat</li>
          <li>• <b>Box Select</b>: Shift + Drag background</li>
          <li>• <b>Multi-select</b>: Shift + Click seat</li>
          <li>• <b>Rotate</b>: Use handle after select</li>
          <li>• <b>Drag Group</b>: Use blue handle above</li>
          <li>• <b>Delete</b>: Backspace/Del key</li>
        </ul>
      </div>
    </div>
  );
};
