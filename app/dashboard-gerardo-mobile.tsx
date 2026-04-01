import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  FlatList,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '../constants/Colors';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 48;

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const WEEKS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const CHART_DATA = {
  labels: WEEKS,
  datasets: [
    {
      data: [38, 42, 40, 45, 43, 20, 0],
      color: (o = 1) => `rgba(27, 58, 122, ${o})`,    // BLUE_DARK — Hialeah
      strokeWidth: 2.5,
    },
    {
      data: [32, 35, 38, 36, 40, 18, 0],
      color: (o = 1) => `rgba(107, 163, 214, ${o})`,   // BLUE_LIGHT — Kendall
      strokeWidth: 2.5,
    },
    {
      data: [28, 30, 29, 33, 31, 15, 0],
      color: (o = 1) => `rgba(39, 174, 96, ${o})`,     // GREEN — Doral
      strokeWidth: 2.5,
    },
  ],
};

const OBRAS = [
  {
    id: '1',
    name: 'Hialeah',
    lat: 25.8576,
    lng: -80.2781,
    color: Colors.BLUE_DARK,
  },
  {
    id: '2',
    name: 'Kendall',
    lat: 25.7031,
    lng: -80.3742,
    color: Colors.BLUE_LIGHT,
  },
  {
    id: '3',
    name: 'Doral',
    lat: 25.8197,
    lng: -80.3536,
    color: Colors.GREEN,
  },
];

type CrewStatus = 'active' | 'absent' | 'out_of_perimeter' | 'en_route';

const CREW: {
  id: string;
  name: string;
  initials: string;
  role: string;
  hours: number;
  status: CrewStatus;
  obra: string;
  avatarColor: string;
  lat?: number;
  lng?: number;
}[] = [
  { id: '1', name: 'Abel', initials: 'AB', role: 'Super', hours: 43, status: 'en_route', obra: 'Hialeah', avatarColor: Colors.BLUE_DARK, lat: 25.84, lng: -80.27 },
  { id: '2', name: 'Angel', initials: 'AN', role: 'Super', hours: 41, status: 'active', obra: 'Kendall', avatarColor: Colors.BLUE_DARK, lat: 25.7031, lng: -80.3742 },
  { id: '3', name: 'Carlos', initials: 'CA', role: 'Supervisor', hours: 40, status: 'active', obra: 'Hialeah', avatarColor: Colors.BLUE_LIGHT, lat: 25.8576, lng: -80.2781 },
  { id: '4', name: 'José', initials: 'JO', role: 'Supervisor', hours: 38, status: 'active', obra: 'Kendall', avatarColor: Colors.BLUE_LIGHT, lat: 25.7031, lng: -80.374 },
  { id: '5', name: 'Luis', initials: 'LU', role: 'Supervisor', hours: 39, status: 'active', obra: 'Doral', avatarColor: Colors.BLUE_LIGHT, lat: 25.8197, lng: -80.3536 },
  { id: '6', name: 'Miguel', initials: 'MI', role: 'Empleado', hours: 0, status: 'absent', obra: 'Hialeah', avatarColor: Colors.RED, lat: 25.8576, lng: -80.278 },
  { id: '7', name: 'Roberto', initials: 'RO', role: 'Empleado', hours: 36, status: 'active', obra: 'Hialeah', avatarColor: '#8E6BBD', lat: 25.858, lng: -80.279 },
  { id: '8', name: 'Felipe', initials: 'FE', role: 'Empleado', hours: 22, status: 'out_of_perimeter', obra: 'Kendall', avatarColor: Colors.AMBER, lat: 25.715, lng: -80.36 },
  { id: '9', name: 'Hugo', initials: 'HU', role: 'Empleado', hours: 34, status: 'active', obra: 'Doral', avatarColor: '#1A7A5A', lat: 25.8197, lng: -80.354 },
];

const METRICS = [
  { label: 'Empleados activos', value: '9', unit: 'de 10', accent: Colors.GREEN },
  { label: 'Horas semana', value: '294', unit: 'hrs', accent: Colors.BLUE_DARK },
  { label: 'Obras activas', value: '3', unit: 'obras', accent: Colors.BLUE_LIGHT },
  { label: 'Nómina est.', value: '$8,820', unit: 'semana', accent: Colors.AMBER },
];

