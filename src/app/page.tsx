// Landing page — to be built in Phase 3
// For now redirects to signup

import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/signup')
}
