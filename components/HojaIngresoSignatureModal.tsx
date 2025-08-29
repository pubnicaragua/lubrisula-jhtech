import React, { useState } from 'react'
import { Modal, View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { Platform } from 'react-native'
// @ts-ignore
import SignatureCanvas from 'react-native-signature-canvas'
import SignaturePad from 'react-signature-canvas'
import { supabase } from '../lib/supabase'

interface HojaIngresoSignatureModalProps {
  visible: boolean
  hoja: any
  onClose: () => void
  onSigned: () => void
}

export const HojaIngresoSignatureModal = ({
  visible,
  hoja,
  onClose,
  onSigned
}: HojaIngresoSignatureModalProps) => {
  const [signature, setSignature] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSaveSignature = async () => {
    if (!signature) {
      Alert.alert('Error', 'Por favor proporciona tu firma')
      return
    }
    try {
      setSaving(true)
      const { error } = await supabase
        .from('hoja_ingreso')
        .update({
          firma_cliente: signature,
          updated_at: new Date().toISOString()
        })
        .eq('id', hoja.id)
      if (error) {
        Alert.alert('Error', 'No se pudo guardar la firma')
        return
      }
      Alert.alert('Éxito', 'Hoja de ingreso firmada correctamente')
      onSigned()
      onClose()
    } catch (error) {
      console.error('Error guardando firma:', error)
      Alert.alert('Error', 'Error al guardar la firma')
    } finally {
      setSaving(false)
    }
  }

  if (!hoja) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Firma Requerida</Text>
          <Text style={styles.subtitle}>
            Hoja de ingreso para vehículo ID: {hoja.vehiculo_id}
          </Text>
        </View>
        <View style={styles.signatureContainer}>
          {Platform.OS === 'web' ? (
            <SignaturePad
              ref={(ref: any) => {
                // @ts-ignore
                window.signaturePadRef = ref
              }}
              penColor="black"
              canvasProps={{
                width: 350,
                height: 300,
                style: { border: '1px solid #e0e0e0', borderRadius: 8 }
              }}
              onEnd={() => {
                // @ts-ignore
                setSignature(window.signaturePadRef?.toDataURL() || '')
              }}
              onClear={() => setSignature('')}
            />
          ) : (
            <SignatureCanvas
              onOK={setSignature}
              onEmpty={() => setSignature('')}
              descriptionText="Firma aquí para confirmar la hoja de ingreso"
              clearText="Limpiar"
              confirmText="Confirmar"
              webStyle={`
                .m-signature-pad {
                  box-shadow: none;
                  border: 1px solid #e0e0e0;
                  border-radius: 8px;
                  height: 300px;
                }
              `}
            />
          )}
        </View>
        <TouchableOpacity
          style={[styles.saveButton, (!signature || saving) && styles.disabledButton]}
          onPress={handleSaveSignature}
          disabled={!signature || saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Firmar y Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  signatureContainer: {
    flex: 1,
    marginVertical: 20,
  },
  saveButton: {
    backgroundColor: '#1a73e8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
