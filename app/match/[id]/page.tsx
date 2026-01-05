"use client";

import SignalRConnection from "@/components/signalr-connection";
import { getAccessToken } from "@/lib/util";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { Chess, Square } from "chess.js";
import { use, useRef, useState } from "react";
import {
    Chessboard,
    PieceDropHandlerArgs,
    SquareHandlerArgs,
} from "react-chessboard";

export default function Match({ params }: { params: Promise<{ id: string }> }) {
    // From https://react-chessboard.vercel.app/?path=/docs/how-to-use-basic-examples--docs

    // create a chess game using a ref to always have access to the latest game state within closures and maintain the game state across renders
    const chessGameRef = useRef(new Chess());
    const chessGame = chessGameRef.current;

    // track the current position of the chess game in state to trigger a re-render of the chessboard
    const [chessPosition, setChessPosition] = useState(chessGame.fen());
    const [moveFrom, setMoveFrom] = useState("");
    const [optionSquares, setOptionSquares] = useState({});

    // // make a random "CPU" move
    // function makeRandomMove() {
    //     // get all possible moves`
    //     const possibleMoves = chessGame.moves();

    //     // exit if the game is over
    //     if (chessGame.isGameOver()) {
    //         return;
    //     }

    //     // pick a random move
    //     const randomMove =
    //         possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

    //     // make the move
    //     chessGame.move(randomMove);

    //     // update the position state
    //     setChessPosition(chessGame.fen());
    // }

    // get the move options for a square to show valid moves
    function getMoveOptions(square: Square) {
        // get the moves for the square
        const moves = chessGame.moves({
            square,
            verbose: true,
        });

        // if no moves, clear the option squares
        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        // create a new object to store the option squares
        const newSquares: Record<string, React.CSSProperties> = {};

        // loop through the moves and set the option squares
        for (const move of moves) {
            newSquares[move.to] = {
                background:
                    chessGame.get(move.to) &&
                    chessGame.get(move.to)?.color !==
                        chessGame.get(square)?.color
                        ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)" // larger circle for capturing
                        : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
                // smaller circle for moving
                borderRadius: "50%",
            };
        }

        // set the square clicked to move from to yellow
        newSquares[square] = {
            background: "rgba(255, 255, 0, 0.4)",
        };

        // set the option squares
        setOptionSquares(newSquares);

        // return true to indicate that there are move options
        return true;
    }
    function onSquareClick({ square, piece }: SquareHandlerArgs) {
        // piece clicked to move
        if (!moveFrom && piece) {
            // get the move options for the square
            const hasMoveOptions = getMoveOptions(square as Square);

            // if move options, set the moveFrom to the square
            if (hasMoveOptions) {
                setMoveFrom(square);
            }

            // return early
            return;
        }

        // square clicked to move to, check if valid move
        const moves = chessGame.moves({
            square: moveFrom as Square,
            verbose: true,
        });
        const foundMove = moves.find(
            (m) => m.from === moveFrom && m.to === square
        );

        // not a valid move
        if (!foundMove) {
            // check if clicked on new piece
            const hasMoveOptions = getMoveOptions(square as Square);

            // if new piece, setMoveFrom, otherwise clear moveFrom
            setMoveFrom(hasMoveOptions ? square : "");

            // return early
            return;
        }

        // is normal move
        try {
            chessGame.move({
                from: moveFrom,
                to: square,
                promotion: "q",
            });
        } catch {
            // if invalid, setMoveFrom and getMoveOptions
            const hasMoveOptions = getMoveOptions(square as Square);

            // if new piece, setMoveFrom, otherwise clear moveFrom
            if (hasMoveOptions) {
                setMoveFrom(square);
            }

            // return early
            return;
        }

        // update the position state
        setChessPosition(chessGame.fen());

        // make random cpu move after a short delay
        // setTimeout(makeRandomMove, 300);

        // clear moveFrom and optionSquares
        setMoveFrom("");
        setOptionSquares({});
    }

    // handle piece drop
    function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
        // type narrow targetSquare potentially being null (e.g. if dropped off board)
        if (!targetSquare) {
            return false;
        }

        // try to make the move according to chess.js logic
        try {
            chessGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: "q", // always promote to a queen for example simplicity
            });

            // update the position state upon successful move to trigger a re-render of the chessboard
            setChessPosition(chessGame.fen());

            // clear moveFrom and optionSquares
            setMoveFrom("");
            setOptionSquares({});

            // make random cpu move after a short delay
            // setTimeout(makeRandomMove, 500);

            // return true as the move was successful
            return true;
        } catch {
            // return false as the move was not successful
            return false;
        }
    }

    // set the chessboard options
    const chessboardOptions = {
        onPieceDrop,
        onSquareClick,
        position: chessPosition,
        squareStyles: optionSquares,
        id: "click-or-drag-to-move",
    };

    const [whiteTime, setWhiteTime] = useState(0);
    const [blackTime, setBlackTime] = useState(0);

    const [serverTimestamp, setServerTimestamp] = useState(0);
    const [serverTimeOffset, setServerTimeOffset] = useState(0);

    const { id: matchId } = use(params);

    return (
        <SignalRConnection
            connectionProvider={() => {
                const connection = new HubConnectionBuilder()
                    .configureLogging(LogLevel.Debug)
                    .withUrl("http://localhost:5075/hubs/game", {
                        accessTokenFactory: getAccessToken,
                    })
                    .withAutomaticReconnect()
                    .build();

                connection.on(
                    "ReceiveJoin",
                    (
                        type: number,
                        allPlayersJoined: boolean,
                        whiteTimeRemaining: number,
                        blackTimeRemaining: number,
                        newServerTimestamp: number
                    ) => {
                        setWhiteTime(whiteTimeRemaining);
                        setBlackTime(blackTimeRemaining);

                        console.log("test");

                        if (allPlayersJoined) {
                            setServerTimestamp(newServerTimestamp);

                            const clientReceiveTime: number = performance.now();
                            setServerTimeOffset(
                                serverTimestamp - clientReceiveTime
                            );
                        }
                    }
                );

                connection.on(
                    "ReceiveMove",
                    (
                        board: string,
                        result: number,
                        timeRemaining: number,
                        newServerTimestamp: number
                    ) => {
                        if (chessGame.turn() === "w") {
                            setWhiteTime(timeRemaining);
                        } else {
                            setBlackTime(timeRemaining);
                        }

                        chessGame.load(board);

                        setServerTimestamp(newServerTimestamp);

                        const clientReceiveTime: number = performance.now();
                        setServerTimeOffset(
                            serverTimestamp - clientReceiveTime
                        );
                    }
                );

                connection
                    .start()
                    .then(() => {
                        console.log("Connected to SignalR");

                        connection.invoke("JoinMatch", matchId);
                    })
                    .catch((err) =>
                        console.error("SignalR connection error:", err)
                    );

                return connection;
            }}
        >
            {() => (
                <div className="w-full h-screen flex items-center justify-center">
                    <div className="p-12 w-1/2 h-full flex flex-col items-center justify-center">
                        <p>{whiteTime}</p>
                        <Chessboard options={chessboardOptions} />
                        <p>{blackTime}</p>
                    </div>
                </div>
            )}
        </SignalRConnection>
    );
}
