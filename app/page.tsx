import Image from "next/image";
// import { SignedOut, SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex items-center gap-4">
        <Image
      src="/billiard_logo.jpg"
      width={300}
      height={300}
      alt="Picture of the author"
    />
          
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        {/* You can add footer content here */}
      </footer>
    </div>
  );
}
/* test */