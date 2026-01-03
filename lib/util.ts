import { DateTime } from "luxon";

export async function getAccessToken() {
    const expirationMillis: string | null = localStorage.getItem(
        "tokenExpirationDate"
    );

    if (!expirationMillis) {
        return null;
    }

    const tokenExpirationDate: DateTime = DateTime.fromMillis(
        Number.parseInt(expirationMillis)
    );

    if (DateTime.utc() <= tokenExpirationDate.minus({ minutes: 1 })) {
        return localStorage.getItem("accessToken");
    }

    const response = await fetch("http://localhost:5075/refresh", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            refreshToken: localStorage.getItem("refreshToken"),
        }),
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem(
        "tokenExpirationDate",
        DateTime.utc().plus({ seconds: data.expiresIn }).toMillis().toString()
    );

    return data.accessToken;
}
