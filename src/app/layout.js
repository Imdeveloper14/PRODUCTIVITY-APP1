import "./globals.css";

export const metadata = {
  title: "AURA Workspace — Premium Freelancer OS",
  description: "Secure, responsive CAD design productivity dashboard and AI-driven workflow assistant.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
