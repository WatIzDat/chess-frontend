"use client";

import { logIn, register } from "@/lib/actions";
import { DateTime } from "luxon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export default function Login({ type }: { type: "login" | "register" }) {
    const [state, formAction, pending] = useActionState(
        type === "login" ? logIn : register,
        {
            success: false,
            message: "",
        },
    );

    const router = useRouter();

    useEffect(() => {
        if (state?.success) {
            if (type === "login") {
                localStorage.setItem("accessToken", state.data.accessToken);
                localStorage.setItem("refreshToken", state.data.refreshToken);
                localStorage.setItem(
                    "tokenExpirationDate",
                    DateTime.utc()
                        .plus({ seconds: state.data.expiresIn })
                        .toMillis()
                        .toString(),
                );
                window.location.reload();
            } else {
                router.push("/");
            }
        }
    }, [state]);

    return (
        <>
            <h1 className="text-9xl font-black">
                {type === "login" ? "Login" : "Register"}
            </h1>
            <p className="text-4xl">
                or{" "}
                {type === "login" ? (
                    <Link href="/register">Register</Link>
                ) : (
                    <Link href="/">Log In</Link>
                )}
            </p>
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
                    {type === "login" ? "Log In" : "Register"}
                </button>
            </form>
        </>
    );
}
