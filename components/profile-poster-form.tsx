"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import {
  Camera,
  Download,
  FileDown,
  Heart,
  ImagePlus,
  Share2,
} from "lucide-react"
import {
  addDoc,
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { db, storage, isFirebaseConfigured } from "@/lib/firebase"
import {
  loadImage,
  loadTemplateFromPdf,
  renderPoster,
  TEMPLATE_PDF,
  TEMPLATE_SRC,
} from "@/lib/poster"

const HOW_TO = [
  {
    icon: ImagePlus,
    title: "Charger une photo",
    text: 'Cliquez sur "Choisir" pour sélectionner une photo selon vos préférences.',
  },
  {
    icon: Download,
    title: "Télécharger votre affiche",
    text: "Après avoir ajusté votre photo, procédez au téléchargement de votre affiche.",
  },
  {
    icon: Share2,
    title: "Partager votre image",
    text: "Affichez fièrement votre image sur vos réseaux préférés.",
  },
]

interface Registration {
  id: string
  nom: string
}

export default function ProfilePosterForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const templateRef = useRef<CanvasImageSource | null>(null)
  const photoRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nom, setNom] = useState("")
  const [telephone, setTelephone] = useState("")
  const [showName, setShowName] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [hasPhoto, setHasPhoto] = useState(false)
  const [templateReady, setTemplateReady] = useState(false)
  const [status, setStatus] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [registrations, setRegistrations] = useState<Registration[]>([])

  useEffect(() => {
    // PNG d'abord (leger), le PDF 38 Mo sert de repli
    loadImage(TEMPLATE_SRC)
      .catch(() => loadTemplateFromPdf(TEMPLATE_PDF))
      .then((template) => {
        templateRef.current = template
        setTemplateReady(true)
        redraw()
      })
      .catch((err) => {
        console.error("Impossible de charger le template", err)
        setStatus({ type: "error", text: "Le template n'a pas pu être chargé." })
      })
    document.fonts.ready.then(() => redraw()).catch(() => {})
    fetchRegistrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nom, showName, zoom, hasPhoto, templateReady])

  const redraw = () => {
    if (!canvasRef.current || !templateRef.current) return
    renderPoster(canvasRef.current, templateRef.current, photoRef.current, nom, showName, zoom)
  }

  const fetchRegistrations = async () => {
    if (!isFirebaseConfigured || !db) return
    try {
      const [countSnap, listSnap] = await Promise.all([
        getCountFromServer(collection(db, "registrations")),
        getDocs(query(collection(db, "registrations"), orderBy("createdAt", "desc"), limit(10))),
      ])
      setTotalCount(countSnap.data().count)
      setRegistrations(
        listSnap.docs.map((doc) => ({ id: doc.id, nom: (doc.data().nom as string) || "—" }))
      )
    } catch (err) {
      console.error("Lecture Firestore impossible", err)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setStatus({ type: "error", text: "Veuillez choisir un fichier image." })
      return
    }
    const url = URL.createObjectURL(file)
    loadImage(url).then((img) => {
      photoRef.current = img
      setHasPhoto(true)
      setStatus(null)
    })
  }

  const slug = () => nom.trim().replace(/\s+/g, "-").toLowerCase() || "affiche"

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPng = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) downloadBlob(blob, `je-serai-la-${slug()}.png`)
    }, "image/png")
  }

  const handleDownloadPdf = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { jsPDF } = await import("jspdf")
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [1080, 1080],
      hotfixes: ["px_scaling"],
    })
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 1080, 1080)
    pdf.save(`je-serai-la-${slug()}.pdf`)
  }

  const canvasToBlob = (): Promise<Blob | null> =>
    new Promise((resolve) => canvasRef.current?.toBlob(resolve, "image/png"))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasPhoto) {
      setStatus({ type: "error", text: "Ajoutez d'abord votre photo." })
      return
    }
    if (!nom.trim()) {
      setStatus({ type: "error", text: "Entrez votre nom pour l'affiche." })
      return
    }
    if (!isFirebaseConfigured || !db || !storage) {
      setStatus({
        type: "info",
        text: "Firebase n'est pas encore configuré. Téléchargez votre affiche en attendant.",
      })
      return
    }

    setIsSaving(true)
    setStatus(null)
    try {
      const blob = await canvasToBlob()
      if (!blob) throw new Error("Impossible de générer l'image")

      const storageRef = ref(storage, `posters/${Date.now()}-${slug()}.png`)
      await uploadBytes(storageRef, blob, { contentType: "image/png" })
      const posterUrl = await getDownloadURL(storageRef)

      const docRef = await addDoc(collection(db, "registrations"), {
        nom: nom.trim(),
        telephone: telephone.trim(),
        posterUrl,
        createdAt: serverTimestamp(),
      })

      setStatus({
        type: "success",
        text: `Inscription enregistrée (réf. ${docRef.id}).`,
      })
      fetchRegistrations()
    } catch (err) {
      console.error(err)
      setStatus({ type: "error", text: "Erreur lors de l'enregistrement. Réessayez." })
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <img src="/kog.png" alt="KOG" className="w-9 h-9 object-contain" />
            <span className="font-bold text-lg">Je Serai là</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#preview" className="hover:text-emerald-600 transition-colors">Accueil</a>
            <a href="#howto" className="hover:text-emerald-600 transition-colors">Comment ça marche</a>
            <a href="#organizer" className="hover:text-emerald-600 transition-colors">Organisateur</a>
          </nav>
          <a
            href="#infos"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            S'inscrire
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* ── Colonne principale : preview ── */}
          <section id="preview" className="space-y-5">
            <div className="bg-[#f6f7f9] rounded-2xl p-4 sm:p-6">
              {templateReady ? (
                <canvas ref={canvasRef} className="w-full rounded-xl shadow-lg" />
              ) : (
                <div className="aspect-square flex items-center justify-center text-gray-400 text-sm animate-pulse">
                  Chargement du template…
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
            </div>

            {/* Slider zoom */}
            <div className="px-2">
              <input
                type="range"
                min={1}
                max={2}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                disabled={!hasPhoto}
                aria-label="Zoom de la photo"
                className="w-full accent-emerald-600 disabled:opacity-40"
              />
            </div>

            {/* Boutons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <ImagePlus className="w-4 h-4" />
                Choisir
              </button>
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={!hasPhoto || !templateReady}
                className="px-4 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            </div>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!hasPhoto || !templateReady}
              className="w-full text-center text-xs text-gray-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <FileDown className="w-3.5 h-3.5" />
              Télécharger en PDF
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />

            {/* Stats */}
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-emerald-600 font-medium">
                {totalCount} affiche{totalCount > 1 ? "s" : ""} réalisée{totalCount > 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5 text-gray-500">
                {registrations.length}
                <Heart className="w-4 h-4 fill-gray-900 text-gray-900" />
              </span>
            </div>

            {status && (
              <p
                className={`text-sm px-1 ${
                  status.type === "error"
                    ? "text-red-500"
                    : status.type === "success"
                      ? "text-emerald-600"
                      : "text-gray-500"
                }`}
              >
                {status.text}
              </p>
            )}

            {/* Description */}
            <div className="bg-[#f6f7f9] rounded-2xl p-5 sm:p-6 space-y-2">
              <h2 className="text-emerald-600 font-medium">Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Vent de Gloire Supérieur — Kingdom of Glory Ministries International fête ses{" "}
                <strong>5 ans</strong>. Du 29 septembre au 04 octobre 2026, 7 jours de programmes :
                Festival de la Parole. Ekie green oil (Carrefour non glacé) &amp; Nkolnda, à 100m du
                carrefour en face de l'hôtel le rafia. Infoline : 697606669 / 657786611.
              </p>
              {registrations.length > 0 && (
                <p className="text-xs text-gray-400 pt-1">
                  Déjà inscrits : {registrations.map((r) => r.nom).join(" · ")}
                </p>
              )}
            </div>
          </section>

          {/* ── Aside ── */}
          <aside className="space-y-6">
            {/* Comment réaliser */}
            <div id="howto" className="bg-[#f6f7f9] rounded-2xl p-5 sm:p-6 space-y-5">
              <h2 className="text-emerald-600 font-medium">Comment réaliser votre affiche</h2>
              {HOW_TO.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-[#052e1f] text-emerald-400 flex items-center justify-center">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Vos informations */}
            <form
              id="infos"
              onSubmit={handleSave}
              className="bg-[#f6f7f9] rounded-2xl p-5 sm:p-6 space-y-4"
            >
              <h2 className="text-emerald-600 font-medium">Vos informations</h2>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom complet"
                autoComplete="name"
                className={inputClass}
              />
              <input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Téléphone / WhatsApp (optionnel)"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={inputClass}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showName}
                  onChange={(e) => setShowName(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                Afficher mon nom sur l'affiche
              </label>
              <button
                type="submit"
                disabled={isSaving || !templateReady}
                className="w-full px-4 py-3.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>

            {/* Organisateur */}
            <div id="organizer" className="bg-[#f6f7f9] rounded-2xl p-5 sm:p-6 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Organisateur :{" "}
                <span className="font-bold text-emerald-600">
                  Kingdom of Glory Ministries International
                </span>
              </p>
              <img src="/kog.png" alt="KOG" className="w-20 h-20 object-contain mx-auto" />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
