export const metadata = {
  title: 'Dashboard | Senacor VoiceLive',
  description: 'Real-time event pipeline dashboard',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f3f0f9] font-sans">
      {children}
    </div>
  )
}
