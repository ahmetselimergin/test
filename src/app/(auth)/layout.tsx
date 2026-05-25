export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, rgb(10, 10, 15) 70%)',
      }}
    >
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">FT</span>
            </div>
            <span className="font-semibold text-xl">FlowTrack</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
