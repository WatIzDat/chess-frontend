"use client";

export default function SignedOut({ children }: { children: React.ReactNode }) {
    return !localStorage.getItem("accessToken") && children;
}
