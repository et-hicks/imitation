"use client";

import { useState, useEffect } from "react";
import type { Metadata } from "next";

type ClockStyle = "wine-time" | "corporate-suffering" | "existential-dread";

interface ClockStyleConfig {
    name: string;
    description: string;
    faceColor: string;
    borderColor: string;
    hourHandColor: string;
    minuteHandColor: string;
    secondHandColor: string;
    backgroundColor: string;
    tickColor: string;
    centerDotColor: string;
}

const clockStyles: Record<ClockStyle, ClockStyleConfig> = {
    "wine-time": {
        name: "Wine Time",
        description: "It's always wine o'clock somewhere",
        faceColor: "#8b3a3a",
        borderColor: "#5a2020",
        hourHandColor: "#f5f5f5",
        minuteHandColor: "#f5f5f5",
        secondHandColor: "#ffcc00",
        backgroundColor: "#1a1a1a",
        tickColor: "#ffffff44",
        centerDotColor: "#f5f5f5",
    },
    "corporate-suffering": {
        name: "Corporate Suffering",
        description: "Watching the clock until 5 PM",
        faceColor: "#1e3a5f",
        borderColor: "#0d2240",
        hourHandColor: "#00ff88",
        minuteHandColor: "#00ff88",
        secondHandColor: "#ff4444",
        backgroundColor: "#0a0a0a",
        tickColor: "#00ff8844",
        centerDotColor: "#00ff88",
    },
    "existential-dread": {
        name: "Existential Dread",
        description: "Time is a flat circle",
        faceColor: "#2a1a3e",
        borderColor: "#150d22",
        hourHandColor: "#e066ff",
        minuteHandColor: "#b84dff",
        secondHandColor: "#ff66b2",
        backgroundColor: "#0d0d0d",
        tickColor: "#e066ff44",
        centerDotColor: "#e066ff",
    },
};

function AnalogClock({ style }: { style: ClockStyle }) {
    const [time, setTime] = useState(new Date());
    const config = clockStyles[style];

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    // Calculate rotation angles
    const hourAngle = (hours * 30) + (minutes * 0.5); // 30 degrees per hour + 0.5 per minute
    const minuteAngle = (minutes * 6) + (seconds * 0.1); // 6 degrees per minute + 0.1 per second
    const secondAngle = seconds * 6; // 6 degrees per second

    const size = 300;
    const center = size / 2;
    const radius = size * 0.42;

    // Hour marks
    const hourMarks = Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const innerRadius = radius * 0.85;
        const outerRadius = radius * 0.95;
        return {
            x1: center + innerRadius * Math.cos(angle),
            y1: center + innerRadius * Math.sin(angle),
            x2: center + outerRadius * Math.cos(angle),
            y2: center + outerRadius * Math.sin(angle),
        };
    });

    return (
        <div
            className="flex flex-col items-center gap-4 p-6 rounded-2xl transition-all duration-500"
            style={{ backgroundColor: config.backgroundColor }}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="drop-shadow-2xl"
            >
                {/* Clock face */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius + 10}
                    fill={config.borderColor}
                />
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill={config.faceColor}
                    className="drop-shadow-lg"
                />

                {/* Hour marks */}
                {hourMarks.map((mark, i) => (
                    <line
                        key={i}
                        x1={mark.x1}
                        y1={mark.y1}
                        x2={mark.x2}
                        y2={mark.y2}
                        stroke={config.tickColor}
                        strokeWidth={3}
                        strokeLinecap="round"
                    />
                ))}

                {/* Hour hand */}
                <line
                    x1={center}
                    y1={center}
                    x2={center}
                    y2={center - radius * 0.5}
                    stroke={config.hourHandColor}
                    strokeWidth={6}
                    strokeLinecap="round"
                    style={{
                        transformOrigin: `${center}px ${center}px`,
                        transform: `rotate(${hourAngle}deg)`,
                        transition: "transform 0.3s cubic-bezier(0.4, 2.08, 0.55, 0.44)",
                    }}
                />

                {/* Minute hand */}
                <line
                    x1={center}
                    y1={center}
                    x2={center}
                    y2={center - radius * 0.7}
                    stroke={config.minuteHandColor}
                    strokeWidth={4}
                    strokeLinecap="round"
                    style={{
                        transformOrigin: `${center}px ${center}px`,
                        transform: `rotate(${minuteAngle}deg)`,
                        transition: "transform 0.3s cubic-bezier(0.4, 2.08, 0.55, 0.44)",
                    }}
                />

                {/* Second hand */}
                <line
                    x1={center}
                    y1={center + radius * 0.15}
                    x2={center}
                    y2={center - radius * 0.8}
                    stroke={config.secondHandColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{
                        transformOrigin: `${center}px ${center}px`,
                        transform: `rotate(${secondAngle}deg)`,
                        transition: "transform 0.1s cubic-bezier(0.4, 2.08, 0.55, 0.44)",
                    }}
                />

                {/* Center dot */}
                <circle cx={center} cy={center} r={8} fill={config.centerDotColor} />
                <circle cx={center} cy={center} r={4} fill={config.borderColor} />
            </svg>

            <div className="text-center">
                <h3
                    className="text-xl font-bold"
                    style={{ color: config.hourHandColor }}
                >
                    {config.name}
                </h3>
                <p className="text-sm opacity-70 text-gray-400">{config.description}</p>
            </div>
        </div>
    );
}

