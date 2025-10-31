// Favorites Service to manage favorite parking spots
export interface FavoriteSpot {
  id: string;
  location: string;
  timeSlot: string;
  price: string;
  status: 'AVAILABLE' | 'OCCUPIED';
  logo: any;
  reservationId?: number;
  displayName?: string;
  vehiclePlate?: string;
  parkingSpot?: string;
  parkingArea?: string;
  date?: string;
}

class FavoritesService {
  private favorites: FavoriteSpot[] = [];

  // Get all favorites
  getFavorites(): FavoriteSpot[] {
    return this.favorites;
  }

  // Add a new favorite
  addFavorite(spot: FavoriteSpot): void {
    // Check if already exists
    const exists = this.favorites.find(fav => fav.id === spot.id);
    if (!exists) {
      this.favorites.push(spot);
    }
  }

  // Remove a favorite
  removeFavorite(id: string): void {
    this.favorites = this.favorites.filter(fav => fav.id !== id);
  }

  // Check if a spot is favorited
  isFavorite(id: string): boolean {
    return this.favorites.some(fav => fav.id === id);
  }

  // Create favorite from reservation data
  createFavoriteFromReservation(bookingData: any): FavoriteSpot {
    const spotId = `${bookingData.parkingArea.name.replace(/\s+/g, '')}-${bookingData.parkingSlot.spotNumber}`;
    const timeSlot = new Date(bookingData.timestamps.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' - ' + new Date(bookingData.timestamps.bookingTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return {
      id: spotId,
      location: bookingData.parkingArea.name,
      timeSlot: timeSlot,
      price: '', // No price needed
      status: 'OCCUPIED',
      logo: require('../app/assets/img/fulogofinal.png'), // Default logo
      reservationId: bookingData.reservationId,
      displayName: bookingData.displayName,
      vehiclePlate: bookingData.vehicleDetails.plateNumber,
      parkingSpot: `${bookingData.parkingSlot.spotNumber} (${bookingData.parkingSlot.spotType})`,
      parkingArea: bookingData.parkingArea.name,
      date: new Date(bookingData.timestamps.bookingTime).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      })
    };
  }
}

export default new FavoritesService();
