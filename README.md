# Present Sir - Attendance Tracker

**Present Sir** is a cross-platform attendance tracking application built with React Native (Expo) and Firebase. It provides distinct experiences for Students, Faculty, and Administrators to manage, record, and audit class attendance effectively.

## 🚀 Features

### 🎓 For Students
- **Dashboard**: View today's timetable, current attendance percentages, and upcoming classes.
- **Smart Attendance Marking**: Mark attendance securely using Wi-Fi BSSID verification, Geofencing, and PIN entry.
- **OD/ML Requests**: Submit On-Duty (OD) or Medical Leave (ML) requests directly to faculty.
- **Detailed History**: View subject-wise attendance history and correct past records if needed.

### 👨‍🏫 For Faculty
- **Live Radar**: Monitor real-time incoming attendance from students during an active class session.
- **Session Management**: Start and end class sessions securely with PIN overrides and dynamic verification checks.
- **Inbox**: Review and approve/reject OD and ML requests from students.
- **Manual Adjustments**: View the roster and adjust attendance manually if required.

### 🛡️ For Administrators
- **Faculty Approval**: Vet and approve pending faculty registrations.
- **Global Audit Logs**: Review attendance modifications, overrides, and correction requests.
- **Direct Editor**: Make authoritative changes to any student's attendance record with tracked audit logs.
- **Settings Management**: (Upcoming) Configure global geofence radii and college Wi-Fi BSSIDs.

## 🛠️ Tech Stack

- **Framework**: React Native & [Expo](https://expo.dev/) (Expo Router for navigation)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) & React Query
- **Backend & Database**: Firebase (Authentication & Firestore)
- **Icons**: Lucide React Native
- **Animations & UI**: React Native Reanimated & Bottom Sheet

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sanjeevraj201/Attendence-tracker---Present_Sir.git
   cd Attendence-tracker---Present_Sir
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a project on the [Firebase Console](https://console.firebase.google.com/).
   - Enable **Authentication** (Email/Password).
   - Enable **Firestore Database**.
   - Copy your Firebase config and place it in the environment file (or replace the placeholder in `lib/firebase.ts`).

4. **Start the Development Server**
   ```bash
   npm start
   ```
   - Press `a` to open in Android Emulator.
   - Press `i` to open in iOS Simulator.
   - Or scan the QR code with the Expo Go app on your physical device.

## 🔒 Security Architecture (Roadmap)
We are actively transitioning to a more secure architecture:
- **Cloud Functions**: Moving critical attendance verification (Wi-Fi, Location, PIN) from the client to Firebase Cloud Functions.
- **Custom Claims**: Role management (`STUDENT`, `FACULTY`, `ADMIN`) via Firebase Custom Auth Claims instead of local documents.
- **Strict Firestore Rules**: Implementing strict read/write boundaries ensuring students can only ever modify their own authorized subcollections.

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
