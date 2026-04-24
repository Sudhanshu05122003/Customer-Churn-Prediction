import './globals.css';
import AppLayout from '@/components/Layout';

export const metadata = {
  title: 'ChurnSense | Sense The Churn',
  description: 'AI-powered customer churn analysis and explainability.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
