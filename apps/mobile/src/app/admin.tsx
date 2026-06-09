import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HttpClient } from "@proyectointegrador/shared-infra";
import {
  fetchDepartamentos,
  fetchMunicipiosPorDepartamento,
  findOrCreateDepartamento,
  findOrCreateMunicipio,
} from "../infrastructure/ubicacionApi";
import UserDetailModal, {
  type AdminUser,
} from "../components/UserDetailModal";
import ResponseModal from "../components/ResponseModal";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

async function authHttp(): Promise<HttpClient> {
  const token = await AsyncStorage.getItem("token");
  return new HttpClient(API_URL, token ?? undefined);
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

const SECTION_ORDER = [
  "administrador",
  "centro_acopio",
  "productor",
  "trabajador_centro_acopio",
];

function groupByRole(users: AdminUser[]): { tipo: string; data: AdminUser[] }[] {
  const map = new Map<string, AdminUser[]>();
  for (const u of users) {
    const key = u.tipoUsuario;
    const list = map.get(key) ?? [];
    list.push(u);
    map.set(key, list);
  }
  return SECTION_ORDER
    .filter((t) => map.has(t))
    .map((tipo) => ({ tipo, data: map.get(tipo)! }));
}

async function resolveUbicacion(
  municipioId: number
): Promise<{ departamentoNombre: string; municipioNombre: string } | null> {
  try {
    const deptos = await fetchDepartamentos();
    const results = await Promise.all(
      deptos.map((dep) =>
        fetchMunicipiosPorDepartamento(dep.departamentoId).then((municipios) => {
          const found = municipios.find((m) => m.municipioId === municipioId);
          return found ? { departamentoNombre: dep.nombre, municipioNombre: found.nombre } : null;
        })
      )
    );
    return results.find((r) => r !== null) ?? null;
  } catch {
    return null;
  }
}

export default function Admin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const showModal = (type: "success" | "error", title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const http = await authHttp();
      const res = await http.get<{ response: AdminUser[] }>("/usuarios");
      if (res.status >= 400) throw new Error("Error al cargar usuarios");
      const list = res.data.response;
      setUsers(Array.isArray(list) ? list : []);
    } catch {
      showModal("error", "Error", "No se pudieron cargar los usuarios");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchUsers();
      setLoading(false);
    })();
  }, [fetchUsers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleSave = async (
    id: number,
    data: {
      nombres: string; apellidos: string; correo: string; telefono: string; estado: string;
      tipoDocumentoId?: number; documento?: string;
      fincaNombre?: string; direccion?: string;
      latitud?: number; longitud?: number; municipioId?: number;
      departamento?: string; municipio?: string;
      rolId?: number; centroAcopioId?: number;
    }
  ) => {
    setSaving(true);
    try {
      const http = await authHttp();
      const body: Record<string, any> = {
        email: data.correo,
        estado: data.estado,
        rolId: data.rolId ?? 0,
        centroAcopioId: data.centroAcopioId ?? null,
      };
      const hasProductor = data.tipoDocumentoId || data.documento || data.fincaNombre || data.direccion;
      if (hasProductor) {
        const fincaInicial: Record<string, any> = {
          nombre: data.fincaNombre || "",
          direccion: data.direccion || "",
        };
        if (data.latitud) fincaInicial.latitud = data.latitud;
        if (data.longitud) fincaInicial.longitud = data.longitud;
        if (data.municipio) {
          const deptoId = await findOrCreateDepartamento(data.departamento!);
          const munId = await findOrCreateMunicipio(data.municipio, deptoId);
          fincaInicial.municipioId = munId;
        } else if (data.municipioId) {
          fincaInicial.municipioId = data.municipioId;
        }
        body.productor = {
          nombre: `${data.nombres} ${data.apellidos}`.trim(),
          documento: data.documento || "",
          telefono: data.telefono,
          tipoDocumentoId: data.tipoDocumentoId ?? 0,
          fincaInicial,
        };
      }
      const res = await http.put<{ message: string; status: number }>(
        `/usuarios/${id}`,
        body
      );
      if (res.status >= 400) throw new Error(res.data.message ?? "Error al actualizar");
      showModal("success", "Éxito", res.data.message);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error: any) {
      showModal("error", "Error", error.message ?? "No se pudo actualizar el usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const http = await authHttp();
      const res = await http.delete<{ message: string; status: number }>(
        `/usuarios/${id}`
      );
      if (res.status >= 400) throw new Error(res.data.message ?? "Error al desactivar");
      showModal("success", "Éxito", res.data.message);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error: any) {
      showModal("error", "Error", error.message ?? "No se pudo desactivar el usuario");
    } finally {
      setDeletingId(null);
    }
  };

  const sections = groupByRole(users);

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require("../../../../packages/assets/images/MainBackground.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        imageStyle={{
          transform: [{ scale: 1.5 }, { translateY: 285 }],
        }}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={28} color="#222" />
        <Text style={styles.headerTitle}>Panel de Administración</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#555" />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.mainList}
          showsVerticalScrollIndicator={false}
        >
          {sections.map(({ tipo, data }) => {
            const roleColor = ROLE_COLORS[tipo] ?? "#555";
            return (
              <View key={tipo} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: roleColor }]} />
                  <Text style={styles.sectionTitle}>
                    {LABELS[tipo] ?? tipo}
                  </Text>
                  <View style={[styles.sectionCount, { backgroundColor: roleColor + "22" }]}>
                    <Text style={[styles.sectionCountText, { color: roleColor }]}>
                      {data.length}
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsRow}
                >
                  {data.map((user) => {
                    const cardColor = ROLE_COLORS[user.tipoUsuario] ?? "#555";
                    const isActive = user.estado?.toLowerCase() === "activo";
                    return (
                      <TouchableOpacity
                        key={user.usuarioId}
                        style={[styles.card, !isActive && styles.cardInactive]}
                        onPress={() => setSelectedUser(user)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.cardTop}>
                          <View style={[styles.cardRoleBadge, { backgroundColor: cardColor + "22" }]}>
                            <Text style={[styles.cardRoleText, { color: cardColor }]}>
                              {LABELS[user.tipoUsuario] ?? "--"}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.cardStatusDot,
                              { backgroundColor: isActive ? "#27ae60" : "#e74c3c" },
                            ]}
                          />
                        </View>

                        <View style={styles.cardAvatar}>
                          <Ionicons name="person-circle-outline" size={36} color={cardColor} />
                        </View>

                        <Text style={styles.cardName} numberOfLines={1}>
                          {user.email.split("@")[0]}
                        </Text>
                        <Text style={styles.cardEmail} numberOfLines={1}>
                          {user.email}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#555" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color="#555" />
                <Text style={styles.refreshText}>Actualizar</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      <UserDetailModal
        visible={selectedUser !== null}
        user={selectedUser}
        saving={saving}
        deletingId={deletingId}
        onClose={() => setSelectedUser(null)}
        onSave={handleSave}
        onDelete={handleDelete}
        fetchProfile={async (id) => {
          const http = await authHttp();
          const res = await http.get<{
            response: {
              email: string;
              password?: string;
              estado: string;
              rolId: number;
              centroAcopioId?: number;
              productor?: {
                nombre: string;
                documento: string;
                telefono: string;
                tipoDocumentoId: number;
                fincaInicial?: {
                  nombre: string;
                  direccion: string;
                  latitud: number;
                  longitud: number;
                  municipioId: number;
                };
              } | null;
            };
          }>(`/usuarios/public/${id}`);
          if (res.status >= 400 || !res.data.response) return null;
          const r = res.data.response;
          const fullName = r.productor?.nombre ?? "";
          const parts = fullName.trim().split(/\s+/);
          const nombres = parts.slice(0, -1).join(" ") || fullName;
          const apellidos = parts.length > 1 ? parts.slice(-1).join(" ") : "";
          const mid = r.productor?.fincaInicial?.municipioId;
          const ubicacion = mid ? await resolveUbicacion(mid) : null;
          return {
            email: r.email,
            estado: r.estado,
            nombres,
            apellidos,
            telefono: r.productor?.telefono ?? "",
            documento: r.productor?.documento ?? "",
            tipoDocumentoId: r.productor?.tipoDocumentoId,
            fincaNombre: r.productor?.fincaInicial?.nombre,
            direccion: r.productor?.fincaInicial?.direccion,
            latitud: r.productor?.fincaInicial?.latitud,
            longitud: r.productor?.fincaInicial?.longitud,
            municipioId: mid,
            departamentoNombre: ubicacion?.departamentoNombre,
            municipioNombre: ubicacion?.municipioNombre,
            rolId: r.rolId,
            centroAcopioId: r.centroAcopioId,
          };
        }}
      />
      <ResponseModal visible={modalVisible} type={modalType} title={modalTitle} message={modalMessage} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    padding: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 55,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  mainList: {
    padding: 16,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
  },
  sectionCount: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  cardsRow: {
    gap: 12,
    paddingRight: 16,
  },
  card: {
    width: 160,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardRoleText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardAvatar: {
    alignItems: "center",
    paddingVertical: 4,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
  },
  cardEmail: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
});
