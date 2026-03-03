"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BACKEND_URL } from "@/lib/env";

type Meal = {
  id: number;
  meal_type: "lunch" | "dinner";
  created_at: string;
};

const TOTAL = 100;
const LUNCH_VALUE = 11.5;
const DINNER_VALUE = 14.0;

function formatMealDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMealTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MealCounter() {
  const { session } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeals = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/meals`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setMeals(await res.json());
    } catch (err) {
      console.error("Failed to fetch meals:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const addMeal = async (meal_type: "lunch" | "dinner") => {
    if (!session?.access_token || meals.length >= TOTAL) return;
    const res = await fetch(`${BACKEND_URL}/meals`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ meal_type }),
    });
    if (res.ok) {
      const meal: Meal = await res.json();
      setMeals((prev) => [meal, ...prev]);
    }
  };

  const removeLast = async () => {
    if (!session?.access_token || meals.length === 0) return;
    const res = await fetch(`${BACKEND_URL}/meals`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      setMeals((prev) => prev.slice(1));
    }
  };

  const count = meals.length;
  const remaining = TOTAL - count;
  const savings = meals.reduce(
    (sum, m) => sum + (m.meal_type === "lunch" ? LUNCH_VALUE : DINNER_VALUE),
    0
  );

  // SVG circular progress
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (count / TOTAL) * circumference;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#030617] via-[#061028] to-[#0a1b3d] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#030617] via-[#061028] to-[#0a1b3d] text-slate-100">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-6 py-14">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          100 meals
        </h1>

        <p className="text-base text-slate-400 -mt-4">
          Only{" "}
          <span className="text-white font-semibold text-lg">{remaining}</span>{" "}
          meal{remaining !== 1 ? "s" : ""} remaining
        </p>

        {/* Circular progress ring */}
        <div className="relative w-56 h-56">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full -rotate-90"
          >
            {/* Track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="14"
            />
            {/* Progress */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#22c55e"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-white tabular-nums">
              {count}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => addMeal("lunch")}
            disabled={count >= TOTAL}
            className="px-7 py-3 rounded-xl bg-green-500 hover:bg-green-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-white transition-all"
          >
            Lunch
          </button>
          <button
            onClick={() => addMeal("dinner")}
            disabled={count >= TOTAL}
            className="px-7 py-3 rounded-xl bg-sky-400 hover:bg-sky-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-white transition-all"
          >
            Dinner
          </button>
          <button
            onClick={removeLast}
            disabled={count === 0}
            className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-white text-xl transition-all"
            aria-label="Remove last meal"
          >
            −
          </button>
        </div>

        {/* Savings */}
        <p className="text-base text-slate-400">
          You have saved{" "}
          <span className="text-green-400 font-semibold text-lg">
            ${savings.toFixed(2)}
          </span>{" "}
          so far
        </p>

        {/* Meal log */}
        {meals.length > 0 && (
          <div className="w-full space-y-2 pt-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 pb-1">
              Meal log
            </h2>
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-300"
              >
                On {formatMealDate(meal.created_at)} at{" "}
                {formatMealTime(meal.created_at)}, you made your own{" "}
                <span
                  className={
                    meal.meal_type === "lunch"
                      ? "text-green-400 font-medium"
                      : "text-sky-400 font-medium"
                  }
                >
                  {meal.meal_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
