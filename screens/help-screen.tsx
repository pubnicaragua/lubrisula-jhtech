"use client"  
  
import { useState, useCallback } from "react"  
import {  
  View,  
  Text,  
  ScrollView,  
  TouchableOpacity,  
  StyleSheet,  
  TextInput,  
  Modal,  
  Linking,  
  Alert,  
} from "react-native"  
import { Feather, MaterialIcons } from "@expo/vector-icons"  
import { useAuth } from "../context/auth-context"  
  
interface FAQItem {  
  id: string  
  question: string  
  answer: string  
  category: string  
}  
  
interface ContactOption {  
  id: string  
  title: string  
  description: string  
  icon: string  
  action: () => void  
}  
  
export default function HelpScreen() {  
  const { user } = useAuth()  
  const [searchTerm, setSearchTerm] = useState("")  
  const [selectedCategory, setSelectedCategory] = useState<string>("all")  
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)  
  const [contactModalVisible, setContactModalVisible] = useState(false)  
  
  const categories = [  
    { id: "all", name: "Todas" },  
    { id: "orders", name: "Órdenes" },  
    { id: "inventory", name: "Inventario" },  
    { id: "clients", name: "Clientes" },  
    { id: "account", name: "Cuenta" },  
    { id: "technical", name: "Técnico" }  
  ]  
  
  const faqs: FAQItem[] = [  
    {  
      id: "1",  
      question: "¿Cómo crear una nueva orden de trabajo?",  
      answer: "Para crear una nueva orden, ve a la pantalla de Órdenes y toca el botón '+'. Completa la información del cliente, vehículo y descripción del trabajo. La orden se creará automáticamente con un número único.",  
      category: "orders"  
    },  
    {  
      id: "2",  
      question: "¿Cómo actualizar el estado de una orden?",  
      answer: "Abre la orden desde la lista, toca el estado actual y selecciona el nuevo estado. Los clientes recibirán notificaciones automáticas de los cambios de estado.",  
      category: "orders"  
    },  
    {  
      id: "3",  
      question: "¿Cómo agregar productos al inventario?",  
      answer: "Ve a la pantalla de Inventario, toca el botón '+' y completa la información del producto: código, nombre, categoría, precios y stock inicial.",  
      category: "inventory"  
    },  
    {  
      id: "4",  
      question: "¿Qué hacer cuando el stock está bajo?",  
      answer: "El sistema te notificará automáticamente cuando el stock esté por debajo del mínimo. Puedes ajustar el stock desde la pantalla de detalle del producto o crear una orden de compra.",  
      category: "inventory"  
    },  
    {  
      id: "5",  
      question: "¿Cómo registrar un nuevo cliente?",  
      answer: "Ve a la pantalla de Clientes, toca '+' y completa la información: nombre, email, teléfono y dirección. También puedes agregar vehículos asociados al cliente.",  
      category: "clients"  
    },  
    {  
      id: "6",  
      question: "¿Cómo cambiar mi contraseña?",  
      answer: "Ve a tu Perfil, toca 'Cambiar Contraseña', ingresa tu contraseña actual y la nueva contraseña. Debe tener al menos 6 caracteres.",  
      category: "account"  
    },  
    {  
      id: "7",  
      question: "¿Cómo generar reportes?",  
      answer: "Ve a la pantalla de Reportes donde encontrarás análisis de ventas, inventario y rendimiento. Puedes filtrar por período y exportar los datos.",  
      category: "technical"  
    },  
    {  
      id: "8",  
      question: "¿Qué hacer si la app no sincroniza?",  
      answer: "Verifica tu conexión a internet. Si el problema persiste, cierra y abre la app. Los datos se sincronizan automáticamente cuando hay conexión.",  
      category: "technical"  
    }  
  ]  
  
  const contactOptions: ContactOption[] = [  
    {  
      id: "email",  
      title: "Enviar Email",  
      description: "Contacta nuestro equipo de soporte",  
      icon: "mail",  
      action: () => {  
        Linking.openURL("mailto:soporte@autoflowx.com?subject=Soporte AutoFlowX")  
      }  
    },  
    {  
      id: "phone",  
      title: "Llamar Soporte",  
      description: "Lun-Vie 8:00 AM - 6:00 PM",  
      icon: "phone",  
      action: () => {  
        Linking.openURL("tel:+50588888888")  
      }  
    },  
    {  
      id: "whatsapp",  
      title: "WhatsApp",  
      description: "Chat directo con soporte",  
      icon: "message-circle",  
      action: () => {  
        Linking.openURL("https://wa.me/50588888888?text=Hola, necesito ayuda con AutoFlowX")  
      }  
    },  
    {  
      id: "website",  
      title: "Centro de Ayuda Web",  
      description: "Documentación completa online",  
      icon: "globe",  
      action: () => {  
        Linking.openURL("https://autoflowx.com/help")  
      }  
    }  
  ]  
  
  const filteredFAQs = faqs.filter(faq => {  
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory  
    const matchesSearch = searchTerm === "" ||   
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())  
      
    return matchesCategory && matchesSearch  
  })  
  
  const toggleFAQ = (faqId: string) => {  
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId)  
  }  
  
  const renderFAQItem = ({ item }: { item: FAQItem }) => (  
    <TouchableOpacity  
      style={styles.faqItem}  
      onPress={() => toggleFAQ(item.id)}  
    >  
      <View style={styles.faqHeader}>  
        <Text style={styles.faqQuestion}>{item.question}</Text>  
        <Feather   
          name={expandedFAQ === item.id ? "chevron-up" : "chevron-down"}   
          size={20}   
          color="#666"   
        />  
      </View>  
      {expandedFAQ === item.id && (  
        <Text style={styles.faqAnswer}>{item.answer}</Text>  
      )}  
    </TouchableOpacity>  
  )  
  
  const renderContactModal = () => (  
    <Modal  
      visible={contactModalVisible}  
      animationType="slide"  
      presentationStyle="pageSheet"  
    >  
      <View style={styles.modalContainer}>  
        <View style={styles.modalHeader}>  
          <Text style={styles.modalTitle}>Contactar Soporte</Text>  
          <TouchableOpacity  
            onPress={() => setContactModalVisible(false)}  
            style={styles.closeButton}  
          >  
            <Feather name="x" size={24} color="#666" />  
          </TouchableOpacity>  
        </View>  
  
        <ScrollView style={styles.modalContent}>  
          {contactOptions.map((option) => (  
            <TouchableOpacity  
              key={option.id}  
              style={styles.contactOption}  
              onPress={() => {  
                setContactModalVisible(false)  
                option.action()  
              }}  
            >  
              <View style={styles.contactIcon}>  
                <Feather name={option.icon as any} size={24} color="#1a73e8" />  
              </View>  
              <View style={styles.contactInfo}>  
                <Text style={styles.contactTitle}>{option.title}</Text>  
                <Text style={styles.contactDescription}>{option.description}</Text>  
              </View>  
              <Feather name="chevron-right" size={20} color="#ccc" />  
            </TouchableOpacity>  
          ))}  
        </ScrollView>  
      </View>  
    </Modal>  
  )  
  
  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <Text style={styles.headerTitle}>Centro de Ayuda</Text>  
        <TouchableOpacity  
          style={styles.contactButton}  
          onPress={() => setContactModalVisible(true)}  
        >  
          <Feather name="headphones" size={20} color="#1a73e8" />  
        </TouchableOpacity>  
      </View>  
  
      <View style={styles.searchContainer}>  
        <View style={styles.searchInputContainer}>  
          <Feather name="search" size={20} color="#666" />  
          <TextInput  
            style={styles.searchInput}  
            placeholder="Buscar en preguntas frecuentes..."  
            value={searchTerm}  
            onChangeText={setSearchTerm}  
          />  
        </View>  
      </View>  
  
      <ScrollView style={styles.content}>  
        {/* Categorías */}  
        <View style={styles.categoriesSection}>  
          <Text style={styles.sectionTitle}>Categorías</Text>  
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>  
            <View style={styles.categoriesContainer}>  
              {categories.map((category) => (  
                <TouchableOpacity  
                  key={category.id}  
                  style={[  
                    styles.categoryChip,  
                    selectedCategory === category.id && styles.categoryChipSelected  
                  ]}  
                  onPress={() => setSelectedCategory(category.id)}  
                >  
                  <Text style={[  
                    styles.categoryChipText,  
                    selectedCategory === category.id && styles.categoryChipTextSelected  
                  ]}>  
                    {category.name}  
                  </Text>  
                </TouchableOpacity>  
              ))}  
            </View>  
          </ScrollView>  
        </View>  
  
        {/* Preguntas Frecuentes */}  
        <View style={styles.faqSection}>  
          <Text style={styles.sectionTitle}>  
            Preguntas Frecuentes ({filteredFAQs.length})  
          </Text>  
          {filteredFAQs.map((faq) => (  
            <View key={faq.id}>  
              {renderFAQItem({ item: faq })}  
            </View>  
          ))}  
        </View>  
  
        {/* Accesos rápidos */}  
        <View style={styles.quickActionsSection}>  
          <Text style={styles.sectionTitle}>Accesos Rápidos</Text>  
            
          <TouchableOpacity   
            style={styles.quickActionItem}  
            onPress={() => Linking.openURL("https://autoflowx.com/tutorials")}  
          >  
            <View style={styles.quickActionIcon}>  
              <Feather name="play-circle" size={24} color="#1a73e8" />  
            </View>  
            <View style={styles.quickActionInfo}>  
              <Text style={styles.quickActionTitle}>Tutoriales en Video</Text>  
              <Text style={styles.quickActionDescription}>Aprende a usar AutoFlowX paso a paso</Text>  
            </View>  
            <Feather name="external-link" size={16} color="#666" />  
          </TouchableOpacity>  
  
          <TouchableOpacity   
            style={styles.quickActionItem}  
            onPress={() => Linking.openURL("https://autoflowx.com/docs")}  
          >  
            <View style={styles.quickActionIcon}>  
              <Feather name="book-open" size={24} color="#1a73e8" />  
            </View>  
            <View style={styles.quickActionInfo}>  
              <Text style={styles.quickActionTitle}>Documentación</Text>  
              <Text style={styles.quickActionDescription}>Guías detalladas y referencias</Text>  
            </View>  
            <Feather name="external-link" size={16} color="#666" />  
          </TouchableOpacity>  
  
          <TouchableOpacity   
            style={styles.quickActionItem}  
            onPress={() => Linking.openURL("https://autoflowx.com/community")}  
          >  
            <View style={styles.quickActionIcon}>  
              <Feather name="users" size={24} color="#1a73e8" />  
            </View>  
            <View style={styles.quickActionInfo}>  
              <Text style={styles.quickActionTitle}>Comunidad</Text>  
              <Text style={styles.quickActionDescription}>Conecta con otros usuarios</Text>  
            </View>  
            <Feather name="external-link" size={16} color="#666" />  
          </TouchableOpacity>  
        </View>  
  
        {/* Información de contacto */}  
        <View style={styles.contactSection}>  
          <Text style={styles.sectionTitle}>¿No encuentras lo que buscas?</Text>  
          <Text style={styles.contactDescription}>  
            Nuestro equipo de soporte está aquí para ayudarte  
          </Text>  
          <TouchableOpacity  
            style={styles.contactSupportButton}  
            onPress={() => setContactModalVisible(true)}  
          >  
            <Feather name="message-circle" size={20} color="#fff" />  
            <Text style={styles.contactSupportText}>Contactar Soporte</Text>  
          </TouchableOpacity>  
        </View>  
      </ScrollView>  
  
      {renderContactModal()}  
    </View>  
  )  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: "#f8f9fa",  
  },  
  header: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  contactButton: {  
    padding: 8,  
  },  
  searchContainer: {  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    backgroundColor: "#fff",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  searchInputContainer: {  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#f5f5f5",  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
  },  
  searchInput: {  
    flex: 1,  
    marginLeft: 8,  
    fontSize: 16,  
    color: "#333",  
  },  
  content: {  
    flex: 1,  
  },  
  categoriesSection: {  
    backgroundColor: "#fff",  
    paddingVertical: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: "bold",  
    color: "#333",  
    marginBottom: 16,  
    paddingHorizontal: 16,  
  },  
  categoriesContainer: {  
    flexDirection: "row",  
    paddingHorizontal: 16,  
    gap: 8,  
  },  
  categoryChip: {  
    paddingHorizontal: 16,  
    paddingVertical: 8,  
    backgroundColor: "#f5f5f5",  
    borderRadius: 20,  
    borderWidth: 1,  
    borderColor: "#e1e4e8",  
  },  
  categoryChipSelected: {  
    backgroundColor: "#1a73e8",  
    borderColor: "#1a73e8",  
  },  
  categoryChipText: {  
    fontSize: 14,  
    color: "#666",  
    fontWeight: "500",  
  },  
  categoryChipTextSelected: {  
    color: "#fff",  
    fontWeight: "600",  
  },  
  faqSection: {  
    backgroundColor: "#fff",  
    marginTop: 16,  
    paddingVertical: 16,  
  },  
  faqItem: {  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  faqHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
  },  
  faqQuestion: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    flex: 1,  
    marginRight: 12,  
  },  
  faqAnswer: {  
    fontSize: 14,  
    color: "#666",  
    marginTop: 12,  
    lineHeight: 20,  
  },  
  quickActionsSection: {  
    backgroundColor: "#fff",  
    marginTop: 16,  
    paddingVertical: 16,  
  },  
  quickActionItem: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingHorizontal: 16,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: "#f0f0f0",  
  },  
  quickActionIcon: {  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    backgroundColor: "#e8f0fe",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  quickActionInfo: {  
    flex: 1,  
  },  
  quickActionTitle: {  
    fontSize: 16,  
    fontWeight: "500",  
    color: "#333",  
    marginBottom: 2,  
  },  
  quickActionDescription: {  
    fontSize: 14,  
    color: "#666",  
  },  
  contactSection: {  
    backgroundColor: "#fff",  
    marginTop: 16,  
    padding: 16,  
    alignItems: "center",  
  },  
  contactDescription: {  
    fontSize: 14,  
    color: "#666",  
    textAlign: "center",  
    marginBottom: 16,  
  },  
  contactSupportButton: {  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#1a73e8",  
    paddingHorizontal: 20,  
    paddingVertical: 12,  
    borderRadius: 8,  
    gap: 8,  
  },  
  contactSupportText: {  
    color: "#fff",  
    fontSize: 16,  
    fontWeight: "bold",  
  },  
  modalContainer: {  
    flex: 1,  
    backgroundColor: "#fff",  
  },  
  modalHeader: {  
    flexDirection: "row",  
    justifyContent: "space-between",  
    alignItems: "center",  
    padding: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: "#e1e4e8",  
  },  
  modalTitle: {  
    fontSize: 20,  
    fontWeight: "bold",  
    color: "#333",  
  },  
  closeButton: {  
    padding: 8,  
  },  
  modalContent: {  
    flex: 1,  
    padding: 16,  
  },  
  contactOption: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 16,  
    paddingHorizontal: 16,  
    backgroundColor: "#f8f9fa",  
    borderRadius: 8,  
    marginBottom: 12,  
  },  
  contactIcon: {  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    backgroundColor: "#e8f0fe",  
    justifyContent: "center",  
    alignItems: "center",  
    marginRight: 12,  
  },  
  contactInfo: {  
    flex: 1,  
  },  
  contactTitle: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#333",  
    marginBottom: 2,  
  },  
  contactDescription: {  
    fontSize: 14,  
    color: "#666",  
  },  
})