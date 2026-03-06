import { Navigate } from 'react-router';

export default function SubscriptionPurchase() {
  return <Navigate to="/subscription" replace state={{ scrollToExtend: true }} />;
}
