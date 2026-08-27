import "./globals.css";

export const metadata = {
  title: "Local Chat",
  description: "Khung chat cục bộ dùng Next.js + Tailwind",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="font-sans text-ink">{children}</body>
    </html>
  );
}
