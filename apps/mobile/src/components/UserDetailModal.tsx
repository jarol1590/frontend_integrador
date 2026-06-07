import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { geocodeAddress } from "../infrastructure/geocode";
import { fetchDepartments, fetchCitiesByDepartment, type DepartmentData, type CityData } from "../infrastructure/colombiaApi";

export interface AdminUser {
  usuarioId: number;
  email: string;
  estado: string;
  fechaCreacion: string;
  centroAcopioNombre: string | null;
  rolNombre: string;
  tipoUsuario: string;
}

export interface UserProfile {
  email: string;
  estado: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  documento: string;
  tipoDocumentoId?: number;
  fincaNombre?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  municipioId?: number;
  departamentoNombre?: string;
  municipioNombre?: string;
  rolId?: number;
  centroAcopioId?: number;
}

type IdType = "CC" | "Pasaporte" | "NIT";

const ID_TYPES: IdType[] = ["CC", "Pasaporte", "NIT"];

const ID_TYPE_MAP: Record<number, IdType> = {
  1: "CC",
  3: "NIT",
  4: "Pasaporte",
};

const ID_TYPE_REVERSE: Record<string, number> = {
  CC: 1,
  NIT: 3,
  Pasaporte: 4,
};

interface UserDetailModalProps {
  visible: boolean;
  user: AdminUser | null;
  saving: boolean;
  deletingId: number | null;
  onClose: () => void;
  onSave: (id: number, data: {
    nombres: string;
    apellidos: string;
    correo: string;
    telefono: string;
    estado: string;
    tipoDocumentoId?: number;
    documento?: string;
    fincaNombre?: string;
    direccion?: string;
    latitud?: number;
    longitud?: number;
    municipioId?: number;
    departamento?: string;
    municipio?: string;
    rolId?: number;
    centroAcopioId?: number;
  }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  fetchProfile: (id: number) => Promise<UserProfile | null>;
}

const LABELS: Record<string, string> = {
  administrador: "Administrador",
  centro_acopio: "Centro de Acopio",
  productor: "Productor",
  trabajador_centro_acopio: "Trabajador",
};

const ROLE_COLORS: Record<string, string> = {
  administrador: "#8e44ad",
  centro_acopio: "#2980b9",
  productor: "#27ae60",
  trabajador_centro_acopio: "#d35400",
};

export default function UserDetailModal({
  visible,
  user,
  saving,
  deletingId,
  onClose,
  onSave,
  onDelete,
  fetchProfile,
}: UserDetailModalProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState({
    nombres: "", apellidos: "", correo: "", telefono: "", estado: "activo",
    documento: "", tipoDocumentoId: undefined as number | undefined,
    fincaNombre: "", direccion: "", latitud: "", longitud: "",
    departamento: null as string | null,
    municipio: null as string | null,
    municipioId: undefined as number | undefined,
    rolId: undefined as number | undefined,
    centroAcopioId: undefined as number | undefined,
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [dropdownIdOpen, setDropdownIdOpen] = useState(false);
  const [deptoOpen, setDeptoOpen] = useState(false);
  const [munOpen, setMunOpen] = useState(false);

  const [deptos, setDeptos] = useState<DepartmentData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [loadingDeptos, setLoadingDeptos] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const isDeleting = user ? deletingId === user.usuarioId : false;

  useEffect(() => {
    if (mode !== "edit") return;
    setLoadingDeptos(true);
    fetchDepartments()
      .then((data) => setDeptos(Array.isArray(data) ? data : []))
      .catch(() => setDeptos([]))
      .finally(() => setLoadingDeptos(false));
  }, [mode]);

  useEffect(() => {
    if (!form.departamento) { setCities([]); return; }
    const dept = deptos.find((d) => d.name === form.departamento);
    if (!dept) return;
    setLoadingCities(true);
    fetchCitiesByDepartment(dept.id)
      .then((data) => setCities(Array.isArray(data) ? data : []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [form.departamento, deptos]);

  const open = () => {
    if (!user) return;
    setForm({
      nombres: "", apellidos: "", correo: user.email, telefono: "", estado: user.estado?.toLowerCase() === "activo" ? "activo" : "inactivo",
      documento: "", tipoDocumentoId: undefined,
      fincaNombre: "", direccion: "", latitud: "", longitud: "",
      departamento: null, municipio: null, municipioId: undefined,
      rolId: undefined, centroAcopioId: undefined,
    });
    setMode("view");
  };

  const handleClose = () => {
    setMode("view");
    onClose();
  };

  const handleEdit = useCallback(async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const profile = await fetchProfile(user.usuarioId);
      if (profile) {
        setForm((f) => ({
          ...f,
          nombres: profile.nombres ?? "",
          apellidos: profile.apellidos ?? "",
          correo: profile.email,
          telefono: profile.telefono ?? "",
          estado: profile.estado?.toLowerCase() === "activo" ? "activo" : "inactivo",
          documento: profile.documento ?? "",
          tipoDocumentoId: profile.tipoDocumentoId,
          fincaNombre: profile.fincaNombre ?? "",
          direccion: profile.direccion ?? "",
          latitud: profile.latitud ? String(profile.latitud) : "",
          longitud: profile.longitud ? String(profile.longitud) : "",
          municipioId: profile.municipioId,
          departamento: profile.departamentoNombre ?? null,
          municipio: profile.municipioNombre ?? null,
          rolId: profile.rolId,
          centroAcopioId: profile.centroAcopioId,
        }));
      }
      setMode("edit");
    } catch {
      Alert.alert("Error", "No se pudo cargar la información del usuario");
    } finally {
      setLoadingProfile(false);
    }
  }, [user, fetchProfile]);

  const handleConfirmDelete = () => {
    if (!user) return;
    Alert.alert(
      "Desactivar usuario",
      `¿Estás seguro de desactivar a ${user.email}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Desactivar", style: "destructive", onPress: () => onDelete(user.usuarioId) },
      ]
    );
  };

  const handleGeocode = async () => {
    const dir = form.direccion;
    const mun = form.municipio;
    const dep = form.departamento;
    if (!dir?.trim() || !mun || !dep) {
      Alert.alert("Faltan datos", "Completa departamento, municipio y dirección primero.");
      return;
    }
    setGeocoding(true);
    try {
      const result = await geocodeAddress(dir, mun, dep);
      if (result) {
        setForm((f) => ({ ...f, latitud: String(result.lat), longitud: String(result.lng) }));
      } else {
        Alert.alert("No encontrado", "No se pudo determinar la ubicación.");
      }
    } catch {
      Alert.alert("Error", "No se pudo conectar con el servicio de mapas.");
    } finally {
      setGeocoding(false);
    }
  };

  const selectedIdType = form.tipoDocumentoId ? ID_TYPE_MAP[form.tipoDocumentoId] ?? null : null;

  if (!user) return null;

  const roleColor = ROLE_COLORS[user.tipoUsuario] ?? "#555";
  const roleLabel = LABELS[user.tipoUsuario] ?? user.rolNombre;
  const isActive = user.estado?.toLowerCase() === "activo";
  const isProductor = user.tipoUsuario === "productor";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      onShow={open}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === "view" ? "Detalles del usuario" : "Editar usuario"}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          {mode === "view" ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.badgeRow}>
                <View style={[styles.roleBadge, { backgroundColor: roleColor + "22" }]}>
                  <Text style={[styles.roleBadgeText, { color: roleColor }]}>{roleLabel}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: isActive ? "#27ae60" : "#e74c3c" }]} />
              </View>
              <DetailRow icon="mail-outline" label="Email" value={user.email} />
              <DetailRow icon="checkmark-circle-outline" label="Estado" value={isActive ? "Activo" : "Inactivo"} />
              <DetailRow icon="calendar-outline" label="Creado" value={new Date(user.fechaCreacion).toLocaleDateString("es-CO")} />
              {user.centroAcopioNombre ? <DetailRow icon="business-outline" label="Centro de acopio" value={user.centroAcopioNombre} /> : null}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.editAction} onPress={handleEdit} disabled={loadingProfile}>
                  {loadingProfile ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="create-outline" size={18} color="#fff" /><Text style={styles.editActionText}>Editar</Text></>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteAction} onPress={handleConfirmDelete} disabled={isDeleting}>
                  {isDeleting ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="trash-outline" size={18} color="#fff" /><Text style={styles.deleteActionText}>Eliminar</Text></>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : loadingProfile ? (
            <View style={styles.loadingEdit}>
              <ActivityIndicator size="large" color="#555" />
              <Text style={styles.loadingEditText}>Cargando información...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Estado</Text>
              <TouchableOpacity
                style={styles.fieldInput}
                onPress={() => {
                  const newEstado = form.estado === "activo" ? "inactivo" : "activo";
                  setForm((f) => ({ ...f, estado: newEstado }));
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.estadoIndicator, { backgroundColor: form.estado === "activo" ? "#27ae60" : "#e74c3c" }]} />
                <Text style={styles.fieldInputText}>{form.estado === "activo" ? "Activo" : "Inactivo"}</Text>
                <Ionicons name="swap-horizontal" size={18} color="#555" />
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Correo</Text>
              <TextInput style={styles.fieldInput} value={form.correo} onChangeText={(t) => setForm((f) => ({ ...f, correo: t }))} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#999" />

              {isProductor ? (
                <>
                  <Text style={styles.fieldLabel}>Nombres</Text>
                  <TextInput style={styles.fieldInput} value={form.nombres} onChangeText={(t) => setForm((f) => ({ ...f, nombres: t }))} placeholderTextColor="#999" />

                  <Text style={styles.fieldLabel}>Apellidos</Text>
                  <TextInput style={styles.fieldInput} value={form.apellidos} onChangeText={(t) => setForm((f) => ({ ...f, apellidos: t }))} placeholderTextColor="#999" />

                  <Text style={styles.fieldLabel}>Tipo de identificación</Text>
                  <TouchableOpacity style={styles.fieldInput} onPress={() => setDropdownIdOpen(!dropdownIdOpen)} activeOpacity={0.8}>
                    <Text style={[styles.fieldInputText, !selectedIdType && { color: "#999" }]}>{selectedIdType ?? "Seleccionar"}</Text>
                    <Ionicons name={dropdownIdOpen ? "chevron-up" : "chevron-down"} size={18} color="#555" />
                  </TouchableOpacity>
                  {dropdownIdOpen && (
                    <View style={styles.dropdown}>
                      {ID_TYPES.map((type) => (
                        <TouchableOpacity key={type} style={[styles.dropdownItem, selectedIdType === type && styles.dropdownItemSelected]} onPress={() => { setForm((f) => ({ ...f, tipoDocumentoId: ID_TYPE_REVERSE[type] })); setDropdownIdOpen(false); }}>
                          <Text style={[styles.dropdownText, selectedIdType === type && styles.dropdownTextSelected]}>{type === "CC" ? "Cédula de ciudadanía (CC)" : type}</Text>
                          {selectedIdType === type && <Ionicons name="checkmark" size={16} color="#555" />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text style={styles.fieldLabel}>Número de identificación</Text>
                  <TextInput style={styles.fieldInput} value={form.documento} onChangeText={(t) => setForm((f) => ({ ...f, documento: t }))} keyboardType="number-pad" placeholderTextColor="#999" />

                  <Text style={styles.fieldLabel}>Teléfono</Text>
                  <TextInput style={styles.fieldInput} value={form.telefono} onChangeText={(t) => setForm((f) => ({ ...f, telefono: t }))} keyboardType="phone-pad" placeholderTextColor="#999" />

                  <Text style={styles.fieldLabel}>Nombre de la finca</Text>
                  <TextInput style={styles.fieldInput} value={form.fincaNombre} onChangeText={(t) => setForm((f) => ({ ...f, fincaNombre: t }))} placeholderTextColor="#999" />

                  <Text style={styles.fieldLabel}>Departamento</Text>
                  <TouchableOpacity style={styles.fieldInput} onPress={() => { if (!loadingDeptos) { setDeptoOpen(!deptoOpen); setMunOpen(false); } }} activeOpacity={0.8}>
                    <Text style={[styles.fieldInputText, !form.departamento && { color: "#999" }]}>{loadingDeptos ? "Cargando..." : (form.departamento ?? "Seleccionar departamento")}</Text>
                    {loadingDeptos ? <ActivityIndicator size="small" color="#555" /> : <Ionicons name={deptoOpen ? "chevron-up" : "chevron-down"} size={18} color="#555" />}
                  </TouchableOpacity>
                  {deptoOpen && (
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {deptos.map((dep) => (
                        <TouchableOpacity key={dep.id} style={[styles.dropdownItem, form.departamento === dep.name && styles.dropdownItemSelected]}
                          onPress={() => { setForm((f) => ({ ...f, departamento: dep.name, municipio: null })); setDeptoOpen(false); }}>
                          <Text style={[styles.dropdownText, form.departamento === dep.name && styles.dropdownTextSelected]}>{dep.name}</Text>
                          {form.departamento === dep.name && <Ionicons name="checkmark" size={16} color="#555" />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  <Text style={styles.fieldLabel}>Municipio</Text>
                  <TouchableOpacity style={[styles.fieldInput, (!form.departamento || loadingCities) && { opacity: 0.5 }]}
                    onPress={() => { if (form.departamento && !loadingCities) { setMunOpen(!munOpen); setDeptoOpen(false); } }} activeOpacity={0.8}>
                    <Text style={[styles.fieldInputText, !form.municipio && { color: "#999" }]}>{loadingCities ? "Cargando..." : (form.municipio ?? "Seleccionar municipio")}</Text>
                    {loadingCities ? <ActivityIndicator size="small" color="#555" /> : <Ionicons name={munOpen ? "chevron-up" : "chevron-down"} size={18} color="#555" />}
                  </TouchableOpacity>
                  {munOpen && (
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {cities.map((city) => (
                        <TouchableOpacity key={city.id} style={[styles.dropdownItem, form.municipio === city.name && styles.dropdownItemSelected]}
                          onPress={() => { setForm((f) => ({ ...f, municipio: city.name })); setMunOpen(false); }}>
                          <Text style={[styles.dropdownText, form.municipio === city.name && styles.dropdownTextSelected]}>{city.name}</Text>
                          {form.municipio === city.name && <Ionicons name="checkmark" size={16} color="#555" />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  <Text style={styles.fieldLabel}>Dirección</Text>
                  <TextInput style={styles.fieldInput} value={form.direccion} onChangeText={(t) => setForm((f) => ({ ...f, direccion: t }))} placeholderTextColor="#999" />

                  <Pressable onPress={handleGeocode} disabled={geocoding} style={({ pressed }) => [styles.geoButton, { opacity: pressed || geocoding ? 0.7 : 1 }]}>
                    {geocoding ? <ActivityIndicator color="#333" /> : <><Ionicons name="locate-outline" size={18} color="#333" /><Text style={styles.geoButtonText}>Obtener ubicación</Text></>}
                  </Pressable>

                  {form.latitud && form.longitud ? (
                    <View style={styles.coordsContainer}>
                      <Ionicons name="checkmark-circle" size={18} color="#2ecc71" />
                      <Text style={styles.coordsText}>Lat: {Number(form.latitud).toFixed(4)}, Lng: {Number(form.longitud).toFixed(4)}</Text>
                    </View>
                  ) : null}
                </>
              ) : null}

              <View style={styles.actionRow}>
                <Pressable style={styles.cancelAction} onPress={() => setMode("view")}>
                  <Text style={styles.cancelActionText}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.confirmAction, saving && { opacity: 0.7 }]} onPress={() => onSave(user.usuarioId, {
                  nombres: form.nombres,
                  apellidos: form.apellidos,
                  correo: form.correo,
                  telefono: form.telefono,
                  estado: form.estado,
                  tipoDocumentoId: form.tipoDocumentoId,
                  documento: form.documento || undefined,
                  fincaNombre: form.fincaNombre || undefined,
                  direccion: form.direccion || undefined,
                  latitud: form.latitud ? Number(form.latitud) : undefined,
                  longitud: form.longitud ? Number(form.longitud) : undefined,
                  municipioId: form.municipioId,
                  departamento: form.departamento ?? undefined,
                  municipio: form.municipio ?? undefined,
                  rolId: form.rolId,
                  centroAcopioId: form.centroAcopioId,
                })} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmActionText}>Confirmar</Text>}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={16} color="#666" />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  content: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "85%" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", color: "#222" },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  roleBadgeText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  detailIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center", marginTop: 2 },
  detailTextWrap: { flex: 1 },
  detailLabel: { fontSize: 12, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: 15, color: "#222" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  editAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#2980b9", paddingVertical: 14, borderRadius: 14 },
  editActionText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  deleteAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#e74c3c", paddingVertical: 14, borderRadius: 14 },
  deleteActionText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 4, marginTop: 8 },
  fieldInput: { flexDirection: "row", alignItems: "center", backgroundColor: "#f0f0f0", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#222" },
  fieldInputText: { flex: 1, fontSize: 15, color: "#222" },
  dropdown: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#ddd", overflow: "hidden", marginTop: -4 },
  dropdownScroll: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#ddd", maxHeight: 160, marginTop: -4 },
  dropdownItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  dropdownItemSelected: { backgroundColor: "#f0f0f0" },
  dropdownText: { fontSize: 14, color: "#444" },
  dropdownTextSelected: { fontWeight: "bold", color: "#222" },
  cancelAction: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "#e0e0e0", alignItems: "center" },
  cancelActionText: { fontSize: 15, fontWeight: "600", color: "#555" },
  confirmAction: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "#222", alignItems: "center" },
  confirmActionText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  loadingEdit: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  loadingEditText: { fontSize: 14, color: "#666" },
  geoButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#ddd", paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  geoButtonText: { fontWeight: "bold", fontSize: 14, color: "#333" },
  coordsContainer: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 5, marginTop: 6 },
  coordsText: { fontSize: 13, color: "#555" },
  estadoIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
});
