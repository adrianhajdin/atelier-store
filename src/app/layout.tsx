import type { Metadata } from "next";
import { Archivo, EB_Garamond } from "next/font/google";
import "./globals.css";

/* Display voice: a Garamond-lineage old-style serif, the closest open
   counterpart to the Granjon-style wordmarks fashion houses use. */
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  display: "swap",
});

/* Interface voice: a grotesque that holds its shape at 11–13px and takes
   wide tracking cleanly in capitals — nav, buttons, prices, forms. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Atelier",
    template: "%s | Atelier",
  },
  description: "Ready-to-wear, leather goods and accessories.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${ebGaramond.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="bg-paper text-graphite flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
