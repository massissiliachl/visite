import React, { useState, useRef, useEffect } from 'react';
import { images } from "../../assets/images";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  FlatList,
  TextInput,
  SafeAreaView,
  Modal,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// DONNÉES AUGMENTÉES POUR BÉJAÏA
const HOTELS = [
  {
    id: '1',
    name: 'Chalet 1',
    location: 'Ferme Djerba, Béjaïa',
    rating: 4.8,
    reviews: '1,234 avis',
    price: '28000 DA',
    originalPrice: '20,000 DA',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhmZgWSgJgfCNc3UuW082ZWXrLv3q2Rfw_tg&s',
    amenities: ['Piscine', 'Wifi gratuit', 'Parking', 'Restaurant', 'Salle de sport'],
    type: 'Hôtel 4 étoiles',
    discount: '20%',
    coordinates: { lat: 36.75, lng: 5.08 },
    phone: '+213 34 12 34 56',
    email: 'contact@leshammadites.dz',
  },
  {
    id: '2',
    name: 'Chalet 2',
    location: 'Ferme Djerba, Béjaïa',
    rating: 4.9,
    reviews: '892 avis',
    price: '15,000 DA',
    originalPrice: '18,500 DA',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkSANeKGTP0EZIi0_2BtUGiof31b8Rn04xVg&s',
    amenities: ['Vue mer', 'Spa', 'Wifi gratuit', 'Restaurant gastronomique', 'Piscine à débordement'],
    type: 'Hôtel de luxe',
    discount: '19%',
    coordinates: { lat: 36.77, lng: 5.11 },
    phone: '+213 34 12 34 57',
    email: 'reservation@lacorniche.dz',
  },
  {
    id: '3',
    name: 'Chalet 3',
    location: 'Ferme Djerba, Béjaïa',
    rating: 4.7,
    reviews: '567 avis',
    price: '7,500 DA',
    originalPrice: '9,000 DA',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    amenities: ['Plage privée', 'Piscine', 'Climatisation', 'Cuisine équipée'],
    type: 'Résidence',
    discount: '17%',
    coordinates: { lat: 36.67, lng: 5.15 },
    phone: '+213 34 12 34 58',
    email: 'info@tichybeach.dz',
  },
  {
    id: '4',
    name: 'Chalet 4',
    location: 'Ferme Djerba, Béjaïa',
    rating: 4.6,
    reviews: '2,103 avis',
    price: '8,900 DA',
    originalPrice: '10,500 DA',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv6ls-yB-WQhjqvshipO-qtjt_IfMcz4B4Fg&s',
    amenities: ['Wifi', 'Restaurant', 'Business center', 'Service d\'étage'],
    type: 'Hôtel 3 étoiles',
    discount: '15%',
    coordinates: { lat: 36.73, lng: 5.07 },
    phone: '+213 34 12 34 59',
    email: 'contact@gourayahotel.dz',
  },
  
   
];

