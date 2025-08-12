"use client"  
  
import { useState, useEffect } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  TouchableOpacity,  
  StyleSheet,  
  Linking,  
  Alert,  
  Image,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useAuth } from "../context/auth-context"  
import AsyncStorage from '@react-native-async-storage/async-storage'  
  
export default function AboutScreen() {  
  const { user } = useAuth()  
  const [appVersion] = useState("1.0.0")  
  const [buildNumber] = useState("100")  
  const [lastUpdate] = useState("2024-08-12")  
  
  const teamMembers = [  
    {  
      name: "Equipo AutoFlowX",  
      role: "Desarrollo y Diseño",  
      description: "Especialistas en soluciones para talleres automotrices"  
    }  
  ]  
  
  const features = [  
    {  
      icon: "clipboard",  
      title: "Gestión de Órdenes",  
      description: "Control completo del flujo de trabajo desde recepción hasta entrega"  
    },  
    {  
      icon: "users",  
      title: "Gestión de Clientes",  
      description: "Base de datos completa de clientes y sus vehículos"  
    },  
    {  
      icon: "package",  
      title: "Control de Inventario",  
      description: "Seguimiento en tiempo real de repuestos y materiales"  
    },  
    {  
      icon: "bar-chart-2",  
      title: "Reportes y Análisis",  
      description: "Métricas detalladas de rendimiento y finanzas"  
    },  
    {  
      icon: "smartphone",  
      title: "Acceso Móvil",  
      description: "Aplicación nativa para iOS y Android"  
    },  
    {  
      icon: "cloud",  
      title: "Sincronización en la Nube",  
      description: "Datos seguros y accesibles desde cualquier dispositivo"  
    }  
  ]  
  
  const legalLinks = [  
    {  
      title: "Términos de Servicio",  
      url: "https://autoflowx.com/terms"  
    },  
    {  
      title: "Política de Privacidad",  
      url: "https://autoflowx.com/privacy"  
    },  
    {  
      title: "Licencias de Software",  
      url: "https://autoflowx.com/licenses"  
    }  
  ]  
  
  const handleRateApp = () => {  
    Alert.alert(  
      "Calificar AutoFlowX",  
      "¿Te gusta usar AutoFlowX? ¡Ayúdanos calificando la app!",  
      [  
        { text: "Más tarde", style: "cancel" },  
        {  
          text: "Calificar",  
          onPress: () => {  
            // En producción, abrir la store correspondiente  
            Linking.openURL("https://apps.apple.com/app/autoflowx")  
          }  
        }  
      ]  
    )  
  }  
  
  const handleShareApp = () => {  
    Alert.alert(  
      "Compartir AutoFlowX",  
      "Comparte AutoFlowX con otros talleres",  
      [  
        { text: "Cancelar", style: "cancel" },  
        {  
          text: "Compartir",  
          onPress: () => {  
            // En producción, usar Share API nativo  
            Linking.openURL("https://autoflowx.com/download")  
          }  
        }  
      ]  
    )  
  }  
  
  const clearAppData = async () => {  
    Alert.alert(  
      "Limpiar Datos",  
      "¿Estás seguro? Esto eliminará todas las configuraciones locales.",  
      [  
        { text: "Cancelar", style: "cancel" },  
        {  
          text: "Limpiar",  
          style: "destructive",  
          onPress: async () => {  
            try {  
              await AsyncStorage.clear()  
              Alert.alert("Éxito", "Datos locales eliminados correctamente")  
            } catch (error) {  
              Alert.alert("Error", "No se pudieron limpiar los datos")  
            }  
          }  
        }  
      ]  
    )  
  }  
  
  return (  
    <ScrollView style={styles.container}>  
      {/* Header con logo */}  
      <View style={styles.headerSection}>  
        <View style={styles.logoContainer}>  
          <View style={styles.logoPlaceholder}>  
            <Feather name="tool" size={48} color="#1a73e8" />  
          </View>  
          <Text style={styles.appName}>AutoFlowX</Text>  
          <Text style={styles.appTagline}>Gestión Inteligente para Talleres</Text>  
        </View>  
      </View>  
  
      {/* Información de la versión */}  
      <View style={styles.versionSection}>  
        <Text style={styles.sectionTitle}>Información de la Aplicación</Text>  
        <View style={styles.versionCard}>  
          <View style={styles.versionItem}>  
            <Text style={styles.versionLabel}>Versión</Text>  
            <Text style={styles.versionValue}>{appVersion}</Text>  
          </View>  
          <View style={styles.versionItem}>  
            <Text style={styles.versionLabel}>Build</Text>  
            <Text style={styles.versionValue}>{buildNumber}</Text>  
          </View>  
          <View style={styles.versionItem}>  
            <Text style={styles.versionLabel}>Última Actualización</Text>  
            <Text style={styles.versionValue}>{lastUpdate}</Text>  
          </View>  
        </View>  
      </View>  
  
      {/* Características principales */}  
      <View style={styles.featuresSection}>  
        <Text style={styles.sectionTitle}>Características Principales</Text>  
        {features.map((feature, index) => (  
          <View key={index} style={styles.featureItem}>  
            <View style={styles.featureIcon}>  
              <Feather name={feature.icon as any} size={24} color="#1a73e8" />  
            </View>  
            <View style={styles.featureContent}>  
              <Text style={styles.featureTitle}>{feature.title}</Text>  
              <Text style={styles.featureDescription}>{feature.description}</Text>  
            </View>  
          </View>  
        ))}  
      </View>  
  
      {/* Equipo de desarrollo */}  
      <View style={styles.teamSection}>  
        <Text style={styles.sectionTitle}>Desarrollado por</Text>  
        {teamMembers.map((member, index) => (  
          <View key={index} style={styles.teamMember}>  
            <View style={styles.memberAvatar}>  
              <Feather name="users" size={24} color="#1a73e8" />  
            </View>  
            <View style={styles.memberInfo}>  
              <Text style={styles.memberName}>{member.name}</Text>  
              <Text style={styles.memberRole}>{member.role}</Text>  
              <Text style={styles.memberDescription}>{member.description}</Text>  
            </View>  
          </View>  
        ))}  
      </View>  
  
      {/* Acciones */}  
      <View style={styles.actionsSection}>  
        <Text style={styles.sectionTitle}>Acciones</Text>  
          
        <TouchableOpacity style={styles.actionItem} onPress={handleRateApp}>  
          <Feather name="star" size={20} color="#ff9800" />  
          <Text style={styles.actionText}>Calificar la App</Text>  
          <Feather name="chevron-right" size={16} color="#ccc" />  
        </TouchableOpacity>  
  
        <TouchableOpacity style={styles.actionItem} onPress={handleShareApp}>  
          <Feather name="share-2" size={20} color="#4caf50" />  
          <Text style={styles.actionText}>Compartir AutoFlowX</Text>  
          <Feather name="chevron-right" size={16} color="#ccc" />  
        </TouchableOpacity>  
  
        <TouchableOpacity   
          style={styles.actionItem}   
          onPress={() => Linking.openURL("https://autoflowx.com/feedback")}  
        >  
          <Feather name="message-square" size={20} color="#1a73e8" />  
          <Text style={styles.actionText}>Enviar Comentarios</Text>  
          <Feather name="external-link" size={16} color="#ccc" />  
        </TouchableOpacity>  
  
        <TouchableOpacity style={styles.actionItem} onPress={clearAppData}>  
          <Feather name="trash-2" size={20} color="#f44336" />  
          <Text style={styles.actionText}>Limpiar Datos Locales</Text>  
          <Feather name="chevron-right" size={16} color="#ccc" />  
        </TouchableOpacity>  
      </View>  
  
      {/* Enlaces legales */}  
      <View style={styles.legalSection}>  
        <Text style={styles.sectionTitle}>Legal</Text>  
        {legalLinks.map((link, index) => (  
          <TouchableOpacity  
            key={index}  
            style={styles.legalItem}  
            onPress={() => Linking.openURL(link.url)}  
          >  
            <Text style={styles.legalText}>{link.title}</Text>  
            <Feather name="external-link" size={16} color="#ccc" />  
          </TouchableOpacity>  
        ))}  
      </View>  
  
      {/* Footer */}  
      <View style={styles.footer}>  
        <Text style={styles.footerText}>  
          © 2024 AutoFlowX. Todos los derechos reservados.  
        </Text>  
        <Text style={styles.footerSubtext}>  
          Hecho con ❤️ para talleres automotrices  
        </Text>  
      </View>  
    </ScrollView>  
  )  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: "#f8f9fa",  
  },  
  headerSection: {  
    backgroundColor: "#fff",  
    paddingVertical: 32,  
    alignItems: "center",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  logoContainer: {  
    alignItems: "center",  
  },  
  logoPlaceholder: {  
    width: 80,  
    height: 80,  
    borderRadius: 40,  
    backgroundColor: "#e8f0fe",  
    justifyContent: "center",  
    alignItems: "center",  
    marginBottom: 16,  
  },  
  appName: {  
    fontSize: 28,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 4,  
  },  
  appTagline: {  
    fontSize: 16,  
    color: "#666",  
    textAlign: "center",  
  },  
  versionSection: {  
    backgroundColor: "#fff",  
    marginTop: 16,  
    paddingVertical: 16,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
    paddingHorizontal: 16,  
  },  
  versionCard: {  
    marginHorizontal: 16,  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    padding: 16,  
  },  
  versionItem: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    paddingVertical: 8,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  versionLabel: {  
    fontSize: 16,  
    color: "#666",  
  },  
  versionValue: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
  },  
  featuresSection: {  
    backgroundColor: "#fff",  
    marginTop: 16,  
    paddingVertical: 16,  
  },  
  featureItem: {  
    flexDirection: "row",  
    alignItems: "flex-start",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  featureIcon: {  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    backgroundColor: "#e8f0fe",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  featureContent: {  
    flex: 1,  
  },  
  featureTitle: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 4,  
  },  
  featureDescription: {  
    fontSize: 14,  
    color: "#666",  
    lineHeight: 20,  
  },  
  teamSection: {  
    backgroundColor: "#fff",  
    marginTop: 16,  
    paddingVertical: 16,  
  },  
  teamMember: {  
    flexDirection: "row",  
    alignItems: "flex-start",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
  },  
  memberAvatar: {  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    backgroundColor: "#e8f0fe",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  memberInfo: {  
    flex: 1,  
  },  
  memberName: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 2,  
  },  
  memberRole: {  
    fontSize: 14,  
    color: "#1a73e8",  
    marginBottom: 4,  
  },  
  memberDescription: {  
    fontSize: 14,  
    color: "#666",  
    lineHeight: 18,  
  },  
  actionsSection: {  
    backgroundColor: "#fff",  
    marginTop: 16,  
    paddingVertical: 16,  
  },  
  actionItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  actionText: {  
    flex: 1,  
    fontSize: 16,  
    color: "#333",  
    marginLeft: 12,  
  },  
  legalSection: {  
    backgroundColor: "#fff",  
    marginTop: 16,  
    paddingVertical: 16,  
  },  
  legalItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  legalText: {  
    fontSize: 16,  
    color: "#1a73e8",  
  },  
  footer: {  
    backgroundColor: "#fff",  
    marginTop: 16,  
    paddingVertical: 24,  
    alignItems: "center",  
  },  
  footerText: {  
    fontSize: 14,  
    color: "#666",  
    textAlign: "center",  
    marginBottom: 4,  
  },  
  footerSubtext: {  
    fontSize: 12,  
    color: "#999",  
    textAlign: "center",  
  },  
})