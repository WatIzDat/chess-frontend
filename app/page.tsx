import Login from "@/components/login";
import QuickPlayList from "@/components/quick-play-list";
import { ClientSignedIn } from "@/components/signed-in";
import { ClientSignedOut } from "@/components/signed-out";

export default function Home() {
    return (
        <main className="flex items-center justify-center flex-col gap-12 text-center h-screen">
            <ClientSignedOut>
                <Login />
            </ClientSignedOut>
            <ClientSignedIn>
                <h1 className="text-9xl font-black">Welcome!</h1>
                <h2 className="text-5xl w-1/3 text-left">Quick Play</h2>
                <QuickPlayList />
            </ClientSignedIn>
        </main>
    );
}
