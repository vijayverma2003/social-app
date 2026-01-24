"use client";

import { type Virtualizer } from "@tanstack/react-virtual";
import { ReactNode } from "react";

interface VirtualListProps<T> {
  virtualizer: Virtualizer<HTMLElement, Element>;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemSpacing?: number;
  className?: string;
}

export function VirtualList<T>({
  virtualizer,
  items,
  renderItem,
  itemSpacing = 16,
  className,
}: VirtualListProps<T>) {
  return (
    <div
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: "100%",
        position: "relative",
      }}
      className={className}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const item = items[virtualItem.index];
        return (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <div style={{ paddingBottom: `${itemSpacing}px` }}>
              {renderItem(item, virtualItem.index)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
