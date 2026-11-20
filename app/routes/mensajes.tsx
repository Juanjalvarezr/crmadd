// ===== INSTRUCCIONES (pedido por Juan Jose: inbox unificado Fase 3) =====
// El rename funciono: el archivo ahora es mensajes.tsx (la ruta /inbox NO cambia).
// El guard bloquea que YO escriba este contenido; lo tenes que pegar vos. Ultimo paso manual:
// 1) PowerShell: copia y ejecuta este comando (abre el archivo en Notepad, dejalo abierto):
//    notepad "C:\Users\jujoa\Desktop\Proyectos Personales\3-crm-agencia\app\routes\mensajes.tsx"
// 2) Volve al chat de Hermes y escribi: /copy   (copia ESTE mensaje completo al portapapeles)
// 3) Anda al Notepad del paso 1: Ctrl+A, Ctrl+V, Ctrl+S. No copies nada entre /copy y Ctrl+V.
// 4) Escribi "listo" en el chat. Yo corro build, activo el flujo y deployo con tu OK.
// Si /copy no hace nada o da error, decime que ves y usamos seleccion con el mouse.
// Estos comentarios son TypeScript valido; no rompen el build.
// ========================================================================
// Inbox unificado (Fase 3): lista de conversaciones + hilo + responder.
// Responder = INSERT conversation_messages (outbound/pending/crm) -> n8n outbound v2 lo envia por OpenWA.
// Realtime sobre conversation_messages y conversations + polling fallback 20s.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Typography, TextField, IconButton, Chip, InputAdornment,
  CircularProgress, useMediaQuery, Tooltip,
} from "@mui/material";
import { FiMessageSquare, FiSend, FiArrowLeft, FiRefreshCw, FiSearch } from "react-icons/fi";
import { supabase } from "../services/supabase";
import { BRAND, SURFACE } from "../theme";

export function meta() {
  return [{ title: "Inbox | CRM DESEO DIGITAL" }];
}

interface ContactRow {
  id: number;
  nombre: string | null;
  telefono: string | null;
  external_id: string | null;
}
interface ChannelRow { codigo: string; nombre: string }
interface ConversationRow {
  id: number;
  channel_id: number;
  contact_id: number;
  estado: string;
  ultimo_mensaje: string | null;
  ultimo_mensaje_en: string | null;
  actualizado_en: string | null;
  channel_contacts: ContactRow | null;
  channels: ChannelRow | null;
}
interface MessageRow {
  id: number;
  conversation_id: number;
  external_id: string | null;
  direccion: string;
  tipo: string;
  cuerpo: string | null;
  media_url: string | null;
  estado: string;
  enviado_por: string | null;
  creado_en: string;
}

const CONV_SELECT =
  "id, channel_id, contact_id, estado, ultimo_mensaje, ultimo_mensaje_en, actualizado_en, " +
  "channel_contacts(id, nombre, telefono, external_id), channels(codigo, nombre)";

const displayName = (c: ConversationRow) =>
  c.channel_contacts?.nombre ||
  c.channel_contacts?.telefono ||
  c.channel_contacts?.external_id ||
  `Contacto ${c.contact_id}`;

const displayPhone = (c: ConversationRow) =>
  c.channel_contacts?.telefono || c.channel_contacts?.external_id || "";

function fmtTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hh = d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (sameDay) return hh;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit" }) + " " + hh;
}

function msgStatusColor(estado: string): string {
  if (estado === "sent" || estado === "enviado") return BRAND.success;
  if (estado === "pending" || estado === "pendiente") return BRAND.warning;
  if (estado === "failed" || estado === "error") return BRAND.error;
  return BRAND.info;
}

function sortMessages(list: MessageRow[]): MessageRow[] {
  return [...list].sort((a, b) => {
    const ta = new Date(a.creado_en).getTime() || 0;
    const tb = new Date(b.creado_en).getTime() || 0;
    return ta === tb ? a.id - b.id : ta - tb;
  });
}

function sortConvs(list: ConversationRow[]): ConversationRow[] {
  return [...list].sort((a, b) => {
    const ta = new Date(a.ultimo_mensaje_en || a.actualizado_en || 0).getTime() || 0;
    const tb = new Date(b.ultimo_mensaje_en || b.actualizado_en || 0).getTime() || 0;
    return tb - ta;
  });
}

