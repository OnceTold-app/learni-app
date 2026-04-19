import ChildHeader from '@/components/child-header'

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChildHeader />
      {children}
    </>
  )
}
