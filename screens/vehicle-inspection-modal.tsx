"use client"  
import { useState, useCallback, useEffect } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  TouchableOpacity,  
  StyleSheet,  
  Modal,  
  Alert,  
  ActivityIndicator,  
  TextInput,  
  Switch,  
  Dimensions,  
} from "react-native"  
import { Feather } from "@expo/vector-icons"  
import { useAuth } from "../context/auth-context"  
import HOJA_INGRESO_SERVICE, { HojaIngresoType } from "../services/supabase/hoja-ingreso-service"  
import { vehicleService } from "../services/supabase/vehicle-service"  
import SignatureCanvas from 'react-native-signature-canvas'  
  
const { width: screenWidth, height: screenHeight } = Dimensions.get("window")  
  
interface VehicleInspectionModalProps {  
  visible: boolean  
  vehicleId: string  
  onComplete: () => void  
  // No hay onClose - el modal es obligatorio  
}  
  
export default function VehicleInspectionModal({   
  visible,   
  vehicleId,   
  onComplete   
}: VehicleInspectionModalProps) {  
  const { user } = useAuth()  
  const [loading, setLoading] = useState(false)  
  const [saving, setSaving] = useState(false)  
  const [vehicle, setVehicle] = useState<any>(null)  
  const [currentStep, setCurrentStep] = useState(0)  
  const [showSignature, setShowSignature] = useState(false)  
    
  // Estado del formulario de inspección  
  const [inspectionData, setInspectionData] = useState<HojaIngresoType>({  
    vehiculo_id: vehicleId,  
    fecha: new Date().toISOString(),  
    interiores: {  
      documentos: { cantidad: "", si: false, no: true },  
      radio: { cantidad: "", si: false, no: true },  
      portafusil: { cantidad: "", si: false, no: true },  
      encendedor: { cantidad: "", si: false, no: true },  
      tapetes_tela: { cantidad: "", si: false, no: true },  
      tapetes_plastico: { cantidad: "", si: false, no: true },  
      medidor_gasolina: { cantidad: "", si: false, no: true },  
      kilometraje: { cantidad: "", si: false, no: true },  
    },  
    exteriores: {  
      antena: { cantidad: "", si: false, no: true },  
      falanges: { cantidad: "", si: false, no: true },  
      centro_rin: { cantidad: "", si: false, no: true },  
      placas: { cantidad: "", si: false, no: true },  
    },  
    coqueta: {  
      herramienta: { cantidad: "", si: false, no: true },  
      reflejantes: { cantidad: "", si: false, no: true },  
      cables_corriente: { cantidad: "", si: false, no: true },  
      llanta_refaccion: { cantidad: "", si: false, no: true },  
      llave_cruceta: { cantidad: "", si: false, no: true },  
      gato: { cantidad: "", si: false, no: true },  
      latero: { cantidad: "", si: false, no: true },  
      otro: { cantidad: "", si: false, no: true },  
    },  
    motor: {  
      bateria: { cantidad: "", si: false, no: true },  
      computadora: { cantidad: "", si: false, no: true },  
      tapones_deposito: { cantidad: "", si: false, no: true },  
    },  
    nivel_gasolina: "",  
    comentarios: "",  
    imagen_carroceria: null,  
    puntos: [],  
    firmas: {  
      firmaCliente: null,  
      firmaEncargado: null,  
    }  
  })  
  
  // Cargar datos del vehículo  
  useEffect(() => {  
    if (visible && vehicleId) {  
      loadVehicleData()  
    }  
  }, [visible, vehicleId])  
  
  const loadVehicleData = async () => {  
    try {  
      setLoading(true)  
      const vehicleData = await vehicleService.getVehicleById(vehicleId)  
      setVehicle(vehicleData)  
    } catch (error) {  
      console.error("Error loading vehicle:", error)  
      Alert.alert("Error", "No se pudo cargar la información del vehículo")  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  // Actualizar campo de inspección  
  const updateInspectionField = (section: string, field: string, key: string, value: any) => {  
    setInspectionData(prev => ({  
      ...prev,  
      [section]: {  
        ...prev[section as keyof typeof prev.interiores],  
        [field]: {  
          ...prev[section as keyof typeof prev.interiores][field as keyof typeof prev.interiores.documentos],  
          [key]: value  
        }  
      }  
    }))  
  }  
  
  // Manejar cambio de switch (si/no)  
  const handleSwitchChange = (section: string, field: string, value: boolean) => {  
    updateInspectionField(section, field, 'si', value)  
    updateInspectionField(section, field, 'no', !value)  
  }  
  
  // Guardar inspección  
  const saveInspection = async () => {  
    try {  
      setSaving(true)  
        
      // Validar que tenga firma del cliente  
      if (!inspectionData.firmas.firmaCliente) {  
        Alert.alert("Firma requerida", "Debe firmar la inspección para continuar")  
        return  
      }  
  
      await HOJA_INGRESO_SERVICE.guardarInspeccion(vehicleId, inspectionData)  
        
      Alert.alert(  
        "Inspección Completada",   
        "La hoja de ingreso ha sido guardada correctamente",  
        [{ text: "OK", onPress: onComplete }]  
      )  
        
    } catch (error) {  
      console.error("Error saving inspection:", error)  
      Alert.alert("Error", "No se pudo guardar la inspección")  
    } finally {  
      setSaving(false)  
    }  
  }  
  
  // Renderizar sección de inspección  
  const renderInspectionSection = (title: string, section: string, items: any) => (  
    <View style={styles.section}>  
      <Text style={styles.sectionTitle}>{title}</Text>  
      {Object.entries(items).map(([key, item]: [string, any]) => (  
        <View key={key} style={styles.inspectionItem}>  
          <Text style={styles.itemLabel}>{key.replace(/_/g, ' ').toUpperCase()}</Text>  
            
          <View style={styles.itemControls}>  
            <View style={styles.switchContainer}>  
              <Text style={styles.switchLabel}>SÍ</Text>  
              <Switch  
                value={item.si}  
                onValueChange={(value) => handleSwitchChange(section, key, value)}  
                trackColor={{ false: "#767577", true: "#4caf50" }}  
                thumbColor={item.si ? "#fff" : "#f4f3f4"}  
              />  
            </View>  
              
            <TextInput  
              style={styles.quantityInput}  
              placeholder="Cantidad"  
              value={item.cantidad}  
              onChangeText={(text) => updateInspectionField(section, key, 'cantidad', text)}  
            />  
          </View>  
        </View>  
      ))}  
    </View>  
  )  
  
  // Pasos de la inspección  
  const steps = [  
    { title: "Interiores", content: () => renderInspectionSection("Interiores", "interiores", inspectionData.interiores) },  
    { title: "Exteriores", content: () => renderInspectionSection("Exteriores", "exteriores", inspectionData.exteriores) },  
    { title: "Coqueta", content: () => renderInspectionSection("Coqueta", "coqueta", inspectionData.coqueta) },  
    { title: "Motor", content: () => renderInspectionSection("Motor", "motor", inspectionData.motor) },  
    { title: "Detalles Finales", content: () => renderFinalDetails() },  
  ]  
  
  const renderFinalDetails = () => (  
    <View style={styles.section}>  
      <Text style={styles.sectionTitle}>Detalles Finales</Text>  
        
      <View style={styles.inputGroup}>  
        <Text style={styles.inputLabel}>Nivel de Gasolina</Text>  
        <TextInput  
          style={styles.textInput}  
          value={inspectionData.nivel_gasolina}  
          onChangeText={(text) => setInspectionData(prev => ({ ...prev, nivel_gasolina: text }))}  
          placeholder="Ej: 1/4, 1/2, 3/4, Lleno"  
        />  
      </View>  
  
      <View style={styles.inputGroup}>  
        <Text style={styles.inputLabel}>Comentarios Adicionales</Text>  
        <TextInput  
          style={[styles.textInput, styles.textArea]}  
          value={inspectionData.comentarios}  
          onChangeText={(text) => setInspectionData(prev => ({ ...prev, comentarios: text }))}  
          placeholder="Observaciones generales del vehículo..."  
          multiline  
          numberOfLines={4}  
          textAlignVertical="top"  
        />  
      </View>  
  
      <TouchableOpacity   
        style={styles.signatureButton}  
        onPress={() => setShowSignature(true)}  
      >  
        <Feather name="edit-3" size={20} color="#1a73e8" />  
        <Text style={styles.signatureButtonText}>  
          {inspectionData.firmas.firmaCliente ? "Modificar Firma" : "Firmar Inspección"}  
        </Text>  
      </TouchableOpacity>  
  
      {inspectionData.firmas.firmaCliente && (  
        <View style={styles.signaturePreview}>  
          <Text style={styles.signaturePreviewText}>✓ Firmado</Text>  
        </View>  
      )}  
    </View>  
  )  
  
  if (loading) {  
    return (  
      <Modal visible={visible} animationType="slide">  
        <View style={styles.loadingContainer}>  
          <ActivityIndicator size="large" color="#1a73e8" />  
          <Text style={styles.loadingText}>Cargando inspección...</Text>  
        </View>  
      </Modal>  
    )  
  }  
  
  return (  
    <>  
      <Modal visible={visible} animationType="slide">  
        <View style={styles.container}>  
          {/* Header obligatorio */}  
          <View style={styles.header}>  
            <View style={styles.headerContent}>  
              <Feather name="clipboard" size={24} color="#1a73e8" />  
              <View style={styles.headerText}>  
                <Text style={styles.headerTitle}>Inspección Obligatoria</Text>  
                <Text style={styles.headerSubtitle}>  
                  {vehicle ? `${vehicle.marca} ${vehicle.modelo} - ${vehicle.placa}` : "Cargando..."}  
                </Text>  
              </View>  
            </View>  
            <Text style={styles.stepIndicator}>  
              {currentStep + 1} de {steps.length}  
            </Text>  
          </View>  
  
          {/* Progreso */}  
          <View style={styles.progressContainer}>  
            <View style={styles.progressBar}>  
              <View   
                style={[  
                  styles.progressFill,   
                  { width: `${((currentStep + 1) / steps.length) * 100}%` }  
                ]}   
              />  
            </View>  
          </View>  
  
          {/* Contenido del paso actual */}  
          <ScrollView style={styles.content}>  
            <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>  
            {steps[currentStep].content()}  
          </ScrollView>  
  
          {/* Botones de navegación */}  
          <View style={styles.footer}>  
            <TouchableOpacity  
              style={[styles.button, styles.backButton, currentStep === 0 && styles.buttonDisabled]}  
              onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}  
              disabled={currentStep === 0}  
            >  
              <Text style={[styles.buttonText, currentStep === 0 && styles.buttonTextDisabled]}>  
                Anterior  
              </Text>  
            </TouchableOpacity>  
  
            {currentStep < steps.length - 1 ? (  
              <TouchableOpacity  
                style={[styles.button, styles.nextButton]}  
                onPress={() => setCurrentStep(currentStep + 1)}  
              >  
                <Text style={styles.buttonText}>Siguiente</Text>  
              </TouchableOpacity>  
            ) : (  
              <TouchableOpacity  
                style={[  
                  styles.button,   
                  styles.completeButton,  
                  (!inspectionData.firmas.firmaCliente || saving) && styles.buttonDisabled  
                ]}  
                onPress={saveInspection}  
                disabled={!inspectionData.firmas.firmaCliente || saving}  
              >  
                {saving ? (  
                  <ActivityIndicator size="small" color="#fff" />  
                ) : (  
                  <Text style={styles.buttonText}>Completar Inspección</Text>  
                )}  
              </TouchableOpacity>  
            )}  
          </View>  
        </View>  
      </Modal>  
  
      {/* Modal de firma */}  
      <Modal visible={showSignature} animationType="slide">  
        <View style={styles.signatureContainer}>  
          <View style={styles.signatureHeader}>  
            <Text style={styles.signatureTitle}>Firma del Cliente</Text>  
            <TouchableOpacity onPress={() => setShowSignature(false)}>  
              <Feather name="x" size={24} color="#333" />  
            </TouchableOpacity>  
          </View>  
            
          <View style={styles.signatureCanvas}>  
            <SignatureCanvas  
              onOK={(signature) => {  
                setInspectionData(prev => ({  
                  ...prev,  
                  firmas: { ...prev.firmas, firmaCliente: signature }  
                }))  
                setShowSignature(false)  
              }}  
              onEmpty={() => Alert.alert("Firma vacía", "Por favor, firme en el área designada")}  
              descriptionText="Firme aquí para confirmar la inspección"  
              clearText="Limpiar"  
              confirmText="Confirmar"  
              webStyle={`  
                .m-signature-pad {  
                  box-shadow: none;  
                  border: 2px dashed #e1e4e8;  
                  border-radius: 8px;  
                }  
                .m-signature-pad--body {  
                  border: none;  
                }  
                .m-signature-pad--footer {  
                  display: none;  
                }  
              `}  
            />  
          </View>  
        </View>  
      </Modal>  
    </>  
  )  

  }  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: "#f8f9fa",  
  },  
  loadingContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
    backgroundColor: "#f8f9fa",  
  },  
  loadingText: {  
    marginTop: 10,  
    fontSize: 16,  
    color: "#666",  
  },  
  header: {  
    backgroundColor: "#fff",  
    padding: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
  },  
  headerContent: {  
    flexDirection: "row",  
    alignItems: "center",  
    flex: 1,  
  },  
  headerText: {  
    marginLeft: 12,  
    flex: 1,  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#1a73e8",  
  },  
  headerSubtitle: {  
    fontSize: 14,  
    color: "#666",  
    marginTop: 2,  
  },  
  stepIndicator: {  
    fontSize: 14,  
    fontWeight: "500",  
    color: "#666",  
    backgroundColor: "#f0f0f0",  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    borderRadius: 12,  
  },  
  progressContainer: {  
    backgroundColor: "#fff",  
    paddingHorizontal: 16,  
    paddingBottom: 16,  
  },  
  progressBar: {  
    height: 4,  
    backgroundColor: "#e1e4e8",  
    borderRadius: 2,  
    overflow: "hidden",  
  },  
  progressFill: {  
    height: "100%",  
    backgroundColor: "#1a73e8",  
    borderRadius: 2,  
  },  
  content: {  
    flex: 1,  
    padding: 16,  
  },  
  stepTitle: {  
    fontSize: 24,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 20,  
  },  
  section: {  
    backgroundColor: "#fff",  
    borderRadius: 8,  
    padding: 16,  
    marginBottom: 16,  
    shadowColor: "#000",  
    shadowOffset: { width: 0, height: 1 },  
    shadowOpacity: 0.1,  
    shadowRadius: 2,  
    elevation: 2,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
  },  
  inspectionItem: {  
    marginBottom: 16,  
    paddingBottom: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  itemLabel: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 8,  
  },  
  itemControls: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
  },  
  switchContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
  },  
  switchLabel: {  
    fontSize: 14,  
    color: "#666",  
    marginRight: 8,  
  },  
  quantityInput: {  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 6,  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    fontSize: 14,  
    color: "#333",  
    width: 120,  
  },  
  inputGroup: {  
    marginBottom: 16,  
  },  
  inputLabel: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 8,  
  },  
  textInput: {  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
    borderRadius: 6,  
    paddingHorizontal: 12,  
    paddingVertical: 10,  
    fontSize: 16,  
    color: "#333",  
  },  
  textArea: {  
    height: 100,  
    textAlignVertical: "top",  
  },  
  signatureButton: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "center",  
    backgroundColor: "#f8f9fa",  
    borderWidth: 2,  
    borderColor: "#1a73e8",  
    borderStyle: "dashed",  
    borderRadius: 8,  
    paddingVertical: 16,  
    marginBottom: 16,  
  },  
  signatureButtonText: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#1a73e8",  
    marginLeft: 8,  
  },  
  signaturePreview: {  
    backgroundColor: "#e8f5e8",  
    borderRadius: 6,  
    padding: 12,  
    alignItems: "center",  
  },  
  signaturePreviewText: {  
    fontSize: 14,  
    fontWeight: "500",  
    color: "#4caf50",  
  },  
  footer: {  
    backgroundColor: "#fff",  
    padding: 16,  
    borderTopWidth: 1,  
    borderTopColor: "#e1e4e8",  
    flexDirection: "row",  
    gap: 12,  
  },  
  button: {  
    flex: 1,  
    paddingVertical: 12,  
    borderRadius: 8,  
    alignItems: "center",  
    justifyContent: "center",  
  },  
  backButton: {  
    backgroundColor: "#f5f5f5",  
  },  
  nextButton: {  
    backgroundColor: "#1a73e8",  
  },  
  completeButton: {  
    backgroundColor: "#4caf50",  
  },  
  buttonDisabled: {  
    backgroundColor: "#e1e4e8",  
  },  
  buttonText: {  
    fontSize: 16,  
    fontWeight: "bold",  
    color: "#fff",  
  },  
  buttonTextDisabled: {  
    color: "#999",  
  },  
  signatureContainer: {  
    flex: 1,  
    backgroundColor: "#fff",  
  },  
  signatureHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    padding: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  signatureTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  signatureCanvas: {  
    flex: 1,  
    margin: 16,  
  },  
})