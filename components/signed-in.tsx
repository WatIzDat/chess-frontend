"use client";

import dynamic from "next/dynamic";

export const ClientSignedIn = dynamic(() => import("./signed-in"), {
    ssr: false,
});

export default function SignedIn({ children }: { children: React.ReactNode }) {
    return localStorage.getItem("accessToken") && children;
}