const ACTIVITIES = [
  {
    id: '1',
    name: 'Visite guidee',
    duration: '4 heures',
    price: '6000 DA',
    image: 'https://www.bejaia-guidedepoche.com/images/CouvertureLieu/145/223062-pic-des-singes-bejaia.jpg',
    rating: 4.9,
    reviews: '234 avis',
    description: 'Découvrez les singes magots dans leur habitat naturel. Guide inclus.',
    difficulty: 'Moyen',
    maxPeople: 15,
  },
  {
    id: '2',
    name: 'Sortie en Bateau',
    duration: '2h heures',
    price: '30000 DA',
    image: 'https://naviguezboat.com/wp-content/uploads/2025/05/C6R0A8093.jpg',
    rating: 4.8,
    reviews: '189 avis',
    description: 'Tour de la baie de Béjaïa avec baignade et rafraîchissements.',
    difficulty: 'Facile',
    maxPeople: 12,
  },
  {
    id: '3',
    name: 'Visite du Phare du Cap Carbon',
    duration: '2 heures',
    price: '20000 DA',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTnZXHHR3q8OIMBrpbHXNdEW7DuAV6flDEBQ&s',
    rating: 4.7,
    reviews: '456 avis',
    description: 'Vue panoramique sur la Méditerranée. Accès au musée inclus.',
    difficulty: 'Facile',
    maxPeople: 30,
  },
  {
    id: '4',
    name: 'Quad Aventure',
    duration: '45 min',
    price: '4,000 DA',
    image: 'https://www.visitbejaia.org/assets/images/i1.jpeg',
    rating: 4.9,
    reviews: '123 avis',
    description: 'Parcours tout-terrain sensations garanties. Équipement fourni.',
    difficulty: 'Difficile',
    maxPeople: 8,
  },
  {
    id: '5',
    name: 'Parapente',
    duration: '30 min',
    price: '8,000 DA',
    image: 'https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/17/04/a3/e8.jpg',
    rating: 5.0,
    reviews: '67 avis',
    description: 'Survolez la baie de Béjaïa en parapente biplace. Instructeur certifié.',
    difficulty: 'Moyen',
    maxPeople: 2,
  },
  {
    id: '6',
    name: 'Plongée Sous-Marine',
    duration: '2 heures',
    price: '4,500 DA',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    rating: 4.8,
    reviews: '98 avis',
    description: 'Découvrez les fonds marins de la Méditerranée. Équipement inclus.',
    difficulty: 'Moyen',
    maxPeople: 6,
  },
];

const RESTAURANTS = [
  {
    id: '1',
    name: 'Chez Haddad',
    cuisine: 'Couscous, Tajine, Méchoui',
    priceRange: '1,500-3,000 DA',
    rating: 4.8,
    reviews: '789 avis',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    location: 'Rue Larbi Ben M\'hidi, Béjaïa',
    hours: '11h - 23h',
    phone: '+213 34 12 34 61',
    signature: 'Couscous royal',
  },
  {
    id: '2',
    name: 'La Corniche',
    cuisine: 'Fruits de mer, Poisson',
    priceRange: '2,500-5,000 DA',
    rating: 4.7,
    reviews: '567 avis',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    location: 'Route du Cap Carbon, Béjaïa',
    hours: '12h - 23h30',
    phone: '+213 34 12 34 62',
    signature: 'Bouillabaisse',
  },
  {
    id: '3',
    name: 'Le Yachting Club',
    cuisine: 'International, Pizza, Pâtes',
    priceRange: '1,800-3,500 DA',
    rating: 4.6,
    reviews: '432 avis',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    location: 'Port de Béjaïa',
    hours: '10h - 00h',
    phone: '+213 34 12 34 63',
    signature: 'Pizza fruits de mer',
  },
  {
    id: '4',
    name: 'El Mordjane',
    cuisine: 'Cuisine kabyle traditionnelle',
    priceRange: '1,200-2,500 DA',
    rating: 4.9,
    reviews: '345 avis',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    location: 'Quartier Iheddaden, Béjaïa',
    hours: '12h - 22h',
    phone: '+213 34 12 34 64',
    signature: 'Tajine d\'agneau aux pruneaux',
  },
];

const PLACES = [
  {
    id: '1',
    name: 'Cap Carbon',
    type: 'Site naturel',
    rating: 4.9,
    reviews: '2,345 avis',
    image: 'https://images.unsplash.com/photo-1587923623987-c7e4084c7a1e?w=800',
    description: 'Phare emblématique et vue imprenable sur la baie de Béjaïa.',
    entranceFee: 'Gratuit',
    hours: '24h/24',
  },
  {
    id: '2',
    name: 'Parc National de Gouraya',
    type: 'Parc naturel',
    rating: 4.8,
    reviews: '1,876 avis',
    image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=800',
    description: 'Biodiversité unique, randonnées et points de vue exceptionnels.',
    entranceFee: '100 DA',
    hours: '8h - 18h',
  },
  {
    id: '3',
    name: 'Plage de Tichy',
    type: 'Plage',
    rating: 4.8,
    reviews: '3,456 avis',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    description: 'Sable fin et eaux cristallines. Restaurants et activités nautiques.',
    entranceFee: 'Gratuit',
    hours: '24h/24',
  },
  {
    id: '4',
    name: 'Pic des Singes',
    type: 'Montagne',
    rating: 4.7,
    reviews: '1,234 avis',
    image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=800',
    description: 'Observation des singes magots dans leur habitat naturel.',
    entranceFee: '200 DA',
    hours: '8h - 17h',
  },
  {
    id: '5',
    name: 'Vieux Port de Béjaïa',
    type: 'Port historique',
    rating: 4.6,
    reviews: '987 avis',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    description: 'Port animé avec restaurants de fruits de mer et criée.',
    entranceFee: 'Gratuit',
    hours: '24h/24',
  },
];

