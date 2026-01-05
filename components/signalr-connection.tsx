import { HubConnection } from "@microsoft/signalr";
import { useEffect, useState } from "react";

export default function SignalRConnection({
    children,
    connectionProvider,
}: {
    children: (connection?: HubConnection) => React.ReactNode;
    connectionProvider: () => HubConnection;
}) {
    const [connection, setConnection] = useState<HubConnection | null>(null);

    useEffect(() => {
        setConnection(connectionProvider());
    }, []);

    return children(connection ? connection : undefined);
}
