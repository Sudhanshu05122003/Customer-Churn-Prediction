import './globals.css';
import AppLayout from '@/components/Layout';

export const metadata = {
  title: 'ChurnSense | Sense The Churn',
  description: 'AI-powered customer churn analysis and explainability.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}

