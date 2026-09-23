// Dimensions du template "Je Serai là" (1080x1080)
export const TEMPLATE_PDF = "/template.pdf"
export const TEMPLATE_SRC = "/template.png"
export const POSTER_SIZE = 1080

// Cadre photo detecte dans le template (rectangle blanc)
export const PHOTO_FRAME = {
  x: 238,
  y: 226,
  width: 581,
  height: 603,
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

// Dessine la photo en mode "cover" dans le cadre du template
function drawPhotoCover(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  frame: typeof PHOTO_FRAME
) {
  const scale = Math.max(frame.width / photo.width, frame.height / photo.height)
  const w = photo.width * scale
  const h = photo.height * scale
  const x = frame.x + (frame.width - w) / 2
  const y = frame.y + (frame.height - h) / 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(frame.x, frame.y, frame.width, frame.height)
  ctx.clip()
  ctx.drawImage(photo, x, y, w, h)
  ctx.restore()
}

export const NAME_FONT_FAMILY = '"Praise", "Brush Script MT", cursive'

// Bandeau avec le nom en bas du cadre photo (police script elegante)
function drawNameBanner(ctx: CanvasRenderingContext2D, name: string) {
  const frame = PHOTO_FRAME
  const bannerHeight = 96
  const y = frame.y + frame.height - bannerHeight

  const gradient = ctx.createLinearGradient(0, y - 30, 0, y + bannerHeight)
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)")
  gradient.addColorStop(0.35, "rgba(0, 0, 0, 0.55)")
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.85)")

  ctx.save()
  ctx.beginPath()
  ctx.rect(frame.x, y - 30, frame.width, bannerHeight + 30)
  ctx.clip()
  ctx.fillStyle = gradient
  ctx.fillRect(frame.x, y - 30, frame.width, bannerHeight + 30)

  ctx.fillStyle = "#ffffff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)"
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2

  let fontSize = 56
  ctx.font = `400 ${fontSize}px ${NAME_FONT_FAMILY}`
  while (ctx.measureText(name).width > frame.width - 60 && fontSize > 20) {
    fontSize -= 2
    ctx.font = `400 ${fontSize}px ${NAME_FONT_FAMILY}`
  }

  ctx.fillText(name, frame.x + frame.width / 2, y + bannerHeight / 2 - 4)
  ctx.restore()
}

export async function renderPoster(
  canvas: HTMLCanvasElement,
  template: CanvasImageSource,
  photo: HTMLImageElement | null,
  name: string,
  showName: boolean
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  canvas.width = POSTER_SIZE
  canvas.height = POSTER_SIZE

  ctx.drawImage(template, 0, 0, POSTER_SIZE, POSTER_SIZE)

  if (photo) {
    drawPhotoCover(ctx, photo, PHOTO_FRAME)
    if (showName && name.trim()) {
      drawNameBanner(ctx, name.trim())
    }
  }
}
