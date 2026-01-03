export default function Home() {
    return (
        <main className="flex items-center justify-center flex-col gap-12 text-center h-screen">
            <h1 className="text-9xl font-black">Login</h1>
            <form className="grid grid-cols-2 text-4xl gap-8">
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
                <button
                    className="col-span-2 bg-white p-4 w-1/2 justify-self-center rounded-4xl"
                    type="submit"
                >
                    Log In
                </button>
            </form>
        </main>
    );
}