const TESTIMONIALS = [
  {
    id: '1',
    name: 'Sarah M.',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    rating: 5,
    comment: 'Magnifique séjour à Béjaïa ! Les paysages sont à couper le souffle. Je recommande vivement la randonnée au Pic des Singes.',
    date: 'Mars 2024',
  },
  {
    id: '2',
    name: 'Karim B.',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    rating: 5,
    comment: 'Hôtel Les Hammadites impeccable. Service parfait et vue magnifique. Béjaïa est une destination à découvrir absolument !',
    date: 'Février 2024',
  },
  {
    id: '3',
    name: 'Amel Z.',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    rating: 4,
    comment: 'Les plages de Tichy sont sublimes. Eau cristalline et sable fin. Mention spéciale pour le restaurant La Corniche.',
    date: 'Janvier 2024',
  },
];

// COMPOSANT HÔTEL CARD AMÉLIORÉ
const HotelCard = ({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.hotelCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.9}>
        <Image source={{ uri: item.image }} style={styles.hotelImage} />
        {item.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discount}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.wishlistBtn}>
          <Ionicons name="heart-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.hotelContent}>
          <View style={styles.hotelHeader}>
            <View style={styles.hotelNameContainer}>
              <Text style={styles.hotelName}>{item.name}</Text>
              <Text style={styles.hotelType}>{item.type}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
              <Text style={styles.reviewCount}>({item.reviews})</Text>
            </View>
          </View>
          <View style={styles.hotelLocation}>
            <Ionicons name="location-outline" size={12} color="#FF6B35" />
            <Text style={styles.hotelLocationText}>{item.location}</Text>
          </View>
          <View style={styles.amenitiesPreview}>
            {item.amenities.slice(0, 3).map((amenity, index) => (
              <View key={index} style={styles.amenityPreview}>
                <Text style={styles.amenityPreviewText}>{amenity}</Text>
              </View>
            ))}
          </View>
          <View style={styles.hotelFooter}>
            <View>
              <Text style={styles.originalPrice}>{item.originalPrice}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.hotelPrice}>{item.price}</Text>
                <Text style={styles.priceNight}>/nuit</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bookBtn}>
              <Text style={styles.bookBtnText}>Réserver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// COMPOSANT ACTIVITÉ CARD AMÉLIORÉ
const ActivityCard = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.activityCard} onPress={() => onPress(item)}>
      <Image source={{ uri: item.image }} style={styles.activityImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.activityGradient}
      />
      <View style={styles.activityRatingBadge}>
        <Ionicons name="star" size={10} color="#FFD700" />
        <Text style={styles.activityRatingText}>{item.rating}</Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityName}>{item.name}</Text>
        <View style={styles.activityInfo}>
          <View style={styles.activityInfoItem}>
            <Ionicons name="time-outline" size={12} color="#fff" />
            <Text style={styles.activityInfoText}>{item.duration}</Text>
          </View>
          <View style={styles.activityInfoItem}>
            <Ionicons name="people-outline" size={12} color="#fff" />
            <Text style={styles.activityInfoText}>Max {item.maxPeople}</Text>
          </View>
        </View>
        <Text style={styles.activityPrice}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );
};

