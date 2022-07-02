import Scissor from 'js-scissor'
import heic2any from 'heic2any'
import type { File } from '@robingenz/capacitor-file-picker'
import { FilePicker } from '@robingenz/capacitor-file-picker'
import { loadingController } from '@ionic/vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import mime from 'mime'

export const b64ToB64URL = (b64: string, mimetype: string) => `data:${mimetype};base64,${b64}`
export const b64ToBlob = async (b64: string, mimetype: string): Promise<Blob> => {
  try {
    const [, b64Pure] = b64.split(',')
    const res = await fetch(b64Pure ? b64 : b64ToB64URL(b64, mimetype))
    const blob = await res.blob()
    return blob
  }
  catch (error) {
    console.error('Cannot convert b64 to Blob', error)
    throw (error)
  }
}

export const ArrayBufferToBlob = (buffer: ArrayBuffer): Blob => {
  return new Blob([new Uint8Array(buffer).buffer])
}
export const b64ToArrayBuffer = async (b64: string, mimetype: string): Promise<ArrayBuffer> => {
  try {
    const [, b64Pure] = b64.split(',')
    const res = await fetch(b64Pure ? b64 : b64ToB64URL(b64, mimetype))
    const aBuff = await res.arrayBuffer()
    return aBuff
  }
  catch (error) {
    console.error('Cannot convert b64 to ArrayBuffer', error)
    throw (error)
  }
}

export const blobToB64 = async (blob: Blob): Promise<string> => {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = (e) => {
      reject(e)
    }
    reader.readAsDataURL(blob)
  })
}

export const ArrayBufferToB64 = (buffer: ArrayBuffer): Promise<string> => {
  const blob = ArrayBufferToBlob(buffer)
  return blobToB64(blob)
}

export const b64HeicToJpeg = async (b64: string): Promise<string> => {
  const loading = await loadingController
    .create({
      message: 'Converting HEIC to JPEG...',
      duration: 0,
    })

  await loading.present()
  try {
    const blob = await b64ToBlob(b64, 'image/heic')
    const converted = await heic2any({
      blob,
      toType: 'image/jpeg',
      quality: 1,
    }) as Blob
    const buffer = await converted.arrayBuffer()
    loading.dismiss()
    return ArrayBufferToB64(buffer)
  }
  catch (error) {
    console.error('Cannot convert heic to jpeg', error, b64)
    loading.dismiss()
  }
  return b64
}

export const b64Resize = async (b64: string, size = 400): Promise<string> => {
  try {
    const image = await Scissor(b64).resize(null, size)
    return image.toBase64()
  }
  catch (error) {
    console.error('Cannot compress image', error, b64)
  }
  return b64
}

export const pickFile = async (): Promise<File> => {
  try {
    const filePicked = await FilePicker.pickFiles({
      types: ['image/jpeg', 'image/png', 'application/pdf'],
      multiple: false,
    })
    if (!filePicked.files.length)
      throw new Error('No file picked')
    const file = filePicked.files[0]
    if (!file.data)
      throw new Error('No file data picked')
    if (file.mimeType === 'image/heic') {
    // convert to jpeg
      file.data = await b64HeicToJpeg(file.data)
      file.mimeType = 'image/jpeg'
      file.name = file.name.replace('.heic', '.jpg')
    }
    else {
      file.data = b64ToB64URL(file.data, file.mimeType)
    }
    file.name = `${new Date().getTime()}.${file.name.split('.')[1]}`
    return file
  }
  catch (err) {
    console.error('Cannot pick file', err)
    throw err
  }
}
export const pickImage = async (): Promise<File> => {
  try {
    const cameraPhoto = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      quality: 100,
    })
    if (!cameraPhoto.dataUrl)
      throw new Error('No image picked')
    const fileName = `${new Date().getTime()}.${cameraPhoto.format}`
    const contentType = mime.getType(cameraPhoto.format)
    if (!contentType)
      throw new Error('No image picked')
    return { data: cameraPhoto.dataUrl, name: fileName, mimeType: contentType } as File
  }
  catch (error) {
    console.error(error)
    throw error
  }
}

export const pickFileImage = async (): Promise<File> => {
  try {
    const filePicked = await FilePicker.pickFiles({
      types: ['image/jpeg', 'image/png'],
      multiple: false,
    })
    if (!filePicked.files.length)
      throw new Error('No file picked')
    const file = filePicked.files[0]
    if (!file.data)
      throw new Error('No file data picked')
    if (file.mimeType === 'image/heic') {
    // convert to jpeg
      file.data = await b64HeicToJpeg(file.data)
      file.mimeType = 'image/jpeg'
      file.name = file.name.replace('.heic', '.jpg')
    }
    else {
      file.data = b64ToB64URL(file.data, file.mimeType)
    }
    // resize to 400px
    file.data = await b64Resize(file.data)
    file.name = `${new Date().getTime()}.${file.name.split('.')[1]}`
    return file
  }
  catch (err) {
    console.error('Cannot pick image', err)
    throw err
  }
}
