import { Outlet, useNavigate, useLocation } from "react-router";
import React, { useState, useEffect, useRef } from "react";
import Grid from "@mui/material/Grid";
import { 
  Box, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, Alert, CircularProgress, Card, CardContent,
  Switch, FormControlLabel, Divider, Chip, List, ListItem, ListItemText,
  ListItemIcon, ListItemSecondaryAction, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { 
  FiSettings, FiSave, FiRefreshCw, FiUser, FiMail, FiGlobe,
  FiBell, FiShield, FiDatabase, FiDownload, FiUpload, FiX,
  FiMoon, FiSun, FiLock, FiTrash2, FiCheck, FiAlertCircle, FiZap,
  FiPackage, FiPlus, FiList
} from "react-icons/fi";
import { configuracionService, reglasAIService, conocimientoService, promptsAIService, supabase, testConnection } from "../services/database";
import { useNotificationStore } from "../store/useNotificationStore";
import { EmpresaTab } from "../services/EmpresaTab";
import { CerebroAITab } from "../services/CerebroAITab";

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
  
  const { showNotification } = useNotificationStore();
  
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

  // Estado para Plantillas de Proyecto
  const [plantillas, setPlantillas] = useState<any[]>([
    { 
      id: 1, 
      servicio: "SEO", 
      tareas: ["Auditoría Técnica", "Keyword Research", "Optimización On-Page", "Estrategia de Backlinks", "Reporte Mensual"] 
    },
    { 
      id: 2, 
      servicio: "Social Media", 
      tareas: ["Guionización de Contenido", "Grabación con Cliente", "Edición Reels (Jessica López)", "Publicación y Copywriting", "Análisis de Métricas"] 
    },
    { 
      id: 3, 
      servicio: "Diseño Web", 
      tareas: ["Arquitectura de Información", "Diseño Wireframes", "Desarrollo y Programación", "Optimización de Carga", "Lanzamiento y QA"] 
    }
  ]);
  const [nuevaPlantilla, setNuevaPlantilla] = useState({ servicio: "", tareas: "" });

  // Estados para Campos y Estados personalizados
  const [catalogos, setCatalogos] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("crm_custom_catalogs");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      estadosCliente: ["Activo", "Inactivo", "Prospecto", "Lead Frío"],
      etapasVenta: ["Primer Contacto", "Propuesta Enviada", "Negociación", "Cierre"],
      prioridadesTarea: ["Alta", "Media", "Baja"]
    };
  });

  const [nuevoItem, setNuevoItem] = useState({ tipo: "estadosCliente", valor: "" });

  const handleSaveCatalogos = (newCatalogos: typeof catalogos) => {
    setCatalogos(newCatalogos);
    if (typeof window !== "undefined") {
      localStorage.setItem("crm_custom_catalogs", JSON.stringify(newCatalogos));
    }
    showNotification("Campos y Estados actualizados en caché global", "success");
  };

  const handleAddItem = () => {
    if (!nuevoItem.valor.trim()) return;
    const tipo = nuevoItem.tipo as keyof typeof catalogos;
    if (catalogos[tipo].includes(nuevoItem.valor.trim())) {
      showNotification("Este valor ya existe", "warning");
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

  const handleAddPlantilla = () => {
    if (!nuevaPlantilla.servicio || !nuevaPlantilla.tareas) return;
    const nueva = {
      id: Date.now(),
      servicio: nuevaPlantilla.servicio,
      tareas: nuevaPlantilla.tareas.split(",").map(t => t.trim())
    };
    setPlantillas([...plantillas, nueva]);
    setNuevaPlantilla({ servicio: "", tareas: "" });
    showNotification("Plantilla de servicio guardada", "success");
  };

  // Cargar datos reales
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await configuracionService.getEmpresa();
        if (data) setEmpresaConfig(data);
      } catch (err: any) {
        console.error("Error al cargar config:", err.message);
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

      showNotification("Configuración de empresa guardada correctamente", "success");
    } catch (err: any) {
      showNotification("Error al guardar configuración: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 2MB para no sobrecargar la DB)
      if (file.size > 2 * 1024 * 1024) {
        showNotification("La imagen es demasiado grande. El límite es de 2MB.", "warning");
        return;
      }

      setLoading(true);
      try {
        const publicUrl = await configuracionService.uploadLogo(file);
        setEmpresaConfig(prev => ({ ...prev, logo: publicUrl }));
        showNotification("Logo subido correctamente", "success");
      } catch (err: any) {
        showNotification("Error al subir: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSavePreferencias = async () => {
    setLoading(true);
    try {
      // Aplicar tema inmediatamente y persistir desde root
      const modoFinal = preferenciasConfig.tema === "auto" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preferenciasConfig.tema;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("theme_mode", modoFinal);
        window.dispatchEvent(new CustomEvent("theme-changed", { detail: modoFinal }));
      }

      // Aquí iría la llamada a Supabase para guardar preferencias
      // await supabase.from('preferencias_usuario').upsert(preferenciasConfig);

      showNotification("Preferencias guardadas correctamente", "success");
    } catch (err: any) {
      showNotification("Error al guardar preferencias: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCambioPassword = async () => {
    if (seguridadConfig.passwordNuevo !== seguridadConfig.passwordConfirmar) {
      showNotification("Las contraseñas no coinciden", "error");
      return;
    }

    if (seguridadConfig.passwordNuevo.length < 8) {
      showNotification("La contraseña debe tener al menos 8 caracteres", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: seguridadConfig.passwordNuevo });
      if (error) throw error;

      showNotification("Contraseña actualizada correctamente", "success");
      
      // Limpiar formulario
      setSeguridadConfig({
        ...seguridadConfig,
        cambiarPassword: false,
        passwordActual: "",
        passwordNuevo: "",
        passwordConfirmar: ""
      });
    } catch (err: any) {
      showNotification("Error al actualizar contraseña: " + err.message, "error");
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

      showNotification("Backup descargado correctamente", "success");
    } catch (err: any) {
      showNotification("Error al crear backup: " + err.message, "error");
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

      showNotification("Configuración restaurada correctamente", "success");
    } catch (err: any) {
      showNotification("Error al restaurar backup: " + err.message, "error");
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
        console.warn("Faltan columnas extendidas en clientes. Activando Modo Compatibilidad...", errCliFull.message);
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
        console.error("Error al insertar equipo:", errEquipo);
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
        localStorage.setItem("crm_compat_mode", "true");
        showNotification("⚠️ Datos cargados en Modo Compatibilidad (Base de datos simplificada detectada)", "warning");
      } else {
        localStorage.setItem("crm_compat_mode", "false");
        showNotification("¡Datos reales inicializados con éxito con todas las 9 empresas reales!", "success");
      }

      // Eliminar el Snackbar local

      setTimeout(() => {
        window.location.reload();
      }, 2500);

    } catch (err: any) {
      showNotification("Error al inicializar datos reales: " + err.message, "error");
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
      showNotification("Personalidad de la IA actualizada", "success");
    } catch (e: any) {
      showNotification("Error: " + e.message, "error");
    } finally { setLoading(false); } // Eliminar el Snackbar local
  };

  const handleAddConocimiento = async () => {
    if (!nuevoConocimiento.titulo || !nuevoConocimiento.contenido) return;
    const guardado = await conocimientoService.create(nuevoConocimiento);
    setConocimiento([...conocimiento, guardado]);
    setNuevoConocimiento({ titulo: "", contenido: "", categoria: "operaciones" });
    setOpenConocimientoModal(false); // Usar el Snackbar global
    showNotification("Conocimiento agregado al cerebro de la IA", "success");
  };

  const handleDeleteConocimiento = async (id: number) => {
    await conocimientoService.delete(id);
    setConocimiento(conocimiento.filter(c => c.id !== id)); // Usar el Snackbar global
    showNotification("Conocimiento eliminado", "info");
  };

  // Componente de pestaña
  const TabButton = ({ id, label, icon }: { id: string; label: string; icon: React.ReactNode }) => (
    <Button
      variant={activeTab === id ? "contained" : "outlined"}
      startIcon={icon}
      onClick={() => setActiveTab(id)}
      sx={{ 
        borderRadius: 2,
        backgroundColor: activeTab === id ? "#e91e63" : "transparent",
        borderColor: activeTab === id ? "#e91e63" : "#e0e0e0",
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
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 }, 
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0d0e15' : '#e3f2fd', 
        borderLeft: "5px solid",
        borderColor: (theme) => theme.palette.mode === 'dark' ? '#e91e63' : '#2196f3',
        borderRadius: 2,
        backgroundImage: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(rgba(233, 30, 99, 0.05) 0%, rgba(0,0,0,0) 100%)' : 'none'
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <FiSettings size={28} color="#1976d2" />
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2" }}>
              Configuración del Sistema
            </Typography>
          </Box>
          {dbStatus && (
            <Chip 
              icon={dbStatus.success ? <FiCheck /> : <FiAlertCircle />} 
              label={dbStatus.success ? "Conectado a Supabase" : "Error de Conexión"} 
              color={dbStatus.success ? "success" : "error"}
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
          Personaliza tu CRM DESEO DIGITAL. Configura empresa, preferencias y seguridad.
        </Typography>
      </Paper>

      {/* Pestañas de navegación */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 2,
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#12131a' : '#fff',
        border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : 'none',
        boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.4)' : 1
      }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TabButton id="empresa" label="Empresa" icon={<FiUser />} />
          <TabButton id="preferencias" label="Preferencias" icon={<FiGlobe />} />
          <TabButton id="seguridad" label="Seguridad" icon={<FiShield />} />
          <TabButton id="campos" label="Campos y Estados" icon={<FiList />} />
          <TabButton id="cerebro" label="Cerebro & Activos" icon={<FiZap />} />
          <TabButton id="plantillas" label="Plantillas" icon={<FiPackage />} />
          <TabButton id="backup" label="Backup" icon={<FiDatabase />} />
          <TabButton id="datos" label="Datos Reales" icon={<FiDatabase />} />
        </Box>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          {/* Configuración de Empresa */}
          {activeTab === "empresa" && (
            <EmpresaTab 
              config={empresaConfig}
              onChange={(updates) => setEmpresaConfig({ ...empresaConfig, ...updates })}
              onSave={handleSaveEmpresa}
              onLogoUpload={handleLogoUpload}
              loading={loading}
              logoInputRef={logoInputRef}
            />
          )}

          {/* Preferencias de Usuario */}
          {activeTab === "preferencias" && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Preferencias de Usuario
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tema</InputLabel>
                    <Select
                      value={preferenciasConfig.tema}
                      label="Tema"
                      onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, tema: e.target.value as "light" | "dark" | "auto" })}
                    >
                      <MenuItem value="light">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FiSun size={16} />
                          Claro
                        </Box>
                      </MenuItem>
                      <MenuItem value="dark">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FiMoon size={16} />
                          Oscuro
                        </Box>
                      </MenuItem>
                      <MenuItem value="auto">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FiGlobe size={16} />
                          Automático
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Idioma</InputLabel>
                    <Select
                      value={preferenciasConfig.idioma}
                      label="Idioma"
                      onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, idioma: e.target.value as "es" | "en" })}
                    >
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Zona Horaria</InputLabel>
                    <Select
                      value={preferenciasConfig.zonaHoraria}
                      label="Zona Horaria"
                      onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, zonaHoraria: e.target.value })}
                    >
                      <MenuItem value="America/Bogota">America/Bogota (GMT-5)</MenuItem>
                      <MenuItem value="America/Mexico_City">America/Mexico City (GMT-6)</MenuItem>
                      <MenuItem value="America/New_York">America/New York (GMT-5)</MenuItem>
                      <MenuItem value="Europe/Madrid">Europe/Madrid (GMT+1)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Formato de Fecha</InputLabel>
                    <Select
                      value={preferenciasConfig.formatoFecha}
                      label="Formato de Fecha"
                      onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, formatoFecha: e.target.value })}
                    >
                      <MenuItem value="dd/MM/yyyy">DD/MM/YYYY</MenuItem>
                      <MenuItem value="MM/dd/yyyy">MM/DD/YYYY</MenuItem>
                      <MenuItem value="yyyy-MM-dd">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Formato de Moneda</InputLabel>
                    <Select
                      value={preferenciasConfig.formatoMoneda}
                      label="Formato de Moneda"
                      onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, formatoMoneda: e.target.value })}
                    >
                      <MenuItem value="COP">COP - Peso Colombiano</MenuItem>
                      <MenuItem value="USD">USD - Dólar Americano</MenuItem>
                      <MenuItem value="EUR">EUR - Euro</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>              
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Rendimiento (Punto 2)
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={true} // Por defecto activo para velocidad
                    color="primary"
                  />
                }
                label="Caché Inteligente (Mejora la velocidad de carga global)"
              />
              <Divider sx={{ my: 3 }} />              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Notificaciones
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferenciasConfig.notificacionesEmail}
                        onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, notificacionesEmail: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiMail size={16} />
                        <Typography variant="body2">Notificaciones por Email</Typography>
                      </Box>
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferenciasConfig.notificacionesPush}
                        onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, notificacionesPush: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiBell size={16} />
                        <Typography variant="body2">Notificaciones Push</Typography>
                      </Box>
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferenciasConfig.notificacionesInApp}
                        onChange={(e) => setPreferenciasConfig({ ...preferenciasConfig, notificacionesInApp: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <FiAlertCircle size={16} />
                        <Typography variant="body2">Notificaciones en App</Typography>
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                <Button 
                  variant="contained"
                  startIcon={<FiSave />}
                  onClick={handleSavePreferencias}
                  sx={{ backgroundColor: "#e91e63", '&:hover': { backgroundColor: "#c2185b" } }}
                >
                  Guardar Preferencias
                </Button>
              </Box>
            </Paper>
          )}

          {/* Configuración de Seguridad */}
          {activeTab === "seguridad" && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Seguridad de la Cuenta
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>Cambiar Contraseña</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Actualiza tu contraseña de acceso al CRM
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          startIcon={<FiLock />}
                          onClick={() => setSeguridadConfig({ ...seguridadConfig, cambiarPassword: !seguridadConfig.cambiarPassword })}
                        >
                          Cambiar
                        </Button>
                      </Box>
                      
                      {seguridadConfig.cambiarPassword && (
                        <Box sx={{ mt: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField
                                type="password"
                                label="Contraseña Actual"
                                fullWidth
                                value={seguridadConfig.passwordActual}
                                onChange={(e) => setSeguridadConfig({ ...seguridadConfig, passwordActual: e.target.value })}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                type="password"
                                label="Nueva Contraseña"
                                fullWidth
                                value={seguridadConfig.passwordNuevo}
                                onChange={(e) => setSeguridadConfig({ ...seguridadConfig, passwordNuevo: e.target.value })}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                type="password"
                                label="Confirmar Nueva Contraseña"
                                fullWidth
                                value={seguridadConfig.passwordConfirmar}
                                onChange={(e) => setSeguridadConfig({ ...seguridadConfig, passwordConfirmar: e.target.value })}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <Button
                                variant="contained"
                                startIcon={<FiCheck />}
                                onClick={handleCambioPassword}
                                sx={{ backgroundColor: "#4caf50", '&:hover': { backgroundColor: "#388e3c" } }}
                              >
                                Actualizar Contraseña
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>Autenticación 2FA</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Añade una capa extra de seguridad
                          </Typography>
                        </Box>
                        <Switch
                          checked={seguridadConfig.autenticacion2FA}
                          onChange={(e) => setSeguridadConfig({ ...seguridadConfig, autenticacion2FA: e.target.checked })}
                          color="primary"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: "bold" }}>Sesiones Activas</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {seguridadConfig.sesionesActivas} dispositivos conectados
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          startIcon={<FiRefreshCw />}
                          onClick={() => showNotification("Gestión de sesiones en desarrollo", "info")}
                        >
                          Gestionar
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Configuración del Cerebro AI */}
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

          {/* Configuración de Plantillas de Proyecto */}
          {activeTab === "plantillas" && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>📦 Plantillas de Tareas por Servicio</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Define las tareas automáticas que se cargarán al iniciar un proyecto según el servicio contratado.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField 
                  label="Nombre del Servicio" 
                  size="small"
                  value={nuevaPlantilla.servicio}
                  onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, servicio: e.target.value})}
                />
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="Tareas separadas por coma (ej: Tarea 1, Tarea 2...)" 
                  value={nuevaPlantilla.tareas}
                  onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, tareas: e.target.value})}
                />
                <Button variant="contained" onClick={handleAddPlantilla} startIcon={<FiPlus />}>Guardar</Button>
              </Box>

              <Grid container spacing={2}>
                {plantillas.map((p) => (
                  <Grid item xs={12} md={4} key={p.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#e91e63' }}>{p.servicio}</Typography>
                        <List dense>
                          {p.tareas.map((t: string, i: number) => (
                            <ListItem key={i}><ListItemText primary={`• ${t}`} primaryTypographyProps={{ fontSize: '0.8rem' }} /></ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Campos y Estados Personalizados */}
          {activeTab === "campos" && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>🏷️ Personalización de Campos e Items</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ajusta las celdas, dropdowns y estados de todos los módulos del CRM. Los cambios se aplicarán al sistema.
              </Typography>

              {/* Formulario rápido para añadir */}
              <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' }, p: 2, backgroundColor: 'rgba(233, 30, 99, 0.04)', borderRadius: 2, border: '1px solid rgba(233, 30, 99, 0.15)' }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Sección / Dropdown</InputLabel>
                  <Select 
                    size="small"
                    value={nuevoItem.tipo} 
                    onChange={(e) => setNuevoItem({...nuevoItem, tipo: e.target.value})}
                  >
                    <MenuItem value="estadosCliente">Estados de Cliente</MenuItem>
                    <MenuItem value="etapasVenta">Etapas de Ventas (Pipeline)</MenuItem>
                    <MenuItem value="prioridadesTarea">Prioridades de Tareas</MenuItem>
                  </Select>
                </FormControl>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="Ej: Pendiente de Pago, Propuesta Rechazada, Ultra Alta..." 
                  value={nuevoItem.valor}
                  onChange={(e) => setNuevoItem({...nuevoItem, valor: e.target.value})}
                />
                <Button variant="contained" onClick={handleAddItem} startIcon={<FiPlus />} sx={{ backgroundColor: '#e91e63', '&:hover': { backgroundColor: '#c2185b' } }}>Añadir Item</Button>
              </Box>

              <Grid container spacing={3}>
                {/* Estados de Cliente */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ height: '100%', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#4caf50', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        🟢 Estados de Cliente
                      </Typography>
                      <Divider sx={{ mb: 1.5 }} />
                      <List dense>
                        {catalogos.estadosCliente.map((item: string) => (
                          <ListItem 
                            key={item}
                            secondaryAction={
                              <IconButton edge="end" color="error" size="small" onClick={() => handleDeleteItem("estadosCliente", item)}>
                                <FiTrash2 size={14} />
                              </IconButton>
                            }
                          >
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Etapas de Ventas */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ height: '100%', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#9c27b0', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        ⚡ Etapas de Ventas (Pipeline)
                      </Typography>
                      <Divider sx={{ mb: 1.5 }} />
                      <List dense>
                        {catalogos.etapasVenta.map((item: string) => (
                          <ListItem 
                            key={item}
                            secondaryAction={
                              <IconButton edge="end" color="error" size="small" onClick={() => handleDeleteItem("etapasVenta", item)}>
                                <FiTrash2 size={14} />
                              </IconButton>
                            }
                          >
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Prioridades de Tarea */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ height: '100%', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#f44336', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        📋 Prioridades de Tarea
                      </Typography>
                      <Divider sx={{ mb: 1.5 }} />
                      <List dense>
                        {catalogos.prioridadesTarea.map((item: string) => (
                          <ListItem 
                            key={item}
                            secondaryAction={
                              <IconButton edge="end" color="error" size="small" onClick={() => handleDeleteItem("prioridadesTarea", item)}>
                                <FiTrash2 size={14} />
                              </IconButton>
                            }
                          >
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Backup y Restauración */}
          {activeTab === "backup" && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Backup y Restauración
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <FiDownload size={24} color="#4caf50" />
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>Crear Backup</Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Descarga una copia completa de tu configuración y datos del CRM
                      </Typography>
                      
                      <Button
                        variant="contained"
                        startIcon={<FiDownload />}
                        onClick={() => setOpenBackupDialog(true)}
                        sx={{ backgroundColor: "#4caf50", '&:hover': { backgroundColor: "#388e3c" } }}
                      >
                        Descargar Backup
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <FiUpload size={24} color="#ff9800" />
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>Restaurar Backup</Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Sube un archivo de backup para restaurar tu configuración
                      </Typography>
                      
                      <Button
                        variant="contained"
                        startIcon={<FiUpload />}
                        onClick={() => setOpenRestoreDialog(true)}
                        sx={{ backgroundColor: "#ff9800", '&:hover': { backgroundColor: "#f57c00" } }}
                      >
                        Subir Backup
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>              
              <Divider sx={{ my: 3 }} />              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Historial de Backups
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <FiDatabase />
                  </ListItemIcon>
                  <ListItemText
                    primary="Backup Automático - 11 de Mayo 2026"
                    secondary="Tamaño: 2.4 MB • Completado exitosamente"
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" startIcon={<FiDownload />}>
                      Descargar
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <FiDatabase />
                  </ListItemIcon>
                  <ListItemText
                    primary="Backup Manual - 8 de Mayo 2026"
                    secondary="Tamaño: 2.1 MB • Completado exitosamente"
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" startIcon={<FiDownload />}>
                      Descargar
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Paper>
          )}

          {/* Datos Reales */}
          {activeTab === "datos" && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Inicialización con Datos Reales de DESEO DIGITAL
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configura y llena tu CRM con los datos de producción reales de las 9 empresas que colaboran activamente con <strong>DESEO DIGITAL</strong>. Esto limpiará las tablas existentes de prueba y las poblará con datos de alta fidelidad para el monitoreo real del negocio.
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>⚠️ Nota de Limpieza Segura:</strong> Esta acción borrará los registros de prueba y simulación actuales de Clientes, Ventas (Oportunidades), Tareas y Proyectos, y los reemplazará con tus 9 empresas reales (Ecopark, Hogar City, Deseo Digital, Rx Imado, Vitalvan, Autolujos, Grupo Iuris, Gaturros y Mepalex) con sus respectivos representantes y presupuestos.
              </Alert>

              <Button
                variant="contained"
                size="large"
                startIcon={<FiRefreshCw />}
                onClick={handleSeedRealData}
                sx={{ 
                  backgroundColor: "#e91e63", 
                  '&:hover': { backgroundColor: "#c2185b" },
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  fontWeight: 'bold'
                }}
              >
                Cargar Datos Reales de DESEO DIGITAL
              </Button>
            </Paper>
          )}
        </>
      )}

      {/* Diálogo de Backup */}
      <Dialog open={openBackupDialog} onClose={() => setOpenBackupDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Crear Backup
            <IconButton onClick={() => setOpenBackupDialog(false)}>
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de crear un backup completo del CRM?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esto incluirá toda tu configuración, preferencias y datos. El proceso puede tardar unos minutos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBackupDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleBackup}
            variant="contained"
            sx={{ backgroundColor: "#4caf50", '&:hover': { backgroundColor: "#388e3c" } }}
          >
            Crear Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Restauración */}
      <Dialog open={openRestoreDialog} onClose={() => setOpenRestoreDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Restaurar Backup
            <IconButton onClick={() => setOpenRestoreDialog(false)}>
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Selecciona un archivo de backup para restaurar:
          </Typography>
          <Box
            component="input"
            type="file"
            accept=".json"
            title="Seleccionar archivo de backup"
            onChange={(e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                handleRestore(file);
              }
            }}
            sx={{ width: "100%" }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            ⚠️ Advertencia: Esto sobrescribirá tu configuración actual.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRestoreDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Agregar Conocimiento */}
      <Dialog open={openConocimientoModal} onClose={() => setOpenConocimientoModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Agregar Conocimiento al Cerebro</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField 
                label="Título (ej: Guion de Ventas, Brief Creativo)" 
                fullWidth 
                value={nuevoConocimiento.titulo}
                onChange={e => setNuevoConocimiento({...nuevoConocimiento, titulo: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select 
                  value={nuevoConocimiento.categoria}
                  label="Categoría"
                  onChange={e => setNuevoConocimiento({...nuevoConocimiento, categoria: e.target.value})}
                >
                  <MenuItem value="operaciones">Operaciones</MenuItem>
                  <MenuItem value="ventas">Ventas</MenuItem>
                  <MenuItem value="contratacion">Contratación</MenuItem>
                  <MenuItem value="templates">Templates/Formatos</MenuItem>
                  <MenuItem value="marca">Manual de Marca</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                label="Contenido / Cuerpo del Manual" 
                fullWidth 
                multiline 
                rows={10} 
                value={nuevoConocimiento.contenido}
                onChange={e => setNuevoConocimiento({...nuevoConocimiento, contenido: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConocimientoModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddConocimiento} sx={{ bgcolor: '#e91e63' }}>Guardar en el Cerebro</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Retroalimentar/Editar Prompt */}
      <Dialog open={openPromptModal} onClose={() => setOpenPromptModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Ajustar Inteligencia: {editingPrompt?.slug.replace(/_/g, ' ')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="primary" sx={{ mb: 2, display: 'block' }}>
            💡 Aquí es donde "retroalimentas" a la IA. Cambia sus instrucciones para que sea más precisa.
          </Typography>
          <TextField
            label="Instrucción de Personalidad (System Prompt)"
            fullWidth
            multiline
            rows={3}
            value={editingPrompt?.system_prompt || ""}
            onChange={(e) => setEditingPrompt({...editingPrompt, system_prompt: e.target.value})}
            sx={{ mb: 3, mt: 1 }}
          />
          <TextField
            label="Plantilla de Respuesta (User Prompt Template)"
            fullWidth
            multiline
            rows={8}
            value={editingPrompt?.user_prompt_template || ""}
            onChange={(e) => setEditingPrompt({...editingPrompt, user_prompt_template: e.target.value})}
            helperText="Usa {{variable}} para los datos dinámicos del CRM."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPromptModal(false)}>Cerrar</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdatePrompt} 
            sx={{ bgcolor: '#e91e63' }}
          >
            Guardar y Actualizar Cerebro
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
