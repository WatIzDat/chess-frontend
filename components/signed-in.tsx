"use client";

export default function SignedIn({ children }: { children: React.ReactNode }) {
    return localStorage.getItem("accessToken") && children;
}
