import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Link from "next/link";
import { ConnectWalletTopRight } from "@/components/ConnectWalletTopRight";

export const metadata: Metadata = {
  title: "Fair Whistle Shield 🛡️",
  description: "Anonymous encrypted whistleblower system powered by FHEVM",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <Providers>
          {/* 顶部导航 */}
          <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-purple-100/50 dark:border-purple-900/30">
            <div className="max-w-screen-lg mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="font-bold text-lg text-gradient">Fair Whistle Shield</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Encrypted Reports</p>
                  </div>
                </Link>

                {/* 导航链接 */}
                <div className="flex items-center gap-2">
                  <Link
                    href="/"
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-300 flex items-center gap-2"
                  >
                    <span>📝</span>
                    <span className="hidden sm:inline">Report</span>
                  </Link>
                  <Link
                    href="/decrypt"
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-300 flex items-center gap-2"
                  >
                    <span>🔓</span>
                    <span className="hidden sm:inline">Decrypt</span>
                  </Link>
                </div>

                {/* 钱包连接 */}
                <ConnectWalletTopRight />
              </div>
            </div>
          </nav>

          {/* 主内容 */}
          <main className="max-w-screen-lg mx-auto px-4 py-8">
            {children}
          </main>

          {/* 页脚 */}
          <footer className="mt-auto py-8 border-t border-purple-100/50 dark:border-purple-900/30">
            <div className="max-w-screen-lg mx-auto px-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                🔐 Powered by <span className="text-gradient font-semibold">FHEVM</span> • Fully Homomorphic Encryption
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Your reports are encrypted end-to-end. Only authorized parties can decrypt.
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
