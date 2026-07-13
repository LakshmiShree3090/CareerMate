function AuthLayout({ children, title, subtitle }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="mb-2 text-sm font-semibold text-primary">CareerMate</p>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        {children}
      </section>
    </main>
  )
}

export default AuthLayout
