import './globals.css';
import AppLayout from '@/components/Layout';

export const metadata = {
  title: 'ChurnSense | Premium Churn Prediction',
  description: 'AI-powered customer churn analysis and explainability.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
