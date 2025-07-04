import AsyncStorage from "@react-native-async-storage/async-storage"

// Función para guardar datos en AsyncStorage\
export const storeData = async <T>(key: string, value: T)
: Promise<void> =>
{
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (error) {
    console.error(`Error al guardar datos (${key}):`, error)
    throw error
  }
}

// Función para obtener datos de AsyncStorage
export const getData = async <T>(key: string)
: Promise<T | null> =>
{
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error al obtener datos (${key}):`, error)
    throw error
  }
}

// Función para eliminar datos de AsyncStorage
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key)
  } catch (error) {
    console.error(`Error al eliminar datos (${key}):`, error)
    throw error
  }
}

// Función para inicializar datos si no existen
export const initializeData = async <T>(key: string, initialData: T)
: Promise<T> =>
{
  try {
    const existingData = await getData<T>(key)
    if (existingData === null) {
      await storeData(key, initialData)
      return initialData;
    }
    return existingData;
  } catch (error) {
    console.error(`Error al inicializar datos (${key}):`, error)
    throw error
  }
}

// Función para limpiar todos los datos (útil para pruebas o reset)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear()
  } catch (error) {
    console.error("Error al limpiar todos los datos:", error)
    throw error
  }
}
