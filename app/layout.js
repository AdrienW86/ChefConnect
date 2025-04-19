import { UserProvider } from "./Context/UserContext";  // Assume that UserContext is in the context folder
import { RestaurantProvider } from "./Context/RestaurantContext";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ChefConnect",
  description: "Votre restaurant connecté",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <UserProvider>   {/* Intégration du UserContext */}
          <RestaurantProvider>  {/* RestaurantContext */}
            {children}
          </RestaurantProvider>        
        </UserProvider>
      </body>
    </html>
  );
}