// COMPOSANT TESTIMONIAL CARD
const TestimonialCard = ({ item }) => {
  return (
    <View style={styles.testimonialCard}>
      <View style={styles.testimonialHeader}>
        <Image source={{ uri: item.avatar }} style={styles.testimonialAvatar} />
        <View>
          <Text style={styles.testimonialName}>{item.name}</Text>
          <View style={styles.testimonialStars}>
            {[...Array(5)].map((_, i) => (
              <Ionicons key={i} name="star" size={12} color={i < item.rating ? '#FFD700' : '#E0E0E0'} />
            ))}
          </View>
        </View>
        <Text style={styles.testimonialDate}>{item.date}</Text>
      </View>
      <Text style={styles.testimonialComment}>"{item.comment}"</Text>
    </View>
  );
};

// MODAL DÉTAILS AMÉLIORÉ
const DetailModal = ({ visible, item, onClose, onBook }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedGuests, setSelectedGuests] = useState(1);
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!item) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Ionicons name="arrow-down" size={24} color="#1a1a2e" />
          </TouchableOpacity>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <Image source={{ uri: item.image }} style={styles.modalImage} />
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>{item.name}</Text>
              
              {item.location && (
                <View style={styles.modalLocation}>
                  <Ionicons name="location-outline" size={16} color="#FF6B35" />
                  <Text style={styles.modalLocationText}>{item.location}</Text>
                </View>
              )}
              
              <View style={styles.modalRating}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.modalRatingText}>{item.rating}</Text>
                <Text style={styles.modalReviews}>({item.reviews})</Text>
              </View>

              {/* Date et nombre de personnes pour les hôtels */}
              {(item.type?.includes('Hôtel') || item.type === 'Résidence') && (
                <View style={styles.bookingOptions}>
                  <Text style={styles.bookingSectionTitle}>🗓️ Dates et voyageurs</Text>
                  <TouchableOpacity style={styles.datePicker}>
                    <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
                    <Text style={styles.datePickerText}>Choisir les dates</Text>
                  </TouchableOpacity>
                  <View style={styles.guestSelector}>
                    <Text style={styles.guestSelectorLabel}>Voyageurs :</Text>
                    <View style={styles.guestSelectorControls}>
                      <TouchableOpacity 
                        style={styles.guestSelectorBtn}
                        onPress={() => setSelectedGuests(Math.max(1, selectedGuests - 1))}>
                        <Ionicons name="remove" size={20} color="#FF6B35" />
                      </TouchableOpacity>
                      <Text style={styles.guestSelectorValue}>{selectedGuests}</Text>
                      <TouchableOpacity 
                        style={styles.guestSelectorBtn}
                        onPress={() => setSelectedGuests(Math.min(10, selectedGuests + 1))}>
                        <Ionicons name="add" size={20} color="#FF6B35" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {item.description && (
                <>
                  <Text style={styles.modalSectionTitle}>📝 Description</Text>
                  <Text style={styles.modalDescription}>{item.description}</Text>
                </>
              )}

              {item.amenities && (
                <>
                  <Text style={styles.modalSectionTitle}>✨ Équipements</Text>
                  <View style={styles.amenitiesList}>
                    {item.amenities.map((amenity, index) => (
                      <View key={index} style={styles.amenityItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.amenityText}>{amenity}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {item.duration && (
                <>
                  <Text style={styles.modalSectionTitle}>⏰ Durée</Text>
                  <Text style={styles.modalDescription}>{item.duration}</Text>
                </>
              )}

              {item.difficulty && (
                <>
                  <Text style={styles.modalSectionTitle}>🎯 Niveau</Text>
                  <View style={[styles.difficultyBadge, 
                    item.difficulty === 'Facile' && styles.difficultyEasy,
                    item.difficulty === 'Moyen' && styles.difficultyMedium,
                    item.difficulty === 'Difficile' && styles.difficultyHard
                  ]}>
                    <Text style={styles.difficultyText}>{item.difficulty}</Text>
                  </View>
                </>
              )}

              {item.hours && (
                <>
                  <Text style={styles.modalSectionTitle}>🕐 Horaires</Text>
                  <Text style={styles.modalDescription}>{item.hours}</Text>
                </>
              )}

              {item.phone && (
                <>
                  <Text style={styles.modalSectionTitle}>📞 Contact</Text>
                  <TouchableOpacity style={styles.contactItem}>
                    <Ionicons name="call-outline" size={18} color="#FF6B35" />
                    <Text style={styles.contactText}>{item.phone}</Text>
                  </TouchableOpacity>
                  {item.email && (
                    <TouchableOpacity style={styles.contactItem}>
                      <Ionicons name="mail-outline" size={18} color="#FF6B35" />
                      <Text style={styles.contactText}>{item.email}</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              <View style={styles.priceSummary}>
                <Text style={styles.priceSummaryLabel}>Prix total</Text>
                <Text style={styles.priceSummaryValue}>{item.price}</Text>
              </View>

              <TouchableOpacity style={styles.modalBookBtn} onPress={onBook}>
                <LinearGradient colors={['#FF6B35', '#E91E63']} style={styles.modalBookGradient}>
                  <Text style={styles.modalBookText}>Réserver maintenant</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ÉCRAN PRINCIPAL AMÉLIORÉ
export default function BejaiaBookingScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('hotels');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 150],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [100, 70],
    extrapolate: 'clamp',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openDetail = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleBook = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Réservation',
      'Voulez-vous confirmer cette réservation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              '✓ Réservation confirmée !',
              'Vous recevrez un email de confirmation dans les prochaines minutes.',
              [{ text: 'OK', onPress: () => setModalVisible(false) }]
            );
          }
        },
      ]
    );
  };

  const filterContent = () => {
    // Filtrage basé sur la recherche
    const filterBySearch = (items) => {
      if (!searchText) return items;
      return items.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(searchText.toLowerCase()))
      );
    };

    switch (selectedTab) {
      case 'hotels':
        return filterBySearch(HOTELS);
      case 'activities':
        return filterBySearch(ACTIVITIES);
      case 'restaurants':
        return filterBySearch(RESTAURANTS);
      case 'places':
        return filterBySearch(PLACES);
      default:
        return [];
    }
  };

  const renderContent = () => {
    const filteredData = filterContent();

    if (filteredData.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={60} color="#ccc" />
          <Text style={styles.emptyStateTitle}>Aucun résultat</Text>
          <Text style={styles.emptyStateText}>Aucun résultat trouvé pour "{searchText}"</Text>
        </View>
      );
    }

    switch (selectedTab) {
      case 'hotels':
        return (
          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>🏨 Hébergements à Béjaïa</Text>
                <Text style={styles.sectionSubtitle}>{filteredData.length} hébergements disponibles</Text>
              </View>
              <TouchableOpacity style={styles.sortBtn}>
                <Ionicons name="funnel-outline" size={18} color="#FF6B35" />
                <Text style={styles.sortBtnText}>Filtrer</Text>
              </TouchableOpacity>
            </View>
            {filteredData.map((item) => (
              <HotelCard key={item.id} item={item} onPress={openDetail} />
            ))}
          </View>
        );
      case 'activities':
        return (
          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>🎯 Activités</Text>
                <Text style={styles.sectionSubtitle}>{filteredData.length} activités disponibles</Text>
              </View>
              <TouchableOpacity style={styles.sortBtn}>
                <Ionicons name="funnel-outline" size={18} color="#FF6B35" />
                <Text style={styles.sortBtnText}>Filtrer</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredData}
              renderItem={({ item }) => <ActivityCard item={item} onPress={openDetail} />}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.activitiesGrid}
              scrollEnabled={false}
            />
          </View>
        );
      case 'restaurants':
        return (
          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>🍽 Restaurants</Text>
                <Text style={styles.sectionSubtitle}>{filteredData.length} restaurants à découvrir</Text>
              </View>
              <TouchableOpacity style={styles.sortBtn}>
                <Ionicons name="funnel-outline" size={18} color="#FF6B35" />
                <Text style={styles.sortBtnText}>Filtrer</Text>
              </TouchableOpacity>
            </View>
            {filteredData.map((item) => (
              <TouchableOpacity key={item.id} style={styles.restaurantCard} onPress={() => openDetail(item)}>
                <Image source={{ uri: item.image }} style={styles.restaurantCardImage} />
                <View style={styles.restaurantCardContent}>
                  <Text style={styles.restaurantCardName}>{item.name}</Text>
                  <Text style={styles.restaurantCardCuisine}>{item.cuisine}</Text>
                  <View style={styles.restaurantCardFooter}>
                    <View style={styles.restaurantCardRating}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text style={styles.restaurantCardRatingText}>{item.rating}</Text>
                      <Text style={styles.reviewCountSmall}>({item.reviews})</Text>
                    </View>
                    <Text style={styles.restaurantCardPrice}>{item.priceRange}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.restaurantCardArrow} />
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'places':
        return (
          <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>📍 Lieux à visiter</Text>
                <Text style={styles.sectionSubtitle}>{filteredData.length} sites incontournables</Text>
              </View>
              <TouchableOpacity style={styles.sortBtn}>
                <Ionicons name="map-outline" size={18} color="#FF6B35" />
                <Text style={styles.sortBtnText}>Carte</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredData}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.placeCard} onPress={() => openDetail(item)}>
                  <Image source={{ uri: item.image }} style={styles.placeImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.placeGradient}
                  />
                  <View style={styles.placeContent}>
                    <Text style={styles.placeName}>{item.name}</Text>
                    <Text style={styles.placeType}>{item.type}</Text>
                    <View style={styles.placeFooter}>
                      <View style={styles.placeRating}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.placeRatingText}>{item.rating}</Text>
                      </View>
                      <Text style={styles.placeFee}>{item.entranceFee}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.placesList}
              scrollEnabled={false}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header Fixe Animé */}
      <Animated.View style={[styles.fixedHeader, { opacity: headerOpacity, height: headerHeight }]}>
        <View style={styles.fixedHeaderContent}>
          <View>
            <Text style={styles.fixedHeaderGreeting}>Bonjour👋</Text>
            <Text style={styles.fixedHeaderTitle}>Où voulez-vous aller ?</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={22} color="#1a1a2e" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileBtn}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/9131/9131478.png' }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5WbXBs5PN4-mk7IaBTQnOISb_0pCl7XqxKw&s' }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Découvrez Béjaïa</Text>
            <Text style={styles.heroSubtitle}>La perle de la Kabylie</Text>
            <View style={styles.heroBadges}>
              <View style={styles.heroBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
                <Text style={styles.heroBadgeText}>Sécurisé</Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="chatbubbles" size={14} color="#fff" />
                <Text style={styles.heroBadgeText}>Support 24/7</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un hôtel, restaurant ou activité..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText !== '' && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
            <Ionicons name="options-outline" size={22} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>112</Text>
            <Text style={styles.statLabel}>Hôtels</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>Activités</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>68</Text>
            <Text style={styles.statLabel}>Restaurants</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Note moyenne</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'hotels' && styles.activeTab]} 
            onPress={() => { setSelectedTab('hotels'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Ionicons name="bed-outline" size={20} color={selectedTab === 'hotels' ? '#FF6B35' : '#666'} />
            <Text style={[styles.tabText, selectedTab === 'hotels' && styles.activeTabText]}>Hôtels</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'activities' && styles.activeTab]} 
            onPress={() => { setSelectedTab('activities'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Ionicons name="compass-outline" size={20} color={selectedTab === 'activities' ? '#FF6B35' : '#666'} />
            <Text style={[styles.tabText, selectedTab === 'activities' && styles.activeTabText]}>Activités</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'restaurants' && styles.activeTab]} 
            onPress={() => { setSelectedTab('restaurants'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Ionicons name="restaurant-outline" size={20} color={selectedTab === 'restaurants' ? '#FF6B35' : '#666'} />
            <Text style={[styles.tabText, selectedTab === 'restaurants' && styles.activeTabText]}>Restaurants</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'places' && styles.activeTab]} 
            onPress={() => { setSelectedTab('places'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Ionicons name="map-outline" size={20} color={selectedTab === 'places' ? '#FF6B35' : '#666'} />
            <Text style={[styles.tabText, selectedTab === 'places' && styles.activeTabText]}>Lieux</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Content */}
        {renderContent()}

        {/* Témoignages */}
        <View style={styles.testimonialsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Ce que disent nos voyageurs</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllLink}>Voir tout →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={TESTIMONIALS}
            renderItem={({ item }) => <TestimonialCard item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.testimonialsList}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Visit Béjaïa - Tous droits réservés</Text>
          <Text style={styles.footerSubtext}>Réservez votre séjour à Béjaïa</Text>
          <View style={styles.footerSocial}>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-facebook" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-instagram" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-whatsapp" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <DetailModal
        visible={modalVisible}
        item={selectedItem}
        onClose={() => {
          setModalVisible(false);
          setSelectedItem(null);
        }}
        onBook={handleBook}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 12,
    paddingHorizontal: 20,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fixedHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fixedHeaderGreeting: {
    fontSize: 13,
    color: '#666',
  },
  fixedHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroSection: {
    height: height * 0.4,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    position: 'absolute',
    bottom: 30,
    left: 25,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 11,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -25,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a2e',
  },
  filterBtn: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#FFF5F0',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  contentSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sortBtnText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 15,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  hotelCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  hotelImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#E91E63',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotelContent: {
    padding: 15,
  },
  hotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelNameContainer: {
    flex: 1,
  },
  hotelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  hotelType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  reviewCount: {
    fontSize: 10,
    color: '#999',
  },
  hotelLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  hotelLocationText: {
    fontSize: 12,
    color: '#666',
  },
  amenitiesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  amenityPreview: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  amenityPreviewText: {
    fontSize: 10,
    color: '#666',
  },
  hotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hotelPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  priceNight: {
    fontSize: 11,
    color: '#666',
  },
  bookBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activitiesGrid: {
    justifyContent: 'space-between',
    gap: 15,
  },
  activityCard: {
    width: (width - 55) / 2,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
  },
  activityImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  activityGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  activityRatingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityRatingText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activityContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  activityName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  activityInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  activityInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityInfoText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  activityPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  restaurantCardImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  restaurantCardContent: {
    flex: 1,
    padding: 12,
  },
  restaurantCardName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  restaurantCardCuisine: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  restaurantCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restaurantCardRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  reviewCountSmall: {
    fontSize: 10,
    color: '#999',
  },
  restaurantCardPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  restaurantCardArrow: {
    marginRight: 15,
  },
  placeCard: {
    width: width * 0.7,
    height: 220,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  placeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
  },
  placeContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  placeType: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  placeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeRatingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  placeFee: {
    color: '#FFD700',
    fontSize: 11,
  },
  placesList: {
    paddingRight: 10,
  },
  testimonialsSection: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  testimonialsList: {
    paddingRight: 10,
  },
  testimonialCard: {
    width: width * 0.8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  testimonialName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  testimonialStars: {
    flexDirection: 'row',
    marginTop: 2,
  },
  testimonialDate: {
    fontSize: 10,
    color: '#999',
    marginLeft: 'auto',
  },
  testimonialComment: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  seeAllLink: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
  footerSubtext: {
    color: '#FF6B35',
    fontSize: 11,
    marginTop: 5,
  },
  footerSocial: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 15,
  },
  socialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: height * 0.9,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 15,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  modalLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  modalLocationText: {
    fontSize: 14,
    color: '#666',
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 15,
  },
  modalRatingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  modalReviews: {
    fontSize: 13,
    color: '#666',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginTop: 15,
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  amenityText: {
    fontSize: 13,
    color: '#1a1a2e',
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  difficultyEasy: {
    backgroundColor: '#4CAF5020',
  },
  difficultyMedium: {
    backgroundColor: '#FF980020',
  },
  difficultyHard: {
    backgroundColor: '#E91E6320',
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#1a1a2e',
  },
  bookingOptions: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
  },
  bookingSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  datePickerText: {
    fontSize: 14,
    color: '#666',
  },
  guestSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guestSelectorLabel: {
    fontSize: 14,
    color: '#1a1a2e',
  },
  guestSelectorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  guestSelectorBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestSelectorValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  priceSummaryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  priceSummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  modalBookBtn: {
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  modalBookGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalBookText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});