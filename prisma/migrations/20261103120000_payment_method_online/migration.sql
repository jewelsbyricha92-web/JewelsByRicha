-- New orders use a single online payment method (Razorpay offers UPI / cards / netbanking itself).
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'ONLINE';
