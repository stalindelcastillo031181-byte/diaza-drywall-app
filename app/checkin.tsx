import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Vibration,
  Animated,
} from 'react-native';
import * as Location from 'expo-location';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../constants/Colors';

type CheckinState = 'idle' | 'loading' | 'success' | 'error' | 'out_of_range';
type AttendanceType = 'checkin' | 'checkout';

const BUTTON_SIZE = 170;
const GEOFENCE_RADIUS_M = 100;

// Distancia entre dos coordenadas en metros (Haversine)
function getDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Placeholder coordenadas de obras (en producción: vienen de Supabase)
const OBRA_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  'a1000000-0000-0000-0000-000000000001': { lat: 25.8576, lng: -80.2781, name: 'Hialeah Commercial Center' },
  'a1000000-0000-0000-0000-000000000002': { lat: 25.7031, lng: -80.3742, name: 'Kendall Residential' },
  'a1000000-0000-0000-0000-000000000003': { lat: 25.8197, lng: -80.3536, name: 'Doral Office Park' },
};

export default function CheckinScreen() {
  const params = useLocalSearchParams<{
    employeeId: string;
    name: string;
    role: string;
    obraId?: string;
  }>();

  const [state, setState] = useState<CheckinState>('idle');
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('checkin');
  const [lastRecord, setLastRecord] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulso suave en estado idle
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    if (state === 'idle') {
      pulse.start();
    } else {
      pulse.stop();
      pulseAnim.setValue(1);
    }
    return () => pulse.stop();
  }, [state, pulseAnim]);

  const handleCheckin = useCallback(async () => {
    setState('loading');

    try {
      // 1. Solicitar permisos GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tu ubicación para registrar la asistencia.',
          [{ text: 'OK', onPress: () => setState('idle') }]
        );
        return;
      }

      // 2. Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // 3. Verificar geofencing si hay obra asignada
      const obraId = params.obraId;
      if (obraId && OBRA_COORDS[obraId]) {
        const obra = OBRA_COORDS[obraId];
        const dist = getDistanceMeters(latitude, longitude, obra.lat, obra.lng);
        setDistance(Math.round(dist));

        if (dist > GEOFENCE_RADIUS_M) {
          setState('out_of_range');
          Vibration.vibrate([0, 100, 50, 100]);
          return;
        }
      }

      // 4. Registrar en Supabase (placeholder — integrar con lib/supabase.ts)
      // const { error } = await supabase.from('attendance').insert({ ... })

      // 5. Éxito
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-US', { hour: '2-digit', minute: '2-digit' });
      setLastRecord(timeStr);

      Vibration.vibrate(50);
      setState('success');

      // Alternar check-in / check-out
      setAttendanceType((prev) => (prev === 'checkin' ? 'checkout' : 'checkin'));

      // Volver a idle después de 2.5s
      setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  }, [params.obraId]);

  const buttonColor = () => {
    if (state === 'success') return Colors.GREEN;
    if (state === 'error' || state === 'out_of_range') return Colors.RED;
    return attendanceType === 'checkin' ? Colors.GREEN : Colors.RED;
  };

  const buttonLabel = () => {
    if (state === 'loading') return '';
    if (state === 'success') return attendanceType === 'checkout' ? 'Entrada\nRegistrada' : 'Salida\nRegistrada';
    if (state === 'error') return 'Error';
    if (state === 'out_of_range') return 'Fuera de\nRango';
    return attendanceType === 'checkin' ? 'Entrada' : 'Salida';
  };

  const statusMessage = () => {
    if (state === 'out_of_range' && distance !== null) {
      return `Estás a ${distance}m de la obra. Máximo permitido: ${GEOFENCE_RADIUS_M}m.`;
    }
    if (state === 'success' && lastRecord) {
      return `Registrado a las ${lastRecord}`;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Volver"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.employeeName}>{params.name}</Text>
          <Text style={styles.employeeRole}>
            {params.role === 'owner'
              ? 'Owner'
              : params.role === 'super'
              ? 'Super'
              : params.role === 'supervisor'
              ? 'Supervisor'
              : 'Empleado'}
          </Text>
        </View>
      </View>

      {/* Contenido central */}
      <View style={styles.centerContent}>
        <Text style={styles.actionLabel}>
          {attendanceType === 'checkin' ? 'Registrar Entrada' : 'Registrar Salida'}
        </Text>

        {/* Botón circular principal */}
        <Animated.View style={{ transform: [{ scale: state === 'idle' ? pulseAnim : 1 }] }}>
          <TouchableOpacity
            style={[styles.checkinButton, { backgroundColor: buttonColor() }]}
            activeOpacity={0.85}
            onPress={handleCheckin}
            disabled={state === 'loading' || state === 'success'}
            accessibilityLabel={`Botón ${attendanceType === 'checkin' ? 'entrada' : 'salida'}`}
          >
            <View style={[styles.checkinButtonInner, { borderColor: `${buttonColor()}88` }]}>
              {state === 'loading' ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <Text style={styles.checkinLabel}>{buttonLabel()}</Text>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Mensaje de estado */}
        {statusMessage() && (
          <View style={styles.statusCard}>
            <Text style={[
              styles.statusText,
              state === 'out_of_range' && { color: Colors.RED },
              state === 'success' && { color: Colors.GREEN },
            ]}>
              {statusMessage()}
            </Text>
          </View>
        )}

        <Text style={styles.hint}>
          {state === 'idle'
            ? 'El GPS se activa solo al presionar'
            : state === 'loading'
            ? 'Obteniendo ubicación...'
            : ''}
        </Text>
      </View>

      {/* Footer — última actividad */}
      {lastRecord && (
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Último registro</Text>
          <Text style={styles.footerTime}>{lastRecord}</Text>
        </View>
      )}
    </View>
  );
}

const neu = {
  shadowColor: Colors.SHADOW,
  shadowOffset: { width: 8, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 14,
  elevation: 10,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    ...neu,
  },
  backIcon: {
    fontSize: 28,
    color: Colors.BLUE_DARK,
    fontWeight: '300',
    marginTop: -2,
  },
  headerInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  employeeRole: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.BLUE_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: 2,
  },

  // Centro
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  actionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    letterSpacing: 0.3,
  },

  // Botón circular
  checkinButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.SHADOW,
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  checkinButtonInner: {
    width: BUTTON_SIZE - 20,
    height: BUTTON_SIZE - 20,
    borderRadius: (BUTTON_SIZE - 20) / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    lineHeight: 28,
  },

  // Status
  statusCard: {
    backgroundColor: Colors.BG,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    maxWidth: 280,
    ...neu,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    lineHeight: 22,
  },
  hint: {
    fontSize: 13,
    color: Colors.BLUE_LIGHT,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    opacity: 0.8,
  },

  // Footer
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.SHADOW,
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.BLUE_LIGHT,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginBottom: 4,
  },
  footerTime: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
});
