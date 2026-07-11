import { Star } from "lucide-react";
import React from "react";

const Ratings = ({ rating = 0 }: { rating?: number }) => {
  const normalizedRating = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${normalizedRating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index < Math.round(normalizedRating);

        return (
          <Star
            key={index}
            size={16}
            className={
              isFilled
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }
          />
        );
      })}
    </div>
  );
};

export default Ratings;
