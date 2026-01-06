import { HubConnection } from "@microsoft/signalr";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export default function SignalRConnection({
    children,
    connectionProvider,
    connection,
    setConnection,
}: {
    children: (connection?: HubConnection) => React.ReactNode;
    connectionProvider: () => Promise<HubConnection>;
    connection?: HubConnection | null;
    setConnection?: (connection: HubConnection | null) => void;
}) {
    // const [connection, setConnection] = useState<HubConnection | null>(null);

    useEffect(() => {
        (async () => {
            const connection: HubConnection = await connectionProvider();

            if (setConnection) {
                console.log(connection);
                setConnection(connection);
            }
        })();
    }, []);

    return children(connection ? connection : undefined);
}
