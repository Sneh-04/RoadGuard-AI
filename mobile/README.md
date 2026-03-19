# RoadGuard-AI Mobile Application

A comprehensive road hazard detection and safety mobile application built with React Native and Expo.

## 🚀 Features

### Core Functionality
- **Real-time Hazard Detection**: AI-powered detection of potholes and speed breakers
- **Interactive Maps**: Live mapping with hazard visualization and clustering
- **Sensor Fusion**: Combines accelerometer, GPS, and vision data for accurate detection
- **Offline Support**: Full functionality when network connectivity is poor
- **Push Notifications**: Real-time alerts for nearby hazards and safety reminders

### Safety Features
- **Weather Integration**: Safety assessments based on weather conditions
- **AI Chatbot**: Voice-enabled assistant for road safety guidance
- **Live Monitoring**: Real-time sensor data and hazard detection
- **Emergency Alerts**: Instant notifications for critical road hazards

### User Experience
- **Role-based Access**: Separate interfaces for regular users and administrators
- **Offline-first Design**: Seamless experience regardless of connectivity
- **Performance Optimized**: Lazy loading, caching, and memory management
- **Accessibility**: Voice commands and screen reader support

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React Native + Expo
- **Backend**: FastAPI (Python)
- **Database**: SQLite + SQLAlchemy
- **AI/ML**: TensorFlow, scikit-learn
- **Maps**: React Native Maps with clustering
- **State Management**: Zustand
- **Navigation**: React Navigation

### Project Structure
```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components (user/admin)
│   ├── services/           # API, offline, notifications
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # Navigation configuration
│   ├── theme/              # Design system
│   ├── utils/              # Utilities and helpers
│   └── config/             # Configuration files
├── __tests__/              # Unit and integration tests
└── assets/                 # Images and static assets
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Python 3.8+ (for backend)
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RoadHazardProject
   ```

2. **Install mobile dependencies**
   ```bash
   cd mobile
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../app/backend
   pip install -r ../../../requirements.txt
   ```

4. **Start the backend**
   ```bash
   cd ../app/backend
   uvicorn app.backend.api.main:app --reload --port 8000
   ```

5. **Start the mobile app**
   ```bash
   cd ../../mobile
   npx expo start
   ```

## 🧪 Testing

### Unit Tests
```bash
cd mobile
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 🚀 Deployment

### Automated Deployment
```bash
# Deploy to production
./scripts/deploy_mobile.sh production all

# Deploy Android only
./scripts/deploy_mobile.sh production android

# Deploy iOS only
./scripts/deploy_mobile.sh production ios
```

### Manual Deployment

1. **Build for Android**
   ```bash
   cd mobile
   npx expo build:android --type app-bundle
   ```

2. **Build for iOS**
   ```bash
   cd mobile
   npx expo build:ios --type archive
   ```

3. **Deploy backend**
   ```bash
   # Configure your cloud provider (AWS, GCP, etc.)
   # Update environment variables
   # Run database migrations
   ```

## 📊 Monitoring & Analytics

### Crash Reporting
- Automatic crash detection and reporting
- Error boundary components
- Crash reports stored locally and sent to analytics service

### Performance Monitoring
- Component render time tracking
- Memory usage monitoring
- Network request performance
- Lazy loading and caching metrics

### Analytics Events
- Screen views and user interactions
- Hazard detection events
- Error and crash events
- Performance metrics

## 🔒 Security

### Data Protection
- JWT authentication
- Secure API communication
- Local data encryption
- Privacy-focused data collection

### Code Security
- Input validation and sanitization
- Secure dependency management
- Regular security audits
- Code signing for releases

## 📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Hazard Endpoints
- `GET /api/hazards` - Get all hazards
- `POST /api/hazards/report` - Report new hazard
- `GET /api/hazards/history` - Get hazard history

### Prediction Endpoints
- `POST /api/predict` - Run hazard detection
- `POST /api/predict-multimodal` - Multimodal prediction

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - Get system statistics

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear Expo cache: `npx expo r -c`
   - Check Xcode/Android Studio versions

2. **Network Issues**
   - Verify backend is running on port 8000
   - Check API_BASE_URL in config
   - Test connectivity with `curl http://localhost:8000/api/health`

3. **Permission Issues**
   - Reset location permissions in device settings
   - Reinstall the app to reset all permissions

### Debug Mode
```bash
# Enable debug logging
cd mobile
EXPO_DEBUG=true npx expo start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow React Native and Expo best practices
- Write unit tests for new features
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting guide
- Review the API documentation

## 🗺️ Roadmap

### Version 2.0
- [ ] Advanced AI models for better accuracy
- [ ] Social features for hazard sharing
- [ ] Integration with traffic APIs
- [ ] Advanced analytics dashboard

### Version 1.5
- [ ] Offline map support
- [ ] Voice commands for hands-free operation
- [ ] Emergency SOS features
- [ ] Multi-language support

---

**Built with ❤️ for road safety worldwide**