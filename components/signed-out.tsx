"use client";

import dynamic from "next/dynamic";

export const ClientSignedOut = dynamic(() => import("./signed-out"), {
    ssr: false,
});

export default function SignedOut({ children }: { children: React.ReactNode }) {
    return !localStorage.getItem("accessToken") && children;
}
