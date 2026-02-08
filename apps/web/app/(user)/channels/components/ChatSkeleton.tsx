import { Skeleton } from "@/components/ui/skeleton";

interface ChatSkeletonProps {
  className?: string;
  skeletonCount?: number;
}

const ChatSkeleton = ({ className, skeletonCount = 1 }: ChatSkeletonProps) => {
  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <div
          key={"message-skeleton-" + index}
          className="flex items-start gap-4 px-4 space-y-4"
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatSkeleton;
