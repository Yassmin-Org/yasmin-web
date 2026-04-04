import { Geist } from "next/font/google";
import "../globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pay with Yasmin",
  description: "Secure payment powered by Yasmin",
};

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full items-center justify-center bg-gray-50 p-4">
        {children}
      </body>
    </html>
  );
}
