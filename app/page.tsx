import Login from "@/components/login";
import QuickPlayList from "@/components/quick-play-list";
import SignedIn from "@/components/signed-in";
import SignedOut from "@/components/signed-out";
import { queueMatchmaking } from "@/lib/actions";

export default function Home() {
    return (
        <main className="flex items-center justify-center flex-col gap-12 text-center h-screen">
            <SignedOut>
                <Login />
            </SignedOut>
            <SignedIn>
                <h1 className="text-9xl font-black">Welcome!</h1>
                <h2 className="text-5xl w-1/3 text-left">Quick Play</h2>
                <QuickPlayList />
            </SignedIn>
        </main>
    );
}
