import "./globals.css";

export const metadata = {
  title: "AURA Workspace | Primelisometrics Consultancy",
  description: "Secure, responsive CAD design productivity dashboard and AI-driven workflow assistant.",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>

  );
}
