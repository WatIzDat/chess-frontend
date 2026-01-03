"use client";

import { logIn } from "@/lib/actions";
import { DateTime } from "luxon";
import { useActionState, useEffect } from "react";

export default function Login() {
    const [state, formAction, pending] = useActionState(logIn, {
        success: false,
        message: "",
    });

    useEffect(() => {
        if (state?.success) {
            console.log(state.data.accessToken);
            localStorage.setItem("accessToken", state.data.accessToken);
            localStorage.setItem("refreshToken", state.data.refreshToken);
            localStorage.setItem(
                "tokenExpirationDate",
                DateTime.now()
                    .plus({ seconds: state.data.expiresIn })
                    .toMillis()
                    .toString()
            );
        }
    }, [state]);

    return (
        <>
            <h1 className="text-9xl font-black">Login</h1>
            <form
                className="grid grid-cols-2 text-4xl gap-8"
                action={formAction}
            >
                <label className="self-center" htmlFor="email">
                    Email:
                </label>
                <input
                    className="bg-white rounded-2xl p-4"
                    id="email"
                    name="email"
                    type="email"
                />
                <label className="self-center" htmlFor="password">
                    Password:
                </label>
                <input
                    className="bg-white rounded-2xl p-4"
                    id="password"
                    name="password"
                    type="password"
                />
                {state?.message && (
                    <p aria-live="polite" className="col-span-2 text-center">
                        {state.message}
                    </p>
                )}
                <button
                    className="col-span-2 bg-white p-4 w-1/2 justify-self-center rounded-4xl"
                    type="submit"
                    disabled={pending}
                >
                    Log In
                </button>
            </form>
        </>
    );
}
