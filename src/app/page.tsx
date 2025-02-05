"use client";

// Components
import AuthWrapper from "@/components/AuthWrapper";

// hooks
import useWebSocket from "@/hooks/useWebSocket";

export default function Home() {
  const { socketInstance } = useWebSocket();

  return <AuthWrapper socket={socketInstance} />;
}

Home.displayName = "Home";
