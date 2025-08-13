// scripts/build-images.mjs
import sharp from 'sharp'
import { globby } from 'globby'
import fs from 'node:fs/promises'
import path from 'node:path'

// Process every PNG/JPG under /public/media (any depth)
const patterns = ['public/media/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}']
const files = await globby(patterns)

let ok = 0, skipped = 0
const badFiles = []

for (const file of files) {
  try {
    // Quick sanity: verify Sharp can read it
    const meta = await sharp(file).metadata()
    if (!meta || !['jpeg', 'png'].includes(meta.format)) {
      badFiles.push({ file, reason: `unsupported format: ${meta?.format}` })
      skipped++
      continue
    }

    const dir = path.dirname(file)
    const ext = path.extname(file)
    const base = path.basename(file, ext)
    const thumbOut = path.join(dir, `${base}_512.webp`)
    const fullOut  = path.join(dir, `${base}_1600.webp`)

    // Generate thumb if missing
    try { await fs.access(thumbOut) } catch {
      await sharp(file)
        .resize({ width: 512, height: 512, fit: 'inside' })
        .webp({ quality: 70 })
        .toFile(thumbOut)
    }

    // Generate full if missing
    try { await fs.access(fullOut) } catch {
      await sharp(file)
        .resize({ width: 1600, height: 1600, fit: 'inside' })
        .webp({ quality: 75 })
        .toFile(fullOut)
    }

    ok++
  } catch (err) {
    badFiles.push({ file, reason: err?.message || String(err) })
    skipped++
  }
}

console.log(`✅ Completed. Generated/verified: ${ok}, Skipped: ${skipped}`)
if (badFiles.length) {
  console.log('⚠️  Skipped files:')
  for (const b of badFiles) console.log(' -', b.file, '→', b.reason)
}
