import { useEffect, useRef, useState } from "react";
import { GameResult } from "./types";

export function useChessClock(
    whiteTime: number,
    blackTime: number,
    turn: "w" | "b",
    serverTimestamp: number | null,
    serverTimeOffset: number | null,
    matchId: string,
    gameResult: GameResult | null
) {
    const [display, setDisplay] = useState({
        white: 0,
        black: 0,
    });

    const animationFrameIdRef = useRef<number | null>(null);

    // const [storedTimes, setStoredTimes] = useState([whiteTime, blackTime]);

    // useEffect(() => {
    //     setStoredTimes(
    //         localStorage
    //             .getItem(`${matchId}:time`)
    //             ?.split(":")
    //             .map((t) => parseInt(t)) || [whiteTime, blackTime]
    //     );
    // }, []);

    useEffect(() => {
        // const storedTimes = localStorage
        //     .getItem(`${matchId}:time`)
        //     ?.split(":")
        //     .map((t) => parseInt(t)) || [whiteTime, blackTime];

        if (gameResult && gameResult !== "none") {
            setDisplay({
                white: whiteTime,
                black: blackTime,
            });

            return;
        }

        let storedWhiteTime = whiteTime;
        let storedBlackTime = blackTime;

        const localStorageWhiteTime = localStorage.getItem(
            `${matchId}:whiteTime`
        );
        const localStorageBlackTime = localStorage.getItem(
            `${matchId}:blackTime`
        );

        if (localStorageWhiteTime) {
            storedWhiteTime = parseInt(localStorageWhiteTime);
        }

        if (localStorageBlackTime) {
            storedBlackTime = parseInt(localStorageBlackTime);
        }

        const tick = () => {
            if (!serverTimeOffset || !serverTimestamp) {
                return;
            }

            const estimatedServerNow = performance.now() + serverTimeOffset;
            const elapsedTime = estimatedServerNow - serverTimestamp;

            let whiteTimeRemaining = storedWhiteTime;
            let blackTimeRemaining = storedBlackTime;

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
    }, [gameResult, serverTimeOffset]);

    return { display, animationFrameIdRef };
}
