"use server";

import { z } from "zod";

const Login = z.object({
    email: z.email(),
    password: z.string(),
});

export async function logIn(prevState: any, formData: FormData) {
    const validation = Login.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!validation.success) {
        return {
            success: false,
            message: validation.error.issues[0].message + ".",
        };
    }

    const loginRes = await fetch("http://localhost:5075/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: validation.data.email,
            password: validation.data.password,
        }),
    });

    if (!loginRes.ok) {
        console.log(loginRes.status);
        return {
            success: false,
            message:
                loginRes.status === 401
                    ? "Email or password was incorrect."
                    : "Login failed.",
        };
    }

    const data = await loginRes.json();

    return { success: true, data: data };
}

export async function queueMatchmaking(
    accessToken: string,
    initialTimeSeconds: number,
    incrementTimeSeconds: number,
    useDelay?: boolean
) {
    // const connection = new signalR.HubConnectionBuilder()
    //     .withUrl("http://localhost:5075/matchmakingHub", {
    //         accessTokenFactory: getAccessToken,
    //     })
    //     .withAutomaticReconnect()
    //     .build();

    // connection.on("MatchFound", (matchId) => redirect(`/match/${matchId}`));

    const response = await fetch("http://localhost:5075/queue", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            InitialTimeSeconds: initialTimeSeconds,
            IncrementTimeSeconds: incrementTimeSeconds,
            UseDelay: useDelay,
        }),
    });

    if (!response.ok) {
        return {
            message:
                response.status === 400
                    ? await response.json()
                    : "Queue failed, maybe try again later.",
        };
    }
}
