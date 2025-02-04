'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import queryClient from '../queryClient';
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

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
   <html lang="en">
     <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
       <QueryClientProvider client={queryClient}>
         {children}
         <Toaster 
           position="top-right"
           toastOptions={{
             duration: 4000,
             success: {
               className: 'bg-green-50 border border-green-200',
               iconTheme: {
                 primary: '#10B981',
                 secondary: '#ffffff',
               }
             },
             error: {
               className: 'bg-red-50 border border-red-200',
               iconTheme: {
                 primary: '#EF4444',
                 secondary: '#ffffff',
               }
             }
           }}
         />
       </QueryClientProvider>
     </body>
   </html>
 );
}