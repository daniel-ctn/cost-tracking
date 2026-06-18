import { signupRequiresInviteCode } from '@/lib/auth'
import { SignupForm } from '@/components/signup-form'

export default function SignupPage() {
  return <SignupForm requiresInviteCode={signupRequiresInviteCode} />
}
