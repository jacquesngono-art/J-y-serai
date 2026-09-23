import ProfilePosterForm from "@/components/profile-poster-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050d1f] py-6 sm:py-10 px-3 sm:px-4">
      <header className="text-center mb-6 sm:mb-8">
        <img
          src="/kog.png"
          alt="Kingdom of Glory Ministry"
          className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-3 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
        />
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white italic">Je Serai là</h1>
        <p className="text-white/70 mt-2 text-sm sm:text-base">
          Vent de Gloire Supérieur — du 29 sept au 04 oct 2026
        </p>
      </header>
      <ProfilePosterForm />
    </main>
  )
}
