# 📖 Quran Premium (آيات)

[![Expo](https://img.shields.io/badge/Expo-4630EB?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Une application Coranique premium et riche en fonctionnalités, construite avec React Native et Expo. Conçue avec un accent particulier sur l'esthétique, la facilité d'utilisation et une expérience de lecture spirituelle.

![Aperçu de l'application](https://via.placeholder.com/800x400.png?text=Quran+Premium+Aperçu)

## ✨ Fonctionnalités

- **📜 Expérience de lecture spirituelle :** Thème inspiré du parchemin pour réduire la fatigue oculaire et offrir un ressenti classique.
- **🕋 Boussole Qibla Avancée :** Boussole animée fluide avec guides d'étalonnage et direction précise.
- **📅 Suivi de Khatma :** Plans de lecture personnalisés (7, 15, 30 jours) avec suivi de progression.
- **☀️ Rappels d'Adhkar :** Souvenirs du matin et du soir avec notifications professionnelles.
- **🎧 Lecture Audio :** Écoutez vos récitateurs préférés avec une logique de détection hors ligne.
- **🔍 Recherche Intelligente :** Trouvez rapidement n'importe quelle Sourate ou Ayah en arabe ou en français/anglais.
- **🌙 Thèmes Dynamiques :** Basculez entre le mode Parchemin Premium (Clair) et Émeraude Profond (Sombre).
- **📲 Mises à jour Over-The-Air (OTA) :** Recevez instantanément les dernières fonctionnalités et correctifs sans avoir à télécharger de nouveaux APK.

## 🛠️ Stack Technique

- **Framework :** React Native / Expo
- **Langage :** TypeScript
- **Style :** Flexbox / Moteur de thèmes dynamiques
- **Icônes :** Lucide React Native
- **Stockage :** Expo SQLite / AsyncStorage
- **Notifications :** Expo Notifications
- **Déploiement :** EAS (Expo Application Services)

## 🚀 Mise en route

### Prérequis

- Node.js (v18+)
- Application Expo Go sur votre appareil physique

### Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/mouad-kawmi/quran-app.git
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Démarrer le serveur de développement :
   ```bash
   npx expo start
   ```

## 📦 Déploiement et Mises à jour

Cette application utilise **EAS Update** pour des déploiements fluides.

- **Pour publier une nouvelle mise à jour :**
  ```bash
  eas update --branch production --message "Décrivez vos changements"
  ```

---
Développé avec ❤️ pour la Ummah.