export default function DigitalClockPage() {
    const [selectedStyle, setSelectedStyle] = useState<ClockStyle>("wine-time");
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#030617] via-[#061028] to-[#0a1b3d] text-slate-100">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10 lg:py-16">
                {/* Header */}
                <div className="text-center space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                        Definitely Not What You Expected
                    </p>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Digital Clock
                    </h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        A clock with <span className="italic">digits</span> (hour, minute,
                        second hands). Get it? It's digital because it has... you know
                        what, never mind.
                    </p>
                    {time && (
                        <p className="text-2xl font-mono text-sky-300">
                            {formatTime(time)}
                        </p>
                    )}
                </div>

                {/* Style Selector */}
                <div className="flex flex-wrap justify-center gap-4">
                    {(Object.keys(clockStyles) as ClockStyle[]).map((styleKey) => (
                        <button
                            key={styleKey}
                            onClick={() => setSelectedStyle(styleKey)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 border-2 ${selectedStyle === styleKey
                                    ? "border-sky-400 bg-sky-400/20 text-sky-300 scale-105 shadow-lg shadow-sky-400/20"
                                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/30 hover:bg-white/10"
                                }`}
                        >
                            {clockStyles[styleKey].name}
                        </button>
                    ))}
                </div>

                {/* Main Clock Display */}
                <div className="flex justify-center">
                    <div className="transform hover:scale-105 transition-transform duration-300">
                        <AnalogClock style={selectedStyle} />
                    </div>
                </div>

                {/* All Clocks Grid */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-center text-white">
                        All The Wrong Kinds of Digital
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(Object.keys(clockStyles) as ClockStyle[]).map((styleKey) => (
                            <div
                                key={styleKey}
                                onClick={() => setSelectedStyle(styleKey)}
                                className={`cursor-pointer rounded-2xl border-2 transition-all duration-300 ${selectedStyle === styleKey
                                        ? "border-sky-400 shadow-lg shadow-sky-400/20"
                                        : "border-white/10 hover:border-white/30"
                                    }`}
                            >
                                <AnalogClock style={styleKey} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fun Footer */}
                <div className="text-center text-slate-500 text-sm space-y-2 pt-8 border-t border-white/10">
                    <p>
                        *This clock is technically more "analog" than "digital" but where's
                        the fun in that?
                    </p>
                    <p className="text-xs">
                        Synced to your local time. Accuracy not guaranteed if you're in a
                        time loop.
                    </p>
                </div>
            </div>
        </main>
    );
}
