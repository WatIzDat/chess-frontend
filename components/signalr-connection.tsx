import { HubConnection } from "@microsoft/signalr";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export default function SignalRConnection({
    children,
    connectionProvider,
    connection,
    setConnection,
}: {
    children: (connection?: HubConnection) => React.ReactNode;
    connectionProvider: () => HubConnection;
    connection?: HubConnection | null;
    setConnection?: Dispatch<SetStateAction<HubConnection | null>>;
}) {
    // const [connection, setConnection] = useState<HubConnection | null>(null);

    useEffect(() => {
        const connection: HubConnection = connectionProvider();

        if (setConnection) {
            console.log(connection);
            setConnection(connection);
        }
    }, []);

    return children(connection ? connection : undefined);
}
