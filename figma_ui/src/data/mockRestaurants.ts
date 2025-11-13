import { Restaurant } from '../types';

export const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'La Bella Vita',
    cuisine: 'Italian',
    priceRange: '$$$',
    rating: 4.5,
    description: 'Authentic Italian cuisine with homemade pasta and wood-fired pizzas.',
    image: 'https://images.unsplash.com/photo-1723608334799-e6398469cb04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwcmVzdGF1cmFudCUyMGZvb2R8ZW58MXx8fHwxNzYyNzMyODM0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    location: {
      lat: 40.7589,
      lng: -73.9851,
      address: '123 Madison Ave, New York, NY'
    },
    tags: ['Romantic', 'Date Night', 'Wine Bar'],
    hours: 'Mon-Sun: 5:00 PM - 11:00 PM'
  },
  {
    id: '2',
    name: 'Sakura Sushi',
    cuisine: 'Japanese',
    priceRange: '$$',
    rating: 4.7,
    description: 'Fresh sushi and sashimi prepared by master chefs.',
    image: 'https://images.unsplash.com/photo-1629712257540-e03dfbd96b0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHN1c2hpJTIwcmVzdGF1cmFudHxlbnwxfHx8fDE3NjI3NzgyMjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    location: {
      lat: 40.7614,
      lng: -73.9776,
      address: '456 Park Ave, New York, NY'
    },
    tags: ['Sushi', 'Fresh', 'Traditional'],
    hours: 'Mon-Sat: 12:00 PM - 10:00 PM'
  },
  {
    id: '3',
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    priceRange: '$',
    rating: 4.3,
    description: 'Vibrant Mexican street food with authentic flavors.',
    image: 'https://images.unsplash.com/photo-1688845465690-e5ea24774fd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXhpY2FuJTIwdGFjb3MlMjBmb29kfGVufDF8fHx8MTc2Mjc0NTE4M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    location: {
      lat: 40.7505,
      lng: -73.9934,
      address: '789 Broadway, New York, NY'
    },
    tags: ['Casual', 'Quick Bite', 'Spicy'],
    hours: 'Mon-Sun: 11:00 AM - 11:00 PM'
  },
  {
    id: '4',
    name: 'Le Petit Bistro',
    cuisine: 'French',
    priceRange: '$$$$',
    rating: 4.8,
    description: 'Classic French bistro with seasonal ingredients and elegant ambiance.',
    image: 'https://images.unsplash.com/photo-1715249792894-43ad23412d3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVuY2glMjBiaXN0cm8lMjBmb29kfGVufDF8fHx8MTc2MjgyODc0MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    location: {
      lat: 40.7648,
      lng: -73.9808,
      address: '234 Fifth Ave, New York, NY'
    },
    tags: ['Fine Dining', 'Upscale', 'Wine Selection'],
    hours: 'Tue-Sat: 6:00 PM - 10:00 PM'
  },
  {
    id: '5',
    name: 'Noodle House',
    cuisine: 'Asian',
    priceRange: '$$',
    rating: 4.4,
    description: 'Delicious ramen and asian noodle dishes in a cozy setting.',
    image: 'https://images.unsplash.com/photo-1575295126138-a7ee2fa40739?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG5vb2RsZXMlMjByZXN0YXVyYW50fGVufDF8fHx8MTc2Mjc0NDA0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    location: {
      lat: 40.7558,
      lng: -73.9869,
      address: '567 Lexington Ave, New York, NY'
    },
    tags: ['Comfort Food', 'Ramen', 'Casual'],
    hours: 'Mon-Sun: 11:30 AM - 9:30 PM'
  },
  {
    id: '6',
    name: 'The Garden Terrace',
    cuisine: 'Mediterranean',
    priceRange: '$$$',
    rating: 4.6,
    description: 'Mediterranean flavors with a rooftop garden dining experience.',
    image: 'https://images.unsplash.com/photo-1541856644905-bd40b138cbbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwaW50ZXJpb3IlMjBkaW5pbmd8ZW58MXx8fHwxNzYyNzI2Nzg1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    location: {
      lat: 40.7580,
      lng: -73.9855,
      address: '890 Park Ave, New York, NY'
    },
    tags: ['Outdoor Seating', 'Healthy', 'Vegetarian Options'],
    hours: 'Mon-Sun: 12:00 PM - 10:00 PM'
  }
];
