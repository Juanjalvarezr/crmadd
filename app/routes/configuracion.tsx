import { globalSnack } from "../components/GlobalSnackbar";
import { useState, useEffect, useRef } from "react";
import Grid from "@mui/material/Grid";
import { 
  Box, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, Alert, CircularProgress, Card, CardContent,
  Divider, Chip, List, ListItem, ListItemText,
  ListItemIcon, ListItemSecondaryAction, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { 
  FiSettings, FiRefreshCw, FiUser, FiGlobe,
  FiShield, FiDatabase, FiDownload, FiUpload, FiX,
  FiTrash2, FiCheck, FiAlertCircle, FiZap,
  FiPackage, FiPlus, FiList, FiEdit
} from "react-icons/fi";
import { configuracionService, reglasAIService, conocimientoService, promptsAIService, supabase, testConnection, plantillasDocumentosService } from "../services/supabase";
import { BRAND } from "../theme";
import { EmpresaTab } from "../components/EmpresaTab";
import { ConfigTabPreferencias } from "../components/config/ConfigTabPreferencias";
import { ConfigTabSeguridad } from "../components/config/ConfigTabSeguridad";
import { ConfigTabPlantillas } from "../components/config/ConfigTabPlantillas";
import { ConfigTabSop } from "../components/config/ConfigTabSop";
import { ConfigTabCampos } from "../components/config/ConfigTabCampos";
import { ConfigTabBackup } from "../components/config/ConfigTabBackup";
import { ConfigTabDatos } from "../components/config/ConfigTabDatos";
import { CerebroAITab } from "../components/CerebroAITab";

// Tipos para configuración
interface EmpresaConfig {
  nombre: string;
  logo: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  pais: string;
  website: string;
  descripcion: string;
  googleBusinessLink?: string;
}

interface PreferenciasConfig {
  tema: "light" | "dark" | "auto";
  idioma: "es" | "en";
  zonaHoraria: string;
  formatoFecha: string;
  formatoMoneda: string;
  notificacionesEmail: boolean;
  notificacionesPush: boolean;
  notificacionesInApp: boolean;
}
// La interfaz SeguridadConfig no se utiliza directamente en el servicio, por lo que no necesita ser exportada.
interface SeguridadConfig {
  cambiarPassword: boolean;
  passwordActual: string;
  passwordNuevo: string;
  passwordConfirmar: string;
  autenticacion2FA: boolean;
  sesionesActivas: number;
}

export function meta() {
  return [
    { title: "Configuración | CRM DESEO DIGITAL" },
    { name: "description", content: "Configuración del sistema y preferencias" },
  ];
}

export default function Configuracion() {
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("empresa"); // Mantener activeTab local
  // Cargar datos reales al montar
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [empresa, reglas, conocimientoData] = await Promise.all([
          configuracionService.getEmpresa(),
          reglasAIService.getAll(),
          conocimientoService.getAll(),
        ]);
        if (!mounted) return;
        if (empresa) {
          setEmpresaConfig({
            nombre: empresa.nombre || "",
            logo: empresa.logo || "",
            telefono: empresa.telefono || "",
            email: empresa.email || "",
            direccion: empresa.direccion || "",
            ciudad: empresa.ciudad || "",
            pais: empresa.pais || "",
            website: empresa.website || "",
            descripcion: empresa.descripcion || "",
            googleBusinessLink: empresa.google_business_link || "",
          });
        }
        setReglasAI(reglas || []);
        setConocimiento(conocimientoData || []);
      } catch (err: any) {
        globalSnack.show(err?.message || "Error al cargar configuración", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);
  
    
  // Punto 2 y Testigo de Conexión
  const [dbStatus, setDbStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [promptsAI, setPromptsAI] = useState<any[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<any | null>(null);
  const [openPromptModal, setOpenPromptModal] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Estados de configuración
  const [empresaConfig, setEmpresaConfig] = useState<EmpresaConfig>({
    nombre: "DESEO DIGITAL",
    logo: "",
    telefono: "320 369 8476",
    email: "contacto@deseodigital.com",
    direccion: "Calle Principal #123-45",
    ciudad: "Bogotá",
    pais: "Colombia",
    website: "https://deseodigital.com",
    descripcion: "Agencia especializada en Marketing Digital y SEO",
    googleBusinessLink: "https://www.google.com/search?q=agencia+deseo+digtla&sca_esv=c907fd948afe34b7&sxsrf=ANbL-n7cL2DEiPeksYuHS9mv8VEBk6tqFQ%3A1779076838624&source=hp&ei=5o4Kaoa2I5eRwbkPz7zp6Ac&iflsig=AFdpzrgAAAAAagqc9gRFJ1Wm10g_KB0ws15vKww0gviP&ved=0ahUKEwiGwffX-cGUAxWXSDABHU9eGn0Q4dUDCCM&uact=5&oq=agencia+deseo+digtla&gs_lp=Egdnd3Mtd2l6IhRhZ2VuY2lhIGRlc2VvIGRpZ3RsYTIFECEYoAFI5hRQAFjGE3AAeACQAQCYAacBoAGgFqoBBDAuMjC4AQPIAQD4AQGYAhSgArwXwgIKECMYgAQYigUYJ8ICBBAjGCfCAggQABiABBixA8ICBRAAGIAEwgIOEC4YgAQYsQMYxwEY0QPCAggQLhiABBixA8ICCxAAGIAEGLEDGMkDwgILEC4YgAQYxwEYrwHCAhQQLhiABBiKBRixAxiDARjHARjRA8ICCBAAGIAEGJIDwgILEAAYgAQYigUYkgPCAgsQLhivARjHARiABMICDRAuGIAEGMcBGNEDGArCAgcQABiABBgKwgIPEAAYgAQYChgLGLEDGMkDwgIJEAAYgAQYChgLwgIPEC4YChgLGK8BGMcBGIAEwgIMEAAYgAQYChgLGJIDwgIPEC4YgAQYChgLGMcBGNEDwgIGEAAYFhgewgICECbCAggQABiABBiiBMICBRAAGO8FwgIHECEYChigAZgDAJIHBDAuMjCgB6evAbIHBDAuMjC4B7wXwgcIMC41LjEzLjLIB2KACAE&sclient=gws-wiz#lrd=0x8e3e2fb9f791918f:0xb9c06b7463ea4cfd,3,,,,"
  });

  // Estado para Reglas de AI
  const [reglasAI, setReglasAI] = useState<any[]>([]);
  const [nuevaRegla, setNuevaRegla] = useState({ categoria: "estrategia", instruccion: "" });

  // Estado para Conocimiento
  const [conocimiento, setConocimiento] = useState<any[]>([]);
  const [nuevoConocimiento, setNuevoConocimiento] = useState({ titulo: "", contenido: "", categoria: "operaciones" });
  const [openConocimientoModal, setOpenConocimientoModal] = useState(false);

  // Estado Manual SOP
  const [sops, setSops] = useState<any[]>([]);
  const [nuevoSop, setNuevoSop] = useState({ titulo: "", descripcion: "", categoria: "operaciones" });

  // Estados para Campos y Estados personalizados
  const [catalogos, setCatalogos] = useState<any>({
  estadosCliente: ["Activo", "Inactivo", "Prospecto", "Lead Frío"],
  etapasVenta: ["Primer Contacto", "Propuesta Enviada", "Negociación", "Cierre"],
  prioridadesTarea: ["Alta", "Media", "Baja"]
});

  const [nuevoItem, setNuevoItem] = useState({ tipo: "estadosCliente", valor: "" });

  const handleSaveCatalogos = async (newCatalogos: typeof catalogos) => {
    setCatalogos(newCatalogos);
    try {
      await configuracionService.upsertCatalogos({ id: "catalogos", data: newCatalogos });
      globalSnack.show("Campos y Estados actualizados", "success");
    } catch (err: any) {
      globalSnack.show(err.message || "Error guardando catálogos", "error");
    }
  };

  const handleAddItem = () => {
    if (!nuevoItem.valor.trim()) return;
    const tipo = nuevoItem.tipo as keyof typeof catalogos;
    if (catalogos[tipo].includes(nuevoItem.valor.trim())) {
      globalSnack.show("Este valor ya existe", "warning");
      return;
    }
    const updated = {
      ...catalogos,
      [tipo]: [...catalogos[tipo], nuevoItem.valor.trim()]
    };
    handleSaveCatalogos(updated);
    setNuevoItem({ ...nuevoItem, valor: "" });
  };

  const handleDeleteItem = (tipo: keyof typeof catalogos, item: string) => {
    const updated = {
      ...catalogos,
      [tipo]: catalogos[tipo].filter((x: string) => x !== item)
    };
    handleSaveCatalogos(updated);
  };

  // Estado Plantillas de Documentos
  const [plantillasDocs, setPlantillasDocs] = useState<any[]>([]);
  const [docTemplateForm, setDocTemplateForm] = useState({ tipo: "cotizacion", nombre: "", contenido: "", iva_porcentaje: 19, color_primario: "#1976d2", color_secundario: "#e91e63", logo_url: "", activo: true as boolean | undefined });
  const [editingDocTemplateId, setEditingDocTemplateId] = useState<number | null>(null);
  const [openDocTemplateModal, setOpenDocTemplateModal] = useState(false);

  const handleSaveDocTemplate = async () => {
    if (!docTemplateForm.nombre.trim() || !docTemplateForm.contenido.trim()) { globalSnack.show("Nombre y contenido obligatorios", "warning"); return; }
    try {
      const saved = await plantillasDocumentosService.upsert(docTemplateForm as any);
      if (editingDocTemplateId) setPlantillasDocs(plantillasDocs.map((x: any) => x.id === saved.id ? saved : x)); else setPlantillasDocs([...plantillasDocs, saved]);
      setOpenDocTemplateModal(false); globalSnack.show("Plantilla guardada", "success");
    } catch (err: any) { globalSnack.show(err.message || "Error guardando plantilla", "error"); }
  };

  useEffect(() => {
    const loadTemplates = async () => {
      try { const data = await plantillasDocumentosService.getAll(); setPlantillasDocs(data || []); } catch {}
    };
    loadTemplates();
  }, []);

  // Cargar datos reales
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await configuracionService.getEmpresa();
        if (data) setEmpresaConfig(data);
      } catch (err: any) {
              }
    };
    const loadReglas = async () => {
      const data = await reglasAIService.getAll();
      setReglasAI(data);
    };
    const loadConocimiento = async () => {
      const data = await conocimientoService.getAll();
      setConocimiento(data);
    };
    const loadPrompts = async () => {
      const data = await promptsAIService.getAll();
      setPromptsAI(data);
    };
    const checkDB = async () => {
      const status = await testConnection();
      setDbStatus(status);
    };
    loadConfig();
    loadReglas();
    loadConocimiento();
    loadPrompts();
    checkDB();
  }, []);

  const refreshConocimiento = async () => {
    const data = await conocimientoService.getAll();
    setConocimiento(data);
  };

  const [preferenciasConfig, setPreferenciasConfig] = useState<PreferenciasConfig>({
    tema: "light",
    idioma: "es",
    zonaHoraria: "America/Bogota",
    formatoFecha: "dd/MM/yyyy",
    formatoMoneda: "COP",
    notificacionesEmail: true,
    notificacionesPush: true,
    notificacionesInApp: true
  });

  const [seguridadConfig, setSeguridadConfig] = useState<SeguridadConfig>({
    cambiarPassword: false,
    passwordActual: "",
    passwordNuevo: "",
    passwordConfirmar: "",
    autenticacion2FA: false,
    sesionesActivas: 3
  });

  // Estados para modales
  const [openBackupDialog, setOpenBackupDialog] = useState(false);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);

  // Funciones de manejo
  const handleSaveEmpresa = async () => {
    setLoading(true);
    try {
      await configuracionService.updateEmpresa(empresaConfig);

      globalSnack.show("Configuración de empresa guardada correctamente", "success");
    } catch (err: any) {
      globalSnack.show("Error al guardar configuración: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 2MB para no sobrecargar la DB)
      if (file.size > 2 * 1024 * 1024) {
        globalSnack.show("La imagen es demasiado grande. El límite es de 2MB.", "warning");
        return;
      }

      setLoading(true);
      try {
        const publicUrl = await configuracionService.uploadLogo(file);
        setEmpresaConfig(prev => ({ ...prev, logo: publicUrl }));
        globalSnack.show("Logo subido correctamente", "success");
      } catch (err: any) {
        globalSnack.show("Error al subir: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    }
  };


  const handleCambioPassword = async () => {
    if (seguridadConfig.passwordNuevo !== seguridadConfig.passwordConfirmar) {
      globalSnack.show("Las contraseñas no coinciden", "error");
      return;
    }

    if (seguridadConfig.passwordNuevo.length < 8) {
      globalSnack.show("La contraseña debe tener al menos 8 caracteres", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: seguridadConfig.passwordNuevo });
      if (error) throw error;

      globalSnack.show("Contraseña actualizada correctamente", "success");
      
      // Limpiar formulario
      setSeguridadConfig({
        ...seguridadConfig,
        cambiarPassword: false,
        passwordActual: "",
        passwordNuevo: "",
        passwordConfirmar: ""
      });
    } catch (err: any) {
      globalSnack.show("Error al actualizar contraseña: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      // Simulación de backup
      const backupData = {
        empresa: empresaConfig,
        preferencias: preferenciasConfig,
        fecha: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      globalSnack.show("Backup descargado correctamente", "success");
    } catch (err: any) {
      globalSnack.show("Error al crear backup: " + err.message, "error");
    } finally {
      setLoading(false);
      setOpenBackupDialog(false);
    }
  };

  const handleRestore = async (file: File) => {
    setLoading(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Restaurar configuración
      if (backupData.empresa) {
        setEmpresaConfig(backupData.empresa);
      }
      if (backupData.preferencias) {
        setPreferenciasConfig(backupData.preferencias);
      }

      globalSnack.show("Configuración restaurada correctamente", "success");
    } catch (err: any) {
      globalSnack.show("Error al restaurar backup: " + err.message, "error");
    } finally {
      setLoading(false);
      setOpenRestoreDialog(false);
    }
  };

  // Datos de ejemplo para el equipo
  const listadoEquipo = [
    {
      nombre: "Jessica López",
      email: "jessica.lopez@deseodigital.com",
      rol: "Creativo",
      especialidad: "Edición de Reels y Diseño Gráfico",
      estado: "Activo" as const,
    },
    {
      nombre: "Carlos Ruiz",
      email: "carlos.ruiz@deseodigital.com",
      rol: "Técnico",
      especialidad: "SEO Técnico y Desarrollo Web",
      estado: "Activo" as const,
    }
  ];

  const handleSeedRealData = async () => {
    setLoading(true);
    try {
      // 1. Limpiar datos viejos de simulación/prueba de forma segura
      await supabase.from('oportunidades').delete().neq('id', 0);
      await supabase.from('proyectos').delete().neq('id', 'placeholder');
      await supabase.from('tareas').delete().neq('id', 0);
      await supabase.from('equipo').delete().neq('id', 0); // Limpiar equipo
      await supabase.from('clientes').delete().neq('id', 0);

      // 2. Definir las 9 empresas reales con sus representantes y especificaciones para el ESQUEMA COMPLETO
      const listadoClientesCompleto = [
        {
          empresa: "Ecopark Mundo de Colores",
          nombre: "Diana Gómez",
          email: "contacto@ecoparkcolores.com",
          telefono: "312 456 7890",
          nicho: "Eco-turismo y Recreación Infantil",
          origen: "Referido",
          estado: "Activo" as const,
          ultima_interaccion: new Date().toISOString()
        },
        {
          empresa: "Tiendas Hogar City",
          nombre: "Carlos Alberto Torres",
          email: "ventas@hogarcity.com",
          telefono: "315 789 1234",
          nicho: "Muebles y Decoración del Hogar",
          origen: "Ads",
          estado: "Activo" as const,
          ultima_interaccion: new Date().toISOString()
        },
        {
          empresa: "Agencia Deseo Digital",
          nombre: "Juan José Álvarez",
          email: "juanjose@deseodigital.com",
          telefono: "320 369 8476",
          nicho: "Marketing de Afiliación e Identidad",
          origen: "Directo",
          estado: "Activo" as const,
          ultima_interaccion: new Date().toISOString()
        },
        {
          empresa: "Rx Imado",
          nombre: "Dr. Roberto Imado",
          email: "info@rximado.com",
          telefono: "310 987 6543",
          nicho: "Diagnóstico Médico por Imágenes",
          origen: "Instagram",
          estado: "Inactivo" as const,
          ultima_interaccion: new Date().toISOString()
        },
        {
          empresa: "Vitalvan Integral",
          nombre: "Dra. Vanessa Valencia",
          email: "administrativo@vitalvan.com",
          telefono: "318 654 3210",
          nicho: "Salud, Ambulancias y Cuidado Médico Domiciliario",
          origen: "n8n",
          estado: "Inactivo" as const,
          ultima_interaccion: new Date().toISOString()
        },
        {
          empresa: "Autolujos",
          nombre: "Santiago Restrepo",
          email: "gerencia@autolujos.com",
          telefono: "322 111 2222",
          nicho: "Lujos, Accesorios y Detailing Automotriz",
          origen: "Ads",
          estado: "Inactivo" as const,
          ultima_interaccion: new Date().toISOString()
        },
        {
          empresa: "Grupo Iuris",
          nombre: "Dr. Andrés Jaramillo",
          email: "contacto@iurisgrupo.com",
          telefono: "300 444 5555",
          nicho: "Firma de Abogados y Asesoría Legal",
          origen: "Referido",
          estado: "Inactivo" as const,
          ultima_interaccion: new Date().toISOString()
        },
        {
          empresa: "Cafeteria y Restaurante Gaturros",
          nombre: "Mateo Giraldo",
          email: "gaturroscafe@outlook.com",
          telefono: "316 222 3333",
          nicho: "Gastronomía y Experiencia de Café de Especialidad",
          origen: "Instagram",
          estado: "Inactivo" as const,
          ultima_interaccion: new Date().toISOString()
        },
        {
          empresa: "Fabrica Mepalex",
          nombre: "Alejandro Palacios",
          email: "compras@mepalex.com",
          telefono: "317 444 8888",
          nicho: "Carpintería Metálica y Mobiliario Industrial",
          origen: "Directo",
          estado: "Inactivo" as const,
          ultima_interaccion: new Date().toISOString()
        }
      ];

      let clientesInsertados: any[] = [];
      let esModoCompatibilidad = false;

      // Intentar insertar con todas las columnas
      const { data: dataFull, error: errCliFull } = await supabase
        .from('clientes')
        .insert(listadoClientesCompleto)
        .select();

      if (errCliFull) {
                esModoCompatibilidad = true;

        // Limpiar para asegurar transacción limpia
        await supabase.from('clientes').delete().neq('id', 0);

        // Seeder en Modo Compatibilidad (Nombre combinando representante y empresa, solo campos base que existen físicamente)
        const listadoClientesCompat = [
          { nombre: "Diana Gómez - Ecopark Mundo de Colores", email: "contacto@ecoparkcolores.com", telefono: "312 456 7890", estado: "Activo" as const, ultima_interaccion: new Date().toISOString() },
          { nombre: "Carlos Alberto Torres - Tiendas Hogar City", email: "ventas@hogarcity.com", telefono: "315 789 1234", estado: "Activo" as const, ultima_interaccion: new Date().toISOString() },
          { nombre: "Juan José Álvarez - Agencia Deseo Digital", email: "juanjose@deseodigital.com", telefono: "320 369 8476", estado: "Activo" as const, ultima_interaccion: new Date().toISOString() },
          { nombre: "Dr. Roberto Imado - Rx Imado", email: "info@rximado.com", telefono: "310 987 6543", estado: "Inactivo" as const, ultima_interaccion: new Date().toISOString() },
          { nombre: "Dra. Vanessa Valencia - Vitalvan Integral", email: "administrativo@vitalvan.com", telefono: "318 654 3210", estado: "Inactivo" as const, ultima_interaccion: new Date().toISOString() },
          { nombre: "Santiago Restrepo - Autolujos", email: "gerencia@autolujos.com", telefono: "322 111 2222", estado: "Inactivo" as const, ultima_interaccion: new Date().toISOString() },
          { nombre: "Dr. Andrés Jaramillo - Grupo Iuris", email: "contacto@iurisgrupo.com", telefono: "300 444 5555", estado: "Inactivo" as const, ultima_interaccion: new Date().toISOString() },
          { nombre: "Mateo Giraldo - Cafeteria y Restaurante Gaturros", email: "gaturroscafe@outlook.com", telefono: "316 222 3333", estado: "Inactivo" as const, ultima_interaccion: new Date().toISOString() },
          { nombre: "Alejandro Palacios - Fabrica Mepalex", email: "compras@mepalex.com", telefono: "317 444 8888", estado: "Inactivo" as const, ultima_interaccion: new Date().toISOString() }
        ];

        const { data: dataComp, error: errCliComp } = await supabase
          .from('clientes')
          .insert(listadoClientesCompat)
          .select();

        if (errCliComp) throw errCliComp;
        clientesInsertados = dataComp || [];
      } else {
        clientesInsertados = dataFull || [];
      }

      if (!clientesInsertados || clientesInsertados.length === 0) {
        throw new Error("No se pudieron insertar los clientes.");
      }

      // Insertar equipo
      const { error: errEquipo } = await supabase
        .from('equipo')
        .insert(listadoEquipo);
      if (errEquipo) {
              }

      // 4. Crear las oportunidades de venta y proyectos vinculados correspondientes
      const oportunidadesAInsertar: any[] = [];
      const proyectosAInsertar: any[] = [];
      const tareasAInsertar: any[] = [];

      clientesInsertados.forEach((cli: any) => {
        const esEcopark = cli.nombre.includes("Ecopark");
        const esHogarCity = cli.nombre.includes("Hogar City");
        const esDeseoDigital = cli.nombre.includes("Agencia Deseo Digital") || cli.nombre.includes("Deseo Digital");
        const esRxImado = cli.nombre.includes("Rx Imado");
        const esVitalvan = cli.nombre.includes("Vitalvan");
        const esAutolujos = cli.nombre.includes("Autolujos");
        const esIuris = cli.nombre.includes("Grupo Iuris") || cli.nombre.includes("Iuris");
        const esGaturros = cli.nombre.includes("Gaturros");
        const esMepalex = cli.nombre.includes("Mepalex");

        const nombreEmpresa = esEcopark ? "Ecopark Mundo de Colores" :
                              esHogarCity ? "Tiendas Hogar City" :
                              esDeseoDigital ? "Agencia Deseo Digital" :
                              esRxImado ? "Rx Imado" :
                              esVitalvan ? "Vitalvan Integral" :
                              esAutolujos ? "Autolujos" :
                              esIuris ? "Grupo Iuris" :
                              esGaturros ? "Cafeteria y Restaurante Gaturros" :
                              "Fabrica Mepalex";

        if (esEcopark) {
          oportunidadesAInsertar.push({
            nombre: "Campaña de Lanzamiento & Web Ecopark",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            valor: 2000000,
            fecha_cierre_esperada: new Date(Date.now() + 15*24*60*60*1000).toISOString().split('T')[0],
            etapa: "Cierre",
            probabilidad: 100,
            estado: "Cerrada"
          });
          proyectosAInsertar.push({
            id: 'ecopark-' + Math.random().toString(36).substr(2, 5),
            nombre: "Diseño Web & SEO Ecopark",
            descripcion: "Desarrollo de sitio web interactivo y optimización de SEO local para reservas.",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            servicios: ["Diseño Web", "SEO"],
            estado: "operacion",
            prioridad: "Alta",
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_fin: new Date(Date.now() + 45*24*60*60*1000).toISOString().split('T')[0],
            progreso: 65,
            presupuesto: 2000000,
            costo_actual: 400000,
            monto_pagado: 1000000,
            estado_pago: "parcial",
            fase_administrativa: "operacion",
            onboarding_checklist: {
              accesos_hosting: true,
              logo_alta_resolucion: true,
              paleta_colores: true,
              briefing_completo: true
            },
            plan_contenido: {
              stories: ["Lanzamiento de nuevas atracciones", "Día familiar en Ecopark"],
              reels: ["Un recorrido de ensueño", "Cómo reservar en 1 minuto"],
              post: ["Bienvenido al mundo de colores", "Visítanos este fin de semana"]
            },
            tareas: [],
            recursos: []
          });
        } 
        else if (esHogarCity) {
          oportunidadesAInsertar.push({
            nombre: "Estrategia SEO Global Hogar City",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            valor: 2000000,
            fecha_cierre_esperada: new Date(Date.now() + 10*24*60*60*1000).toISOString().split('T')[0],
            etapa: "Cierre",
            probabilidad: 100,
            estado: "Cerrada"
          });
          proyectosAInsertar.push({
            id: 'hogarcity-' + Math.random().toString(36).substr(2, 5),
            nombre: "SEO & Tráfico Hogar City",
            descripcion: "Optimización técnica y SEO de contenidos para aumentar el posicionamiento B2C.",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            servicios: ["SEO"],
            estado: "operacion",
            prioridad: "Media",
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_fin: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
            progreso: 40,
            presupuesto: 2000000,
            costo_actual: 200000,
            monto_pagado: 1000000,
            estado_pago: "parcial",
            fase_administrativa: "operacion",
            onboarding_checklist: {
              google_analytics: true,
              google_search_console: true,
              accesos_web: true
            },
            plan_contenido: {},
            tareas: [],
            recursos: []
          });
        }
        else if (esDeseoDigital) {
          oportunidadesAInsertar.push({
            nombre: "Setup de CRM & Asistente IA Deseo Digital",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            valor: 2000000,
            fecha_cierre_esperada: new Date().toISOString().split('T')[0],
            etapa: "Cierre",
            probabilidad: 100,
            estado: "Cerrada"
          });
          proyectosAInsertar.push({
            id: 'deseodigital-' + Math.random().toString(36).substr(2, 5),
            nombre: "CRM Interno & AI",
            descripcion: "Desarrollo y afinamiento del CRM inteligente con asistente integrado de Gemini.",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            servicios: ["Diseño Web"],
            estado: "operacion",
            prioridad: "Alta",
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_fin: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            progreso: 90,
            presupuesto: 2000000,
            costo_actual: 0,
            monto_pagado: 2000000,
            estado_pago: "pagado",
            fase_administrativa: "operacion",
            onboarding_checklist: {
              keys_env: true,
              base_datos: true,
              servidor_dev: true
            },
            plan_contenido: {},
            tareas: [],
            recursos: []
          });
        }
        else if (esRxImado) {
          oportunidadesAInsertar.push({
            nombre: "Sitio Corporativo Premium Rx Imado",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            valor: 4500000,
            fecha_cierre_esperada: new Date(Date.now() + 25*24*60*60*1000).toISOString().split('T')[0],
            etapa: "Propuesta",
            probabilidad: 60,
            estado: "Abierta"
          });
        }
        else if (esVitalvan) {
          oportunidadesAInsertar.push({
            nombre: "Campaña Captación de Tráfico Vitalvan",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            valor: 3200000,
            fecha_cierre_esperada: new Date(Date.now() + 40*24*60*60*1000).toISOString().split('T')[0],
            etapa: "Prospección",
            probabilidad: 30,
            estado: "Abierta"
          });
        }
        else if (esAutolujos) {
          oportunidadesAInsertar.push({
            nombre: "Estrategia Reels Virales Autolujos",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            valor: 1800000,
            fecha_cierre_esperada: new Date(Date.now() + 8*24*60*60*1000).toISOString().split('T')[0],
            etapa: "Negociación",
            probabilidad: 80,
            estado: "Abierta"
          });
        }
        else if (esIuris) {
          oportunidadesAInsertar.push({
            nombre: "Estrategia Marca Profesional Abogados Iuris",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            valor: 5000000,
            fecha_cierre_esperada: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            etapa: "Propuesta",
            probabilidad: 50,
            estado: "Abierta"
          });
        }
        else if (esGaturros) {
          oportunidadesAInsertar.push({
            nombre: "Estrategia Geomarketing Local Gaturros Café",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            valor: 1500000,
            fecha_cierre_esperada: new Date(Date.now() + 20*24*60*60*1000).toISOString().split('T')[0],
            etapa: "Prospección",
            probabilidad: 40,
            estado: "Abierta"
          });
        }
        else if (esMepalex) {
          oportunidadesAInsertar.push({
            nombre: "Plataforma de Catálogo Industrial Mepalex",
            cliente_id: cli.id,
            cliente_nombre: nombreEmpresa,
            valor: 6000000,
            fecha_cierre_esperada: new Date(Date.now() + 12*24*60*60*1000).toISOString().split('T')[0],
            etapa: "Negociación",
            probabilidad: 75,
            estado: "Abierta"
          });
        }
      });

      // 5. Insertar oportunidades, proyectos y tareas en Supabase
      if (oportunidadesAInsertar.length > 0) {
        const { data: opsInsertadas, error: errOp } = await supabase
          .from('oportunidades')
          .insert(oportunidadesAInsertar)
          .select();
        
        if (errOp) throw errOp;

        if (opsInsertadas && opsInsertadas.length > 0) {
          opsInsertadas.forEach((op: any) => {
            if (op.etapa === "Cierre") {
              tareasAInsertar.push({
                titulo: `Entregar Avance de Proyecto - ${op.cliente_nombre}`,
                descripcion: "Coordinar reunión con el cliente para validar la primera entrega de copy y diseño.",
                fecha: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0],
                prioridad: "Alta",
                estado: "Pendiente",
                cliente_id: op.cliente_id,
                oportunidad_id: op.id
              });
            } else {
              tareasAInsertar.push({
                titulo: `Seguimiento de Propuesta - ${op.cliente_nombre}`,
                descripcion: "Llamar al representante legal para validar dudas sobre la propuesta técnica.",
                fecha: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0],
                prioridad: "Media",
                estado: "Pendiente",
                cliente_id: op.cliente_id,
                oportunidad_id: op.id
              });
            }
          });
        }
      }

      if (proyectosAInsertar.length > 0) {
        const { error: errProy } = await supabase
          .from('proyectos')
          .insert(proyectosAInsertar);
        
        if (errProy) throw errProy;
      }

      if (tareasAInsertar.length > 0) {
        const { error: errTar } = await supabase
          .from('tareas')
          .insert(tareasAInsertar);
        
        if (errTar) throw errTar;
      }

      // Guardamos la configuración en LocalStorage para adaptar la UI
      if (esModoCompatibilidad) {
        if (typeof window !== "undefined") localStorage.setItem("crm_compat_mode", "true");
        globalSnack.show("⚠️ Datos cargados en Modo Compatibilidad (Base de datos simplificada detectada)", "warning");
      } else {
        if (typeof window !== "undefined") localStorage.setItem("crm_compat_mode", "false");
        globalSnack.show("¡Datos reales inicializados con éxito con todas las 9 empresas reales!", "success");
      }

      // Eliminar el Snackbar local

      setTimeout(() => {
        if (typeof window !== "undefined") window.location.reload();
      }, 2500);

    } catch (err: any) {
      globalSnack.show("Error al inicializar datos reales: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRegla = async () => {
    if (!nuevaRegla.instruccion.trim()) return;
    const guardada = await reglasAIService.create(nuevaRegla);
    setReglasAI([guardada, ...reglasAI]);
    setNuevaRegla({ ...nuevaRegla, instruccion: "" });
  };

  const handleDeleteRegla = async (id: number) => {
    await reglasAIService.delete(id);
    setReglasAI(reglasAI.filter(r => r.id !== id));
  };
  // Eliminar el Snackbar local
  const handleUpdatePrompt = async () => {
    if (!editingPrompt) return;
    setLoading(true);
    try {
      await promptsAIService.update(editingPrompt.id, editingPrompt);
      setPromptsAI(promptsAI.map(p => p.id === editingPrompt.id ? editingPrompt : p));
      setOpenPromptModal(false);
      globalSnack.show("Personalidad de la IA actualizada", "success");
    } catch (e: any) {
      globalSnack.show("Error: " + e.message, "error");
    } finally { setLoading(false); } // Eliminar el Snackbar local
  };

  const handleAddConocimiento = async () => {
    if (!nuevoConocimiento.titulo || !nuevoConocimiento.contenido) return;
    const guardado = await conocimientoService.create(nuevoConocimiento);
    setConocimiento([...conocimiento, guardado]);
    setNuevoConocimiento({ titulo: "", contenido: "", categoria: "operaciones" });
    setOpenConocimientoModal(false); // Usar el Snackbar global
    globalSnack.show("Conocimiento agregado al cerebro de la IA", "success");
  };

  const handleDeleteConocimiento = async (id: number) => {
    await conocimientoService.delete(id);
    setConocimiento(conocimiento.filter(c => c.id !== id)); // Usar el Snackbar global
    globalSnack.show("Conocimiento eliminado", "info");
  };

  // Componente de pestaña
  const TabButton = ({ id, label, icon }: { id: string; label: string; icon: React.ReactNode }) => (
    <Button
      variant={activeTab === id ? "contained" : "outlined"}
      startIcon={icon}
      onClick={() => setActiveTab(id)}
      sx={{ 
        borderRadius: 2,
        backgroundColor: activeTab === id ? BRAND.secondary : "transparent",
        borderColor: activeTab === id ? BRAND.secondary : "#e0e0e0",
        color: activeTab === id ? "white" : "#666",
        "&:hover": {
          backgroundColor: activeTab === id ? "#c2185b" : "#f5f5f5"
        }
      }}
    >
      {label}
    </Button>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Header compacto */}
      <Paper sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        mb: { xs: 1, sm: 1.5 }, 
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0d0e15' : '#e3f2fd', 
        borderLeft: "3px solid",
        borderColor: (theme) => theme.palette.mode === 'dark' ? '#e91e63' : '#2196f3',
        borderRadius: 2
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2 }, flexWrap: "wrap" }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <FiSettings size={24} color="#1976d2" />
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2", fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Configuración del Sistema
            </Typography>
          </Box>
          {dbStatus && (
            <Chip 
              icon={dbStatus.success ? <FiCheck /> : <FiAlertCircle />} 
              label={dbStatus.success ? "Conectado a Supabase" : "Error de Conexión"} 
              color={dbStatus.success ? "success" : "error"}
              variant="outlined"
              size="small"
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
          Personaliza tu CRM DESEO DIGITAL. Configura empresa, preferencias y seguridad.
        </Typography>
      </Paper>

      {/* Pestañas de navegación compactas */}
      <Paper sx={{ 
        p: { xs: 1, sm: 1.5 }, 
        mb: { xs: 1, sm: 1.5 }, 
        borderRadius: 2,
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#12131a' : '#fff',
        border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : 'none',
        boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 24px rgba(0,0,0,0.4)' : 1
      }}>
        <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1 }, flexWrap: "wrap" }}>
          <TabButton id="empresa" label="Empresa" icon={<FiUser size={16} />} />
          <TabButton id="preferencias" label="Preferencias" icon={<FiGlobe size={16} />} />
          <TabButton id="seguridad" label="Seguridad" icon={<FiShield size={16} />} />
          <TabButton id="campos" label="Campos y Estados" icon={<FiList size={16} />} />
          <TabButton id="cerebro" label="Cerebro & Activos" icon={<FiZap size={16} />} />
          <TabButton id="plantillas" label="Plantillas" icon={<FiPackage size={16} />} />
          <TabButton id="sop" label="Manual SOP" icon={<FiList size={16} />} />
          <TabButton id="backup" label="Backup" icon={<FiDatabase size={16} />} />
          <TabButton id="datos" label="Datos Reales" icon={<FiDatabase size={16} />} />
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          {(!dbStatus || !dbStatus.success) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error de conexión con Supabase. Verificá las variables de entorno.
            </Alert>
          )}
          {activeTab === "empresa" && (
            <EmpresaTab 
              config={empresaConfig}
              onChange={(updates: any) => setEmpresaConfig({ ...empresaConfig, ...updates })}
              onSave={handleSaveEmpresa}
              onLogoUpload={handleLogoUpload}
              loading={loading}
              logoInputRef={logoInputRef}
            />
          )}
          {activeTab === "preferencias" && (
            <ConfigTabPreferencias
              preferenciasConfig={preferenciasConfig}
              onChange={(updates: any) => setPreferenciasConfig({ ...preferenciasConfig, ...updates })}
            />
          )}
          {activeTab === "seguridad" && (
            <ConfigTabSeguridad
              passwordNuevo={seguridadConfig.passwordNuevo}
              onChangePassword={handleCambioPassword}
              loading={loading}
            />
          )}
          {activeTab === "cerebro" && (
            <CerebroAITab 
              reglasAI={reglasAI}
              onAddRegla={handleAddRegla}
              onDeleteRegla={handleDeleteRegla}
              promptsAI={promptsAI}
              onEditPrompt={(prompt: any) => {
                setEditingPrompt(prompt);
                setOpenPromptModal(true);
              }}
              conocimiento={conocimiento}
              onAddConocimiento={handleAddConocimiento}
              onDeleteConocimiento={handleDeleteConocimiento}
              onRefreshConocimiento={refreshConocimiento}
            />
          )}
          {activeTab === "plantillas" && (
            <ConfigTabPlantillas
              plantillasDocs={plantillasDocs}
              setPlantillasDocs={setPlantillasDocs}
              setEditingDocTemplateId={setEditingDocTemplateId}
              setDocTemplateForm={setDocTemplateForm}
              setOpenDocTemplateModal={setOpenDocTemplateModal}
            />
          )}
          {activeTab === "sop" && (
            <ConfigTabSop
              sops={sops}
              setSops={setSops}
              nuevoSop={nuevoSop}
              setNuevoSop={setNuevoSop}
              setOpenSopModal={setOpenSopModal}
              onAddSop={handleAddSop}
              onDeleteSop={handleDeleteSop}
            />
          )}
          {activeTab === "campos" && (
            <ConfigTabCampos
              catalogos={catalogos}
              setCatalogos={setCatalogos}
              nuevoItem={nuevoItem}
              setNuevoItem={setNuevoItem}
              handleSaveCatalogos={handleSaveCatalogos}
              handleAddItem={handleAddItem}
              handleDeleteItem={handleDeleteItem}
            />
          )}
          {activeTab === "backup" && (
            <ConfigTabBackup
              onBackup={handleBackup}
              onRestore={handleRestore}
            />
          )}
          {activeTab === "datos" && (
            <ConfigTabDatos
              dbStatus={dbStatus}
              loading={loading}
            />
          )}
        </>
      )}
    </Box>
  );
}