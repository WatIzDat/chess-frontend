"use client";

import { queueMatchmaking } from "@/lib/actions";
import { getAccessToken } from "@/lib/util";
import SignalRConnection from "./signalr-connection";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useRouter } from "next/navigation";

export default function QuickPlayList() {
    const router = useRouter();

    return (
        <SignalRConnection
            connectionProvider={() => {
                const connection = new HubConnectionBuilder()
                    .configureLogging(LogLevel.Debug)
                    .withUrl("http://localhost:5075/hubs/matchmaking", {
                        accessTokenFactory: getAccessToken,
                        withCredentials: true,
                    })
                    .withAutomaticReconnect()
                    .build();

                connection.on("MatchFound", (matchId) =>
                    router.push(`/match/${matchId}`)
                );

                connection
                    .start()
                    .then(() => console.log("Connected to SignalR"))
                    .catch((err) =>
                        console.error("SignalR connection error:", err)
                    );

                return connection;
            }}
        >
            {() => (
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
                            onClick={async () =>
                                queueMatchmaking(
                                    await getAccessToken(),
                                    timeControl[0] * 60,
                                    timeControl[1]
                                )
                            }
                        >
                            {`${timeControl[0]} | ${timeControl[1]}`}
                        </button>
                    ))}
                </div>
            )}
        </SignalRConnection>
    );
}
