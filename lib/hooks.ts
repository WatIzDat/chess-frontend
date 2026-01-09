import { useEffect, useRef, useState } from "react";

export function useChessClock(
    whiteTime: number,
    blackTime: number,
    turn: "w" | "b",
    serverTimestamp: number | null,
    serverTimeOffset: number | null
) {
    const [display, setDisplay] = useState({
        white: 0,
        black: 0,
    });

    const animationFrameIdRef = useRef<number | null>(null);

    useEffect(() => {
        const tick = () => {
            if (!serverTimeOffset || !serverTimestamp) {
                return;
            }

            const estimatedServerNow = performance.now() + serverTimeOffset;
            const elapsedTime = estimatedServerNow - serverTimestamp;

            let whiteTimeRemaining = whiteTime;
            let blackTimeRemaining = blackTime;

            console.log("Black time: " + blackTimeRemaining);

            if (turn === "w") {
                whiteTimeRemaining -= elapsedTime;
            } else {
                blackTimeRemaining -= elapsedTime;
            }

            setDisplay({
                white: whiteTimeRemaining,
                black: blackTimeRemaining,
            });

            animationFrameIdRef.current = requestAnimationFrame(tick);
        };

        animationFrameIdRef.current = requestAnimationFrame(tick);

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [serverTimeOffset]);

    return display;
}
