import { redirect } from 'next/navigation';

export default function SignupRootPage() {
  redirect('/auth/signup/customer');
}