const STATUS_CONFIG: Record<CrewStatus, { color: string; label: string }> = {
  active: { color: Colors.GREEN, label: 'Activo' },
  absent: { color: Colors.RED, label: 'Ausente' },
  out_of_perimeter: { color: Colors.AMBER, label: 'Fuera' },
  en_route: { color: Colors.BLUE_LIGHT, label: 'En ruta' },
};

const BOTTOM_TABS = ['Inicio', 'Obras', 'Nómina', 'Perfil'] as const;
type BottomTab = (typeof BOTTOM_TABS)[number];

// ─────────────────────────────────────────────
// Neumorfismo helpers
// ─────────────────────────────────────────────

const neuElevated = {
  backgroundColor: Colors.BG,
  shadowColor: Colors.SHADOW,
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 8,
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Header({ notifCount }: { notifCount: number }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerGreeting}>Buenos días,</Text>
        <Text style={styles.headerName}>Gerardo Diaza</Text>
        <Text style={styles.headerRole}>Propietario</Text>
      </View>
      <View style={styles.headerRight}>
        {/* Notificaciones */}
        <TouchableOpacity style={styles.notifButton} activeOpacity={0.8}>
          <Text style={styles.notifIcon}>🔔</Text>
          {notifCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{notifCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>GD</Text>
        </View>
      </View>
    </View>
  );
}

function MetricsGrid() {
  return (
    <View style={styles.metricsGrid}>
      {METRICS.map((m, i) => (
        <View key={i} style={styles.metricCard}>
          {/* Acento lateral */}
          <View style={[styles.metricAccent, { backgroundColor: m.accent }]} />
          <Text style={styles.metricValue}>{m.value}</Text>
          <Text style={styles.metricUnit}>{m.unit}</Text>
          <Text style={styles.metricLabel}>{m.label}</Text>
        </View>
      ))}
    </View>
  );
}

function TabSelector({
  active,
  onChange,
}: {
  active: number;
  onChange: (i: number) => void;
}) {
  const TABS = ['Gráfico', 'Mapa', 'Crew'];
  return (
    <View style={styles.tabSelector}>
      {TABS.map((t, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.tabItem, active === i && styles.tabItemActive]}
          onPress={() => onChange(i)}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, active === i && styles.tabLabelActive]}>
            {t}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function GraficoTab() {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: string } | null>(null);

  return (
    <View style={styles.tabContent}>
      {/* Leyenda */}
      <View style={styles.legend}>
        {['Hialeah', 'Kendall', 'Doral'].map((name, i) => (
          <View key={i} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor: i === 0
                    ? Colors.BLUE_DARK
                    : i === 1
                    ? Colors.BLUE_LIGHT
                    : Colors.GREEN,
                },
              ]}
            />
            <Text style={styles.legendLabel}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.chartWrapper}>
        <LineChart
          data={CHART_DATA}
          width={CHART_W}
          height={200}
          chartConfig={{
            backgroundColor: Colors.BG,
            backgroundGradientFrom: Colors.BG,
            backgroundGradientTo: Colors.BG,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(27, 58, 122, ${opacity})`,
            labelColor: () => Colors.BLUE_LIGHT,
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: Colors.BG,
            },
            propsForBackgroundLines: {
              stroke: Colors.SHADOW,
              strokeDasharray: '4 4',
              strokeOpacity: 0.6,
            },
          }}
          bezier
          withInnerLines
          withOuterLines={false}
          withShadow={false}
          style={styles.chart}
          onDataPointClick={({ x, y, value }) => {
            setTooltip({ x, y, value: `${value}h` });
            setTimeout(() => setTooltip(null), 2000);
          }}
        />

        {/* Tooltip oscuro */}
        {tooltip && (
          <View
            style={[
              styles.tooltip,
              { left: Math.min(tooltip.x - 20, CHART_W - 60), top: tooltip.y - 42 },
            ]}
          >
            <Text style={styles.tooltipText}>{tooltip.value}</Text>
            <View style={styles.tooltipArrow} />
          </View>
        )}
      </View>

      <Text style={styles.chartCaption}>Horas registradas por obra — semana actual</Text>
    </View>
  );
}

function MapaTab() {
  return (
    <View style={styles.tabContent}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 25.775,
          longitude: -80.330,
          latitudeDelta: 0.22,
          longitudeDelta: 0.22,
        }}
        showsUserLocation={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* Geofences circulares por obra */}
        {OBRAS.map((obra) => (
          <React.Fragment key={obra.id}>
            <Circle
              center={{ latitude: obra.lat, longitude: obra.lng }}
              radius={100}
              fillColor={`${obra.color}22`}
              strokeColor={obra.color}
              strokeWidth={2}
            />
            {/* Label de obra */}
            <Marker
              coordinate={{ latitude: obra.lat, longitude: obra.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={[styles.obraPin, { borderColor: obra.color }]}>
                <Text style={[styles.obraPinText, { color: obra.color }]}>
                  {obra.name}
                </Text>
              </View>
            </Marker>
          </React.Fragment>
        ))}

        {/* Pins de crew */}
        {CREW.filter((c) => c.lat && c.lng).map((crew) => {
          const isAbsent = crew.status === 'absent';
          const isOut = crew.status === 'out_of_perimeter';
          const isEnRoute = crew.status === 'en_route';

          return (
            <Marker
              key={crew.id}
              coordinate={{ latitude: crew.lat!, longitude: crew.lng! }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.crewPinWrapper}>
                <View
                  style={[
                    styles.crewPin,
                    {
                      backgroundColor: isAbsent
                        ? Colors.RED
                        : isOut
                        ? Colors.AMBER
                        : isEnRoute
                        ? Colors.BLUE_LIGHT
                        : crew.avatarColor,
                      borderWidth: isOut ? 2.5 : 0,
                      borderColor: isOut ? '#FFFFFF' : 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.crewPinInitials}>{crew.initials}</Text>
                </View>
                {/* Indicador especial */}
                {(isAbsent || isOut) && (
                  <View
                    style={[
                      styles.crewPinBadge,
                      { backgroundColor: isAbsent ? Colors.RED : Colors.AMBER },
                    ]}
                  >
                    <Text style={styles.crewPinBadgeText}>{isAbsent ? '×' : '!'}</Text>
                  </View>
                )}
                {isEnRoute && (
                  <View style={[styles.crewPinBadge, { backgroundColor: Colors.BLUE_LIGHT }]}>
                    <Text style={styles.crewPinBadgeText}>→</Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Leyenda del mapa */}
      <View style={styles.mapLegend}>
        {[
          { color: Colors.GREEN, label: 'Activo' },
          { color: Colors.RED, label: 'Ausente' },
          { color: Colors.AMBER, label: 'Fuera' },
          { color: Colors.BLUE_LIGHT, label: 'En ruta' },
        ].map((item, i) => (
          <View key={i} style={styles.mapLegendItem}>
            <View style={[styles.mapLegendDot, { backgroundColor: item.color }]} />
            <Text style={styles.mapLegendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CrewTab() {
  const renderItem = useCallback(
    ({ item }: { item: (typeof CREW)[number] }) => {
      const status = STATUS_CONFIG[item.status];
      return (
        <View style={styles.crewCard}>
          {/* Avatar */}
          <View style={[styles.crewAvatar, { backgroundColor: item.avatarColor }]}>
            <Text style={styles.crewAvatarText}>{item.initials}</Text>
          </View>

          {/* Info */}
          <View style={styles.crewInfo}>
            <Text style={styles.crewName}>{item.name}</Text>
            <Text style={styles.crewRole}>
              {item.role} · {item.obra}
            </Text>
          </View>

          {/* Horas */}
          <View style={styles.crewHours}>
            <Text style={styles.crewHoursValue}>{item.hours}h</Text>
            <Text style={styles.crewHoursLabel}>semana</Text>
          </View>

          {/* Status dot */}
          <View style={styles.crewStatusWrapper}>
            <View style={[styles.crewStatusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.crewStatusLabel, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      );
    },
    []
  );

  return (
    <View style={styles.tabContent}>
      <FlatList
        data={CREW}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.crewSeparator} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
}

function BottomNav({
  active,
  onChange,
}: {
  active: BottomTab;
  onChange: (t: BottomTab) => void;
}) {
  const ICONS: Record<BottomTab, string> = {
    Inicio: '⊞',
    Obras: '⬡',
    Nómina: '$',
    Perfil: '◯',
  };

  return (
    <View style={styles.bottomNav}>
      {BOTTOM_TABS.map((tab) => {
        const isActive = active === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={styles.bottomNavItem}
            onPress={() => onChange(tab)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.bottomNavIcon, isActive && styles.bottomNavIconActive]}
            >
              {ICONS[tab]}
            </Text>
            <Text
              style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}
            >
              {tab}
            </Text>
            {isActive && <View style={styles.bottomNavIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

export default function DashboardGerardoMobile() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('Inicio');
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]} // Header no sticky — scroll libre
      >
        {/* Header */}
        <Header notifCount={2} />

        {/* Métricas 2×2 */}
        <MetricsGrid />

        {/* Tabs: Gráfico / Mapa / Crew */}
        <View style={styles.tabsContainer}>
          <TabSelector active={activeTab} onChange={setActiveTab} />
          {activeTab === 0 && <GraficoTab />}
          {activeTab === 1 && <MapaTab />}
          {activeTab === 2 && <CrewTab />}
        </View>

        {/* Espacio para bottom nav */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Nav fija */}
      <BottomNav active={activeBottomTab} onChange={setActiveBottomTab} />
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 14,
    color: Colors.BLUE_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginBottom: 2,
  },
  headerName: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.3,
  },
  headerRole: {
    fontSize: 13,
    color: Colors.BLUE_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...neuElevated,
  },
  notifIcon: {
    fontSize: 20,
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.RED,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.BG,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.BLUE_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.SHADOW,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.HIGHLIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // ── Metrics Grid ──
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 28,
  },
  metricCard: {
    width: (SCREEN_W - 48 - 14) / 2,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingLeft: 20,
    overflow: 'hidden',
    position: 'relative',
    ...neuElevated,
  },
  metricAccent: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderRadius: 2,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 12,
    color: Colors.BLUE_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: 1,
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: 6,
    opacity: 0.7,
  },

  // ── Tab Selector ──
  tabsContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    ...neuElevated,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.BG,
    borderRadius: 16,
    margin: 12,
    padding: 4,
    shadowColor: Colors.SHADOW,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: Colors.BLUE_DARK,
    shadowColor: Colors.SHADOW,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.BLUE_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  tabLabelActive: {
    color: Colors.HIGHLIGHT,
    fontWeight: '600',
  },

  // ── Tab Content ──
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // ── Gráfico Tab ──
  legend: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    opacity: 0.8,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  chartCaption: {
    fontSize: 12,
    color: Colors.BLUE_LIGHT,
    textAlign: 'center',
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    opacity: 0.8,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.BLUE_DARK,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 10,
  },
  tooltipText: {
    color: Colors.HIGHLIGHT,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 5,
    backgroundColor: Colors.BLUE_DARK,
    transform: [{ scaleX: 1.4 }],
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },

  // ── Mapa Tab ──
  map: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
  },
  obraPin: {
    backgroundColor: Colors.BG,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  obraPinText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  crewPinWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  crewPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewPinInitials: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  crewPinBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  crewPinBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingVertical: 12,
    backgroundColor: Colors.BG,
    borderRadius: 12,
    shadowColor: Colors.SHADOW,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  mapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mapLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mapLegendLabel: {
    fontSize: 11,
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    opacity: 0.8,
  },

  // ── Crew Tab ──
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  crewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  crewAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  crewRole: {
    fontSize: 12,
    color: Colors.BLUE_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: 2,
  },
  crewHours: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  crewHoursValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.BLUE_DARK,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  crewHoursLabel: {
    fontSize: 10,
    color: Colors.BLUE_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  crewStatusWrapper: {
    alignItems: 'center',
    width: 44,
  },
  crewStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 3,
  },
  crewStatusLabel: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  crewSeparator: {
    height: 1,
    backgroundColor: Colors.SHADOW,
    opacity: 0.5,
  },

  // ── Bottom Nav ──
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    flexDirection: 'row',
    backgroundColor: Colors.BG,
    borderTopWidth: 1,
    borderTopColor: Colors.SHADOW,
    shadowColor: Colors.SHADOW,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 20,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
    gap: 2,
    position: 'relative',
  },
  bottomNavIcon: {
    fontSize: 20,
    color: Colors.BLUE_LIGHT,
  },
  bottomNavIconActive: {
    color: Colors.BLUE_DARK,
  },
  bottomNavLabel: {
    fontSize: 10,
    color: Colors.BLUE_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  bottomNavLabelActive: {
    color: Colors.BLUE_DARK,
    fontWeight: '600',
  },
  bottomNavIndicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.BLUE_DARK,
  },
});
