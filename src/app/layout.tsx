import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALTERNATIVE TIMELINE DETECTION SYSTEM | TVA TEMPORAL TERMINAL",
  description: "Historical Counterfactual Explorer - TVA Alternative Timeline Detection System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#0b0807] text-[#e8c89b] font-mono selection:bg-[#d97706]/30 selection:text-[#fff4e0]">
        {children}
      </body>
    </html>
  );
}
