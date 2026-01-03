"use client";

import { queueMatchmaking } from "@/lib/actions";

export default function QuickPlayList() {
    return (
        <div className="grid grid-cols-3 grid-rows-2 size-1/3 gap-8">
            {[
                [15, 10],
                [30, 0],
                [60, 0],
                [30, 10],
                [120, 0],
                [180, 0],
            ].map((timeControl) => (
                <button
                    key={`${timeControl[0]} | ${timeControl[1]}`}
                    className="size-full bg-white rounded-4xl text-3xl"
                    onClick={() =>
                        queueMatchmaking(timeControl[0] * 60, timeControl[1])
                    }
                >
                    {`${timeControl[0]} | ${timeControl[1]}`}
                </button>
            ))}
        </div>
    );
}
