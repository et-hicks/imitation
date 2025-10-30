import type { Metadata } from "next";
import SevodalGame from "./sevodal-game";

export const metadata: Metadata = {
  title: "Sevodal",
};

export default function SevodalPage() {
  return <SevodalGame />;
}

