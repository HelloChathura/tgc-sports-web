"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

const ClientRedirect = () => {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname(); 

  useEffect(() => {

    if (isSignedIn && (pathname === "/" || pathname === "/signin")) {
      router.push("/dashboard");
    }
  }, [isSignedIn, pathname, router]);

  return null;
};

export default ClientRedirect;


