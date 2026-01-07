"use client";

import SignalRConnection from "@/components/signalr-connection";
import { useChessClock } from "@/lib/hooks";
import { formatTimeMs, getAccessToken } from "@/lib/util";
import {
    HubConnection,
    HubConnectionBuilder,
    LogLevel,
} from "@microsoft/signalr";
import { Chess, Color, Square, validateFen } from "chess.js";
import { use, useEffect, useRef, useState } from "react";
import {
    Chessboard,
    ChessboardOptions,
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

    const [connection, setConnection] = useState<HubConnection | null>(null);

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
    function onSquareClick(conn: HubConnection | null) {
        return ({ square, piece }: SquareHandlerArgs) => {
            // piece clicked to move
            console.log("on square click");
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

            conn?.invoke("SendMove", `${moveFrom}${square}`, matchId);
        };
    }

    // handle piece drop
    function onPieceDrop(conn: HubConnection | null) {
        return ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
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

                console.log(connection);

                console.log("move sent");

                // update the position state upon successful move to trigger a re-render of the chessboard
                setChessPosition(chessGame.fen());

                // clear moveFrom and optionSquares
                setMoveFrom("");
                setOptionSquares({});

                conn?.invoke(
                    "SendMove",
                    `${sourceSquare}${targetSquare}`,
                    matchId
                );

                // make random cpu move after a short delay
                // setTimeout(makeRandomMove, 500);

                // return true as the move was successful
                return true;
            } catch {
                // return false as the move was not successful
                return false;
            }
        };
    }

    // set the chessboard options
    const [chessboardOptions, setChessboardOptions] =
        useState<ChessboardOptions>({
            // onPieceDrop: onPieceDrop(null),
            // onSquareClick: onSquareClick(null),
            position: chessPosition,
            squareStyles: optionSquares,
            id: "click-or-drag-to-move",
        });

    useEffect(() => {
        console.log("effect");
        console.log(connection);
        setChessboardOptions({
            ...chessboardOptions,
            onPieceDrop: onPieceDrop(connection),
            onSquareClick: onSquareClick(connection),
            position: chessPosition,
            squareStyles: optionSquares,
        });
    }, [chessPosition, optionSquares, connection]);

    const [whiteTime, setWhiteTime] = useState(0);
    const [blackTime, setBlackTime] = useState(0);

    const [serverTimestamp, setServerTimestamp] = useState<number | null>(null);
    const [serverTimeOffset, setServerTimeOffset] = useState<number | null>(
        null
    );

    // const [playerColor, setPlayerColor] = useState<Color>("w");

    const [gameTurn, setGameTurn] = useState<"w" | "b">("w");

    // const { white: whiteDisplayTime, black: blackDisplayTime } = useChessClock(
    //     whiteTime,
    //     blackTime,
    //     gameTurn,
    //     serverTimestamp,
    //     serverTimeOffset
    // );

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

            if (gameTurn === "w") {
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

    const { id: matchId } = use(params);

    return (
        <SignalRConnection
            connection={connection}
            setConnection={(conn) => {
                setChessboardOptions({
                    ...chessboardOptions,
                    onPieceDrop: onPieceDrop(conn),
                    onSquareClick: onSquareClick(conn),
                    boardOrientation: "white",
                });
                setConnection(conn);
            }}
            connectionProvider={async () => {
                const response = await fetch(
                    `http://localhost:5075/match/${matchId}/type`,
                    {
                        headers: {
                            Authorization: `Bearer ${await getAccessToken()}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Couldn't get player type");
                }

                const type = await response.json();

                const connection = new HubConnectionBuilder()
                    .configureLogging(LogLevel.Debug)
                    .withUrl("http://localhost:5075/hubs/game", {
                        accessTokenFactory: getAccessToken,
                    })
                    .withAutomaticReconnect()
                    .build();

                const loadBoard = (board: string) => {
                    if (
                        validateFen(board).error ===
                        "Invalid FEN: illegal en-passant square"
                    ) {
                        const boardWithoutEpSquare = board.split(" ");

                        boardWithoutEpSquare[3] = "-";

                        chessGame.load(boardWithoutEpSquare.join(" "));
                    } else {
                        chessGame.load(board);
                    }

                    setGameTurn(chessGame.turn());
                };

                connection.on(
                    "ReceiveJoin",
                    (
                        joinType: number,
                        allPlayersJoined: boolean,
                        whiteTimeRemaining: number,
                        blackTimeRemaining: number,
                        board: string,
                        newServerTimestamp: number
                    ) => {
                        // console.log("Black time: " + blackTimeRemaining);
                        setWhiteTime(whiteTimeRemaining);
                        setBlackTime(blackTimeRemaining);

                        loadBoard(board);

                        chessGame.setTurn(type === 1 ? "b" : "w");

                        setChessPosition(board);

                        console.log("test");

                        if (allPlayersJoined) {
                            setServerTimestamp(newServerTimestamp);

                            const clientReceiveTime: number = performance.now();
                            setServerTimeOffset(
                                newServerTimestamp - clientReceiveTime
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
                        console.log("move received");

                        if (chessGame.turn() === "w") {
                            setWhiteTime(timeRemaining);
                        } else {
                            setBlackTime(timeRemaining);
                        }

                        loadBoard(board);

                        chessGame.setTurn(type === 1 ? "b" : "w");

                        console.log(board);

                        setChessPosition(board);

                        setServerTimestamp(newServerTimestamp);

                        const clientReceiveTime: number = performance.now();
                        setServerTimeOffset(
                            newServerTimestamp - clientReceiveTime
                        );
                    }
                );

                const onConnected = async () => {
                    console.log("Connected to SignalR");

                    connection.invoke("JoinMatch", matchId);

                    if (type === 0) {
                        chessGame.setTurn("w");

                        // setPlayerColor("w");

                        setChessboardOptions({
                            ...chessboardOptions,
                            onPieceDrop: onPieceDrop(connection),
                            onSquareClick: onSquareClick(connection),
                            boardOrientation: "white",
                        });

                        setChessPosition(chessGame.fen());
                    } else if (type === 1) {
                        chessGame.setTurn("b");

                        // setPlayerColor("b");

                        setChessboardOptions({
                            ...chessboardOptions,
                            onPieceDrop: onPieceDrop(connection),
                            onSquareClick: onSquareClick(connection),
                            boardOrientation: "black",
                        });

                        setChessPosition(chessGame.fen());
                    }
                };

                connection.onreconnected(onConnected);

                connection
                    .start()
                    .then(onConnected)
                    .catch((err) =>
                        console.error("SignalR connection error:", err)
                    );

                // setChessboardOptions({
                //     ...chessboardOptions,
                //     onPieceDrop: onPieceDrop(connection),
                //     onSquareClick: onSquareClick(connection),
                // });

                return connection;
            }}
        >
            {() => (
                <div className="w-full flex flex-col items-center justify-center">
                    <div>{display.white}</div>
                    <div>{formatTimeMs(display.white)}</div>
                    {/* <div className="p-12 w-1/2 flex flex-col items-center justify-center"> */}
                    <div className="max-w-[70vh] h-full">
                        <Chessboard options={chessboardOptions} />
                    </div>
                    {/* </div> */}
                    <div>{display.black}</div>
                    <div>{formatTimeMs(display.black)}</div>
                </div>
            )}
        </SignalRConnection>
    );
}
