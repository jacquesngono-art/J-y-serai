// Dimensions du template "Je Serai là" (1080x1080)
export const TEMPLATE_PDF = "/template.pdf"
export const TEMPLATE_SRC = "/template.png"
export const POSTER_SIZE = 1080

// Cadre photo du template : rectangle incline (-5,5 deg)
// coin haut-gauche + dimensions dans le repere tourne
export const PHOTO_FRAME = {
  x: 50,
  y: 277,
  width: 427,
  height: 601,
  angle: -0.0958, // rad (~ -5.5 deg)
}

// Zone du nom : bandeau dore (partie lumineuse)
export const NAME_ZONE = {
  x: 584,
  y: 626,
  width: 436,
  height: 114,
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Charge la 1ere page du PDF template et la rend dans un canvas (1080x1080)
export async function loadTemplateFromPdf(url: string): Promise<HTMLCanvasElement> {
  const pdfjs = await import("pdfjs-dist")

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()

  const doc = await pdfjs.getDocument(url).promise
  const page = await doc.getPage(1)

  const baseViewport = page.getViewport({ scale: 1 })
  const scale = POSTER_SIZE / baseViewport.width
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement("canvas")
  canvas.width = POSTER_SIZE
  canvas.height = POSTER_SIZE
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D indisponible")

  await page.render({ canvas, canvasContext: ctx, viewport }).promise
  await doc.destroy()

  return canvas
}

// Dessine la photo en mode "cover" dans le cadre incline du template
function drawPhotoCover(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  frame: typeof PHOTO_FRAME,
  zoom = 1
) {
  const scale = Math.max(frame.width / photo.width, frame.height / photo.height) * zoom
  const w = photo.width * scale
  const h = photo.height * scale

  ctx.save()
  ctx.translate(frame.x, frame.y)
  ctx.rotate(frame.angle)
  ctx.beginPath()
  ctx.rect(0, 0, frame.width, frame.height)
  ctx.clip()
  ctx.drawImage(photo, (frame.width - w) / 2, (frame.height - h) / 2, w, h)
  ctx.restore()
}

export const NAME_FONT_FAMILY = '"Praise", "Brush Script MT", cursive'

// Nom sur le bandeau dore, texte sombre centre
function drawName(ctx: CanvasRenderingContext2D, name: string) {
  const zone = NAME_ZONE
  const cx = zone.x + zone.width / 2
  const cy = zone.y + zone.height / 2

  ctx.save()
  ctx.fillStyle = "#1c1502"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  let fontSize = 68
  ctx.font = `400 ${fontSize}px ${NAME_FONT_FAMILY}`
  while (ctx.measureText(name).width > zone.width - 30 && fontSize > 22) {
    fontSize -= 2
    ctx.font = `400 ${fontSize}px ${NAME_FONT_FAMILY}`
  }

  ctx.fillText(name, cx, cy + 4)
  ctx.restore()
}

export async function renderPoster(
  canvas: HTMLCanvasElement,
  template: CanvasImageSource,
  photo: HTMLImageElement | null,
  name: string,
  showName: boolean,
  zoom = 1
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  canvas.width = POSTER_SIZE
  canvas.height = POSTER_SIZE

  ctx.drawImage(template, 0, 0, POSTER_SIZE, POSTER_SIZE)

  if (photo) {
    drawPhotoCover(ctx, photo, PHOTO_FRAME, zoom)
  }
  if (showName && name.trim()) {
    drawName(ctx, name.trim())
  }
}
