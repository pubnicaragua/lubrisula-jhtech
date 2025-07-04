import type { AppImage } from "../types"
import { getData, storeData, initializeData } from "./storage-service"
import * as FileSystem from "expo-file-system"
import { Platform } from "react-native"
import * as ImagePicker from "expo-image-picker"
import * as ImageManipulator from "expo-image-manipulator"

// Clave para almacenamiento
const IMAGES_STORAGE_KEY = "images"

// Directorio para almacenar imágenes
const IMAGES_DIRECTORY = FileSystem.documentDirectory + "images/"

// Asegurar que el directorio de imágenes exista
const ensureDirectoryExists = async (): Promise<void> => {
  // Nota: expo-file-system no está disponible en entornos web.
  // Esta función y otras operaciones de archivo solo funcionarán en dispositivos nativos (iOS/Android).
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIRECTORY)
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIRECTORY, { intermediates: true })
    }
  } catch (error) {
    console.warn("FileSystem operations are not supported in this environment (e.g., web).", error)
  }
}

// Datos iniciales de imágenes (vacío)
const initialImages: AppImage[] = []

// Inicializar datos
export const initializeImages = async (): Promise<AppImage[]> => {
  await ensureDirectoryExists()
  return await initializeData<AppImage[]>(IMAGES_STORAGE_KEY, initialImages)
}

// Obtener todas las imágenes
export const getAllImages = async (): Promise<AppImage[]> => {
  const images = await getData<AppImage[]>(IMAGES_STORAGE_KEY)
  return images || []
}

// Obtener imagen por ID
export const getImageById = async (id: string): Promise<AppImage | null> => {
  const images = await getAllImages()
  return images.find((image) => image.id === id) || null
}

// Obtener imágenes por tipo
export const getImagesByType = async (type: AppImage["type"]): Promise<AppImage[]> => {
  const images = await getAllImages()
  return images.filter((image) => image.type === type)
}

// Obtener imágenes relacionadas con una entidad (por ejemplo, un vehículo o una orden)
export const getImagesByRelatedId = async (relatedId: string): Promise<AppImage[]> => {
  const images = await getAllImages()
  return images.filter((image) => image.uri.includes(relatedId))
}

// Seleccionar imagen de la galería
export const pickImage = async (): Promise<string | null> => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permissionResult.granted) {
      alert("Se necesita permiso para acceder a la galería de imágenes")
      return null
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null
    }

    return result.assets[0].uri
  } catch (error) {
    console.error("Error picking image:", error)
    alert("Error al seleccionar imagen. Esta función puede no estar disponible en este entorno.")
    return null
  }
}

// Tomar foto con la cámara
export const takePhoto = async (): Promise<string | null> => {
  try {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync()

    if (!permissionResult.granted) {
      alert("Se necesita permiso para acceder a la cámara")
      return null
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null
    }

    return result.assets[0].uri
  } catch (error) {
    console.error("Error taking photo:", error)
    alert("Error al tomar foto. Esta función puede no estar disponible en este entorno.")
    return null
  }
}

// Comprimir imagen para reducir tamaño
export const compressImage = async (uri: string): Promise<string> => {
  try {
    // En entorno web, simplemente devolver la URI original
    if (Platform.OS === 'web') {
      return uri;
    }
    
    const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1000 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    return result.uri
  } catch (error) {
    console.error("Error compressing image:", error)
    alert("Error al comprimir imagen. Esta función puede no estar disponible en este entorno.")
    return uri // Retornar URI original si falla la compresión
  }
}

// Guardar imagen en el sistema de archivos
export const saveImage = async (
  uri: string,
  type: AppImage["type"],
  relatedId: string,
  description?: string,
): Promise<AppImage | null> => {
  try {
    // En entorno web, crear un objeto de imagen simulado
    if (Platform.OS === 'web') {
      const newImage: AppImage = {
        id: Date.now().toString(),
        uri: uri, // Usar la URI original
        type,
        description,
        createdAt: new Date().toISOString(),
      };
      
      // Guardar en AsyncStorage
      const images = await getAllImages();
      await storeData(IMAGES_STORAGE_KEY, [...images, newImage]);
      
      return newImage;
    }
    
    await ensureDirectoryExists()

    // Comprimir la imagen
    const compressedUri = await compressImage(uri)

    // Generar nombre de archivo único
    const fileName = `${type}_${relatedId}_${Date.now()}.jpg`
    const fileUri = IMAGES_DIRECTORY + fileName

    // Copiar archivo
    await FileSystem.copyAsync({
      from: compressedUri,
      to: fileUri,
    })

    // Crear registro de imagen
    const newImage: AppImage = {
      id: Date.now().toString(),
      uri: fileUri,
      type,
      description,
      createdAt: new Date().toISOString(),
    }

    // Guardar en AsyncStorage
    const images = await getAllImages()
    await storeData(IMAGES_STORAGE_KEY, [...images, newImage])

    return newImage
  } catch (error) {
    console.error("Error al guardar imagen:", error)
    alert("Error al guardar imagen. Esta función puede no estar disponible en este entorno.")
    return null
  }
}

// Eliminar imagen
export const deleteImage = async (id: string): Promise<boolean> => {
  try {
    const images = await getAllImages()
    const imageToDelete = images.find((image) => image.id === id)

    if (!imageToDelete) return false

    // Eliminar archivo
    try {
      await FileSystem.deleteAsync(imageToDelete.uri)
    } catch (error) {
      console.error("Error al eliminar archivo de imagen:", error)
      // Continuar aunque falle la eliminación del archivo si no es crítico
    }

    // Actualizar registros
    const updatedImages = images.filter((image) => image.id !== id)
    await storeData(IMAGES_STORAGE_KEY, updatedImages)

    return true
  } catch (error) {
    console.error("Error al eliminar imagen:", error)
    alert("Error al eliminar imagen. Esta función puede no estar disponible en este entorno.")
    return false
  }
}
