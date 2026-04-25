// Geist Sans + Geist Mono via next/font/google. This matches the
// Fumadocs design identity (https://fumadocs.dev). The CSS variables
// `--font-sans` and `--font-mono` are referenced from theme.css and
// from the Tailwind preset's fontFamily extension.
//
// Usage in app/layout.tsx:
//
//   import { geistSans, geistMono } from '@/theme/fonts';
//
//   export default function RootLayout({ children }) {
//     return (
//       <html
//         lang="en"
//         className={`${geistSans.variable} ${geistMono.variable}`}
//       >
//         <body className="font-sans antialiased bg-surface text-body">
//           {children}
//         </body>
//       </html>
//     );
//   }
import { Geist, Geist_Mono } from 'next/font/google';

export const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
