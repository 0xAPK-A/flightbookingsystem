'use client'
import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) return;

      try {
        const res = await fetch(`http://localhost:5001/api/auth/verify?token=${token}`);
        const data = await res.json();

        alert(data.message);
        // Optionally redirect to login
        router.push('/login');
      } catch (err) {
        console.error(err);
        alert("Verification failed.");
      }
    };

    verifyEmail();
  }, [token]);

  return <p>Verifying your email...</p>;
}
