import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  Vibration,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Roles } from '../constants/Roles';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 72;
const SECRET_TAP_COUNT = 3;
const SECRET_TAP_WINDOW_MS = 2000;

type Employee = {
  id: string;
  name: string;
  role: string;
  initials: string;
};

const SUPERS: Employee[] = [
  { id: 'b1000000-0000-0000-0000-000000000002', name: 'Abel', role: Roles.SUPER, initials: 'AB' },
  { id: 'b1000000-0000-0000-0000-000000000003', name: 'Angel', role: Roles.SUPER, initials: 'AN' },
];

const EMPLOYEES: Employee[] = [
  { id: 'b1000000-0000-0000-0000-000000000004', name: 'Carlos', role: Roles.SUPERVISOR, initials: 'CA' },
  { id: 'b1000000-0000-0000-0000-000000000005', name: 'José', role: Roles.SUPERVISOR, initials: 'JO' },
  { id: 'b1000000-0000-0000-0000-000000000006', name: 'Luis', role: Roles.SUPERVISOR, initials: 'LU' },
  { id: 'b1000000-0000-0000-0000-000000000007', name: 'Miguel', role: Roles.EMPLOYEE, initials: 'MI' },
  { id: 'b1000000-0000-0000-0000-000000000008', name: 'Roberto', role: Roles.EMPLOYEE, initials: 'RO' },
  { id: 'b1000000-0000-0000-0000-000000000009', name: 'Felipe', role: Roles.EMPLOYEE, initials: 'FE' },
  { id: 'b1000000-0000-0000-0000-000000000010', name: 'Hugo', role: Roles.EMPLOYEE, initials: 'HU' },
];

export default function LoginScreen() {
  const [secretTaps, setSecretTaps] = useState(0);
  const lastTapTime = useRef<number>(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSecretTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLast = now - lastTapTime.current;

    if (timeSinceLast > SECRET_TAP_WINDOW_MS) {
      setSecretTaps(1);
    } else {
      setSecretTaps((prev) => {
        const next = prev + 1;
        if (next >= SECRET_TAP_COUNT) {
          if (tapTimer.current) clearTimeout(tapTimer.current);
          Vibration.vibrate(50);
          loginAs({
            id: 'b1000000-0000-0000-0000-000000000001',
            name: 'Gerardo',
            role: Roles.OWNER,
            initials: 'GE',
          });
          return 0;
        }
        return next;
      });
    }

    lastTapTime.current = now;

    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setSecretTaps(0), SECRET_TAP_WINDOW_MS);
  }, []);

  const loginAs = useCallback((employee: Employee) => {
    router.replace({
      pathname: '/checkin',
      params: { employeeId: employee.id, name: employee.name, role: employee.role },
    });
  }, []);

  const handleBiometricLogin = useCallback(async (employee: Employee) => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        Alert.alert('Biométrico no disponible', 'Contacta al supervisor para acceso.', [
          { text: 'OK' },
        ]);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Confirmar identidad — ${employee.name}`,
        fallbackLabel: 'Usar PIN',
        cancelLabel: 'Cancelar',
      });

      if (result.success) {
        Vibration.vibrate(30);
        loginAs(employee);
      }
    } catch {
      Alert.alert('Error', 'No se pudo verificar identidad. Intenta de nuevo.');
    }
  }, [loginAs]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo con toque secreto */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleSecretTap}
        style={styles.logoContainer}
        accessibilityLabel="Logo Diaza Drywall"
      >
        <View style={styles.logoNeu}>
          <Text style={styles.logoText}>DD</Text>
        </View>
        <Text style={styles.brandName}>Diaza Drywall</Text>
        <Text style={styles.brandSub}>Control de Asistencia</Text>
      </TouchableOpacity>

      {/* Separador */}
      <View style={styles.separator} />

      {/* Acceso rápido Supers */}
      <Text style={styles.sectionLabel}>Acceso directo</Text>
      <View style={styles.superRow}>
        {SUPERS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.superButton}
            activeOpacity={0.8}
            onPress={() => loginAs(s)}
            accessibilityLabel={`Entrar como ${s.name}`}
          >
            <View style={styles.superAvatar}>
              <Text style={styles.superAvatarText}>{s.initials}</Text>
            </View>
            <Text style={styles.superName}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Separador */}
      <View style={styles.separator} />

      {/* Grid de empleados con biométrico */}
      <Text style={styles.sectionLabel}>Selecciona tu perfil</Text>
      <View style={styles.avatarGrid}>
        {EMPLOYEES.map((emp) => (
          <TouchableOpacity
            key={emp.id}
            style={styles.avatarItem}
            activeOpacity={0.8}
            onPress={() => handleBiometricLogin(emp)}
            accessibilityLabel={`Ingresar como ${emp.name}`}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{emp.initials}</Text>
            </View>
            <Text style={styles.avatarName}>{emp.name}</Text>
            <Text style={styles.avatarRole}>
              {emp.role === Roles.SUPERVISOR ? 'Supervisor' : 'Empleado'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.biometricHint}>Toca tu perfil — verifica con huella o Face ID</Text>
    </ScrollView>
  );
}

const neu = {
  shadowColor: Colors.SHADOW,
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 8,
};

const neuHighlight = {
  shadowColor: Colors.HIGHLIGHT,
  shadowOffset: { width: -6, height: -6 },
  shadowOpacity: 1,
  shadowRadius: 10,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
    paddingBottom: 48,
    alignItems: 'center',
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoNeu: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: Colors.BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...neu,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.5,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.BLUE_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    letterSpacing: 0.5,
  },

  // Separador
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.SHADOW,
    marginVertical: 24,
    opacity: 0.6,
  },

  // Label sección
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.BLUE_LIGHT,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Supers
  superRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  superButton: {
    flex: 1,
    height: 80,
    backgroundColor: Colors.BG,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    ...neu,
  },
  superAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.BLUE_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  superAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.HIGHLIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  superName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Avatar grid
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
    justifyContent: 'flex-start',
  },
  avatarItem: {
    alignItems: 'center',
    width: (width - 48 - 32) / 3,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Colors.BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: Colors.BLUE_LIGHT,
    ...neu,
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  avatarName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginBottom: 2,
  },
  avatarRole: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.BLUE_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Hint
  biometricHint: {
    marginTop: 24,
    fontSize: 13,
    color: Colors.BLUE_LIGHT,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    opacity: 0.8,
  },
});
