import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalVoiceWidget } from "@/app/components/GlobalVoiceWidget";
import { getSession } from "@/app/lib/dal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Senacor Bank",
  description: "Wir gestalten die Bank der Zukunft – digital, fair und immer nah am Menschen.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* GlobalVoiceWidget is always mounted so the WebRTC connection
            survives client-side navigation between pages */}
        <GlobalVoiceWidget userName={session?.name} />
      </body>
    </html>
  );
}