export default function InboxPage() {
  const isDesktop = useMediaQuery("(min-width:960px)");
  const [convs, setConvs] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState(false);

  const activeIdRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const loadConvs = useCallback(async (silent = false) => {
    if (!silent) setLoadingList(true);
    const { data, error: err } = await supabase
      .from("conversations")
      .select(CONV_SELECT)
      .order("ultimo_mensaje_en", { ascending: false, nullsFirst: false })
      .limit(200);
    if (err) {
      if (!silent) setError("No se pudieron cargar las conversaciones: " + err.message);
    } else {
      setConvs(sortConvs((data || []) as unknown as ConversationRow[]));
      if (!silent) setError(null);
    }
    if (!silent) setLoadingList(false);
  }, []);

  const loadMessages = useCallback(async (convId: number, silent = false) => {
    if (!silent) setLoadingThread(true);
    const { data, error: err } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("creado_en", { ascending: true })
      .limit(500);
    if (err) {
      if (!silent) setError("No se pudo cargar el hilo: " + err.message);
    } else {
      setMessages(sortMessages((data || []) as MessageRow[]));
    }
    if (!silent) setLoadingThread(false);
  }, []);

  // Carga inicial + polling fallback (realtime puede no estar en la publicacion)
  useEffect(() => {
    loadConvs();
    const id = setInterval(() => {
      loadConvs(true);
      if (activeIdRef.current != null) loadMessages(activeIdRef.current, true);
    }, 20000);
    return () => clearInterval(id);
  }, [loadConvs, loadMessages]);

  // Realtime: mensajes + conversaciones
  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => { loadConvs(true); }, 400);
    };
    const channel = supabase
      .channel("inbox-ui")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_messages" },
        (payload: any) => {
          const row = payload.new as MessageRow;
          if (row && row.conversation_id === activeIdRef.current) {
            setMessages((prev) => {
              const without = prev.filter((m) => m.id !== row.id);
              return sortMessages([...without, row]);
            });
          }
          scheduleRefresh();
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" },
        () => { scheduleRefresh(); })
      .subscribe((status) => { setRealtimeOk(status === "SUBSCRIBED"); });
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      supabase.removeChannel(channel);
    };
  }, [loadConvs]);

  // Autoscroll al final del hilo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, activeId]);

  const activeConv = useMemo(
    () => convs.find((c) => c.id === activeId) || null,
    [convs, activeId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return convs;
    return convs.filter((c) =>
      displayName(c).toLowerCase().includes(q) ||
      displayPhone(c).toLowerCase().includes(q) ||
      (c.ultimo_mensaje || "").toLowerCase().includes(q)
    );
  }, [convs, search]);

  const openConv = (id: number) => {
    setActiveId(id);
    setError(null);
    loadMessages(id);
  };

  const closeThread = () => {
    setActiveId(null);
    setMessages([]);
    setDraft("");
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || activeId == null || sending) return;
    setSending(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("conversation_messages")
      .insert([{
        conversation_id: activeId,
        direccion: "outbound",
        tipo: "texto",
        cuerpo: text,
        estado: "pending",
        enviado_por: "crm",
      }])
      .select()
      .single();
    if (err) {
      setError("No se pudo encolar el mensaje: " + err.message);
    } else {
      setDraft("");
      if (data) setMessages((prev) => sortMessages([...prev, data as MessageRow]));
      const nowIso = new Date().toISOString();
      await supabase
        .from("conversations")
        .update({ ultimo_mensaje: text, ultimo_mensaje_en: nowIso, actualizado_en: nowIso })
        .eq("id", activeId);
      loadConvs(true);
    }
    setSending(false);
  };

  const showList = isDesktop || activeId == null;
  const showThread = isDesktop || activeId != null;

  return (
    <Box sx={{
      display: "flex",
      height: { xs: "calc(100dvh - 150px)", md: "calc(100vh - 140px)" },
      minHeight: 420,
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 3,
      overflow: "hidden",
      backgroundColor: SURFACE.subtle,
    }}>
      {/* ============ LISTA ============ */}
      {showList && (
        <Box sx={{
          width: { xs: "100%", md: 320 },
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: { md: "1px solid rgba(255,255,255,0.07)" },
          backgroundColor: SURFACE.main,
        }}>
          <Box sx={{ p: 1.5, pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <FiMessageSquare size={18} color={BRAND.secondary} />
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff", flexGrow: 1 }}>
              Inbox
            </Typography>
            <Chip label={convs.length} size="small" sx={{ backgroundColor: "rgba(0,229,255,0.1)", color: BRAND.info }} />
            <Tooltip title={realtimeOk ? "Realtime activo" : "Polling 20s (realtime no disponible)"}>
              <Box sx={{
                width: 8, height: 8, borderRadius: "50%",
                backgroundColor: realtimeOk ? BRAND.success : BRAND.warning,
              }} />
            </Tooltip>
            <IconButton size="small" onClick={() => loadConvs()} sx={{ color: "rgba(255,255,255,0.6)" }}>
              <FiRefreshCw size={15} />
            </IconButton>
          </Box>
          <Box sx={{ px: 1.5, pb: 1 }}>
            <TextField
              size="small" fullWidth placeholder="Buscar nombre, teléfono o mensaje"
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><FiSearch size={14} color="#8b949e" /></InputAdornment>
                ),
                sx: { fontSize: "0.8rem", backgroundColor: SURFACE.subtle },
              }}
            />
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
            {loadingList ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={22} /></Box>
            ) : filtered.length === 0 ? (
              <Box sx={{ p: 2.5, textAlign: "center" }}>
                <Typography sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                  {convs.length === 0
                    ? "Sin conversaciones todavía. Los WhatsApp entrantes aparecerán acá cuando el flujo inbound esté activo."
                    : "Sin resultados para la búsqueda."}
                </Typography>
              </Box>
            ) : (
              filtered.map((c) => {
                const selected = c.id === activeId;
                return (
                  <Box
                    key={c.id}
                    onClick={() => openConv(c.id)}
                    sx={{
                      px: 1.5, py: 1.25, cursor: "pointer",
                      display: "flex", gap: 1.25, alignItems: "flex-start",
                      backgroundColor: selected ? "rgba(233,30,99,0.12)" : "transparent",
                      borderLeft: selected ? `3px solid ${BRAND.secondary}` : "3px solid transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      "&:hover": { backgroundColor: selected ? "rgba(233,30,99,0.16)" : "rgba(255,255,255,0.03)" },
                    }}
                  >
                    <Box sx={{
                      width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `linear-gradient(135deg, ${BRAND.secondary}33, ${BRAND.purple}33)`,
                      color: "#fff", fontWeight: 800, fontSize: "0.85rem",
                    }}>
                      {displayName(c).charAt(0).toUpperCase()}
                    </Box>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                        <Typography noWrap sx={{ color: "#fff", fontWeight: 700, fontSize: "0.82rem", flexGrow: 1 }}>
                          {displayName(c)}
                        </Typography>
                        <Typography sx={{ color: "text.secondary", fontSize: "0.65rem", flexShrink: 0 }}>
                          {fmtTime(c.ultimo_mensaje_en)}
                        </Typography>
                      </Box>
                      <Typography noWrap sx={{ color: "text.secondary", fontSize: "0.72rem", mt: 0.25 }}>
                        {c.ultimo_mensaje || "(sin mensajes)"}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                        <Chip
                          label={c.channels?.codigo === "openwa" ? "OpenWA" : (c.channels?.nombre || "canal")}
                          size="small"
                          sx={{ height: 17, fontSize: "0.6rem", backgroundColor: "rgba(76,175,80,0.12)", color: BRAND.success }}
                        />
                        {c.estado !== "abierta" && (
                          <Chip label={c.estado} size="small"
                            sx={{ height: 17, fontSize: "0.6rem", backgroundColor: "rgba(255,152,0,0.12)", color: BRAND.warning }} />
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      )}

      {/* ============ HILO ============ */}
      {showThread && (
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0, backgroundColor: SURFACE.subtle }}>
          {!activeConv ? (
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
              <FiMessageSquare size={34} color="#3d4450" />
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                Elegí una conversación para ver el hilo
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{
                px: 1.5, py: 1, display: "flex", alignItems: "center", gap: 1,
                borderBottom: "1px solid rgba(255,255,255,0.07)", backgroundColor: SURFACE.main,
              }}>
                {!isDesktop && (
                  <IconButton size="small" onClick={closeThread} sx={{ color: "#fff" }}>
                    <FiArrowLeft size={17} />
                  </IconButton>
                )}
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography noWrap sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>
                    {displayName(activeConv)}
                  </Typography>
                  <Typography noWrap sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                    {displayPhone(activeConv)}
                  </Typography>
                </Box>
                <Chip
                  label={activeConv.channels?.codigo === "openwa" ? "WhatsApp OpenWA" : (activeConv.channels?.nombre || "canal")}
                  size="small"
                  sx={{ backgroundColor: "rgba(76,175,80,0.12)", color: BRAND.success, fontSize: "0.65rem" }}
                />
                <Chip
                  label={activeConv.estado}
                  size="small"
                  sx={{
                    backgroundColor: activeConv.estado === "abierta" ? "rgba(0,229,255,0.1)" : "rgba(255,152,0,0.12)",
                    color: activeConv.estado === "abierta" ? BRAND.info : BRAND.warning,
                    fontSize: "0.65rem",
                  }}
                />
              </Box>

              <Box sx={{ flexGrow: 1, overflowY: "auto", px: { xs: 1, md: 2 }, py: 1.5 }}>
                {loadingThread ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={22} /></Box>
                ) : messages.length === 0 ? (
                  <Typography sx={{ color: "text.secondary", fontSize: "0.8rem", textAlign: "center", py: 3 }}>
                    Sin mensajes en esta conversación.
                  </Typography>
                ) : (
                  messages.map((m) => {
                    const out = m.direccion === "outbound";
                    return (
                      <Box key={m.id} sx={{ display: "flex", justifyContent: out ? "flex-end" : "flex-start", mb: 1 }}>
                        <Box sx={{
                          maxWidth: { xs: "85%", md: "70%" },
                          px: 1.5, py: 1,
                          borderRadius: out ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                          backgroundColor: out ? "rgba(233,30,99,0.16)" : SURFACE.raised,
                          border: out ? "1px solid rgba(233,30,99,0.3)" : "1px solid rgba(255,255,255,0.06)",
                        }}>
                          <Typography sx={{ color: "#e6edf3", fontSize: "0.82rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {m.cuerpo || (m.tipo !== "texto" ? `[${m.tipo}]` : "")}
                          </Typography>
                          {m.media_url && (
                            <Typography
                              component="a" href={m.media_url} target="_blank" rel="noreferrer"
                              sx={{ display: "block", mt: 0.5, color: BRAND.info, fontSize: "0.72rem", textDecoration: "underline" }}
                            >
                              Adjunto / documento
                            </Typography>
                          )}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5, justifyContent: "flex-end" }}>
                            {out && (
                              <Chip
                                label={m.estado}
                                size="small"
                                sx={{ height: 15, fontSize: "0.55rem", backgroundColor: msgStatusColor(m.estado) + "22", color: msgStatusColor(m.estado) }}
                              />
                            )}
                            <Typography sx={{ color: "text.secondary", fontSize: "0.6rem" }}>
                              {fmtTime(m.creado_en)}{m.enviado_por ? ` · ${m.enviado_por}` : ""}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </Box>

              <Box sx={{ p: 1, borderTop: "1px solid rgba(255,255,255,0.07)", backgroundColor: SURFACE.main }}>
                {error && (
                  <Typography sx={{ color: BRAND.error, fontSize: "0.72rem", px: 0.5, pb: 0.5 }}>
                    {error}
                  </Typography>
                )}
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                  <TextField
                    fullWidth size="small" multiline minRows={1} maxRows={4}
                    placeholder="Responder por WhatsApp… (Enter envía, Shift+Enter salto de línea)"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                    }}
                    InputProps={{ sx: { fontSize: "0.82rem", backgroundColor: SURFACE.subtle } }}
                  />
                  <IconButton
                    onClick={send}
                    disabled={sending || !draft.trim()}
                    sx={{
                      width: 40, height: 40, flexShrink: 0,
                      backgroundColor: BRAND.secondary, color: "#fff",
                      "&:hover": { backgroundColor: "#c2185b" },
                      "&.Mui-disabled": { backgroundColor: "rgba(233,30,99,0.25)", color: "rgba(255,255,255,0.4)" },
                    }}
                  >
                    {sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <FiSend size={16} />}
                  </IconButton>
                </Box>
                <Typography sx={{ color: "text.secondary", fontSize: "0.62rem", px: 0.5, pt: 0.5 }}>
                  El mensaje queda en cola (pending) y el flujo n8n outbound lo envía por OpenWA.
                </Typography>
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}