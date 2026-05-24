import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// URLs API
const API_BASE_URL = 'https://visitebejai.onrender.com/api/reservations-admin';
const API_USERS_URL = 'https://visitebejai.onrender.com/api/users';

export default function AdminDashboard() {
  const router = useRouter();
  
  // États utilisateur
  const [userInfo, setUserInfo] = useState({
    id: null,
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'admin',
    photo: null
  });
  const [loading, setLoading] = useState(true);

  // États réservations
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  
  // États de recherche
  const [searchDate, setSearchDate] = useState('');
  const [searchName, setSearchName] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // États du formulaire client
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [tel, setTel] = useState('');
  const [personnes, setPersonnes] = useState('1');
  const [activite, setActivite] = useState('Bateau');
  const [heure, setHeure] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // États du formulaire bateau
  const [boatNom, setBoatNom] = useState('');
  const [boatPrenom, setBoatPrenom] = useState('');
  const [boatTel, setBoatTel] = useState('');
  const [boatCircuit, setBoatCircuit] = useState('30');
  const [boatSlot, setBoatSlot] = useState('');
  const [boatSubSlot, setBoatSubSlot] = useState('');
  const [boatNumber, setBoatNumber] = useState('1');
  const [boatDate, setBoatDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBoatDatePicker, setShowBoatDatePicker] = useState(false);
  
  // États des créneaux
  const [timeSlots, setTimeSlots] = useState(['09h-11h', '11h-13h', '13h-15h', '15h-17h', '17h-19h']);
  const [newSlot, setNewSlot] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  
  // Réservations bateau
  const [boatReservations, setBoatReservations] = useState([]);
  
  // États des employeurs avec statut en ligne
  const [employeurs, setEmployeurs] = useState([]);
  const [employeursLoading, setEmployeursLoading] = useState(false);
  const [showCreateEmployeurModal, setShowCreateEmployeurModal] = useState(false);
  const [onlineEmployeurs, setOnlineEmployeurs] = useState([]);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [newEmployeur, setNewEmployeur] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    telephone: '',
    role: 'employeur'
  });
  
  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editProfile, setEditProfile] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: ''
  });
  
  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // Formater le temps depuis la dernière activité
  const formatLastActive = (date) => {
    if (!date) return 'Jamais';
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    return `Il y a ${days} j`;
  };

  // Mettre à jour le statut en ligne des employeurs
  const updateOnlineStatus = () => {
    const now = new Date();
    const updatedStatus = employeurs.map(emp => {
      // Simuler une activité (dans une vraie app, utiliser WebSocket)
      const lastActiveTime = emp.lastActive ? new Date(emp.lastActive) : new Date(now.getTime() - Math.random() * 3600000);
      const isOnline = (now - lastActiveTime) < 5 * 60 * 1000; // 5 minutes d'inactivité max
      
      return {
        ...emp,
        isOnline,
        lastActiveStr: formatLastActive(lastActiveTime)
      };
    });
    
    setOnlineEmployeurs(updatedStatus);
  };

  // Vérifier l'utilisateur connecté
  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  useEffect(() => {
    if (boatSlot) {
      generateSubSlots(boatSlot);
    }
  }, [boatSlot]);

  // Rafraîchir les statuts périodiquement
  useEffect(() => {
    if (employeurs.length > 0) {
      updateOnlineStatus();
      const interval = setInterval(() => {
        updateOnlineStatus();
      }, 30000); // Toutes les 30 secondes
      
      return () => clearInterval(interval);
    }
  }, [employeurs]);

  const checkUserAndLoadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (!userStr || !token) {
        router.replace('/auth/login');
        return;
      }
      
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        Alert.alert('Accès refusé', 'Cette page est réservée aux administrateurs');
        router.replace('/(tabs)/home');
        return;
      }
      
      setUserInfo(user);
      await loadInitialData();
    } catch (error) {
      console.error('Erreur vérification:', error);
      router.replace('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          router.replace('/auth/login');
        }
      }
    ]);
  };

  const updateUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_USERS_URL}/${userInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nom: editProfile.nom,
          prenom: editProfile.prenom,
          telephone: editProfile.telephone,
          email: editProfile.email
        })
      });

      if (response.ok) {
        const updatedUser = { ...userInfo, ...editProfile };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUserInfo(updatedUser);
        setEditProfileModalVisible(false);
        Alert.alert('Succès', 'Profil mis à jour avec succès');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  const loadInitialData = async () => {
    await Promise.all([
      loadSlots(),
      loadReservations(),
      loadEmployeurs()
    ]);
    animateEntrance();
  };

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadSlots = async () => {
    try {
      const savedSlots = await AsyncStorage.getItem('timeSlots');
      if (savedSlots) {
        setTimeSlots(JSON.parse(savedSlots));
        if (JSON.parse(savedSlots).length > 0) {
          setBoatSlot(JSON.parse(savedSlots)[0]);
        }
      } else {
        if (timeSlots.length > 0) setBoatSlot(timeSlots[0]);
      }
    } catch (error) {
      console.error('Erreur chargement créneaux:', error);
    }
  };

  const saveSlots = async (slots) => {
    try {
      await AsyncStorage.setItem('timeSlots', JSON.stringify(slots));
      setTimeSlots(slots);
      if (slots.length > 0 && !slots.includes(boatSlot)) {
        setBoatSlot(slots[0]);
      }
    } catch (error) {
      console.error('Erreur sauvegarde créneaux:', error);
    }
  };

  const loadReservations = async () => {
    setReservationsLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
        setFilteredReservations(data);
        setBoatReservations(data.filter(r => r.activite === 'Bateau'));
      } else {
        const localData = await AsyncStorage.getItem('reservationsData');
        const data = localData ? JSON.parse(localData) : [];
        setReservations(data);
        setFilteredReservations(data);
        setBoatReservations(data.filter(r => r.activite === 'Bateau'));
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      const localData = await AsyncStorage.getItem('reservationsData');
      const data = localData ? JSON.parse(localData) : [];
      setReservations(data);
      setFilteredReservations(data);
      setBoatReservations(data.filter(r => r.activite === 'Bateau'));
    } finally {
      setReservationsLoading(false);
    }
  };

  const loadEmployeurs = async () => {
    setEmployeursLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_USERS_URL}/employeurs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployeurs(data);
        
        // Initialiser les statuts en ligne avec des données simulées
        const now = new Date();
        const onlineStatus = data.map(emp => ({
          ...emp,
          isOnline: Math.random() > 0.5,
          lastActive: new Date(now.getTime() - Math.random() * 7200000),
          lastActiveStr: formatLastActive(new Date(now.getTime() - Math.random() * 7200000))
        }));
        setOnlineEmployeurs(onlineStatus);
      }
    } catch (error) {
      console.error('Erreur chargement employeurs:', error);
    } finally {
      setEmployeursLoading(false);
    }
  };

  const createEmployeur = async () => {
    if (!newEmployeur.nom || !newEmployeur.prenom || !newEmployeur.email || !newEmployeur.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (newEmployeur.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_USERS_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEmployeur)
      });

      if (response.ok) {
        Alert.alert('Succès', 'Compte employeur créé avec succès');
        setShowCreateEmployeurModal(false);
        setNewEmployeur({
          nom: '',
          prenom: '',
          email: '',
          password: '',
          telephone: '',
          role: 'employeur'
        });
        loadEmployeurs();
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Impossible de créer le compte');
      }
    } catch (error) {
      console.error('Erreur création employeur:', error);
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  const deleteEmployeur = async (id) => {
    Alert.alert('Confirmation', 'Supprimer cet employeur ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_USERS_URL}/${id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.ok) {
              Alert.alert('Succès', 'Employeur supprimé');
              loadEmployeurs();
            }
          } catch (error) {
            console.error('Erreur suppression:', error);
          }
        }
      }
    ]);
  };

  const saveReservationsToLocal = async (data) => {
    try {
      await AsyncStorage.setItem('reservationsData', JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde locale:', error);
    }
  };

  const searchReservations = () => {
    let filtered = [...reservations];
    if (searchDate) {
      filtered = filtered.filter(r => r.date === searchDate);
    }
    if (searchName) {
      filtered = filtered.filter(r => 
        (r.nom && r.nom.toLowerCase().includes(searchName.toLowerCase())) ||
        (r.prenom && r.prenom.toLowerCase().includes(searchName.toLowerCase()))
      );
    }
    setFilteredReservations(filtered);
  };

  const clearSearch = () => {
    setSearchDate('');
    setSearchName('');
    setFilteredReservations(reservations);
  };

  const generateSubSlots = (slot) => {
    if (!slot) return [];
    const [start, end] = slot.split('-');
    const startHour = parseInt(start.replace('h', ''));
    const endHour = parseInt(end.replace('h', ''));
    const subSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      subSlots.push(`${hour.toString().padStart(2, '0')}h00-${hour.toString().padStart(2, '0')}h30`);
      subSlots.push(`${hour.toString().padStart(2, '0')}h30-${(hour + 1).toString().padStart(2, '0')}h00`);
    }
    if (subSlots.length > 0 && boatSubSlot !== subSlots[0]) {
      setBoatSubSlot(subSlots[0]);
    }
    return subSlots;
  };

  const getSubSlots = () => {
    if (!boatSlot) return [];
    const [start, end] = boatSlot.split('-');
    const startHour = parseInt(start.replace('h', ''));
    const endHour = parseInt(end.replace('h', ''));
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}h00-${hour.toString().padStart(2, '0')}h30`);
      slots.push(`${hour.toString().padStart(2, '0')}h30-${(hour + 1).toString().padStart(2, '0')}h00`);
    }
    return slots;
  };

  const checkSlotAvailability = (date, slot, subslot, boatNumber) => {
    return boatReservations.some(r => 
      r.date === date && 
      r.slot === slot && 
      r.subslot === subslot && 
      r.bateau === `Bateau ${boatNumber}`
    );
  };

  const addReservation = async () => {
    if (!nom || !prenom) {
      Alert.alert('Erreur', 'Veuillez remplir le nom et prénom');
      return;
    }

    const newReservation = {
      nom, prenom, tel, activite,
      heure: heure || '--:--',
      date: date || new Date().toISOString().split('T')[0],
      personnes: parseInt(personnes) || 1,
      paymentStatus: 'non_paye',
      deposit: 0
    };

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReservation)
      });
      
      if (response.ok) {
        const saved = await response.json();
        const updatedReservations = [...reservations, saved];
        setReservations(updatedReservations);
        setFilteredReservations(updatedReservations);
        saveReservationsToLocal(updatedReservations);
        if (activite === 'Bateau') {
          setBoatReservations(updatedReservations.filter(r => r.activite === 'Bateau'));
        }
        Alert.alert('Succès', 'Réservation ajoutée avec succès !');
        resetClientForm();
      } else {
        throw new Error('Erreur serveur');
      }
    } catch (error) {
      const newResWithId = { ...newReservation, id: Date.now() };
      const updatedReservations = [...reservations, newResWithId];
      setReservations(updatedReservations);
      setFilteredReservations(updatedReservations);
      saveReservationsToLocal(updatedReservations);
      Alert.alert('Info', 'Réservation sauvegardée localement (hors ligne)');
      resetClientForm();
    }
  };

  const addBoatReservation = async () => {
    if (!boatNom || !boatPrenom) {
      Alert.alert('Erreur', 'Veuillez remplir le nom et prénom');
      return;
    }
    if (!boatTel) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone');
      return;
    }

    const subSlots = getSubSlots();
    const selectedSubSlot = subSlots[parseInt(boatSubSlot)] || boatSubSlot;

    if (checkSlotAvailability(boatDate, boatSlot, selectedSubSlot, boatNumber)) {
      Alert.alert('Erreur', 'Ce créneau est déjà réservé pour cette date et ce bateau !');
      return;
    }

    const reservationDB = {
      nom: boatNom, prenom: boatPrenom, tel: boatTel,
      activite: 'Bateau',
      heure: selectedSubSlot?.split('-')[0] || '',
      date: boatDate,
      personnes: 1,
      slot: boatSlot,
      subslot: selectedSubSlot,
      bateau: `Bateau ${boatNumber}`,
      duree: boatCircuit + ' min',
      paymentStatus: 'non_paye',
      deposit: 0
    };

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationDB)
      });
      
      if (response.ok) {
        const saved = await response.json();
        const updatedReservations = [...reservations, saved];
        setReservations(updatedReservations);
        setFilteredReservations(updatedReservations);
        setBoatReservations(updatedReservations.filter(r => r.activite === 'Bateau'));
        saveReservationsToLocal(updatedReservations);
        Alert.alert('Succès', `Réservation confirmée !\nBateau ${boatNumber} - ${boatSlot} : ${selectedSubSlot}\nDate: ${boatDate}`);
        resetBoatForm();
      } else {
        throw new Error('Erreur serveur');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la réservation');
    }
  };

  const deleteReservation = async (id) => {
    Alert.alert('Suppression', 'Supprimer cette réservation ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
            if (response.ok) {
              const updatedReservations = reservations.filter(r => r.id !== id);
              setReservations(updatedReservations);
              setFilteredReservations(updatedReservations);
              setBoatReservations(updatedReservations.filter(r => r.activite === 'Bateau'));
              saveReservationsToLocal(updatedReservations);
              Alert.alert('Succès', 'Réservation supprimée');
            } else {
              throw new Error('Erreur suppression');
            }
          } catch (error) {
            const updatedReservations = reservations.filter(r => r.id !== id);
            setReservations(updatedReservations);
            setFilteredReservations(updatedReservations);
            setBoatReservations(updatedReservations.filter(r => r.activite === 'Bateau'));
            saveReservationsToLocal(updatedReservations);
            Alert.alert('Info', 'Réservation supprimée localement');
          }
        }
      }
    ]);
  };

  const updatePaymentStatus = (id, status, deposit = 0) => {
    const updatedReservations = reservations.map(r => {
      if (r.id === id) {
        return { ...r, paymentStatus: status, deposit: deposit };
      }
      return r;
    });
    setReservations(updatedReservations);
    setFilteredReservations(updatedReservations);
    saveReservationsToLocal(updatedReservations);
    if (selectedReservation && selectedReservation.id === id) {
      setSelectedReservation({ ...selectedReservation, paymentStatus: status, deposit: deposit });
    }
  };

  const resetClientForm = () => {
    setNom(''); setPrenom(''); setTel(''); setPersonnes('1'); setHeure('');
    setModalVisible(false);
  };

  const resetBoatForm = () => {
    setBoatNom(''); setBoatPrenom(''); setBoatTel('');
    setModalVisible(false);
  };

  const addTimeSlot = () => {
    if (!newSlot.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un créneau (ex: 19h-21h)');
      return;
    }
    if (timeSlots.includes(newSlot)) {
      Alert.alert('Erreur', 'Ce créneau existe déjà');
      return;
    }
    const updatedSlots = [...timeSlots, newSlot].sort();
    saveSlots(updatedSlots);
    setNewSlot('');
    Alert.alert('Succès', `Créneau "${newSlot}" ajouté`);
  };

  const deleteSlot = (slot) => {
    if (!deleteMode) return;
    Alert.alert('Suppression', `Supprimer le créneau "${slot}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          const updatedSlots = timeSlots.filter(s => s !== slot);
          saveSlots(updatedSlots);
          if (boatSlot === slot && updatedSlots.length > 0) {
            setBoatSlot(updatedSlots[0]);
          }
          Alert.alert('Succès', `Créneau "${slot}" supprimé`);
        }
      }
    ]);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadReservations(), loadEmployeurs()]).finally(() => setRefreshing(false));
  }, []);

  const getTodayReservations = () => {
    const today = new Date().toISOString().split('T')[0];
    return reservations.filter(r => r.date === today);
  };

  const getTodayBoatReservations = () => {
    const today = new Date().toISOString().split('T')[0];
    return reservations.filter(r => r.date === today && r.activite === 'Bateau');
  };

  const getNotificationCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return reservations.filter(r => r.date === today).length;
  };

  const getPaymentStatusText = (status) => {
    switch(status) {
      case 'paye': return { text: 'Payé', color: '#4caf50', icon: 'checkmark-circle' };
      case 'verse': return { text: 'Acompte versé', color: '#ff9800', icon: 'time' };
      default: return { text: 'Non payé', color: '#f44336', icon: 'close-circle' };
    }
  };

  const getActivityColor = (activite) => {
    const colors = {
      'Bateau': '#4caf50',
      'Visite guidée': '#2196f3',
      'Quad': '#ff9800',
      'Cheval': '#8bc34a',
      'Jetski': '#00bcd4',
      'Parapente': '#9c27b0'
    };
    return colors[activite] || '#757575';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a2540" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        <LinearGradient
          colors={['#0a2540', '#1a3a5c', '#2a4a6c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View>
            <View style={styles.headerTop}>
              <View style={styles.logoContainer}>
                <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.logoIcon}>
                  <Text style={styles.logoEmoji}>🌊</Text>
                </LinearGradient>
                <View>
                  <Text style={styles.logoText}>Visit Béjaïa</Text>
                  <Text style={styles.logoSubtext}>Administration</Text>
                </View>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setNotifModalVisible(true)}>
                  <Ionicons name="notifications-outline" size={24} color="white" />
                  {getNotificationCount() > 0 && (
                    <View style={styles.notifBadge}>
                      <Text style={styles.notifBadgeText}>{getNotificationCount()}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setProfileModalVisible(true)}>
                  <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.profileIcon}>
                    <Text style={styles.profileIconText}>
                      {userInfo.prenom ? userInfo.prenom[0] : 'A'}{userInfo.nom ? userInfo.nom[0] : 'D'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeGreeting}>Bonjour,</Text>
              <Text style={styles.welcomeName}>
                {userInfo.prenom} {userInfo.nom} 👋
              </Text>
              <Text style={styles.welcomeDate}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>

            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{getTodayReservations().length}</Text>
                <Text style={styles.headerStatLabel}>Aujourd'hui</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{reservations.length}</Text>
                <Text style={styles.headerStatLabel}>Total</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{boatReservations.length}</Text>
                <Text style={styles.headerStatLabel}>Bateaux</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0077b6']} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {activeTab === 'today' && renderTodayReservations()}
          {activeTab === 'reservations' && renderReservationsTab()}
          {activeTab === 'boat' && renderBoatTab()}
          {activeTab === 'admin' && renderAdminTab()}
          {activeTab === 'employeurs' && renderEmployeursTab()}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.fabGradient}>
            <Ionicons name="add" size={30} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={[styles.navItem, activeTab === 'today' && styles.navItemActive]} onPress={() => setActiveTab('today')}>
            <LinearGradient colors={activeTab === 'today' ? ['#FF6B6B', '#FF8E53'] : ['#fff', '#fff']} style={styles.navIconCircle}>
              <Ionicons name="calendar" size={22} color={activeTab === 'today' ? 'white' : '#666'} />
            </LinearGradient>
            <Text style={[styles.navItemText, activeTab === 'today' && styles.navItemTextActive]}>Aujourd'hui</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navItem, activeTab === 'reservations' && styles.navItemActive]} onPress={() => setActiveTab('reservations')}>
            <LinearGradient colors={activeTab === 'reservations' ? ['#FF6B6B', '#FF8E53'] : ['#fff', '#fff']} style={styles.navIconCircle}>
              <Ionicons name="list" size={22} color={activeTab === 'reservations' ? 'white' : '#666'} />
            </LinearGradient>
            <Text style={[styles.navItemText, activeTab === 'reservations' && styles.navItemTextActive]}>Réservations</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navItem, activeTab === 'boat' && styles.navItemActive]} onPress={() => setActiveTab('boat')}>
            <LinearGradient colors={activeTab === 'boat' ? ['#FF6B6B', '#FF8E53'] : ['#fff', '#fff']} style={styles.navIconCircle}>
              <Ionicons name="boat" size={22} color={activeTab === 'boat' ? 'white' : '#666'} />
            </LinearGradient>
            <Text style={[styles.navItemText, activeTab === 'boat' && styles.navItemTextActive]}>Bateau</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navItem, activeTab === 'admin' && styles.navItemActive]} onPress={() => setActiveTab('admin')}>
            <LinearGradient colors={activeTab === 'admin' ? ['#FF6B6B', '#FF8E53'] : ['#fff', '#fff']} style={styles.navIconCircle}>
              <Ionicons name="settings" size={22} color={activeTab === 'admin' ? 'white' : '#666'} />
            </LinearGradient>
            <Text style={[styles.navItemText, activeTab === 'admin' && styles.navItemTextActive]}>Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navItem, activeTab === 'employeurs' && styles.navItemActive]} onPress={() => setActiveTab('employeurs')}>
            <LinearGradient colors={activeTab === 'employeurs' ? ['#FF6B6B', '#FF8E53'] : ['#fff', '#fff']} style={styles.navIconCircle}>
              <Ionicons name="people" size={22} color={activeTab === 'employeurs' ? 'white' : '#666'} />
            </LinearGradient>
            <Text style={[styles.navItemText, activeTab === 'employeurs' && styles.navItemTextActive]}>Employeurs</Text>
          </TouchableOpacity>
        </View>

        {renderAddReservationModal()}
        {renderProfileModal()}
        {renderNotifModal()}
        {renderDetailModal()}
        {renderEditProfileModal()}
        {renderCreateEmployeurModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // ========== FONCTIONS DE RENDU ==========

  function renderTodayReservations() {
    const todayReservations = getTodayReservations();
    const todayBoatReservations = getTodayBoatReservations();
    
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
        <View style={styles.todayHeader}>
          <Text style={styles.todayTitle}>📅 Réservations du jour</Text>
          <Text style={styles.todayDate}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {reservationsLoading ? (
          <ActivityIndicator size="large" color="#0077b6" style={{ marginTop: 20 }} />
        ) : (
          <>
            {todayBoatReservations.length > 0 && (
              <View style={styles.boatTodaySection}>
                <Text style={styles.boatTodayTitle}>🚤 Réservations Bateau</Text>
                {timeSlots.map(slot => {
                  const slotsInSlot = todayBoatReservations.filter(r => r.slot === slot);
                  if (slotsInSlot.length === 0) return null;
                  
                  return (
                    <View key={slot} style={styles.boatTodayRow}>
                      <LinearGradient colors={['#1b5e20', '#2e7d32']} style={styles.boatTodaySlot}>
                        <Text style={styles.boatTodaySlotText}>{slot}</Text>
                      </LinearGradient>
                      <View style={styles.boatTodayBoats}>
                        {['1', '2'].map(boatNum => {
                          const boatRes = slotsInSlot.filter(r => r.bateau === `Bateau ${boatNum}`);
                          return (
                            <View key={boatNum} style={styles.boatTodayCell}>
                              <Text style={styles.boatTodayBoatTitle}>Bateau {boatNum}</Text>
                              {boatRes.map((r, idx) => (
                                <TouchableOpacity key={idx} style={styles.boatTodayReservation} onPress={() => {
                                  setSelectedReservation(r);
                                  setDetailModalVisible(true);
                                }}>
                                  <Text style={styles.boatTodayTime}>⏰ {r.subslot || r.heure}</Text>
                                  <Text style={styles.boatTodayName}>👤 {r.nom} {r.prenom}</Text>
                                  <Text style={styles.boatTodayPhone}>📞 {r.tel}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.todayTableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.cellTime]}>Heure</Text>
                <Text style={[styles.tableHeaderCell, styles.cellClient]}>Client</Text>
                <Text style={[styles.tableHeaderCell, styles.cellPhone]}>Téléphone</Text>
                <Text style={[styles.tableHeaderCell, styles.cellActivity]}>Activité</Text>
                <Text style={[styles.tableHeaderCell, styles.cellPeople]}>Pers.</Text>
                <Text style={[styles.tableHeaderCell, styles.cellPayment]}>Paiement</Text>
              </View>
              {todayReservations.filter(r => r.activite !== 'Bateau').map((reservation, index) => {
                const payment = getPaymentStatusText(reservation.paymentStatus || 'non_paye');
                return (
                  <TouchableOpacity key={reservation.id || index} style={styles.tableRow} onPress={() => {
                    setSelectedReservation(reservation);
                    setDetailModalVisible(true);
                  }}>
                    <Text style={[styles.tableCell, styles.cellTime]}>{reservation.heure || '--:--'}</Text>
                    <Text style={[styles.tableCell, styles.cellClient]} numberOfLines={1}>
                      {reservation.nom} {reservation.prenom}
                    </Text>
                    <Text style={[styles.tableCell, styles.cellPhone]} numberOfLines={1}>
                      {reservation.tel || '---'}
                    </Text>
                    <View style={[styles.cellActivity, styles.tableCell]}>
                      <LinearGradient
                        colors={[getActivityColor(reservation.activite), getActivityColor(reservation.activite) + 'cc']}
                        style={styles.activityBadge}
                      >
                        <Text style={styles.activityBadgeText}>{reservation.activite}</Text>
                      </LinearGradient>
                    </View>
                    <Text style={[styles.tableCell, styles.cellPeople]}>{reservation.personnes}</Text>
                    <View style={styles.cellPayment}>
                      <View style={[styles.paymentCellBadge, { backgroundColor: payment.color }]}>
                        <Ionicons name={payment.icon} size={12} color="white" />
                        <Text style={styles.paymentCellText}>{payment.text}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {todayReservations.filter(r => r.activite !== 'Bateau').length === 0 && todayBoatReservations.length === 0 && (
                <View style={styles.emptyState}>
                  <LinearGradient
                    colors={['#f8f9fa', '#e9ecef']}
                    style={styles.emptyStateCard}
                  >
                    <Text style={styles.emptyStateEmoji}>🎉</Text>
                    <Text style={styles.emptyStateText}>Aucune réservation pour aujourd'hui</Text>
                    <Text style={styles.emptyStateSubtext}>Profitez de votre journée !</Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          </>
        )}
      </Animated.View>
    );
  }

  function renderReservationsTab() {
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitleSmall}>🔍 Recherche avancée</Text>
          <View style={styles.searchFilters}>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.datePickerText}>{searchDate || 'Sélectionner une date'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setSearchDate(selectedDate.toISOString().split('T')[0]);
                }}
              />
            )}
            <TextInput
              style={styles.searchInput}
              placeholder="Nom ou prénom..."
              placeholderTextColor="#999"
              value={searchName}
              onChangeText={setSearchName}
            />
            <View style={styles.searchButtons}>
              <TouchableOpacity style={styles.searchBtn} onPress={searchReservations}>
                <Text style={styles.searchBtnText}>🔍 Rechercher</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearBtn} onPress={clearSearch}>
                <Text style={styles.clearBtnText}>🗑️ Effacer</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.searchStats}>
            <Text>📊 {filteredReservations.length} réservation(s)</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>📋 Liste des réservations</Text>
        {reservationsLoading ? (
          <ActivityIndicator size="large" color="#0077b6" style={{ marginTop: 20 }} />
        ) : filteredReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📭</Text>
            <Text style={styles.emptyStateText}>Aucune réservation trouvée</Text>
          </View>
        ) : (
          filteredReservations.map((r, index) => {
            const payment = getPaymentStatusText(r.paymentStatus || 'non_paye');
            return (
              <TouchableOpacity key={r.id || index} onPress={() => {
                setSelectedReservation(r);
                setDetailModalVisible(true);
              }}>
                <View style={styles.reservationCard}>
                  <LinearGradient
                    colors={['#fff', '#f8f9fa']}
                    style={styles.cardGradient}
                  >
                    <View style={styles.reservationHeader}>
                      <View style={styles.reservationIdContainer}>
                        <Text style={styles.reservationId}>#{r.id || index + 1}</Text>
                        <LinearGradient
                          colors={[getActivityColor(r.activite), getActivityColor(r.activite) + 'cc']}
                          style={styles.activiteBadge}
                        >
                          <Text style={styles.activiteBadgeText}>{r.activite}</Text>
                        </LinearGradient>
                      </View>
                      <TouchableOpacity onPress={() => deleteReservation(r.id)}>
                        <Ionicons name="trash-outline" size={22} color="#dc3545" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.reservationInfo}>
                      <View style={styles.reservationRow}>
                        <Ionicons name="person-outline" size={16} color="#666" />
                        <Text style={styles.reservationValue}>{r.nom} {r.prenom}</Text>
                      </View>
                      <View style={styles.reservationRow}>
                        <Ionicons name="call-outline" size={16} color="#666" />
                        <Text style={styles.reservationValue}>{r.tel || 'Non renseigné'}</Text>
                      </View>
                      <View style={styles.reservationRow}>
                        <Ionicons name="people-outline" size={16} color="#666" />
                        <Text style={styles.reservationValue}>{r.personnes} personne(s)</Text>
                      </View>
                      <View style={styles.reservationRow}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.reservationValue}>{r.heure}</Text>
                      </View>
                      <View style={styles.reservationRow}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.reservationValue}>{r.date}</Text>
                      </View>
                      <View style={styles.reservationRow}>
                        <Ionicons name="card-outline" size={16} color="#666" />
                        <View style={[styles.paymentBadgeSmall, { backgroundColor: payment.color }]}>
                          <Ionicons name={payment.icon} size={12} color="white" />
                          <Text style={styles.paymentBadgeSmallText}>{payment.text}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </Animated.View>
    );
  }

  function renderBoatTab() {
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.boatFormCard}>
          <LinearGradient colors={['#0a2540', '#1a3a5c']} style={styles.formHeader}>
            <Text style={styles.formTitle}>🚤 Nouvelle réservation bateau</Text>
          </LinearGradient>
          <View style={styles.formBody}>
            <TextInput style={styles.input} placeholder="Nom" placeholderTextColor="#999" value={boatNom} onChangeText={setBoatNom} />
            <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor="#999" value={boatPrenom} onChangeText={setBoatPrenom} />
            <TextInput style={styles.input} placeholder="Téléphone" placeholderTextColor="#999" value={boatTel} onChangeText={setBoatTel} keyboardType="phone-pad" />
            
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowBoatDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.datePickerText}>📅 Date: {boatDate}</Text>
            </TouchableOpacity>
            {showBoatDatePicker && (
              <DateTimePicker
                value={new Date(boatDate)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowBoatDatePicker(false);
                  if (selectedDate) setBoatDate(selectedDate.toISOString().split('T')[0]);
                }}
              />
            )}
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Durée:</Text>
              <View style={styles.pickerButtons}>
                {['30', '60', '90', '120'].map(d => (
                  <TouchableOpacity key={d} style={[styles.pickerOption, boatCircuit === d && styles.pickerOptionSelected]} onPress={() => setBoatCircuit(d)}>
                    <Text style={[styles.pickerOptionText, boatCircuit === d && styles.pickerOptionTextSelected]}>{d} min</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Créneau principal:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pickerButtons}>
                  {timeSlots.map(slot => (
                    <TouchableOpacity key={slot} style={[styles.pickerOption, boatSlot === slot && styles.pickerOptionSelected]} onPress={() => setBoatSlot(slot)}>
                      <Text style={[styles.pickerOptionText, boatSlot === slot && styles.pickerOptionTextSelected]}>{slot}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Sous-créneau:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pickerButtons}>
                  {getSubSlots().map((slot, idx) => (
                    <TouchableOpacity key={idx} style={[styles.pickerOption, boatSubSlot === slot && styles.pickerOptionSelected]} onPress={() => setBoatSubSlot(slot)}>
                      <Text style={[styles.pickerOptionText, boatSubSlot === slot && styles.pickerOptionTextSelected]}>{slot}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Bateau:</Text>
              <View style={styles.pickerButtons}>
                {['1', '2'].map(b => (
                  <TouchableOpacity key={b} style={[styles.pickerOption, boatNumber === b && styles.pickerOptionSelected]} onPress={() => setBoatNumber(b)}>
                    <Text style={[styles.pickerOptionText, boatNumber === b && styles.pickerOptionTextSelected]}>Bateau {b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={addBoatReservation}>
              <LinearGradient colors={['#0077b6', '#005f8c']} style={styles.submitBtnGradient}>
                <Text style={styles.submitBtnText}>🚤 Réserver</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }

  function renderAdminTab() {
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.adminCard}>
          <Text style={styles.adminCardTitle}>⚙️ Administration des créneaux</Text>
          
          <View style={styles.adminRow}>
            <TextInput style={styles.adminInput} placeholder="Ex: 19h-21h" placeholderTextColor="#999" value={newSlot} onChangeText={setNewSlot} />
            <TouchableOpacity style={styles.adminBtnAdd} onPress={addTimeSlot}>
              <Text style={styles.adminBtnText}>➕ Ajouter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.slotList}>
            <Text style={styles.slotListTitle}>📋 Créneaux existants ({timeSlots.length}):</Text>
            <View style={styles.slotTags}>
              {timeSlots.map(slot => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotTag, deleteMode && styles.slotTagDelete]}
                  onPress={() => deleteSlot(slot)}
                  onLongPress={() => {
                    if (!deleteMode) {
                      Alert.alert('Modifier', `Modifier le créneau "${slot}" ?`, [
                        { text: 'Annuler', style: 'cancel' },
                        {
                          text: 'Modifier',
                          onPress: () => {
                            Alert.prompt('Modifier le créneau', 'Nouveau nom:', [
                              { text: 'Annuler', style: 'cancel' },
                              {
                                text: 'OK',
                                onPress: (newSlotName) => {
                                  if (newSlotName && newSlotName !== slot) {
                                    const updatedSlots = timeSlots.map(s => s === slot ? newSlotName : s);
                                    saveSlots(updatedSlots);
                                    if (boatSlot === slot) setBoatSlot(newSlotName);
                                  }
                                }
                              }
                            ]);
                          }
                        }
                      ]);
                    }
                  }}
                >
                  <Text style={styles.slotTagText}>{slot} {deleteMode ? '🗑️' : '✏️'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.adminActions}>
            <TouchableOpacity style={[styles.adminBtn, styles.adminBtnDelete]} onPress={() => setDeleteMode(!deleteMode)}>
              <Text style={styles.adminBtnText}>{deleteMode ? '❌ Annuler' : '🗑️ Supprimer'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.adminBtn, styles.adminBtnReset]} onPress={() => {
              Alert.alert('Réinitialisation', 'Réinitialiser tous les créneaux par défaut ?', [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Réinitialiser',
                  onPress: () => {
                    const defaultSlots = ['09h-11h', '11h-13h', '13h-15h', '15h-17h', '17h-19h'];
                    saveSlots(defaultSlots);
                    setBoatSlot(defaultSlots[0]);
                  }
                }
              ]);
            }}>
              <Text style={styles.adminBtnText}>🔄 Réinitialiser</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }

  function renderEmployeursTab() {
    const displayEmployeurs = showOnlineOnly 
      ? onlineEmployeurs.filter(emp => emp.isOnline)
      : onlineEmployeurs;

    const onlineCount = onlineEmployeurs.filter(emp => emp.isOnline).length;
    const offlineCount = onlineEmployeurs.filter(emp => !emp.isOnline).length;

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.adminCard}>
          <Text style={styles.adminCardTitle}>👥 Gestion des employeurs</Text>
          
          {/* En-tête avec compteurs en ligne */}
          <View style={styles.onlineStatsContainer}>
            <View style={styles.onlineStatCard}>
              <View style={[styles.onlineIndicator, styles.online]} />
              <Text style={styles.onlineStatNumber}>{onlineCount}</Text>
              <Text style={styles.onlineStatLabel}>En ligne</Text>
            </View>
            <View style={styles.onlineStatCard}>
              <View style={[styles.onlineIndicator, styles.offline]} />
              <Text style={styles.onlineStatNumber}>{offlineCount}</Text>
              <Text style={styles.onlineStatLabel}>Hors ligne</Text>
            </View>
            <View style={styles.onlineStatCard}>
              <Text style={styles.onlineStatNumber}>{employeurs.length}</Text>
              <Text style={styles.onlineStatLabel}>Total</Text>
            </View>
          </View>

          {/* Filtre en ligne/hors ligne */}
          <View style={styles.filterOnlineContainer}>
            <TouchableOpacity 
              style={[styles.filterOnlineBtn, !showOnlineOnly && styles.filterOnlineBtnActive]}
              onPress={() => setShowOnlineOnly(false)}
            >
              <Text style={[styles.filterOnlineText, !showOnlineOnly && styles.filterOnlineTextActive]}>Tous</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterOnlineBtn, showOnlineOnly && styles.filterOnlineBtnActive]}
              onPress={() => setShowOnlineOnly(true)}
            >
              <View style={styles.onlineDot} />
              <Text style={[styles.filterOnlineText, showOnlineOnly && styles.filterOnlineTextActive]}>En ligne uniquement</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.createEmployeurBtn} onPress={() => setShowCreateEmployeurModal(true)}>
            <LinearGradient colors={['#4caf50', '#45a049']} style={styles.createEmployeurBtnGradient}>
              <Ionicons name="person-add" size={20} color="white" />
              <Text style={styles.createEmployeurBtnText}>➕ Nouvel employeur</Text>
            </LinearGradient>
          </TouchableOpacity>

          {employeursLoading ? (
            <ActivityIndicator size="large" color="#0077b6" style={{ marginTop: 20 }} />
          ) : displayEmployeurs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>👥</Text>
              <Text style={styles.emptyStateText}>
                {showOnlineOnly ? 'Aucun employeur en ligne' : 'Aucun employeur'}
              </Text>
            </View>
          ) : (
            displayEmployeurs.map(emp => (
              <View key={emp.id} style={styles.employeurCard}>
                <View style={styles.employeurHeader}>
                  <View style={styles.employeurAvatar}>
                    <Text style={styles.employeurAvatarText}>
                      {emp.prenom?.[0]}{emp.nom?.[0]}
                    </Text>
                    <View style={[styles.onlineBadge, emp.isOnline ? styles.onlineBadgeActive : styles.onlineBadgeInactive]} />
                  </View>
                  <View style={styles.employeurInfo}>
                    <View style={styles.employeurNameRow}>
                      <Text style={styles.employeurName}>{emp.nom} {emp.prenom}</Text>
                      {emp.isOnline && <View style={styles.onlineSmallDot} />}
                    </View>
                    <Text style={styles.employeurEmail}>{emp.email}</Text>
                    <Text style={styles.employeurPhone}>📞 {emp.telephone || 'Non renseigné'}</Text>
                    <Text style={styles.employeurLastActive}>
                      🕐 {emp.isOnline ? 'En ligne' : `Dernière activité: ${emp.lastActiveStr || 'Jamais'}`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteEmployeur(emp.id)} style={styles.employeurDelete}>
                    <Ionicons name="trash-outline" size={22} color="#dc3545" />
                  </TouchableOpacity>
                </View>
                <View style={styles.employeurFooter}>
                  <View style={[styles.employeurStatus, emp.isOnline ? styles.statusActive : styles.statusInactive]}>
                    <Text style={styles.employeurStatusText}>{emp.isOnline ? 'Actif' : 'Inactif'}</Text>
                  </View>
                  <Text style={styles.employeurRole}>{emp.role === 'admin' ? 'Administrateur' : 'Employeur'}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </Animated.View>
    );
  }

  function renderAddReservationModal() {
    return (
      <Modal transparent visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>➕ Nouvelle réservation</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <TextInput style={styles.input} placeholder="Nom" value={nom} onChangeText={setNom} />
              <TextInput style={styles.input} placeholder="Prénom" value={prenom} onChangeText={setPrenom} />
              <TextInput style={styles.input} placeholder="Téléphone" value={tel} onChangeText={setTel} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Personnes" value={personnes} onChangeText={setPersonnes} keyboardType="numeric" />
              
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Activité:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.pickerButtons}>
                    {['Bateau', 'Visite guidée', 'Quad', 'Cheval', 'Jetski', 'Parapente'].map(act => (
                      <TouchableOpacity key={act} style={[styles.pickerOption, activite === act && styles.pickerOptionSelected]} onPress={() => setActivite(act)}>
                        <Text style={[styles.pickerOptionText, activite === act && styles.pickerOptionTextSelected]}>{act}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <TextInput style={styles.input} placeholder="Heure (HH:MM)" value={heure} onChangeText={setHeure} />
              <TouchableOpacity style={styles.dateBtn} onPress={() => Alert.alert('Date', `Date par défaut: ${date}`)}>
                <Text style={styles.dateBtnText}>📅 Date: {date}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={addReservation}>
                <LinearGradient colors={['#0077b6', '#005f8c']} style={styles.submitBtnGradient}>
                  <Text style={styles.submitBtnText}>✅ Ajouter la réservation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  function renderProfileModal() {
    return (
      <Modal transparent visible={profileModalVisible} animationType="fade" onRequestClose={() => setProfileModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProfileModalVisible(false)}>
          <View style={styles.profileModal}>
            <LinearGradient colors={['#0a2540', '#1a3a5c']} style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {userInfo.prenom ? userInfo.prenom[0] : 'A'}{userInfo.nom ? userInfo.nom[0] : 'D'}
                </Text>
              </View>
              <Text style={styles.profileName}>{userInfo.prenom} {userInfo.nom}</Text>
              <Text style={styles.profileEmail}>{userInfo.email}</Text>
              <Text style={styles.profilePhone}>📞 {userInfo.telephone || 'Non renseigné'}</Text>
            </LinearGradient>
            <View style={styles.profileMenu}>
              <TouchableOpacity style={styles.profileMenuItem} onPress={() => {
                setProfileModalVisible(false);
                setEditProfile({
                  nom: userInfo.nom,
                  prenom: userInfo.prenom,
                  telephone: userInfo.telephone || '',
                  email: userInfo.email
                });
                setEditProfileModalVisible(true);
              }}>
                <Ionicons name="person-outline" size={22} color="#333" />
                <Text style={styles.profileMenuText}>Modifier mon profil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileMenuItem}>
                <Ionicons name="stats-chart-outline" size={22} color="#333" />
                <Text style={styles.profileMenuText}>Statistiques</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileMenuItem}>
                <Ionicons name="settings-outline" size={22} color="#333" />
                <Text style={styles.profileMenuText}>Paramètres</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.profileMenuItem, styles.logoutBtn]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#dc3545" />
                <Text style={[styles.profileMenuText, styles.logoutText]}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  function renderEditProfileModal() {
    return (
      <Modal transparent visible={editProfileModalVisible} animationType="slide" onRequestClose={() => setEditProfileModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#0a2540', '#1a3a5c']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Modifier mon profil</Text>
              <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="Nom"
                value={editProfile.nom}
                onChangeText={(text) => setEditProfile({ ...editProfile, nom: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                value={editProfile.prenom}
                onChangeText={(text) => setEditProfile({ ...editProfile, prenom: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={editProfile.email}
                onChangeText={(text) => setEditProfile({ ...editProfile, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Téléphone"
                value={editProfile.telephone}
                onChangeText={(text) => setEditProfile({ ...editProfile, telephone: text })}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.submitBtn} onPress={updateUserProfile}>
                <LinearGradient colors={['#4caf50', '#45a049']} style={styles.submitBtnGradient}>
                  <Text style={styles.submitBtnText}>💾 Sauvegarder</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function renderCreateEmployeurModal() {
    return (
      <Modal transparent visible={showCreateEmployeurModal} animationType="slide" onRequestClose={() => setShowCreateEmployeurModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#4caf50', '#45a049']} style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👥 Nouvel employeur</Text>
              <TouchableOpacity onPress={() => setShowCreateEmployeurModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="Nom *"
                value={newEmployeur.nom}
                onChangeText={(text) => setNewEmployeur({ ...newEmployeur, nom: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Prénom *"
                value={newEmployeur.prenom}
                onChangeText={(text) => setNewEmployeur({ ...newEmployeur, prenom: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                value={newEmployeur.email}
                onChangeText={(text) => setNewEmployeur({ ...newEmployeur, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe * (min 6 caractères)"
                value={newEmployeur.password}
                onChangeText={(text) => setNewEmployeur({ ...newEmployeur, password: text })}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Téléphone"
                value={newEmployeur.telephone}
                onChangeText={(text) => setNewEmployeur({ ...newEmployeur, telephone: text })}
                keyboardType="phone-pad"
              />
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Rôle:</Text>
                <View style={styles.pickerButtons}>
                  <TouchableOpacity
                    style={[styles.pickerOption, newEmployeur.role === 'employeur' && styles.pickerOptionSelected]}
                    onPress={() => setNewEmployeur({ ...newEmployeur, role: 'employeur' })}
                  >
                    <Text style={[styles.pickerOptionText, newEmployeur.role === 'employeur' && styles.pickerOptionTextSelected]}>Employeur</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerOption, newEmployeur.role === 'admin' && styles.pickerOptionSelected]}
                    onPress={() => setNewEmployeur({ ...newEmployeur, role: 'admin' })}
                  >
                    <Text style={[styles.pickerOptionText, newEmployeur.role === 'admin' && styles.pickerOptionTextSelected]}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={createEmployeur}>
                <LinearGradient colors={['#4caf50', '#45a049']} style={styles.submitBtnGradient}>
                  <Text style={styles.submitBtnText}>✅ Créer le compte</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function renderNotifModal() {
    const onlineCount = onlineEmployeurs.filter(emp => emp.isOnline).length;
    
    return (
      <Modal transparent visible={notifModalVisible} animationType="slide" onRequestClose={() => setNotifModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setNotifModalVisible(false)}>
          <View style={styles.notifModal}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>🔔 Notifications</Text>
              <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.notifItem}>
                <View style={styles.notifIcon}>
                  <Ionicons name="today" size={20} color="#0077b6" />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifText}>📅 {getNotificationCount()} réservation(s) aujourd'hui</Text>
                  <Text style={styles.notifDate}>{new Date().toLocaleDateString('fr-FR')}</Text>
                </View>
              </View>
              <View style={styles.notifItem}>
                <View style={styles.notifIcon}>
                  <Ionicons name="boat" size={20} color="#4caf50" />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifText}>🚤 {boatReservations.length} réservation(s) bateau au total</Text>
                  <Text style={styles.notifDate}>Statistiques</Text>
                </View>
              </View>
              <View style={styles.notifItem}>
                <View style={styles.notifIcon}>
                  <Ionicons name="people" size={20} color="#ff9800" />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifText}>👥 {reservations.length} réservation(s) totale(s)</Text>
                  <Text style={styles.notifDate}>Toutes activités confondues</Text>
                </View>
              </View>
              <View style={styles.notifItem}>
                <View style={styles.notifIcon}>
                  <Ionicons name="people" size={20} color="#2196f3" />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifText}>👥 {employeurs.length} employeur(s) enregistré(s)</Text>
                  <Text style={styles.notifDate}>Comptes actifs</Text>
                </View>
              </View>
              <View style={styles.notifItem}>
                <View style={styles.notifIcon}>
                  <Ionicons name="cloud" size={20} color="#4caf50" />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifText}>🟢 {onlineCount} employeur(s) en ligne</Text>
                  <Text style={styles.notifDate}>Actuellement actifs</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  function renderDetailModal() {
    return (
      <Modal transparent visible={detailModalVisible} animationType="fade" onRequestClose={() => setDetailModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDetailModalVisible(false)}>
          <View style={styles.detailModal}>
            {selectedReservation && (
              <>
                <LinearGradient colors={['#0a2540', '#1a3a5c']} style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>Détails de la réservation</Text>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </LinearGradient>
                
                <ScrollView style={styles.detailBody}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>👤 Informations client</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="person" size={20} color="#0077b6" />
                      <Text style={styles.detailLabel}>Nom complet:</Text>
                      <Text style={styles.detailValue}>{selectedReservation.nom} {selectedReservation.prenom}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="call" size={20} color="#0077b6" />
                      <Text style={styles.detailLabel}>Téléphone:</Text>
                      <Text style={styles.detailValue}>{selectedReservation.tel || 'Non renseigné'}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>📅 Informations réservation</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={20} color="#0077b6" />
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>{selectedReservation.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={20} color="#0077b6" />
                      <Text style={styles.detailLabel}>Heure:</Text>
                      <Text style={styles.detailValue}>{selectedReservation.heure || '--:--'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="people" size={20} color="#0077b6" />
                      <Text style={styles.detailLabel}>Personnes:</Text>
                      <Text style={styles.detailValue}>{selectedReservation.personnes}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="boat" size={20} color="#0077b6" />
                      <Text style={styles.detailLabel}>Activité:</Text>
                      <View style={[styles.activityBadgeDetail, { backgroundColor: getActivityColor(selectedReservation.activite) }]}>
                        <Text style={styles.activityBadgeText}>{selectedReservation.activite}</Text>
                      </View>
                    </View>
                    {selectedReservation.bateau && (
                      <View style={styles.detailRow}>
                        <Ionicons name="boat" size={20} color="#0077b6" />
                        <Text style={styles.detailLabel}>Bateau:</Text>
                        <Text style={styles.detailValue}>{selectedReservation.bateau}</Text>
                      </View>
                    )}
                    {selectedReservation.duree && (
                      <View style={styles.detailRow}>
                        <Ionicons name="hourglass" size={20} color="#0077b6" />
                        <Text style={styles.detailLabel}>Durée:</Text>
                        <Text style={styles.detailValue}>{selectedReservation.duree}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>💰 Paiement</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="card" size={20} color="#0077b6" />
                      <Text style={styles.detailLabel}>Statut:</Text>
                      <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusText(selectedReservation.paymentStatus || 'non_paye').color }]}>
                        <Ionicons name={getPaymentStatusText(selectedReservation.paymentStatus || 'non_paye').icon} size={16} color="white" />
                        <Text style={styles.paymentBadgeText}>{getPaymentStatusText(selectedReservation.paymentStatus || 'non_paye').text}</Text>
                      </View>
                    </View>
                    {selectedReservation.deposit > 0 && (
                      <View style={styles.detailRow}>
                        <Ionicons name="cash" size={20} color="#0077b6" />
                        <Text style={styles.detailLabel}>Acompte versé:</Text>
                        <Text style={styles.detailValue}>{selectedReservation.deposit} DA</Text>
                      </View>
                    )}
                    
                    <View style={styles.paymentButtons}>
                      <TouchableOpacity 
                        style={[styles.paymentBtn, styles.paymentBtnNonPaye]}
                        onPress={() => {
                          updatePaymentStatus(selectedReservation.id, 'non_paye', 0);
                          Alert.alert('Succès', 'Statut de paiement mis à jour');
                        }}
                      >
                        <Text style={styles.paymentBtnText}>❌ Non payé</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.paymentBtn, styles.paymentBtnVerse]}
                        onPress={() => {
                          Alert.prompt('Acompte', 'Montant de l\'acompte (DA):', [
                            { text: 'Annuler', style: 'cancel' },
                            {
                              text: 'Confirmer',
                              onPress: (amount) => {
                                if (amount && !isNaN(amount)) {
                                  updatePaymentStatus(selectedReservation.id, 'verse', parseInt(amount));
                                  Alert.alert('Succès', 'Acompte enregistré');
                                }
                              }
                            }
                          ]);
                        }}
                      >
                        <Text style={styles.paymentBtnText}>💰 Acompte versé</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.paymentBtn, styles.paymentBtnPaye]}
                        onPress={() => {
                          updatePaymentStatus(selectedReservation.id, 'paye', 0);
                          Alert.alert('Succès', 'Paiement confirmé');
                        }}
                      >
                        <Text style={styles.paymentBtnText}>✅ Payé</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.deleteDetailBtn}
                    onPress={() => {
                      setDetailModalVisible(false);
                      deleteReservation(selectedReservation.id);
                    }}
                  >
                    <Ionicons name="trash" size={20} color="white" />
                    <Text style={styles.deleteDetailBtnText}>Supprimer la réservation</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FF6B35',
  },
  safeArea: { flex: 1, backgroundColor: '#0a2540' },
  container: { flex: 1, backgroundColor: '#f4f7fb' },
  header: { paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 15, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoEmoji: { fontSize: 28 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  logoSubtext: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  profileIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  profileIconText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  notifBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF6B6B', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  notifBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  welcomeSection: { marginTop: 15, marginBottom: 10, paddingHorizontal: 5 },
  welcomeGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  welcomeName: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  welcomeDate: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  headerStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  headerStat: { alignItems: 'center' },
  headerStatValue: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  headerStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  scrollView: { flex: 1 },
  scrollViewContent: { paddingBottom: 80 },
  todayHeader: { backgroundColor: 'white', margin: 15, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  todayTitle: { fontSize: 24, fontWeight: 'bold', color: '#0a2540', textAlign: 'center' },
  todayDate: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
  boatTodaySection: { marginHorizontal: 15, marginBottom: 20, backgroundColor: 'white', borderRadius: 15, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  boatTodayTitle: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32', padding: 15, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  boatTodayRow: { marginBottom: 5 },
  boatTodaySlot: { padding: 10 },
  boatTodaySlotText: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 13 },
  boatTodayBoats: { flexDirection: 'row' },
  boatTodayCell: { flex: 1, padding: 10, borderRightWidth: 1, borderRightColor: '#e0e0e0' },
  boatTodayBoatTitle: { fontWeight: 'bold', marginBottom: 8, textAlign: 'center', fontSize: 12, color: '#2e7d32' },
  boatTodayReservation: { backgroundColor: '#e8f5e9', padding: 8, marginVertical: 4, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#4caf50' },
  boatTodayTime: { fontSize: 10, fontWeight: 'bold' },
  boatTodayName: { fontSize: 10 },
  boatTodayPhone: { fontSize: 9, color: '#666' },
  todayTableContainer: { marginHorizontal: 15, backgroundColor: 'white', borderRadius: 15, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0a2540', paddingVertical: 12, paddingHorizontal: 10 },
  tableHeaderCell: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  tableCell: { fontSize: 11, color: '#333' },
  cellTime: { width: 55 },
  cellClient: { flex: 2 },
  cellPhone: { flex: 1.5 },
  cellActivity: { width: 75 },
  cellPeople: { width: 40, textAlign: 'center' },
  cellPayment: { width: 70, alignItems: 'center' },
  paymentCellBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10, gap: 3 },
  paymentCellText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  activityBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  activityBadgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  searchSection: { backgroundColor: 'white', margin: 15, padding: 15, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  sectionTitleSmall: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  searchFilters: { gap: 10 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, backgroundColor: '#f8f9fa' },
  datePickerText: { flex: 1, color: '#333' },
  searchInput: { padding: 12, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, backgroundColor: '#f8f9fa' },
  searchButtons: { flexDirection: 'row', gap: 10 },
  searchBtn: { flex: 1, backgroundColor: '#FF6B6B', padding: 12, borderRadius: 12, alignItems: 'center' },
  searchBtnText: { color: 'white', fontWeight: 'bold' },
  clearBtn: { flex: 1, backgroundColor: '#6c757d', padding: 12, borderRadius: 12, alignItems: 'center' },
  clearBtnText: { color: 'white', fontWeight: 'bold' },
  searchStats: { marginTop: 12, padding: 10, backgroundColor: '#e3f2fd', borderRadius: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0a2540', marginHorizontal: 15, marginTop: 20, marginBottom: 15 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateCard: { alignItems: 'center', padding: 30, borderRadius: 20, width: '100%' },
  emptyStateEmoji: { fontSize: 60, marginBottom: 15 },
  emptyStateText: { color: '#666', fontSize: 16, fontWeight: '500' },
  emptyStateSubtext: { color: '#999', fontSize: 13, marginTop: 8 },
  reservationCard: { marginHorizontal: 15, marginBottom: 12, borderRadius: 15, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardGradient: { padding: 15 },
  reservationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reservationIdContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reservationId: { fontSize: 14, fontWeight: 'bold', color: '#0077b6' },
  activiteBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activiteBadgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  reservationInfo: { gap: 8 },
  reservationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reservationValue: { color: '#333', fontSize: 14 },
  paymentBadgeSmall: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, gap: 4 },
  paymentBadgeSmallText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  boatFormCard: { backgroundColor: 'white', margin: 15, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  formHeader: { padding: 20, alignItems: 'center' },
  formBody: { padding: 20 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  input: { padding: 14, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, marginBottom: 12, backgroundColor: '#f8f9fa' },
  pickerContainer: { marginBottom: 12 },
  pickerLabel: { fontWeight: '600', marginBottom: 8, color: '#333' },
  pickerButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#0077b6', backgroundColor: 'white' },
  pickerOptionSelected: { backgroundColor: '#0077b6' },
  pickerOptionText: { color: '#0077b6', fontSize: 13 },
  pickerOptionTextSelected: { color: 'white' },
  submitBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 10 },
  submitBtnGradient: { padding: 15, alignItems: 'center' },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  dateBtn: { padding: 14, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, marginBottom: 12, backgroundColor: '#f8f9fa' },
  dateBtnText: { color: '#333' },
  adminCard: { backgroundColor: 'white', margin: 15, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  adminCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#f97316', marginBottom: 20, textAlign: 'center' },
  adminRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  adminInput: { flex: 1, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  adminBtnAdd: { backgroundColor: '#f97316', padding: 12, borderRadius: 12, justifyContent: 'center' },
  adminBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  adminBtnDelete: { backgroundColor: '#dc3545' },
  adminBtnReset: { backgroundColor: '#ff9800' },
  adminBtnText: { color: 'white', fontWeight: 'bold' },
  adminActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  slotList: { marginBottom: 20 },
  slotListTitle: { fontSize: 13, color: '#666', marginBottom: 10 },
  slotTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotTag: { backgroundColor: '#e3f2fd', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  slotTagDelete: { backgroundColor: '#f44336' },
  slotTagText: { fontSize: 12, color: '#0a2540' },
  createEmployeurBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  createEmployeurBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8 },
  createEmployeurBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  employeurCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  employeurHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, position: 'relative' },
  employeurAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#0077b6', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  employeurAvatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  onlineBadge: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'white' },
  onlineBadgeActive: { backgroundColor: '#4caf50' },
  onlineBadgeInactive: { backgroundColor: '#9e9e9e' },
  employeurInfo: { flex: 1 },
  employeurNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  employeurName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  onlineSmallDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50' },
  employeurEmail: { fontSize: 12, color: '#666', marginTop: 2 },
  employeurPhone: { fontSize: 11, color: '#999', marginTop: 2 },
  employeurLastActive: { fontSize: 10, color: '#999', marginTop: 2 },
  employeurDelete: { padding: 8 },
  employeurFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  employeurStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusActive: { backgroundColor: '#4caf50' },
  statusInactive: { backgroundColor: '#9e9e9e' },
  employeurStatusText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  employeurRole: { fontSize: 11, color: '#666' },
  onlineStatsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  onlineStatCard: { alignItems: 'center' },
  onlineIndicator: { width: 12, height: 12, borderRadius: 6, marginBottom: 8 },
  online: { backgroundColor: '#4caf50', shadowColor: '#4caf50', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4 },
  offline: { backgroundColor: '#9e9e9e' },
  onlineStatNumber: { fontSize: 22, fontWeight: 'bold', color: '#0a2540' },
  onlineStatLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  filterOnlineContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  filterOnlineBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  filterOnlineBtnActive: { backgroundColor: '#0077b6' },
  filterOnlineText: { fontSize: 13, color: '#666' },
  filterOnlineTextActive: { color: 'white' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50' },
  fab: { position: 'absolute', bottom: 80, right: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: 'white', paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  navItemActive: { transform: [{ scale: 1.05 }] },
  navItemText: { fontSize: 11, color: '#666' },
  navItemTextActive: { color: '#FF6B6B', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: height * 0.85, width: '100%', position: 'absolute', bottom: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  modalBody: { padding: 20 },
  detailModal: { backgroundColor: 'white', borderRadius: 25, marginHorizontal: 20, maxHeight: height * 0.85, width: width - 40 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  detailTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  detailBody: { padding: 20 },
  detailSection: { marginBottom: 20, backgroundColor: '#f8f9fa', padding: 15, borderRadius: 15 },
  detailSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0a2540', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  detailLabel: { width: 100, fontSize: 14, color: '#666', marginLeft: 8 },
  detailValue: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  activityBadgeDetail: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paymentBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
  paymentBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  paymentButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
  paymentBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  paymentBtnNonPaye: { backgroundColor: '#f44336' },
  paymentBtnVerse: { backgroundColor: '#ff9800' },
  paymentBtnPaye: { backgroundColor: '#4caf50' },
  paymentBtnText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  deleteDetailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc3545', padding: 15, borderRadius: 12, gap: 10, marginTop: 10 },
  deleteDetailBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  profileModal: { backgroundColor: 'white', borderRadius: 25, marginHorizontal: 20, overflow: 'hidden', width: width - 40 },
  profileHeader: { alignItems: 'center', padding: 30 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  profileAvatarText: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 5 },
  profilePhone: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 5 },
  profileMenu: { padding: 20 },
  profileMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 15 },
  profileMenuText: { fontSize: 16, color: '#333' },
  logoutBtn: { borderBottomWidth: 0 },
  logoutText: { color: '#dc3545' },
  notifModal: { backgroundColor: 'white', borderRadius: 25, marginHorizontal: 20, maxHeight: height * 0.7, width: width - 40 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  notifTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  notifItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 15 },
  notifIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifText: { fontSize: 14, color: '#333' },
  notifDate: { fontSize: 11, color: '#999', marginTop: 4 },
});