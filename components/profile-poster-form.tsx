"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Camera, Check, Download, User } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  addDoc,
  collection,
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

const STEPS = [
  {
    id: "nom",
    title: "Quel est votre nom ?",
    subtitle: "Il apparaîtra sur le bandeau doré de votre affiche.",
  },
  {
    id: "tel",
    title: "Votre téléphone ?",
    subtitle: "Optionnel — pour être recontacté (WhatsApp).",
  },
  {
    id: "photo",
    title: "Ajoutez votre photo",
    subtitle: "Photo portrait de préférence — elle sera placée dans le cadre incliné.",
  },
  {
    id: "poster",
    title: "Votre affiche est prête",
    subtitle: "Enregistrez votre participation ou téléchargez l'affiche.",
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

  const [step, setStep] = useState(0)
  const [nom, setNom] = useState("")
  const [telephone, setTelephone] = useState("")
  const [showName, setShowName] = useState(true)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [templateReady, setTemplateReady] = useState(false)
  const [registrations, setRegistrations] = useState<Registration[]>([])

  const hasPhoto = photoRef.current !== null

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
    document.fonts.load('56px "Praise"').then(() => redraw()).catch(() => {})
    document.fonts.ready.then(() => redraw()).catch(() => {})
    fetchRegistrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nom, showName, step, photoPreview])

  const redraw = () => {
    if (!canvasRef.current || !templateRef.current) return
    renderPoster(canvasRef.current, templateRef.current, photoRef.current, nom, showName)
  }

  const fetchRegistrations = async () => {
    if (!isFirebaseConfigured || !db) return
    try {
      const q = query(collection(db, "registrations"), orderBy("createdAt", "desc"), limit(10))
      const snapshot = await getDocs(q)
      setRegistrations(
        snapshot.docs.map((doc) => ({ id: doc.id, nom: (doc.data().nom as string) || "—" }))
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
      setPhotoPreview(url)
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

  const handleSave = async () => {
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

  const canNext =
    step === 0 ? nom.trim() !== "" : step === 2 ? hasPhoto : step === 3 ? templateReady : true

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      handleSave()
    }
  }

  const inputClass =
    "w-full max-w-sm px-4 py-3 rounded-2xl border border-white/20 bg-white/5 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/50 transition-colors text-center"

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/kog.png"
          alt="Kingdom of Glory Ministry"
          className="w-20 h-20 sm:w-24 sm:h-24 mx-auto drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
        />
        <p className="text-white/50 text-xs mt-2 text-center">
          Vent de Gloire Supérieur — 29 sept au 04 oct 2026
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-white" : i < step ? "w-2 bg-white/60" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Title */}
      <div className="text-center mb-10 max-w-2xl px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{STEPS[step].title}</h1>
        <p className="text-white/60 text-sm sm:text-base">{STEPS[step].subtitle}</p>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full flex flex-col items-center"
        >
          {step === 0 && (
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canNext && handleNext()}
              placeholder="Ex : Marie Kouassi"
              autoComplete="name"
              autoFocus
              className={inputClass}
            />
          )}

          {step === 1 && (
            <input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              placeholder="Ex : +237 6 97 60 66 69"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              className={inputClass}
            />
          )}

          {step === 2 && (
            <div className="flex flex-col items-center gap-3">
              <label className="relative cursor-pointer group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Votre photo"
                    className="w-32 h-32 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-white/50 transition-colors">
                    <User className="w-10 h-10 text-white/40" />
                  </div>
                )}
                <div className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white text-[#050d1f] flex items-center justify-center shadow-lg">
                  <Camera className="w-4 h-4" />
                </div>
              </label>
              <p className="text-xs text-white/40">
                {photoPreview ? "Touchez pour changer de photo" : "Touchez pour choisir une photo"}
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-4 w-full px-4">
              {!templateReady && (
                <p className="text-white/60 text-sm animate-pulse">Chargement du template…</p>
              )}
              <canvas
                ref={canvasRef}
                className={`w-full max-w-[320px] sm:max-w-[380px] rounded-lg shadow-2xl ${templateReady ? "" : "opacity-0 h-0"}`}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showName"
                  checked={showName}
                  onCheckedChange={(checked) => setShowName(checked === true)}
                />
                <Label htmlFor="showName" className="font-normal text-white/80 text-sm">
                  Afficher mon nom sur l'affiche
                </Label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={!templateReady}
                  className="px-4 py-2.5 rounded-full text-sm font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  <Download className="w-4 h-4" />
                  PNG
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={!templateReady}
                  className="px-4 py-2.5 rounded-full text-sm font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Status */}
      {status && (
        <p
          className={`mt-6 text-sm text-center px-4 ${
            status.type === "error"
              ? "text-red-400"
              : status.type === "success"
                ? "text-green-400"
                : "text-white/60"
          }`}
        >
          {status.text}
        </p>
      )}

      {/* Footer buttons */}
      <div className="mt-12 flex flex-col items-center gap-4">
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-full text-sm font-medium text-white/60 hover:text-white border border-white/20 hover:border-white/40 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext || isSaving}
            className="px-6 py-3 rounded-full text-sm font-bold bg-white text-[#050d1f] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-40 disabled:hover:scale-100"
          >
            {isSaving ? (
              "Enregistrement..."
            ) : step < STEPS.length - 1 ? (
              <>
                Suivant
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Enregistrer
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inscrits */}
      {registrations.length > 0 && (
        <p className="mt-10 text-xs text-white/40 text-center px-4">
          Déjà inscrits : {registrations.map((r) => r.nom).join(" · ")}
        </p>
      )}
    </div>
  )
}
