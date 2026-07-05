"use client";

import Link from "next/link";
import React, { useState } from "react";
import { CheckCircle2, Star } from "lucide-react";

function Success() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex w-full flex-col items-center justify-center min-h-screen px-4">
      <div className="w-[90%] md:w-[480px] p-8 rounded-lg bg-white shadow text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="text-green-500" size={64} />
        </div>

        <h3 className="text-2xl font-semibold mb-2">Payment Successful</h3>
        <p className="text-gray-500 text-sm mb-6">
          Your bank account has been connected and your shop is ready to go.
        </p>

        <div className="border-t border-gray-100 pt-5 mb-5">
          <p className="text-gray-700 mb-3">How was your setup experience?</p>
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                onClick={() => {
                  setRating(value);
                  setSubmitted(true);
                }}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="cursor-pointer"
              >
                <Star
                  size={32}
                  className={
                    value <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                />
              </button>
            ))}
          </div>
          {submitted && (
            <p className="text-sm text-green-600">Thanks for your feedback!</p>
          )}
        </div>

        <Link
          href="/dashboard"
          className="w-full inline-block bg-amber-50 text-white py-3 rounded-lg text-lg cursor-pointer hover:bg-amber-100 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Success;
