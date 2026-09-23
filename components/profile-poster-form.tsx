"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
  const [hasPhoto, setHasPhoto] = useState(false)
  const [status, setStatus] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [registrations, setRegistrations] = useState<Registration[]>([])

  useEffect(() => {
    // Convertit le PDF template en image cote client (repli sur le PNG)
    loadTemplateFromPdf(TEMPLATE_PDF)
      .catch(() => loadImage(TEMPLATE_SRC))
      .then((template) => {
        templateRef.current = template
        redraw()
      })
      .catch((err) => {
        console.error("Impossible de charger le template", err)
        setStatus({ type: "error", text: "Le template n'a pas pu être chargé." })
      })
    // Re-dessine quand la police "Praise" est chargee
    document.fonts.load('56px "Praise"').then(() => redraw()).catch(() => {})
    document.fonts.ready.then(() => redraw()).catch(() => {})

    fetchRegistrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nom, showName, hasPhoto])

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
      setHasPhoto(true)
      setStatus(null)
    })
  }

  const slug = () => nom.trim().replace(/\s+/g, "-").toLowerCase() || "affiche"

  const handleDownloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasPhoto) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `je-serai-la-${slug()}.png`
      a.click()
      URL.revokeObjectURL(url)
    }, "image/png")
  }

  const handleDownloadPdf = async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasPhoto) return
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
      setStatus({ type: "error", text: "Ajoutez votre photo pour générer l'affiche." })
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
        text: `Inscription enregistrée dans Firebase (réf. ${docRef.id}).`,
      })
      fetchRegistrations()
    } catch (err) {
      console.error(err)
      setStatus({ type: "error", text: "Erreur lors de l'enregistrement. Réessayez." })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2 items-start px-1 sm:px-0">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Enregistrez votre participation</CardTitle>
            <p className="text-sm text-muted-foreground">
              Remplissez le formulaire, ajoutez votre photo et repartez avec votre affiche personnalisée.
            </p>
          </CardHeader>
          <form onSubmit={handleSave}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom complet :</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex : Marie Kouassi"
                  autoComplete="name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="telephone">Téléphone / WhatsApp :</Label>
                <Input
                  id="telephone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Ex : +225 07 00 00 00 00"
                />
              </div>
              <div>
                <Label htmlFor="photo">Votre photo :</Label>
                <Input
                  id="photo"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  required={!hasPhoto}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Photo portrait de préférence — elle sera ajustée au cadre.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showName"
                  checked={showName}
                  onCheckedChange={(checked) => setShowName(checked === true)}
                />
                <Label htmlFor="showName" className="font-normal">
                  Afficher mon nom sur l'affiche
                </Label>
              </div>
              {status && (
                <p
                  className={`text-sm ${
                    status.type === "error"
                      ? "text-red-500"
                      : status.type === "success"
                        ? "text-green-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {status.text}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" disabled={isSaving || !hasPhoto} className="w-full">
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadPng}
                  disabled={!hasPhoto}
                  className="flex-1"
                >
                  PNG
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={!hasPhoto}
                  className="flex-1"
                >
                  PDF
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {registrations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inscrits dans Firebase</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {registrations.map((r) => (
                  <li key={r.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    {r.nom}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-2 md:sticky md:top-6">
        <h2 className="text-sm font-medium text-center text-white/80">Aperçu de votre affiche</h2>
        <canvas ref={canvasRef} className="w-full rounded-lg shadow-2xl" />
        {!hasPhoto && (
          <p className="text-xs text-center text-white/50">
            Ajoutez une photo pour voir le résultat dans le cadre
          </p>
        )}
      </div>
    </div>
  )
}
