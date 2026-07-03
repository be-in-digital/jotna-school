import type { Metadata, Viewport } from "next";
import { Poppins, Geist_Mono, Fredoka } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { AnalyticsProvider } from "@/components/analytics-provider";

const poppins = Poppins({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// D16 — display font for kid surfaces (h1/h2 in /student/*).
// Variable axis = weight; only Latin subset (~40kb gzip).
const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Jotna School - Apprends en t'amusant",
  description:
    "Plateforme educative gamifiee pour apprendre les matieres scolaires avec des exercices interactifs, des badges et un suivi parental.",
  // PWA — installable sur l'écran d'accueil (Android/iOS)
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icon-192.png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Jotna",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#F59E0B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${poppins.variable} ${geistMono.variable} ${fredoka.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <AnalyticsProvider />
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
