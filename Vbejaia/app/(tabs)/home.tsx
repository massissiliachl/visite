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
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BOAT_PRICE_BY_MINUTES,
  buildApiPayload,
  mergeSavedReservation,
  normalizeReservation,
} from '../../utils/reservationHelpers';
import { API_BASE_URL } from '../../config/api';

const { width, height } = Dimensions.get('window');

const API_USERS_URL = API_BASE_URL.replace('/reservations-admin', '/users');

export default function App() {
  // États
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Paiement client
  const [totalAPayer, setTotalAPayer] = useState('');
  const [versement, setVersement] = useState('');
  const [resteAPayer, setResteAPayer] = useState('0');
  const [note, setNote] = useState('');

  // Paiement bateau
  const [boatTotalAPayer, setBoatTotalAPayer] = useState('');
  const [boatVersement, setBoatVersement] = useState('');
  const [boatResteAPayer, setBoatResteAPayer] = useState('0');
  const [boatNote, setBoatNote] = useState('');
  
  // États des créneaux
  const [timeSlots, setTimeSlots] = useState(['09h-11h', '11h-13h', '13h-15h', '15h-17h', '17h-19h']);
  const [newSlot, setNewSlot] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  
  // Réservations bateau
  const [boatReservations, setBoatReservations] = useState([]);
  
  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  
  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // Chargement initial
  useEffect(() => {
    console.log('📡 API réservations:', API_BASE_URL);
    loadSlots();
    loadReservations();
    animateEntrance();
  }, []);

  useEffect(() => {
    if (boatSlot) {
      generateSubSlots(boatSlot);
    }
  }, [boatSlot]);

  useEffect(() => {
    const price = BOAT_PRICE_BY_MINUTES[boatCircuit];
    if (price && (!boatTotalAPayer || parseFloat(boatTotalAPayer) <= 0)) {
      setBoatTotalAPayer(String(price));
      const vers = parseFloat(boatVersement) || 0;
      setBoatResteAPayer(String(Math.max(0, price - vers)));
    }
  }, [boatCircuit]);

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
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (response.ok) {
        const data = await response.json();
        const normalized = data.map(normalizeReservation);
        setReservations(normalized);
        setFilteredReservations(normalized);
        setBoatReservations(normalized.filter((r) => r.activite === 'Bateau'));
      } else {
        const localData = await AsyncStorage.getItem('reservationsData');
        const data = localData ? JSON.parse(localData) : [];
        const normalized = data.map(normalizeReservation);
        setReservations(normalized);
        setFilteredReservations(normalized);
        setBoatReservations(normalized.filter((r) => r.activite === 'Bateau'));
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      const localData = await AsyncStorage.getItem('reservationsData');
      const data = localData ? JSON.parse(localData) : [];
      const normalized = data.map(normalizeReservation);
      setReservations(normalized);
      setFilteredReservations(normalized);
      setBoatReservations(normalized.filter((r) => r.activite === 'Bateau'));
    } finally {
      setLoading(false);
    }
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

  const calculerReste = (totalStr = totalAPayer, versStr = versement) => {
    const total = parseFloat(totalStr) || 0;
    const vers = parseFloat(versStr) || 0;
    setResteAPayer(String(Math.max(0, total - vers)));
  };

  const calculerResteBateau = (totalStr = boatTotalAPayer, versStr = boatVersement) => {
    const total = parseFloat(totalStr) || 0;
    const vers = parseFloat(versStr) || 0;
    setBoatResteAPayer(String(Math.max(0, total - vers)));
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

    const total = parseFloat(totalAPayer) || 0;
    if (total <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir le total à payer (supérieur à 0 DA)');
      return;
    }
    const vers = parseFloat(versement) || 0;
    if (vers > total) {
      Alert.alert('Erreur', 'Le versement ne peut pas dépasser le total');
      return;
    }

    const newReservation = {
      nom,
      prenom,
      tel,
      activite,
      heure: heure || '--:--',
      date: date || new Date().toISOString().split('T')[0],
      personnes: parseInt(personnes) || 1,
      totalAPayer: total,
      versement: vers,
      resteAPayer: Math.max(0, total - vers),
      note: note.trim() || 'Aucune note',
    };

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReservation)
      });
      
      if (response.ok) {
        const saved = mergeSavedReservation(newReservation, await response.json());
        const updatedReservations = [...reservations, saved];
        setReservations(updatedReservations);
        setFilteredReservations(updatedReservations);
        saveReservationsToLocal(updatedReservations);
        if (activite === 'Bateau') {
          setBoatReservations(updatedReservations.filter(r => r.activite === 'Bateau'));
        }
        Alert.alert('Succès', `Réservation ajoutée\nTotal: ${saved.totalAPayer} DA\nVersé: ${saved.versement} DA`);
        resetClientForm();
      } else {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur serveur');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible d\'enregistrer la réservation');
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

    const total = parseFloat(boatTotalAPayer) || 0;
    if (total <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir le total à payer (supérieur à 0 DA)');
      return;
    }
    const vers = parseFloat(boatVersement) || 0;
    if (vers > total) {
      Alert.alert('Erreur', 'Le versement ne peut pas dépasser le total');
      return;
    }

    const subSlots = getSubSlots();
    const selectedSubSlot = subSlots[parseInt(boatSubSlot)] || boatSubSlot;

    if (checkSlotAvailability(boatDate, boatSlot, selectedSubSlot, boatNumber)) {
      Alert.alert('Erreur', 'Ce créneau est déjà réservé pour cette date et ce bateau !');
      return;
    }

    const reservationDB = {
      nom: boatNom,
      prenom: boatPrenom,
      tel: boatTel,
      activite: 'Bateau',
      heure: selectedSubSlot?.split('-')[0] || '',
      date: boatDate,
      personnes: 1,
      slot: boatSlot,
      subslot: selectedSubSlot,
      bateau: `Bateau ${boatNumber}`,
      duree: boatCircuit + ' min',
      totalAPayer: total,
      versement: vers,
      resteAPayer: Math.max(0, total - vers),
      note: boatNote.trim() || 'Aucune note',
    };

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationDB)
      });
      
      if (response.ok) {
        const saved = mergeSavedReservation(reservationDB, await response.json());
        const updatedReservations = [...reservations, saved];
        setReservations(updatedReservations);
        setFilteredReservations(updatedReservations);
        setBoatReservations(updatedReservations.filter(r => r.activite === 'Bateau'));
        saveReservationsToLocal(updatedReservations);
        Alert.alert(
          'Succès',
          `Réservation confirmée !\nBateau ${boatNumber} - ${boatSlot} : ${selectedSubSlot}\nTotal: ${saved.totalAPayer} DA\nVersé: ${saved.versement} DA\nReste: ${saved.resteAPayer} DA`
        );
        resetBoatForm();
      } else {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur serveur');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder la réservation');
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

  const updatePaymentStatus = async (id, status, amount = 0) => {
    const res = reservations.find((r) => r.id === id);
    if (!res) return;

    const total = parseFloat(String(res.totalAPayer)) || 0;
    let vers = parseFloat(String(res.versement)) || 0;
    if (status === 'verse') vers = Math.min(parseFloat(String(amount)) || 0, total);
    else if (status === 'paye') vers = total;
    else vers = 0;

    const updated = normalizeReservation({
      ...res,
      versement: vers,
      resteAPayer: Math.max(0, total - vers),
    });

    const updatedReservations = reservations.map((r) => (r.id === id ? updated : r));
    setReservations(updatedReservations);
    setFilteredReservations(updatedReservations);
    setBoatReservations(updatedReservations.filter((r) => r.activite === 'Bateau'));
    saveReservationsToLocal(updatedReservations);
    if (selectedReservation && selectedReservation.id === id) {
      setSelectedReservation(updated);
    }

    try {
      await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildApiPayload(updated)),
      });
    } catch (e) {
      console.error('Erreur mise à jour paiement:', e);
    }
  };

  const resetClientForm = () => {
    setNom('');
    setPrenom('');
    setTel('');
    setPersonnes('1');
    setHeure('');
    setTotalAPayer('');
    setVersement('');
    setResteAPayer('0');
    setNote('');
    setModalVisible(false);
  };

  const resetBoatForm = () => {
    setBoatNom('');
    setBoatPrenom('');
    setBoatTel('');
    setBoatTotalAPayer('');
    setBoatVersement('');
    setBoatResteAPayer('0');
    setBoatNote('');
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
    loadReservations().finally(() => setRefreshing(false));
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

  // Composant Header
  const renderHeader = () => (
    <LinearGradient
      colors={['#0a2540', '#1a3a5c', '#2a4a6c']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <SafeAreaView>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.logoIcon}
            >
              <Text style={styles.logoEmoji}>🌊</Text>
            </LinearGradient>
            <View>
              <Text style={styles.logoText}>Visit Béjaïa</Text>
              <Text style={styles.logoSubtext}>Administrateur</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => setNotifModalVisible(true)}
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
              {getNotificationCount() > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{getNotificationCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => setProfileModalVisible(true)}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.profileIcon}
              >
                <Text style={styles.profileIconText}>AD</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
      </SafeAreaView>
    </LinearGradient>
  );

  // Modal de détails de réservation
  const renderDetailModal = () => (
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
                    <Ionicons name="cash-outline" size={20} color="#0077b6" />
                    <Text style={styles.detailLabel}>Total:</Text>
                    <Text style={styles.detailValue}>{selectedReservation.totalAPayer || 0} DA</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={20} color="#0077b6" />
                    <Text style={styles.detailLabel}>Versé:</Text>
                    <Text style={styles.detailValue}>{selectedReservation.versement || 0} DA</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="trending-down-outline" size={20} color="#0077b6" />
                    <Text style={styles.detailLabel}>Reste:</Text>
                    <Text style={styles.detailValue}>{selectedReservation.resteAPayer || 0} DA</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="card" size={20} color="#0077b6" />
                    <Text style={styles.detailLabel}>Statut:</Text>
                    <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusText(selectedReservation.paymentStatus || 'non_paye').color }]}>
                      <Ionicons name={getPaymentStatusText(selectedReservation.paymentStatus || 'non_paye').icon} size={16} color="white" />
                      <Text style={styles.paymentBadgeText}>{getPaymentStatusText(selectedReservation.paymentStatus || 'non_paye').text}</Text>
                    </View>
                  </View>
                  
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

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>📝 Note</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={20} color="#0077b6" />
                    <Text style={styles.detailLabel}>Remarque:</Text>
                    <Text style={styles.detailValue}>{selectedReservation.note || 'Aucune note'}</Text>
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

  // Rendu du tableau des réservations du jour avec les bateaux
  const renderTodayReservations = () => {
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

        {loading ? (
          <ActivityIndicator size="large" color="#0077b6" style={{ marginTop: 20 }} />
        ) : (
          <>
            {/* Tableau des réservations bateau du jour */}
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
                                  <Text style={styles.boatTodayPayment}>💰 Total: {r.totalAPayer || 0} DA</Text>
                                  <Text style={styles.boatTodayPayment}>💳 Versé: {r.versement || 0} DA</Text>
                                  <Text style={styles.boatTodayPayment}>📊 Reste: {r.resteAPayer || 0} DA</Text>
                                  {r.note && r.note !== 'Aucune note' ? (
                                    <Text style={styles.boatTodayPayment}>📝 {r.note}</Text>
                                  ) : null}
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

            {/* Tableau des autres réservations du jour */}
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
  };

  // Rendu des réservations
  const renderReservationsTab = () => (
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
      {loading ? (
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
                    <View style={styles.reservationRow}>
                      <Ionicons name="cash-outline" size={16} color="#666" />
                      <Text style={styles.reservationValue}>Total: {r.totalAPayer || 0} DA · Versé: {r.versement || 0} DA · Reste: {r.resteAPayer || 0} DA</Text>
                    </View>
                    {r.note && r.note !== 'Aucune note' ? (
                      <View style={styles.reservationRow}>
                        <Ionicons name="document-text-outline" size={16} color="#666" />
                        <Text style={styles.reservationValue}>{r.note}</Text>
                      </View>
                    ) : null}
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </Animated.View>
  );

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

  // Rendu du formulaire bateau
  const renderBoatTab = () => (
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

          <View style={styles.paymentContainer}>
            <Text style={styles.paymentTitle}>💰 Paiement</Text>
            <View style={styles.paymentRow}>
              <View style={styles.paymentField}>
                <Text style={styles.paymentLabel}>Total à payer (DA)</Text>
                <TextInput
                  style={styles.paymentInput}
                  placeholder="Ex: 16000"
                  keyboardType="numeric"
                  value={boatTotalAPayer}
                  onChangeText={(text) => {
                    setBoatTotalAPayer(text);
                    calculerResteBateau(text, boatVersement);
                  }}
                />
              </View>
              <View style={styles.paymentField}>
                <Text style={styles.paymentLabel}>Versement (DA)</Text>
                <TextInput
                  style={styles.paymentInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={boatVersement}
                  onChangeText={(text) => {
                    setBoatVersement(text);
                    calculerResteBateau(boatTotalAPayer, text);
                  }}
                />
              </View>
            </View>
            <View style={styles.paymentRow}>
              <View style={[styles.paymentField, styles.paymentFieldFull]}>
                <Text style={[styles.paymentLabel, styles.paymentLabelReste]}>Reste à payer (DA)</Text>
                <TextInput
                  style={[styles.paymentInput, styles.paymentInputReste]}
                  value={boatResteAPayer}
                  editable={false}
                />
              </View>
            </View>
            <Text style={styles.paymentLabel}>📝 Note / Remarque</Text>
            <TextInput
              style={[styles.paymentInput, styles.noteInput]}
              placeholder="Ex: Client VIP, allergies..."
              value={boatNote}
              onChangeText={setBoatNote}
              multiline
              numberOfLines={2}
            />
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

  const renderAdminTab = () => (
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

  // Barre de navigation en bas (sans Quad)
  const renderBottomNav = () => (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={[styles.navItem, activeTab === 'today' && styles.navItemActive]}
        onPress={() => setActiveTab('today')}
      >
        <LinearGradient
          colors={activeTab === 'today' ? ['#FF6B6B', '#FF8E53'] : ['#fff', '#fff']}
          style={styles.navIconCircle}
        >
          <Ionicons name="calendar" size={22} color={activeTab === 'today' ? 'white' : '#666'} />
        </LinearGradient>
        <Text style={[styles.navItemText, activeTab === 'today' && styles.navItemTextActive]}>Aujourd'hui</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.navItem, activeTab === 'reservations' && styles.navItemActive]}
        onPress={() => setActiveTab('reservations')}
      >
        <LinearGradient
          colors={activeTab === 'reservations' ? ['#FF6B6B', '#FF8E53'] : ['#fff', '#fff']}
          style={styles.navIconCircle}
        >
          <Ionicons name="list" size={22} color={activeTab === 'reservations' ? 'white' : '#666'} />
        </LinearGradient>
        <Text style={[styles.navItemText, activeTab === 'reservations' && styles.navItemTextActive]}>Réservations</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.navItem, activeTab === 'boat' && styles.navItemActive]}
        onPress={() => setActiveTab('boat')}
      >
        <LinearGradient
          colors={activeTab === 'boat' ? ['#FF6B6B', '#FF8E53'] : ['#fff', '#fff']}
          style={styles.navIconCircle}
        >
          <Ionicons name="boat" size={22} color={activeTab === 'boat' ? 'white' : '#666'} />
        </LinearGradient>
        <Text style={[styles.navItemText, activeTab === 'boat' && styles.navItemTextActive]}>Bateau</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.navItem, activeTab === 'admin' && styles.navItemActive]}
        onPress={() => setActiveTab('admin')}
      >
        <LinearGradient
          colors={activeTab === 'admin' ? ['#FF6B6B', '#FF8E53'] : ['#fff', '#fff']}
          style={styles.navIconCircle}
        >
          <Ionicons name="settings" size={22} color={activeTab === 'admin' ? 'white' : '#666'} />
        </LinearGradient>
        <Text style={[styles.navItemText, activeTab === 'admin' && styles.navItemTextActive]}>Admin</Text>
      </TouchableOpacity>
    </View>
  );

  // Modals
  const renderProfileModal = () => (
    <Modal transparent visible={profileModalVisible} animationType="fade" onRequestClose={() => setProfileModalVisible(false)}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProfileModalVisible(false)}>
        <View style={styles.profileModal}>
          <LinearGradient colors={['#0a2540', '#1a3a5c']} style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>AD</Text>
            </View>
            <Text style={styles.profileName}>Administrateur</Text>
            <Text style={styles.profileEmail}>admin@visitbejaia.com</Text>
          </LinearGradient>
          <View style={styles.profileMenu}>
            <TouchableOpacity style={styles.profileMenuItem}>
              <Ionicons name="person-outline" size={22} color="#333" />
              <Text style={styles.profileMenuText}>Mon profil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileMenuItem}>
              <Ionicons name="stats-chart-outline" size={22} color="#333" />
              <Text style={styles.profileMenuText}>Statistiques</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileMenuItem}>
              <Ionicons name="settings-outline" size={22} color="#333" />
              <Text style={styles.profileMenuText}>Paramètres</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.profileMenuItem, styles.logoutBtn]}>
              <Ionicons name="log-out-outline" size={22} color="#dc3545" />
              <Text style={[styles.profileMenuText, styles.logoutText]}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderNotifModal = () => (
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
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a2540" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {renderHeader()}
        
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
        </ScrollView>

        {/* FAB pour ajouter réservation rapide */}
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.fabGradient}>
            <Ionicons name="add" size={30} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {renderBottomNav()}

        {/* Modal Ajout Rapide */}
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

                <View style={styles.paymentContainer}>
                  <Text style={styles.paymentTitle}>💰 Paiement</Text>
                  <View style={styles.paymentRow}>
                    <View style={styles.paymentField}>
                      <Text style={styles.paymentLabel}>Total (DA)</Text>
                      <TextInput
                        style={styles.paymentInput}
                        placeholder="Ex: 6000"
                        keyboardType="numeric"
                        value={totalAPayer}
                        onChangeText={(text) => {
                          setTotalAPayer(text);
                          calculerReste(text, versement);
                        }}
                      />
                    </View>
                    <View style={styles.paymentField}>
                      <Text style={styles.paymentLabel}>Versement (DA)</Text>
                      <TextInput
                        style={styles.paymentInput}
                        placeholder="0"
                        keyboardType="numeric"
                        value={versement}
                        onChangeText={(text) => {
                          setVersement(text);
                          calculerReste(totalAPayer, text);
                        }}
                      />
                    </View>
                  </View>
                  <View style={styles.paymentRow}>
                    <View style={[styles.paymentField, styles.paymentFieldFull]}>
                      <Text style={[styles.paymentLabel, styles.paymentLabelReste]}>Reste (DA)</Text>
                      <TextInput
                        style={[styles.paymentInput, styles.paymentInputReste]}
                        value={resteAPayer}
                        editable={false}
                      />
                    </View>
                  </View>
                  <Text style={styles.paymentLabel}>📝 Note / Remarque</Text>
                  <TextInput
                    style={[styles.paymentInput, styles.noteInput]}
                    placeholder="Infos complémentaires..."
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={addReservation}>
                  <Text style={styles.submitBtnText}>✅ Ajouter la réservation</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {renderProfileModal()}
        {renderNotifModal()}
        {renderDetailModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a2540',
  },
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoEmoji: {
    fontSize: 28,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  logoSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notifBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  headerStat: {
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  headerStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  todayHeader: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  todayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a2540',
    textAlign: 'center',
  },
  todayDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  boatTodaySection: {
    marginHorizontal: 15,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  boatTodayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  boatTodayRow: {
    marginBottom: 5,
  },
  boatTodaySlot: {
    padding: 10,
  },
  boatTodaySlotText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 13,
  },
  boatTodayBoats: {
    flexDirection: 'row',
  },
  boatTodayCell: {
    flex: 1,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  boatTodayBoatTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 12,
    color: '#2e7d32',
  },
  boatTodayReservation: {
    backgroundColor: '#e8f5e9',
    padding: 8,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4caf50',
  },
  boatTodayTime: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  boatTodayName: {
    fontSize: 10,
  },
  boatTodayPhone: {
    fontSize: 9,
    color: '#666',
  },
  boatTodayPayment: {
    fontSize: 9,
    color: '#444',
  },
  paymentContainer: {
    backgroundColor: '#f0f7ff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0077b6',
    marginVertical: 10,
  },
  paymentTitle: {
    fontWeight: 'bold',
    color: '#0077b6',
    fontSize: 16,
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  paymentField: {
    flex: 1,
  },
  paymentFieldFull: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#0077b6',
    marginBottom: 4,
  },
  paymentLabelReste: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  paymentInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#0077b6',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  paymentInputReste: {
    backgroundColor: '#fff3e0',
    borderColor: '#f44336',
    fontWeight: 'bold',
    color: '#c62828',
  },
  noteInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  todayTableContainer: {
    marginHorizontal: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0a2540',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 11,
    color: '#333',
  },
  cellTime: {
    width: 55,
  },
  cellClient: {
    flex: 2,
  },
  cellPhone: {
    flex: 1.5,
  },
  cellActivity: {
    width: 75,
  },
  cellPeople: {
    width: 40,
    textAlign: 'center',
  },
  cellPayment: {
    width: 70,
    alignItems: 'center',
  },
  paymentCellBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  paymentCellText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  activityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  activityBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  searchSection: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitleSmall: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  searchFilters: {
    gap: 10,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  datePickerText: {
    flex: 1,
    color: '#333',
  },
  searchInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  searchButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  searchBtn: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  clearBtn: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchStats: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a2540',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    width: '100%',
  },
  emptyStateEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    color: '#999',
    fontSize: 13,
    marginTop: 8,
  },
  reservationCard: {
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    padding: 15,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reservationIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reservationId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0077b6',
  },
  activiteBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activiteBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  reservationInfo: {
    gap: 8,
  },
  reservationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reservationValue: {
    color: '#333',
    fontSize: 14,
  },
  paymentBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  paymentBadgeSmallText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  boatFormCard: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  formHeader: {
    padding: 20,
    alignItems: 'center',
  },
  formBody: {
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0077b6',
    backgroundColor: 'white',
  },
  pickerOptionSelected: {
    backgroundColor: '#0077b6',
  },
  pickerOptionText: {
    color: '#0077b6',
    fontSize: 13,
  },
  pickerOptionTextSelected: {
    color: 'white',
  },
  submitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  submitBtnGradient: {
    padding: 15,
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateBtn: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  dateBtnText: {
    color: '#333',
  },
  adminCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  adminCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 20,
    textAlign: 'center',
  },
  adminRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  adminInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  adminBtnAdd: {
    backgroundColor: '#f97316',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  adminBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  adminBtnDelete: {
    backgroundColor: '#dc3545',
  },
  adminBtnReset: {
    backgroundColor: '#ff9800',
  },
  adminBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  slotList: {
    marginBottom: 20,
  },
  slotListTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  slotTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  slotTagDelete: {
    backgroundColor: '#f44336',
  },
  slotTagText: {
    fontSize: 12,
    color: '#0a2540',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    transform: [{ scale: 1.05 }],
  },
  navItemText: {
    fontSize: 11,
    color: '#666',
  },
  navItemTextActive: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: height * 0.85,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalBody: {
    padding: 20,
  },
  detailModal: {
    backgroundColor: 'white',
    borderRadius: 25,
    marginHorizontal: 20,
    maxHeight: height * 0.85,
    width: width - 40,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  detailBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 15,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a2540',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activityBadgeDetail: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  paymentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  paymentBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  paymentBtnNonPaye: {
    backgroundColor: '#f44336',
  },
  paymentBtnVerse: {
    backgroundColor: '#ff9800',
  },
  paymentBtnPaye: {
    backgroundColor: '#4caf50',
  },
  paymentBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 12,
    gap: 10,
    marginTop: 10,
  },
  deleteDetailBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileModal: {
    backgroundColor: 'white',
    borderRadius: 25,
    marginHorizontal: 20,
    overflow: 'hidden',
    width: width - 40,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  profileEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  profileMenu: {
    padding: 20,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 15,
  },
  profileMenuText: {
    fontSize: 16,
    color: '#333',
  },
  logoutBtn: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#dc3545',
  },
  notifModal: {
    backgroundColor: 'white',
    borderRadius: 25,
    marginHorizontal: 20,
    maxHeight: height * 0.7,
    width: width - 40,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notifTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  notifItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 15,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    fontSize: 14,
    color: '#333',
  },
  notifDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});