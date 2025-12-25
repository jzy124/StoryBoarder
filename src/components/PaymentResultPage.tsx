import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

// This component handles both success and cancellation scenarios
export const PaymentResultPage: React.FC = () => {
  const location = useLocation();
  const isSuccess = location.pathname.includes('success');

  // Optional: If successful, you can trigger a user info refresh 
  // to ensure the points balance is updated immediately.
  useEffect(() => {
    if (isSuccess) {
      // You can call a function here to refetch user information.
      // e.g., props.onPaymentSuccess();
      console.log("Payment successful, refreshing user profile...");
    }
  }, [isSuccess]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
    }}>
      {isSuccess ? (
        <div style={{ textAlign: 'center', color: '#2e7d32' }}>
          <h1 style={{ fontSize: '48px' }}>✅</h1>
          <h1>Payment Successful!</h1>
          <p>Thank you for your purchase. Credits have been added to your account.</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#c62828' }}>
          <h1 style={{ fontSize: '48px' }}>❌</h1>
          <h1>Payment Canceled</h1>
          <p>Your payment process was canceled. You have not been charged.</p>
        </div>
      )}
      <Link to="/" style={{ marginTop: '20px', textDecoration: 'none', backgroundColor: '#007bff', color: 'white', padding: '10px 20px', borderRadius: '5px' }}>
        Back to Home
      </Link>
    </div>
  );
};