import "./globals.css";

export const metadata = {
  title: "AURA Workspace | Primelisometrics Consultancy",
  description: "Engineering Productivity Platform — Manage deliverables, quotations, invoices, and project workflows.",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0B0B0C" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>

  );
}
