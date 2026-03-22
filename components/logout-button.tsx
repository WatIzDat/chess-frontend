"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    return (
        <button
            className="text-4xl"
            onClick={() => {
                localStorage.clear();
                router.push("/");
            }}
        >
            Log Out
        </button>
    );
}
