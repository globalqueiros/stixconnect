'use client';
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { GoogleAnalytics } from "@next/third-parties/google";
import Bloqueio from "../app/components/Bloqueio/page";
import Libra from "../app/components/Libras/page";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="copyright" content="Copyright (c) Corporation Global Queirós" />
        <meta name="theme-color" content="#10c4b5" />
        <title>Stixconnect | Stixmed</title>
        <link rel="canonical" href="https://stixconnect.stixmed.med.br/" />
        <meta name="author" content="Time Corporation Global Queirós" />
        <meta name="robots" content="no-index, no-follow" />
        <meta name="googlebot" content="no-index, no-follow" />
        <meta name="bingbot" content="no-index, no-follow" />
        <link rel="dns-prefetch" href="https://www.stixmed.med.br" />
        <link rel="dns-prefetch" href="https://ssl.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://v2.zopim.com" />
        <link rel="dns-prefetch" href="https://www.facebook.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body>
        <SessionProvider>
          <Libra />
          <Bloqueio />
          {children}
          <GoogleAnalytics gaId="G-BVVT8LYMPM" />
        </SessionProvider>
      </body>
    </html>
  );
}